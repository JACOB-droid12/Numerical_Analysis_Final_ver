# Sidebar Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the horizontal tab bar and masthead tools with a collapsible left sidebar using CSS Grid, decluttering the main content area.

**Architecture:** Restructure `app-shell` as a CSS Grid with two columns (sidebar + main content). The sidebar contains module navigation, status strip, settings, and catalog. A `data-sidebar` attribute on `app-shell` drives expanded/collapsed state via CSS. Mobile uses an overlay drawer.

**Tech Stack:** Vanilla HTML, CSS (Grid + transitions), JavaScript (no dependencies)

---

### Task 1: Add sidebar HTML structure to index.html

**Files:**
- Modify: `index.html:37-111` (app-shell opening, masthead, tab nav)

**Step 1: Add sidebar element after app-shell opening tag**

Replace the current `<nav class="tabs tabs-home" ...>` block (lines 94-111) and relocate the masthead tools. The new structure inside `<main class="app-shell" data-sidebar="expanded">`:

```html
<aside class="sidebar" aria-label="Navigation">
  <button id="sidebar-toggle" type="button" class="sidebar-toggle" aria-label="Collapse sidebar" title="Collapse sidebar">
    <span class="sidebar-toggle-icon">«</span>
  </button>

  <nav class="sidebar-nav" aria-label="Core modules" role="tablist">
    <button id="tab-btn-basic" type="button" class="sidebar-nav-item active" data-tab="basic" role="tab" aria-selected="true" aria-controls="tab-basic" tabindex="0">
      <span class="sidebar-icon">∑</span>
      <span class="sidebar-label">Calculation</span>
    </button>
    <button id="tab-btn-error" type="button" class="sidebar-nav-item" data-tab="error" role="tab" aria-selected="false" aria-controls="tab-error" tabindex="-1">
      <span class="sidebar-icon">Δ</span>
      <span class="sidebar-label">Errors</span>
    </button>
    <button id="tab-btn-poly" type="button" class="sidebar-nav-item" data-tab="poly" role="tab" aria-selected="false" aria-controls="tab-poly" tabindex="-1">
      <span class="sidebar-icon">f(x)</span>
      <span class="sidebar-label">Polynomial</span>
    </button>
    <button id="tab-btn-tutorial" type="button" class="sidebar-nav-item" data-tab="tutorial" role="tab" aria-selected="false" aria-controls="tab-tutorial" tabindex="-1">
      <span class="sidebar-icon">?</span>
      <span class="sidebar-label">Tutorial</span>
    </button>
  </nav>

  <hr class="sidebar-divider">

  <div class="sidebar-tools">
    <div class="sidebar-status" aria-label="Calculator status">
      <div class="status-chip"><span class="status-name">Angle</span><strong id="status-angle">DEG</strong></div>
      <div class="status-chip"><span class="status-name">Display</span><strong id="status-display">RECT</strong></div>
      <div class="status-chip"><span class="status-name">Engine</span><strong id="status-engine">EXACT</strong></div>
    </div>

    <div class="sidebar-settings">
      <button id="theme-toggle" type="button" class="ghost sidebar-setting-btn theme-toggle"></button>
      <button id="angle-toggle" type="button" class="ghost sidebar-setting-btn">Use radians</button>
      <button id="display-toggle" type="button" class="ghost sidebar-setting-btn">Show polar</button>
    </div>

    <details class="sidebar-catalog">
      <summary>Catalog</summary>
      <div class="sidebar-catalog-body">
        <p><strong>Supports</strong> decimals, fractions, scientific notation, <code>pi</code>, <code>π</code>,
          <code>e</code>, <code>i</code>, <code>sqrt()</code>, and <code>polar(r,theta)</code>.</p>
        <p><strong>Complex</strong> <code>3+4i</code>, <code>2i</code>, <code>-i</code>, <code>5∠30</code></p>
        <p><strong>Polynomial</strong> keep coefficients real; complex <code>x</code> is allowed.</p>
      </div>
    </details>
  </div>
</aside>

<div class="main-content">
```

