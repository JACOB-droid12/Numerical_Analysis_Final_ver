const comparisonEntries = [
  {
    id: 'shell-shift',
    type: 'modified',
    theme: 'shell',
    title: 'The landing surface stopped behaving like a utility wrapper.',
    summary: 'The old build opens like a contained calculator shell. The newer root build starts with a stronger landing surface, guidance, and orientation.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    insight: 'This is the front-door change: the app now performs onboarding and context work before the user even enters a tool.'
  },
  {
    id: 'theme-bootstrap',
    type: 'modified',
    theme: 'shell',
    title: 'Theme behavior became part of runtime boot logic.',
    summary: 'A small default-theme posture turned into a more deliberate preference bootstrap that syncs stored choice with the interface.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/app.js',
    newPath: 'app.js',
    insight: 'The newer runtime treats theme as a product state, not a tiny decorative toggle.'
  },
  {
    id: 'welcome-guide',
    type: 'expanded',
    theme: 'workflow',
    title: 'A guided first-run path was added for students.',
    summary: 'The new root app adds onboarding memory, suggested entry points, and clearer routes into the main work.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    insight: 'This shifts the product from "tool you already understand" to "system that helps you start correctly."'
  },
  {
    id: 'module-imports',
    type: 'expanded',
    theme: 'workflow',
    title: 'Module results now flow into each other more directly.',
    summary: 'Cross-module import paths let one module feed another, especially into Error Analysis.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    insight: 'The newer build feels more exam-like because the modules can now chain together instead of living in isolation.'
  },
  {
    id: 'ieee-tab-removed',
    type: 'removed',
    theme: 'surface',
    title: 'The top-level IEEE-754 destination was removed from the newer shell.',
    summary: 'The protected older build exposes IEEE-754 as a first-class route, while the newer root app narrows the front-door module set.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/ui/ieee754UI.js',
    newPath: 'Not present in root navigation',
    insight: 'The release surface is more focused, even while the overall teaching workflow became broader elsewhere.'
  },
  {
    id: 'css-consolidation',
    type: 'refactored',
    theme: 'architecture',
    title: 'Split CSS layers were collapsed into one active stylesheet.',
    summary: 'Variables, layout, animation, and components once lived across several files. The newer build compresses that surface into one stylesheet.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/css/*.css',
    newPath: 'styles.css',
    insight: 'The new shell trades file granularity for a tighter, continuously tuned visual system.'
  },
  {
    id: 'module-runtime',
    type: 'refactored',
    theme: 'architecture',
    title: 'UI orchestration concentrated into one runtime file.',
    summary: 'Tabs, onboarding, imports, traces, and state transitions now center more heavily in app.js.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/modules + js/ui',
    newPath: 'app.js',
    insight: 'The orchestration layer flattened while the computational layers became easier to name and isolate.'
  },
  {
    id: 'engine-split',
    type: 'added',
    theme: 'architecture',
    title: 'Named engine files were promoted to the repo root.',
    summary: 'Arithmetic, parsing, display formatting, and polynomial logic now show up as explicit engine files instead of staying buried in a shared modules folder.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/js/modules',
    newPath: 'calc-engine.js, expression-engine.js, math-engine.js, math-display.js, poly-engine.js',
    insight: 'The internal system gained sharper names at the same time the surface layer consolidated.'
  },
  {
    id: 'trace-depth',
    type: 'expanded',
    theme: 'workflow',
    title: 'Detailed traces and advanced views became part of the expected rhythm.',
    summary: 'Method traces and deeper inspection moved into the normal post-result flow instead of feeling optional.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    insight: 'The newer build leans harder into teaching and explanation rather than output alone.'
  },
  {
    id: 'verification-tooling',
    type: 'added',
    theme: 'project',
    title: 'Docs, output artifacts, and delivery tooling appeared around the app.',
    summary: 'Screenshots, plans, deliverable scripts, and packaged outputs now exist around the main experience.',
    oldPath: 'Older build folder only',
    newPath: 'docs/plans + scripts/build-deliverable.ps1 + output/',
    insight: 'The workspace itself now shows a fuller review and shipping workflow around the product.'
  },
  {
    id: 'tab-pattern',
    type: 'modified',
    theme: 'shell',
    title: 'Navigation moved out of the perimeter and into the page body.',
    summary: 'The old shell relies on a sidebar and mobile bottom rail. The newer build turns modules into a central page-level surface.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    insight: 'The newer layout does more narrative work itself and feels less like a frame around isolated tools.'
  },
  {
    id: 'student-language',
    type: 'expanded',
    theme: 'workflow',
    title: 'Result interpretation reads more like teaching guidance.',
    summary: 'Answer guides, verdicts, next-step prompts, and empty-state copy help students interpret what the result means.',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html + app.js',
    insight: 'The product voice matured from calculator output toward instructional support.'
  }
];

