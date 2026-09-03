// feature-quake-counts@1
//
// Patches the server-rendered table in place. The quake feed returns more than
// an hour of history, so aggregation always filters to a one-hour window and
// drops deleted events, matching the beta home page.
//
// Live previews use Date.now() as the end of the window. Fixture previews pin
// the end of the window just after the newest feature in the payload, so a
// fixture stays reviewable months later without rewriting timestamps.

const MMI_LABELS = {
  3: 'Weak',
  4: 'Light',
  5: 'Moderate',
  6: 'Strong',
  7: 'Severe',
  8: 'Extreme',
};

const REPORTABLE_MIN_MMI = 3;
const REPORTABLE_MAX_MMI = 8;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Count quakes in the last hour by MMI. MMI 9+ folds into Extreme; below 3 and
 * `quality: deleted` are excluded. `now` is the end of the hour window.
 */
export function summarise(collection, { now = Date.now() } = {}) {
  const counts = new Map();
  const start = now - WINDOW_MS;
  let total = 0;

  for (const feature of collection?.features ?? []) {
    const properties = feature?.properties ?? {};
    if (properties.quality === 'deleted') continue;

    const time = Date.parse(properties.time);
    if (!Number.isFinite(time) || time < start || time > now) continue;

    const raw = Number(properties.mmi);
    if (!Number.isFinite(raw) || raw < REPORTABLE_MIN_MMI) continue;
    const level = Math.min(Math.max(Math.round(raw), REPORTABLE_MIN_MMI), REPORTABLE_MAX_MMI);
    counts.set(level, (counts.get(level) ?? 0) + 1);
    total += 1;
  }

  const present = [...counts.entries()].filter(([, count]) => count > 0).map(([mmi]) => mmi);

  return {
    counts,
    total,
    strongest: present.length ? Math.max(...present) : null,
  };
}

/** End of the hour window for a fixture: just after its newest event. */
export function fixtureNow(collection) {
  let newest = 0;
  for (const feature of collection?.features ?? []) {
    const time = Date.parse(feature?.properties?.time);
    if (Number.isFinite(time) && time > newest) newest = time;
  }
  return newest ? newest + 1 : Date.now();
}

function readFixture(sliceId) {
  const element = document.querySelector(`script[type="application/json"][data-strata-fixture="${sliceId}"]`);
  if (!element) return null;
  return JSON.parse(element.textContent);
}

async function fetchLive(endpoint) {
  const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.geo+json;version=2' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function paint(root, summary) {
  for (const row of root.querySelectorAll('[data-mmi]')) {
    const mmi = Number(row.dataset.mmi);
    const count = summary.counts.get(mmi) ?? 0;
    row.querySelector('[data-quake-count]').textContent = String(count);
    row.classList.toggle('-empty', count === 0);
  }

  for (const cell of root.querySelectorAll('[data-quake-total]')) {
    cell.textContent = String(summary.total);
  }

  const strongest = root.querySelector('[data-quake-strongest]');
  if (strongest) {
    strongest.textContent = summary.strongest
      ? `${MMI_LABELS[summary.strongest]} (MMI ${summary.strongest})`
      : 'None';
  }
}

function setStatus(root, text, state) {
  const status = root.querySelector('[data-quake-status]');
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

async function activate(root) {
  const fixture = readFixture(root.dataset.slice);

  if (fixture) {
    const summary = summarise(fixture, { now: fixtureNow(fixture) });
    paint(root, summary);
    setStatus(
      root,
      summary.total === 0
        ? 'Fixture data. No quakes in the last hour.'
        : `Fixture data. ${summary.total} quake${summary.total === 1 ? '' : 's'}.`,
      'fixture',
    );
    return;
  }

  try {
    const summary = summarise(await fetchLive(root.dataset.endpoint));
    paint(root, summary);
    setStatus(
      root,
      summary.total === 0
        ? 'No quakes of intensity Weak or above in the last hour.'
        : `${summary.total} quake${summary.total === 1 ? '' : 's'} in the last hour.`,
      'live',
    );
  } catch (error) {
    setStatus(root, `Could not load quakes (${error.message}).`, 'error');
  }
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-quake-counts]')) {
    activate(root);
  }
}