**Step 2: Simplify the masthead**

Remove from the masthead (lines 47-75): the `masthead-tools` div (containing status-strip, tool-cluster, settings details, catalog details). Keep only `masthead-copy` (eyebrow, h1, subtitle). The masthead stays inside `.main-content`.

**Step 3: Remove the old horizontal tab nav**

Delete the entire `<nav class="tabs tabs-home" ...>` block (lines 94-111).

**Step 4: Add mobile hamburger button to masthead**

Inside the simplified masthead, add before `masthead-copy`:

```html
<button id="sidebar-mobile-toggle" type="button" class="sidebar-mobile-toggle" aria-label="Open navigation" hidden>
  <span class="sidebar-mobile-icon">☰</span>
</button>
```

**Step 5: Add backdrop element and close main-content div**

After the last `</section>` panel (before `</main>`), add:

```html
</div><!-- /.main-content -->
<div id="sidebar-backdrop" class="sidebar-backdrop" hidden></div>
```

**Step 6: Update class on tab-btn references**

The tab buttons now use class `sidebar-nav-item` instead of `tab-btn`. The `data-tab`, `role="tab"`, `aria-selected`, `aria-controls`, and `tabindex` attributes stay identical.

**Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add sidebar HTML structure and simplify masthead"
```

---

### Task 2: Add sidebar CSS — layout grid and sidebar base styles

**Files:**
- Modify: `styles.css` (add new rules, modify `.app-shell`)

**Step 1: Add sidebar CSS custom properties**

Add to `:root` block (after existing variables, around line 23):

```css
--sidebar-width: 240px;
--sidebar-collapsed-width: 56px;
--sidebar-transition: 200ms ease;
```

**Step 2: Change `.app-shell` to CSS Grid**

Find the `.app-shell` rule at approximately line 2000 and replace with:

```css
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  width: min(1400px, 96vw);
  padding: 0;
  margin: 0 auto;
  transition: grid-template-columns var(--sidebar-transition);
}

.app-shell[data-sidebar="collapsed"] {
  grid-template-columns: var(--sidebar-collapsed-width) minmax(0, 1fr);
}
```

**Step 3: Add `.main-content` styles**

```css
.main-content {
  padding: 1.35rem 1.5rem 3.5rem;
  min-width: 0;
  overflow-x: hidden;
}
```

**Step 4: Add `.sidebar` base styles**

```css
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-3);
  background: var(--surface-0);
  border-right: 1px solid var(--line);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--sidebar-transition);
}
```

**Step 5: Add sidebar toggle button styles**

```css
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-1);
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 0.9rem;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--surface-2);
  color: var(--text);
}

.sidebar-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

**Step 6: Commit**

```bash
git add styles.css
git commit -m "feat: add sidebar CSS grid layout and base sidebar styles"
```

---

### Task 3: Add sidebar CSS — nav items, active state, and tooltips

**Files:**
- Modify: `styles.css`

**Step 1: Add sidebar nav item styles**

```css
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  position: relative;
}

.sidebar-nav-item:hover {
  background: var(--surface-1);
  color: var(--text);
}

.sidebar-nav-item.active {
  background: color-mix(in srgb, var(--accent-soft) 60%, var(--surface-1));
  color: var(--text);
  border-left: 3px solid var(--accent);
  font-weight: 600;
}

.sidebar-nav-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-1);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
}

.sidebar-nav-item.active .sidebar-icon {
  background: color-mix(in srgb, var(--accent) 18%, var(--surface-1));
  color: var(--accent-strong);
}

.sidebar-label {
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity var(--sidebar-transition);
}
```

**Step 2: Add collapsed-state tooltip styles**