const proofModules = [
  {
    id: 'surface-growth',
    label: 'Surface growth',
    title: 'The public-facing experience widened beyond a compact module shell.',
    metricLabel: 'Signals',
    count: comparisonEntries.filter((entry) => entry.type === 'expanded' || entry.type === 'modified').length,
    body: 'Landing guidance, module chaining, result interpretation, and stronger entry flows made the newer build feel more like a teaching product than a single-purpose utility.'
  },
  {
    id: 'route-removals',
    label: 'Focused removals',
    title: 'Some routes narrowed even as the overall product grew.',
    metricLabel: 'Removed',
    count: comparisonEntries.filter((entry) => entry.type === 'removed').length,
    body: 'The front-door module surface became more selective, especially around older top-level destinations that no longer anchor the main navigation.'
  },
  {
    id: 'structure-rewire',
    label: 'Structural rewiring',
    title: 'The shell flattened while orchestration concentrated inward.',
    metricLabel: 'Refactors',
    count: comparisonEntries.filter((entry) => entry.type === 'refactored').length,
    body: 'CSS and runtime responsibilities compressed into fewer top-level files, turning the shell into a more unified release surface.'
  },
  {
    id: 'engine-clarity',
    label: 'Engine clarity',
    title: 'Deeper math responsibilities became easier to name and reason about.',
    metricLabel: 'Engine files',
    count: 5,
    body: 'Explicit root engine files expose the product’s internal layers more cleanly than the older shared module structure.'
  }
];

const capabilityStories = [
  {
    id: 'story-shell',
    label: 'Story stack 01',
    title: 'The shell became a release surface instead of a passive wrapper.',
    body: 'The landing page now performs orientation, guidance, and state setup. That is a product move, not just a layout move.',
    entryIds: ['shell-shift', 'theme-bootstrap', 'tab-pattern']
  },
  {
    id: 'story-workflow',
    label: 'Story stack 02',
    title: 'The workflow deepened enough that tools now reinforce each other.',
    body: 'Imports, traces, onboarding, and teaching language made the newer build feel orchestrated rather than merely grouped.',
    entryIds: ['welcome-guide', 'module-imports', 'trace-depth', 'student-language']
  },
  {
    id: 'story-architecture',
    label: 'Story stack 03',
    title: 'The repo surface flattened while the internal engines became more explicit.',
    body: 'This is the structural inversion at the heart of the release: fewer shell files on top, clearer computational boundaries underneath.',
    entryIds: ['css-consolidation', 'module-runtime', 'engine-split', 'verification-tooling']
  }
];

function buildSummaryMetrics(entries) {
  return {
    added: entries.filter((entry) => entry.type === 'added').length,
    removed: entries.filter((entry) => entry.type === 'removed').length,
    modified: entries.filter((entry) => entry.type === 'modified').length,
    refactored: entries.filter((entry) => entry.type === 'refactored').length,
    expanded: entries.filter((entry) => entry.type === 'expanded').length
  };
}

function buildArchitectureGroups() {
  return {
    old: [
      'index.html with sidebar and mobile rail navigation',
      'css/variables.css, base.css, animations.css, layout.css, components.css',
      'js/modules for calculator, errors, polynomial, IEEE-754, and state',
      'js/ui files for per-module rendering and helpers'
    ],
    shifts: [
      'Landing orientation moved into the page body itself',
      'Styling collapsed from a file family into one living stylesheet',
      'Tabs, onboarding, traces, and imports converged harder in app.js',
      'Engine boundaries became visible as named root files'
    ],
    current: [
      'index.html with guide strip and broader landing surface',
      'styles.css as the active visual system',
      'app.js as orchestration for tabs, onboarding, imports, and traces',
      'calc-engine.js, expression-engine.js, math-engine.js, math-display.js, poly-engine.js'
    ]
  };
}

