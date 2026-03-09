const comparisonEntries = [
  {
    id: 'shell-shift',
    type: 'modified',
    category: 'shell',
    title: 'Shell identity changed from Spatial Quasar to teaching lab.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    explanation: 'The older app opens with a fixed glass navigation bar and sidebar tabs, while the newer root app shifts to a hero-led teaching shell with compact status tools and module-first guidance.'
  },
  {
    id: 'theme-default',
    type: 'modified',
    category: 'styling',
    title: 'Theme bootstrap moved from dark-first to preference-aware light-first.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/app.js',
    newPath: 'app.js',
    explanation: 'The older app defaults to dark mode and flips a small icon switch; the newer app bootstraps from local storage and system preference with more descriptive controls.'
  },
  {
    id: 'welcome-guide',
    type: 'expanded',
    category: 'workflow',
    title: 'A quick-start guide and onboarding state were added.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    explanation: 'The newer version introduces a welcome strip, persisted onboarding completion, and module suggestions so first-time students land on the right workflow faster.'
  },
  {
    id: 'module-imports',
    type: 'expanded',
    category: 'workflow',
    title: 'Cross-module import actions now connect the calculators.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    explanation: 'Module I and Module III results can now feed Error Analysis directly, turning isolated tools into a guided exam-style sequence.'
  },
  {
    id: 'ieee-tab-removed',
    type: 'removed',
    category: 'modules',
    title: 'The dedicated IEEE-754 tab no longer appears in the newer shell.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/ui/ieee754UI.js',
    newPath: 'Not present in the root navigation',
    explanation: 'The older app exposes IEEE-754 as a top-level module, but the newer teaching-lab navigation concentrates on three course-facing modules instead.'
  },
  {
    id: 'css-consolidation',
    type: 'refactored',
    category: 'architecture',
    title: 'Split CSS files were consolidated into a single root stylesheet.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/css/*.css',
    newPath: 'styles.css',
    explanation: 'The older build separates variables, base, animations, layout, and components into multiple files; the root app flattens the visual system into one actively tuned stylesheet.'
  },
  {
    id: 'module-runtime',
    type: 'refactored',
    category: 'architecture',
    title: 'Module orchestration moved from many UI files to one large runtime.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/modules + js/ui',
    newPath: 'app.js',
    explanation: 'Instead of initializing several separate UI modules, the newer app centralizes state, onboarding, tabs, imports, traces, and rendering logic inside one orchestration file.'
  },
  {
    id: 'engine-split',
    type: 'added',
    category: 'architecture',
    title: 'Dedicated math engines were introduced at the root.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/modules',
    newPath: 'calc-engine.js, expression-engine.js, math-engine.js, math-display.js, poly-engine.js',
    explanation: 'The newer project surfaces specialized engine files so arithmetic, expression parsing, display logic, and polynomial handling have clearer technical boundaries.'
  },
  {
    id: 'trace-depth',
    type: 'expanded',
    category: 'workflow',
    title: 'Machine traces and exact-detail disclosures became stronger teaching tools.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    explanation: 'The newer app builds richer result stages, advanced tools, method details, and machine-trace openings directly into the teaching flow.'
  },
  {
    id: 'verification-tooling',
    type: 'added',
    category: 'project',
    title: 'Project-side documentation and deliverable tooling were added around the app.',
    oldPath: 'Older build folder only',
    newPath: 'docs/plans + scripts/build-deliverable.ps1 + output/',
    explanation: 'The root workspace now includes planning docs, deliverable scripts, and screenshot outputs, which signals a more mature build-and-review process.'
  },
  {
    id: 'tab-pattern',
    type: 'modified',
    category: 'shell',
    title: 'Navigation shifted from sidebar and bottom bar to hero-driven top tabs.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    explanation: 'The older shell uses a desktop sidebar and mobile bottom tabs, while the newer app treats the modules as the center of the landing page itself.'
  },
  {
    id: 'student-language',
    type: 'expanded',
    category: 'workflow',
    title: 'Result guidance now leans more explicitly toward student-facing interpretation.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    explanation: 'The newer version adds answer guides, verdict blocks, next-step prompts, and empty-state language that reads more like a teaching tool than a utility shell.'
  }
];