```css
.app-shell[data-sidebar="collapsed"] .sidebar-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.app-shell[data-sidebar="collapsed"] .sidebar-nav-item {
  justify-content: center;
  padding: var(--space-2);
}

.app-shell[data-sidebar="collapsed"] .sidebar-nav-item::after {
  content: attr(aria-label);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-xs);
  background: var(--surface-3);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
  z-index: 100;
}

.app-shell[data-sidebar="collapsed"] .sidebar-nav-item:hover::after {
  opacity: 1;
}
```

**Step 3: Add `aria-label` attributes to sidebar nav items**

Ensure each sidebar-nav-item has an `aria-label` matching its full name. This was already specified in Task 1 via the existing `aria-label` attributes on the original tab buttons. Verify each button has: `aria-label="Machine Arithmetic"`, `aria-label="Error Analysis"`, `aria-label="Polynomial Methods"`, `aria-label="Tutorial"`.

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: add sidebar nav item styles with active state and collapsed tooltips"
```

---

### Task 4: Add sidebar CSS — tools section, divider, and collapsed hiding

**Files:**
- Modify: `styles.css`

**Step 1: Add sidebar divider style**

```css
.sidebar-divider {
  border: none;
  border-top: 1px solid var(--line);
  margin: var(--space-1) 0;
}
```

**Step 2: Add sidebar tools section styles**

```css
.sidebar-tools {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-setting-btn {
  width: 100%;
  text-align: left;
  font-size: 0.8rem;
  padding: var(--space-2) var(--space-3);
}

.sidebar-catalog summary {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sidebar-catalog summary:hover {
  background: var(--surface-1);
  color: var(--text);
}

.sidebar-catalog-body {
  padding: var(--space-2) var(--space-3);
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--muted);
}

.sidebar-catalog-body p {
  margin: 0 0 var(--space-2);
}

.sidebar-catalog-body p:last-child {
  margin-bottom: 0;
}
```

**Step 3: Hide tools in collapsed state**

```css
.app-shell[data-sidebar="collapsed"] .sidebar-tools,
.app-shell[data-sidebar="collapsed"] .sidebar-divider {
  display: none;
}
```

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: add sidebar tools section and collapsed-state hiding"
```

---

### Task 5: Add sidebar CSS — mobile overlay drawer

**Files:**
- Modify: `styles.css`

**Step 1: Add backdrop styles**

```css
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  opacity: 0;
  transition: opacity var(--sidebar-transition);
}

.sidebar-backdrop.is-visible {
  opacity: 1;
}
```

**Step 2: Add mobile hamburger button styles**

```css
.sidebar-mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-1);
  color: var(--text);
  font-size: 1.2rem;
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-mobile-toggle:hover {
  background: var(--surface-2);
}
```

**Step 3: Add mobile media query**

```css
@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-shell[data-sidebar="collapsed"] {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform var(--sidebar-transition);
    box-shadow: var(--shadow-panel);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-toggle {
    display: none;
  }

  .sidebar-mobile-toggle {
    display: flex;
  }

  .sidebar-label {
    opacity: 1 !important;
    width: auto !important;
  }

  .main-content {
    padding: 1rem 1rem 3rem;
  }
}
```

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: add mobile overlay drawer and responsive sidebar"
```

---

### Task 6: Add sidebar JS — toggle, persistence, and mobile behavior

**Files:**
- Modify: `app.js` (inside the wireEvents function and IIFE)

**Step 1: Add sidebar state initialization**

Near the top of the IIFE (after the existing state object), add a sidebar initialization function:

```javascript
function initSidebar() {
  var storageKey = "ma-lab-sidebar-v1";
  var appShell = document.querySelector(".app-shell");
  var sidebar = document.querySelector(".sidebar");
  var toggleBtn = byId("sidebar-toggle");
  var mobileToggle = byId("sidebar-mobile-toggle");
  var backdrop = byId("sidebar-backdrop");

  // Restore saved state (default: expanded)
  var saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (e) {}
  var sidebarState = saved === "collapsed" ? "collapsed" : "expanded";
  appShell.setAttribute("data-sidebar", sidebarState);
  updateToggleButton(sidebarState);

  function updateToggleButton(state) {
    var icon = toggleBtn.querySelector(".sidebar-toggle-icon");
    if (state === "collapsed") {
      icon.textContent = "»";
      toggleBtn.setAttribute("aria-label", "Expand sidebar");
      toggleBtn.setAttribute("title", "Expand sidebar");
    } else {
      icon.textContent = "«";
      toggleBtn.setAttribute("aria-label", "Collapse sidebar");
      toggleBtn.setAttribute("title", "Collapse sidebar");
    }
  }

  function toggleSidebar() {
    var current = appShell.getAttribute("data-sidebar");
    var next = current === "expanded" ? "collapsed" : "expanded";
    appShell.setAttribute("data-sidebar", next);
    updateToggleButton(next);
    try { localStorage.setItem(storageKey, next); } catch (e) {}
  }

  function openMobileDrawer() {
    sidebar.classList.add("is-open");
    backdrop.hidden = false;
    // Force reflow for transition
    void backdrop.offsetHeight;
    backdrop.classList.add("is-visible");
    mobileToggle.setAttribute("aria-label", "Close navigation");
  }

  function closeMobileDrawer() {
    sidebar.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    setTimeout(function () { backdrop.hidden = true; }, 200);
    mobileToggle.setAttribute("aria-label", "Open navigation");
  }

  toggleBtn.addEventListener("click", toggleSidebar);

  mobileToggle.addEventListener("click", function () {
    if (sidebar.classList.contains("is-open")) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  });

  backdrop.addEventListener("click", closeMobileDrawer);

  // Close mobile drawer when a nav item is clicked
  var navItems = sidebar.querySelectorAll(".sidebar-nav-item");
  for (var j = 0; j < navItems.length; j++) {
    navItems[j].addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) {
        closeMobileDrawer();
      }
    });
  }

  // Show/hide mobile toggle based on viewport
  function checkMobileToggle() {
    var isMobile = window.matchMedia("(max-width: 768px)").matches;
    mobileToggle.hidden = !isMobile;
  }
  checkMobileToggle();
  window.addEventListener("resize", debounce(checkMobileToggle, 150));
}
```

**Step 2: Update tab button selector**

Change the `getTabButtons` function to select the new sidebar nav items:

```javascript
function getTabButtons() {
  if (!cachedTabButtons) {
    cachedTabButtons = Array.from(document.querySelectorAll(".sidebar-nav-item[role='tab']"));
  }
  return cachedTabButtons;
}
```

**Step 3: Update keyboard navigation to use ArrowUp/ArrowDown**

In `onTabKeyDown`, change `ArrowRight`/`ArrowLeft` to also respond to `ArrowDown`/`ArrowUp` since the nav is now vertical:

```javascript
function onTabKeyDown(event) {
  var buttons = getTabButtons();
  var currentIndex = buttons.indexOf(event.currentTarget);
  if (currentIndex === -1) { return; }

  var nextIndex = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % buttons.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = buttons.length - 1;
  }

  if (nextIndex === null) { return; }

  event.preventDefault();
  var nextButton = buttons[nextIndex];
  activateTab(nextButton.dataset.tab || "basic");
  nextButton.focus();
}
```

**Step 4: Call `initSidebar()` in the init function**

Add `initSidebar();` at the start of the `wireEvents()` function or right after it is called.

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add sidebar toggle, persistence, and mobile drawer JS"
```