const state = {
  activeFilter: 'all',
  activeEntryId: comparisonEntries[0]?.id ?? null,
  countsAnimated: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

const elements = {
  loadingState: document.querySelector('[data-loading-state]'),
  errorState: document.querySelector('[data-error-state]'),
  summaryValues: document.querySelectorAll('[data-summary-value]'),
  proofGrid: document.querySelector('[data-proof-grid]'),
  filterBar: document.querySelector('[data-filter-bar]'),
  filterButtons: document.querySelectorAll('[data-category-filter]'),
  changeList: document.querySelector('[data-change-list]'),
  emptyState: document.querySelector('[data-empty-state]'),
  evidenceDrawer: document.querySelector('[data-evidence-drawer]'),
  capabilityGrid: document.querySelector('[data-capability-grid]'),
  architectureOld: document.querySelector('[data-architecture-old]'),
  architectureShifts: document.querySelector('[data-architecture-shifts]'),
  architectureNew: document.querySelector('[data-architecture-new]'),
  engineMesh: document.querySelector('[data-engine-mesh]'),
  scrollButtons: document.querySelectorAll('[data-scroll-target]')
};

function animateNumber(node, nextValue) {
  if (state.reducedMotion || state.countsAnimated) {
    node.textContent = String(nextValue);
    return;
  }

  const start = performance.now();
  const duration = 880;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    node.textContent = String(Math.round(nextValue * eased));
    if (progress < 1) {
      window.requestAnimationFrame(frame);
    }
  }

  window.requestAnimationFrame(frame);
}

function getVisibleEntries() {
  if (state.activeFilter === 'all') {
    return comparisonEntries;
  }

  return comparisonEntries.filter((entry) => entry.type === state.activeFilter || entry.theme === state.activeFilter);
}

function renderSummary() {
  const summary = buildSummaryMetrics(comparisonEntries);
  elements.summaryValues.forEach((node) => {
    const key = node.dataset.summaryValue;
    animateNumber(node, summary[key] ?? 0);
  });
  state.countsAnimated = true;
}

function renderProofBand() {
  if (!elements.proofGrid) {
    return;
  }

  elements.proofGrid.innerHTML = proofModules.map((module, index) => `
    <article class="proof-card" style="--proof-scale:${0.38 + index * 0.16}" data-reveal>
      <p class="proof-card__meta">${module.label}</p>
      <p class="proof-card__count">${module.count}</p>
      <p class="proof-card__meta">${module.metricLabel}</p>
      <h3>${module.title}</h3>
      <p>${module.body}</p>
    </article>
  `).join('');
}

function renderFilters() {
  elements.filterButtons.forEach((button) => {
    const active = button.dataset.categoryFilter === state.activeFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderChangeExplorer() {
  const visibleEntries = getVisibleEntries();
  if (!elements.changeList || !elements.emptyState) {
    return;
  }

  elements.emptyState.hidden = visibleEntries.length > 0;

  if (visibleEntries.length === 0) {
    elements.changeList.innerHTML = '';
    state.activeEntryId = null;
    syncEvidenceDrawer();
    return;
  }

  if (!visibleEntries.some((entry) => entry.id === state.activeEntryId)) {
    state.activeEntryId = visibleEntries[0].id;
  }

  elements.changeList.innerHTML = visibleEntries.map((entry) => {
    const active = entry.id === state.activeEntryId;
    return `
      <li class="change-entry ${active ? 'is-active' : ''}">
        <button class="change-entry__button" type="button" data-entry-id="${entry.id}">
          <div class="change-meta">
            <span class="change-type">${entry.type}</span>
            <span>${entry.theme}</span>
          </div>
          <h3>${entry.title}</h3>
          <p class="change-copy">${entry.summary}</p>
        </button>
      </li>
    `;
  }).join('');

  elements.changeList.querySelectorAll('[data-entry-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeEntryId = button.dataset.entryId;
      renderChangeExplorer();
      syncEvidenceDrawer();
    });
  });

  syncEvidenceDrawer();
}

function syncEvidenceDrawer() {
  if (!elements.evidenceDrawer) {
    return;
  }

  const entry = comparisonEntries.find((item) => item.id === state.activeEntryId);
  if (!entry) {
    elements.evidenceDrawer.innerHTML = `
      <div class="drawer-panel">
        <p class="drawer-kicker">Evidence drawer</p>
        <h3>No active record</h3>
        <p class="drawer-summary">Choose a change record or capability story to inspect its exact path evidence.</p>
      </div>
    `;
    return;
  }

  elements.evidenceDrawer.innerHTML = `
    <div class="drawer-panel">
      <div class="drawer-panel__header">
        <div>
          <p class="drawer-kicker">Evidence drawer</p>
          <h3>${entry.title}</h3>
        </div>
        <button type="button" class="drawer-close">Clear focus</button>
      </div>
      <p class="drawer-summary">${entry.summary}</p>
      <div class="drawer-paths">
        <article>
          <span>Older path</span>
          <p class="evidence-path">${entry.oldPath}</p>
        </article>
        <article>
          <span>Newer path</span>
          <p class="evidence-path">${entry.newPath}</p>
        </article>
      </div>
      <p class="drawer-summary drawer-insight">${entry.insight}</p>
    </div>
  `;

  elements.evidenceDrawer.querySelector('.drawer-close')?.addEventListener('click', () => {
    state.activeFilter = 'all';
    state.activeEntryId = comparisonEntries[0]?.id ?? null;
    renderFilters();
    renderChangeExplorer();
  });
}