const storyGroups = [
  {
    title: 'Interface shell shifted from utility wrapper to guided landing surface.',
    label: 'Story 01',
    copy: 'The new app stops hiding its purpose behind a fixed utility frame and instead uses the opening screen to orient students before they calculate.',
    entryIds: ['shell-shift', 'tab-pattern', 'theme-default']
  },
  {
    title: 'Workflow depth replaced isolated tools with connected study moves.',
    label: 'Story 02',
    copy: 'Imports, next-step prompts, onboarding, and richer traces make the newer build feel like a teaching sequence rather than a set of separate tabs.',
    entryIds: ['welcome-guide', 'module-imports', 'trace-depth', 'student-language']
  },
  {
    title: 'The codebase flattened at the shell and deepened in the engines.',
    label: 'Story 03',
    copy: 'The newer app concentrates orchestration in one runtime while also naming deeper computational responsibilities more explicitly.',
    entryIds: ['css-consolidation', 'module-runtime', 'engine-split', 'verification-tooling']
  }
];

const architectureLens = {
  old: [
    'index.html with fixed nav and module panels',
    'css/variables.css, base.css, animations.css, layout.css, components.css',
    'js/modules for calculator, error analysis, polynomial, IEEE-754, and state',
    'js/ui files for per-module rendering and helpers'
  ],
  shifts: [
    'Navigation and onboarding moved closer to the learning workflow',
    'Styling responsibilities compressed into a single tuned stylesheet',
    'Runtime behavior centralized in app.js',
    'Computation engines surfaced as named root files'
  ],
  current: [
    'index.html with hero, quick guide, and top-level module tabs',
    'styles.css as the active visual system',
    'app.js as orchestration for onboarding, tabs, imports, and traces',
    'calc-engine.js, expression-engine.js, math-engine.js, math-display.js, poly-engine.js'
  ]
};

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  activeFilter: 'all',
  activeEntryId: comparisonEntries[0]?.id || null,
  countsAnimated: false,
  reducedMotion: reducedMotionQuery.matches
};

const elements = {
  summaryValues: document.querySelectorAll('[data-summary-value]'),
  filterButtons: document.querySelectorAll('[data-category-filter]'),
  changeList: document.querySelector('[data-change-list]'),
  evidenceDrawer: document.querySelector('[data-evidence-drawer]'),
  storyGrid: document.querySelector('[data-story-grid]'),
  architectureOld: document.querySelector('[data-architecture-old]'),
  architectureShifts: document.querySelector('[data-architecture-shifts]'),
  architectureNew: document.querySelector('[data-architecture-new]')
};

function renderSummary(entries) {
  return {
    added: entries.filter((entry) => entry.type === 'added').length,
    removed: entries.filter((entry) => entry.type === 'removed').length,
    modified: entries.filter((entry) => entry.type === 'modified').length,
    refactored: entries.filter((entry) => entry.type === 'refactored').length,
    expanded: entries.filter((entry) => entry.type === 'expanded').length
  };
}

function getVisibleEntries(entries, activeFilter) {
  if (activeFilter === 'all') {
    return entries;
  }
  return entries.filter((entry) => entry.type === activeFilter || entry.category === activeFilter);
}

function animateNumber(node, nextValue) {
  if (state.reducedMotion || state.countsAnimated) {
    node.textContent = String(nextValue);
    return;
  }

  const duration = 700;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    node.textContent = String(Math.round(nextValue * progress));
    if (progress < 1) {
      window.requestAnimationFrame(frame);
    }
  }

  window.requestAnimationFrame(frame);
}

function setActiveFilter(nextFilter) {
  state.activeFilter = nextFilter;
  renderAll();
}

function openEvidenceDrawer(entryId) {
  state.activeEntryId = entryId;
  elements.evidenceDrawer?.classList.add('is-open');
  renderAll();
}

function closeEvidenceDrawer() {
  elements.evidenceDrawer?.classList.remove('is-open');
}

function renderChangeList(entries, activeFilter) {
  const visibleEntries = getVisibleEntries(entries, activeFilter);

  if (!elements.changeList) {
    return visibleEntries;
  }

  if (visibleEntries.length === 0) {
    elements.changeList.innerHTML = `
      <li class="empty-panel empty-panel-inline">
        <p class="section-kicker">No matching change clusters</p>
        <h3>Try another filter to repopulate the evidence list.</h3>
      </li>
    `;
    state.activeEntryId = null;
    return visibleEntries;
  }

  if (!visibleEntries.some((entry) => entry.id === state.activeEntryId)) {
    state.activeEntryId = visibleEntries[0].id;
  }

  elements.changeList.innerHTML = visibleEntries.map((entry, index) => `
    <li class="change-row">
      <button class="change-row__button" type="button" data-entry-trigger="${entry.id}" aria-pressed="${String(entry.id === state.activeEntryId)}">
        <span class="change-row__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="change-row__body">
          <span class="change-row__type">${entry.type}</span>
          <strong>${entry.title}</strong>
          <span>${entry.explanation}</span>
        </span>
      </button>
    </li>
  `).join('');

  return visibleEntries;
}