---

### Task 7: Clean up old horizontal tab and masthead tool styles

**Files:**
- Modify: `styles.css`

**Step 1: Remove or comment out old horizontal tab styles**

Find and remove these rule blocks that are no longer needed:
- `.tabs-home` (line ~2114)
- `.tab-btn` rules that set horizontal card layout (lines ~2119-2144, the ones with `min-height: 84px`)
- `.tab-icon` as standalone icon box (line ~2132)
- `.tab-title`, `.tab-caption`, `.tab-index`, `.tab-meta` rules used by horizontal tabs
- Any media query overrides for `.tab-btn` (e.g., line ~1082)

**Step 2: Remove old masthead-tools rules**

Remove or simplify:
- `.masthead-tools` rules (they now live in sidebar)
- `.tool-cluster`, `.tool-cluster-compact` rules
- `.micro-panel`, `.micro-panel-body`, `.micro-panel-settings`, `.micro-panel-catalog` rules (catalog is now `.sidebar-catalog`)
- Old `.status-strip` rules that assumed horizontal flex in masthead

Keep the `.status-chip` styles since they're reused in the sidebar.

**Step 3: Simplify `.masthead` rule**

Change from two-column grid to single-column since it no longer has the tools column:

```css
.masthead {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  margin-bottom: 1rem;
}
```