function renderCapabilityStories() {
  if (!elements.capabilityGrid) {
    return;
  }

  elements.capabilityGrid.innerHTML = capabilityStories.map((story) => {
    const buttons = story.entryIds.map((entryId) => {
      const entry = comparisonEntries.find((item) => item.id === entryId);
      if (!entry) {
        return '';
      }
      return `
        <button type="button" class="story-card__button" data-story-entry="${entry.id}">
          <strong>${entry.title}</strong>
          <span>${entry.type}</span>
        </button>
      `;
    }).join('');

    return `
      <article class="story-card" data-reveal>
        <p class="story-card__label">${story.label}</p>
        <h3>${story.title}</h3>
        <p>${story.body}</p>
        <div class="story-card__list">${buttons}</div>
      </article>
    `;
  }).join('');

  elements.capabilityGrid.querySelectorAll('[data-story-entry]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeEntryId = button.dataset.storyEntry;
      renderChangeExplorer();
      syncEvidenceDrawer();
      elements.evidenceDrawer?.scrollIntoView({ behavior: state.reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  });
}

function renderArchitectureLens() {
  const architecture = buildArchitectureGroups();
  const mappings = [
    [elements.architectureOld, architecture.old],
    [elements.architectureShifts, architecture.shifts],
    [elements.architectureNew, architecture.current]
  ];

  mappings.forEach(([node, values]) => {
    if (!node) {
      return;
    }
    node.innerHTML = values.map((value) => `<li>${value}</li>`).join('');
  });
}

function renderEngineMesh() {
  if (!elements.engineMesh) {
    return;
  }

  const nodes = comparisonEntries.slice(0, 6);
  const positions = [
    { top: 16, left: 58 },
    { top: 26, left: 18 },
    { top: 38, left: 62 },
    { top: 52, left: 12 },
    { top: 66, left: 56 },
    { top: 76, left: 26 }
  ];

  const links = [
    { top: 24, left: 30, width: 210, rotation: -14 },
    { top: 42, left: 22, width: 250, rotation: 12 },
    { top: 58, left: 24, width: 220, rotation: -10 },
    { top: 70, left: 34, width: 180, rotation: 8 }
  ];

  elements.engineMesh.innerHTML = `
    ${links.map((link) => `<span class="engine-link" style="top:${link.top}%; left:${link.left}%; width:${link.width}px; transform: rotate(${link.rotation}deg);"></span>`).join('')}
    ${nodes.map((entry, index) => {
      const pos = positions[index];
      return `
        <article class="engine-node" style="top:${pos.top}%; left:${pos.left}%; --duration:${7 + index}s; --delay:${index * 0.6}s;">
          <span>${entry.type}</span>
          <strong>${entry.title}</strong>
        </article>
      `;
    }).join('')}
  `;
}

function applyRevealStates() {
  const nodes = document.querySelectorAll('[data-reveal]');
  nodes.forEach((node, index) => {
    node.style.setProperty('--delay', `${Math.min(index, 12) * 85}ms`);
    if (state.reducedMotion) {
      node.classList.add('is-visible');
      return;
    }
    window.setTimeout(() => {
      node.classList.add('is-visible');
    }, 90 + index * 70);
  });
}

function setActiveFilter(nextFilter) {
  state.activeFilter = nextFilter;
  renderFilters();
  renderChangeExplorer();
}

function bindFilterBar() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveFilter(button.dataset.categoryFilter);
    });
  });
}

function bindScrollButtons() {
  elements.scrollButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: state.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
}

function showError(message) {
  if (!elements.errorState) {
    return;
  }
  elements.errorState.hidden = false;
  elements.errorState.textContent = message;
}

function boot() {
  try {
    renderSummary();
    renderProofBand();
    renderFilters();
    renderChangeExplorer();
    renderCapabilityStories();
    renderArchitectureLens();
    renderEngineMesh();
    bindFilterBar();
    bindScrollButtons();
    applyRevealStates();
    window.setTimeout(() => {
      document.body.classList.add('is-ready');
    }, state.reducedMotion ? 0 : 420);
  } catch (error) {
    showError(error instanceof Error ? error.message : 'The explorer failed to initialize.');
    document.body.classList.add('is-ready');
    throw error;
  }
}

boot();
