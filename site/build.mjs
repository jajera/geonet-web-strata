// Static builder for geonet-web-strata.
//
// Resolves a composition (one pinned base + pinned features), validates the
// stack, then emits plain HTML/CSS/ESM that mirrors how beta.geonet.org.nz
// serves assets: content-hashed filenames under /assets and an import map for
// the ES modules.
//
// No framework. Node plus a YAML parser, nothing else.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slicesDir = join(root, 'slices');
const compositionsDir = join(root, 'compositions');
const distDir = join(root, 'site', 'dist');

// Project GitHub Pages live under /<repo>/; local previews leave this empty.
// Set via STRATA_BASE=/geonet-web-strata (no trailing slash) in CI.
const basePath = String(process.env.STRATA_BASE || process.env.BASE_PATH || '')
  .trim()
  .replace(/\/$/, '');
const withBase = (path) => `${basePath}${path.startsWith('/') ? path : `/${path}`}`;

class BuildError extends Error {}

function fail(message) {
  throw new BuildError(message);
}

const shortHash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const integrity = (buf) => `sha384-${createHash('sha384').update(buf).digest('base64')}`;

/**
 * Renders `{{name}}` placeholders and `{{slot name}}` mount points. Unmatched
 * placeholders are an error so a typo in a shell fails the build instead of
 * silently emitting an empty region.
 */