**Step 4: Update media queries**

In the `@media (max-width: 980px)` block, remove `.masthead` and `.tabs-home` from the `grid-template-columns: 1fr` list.

In the `@media (max-width: 720px)` block, remove `.masthead-tools`, `.tool-cluster-compact`, `.status-strip` from the stretch/column rules.

**Step 5: Commit**

```bash
git add styles.css
git commit -m "refactor: remove old horizontal tab bar and masthead tool styles"
```

---

### Task 8: Visual test and polish

**Files:**
- Modify: `styles.css` (minor adjustments)
- Modify: `index.html` (minor fixes if needed)

**Step 1: Open the app in a browser and verify**

Check these scenarios:
1. Sidebar expanded — all 4 nav items visible with icons and labels
2. Click toggle — sidebar collapses to icon-only, tooltips appear on hover
3. Click a nav item — correct panel shows, active highlight updates
4. Status strip, settings, catalog visible in expanded sidebar
5. Refresh page — sidebar state persists from localStorage
6. Resize to <768px — sidebar disappears, hamburger appears in header
7. Click hamburger — sidebar slides in as overlay, backdrop behind it
8. Click backdrop or nav item on mobile — drawer closes
9. Theme toggle, angle toggle, display toggle still work from sidebar
10. All calculator functionality still works (Module I, II, III expressions)

**Step 2: Fix any spacing/alignment issues found**

Likely adjustments:
- Sidebar padding or gap fine-tuning
- `.main-content` max-width if content feels too wide
- Status chip sizing in vertical sidebar layout
- Mobile drawer width on very small screens

**Step 3: Verify reduced-motion preference**

Check that `@media (prefers-reduced-motion: reduce)` still kills the sidebar transition and drawer animation.

**Step 4: Commit**

```bash
git add styles.css index.html
git commit -m "fix: polish sidebar layout and verify cross-viewport behavior"
```

---

### Task 9: Final cleanup and verify no regressions

**Files:**
- Modify: `app.js` (if any dead code remains)
- Modify: `styles.css` (if duplicate rules remain)

**Step 1: Search for dead references**

Search app.js for any remaining references to `.tab-btn` class (should now be `.sidebar-nav-item`). Search styles.css for any orphaned `.tabs-home`, `.tab-btn`, `.micro-panel` rules that weren't cleaned up in Task 7.

**Step 2: Verify skip-link still works**

The skip link at line 36 of index.html targets `#tab-basic`. Verify it still jumps to the correct panel.

**Step 3: Run through all module flows end-to-end**

- Module I: enter expression, compute, check trace
- Module II: compute error, import from Module I
- Module III: load preset, compute polynomial, check trace
- Tutorial: send examples to each module
- Cross-module: "Send to Errors" buttons still work

**Step 4: Commit**

```bash
git add app.js styles.css index.html
git commit -m "chore: clean up dead references from sidebar migration"
```
