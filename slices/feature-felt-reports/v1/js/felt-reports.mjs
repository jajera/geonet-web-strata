// feature-felt-reports@1
//
// Patches the server-rendered table in place rather than building markup in JS,
// so slots/body.html stays the single source of truth for the markup that will
// eventually be lifted into a GeoNet template.
//
// Live previews fetch from api.geonet.org.nz. Fixture previews read an inlined
// JSON payload instead, so states like "no reports" stay reproducible.

const MMI_LABELS = {
  3: 'Weak',
  4: 'Light',
  5: 'Moderate',
  6: 'Strong',
  7: 'Severe',
  8: 'Extreme',
};

// The home page excludes unnoticeable reports from its total, so we do too.
const REPORTABLE_MIN_MMI = 3;
const REPORTABLE_MAX_MMI = 8;

/**
 * The reported intensity feed is a GeoJSON FeatureCollection. Each feature is a
 * cluster of reports with its own count_mmi, and the collection repeats the
 * totals at the top level. Prefer the top-level rollup, fall back to summing.
 */
export function summarise(collection) {
  const counts = new Map();
  const add = (mmi, count) => {
    const level = Math.min(Math.max(Number(mmi), REPORTABLE_MIN_MMI), REPORTABLE_MAX_MMI);
    if (!Number.isFinite(level) || Number(mmi) < REPORTABLE_MIN_MMI) return;
    counts.set(level, (counts.get(level) ?? 0) + Number(count));
  };

  if (collection?.count_mmi && typeof collection.count_mmi === 'object') {
    for (const [mmi, count] of Object.entries(collection.count_mmi)) add(mmi, count);
  } else {
    for (const feature of collection?.features ?? []) {
      for (const [mmi, count] of Object.entries(feature?.properties?.count_mmi ?? {})) add(mmi, count);
    }
  }

  let total = 0;
  for (const count of counts.values()) total += count;

  const present = [...counts.entries()].filter(([, count]) => count > 0).map(([mmi]) => mmi);

  return {
    counts,
    total,
    locations: (collection?.features ?? []).length,
    strongest: present.length ? Math.max(...present) : null,
  };
}

function readFixture(sliceId) {
  const element = document.querySelector(`script[type="application/json"][data-strata-fixture="${sliceId}"]`);
  if (!element) return null;
  return JSON.parse(element.textContent);
}

async function fetchLive(endpoint) {
  const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.geo+json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function paint(root, summary) {
  for (const row of root.querySelectorAll('[data-mmi]')) {
    const mmi = Number(row.dataset.mmi);
    const count = summary.counts.get(mmi) ?? 0;
    row.querySelector('[data-felt-count]').textContent = String(count);
    row.classList.toggle('-empty', count === 0);
  }

  for (const cell of root.querySelectorAll('[data-felt-total]')) {
    cell.textContent = String(summary.total);
  }

  const locations = root.querySelector('[data-felt-locations]');
  if (locations) locations.textContent = String(summary.locations);

  const strongest = root.querySelector('[data-felt-strongest]');
  if (strongest) {
    strongest.textContent = summary.strongest
      ? `${MMI_LABELS[summary.strongest]} (MMI ${summary.strongest})`
      : 'None';
  }
}

function setStatus(root, text, state) {
  const status = root.querySelector('[data-felt-status]');
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

async function activate(root) {
  const sliceId = root.dataset.slice;
  const fixture = readFixture(sliceId);

  if (fixture) {
    const summary = summarise(fixture);
    paint(root, summary);
    setStatus(root, `Fixture data. ${summary.total} report${summary.total === 1 ? '' : 's'}.`, 'fixture');
    return;
  }

  try {
    const collection = await fetchLive(root.dataset.endpoint);
    const summary = summarise(collection);
    paint(root, summary);
    setStatus(
      root,
      summary.total === 0
        ? 'No felt reports in the last hour.'
        : `${summary.total} report${summary.total === 1 ? '' : 's'} from ${summary.locations} place${summary.locations === 1 ? '' : 's'}.`,
      'live',
    );
  } catch (error) {
    setStatus(root, `Could not load felt reports (${error.message}).`, 'error');
  }
}

for (const root of document.querySelectorAll('[data-felt-reports]')) {
  activate(root);
}