function render(template, vars, where) {
  return template.replace(/\{\{\s*(slot\s+)?([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, slotPrefix, name) => {
    const key = slotPrefix ? `slot:${name}` : name;
    if (!(key in vars)) fail(`${where}: unknown placeholder {{${slotPrefix ? `slot ${name}` : name}}}`);
    return vars[key];
  });
}

/** Version ranges are integers only, e.g. ">=1 <2". */
function satisfiesBaseRange(version, range) {
  return String(range)
    .trim()
    .split(/\s+/)
    .every((token) => {
      const match = /^(>=|<=|>|<|=)?(\d+)$/.exec(token);
      if (!match) fail(`unparseable base range token "${token}" in "${range}"`);
      const [, op = '=', target] = match;
      const n = Number(target);
      switch (op) {
        case '>=': return version >= n;
        case '<=': return version <= n;
        case '>': return version > n;
        case '<': return version < n;
        default: return version === n;
      }
    });
}

function parseRef(ref, where) {
  const match = /^([a-z0-9-]+)@(\d+)$/.exec(String(ref).trim());
  if (!match) fail(`${where}: expected "<slice-id>@<version>", got "${ref}"`);
  return { id: match[1], version: Number(match[2]) };
}

async function loadSlices() {
  const slices = new Map();
  for (const id of await readdir(slicesDir)) {
    const sliceRoot = join(slicesDir, id);
    for (const versionDir of await readdir(sliceRoot)) {
      const match = /^v(\d+)$/.exec(versionDir);
      if (!match) continue;
      const dir = join(sliceRoot, versionDir);
      const manifestPath = join(dir, 'slice.yaml');
      if (!existsSync(manifestPath)) fail(`${relative(root, dir)}: missing slice.yaml`);

      const manifest = parseYaml(await readFile(manifestPath, 'utf8'));
      const version = Number(match[1]);
      if (manifest.id !== id) fail(`${relative(root, manifestPath)}: id "${manifest.id}" does not match directory "${id}"`);
      if (manifest.version !== version) fail(`${relative(root, manifestPath)}: version ${manifest.version} does not match directory "${versionDir}"`);
      if (manifest.kind !== 'base' && manifest.kind !== 'feature') fail(`${relative(root, manifestPath)}: kind must be "base" or "feature"`);

      slices.set(`${id}@${version}`, { ...manifest, dir });
    }
  }
  return slices;
}

async function loadCompositions() {
  const compositions = [];
  for (const name of await readdir(compositionsDir)) {
    const stackPath = join(compositionsDir, name, 'stack.yaml');
    if (!existsSync(stackPath)) continue;
    const stack = parseYaml(await readFile(stackPath, 'utf8'));
    if (stack.name !== name) fail(`${relative(root, stackPath)}: name "${stack.name}" does not match directory "${name}"`);
    compositions.push({ ...stack, dir: join(compositionsDir, name) });
  }
  return compositions.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A feature entry is either a bare ref, or an object that can move the slice to
 * a different slot and override its config:
 *
 *   - feature-felt-reports@1
 *   - slice: feature-volcano-val@1
 *     at: sidebar                  # shorthand, single-slot slices only
 *   - slice: feature-news@1
 *     at: { body: bandAfter }      # explicit slot remap
 *     config: { count: 4 }
 */
function normaliseEntry(entry, where) {
  if (typeof entry === 'string') return { ref: entry, at: null, config: {}, omit: [] };
  if (!entry || typeof entry !== 'object') fail(`${where}: unreadable feature entry ${JSON.stringify(entry)}`);
  if (!entry.slice) fail(`${where}: feature entry needs a "slice" key, got ${JSON.stringify(entry)}`);
  const omit = entry.omit ?? [];
  if (!Array.isArray(omit)) fail(`${where}: ${entry.slice} "omit" must be a list of slot names`);
  return { ref: entry.slice, at: entry.at ?? null, config: entry.config ?? {}, omit };
}

/** Resolves the feature's own slot map through the composition's `at` override. */
function resolveMounts(feature, at, omit, baseSlots, where, label) {
  const declared = Object.entries(feature.slots ?? {});
  if (declared.length === 0) fail(`slices/${feature.id}/v${feature.version}/slice.yaml: features must declare at least one slot`);

  for (const slot of omit) {
    if (!(slot in (feature.slots ?? {}))) {
      fail(`${where}: ${label} has no slot "${slot}" to omit; it fills ${declared.map(([name]) => name).join(', ')}`);
    }
  }

  const kept = declared.filter(([slot]) => !omit.includes(slot));
  if (kept.length === 0) fail(`${where}: ${label} omits every slot; remove the feature instead`);

  let remap = {};
  if (typeof at === 'string') {
    if (kept.length !== 1) {
      const names = kept.map(([slot]) => slot).join(', ');
      fail(`${where}: ${label} fills more than one slot (${names}), so "at" must name each one, e.g. at: { ${kept[0][0]}: ${at} }`);
    }
    remap = { [kept[0][0]]: at };
  } else if (at && typeof at === 'object') {
    for (const from of Object.keys(at)) {
      if (!(from in (feature.slots ?? {}))) {
        fail(`${where}: ${label} has no slot "${from}" to move; it fills ${declared.map(([slot]) => slot).join(', ')}`);
      }
      if (omit.includes(from)) {
        fail(`${where}: ${label} cannot move omitted slot "${from}"`);
      }
    }
    remap = at;
  } else if (at !== null) {
    fail(`${where}: ${label} "at" must be a slot name or a map of slot names`);
  }

  return kept.map(([slot, file]) => {
    const target = remap[slot] ?? slot;
    if (!baseSlots.has(target)) {
      fail(`${where}: ${label} mounts into slot "${target}" which the base does not provide (${[...baseSlots].join(', ')})`);
    }
    return { slot: target, file };
  });
}

/** Slice defaults, overridden by the composition. Unknown keys are a typo. */
function resolveConfig(feature, overrides, where, label) {
  const defaults = feature.config ?? {};
  for (const key of Object.keys(overrides)) {
    if (!(key in defaults)) {
      const known = Object.keys(defaults);
      fail(
        `${where}: ${label} has no config key "${key}"` +
          (known.length ? `; it declares ${known.join(', ')}` : '; it declares no config'),
      );
    }
  }
  return { ...defaults, ...overrides };
}

function resolveStack(stack, slices) {
  const where = `compositions/${stack.name}/stack.yaml`;

  const baseRef = parseRef(stack.base, where);
  const base = slices.get(`${baseRef.id}@${baseRef.version}`);
  if (!base) fail(`${where}: base ${stack.base} not found`);
  if (base.kind !== 'base') fail(`${where}: ${stack.base} is a ${base.kind}, not a base`);

  const baseSlots = new Set(base.slots ?? []);
  const features = (stack.features ?? []).map((rawEntry) => {
    const entry = normaliseEntry(rawEntry, where);
    const ref = parseRef(entry.ref, where);
    const feature = slices.get(`${ref.id}@${ref.version}`);
    if (!feature) fail(`${where}: feature ${entry.ref} not found`);
    if (feature.kind !== 'feature') fail(`${where}: ${entry.ref} is a ${feature.kind}, not a feature`);

    // An illegal stack must fail the build, not render a broken preview.
    if (!feature.requiresBase) fail(`slices/${ref.id}/v${ref.version}/slice.yaml: features must declare requiresBase`);
    if (!satisfiesBaseRange(baseRef.version, feature.requiresBase)) {
      fail(`${where}: ${entry.ref} requires base ${feature.requiresBase} but the composition pins ${stack.base}`);
    }

    return {
      ...feature,
      ref: entry.ref,
      mounts: resolveMounts(feature, entry.at, entry.omit, baseSlots, where, entry.ref),
      resolvedConfig: resolveConfig(feature, entry.config, where, entry.ref),
    };
  });

  return { base, features };
}

/** Copies an asset under /assets with a beta-style content hash prefix. */
async function emitBytes(bytes, basename, kind, seen) {
  const name = `${shortHash(bytes)}-${basename}`;
  const urlPath = withBase(posix.join('/assets', kind, name));
  if (!seen.has(urlPath)) {
    const target = join(distDir, 'assets', kind, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    seen.set(urlPath, integrity(bytes));
  }
  return { urlPath, integrity: seen.get(urlPath) };
}

async function emitAsset(sourcePath, kind, seen) {
  return emitBytes(await readFile(sourcePath), posix.basename(sourcePath), kind, seen);
}

/** Same-origin copy of a beta module. Cross-origin ESM is blocked by CORS. */
async function emitRemoteAsset(url, kind, seen) {
  const response = await fetch(url);
  if (!response.ok) fail(`could not fetch ${url}: ${response.status} ${response.statusText}`);
  let bytes = Buffer.from(await response.arrayBuffer());
  // Remote modules keep root-relative /assets/… paths that only resolve on beta.
  // Rewrite them so basemap icons and similar still load from a kit preview.
  if (kind === 'js') {
    const text = bytes
      .toString('utf8')
      .replace(/(["'`])\/assets\//g, `$1https://beta.geonet.org.nz/assets/`);
    bytes = Buffer.from(text, 'utf8');
  }
  // Beta's filenames already start with beta's own content hash; drop it so we
  // do not end up with two hashes stacked in front of one name.
  const basename = posix.basename(new URL(url).pathname).replace(/^[0-9a-f]{8}-/, '');
  return emitBytes(bytes, basename, kind, seen);
}

function remoteSpecifier(urlPath) {
  return posix.basename(urlPath).replace(/^[0-9a-f]{8}-/, '');
}

async function collectAssets(slicesInStack, seen) {
  const styles = [];
  const modules = [];
  const classicScripts = [];
  // Beta stylesheets are linked from origin rather than vendored, because those
  // packages are marked private. Each slice declares the ones it needs: the base
  // brings the design system and page frame, a feature brings the component CSS
  // its markup relies on (e.g. card-volcano.css).
  const remoteStyles = [];
  for (const slice of slicesInStack) {
    for (const url of slice.remoteCss ?? []) {
      if (!remoteStyles.includes(url)) remoteStyles.push(url);
    }
    for (const href of slice.css ?? []) {
      styles.push(await emitAsset(join(slice.dir, href), 'css', seen));
    }
    for (const src of slice.js ?? []) {
      const asset = await emitAsset(join(slice.dir, src), 'js', seen);
      modules.push({ ...asset, specifier: posix.basename(src), entry: true });
    }
    // remoteImports: on the import map only (dependencies of an entry module).
    // remoteJs: import map + a <script type="module"> tag (the entry point).
    for (const url of slice.remoteImports ?? []) {
      const asset = await emitRemoteAsset(url, 'js', seen);
      const specifier = remoteSpecifier(asset.urlPath);
      if (!modules.some((module) => module.specifier === specifier)) {
        modules.push({ ...asset, specifier, entry: false });
      }
    }
    for (const url of slice.remoteJs ?? []) {
      const asset = await emitRemoteAsset(url, 'js', seen);
      const specifier = remoteSpecifier(asset.urlPath);
      const existing = modules.find((module) => module.specifier === specifier);
      if (existing) existing.entry = true;
      else modules.push({ ...asset, specifier, entry: true });
    }
    // Classic scripts (e.g. maplibre-gl) must load before the ES modules that
    // expect a global.
    for (const url of slice.remoteScripts ?? []) {
      const asset = await emitRemoteAsset(url, 'js', seen);
      if (!classicScripts.some((script) => script.urlPath === asset.urlPath)) {
        classicScripts.push(asset);
      }
    }
  }
  return { styles, remoteStyles, modules, classicScripts };
}

function renderStyleTags(styles, remoteStyles, useDesignSystem) {
  const external = useDesignSystem
    ? remoteStyles.map((href) => `<link rel="stylesheet" href="${href}">`)
    : [];
  const local = styles.map(
    (asset) => `<link rel="stylesheet" href="${asset.urlPath}" integrity="${asset.integrity}" crossorigin="anonymous">`,
  );
  return [...external, ...local].join('\n    ');
}

function renderImportMap(modules) {
  if (modules.length === 0) return '';
  const map = {
    imports: Object.fromEntries(modules.map((m) => [m.specifier, m.urlPath])),
    integrity: Object.fromEntries(modules.map((m) => [m.urlPath, m.integrity])),
  };
  return `<script type="importmap">\n${JSON.stringify(map, null, 2)}\n    </script>`;
}

function renderClassicScriptTags(scripts) {
  return scripts
    .map((s) => `<script src="${s.urlPath}" integrity="${s.integrity}" crossorigin="anonymous"></script>`)
    .join('\n    ');
}

function renderModuleTags(modules) {
  return modules
    .filter((m) => m.entry !== false)
    .map((m) => `<script type="module" src="${m.urlPath}" integrity="${m.integrity}" crossorigin="anonymous"></script>`)
    .join('\n    ');
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

async function readFixture(feature, state) {
  const path = join(feature.dir, 'fixtures', `${state}.json`);
  if (!existsSync(path)) {
    fail(`slices/${feature.id}/v${feature.version}: composition requests state "${state}" but fixtures/${state}.json is missing`);
  }
  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * Fixture payloads are inlined as JSON so a state preview renders without any
 * network call. Live previews leave the element out and the module fetches.
 */
function renderFixtureScript(payloads) {
  return Object.entries(payloads)
    .map(
      ([sliceId, payload]) =>
        `<script type="application/json" data-strata-fixture="${sliceId}">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ');
}

async function buildComposition(stack, slices, seen) {
  const { base, features } = resolveStack(stack, slices);
  const stackLabel = [stack.base, ...features.map((feature) => feature.ref)];
  const { styles, remoteStyles, modules, classicScripts } = await collectAssets([base, ...features], seen);
  const shellPath = join(base.dir, base.shell ?? 'shell.html');
  if (!existsSync(shellPath)) fail(`slices/${base.id}/v${base.version}: shell ${base.shell} not found`);
  const shell = await readFile(shellPath, 'utf8');

  const slotFragments = new Map((base.slots ?? []).map((slot) => [slot, []]));
  for (const feature of features) {
    // Config values are scalars only. Anything needing branching belongs in a
    // data attribute plus CSS, not in a template language grown here.
    const configVars = Object.fromEntries(
      Object.entries(feature.resolvedConfig).map(([key, value]) => [`config.${key}`, escapeHtml(value)]),
    );

    for (const { slot, file } of feature.mounts) {
      const fragmentPath = join(feature.dir, file);
      if (!existsSync(fragmentPath)) fail(`slices/${feature.id}/v${feature.version}: slot fragment ${file} not found`);
      const fragment = await readFile(fragmentPath, 'utf8');
      slotFragments
        .get(slot)
        .push(render(fragment, configVars, `slices/${feature.id}/v${feature.version}/${file}`).trim());
    }
  }

  const dataMode = stack.data?.mode ?? 'live';
  // Optional default fixture inlined on the live target when live data cannot be
  // fetched from the kit (e.g. a host with no CORS). State directories still win.
  const previewState = stack.data?.preview ?? null;
  const states = stack.data?.states ?? [];
  const targets = [{ state: null, outDir: join(distDir, 'c', stack.name) }];
  for (const state of states) {
    targets.push({ state, outDir: join(distDir, 'c', stack.name, state) });
  }

  for (const target of targets) {
    const payloads = {};
    const fixtureState = target.state ?? previewState;
    if (fixtureState) {
      for (const feature of features) {
        if (feature.fixtures !== false) payloads[feature.id] = await readFixture(feature, fixtureState);
      }
    }

    const vars = {
      title: escapeHtml(stack.title ?? stack.name),
      composition: escapeHtml(stack.name),
      stack: escapeHtml(stackLabel.join(' + ')),
      dataMode: target.state
        ? `fixture:${target.state}`
        : previewState
          ? `fixture:${previewState}`
          : dataMode,
      styles: renderStyleTags(styles, remoteStyles, stack.theme?.designSystem !== 'none'),
      importmap: renderImportMap(modules),
      scripts: renderClassicScriptTags(classicScripts),
      modules: renderModuleTags(modules),
      fixtures: Object.keys(payloads).length ? renderFixtureScript(payloads) : '',
    };
    for (const [slot, fragments] of slotFragments) {
      vars[`slot:${slot}`] = fragments.join('\n');
    }

    const html = render(shell, vars, `slices/${base.id}/v${base.version}/${base.shell}`);
    await mkdir(target.outDir, { recursive: true });
    await writeFile(join(target.outDir, 'index.html'), html);
  }

  // Static assets a slice ships verbatim, e.g. fixtures fetched at runtime.
  for (const slice of [base, ...features]) {
    const publicDir = join(slice.dir, 'public');
    if (existsSync(publicDir)) await cp(publicDir, distDir, { recursive: true });
  }

  return { name: stack.name, title: stack.title ?? stack.name, stack: stackLabel, states, dataMode, spec: stack.spec ?? null, summary: stack.summary ?? '', remoteStyles };
}

/** Small markdown subset used by our specs. Not a general-purpose renderer. */
function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let inCode = false;
  let code = [];
  let inUl = false;
  let inTable = false;

  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
    }
  };

  const inline = (text) =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="link" href="$2">$1</a>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      code.push(line);
      i += 1;
      continue;
    }

    if (line.startsWith('|') && line.includes('|', 1)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const isSep = cells.every((c) => /^:?-+:?$/.test(c));
      if (!inTable && !isSep) {
        closeLists();
        out.push('<table class="geonet-table -plain"><thead><tr>');
        out.push(cells.map((c) => `<th class="theader">${inline(c)}</th>`).join(''));
        out.push('</tr></thead><tbody>');
        inTable = true;
        i += 1;
        continue;
      }
      if (isSep) {
        i += 1;
        continue;
      }
      out.push(`<tr class="trow">${cells.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
      i += 1;
      continue;
    }

    if (/^[-*] \[([ xX])\] /.test(line)) {
      closeLists();
      const checked = /^- \[([xX])\] /.test(line) || /^\* \[([xX])\] /.test(line);
      const text = line.replace(/^[-*] \[[ xX]\] /, '');
      out.push(`<p class="task"><input type="checkbox" disabled${checked ? ' checked' : ''}> ${inline(text)}</p>`);
      i += 1;
      continue;
    }

    if (/^[-*] /.test(line)) {
      if (!inUl) {
        closeLists();
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*] /, ''))}</li>`);
      i += 1;
      continue;
    }

    closeLists();

    if (line.startsWith('# ')) {
      out.push(`<h1 class="title">${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h2 class="title">${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      out.push(`<h3 class="title">${inline(line.slice(4))}</h3>`);
    } else if (line.trim() === '') {
      // skip
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
    i += 1;
  }
  closeLists();
  if (inCode) out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return out.join('\n');
}

async function emitSpecs(built, styles) {
  const specsDir = join(root, '.kiro', 'specs');
  const pages = ['requirements', 'design', 'tasks'];

  for (const composition of built) {
    if (!composition.spec) continue;
    const sourceDir = join(specsDir, composition.spec);
    if (!existsSync(sourceDir)) {
      fail(`compositions/${composition.name}/stack.yaml: spec "${composition.spec}" not found under .kiro/specs/`);
    }

    const outDir = join(distDir, 'specs', composition.spec);
    await mkdir(outDir, { recursive: true });

    const links = pages
      .map((page) => {
        const path = join(sourceDir, `${page}.md`);
        if (!existsSync(path)) fail(`.kiro/specs/${composition.spec}/${page}.md is missing`);
        return page;
      })
      .map((page) => `<a class="link" href="${withBase(`/specs/${composition.spec}/${page}.html`)}">${page}</a>`)
      .join(' &middot; ');

    for (const page of pages) {
      const md = await readFile(join(sourceDir, `${page}.md`), 'utf8');
      const html = `<!doctype html>
<html lang="en-NZ">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(composition.spec)} · ${page}</title>
    ${styles}
</head>
<body class="strata-index strata-spec">
    <main class="layout-container">
      <p class="crumb"><a class="link" href="${withBase('/')}">Compositions</a> &middot; <a class="link" href="${withBase(`/c/${composition.name}/`)}">Preview</a> &middot; ${links}</p>
      <article class="spec">
${renderMarkdown(md)}
      </article>
    </main>
</body>
</html>
`;
      await writeFile(join(outDir, `${page}.html`), html);
    }

    await writeFile(
      join(outDir, 'index.html'),
      `<!doctype html>
<html lang="en-NZ">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=requirements.html">
    <title>${escapeHtml(composition.spec)}</title>
</head>
<body>
    <p><a href="requirements.html">Requirements</a></p>
</body>
</html>
`,
    );
  }
}

function renderIndex(built, styles) {
  const card = (composition) => {
    const stateLinks = composition.states
      .map((state) => `<a class="link" href="${withBase(`/c/${composition.name}/${state}/`)}">${escapeHtml(state)}</a>`)
      .join(' &middot; ');
    const specLink = composition.spec
      ? ` &middot; <a class="link" href="${withBase(`/specs/${composition.spec}/`)}">Spec</a>`
      : '';
    const summary = composition.summary
      ? `<p class="summary">${escapeHtml(String(composition.summary).trim())}</p>`
      : '';
    return `      <li class="item">
        <a class="title" href="${withBase(`/c/${composition.name}/`)}">${escapeHtml(composition.title)}</a>
        <code class="stack">${escapeHtml(composition.stack.join(' + '))}</code>
        ${summary}
        <p class="states"><a class="link" href="${withBase(`/c/${composition.name}/`)}">Preview</a>${specLink}${stateLinks ? ` &middot; fixtures: ${stateLinks}` : ''}</p>
      </li>`;
  };

  const shells = built.filter((c) => c.stack.length === 1);
  const features = built.filter((c) => c.stack.length > 1);

  const section = (heading, items) =>
    items.length === 0
      ? ''
      : `      <h2 class="title">${heading}</h2>
      <ul class="list">
${items.map(card).join('\n')}
      </ul>`;

  return `<!doctype html>
<html lang="en-NZ">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>geonet-web-strata compositions</title>
    ${styles}
</head>
<body class="strata-index">
    <main class="layout-container">
      <h1 class="title">Compositions</h1>
      <p class="lead">Each composition pins exact slice versions. The preview URL is the review artifact. Specs bind to a composition, never to "latest".</p>
${section('Shell', shells)}
${section('Features', features)}
    </main>
</body>
</html>
`;
}

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const slices = await loadSlices();
  const compositions = await loadCompositions();
  if (compositions.length === 0) fail('no compositions found under compositions/');

  const seen = new Map();
  const built = [];
  for (const stack of compositions) {
    built.push(await buildComposition(stack, slices, seen));
  }

  // The index and the spec pages are kit chrome, so they take every stylesheet
  // any composition asked for rather than resolving a stack of their own.
  const indexStyles = renderStyleTags(
    [...seen.entries()]
      .filter(([urlPath]) => urlPath.includes('/assets/css/'))
      .map(([urlPath, hash]) => ({ urlPath, integrity: hash })),
    [...new Set(built.flatMap((composition) => composition.remoteStyles))],
    true,
  );
  await writeFile(join(distDir, 'index.html'), renderIndex(built, indexStyles));
  await emitSpecs(built, indexStyles);
  // GitHub Pages runs Jekyll by default; this keeps underscore paths like .kiro out of trouble.
  await writeFile(join(distDir, '.nojekyll'), '');

  if (basePath) console.log(`base path:    ${basePath}`);
  console.log(`slices:       ${slices.size}`);
  console.log(`compositions: ${built.length}`);
  for (const composition of built) {
    const states = composition.states.length ? ` (+${composition.states.join(', ')})` : '';
    const spec = composition.spec ? `  spec:${composition.spec}` : '';
    console.log(`  /c/${composition.name}/${states}  ${composition.stack.join(' + ')}${spec}`);
  }
  console.log(`output:       ${relative(root, distDir)}`);
}

main().catch((error) => {
  if (error instanceof BuildError) {
    console.error(`build failed: ${error.message}`);
    process.exit(1);
  }
  throw error;
});
