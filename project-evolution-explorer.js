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

const state = {
  activeFilter: 'all',
  activeEntryId: comparisonEntries[0]?.id || null
};

const elements = {
  summaryValues: document.querySelectorAll('[data-summary-value]'),
  filterButtons: document.querySelectorAll('[data-category-filter]'),
  changeList: document.querySelector('[data-change-list]'),
  evidenceDrawer: document.querySelector('[data-evidence-drawer]')
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

function renderChangeList(entries, activeFilter) {
  const visibleEntries = getVisibleEntries(entries, activeFilter);

  if (!elements.changeList) {
    return visibleEntries;
  }

  elements.changeList.innerHTML = '';

  visibleEntries.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'change-row';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'change-row__button';
    button.dataset.entryId = entry.id;
    button.setAttribute('aria-pressed', String(entry.id === state.activeEntryId));

    button.innerHTML = `
      <span class="change-row__index">${String(index + 1).padStart(2, '0')}</span>
      <span class="change-row__body">
        <span class="change-row__type">${entry.type}</span>
        <strong>${entry.title}</strong>
        <span>${entry.explanation}</span>
      </span>
    `;

    button.addEventListener('click', () => {
      state.activeEntryId = entry.id;
      renderAll();
    });

    item.appendChild(button);
    elements.changeList.appendChild(item);
  });

  if (!visibleEntries.some((entry) => entry.id === state.activeEntryId)) {
    state.activeEntryId = visibleEntries[0]?.id || null;
  }

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
      <p class="section-kicker">Evidence view</p>
      <h3>${activeEntry.title}</h3>
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
    node.textContent = String(summary[key] || 0);
  });
}

function renderFilters() {
  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.categoryFilter === state.activeFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderAll() {
  renderSummaryValues();
  renderFilters();
  const visibleEntries = renderChangeList(comparisonEntries, state.activeFilter);
  renderDrawer(visibleEntries);
}

elements.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.activeFilter = button.dataset.categoryFilter || 'all';
    renderAll();
  });
});

renderAll();