function renderDrawer(entries) {
  if (!elements.evidenceDrawer) {
    return;
  }

  const activeEntry = entries.find((entry) => entry.id === state.activeEntryId);

  if (!activeEntry) {
    elements.evidenceDrawer.innerHTML = `
      <div class="empty-panel">
        <p class="section-kicker">No evidence selected</p>
        <h3>Choose a change cluster to inspect its mapped files.</h3>
      </div>
    `;
    return;
  }

  elements.evidenceDrawer.innerHTML = `
    <div class="evidence-panel__inner">
      <div class="evidence-panel__header">
        <div>
          <p class="section-kicker">Evidence view</p>
          <h3>${activeEntry.title}</h3>
        </div>
        <button class="drawer-dismiss" type="button" data-drawer-close aria-label="Collapse evidence view">Close</button>
      </div>
      <p class="evidence-copy">${activeEntry.explanation}</p>
      <dl class="evidence-list">
        <div>
          <dt>Change type</dt>
          <dd>${activeEntry.type}</dd>
        </div>
        <div>
          <dt>Old path</dt>
          <dd><code>${activeEntry.oldPath}</code></dd>
        </div>
        <div>
          <dt>New path</dt>
          <dd><code>${activeEntry.newPath}</code></dd>
        </div>
      </dl>
    </div>
  `;
}

function renderSummaryValues() {
  const summary = renderSummary(comparisonEntries);
  elements.summaryValues.forEach((node) => {
    const key = node.dataset.summaryValue;
    animateNumber(node, summary[key] || 0);
  });
  state.countsAnimated = true;
}

function renderFilters() {
  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.categoryFilter === state.activeFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderStories() {
  if (!elements.storyGrid) {
    return;
  }

  elements.storyGrid.innerHTML = storyGroups.map((story) => {
    const highlights = story.entryIds
      .map((entryId) => comparisonEntries.find((entry) => entry.id === entryId))
      .filter(Boolean)
      .map((entry) => `<li><span>${entry.type}</span><button type="button" data-story-entry="${entry.id}">${entry.title}</button></li>`)
      .join('');

    return `
      <article class="story-card">
        <p class="story-card__label">${story.label}</p>
        <h3>${story.title}</h3>
        <p>${story.copy}</p>
        <ul class="story-card__list">${highlights}</ul>
      </article>
    `;
  }).join('');
}

function renderArchitectureList(node, items) {
  if (!node) {
    return;
  }
  node.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function renderArchitectureLens() {
  renderArchitectureList(elements.architectureOld, architectureLens.old);
  renderArchitectureList(elements.architectureShifts, architectureLens.shifts);
  renderArchitectureList(elements.architectureNew, architectureLens.current);
}

function renderAll() {
  renderSummaryValues();
  renderFilters();
  renderStories();
  renderArchitectureLens();
  const visibleEntries = renderChangeList(comparisonEntries, state.activeFilter);
  renderDrawer(visibleEntries);
}

if (typeof reducedMotionQuery.addEventListener === 'function') {
  reducedMotionQuery.addEventListener('change', (event) => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  });
}

if (state.reducedMotion) {
  document.documentElement.classList.add('reduced-motion');
}

elements.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveFilter(button.dataset.categoryFilter || 'all');
  });
});

elements.changeList?.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-entry-trigger]');
  if (!trigger) {
    return;
  }
  openEvidenceDrawer(trigger.dataset.entryTrigger);
});

elements.storyGrid?.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-story-entry]');
  if (!trigger) {
    return;
  }
  openEvidenceDrawer(trigger.dataset.storyEntry);
});

elements.evidenceDrawer?.addEventListener('click', (event) => {
  const dismiss = event.target.closest('[data-drawer-close]');
  if (dismiss) {
    closeEvidenceDrawer();
  }
});

renderAll();
