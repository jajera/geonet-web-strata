// feature-volcano-val@1
//
// Patches the server-rendered cards in place. Every GeoNet volcano already has
// a card in slots/body.html, because the list of volcanoes is fixed and the
// display names and type tags are not in the API. This module only fills in
// what the feed knows: alert level and activity summary.
//
// Live previews fetch from api.geonet.org.nz. Fixture previews read an inlined
// JSON payload instead, so an eruption-level state stays reproducible.

const MAX_LEVEL = 5;

/** Level wording GeoNet uses when the feed has no activity text of its own. */
const LEVEL_FALLBACK = {
  0: 'No volcanic unrest.',
  1: 'Minor volcanic unrest.',
  2: 'Moderate to heightened volcanic unrest.',
  3: 'Minor volcanic eruption.',
  4: 'Moderate volcanic eruption.',
  5: 'Major volcanic eruption.',
};

/**
 * The feed is a GeoJSON FeatureCollection, one feature per volcano, keyed by
 * `volcanoID`. Returns a map so a card can look itself up, plus the highest
 * level seen, which is what the status line leads with.
 */
export function summarise(collection) {
  const byId = new Map();
  for (const feature of collection?.features ?? []) {
    const properties = feature?.properties ?? {};
    if (!properties.volcanoID) continue;
    const level = Math.min(Math.max(Number(properties.level) || 0, 0), MAX_LEVEL);
    byId.set(properties.volcanoID, {
      level,
      activity: properties.activity || LEVEL_FALLBACK[level],
      acc: properties.acc ?? null,
    });
  }

  const levels = [...byId.values()].map((entry) => entry.level);
  return {
    byId,
    highest: levels.length ? Math.max(...levels) : 0,
    raised: levels.filter((level) => level > 0).length,
    total: byId.size,
  };
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
  const showAll = root.dataset.show === 'all';

  for (const card of root.querySelectorAll('[data-val-card]')) {
    const entry = summary.byId.get(card.dataset.volcano);

    // A volcano the feed did not mention keeps its placeholder rather than
    // claiming level 0, which would be a statement about a hazard we cannot back.
    if (!entry) {
      card.classList.toggle('-hidden', !showAll);
      continue;
    }

    const number = card.querySelector('[data-val-number]');
    number.className = `number card-val -level-${entry.level}`;

    const level = card.querySelector('[data-val-level]');
    level.textContent = String(entry.level);
    level.setAttribute('value', String(entry.level));

    card.querySelector('[data-val-activity]').textContent = entry.activity;
    card.dataset.level = String(entry.level);
    card.classList.toggle('-hidden', !showAll && entry.level === 0);
  }

  // GeoNet leads with the volcanoes that are doing something. A Go template
  // would sort server-side; here the cards are already in the DOM, so this
  // reorders existing nodes rather than rendering new ones.
  const list = root.querySelector('[data-val-list]');
  const cards = [...list.querySelectorAll('[data-val-card]')];
  cards
    .sort((a, b) => Number(b.dataset.level ?? 0) - Number(a.dataset.level ?? 0))
    .forEach((card) => list.append(card));
}

function setStatus(root, text, state) {
  const status = root.querySelector('[data-val-status]');
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}

function describe(summary, showAll) {
  if (summary.total === 0) return 'No volcanic alert levels published.';
  if (summary.raised === 0) {
    return `All ${summary.total} volcanoes are at alert level 0.`;
  }
  const raised = `${summary.raised} volcano${summary.raised === 1 ? '' : 'es'} above alert level 0, highest level ${summary.highest}`;
  return showAll ? `${raised}. Showing all ${summary.total}.` : `${raised}.`;
}

async function activate(root) {
  const showAll = root.dataset.show === 'all';
  const fixture = readFixture(root.dataset.slice);

  if (fixture) {
    const summary = summarise(fixture);
    paint(root, summary);
    setStatus(root, `Fixture data. ${describe(summary, showAll)}`, 'fixture');
    return;
  }

  try {
    const summary = summarise(await fetchLive(root.dataset.endpoint));
    paint(root, summary);
    setStatus(root, describe(summary, showAll), 'live');
  } catch (error) {
    setStatus(root, `Could not load volcanic alert levels (${error.message}).`, 'error');
  }
}

for (const root of document.querySelectorAll('[data-volcano-val]')) {
  activate(root);
}
