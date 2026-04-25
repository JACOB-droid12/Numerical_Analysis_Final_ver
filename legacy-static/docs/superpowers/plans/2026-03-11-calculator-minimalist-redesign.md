# Calculator Minimalist Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the calculator's over-styled CSS to a clean, neutral, minimalist design while preserving all JavaScript logic and HTML structure.

**Architecture:** CSS-only changes to `styles.css`. The file has ~3400 lines with 4-5 layers of accumulated overrides from previous redesign passes. Each task consolidates duplicate rules into a single authoritative declaration per selector. No HTML or JS changes.

**Tech Stack:** Vanilla CSS, CSS custom properties. No build tools needed — open `index.html` in a browser to verify.

**Spec:** `docs/superpowers/specs/2026-03-11-calculator-minimalist-redesign.md`

---

## Chunk 1: Foundation & Global Styles

### Task 1: Replace color tokens in `:root` and theme blocks

**Files:**
- Modify: `styles.css:1-80`

- [ ] **Step 1: Replace the light theme color tokens**

In `html[data-theme="light"]` (lines 30-54), replace all color values:

```css
html[data-theme="light"] {
  color-scheme: light;
  --bg: #ffffff;
  --bg-accent: #f3f4f6;
  --surface-0: #f8f9fa;
  --surface-1: #f3f4f6;
  --surface-2: #e5e7eb;
  --surface-3: #d1d5db;
  --surface-strong: #f9fafb;
  --text: #1a1a1a;
  --muted: #6b7280;
  --line: #e5e7eb;
  --line-strong: #d1d5db;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.08);
  --accent-strong: #1d4ed8;
  --danger: #dc2626;
  --danger-soft: rgba(220, 38, 38, 0.08);
  --focus-ring: rgba(37, 99, 235, 0.2);
  --shadow-soft: none;
  --shadow-panel: none;
}
```

- [ ] **Step 2: Replace the dark theme color tokens**

In `html[data-theme="dark"]` (lines 56-80), replace all color values:

```css
html[data-theme="dark"] {
  color-scheme: dark;
  --bg: #111113;
  --bg-accent: #18181b;
  --surface-0: #1a1a1e;
  --surface-1: #202024;
  --surface-2: #2a2a2e;
  --surface-3: #333338;
  --surface-strong: #1e1e22;
  --text: #e4e4e7;
  --muted: #a1a1aa;
  --line: #2a2a2e;
  --line-strong: #3f3f46;
  --accent: #3b82f6;
  --accent-soft: rgba(59, 130, 246, 0.12);
  --accent-strong: #60a5fa;
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.12);
  --focus-ring: rgba(59, 130, 246, 0.2);
  --shadow-soft: none;
  --shadow-panel: none;
}
```

- [ ] **Step 3: Remove module color tokens**

Delete `--module-basic`, `--module-error`, `--module-poly` from both theme blocks. Search for all references to these tokens in the file and replace:
- Any `var(--module-basic)` → `var(--accent)`
- Any `var(--module-error)` → `var(--accent)`
- Any `var(--module-poly)` → `var(--accent)`

- [ ] **Step 4: Update radius and remove unused tokens from `:root`**

In `:root` (lines 1-28):
- Change `--radius-sm: 8px` to `--radius-sm: 6px`
- Remove `--radius-pill: 999px` declaration
- Remove `--radius-xl: 24px` declaration
- Remove `--shadow-soft` and `--shadow-panel` from `:root` if declared there (they're now set to `none` in theme blocks)
- Keep all other `:root` values unchanged

- [ ] **Step 5: Verify in browser**

Open `index.html` in browser. Check:
- Light theme: white background, blue accent on buttons, gray borders
- Dark theme toggle: dark background, blue accent, light text
- No broken `var()` references (check console for warnings)

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "style: replace color palette with neutral grayscale + blue accent"
```

### Task 2: Remove decorative backgrounds and overlays

**Files:**
- Modify: `styles.css` — lines 129-163 (html/body rules, body::after)

- [ ] **Step 1: Clean the `html` rule**

Remove the noise texture `background-image` from the `html` rule (line 132-134). Keep `min-height: 100dvh` and `background-attachment: fixed` can be removed too.

The `html` rule should become:
```css
html {
  min-height: 100dvh;
}
```

- [ ] **Step 2: Clean the `body` rule**

Remove the `repeating-linear-gradient` background-image from `body` (lines 142-147). Keep the rest.

The `body` rule should become:
```css
body {
  margin: 0;
  min-height: 100dvh;
  color: var(--text);
  font-family: var(--font-body);
  background-color: var(--bg);
}
```

- [ ] **Step 3: Remove `body::after` grain overlay**

Delete the entire `body::after` rule block (lines 149-158) and the `html[data-theme="dark"] body::after` override (lines 160-163).

- [ ] **Step 4: Remove `box-shadow` from global transition list**

In the transition rule (lines 180-186), remove the `box-shadow var(--transition-base)` line. Keep `background-color`, `border-color`, `color`, `transform`.

- [ ] **Step 5: Verify in browser**

- Background should be flat white (light) or flat dark (dark), no grain or line patterns
- No visual artifacts from removed overlays

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "style: remove noise textures, grain overlay, and line patterns"
```

### Task 3: Update typography and button base styles

**Files:**
- Modify: `styles.css` — h1, h2, h3, button rules, and all later overrides

- [ ] **Step 1: Update heading sizes**

Find ALL `h1` rules in the file and consolidate to one final override with:
```css
h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  line-height: 1;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
```

Find ALL `h2` size rules. The `.module-header h2` rule should become:
```css
.module-header h2 {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  line-height: 1;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
```

- [ ] **Step 2: Update base button styles**

Change base `button` border-radius from `var(--radius-pill)` to `var(--radius-sm)`.
Change base `button` padding to `0.6rem 1rem`.

Update `button:hover` — remove `transform: translateY(-1px)`, replace with:
```css
button:hover {
  filter: brightness(0.9);
}
```

Add ghost button hover:
```css
button.ghost:hover {
  background: var(--surface-1);
  filter: none;
}
```

Update `button:active` — change `scale(0.97)` to `scale(0.98)`.

- [ ] **Step 3: Update focus-visible styles**

Replace the focus-visible rule (lines 247-254) from box-shadow to outline:
```css
button:focus-visible,
input:focus-visible,
select:focus-visible,
summary:focus-visible,
.symbol-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  box-shadow: none;
}
```

- [ ] **Step 4: Update eyebrow/kicker font-weight**

Find the `.eyebrow, .module-kicker, .result-label` etc. rules. Change `font-weight: 650` to `font-weight: 600` in all instances. Search for all `font-weight: 650` in the file and replace with `600`.

- [ ] **Step 5: Replace all `border-radius: 999px` and `var(--radius-pill)` references**

Search the entire file for:
- `border-radius: 999px` → replace with `border-radius: var(--radius-sm)`
- `var(--radius-pill)` → replace with `var(--radius-sm)`
- `border-radius: var(--radius-xl)` → replace with `border-radius: var(--radius-md)`

- [ ] **Step 6: Replace all `var(--shadow-soft)` and `var(--shadow-panel)` references**

Search the entire file for `var(--shadow-soft)` and `var(--shadow-panel)` and replace with `none`.

- [ ] **Step 7: Search for remaining references to deleted tokens**

Run these searches and confirm zero matches:
- Search for `--radius-pill` — should not appear anywhere
- Search for `--radius-xl` — should not appear anywhere (except its own deletion)
- Search for `font-weight: 650` — should not appear anywhere

- [ ] **Step 8: Verify in browser**

- Buttons should be rectangular (6px radius), not pill-shaped
- Headings should be smaller and tighter
- Focus rings should be blue outlines, not box-shadow glows
- No hover lift effects on buttons
- Ghost buttons show `var(--surface-1)` background on hover

- [ ] **Step 9: Commit**

```bash
git add styles.css
git commit -m "style: update typography, buttons, focus, and border-radius to minimalist"
```

---

## Chunk 2: Module & Component Styles

### Task 4: Strip module shell and header decorations

**Files:**
- Modify: `styles.css` — `.module-shell`, `.module-shell::before`, `.module-header` rules (multiple locations due to overrides)

- [ ] **Step 1: Remove ALL `.module-shell::before` rules**

Search the file for every `.module-shell::before` rule block and delete them all. Also delete `.module-basic::before`, `.module-error::before`, `.module-poly::before` rules.

- [ ] **Step 2: Consolidate `.module-shell` rules**

There are multiple `.module-shell` rules at lines ~407, ~1449, ~2093, ~2437. Consolidate into one final override at the bottom-most location:

```css
.module-shell {
  container-type: inline-size;
  display: grid;
  gap: 1rem;
  padding: 1.15rem 1.2rem 1.25rem;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  box-shadow: none;
}
```

Remove the other `.module-shell` rules to avoid confusion (or leave them — the last one wins, but cleaner to remove).

- [ ] **Step 3: Simplify `.module-header`**

Consolidate module-header rules. Final:
```css
.module-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
  align-items: start;
}
```

- [ ] **Step 4: Remove `--calc-shell-bg`, `--calc-result-bg` etc. custom properties**

Delete the `:root` block at line ~2403 that defines `--calc-shell-bg`, `--calc-shell-border`, `--calc-shell-focus`, `--calc-result-bg`, `--calc-result-border`, `--calc-secondary-bg`. Replace all references to these tokens throughout the file with their direct equivalents using the standard tokens.

- [ ] **Step 5: Search for remaining references to deleted tokens**

Run these searches and confirm zero matches:
- Search for `--module-basic` — should not appear
- Search for `--module-error` — should not appear
- Search for `--module-poly` — should not appear
- Search for `--calc-shell-bg` — should not appear
- Search for `--calc-result-bg` — should not appear
- Search for `--calc-result-border` — should not appear
- Search for `--calc-shell-border` — should not appear
- Search for `--calc-shell-focus` — should not appear
- Search for `--calc-secondary-bg` — should not appear

- [ ] **Step 6: Verify in browser**

- No gradient bar at top of module sections
- Module sections should have no visible container (transparent background, no border)
- Content layout should be unchanged

- [ ] **Step 7: Commit**

```bash
git add styles.css
git commit -m "style: remove module gradient bars and decorative shells"
```

### Task 5: Simplify sidebar styles

**Files:**
- Modify: `styles.css` — sidebar section (lines ~1726-2012)

- [ ] **Step 0: Set sidebar background and border**

The sidebar should use flat, plain styling:
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

Style the toggle buttons as plain icon buttons:
```css
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 0.9rem;
}

.sidebar-toggle:hover {
  background: var(--surface-1);
  color: var(--text);
}

.sidebar-mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.sidebar-mobile-toggle:hover {
  background: var(--surface-1);
  color: var(--text);
}
```

- [ ] **Step 1: Hide sidebar icons**

Add rule:
```css
.sidebar-icon {
  display: none;
}
```

Note: when sidebar is collapsed, icons should still show since labels are hidden. Add:
```css
.app-shell[data-sidebar="collapsed"] .sidebar-icon {
  display: flex;
}
```

- [ ] **Step 2: Simplify sidebar nav active state**

Update `.sidebar-nav-item.active`:
```css
.sidebar-nav-item.active {
  background: var(--accent-soft);
  color: var(--text);
  border-left: 2px solid var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 3: Strip status chips**

Update `.status-chip`:
```css
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
}
```

- [ ] **Step 4: Strip sidebar setting buttons**

Update `.sidebar-setting-btn` and `button.ghost`:
```css
.sidebar-setting-btn {
  width: 100%;
  text-align: left;
  font-size: 0.8rem;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  color: var(--muted);
}

.sidebar-setting-btn:hover {
  color: var(--text);
  background: var(--surface-1);
}
```

- [ ] **Step 5: Remove sidebar divider decoration**

Update `.sidebar-divider`:
```css
.sidebar-divider {
  border: none;
  margin: var(--space-2) 0;
}
```

- [ ] **Step 6: Fix mobile sidebar shadow**

In the `@media (max-width: 768px)` block, the `.sidebar` rule uses `var(--shadow-panel)` which is now `none`. Replace with a simple shadow for the mobile overlay:
```css
box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
```

- [ ] **Step 7: Verify in browser**

- Sidebar should show text labels only (no icons) when expanded
- Sidebar should show icons when collapsed
- Active tab has blue left border
- Status chips are plain text
- Mobile hamburger menu works

- [ ] **Step 8: Commit**

```bash
git add styles.css
git commit -m "style: simplify sidebar to flat text navigation"
```

### Task 6: Simplify input areas and search shell

**Files:**
- Modify: `styles.css` — `.search-shell`, `.btn-calculate-omni`, `.symbol-trigger`, `.symbol-btn` rules

- [ ] **Step 1: Flatten the search shell**

There are multiple `.search-shell` rules. Consolidate to a single final override. Remove all `color-mix` backgrounds, `inset` shadows, rounded pill borders:

```css
.search-shell {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas: "input symbols action";
  align-items: center;
  gap: 0.42rem 0.56rem;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.search-shell:focus-within {
  border-color: transparent;
  box-shadow: none;
}

.search-shell input {
  grid-area: input;
  min-height: 44px;
  padding: 0.5rem 0.72rem;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--surface-0) !important;
  box-shadow: none !important;
  font-size: 1.1rem;
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: -0.01em;
}

.search-shell input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Simplify the calculate button**

```css
.btn-calculate-omni {
  grid-area: action;
  min-width: 52px;
  min-height: 44px;
  padding: 0;
  border-radius: var(--radius-sm);
  font-size: 1.15rem;
  box-shadow: none;
}
```

- [ ] **Step 3: Simplify symbol trigger and symbol buttons**

```css
.symbol-trigger {
  grid-area: symbols;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--line);
  background: var(--surface-1);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.84rem;
  font-weight: 600;
  box-shadow: none;
}

.symbol-btn {
  min-width: 36px;
  min-height: 32px;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-xs);
  background: var(--surface-1);
  color: var(--text);
  border: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
}
```

- [ ] **Step 4: Simplify error field grid inputs**

Update `.field-grid-error .field-shell` — remove `color-mix` background, use plain styling:
```css
.field-grid-error .field-shell {
  gap: 0.4rem;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.field-grid-error input {
  min-height: 44px;
  padding: 0.5rem 0.72rem;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--surface-0) !important;
  box-shadow: none !important;
}
```

- [ ] **Step 5: Verify in browser**

- Expression input is a plain rectangular field with gray border
- Calculate `=` button is rectangular blue
- Symbol trigger is a small gray square button
- Error module inputs are plain fields (not wrapped in a styled container)
- Focus shows blue outline

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "style: flatten input areas to plain rectangular fields"
```

---

## Chunk 3: Results, Panels & Polish

### Task 7: Simplify result panels and answer displays

**Files:**
- Modify: `styles.css` — `.answer-hero`, `.answer-value`, `.answer-strip`, `.comparison-baseline`, `.method-panel`, `.reading-panel`, `.disclosure`, `.utility-panel`, `.empty-state`

- [ ] **Step 1: Consolidate answer hero and panel rules**

There are multiple overrides for `.answer-hero`, `.method-panel`, `.reading-panel`, `.reference-panel`. Consolidate to one final set:

```css
.answer-hero,
.method-panel,
.reading-panel,
.reference-panel {
  display: grid;
  gap: var(--space-2);
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  box-shadow: none;
}
```

- [ ] **Step 2: Remove accent-tinted backgrounds**

Make `.answer-hero-source`, `.comparison-baseline`, `.answer-hero-reading`, `.answer-hero-primary-machine` all use neutral styling:

```css
.answer-hero-source,
.comparison-baseline,
.answer-hero-reading,
.answer-hero-primary-machine {
  background: var(--surface-0);
  border-color: var(--line);
}

.answer-hero-primary-machine .result-label {
  color: var(--muted);
}

.answer-hero-secondary-comparison {
  background: var(--surface-0);
  border-color: var(--line);
}

.answer-hero-secondary-comparison .result-label {
  color: var(--muted);
}
```

- [ ] **Step 3: Consolidate answer value sizing**

```css
.answer-value {
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  word-break: break-word;
  overflow-wrap: break-word;
}

.answer-hero-source .answer-value,
.comparison-baseline .answer-value,
.answer-hero-reading .answer-value {
  font-size: clamp(1.2rem, 2.2vw, 1.5rem);
}
```

- [ ] **Step 4: Simplify answer strip and metric list cells**

```css
.answer-strip > div,
.metric-list > div,
.method-panel > div {
  padding: 0.55rem 0.7rem;
  border: none;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}

.answer-strip > div:last-child,
.metric-list > div:last-child,
.method-panel > div:last-child {
  border-bottom: none;
}
```

- [ ] **Step 5: Simplify disclosure and utility panels**

```css
.disclosure,
.utility-panel,
.empty-state {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  box-shadow: none;
}

.disclosure summary,
.utility-panel summary {
  list-style: none;
  cursor: pointer;
  padding: 0.7rem 0.85rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.disclosure summary::after {
  content: "+";
  float: right;
  font-weight: 400;
  color: var(--muted);
}

.disclosure[open] summary::after {
  content: "\2212";
}

.utility-panel summary::after {
  content: "+";
  float: right;
  font-weight: 400;
  color: var(--muted);
}

.utility-panel[open] summary::after {
  content: "\2212";
}
```

- [ ] **Step 6: Remove `.answer-hero-major` min-height**

```css
.answer-hero-major {
  min-height: 0;
}
```

- [ ] **Step 7: Verify in browser**

- Result panels are flat white/gray boxes with thin borders
- No accent-tinted backgrounds on any answer panels
- Answer values are moderately sized (not billboard)
- Metric cells use bottom borders, not individual boxes
- Disclosure panels are clean

- [ ] **Step 8: Commit**

```bash
git add styles.css
git commit -m "style: simplify result panels and answer displays"
```

### Task 8: Simplify welcome strip, math preview, and remaining components

**Files:**
- Modify: `styles.css` — `.welcome-strip`, `.math-preview`, `.math-secondary-block`, `.control-band`, `.result-stage`, `.symbol-popover`, `select`, `[data-theme="dark"]` overrides, `[data-density="exam"]` overrides

- [ ] **Step 1: Simplify welcome strip**

```css
.welcome-strip {
  margin: 0 0 var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
}
```

Remove all other `.welcome-strip` overrides that add `color-mix` backgrounds.

- [ ] **Step 2: Simplify math preview**

```css
.math-preview {
  margin-top: 0.4rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
}

.math-preview-search {
  margin-top: 0.18rem;
  padding: 0.22rem 0.44rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
}
```

Remove the `[data-theme="dark"] .math-preview` override that used `color-mix`.

- [ ] **Step 3: Simplify control-band and result-stage**

```css
.control-band,
.result-stage,
.summary-band,
.comparison-board {
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}
```

- [ ] **Step 4: Simplify symbol popover**

```css
.symbol-popover {
  position: fixed;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.38rem;
  padding: 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface-0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

- [ ] **Step 5: Clean up dark theme overrides**

Remove the dark theme overrides at lines ~852-863 that use `color-mix` with `var(--accent)` for border colors. Replace:

```css
[data-theme="dark"] .module-shell,
[data-theme="dark"] .answer-hero,
[data-theme="dark"] .method-panel {
  box-shadow: none;
}

[data-theme="dark"] .status-chip,
[data-theme="dark"] .answer-strip > div,
[data-theme="dark"] .metric-list > div,
[data-theme="dark"] .method-panel > div {
  border-color: var(--line);
}
```

- [ ] **Step 6: Clean up exam density overrides**

In the `html[data-density="exam"]` section, replace all `color-mix` backgrounds with plain `var(--surface-0)` or `transparent`, and replace all `color-mix` border-colors with `var(--line)`.

- [ ] **Step 7: Clean up remaining `color-mix` references**

Search the entire file for `color-mix`. Replace each instance:
- `color-mix(in srgb, var(--surface-0) XX%, ...)` → `var(--surface-0)` (or the appropriate plain token)
- `color-mix(in srgb, var(--line) XX%, transparent)` → `var(--line)`
- `color-mix(in srgb, var(--muted) XX%, var(--text) YY%)` → `var(--muted)`
- `color-mix(in srgb, var(--accent) XX%, ...)` → `var(--accent)` or `var(--accent-soft)`

The goal: eliminate ALL `color-mix` calls. The minimalist design uses solid token values, not blended colors. A few exceptions are acceptable for the radical body border and math elements where opacity is functionally needed.

- [ ] **Step 8: Remove references to `var(--paper)` and `var(--shadow)`**

Search for `var(--paper)` and `var(--shadow)` — these tokens don't exist in the theme blocks. Replace any `color-mix` using them with plain tokens.

- [ ] **Step 9: Verify in browser — full test**

Test all modules:
1. **Calculation tab**: Enter `1/3 + 2/5`, set k=4, click `=`. Verify results display
2. **Error tab**: Enter exact=1, approx=0.9999, compute. Verify results display
3. **Polynomial tab**: Enter `x^2 + 1`, x=2, compute. Verify results display
4. **Tutorial tab**: Verify content displays
5. **Theme toggle**: Switch between light and dark, verify both look correct
6. **Sidebar collapse**: Click collapse, verify icon-only mode works
7. **Mobile**: Resize to <768px, verify hamburger menu works
8. **Welcome strip**: Expand/collapse the quick start guide

- [ ] **Step 10: Commit**

```bash
git add styles.css
git commit -m "style: simplify remaining components and remove all color-mix decorations"
```

### Task 9: Final CSS cleanup — remove dead duplicate rules

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Audit for duplicate selectors**

The file has accumulated 4-5 layers of overrides. After tasks 1-8, many earlier rules are now overridden by later ones. For each major selector (`.module-shell`, `.search-shell`, `.answer-hero`, `.answer-value`, `.status-chip`, `.disclosure`, `.utility-panel`, `.welcome-strip`, `.math-secondary-block`, `.subtitle`, `.masthead-copy`, `h1`, `.module-header`, `.module-copy`, etc.), verify that the last rule in source order contains the correct final values and remove or consolidate earlier duplicate rules that are fully overridden.

Do NOT remove rules that are in `@media` or `@container` queries — those serve different contexts.
Do NOT remove rules with different selector specificity (e.g., `html[data-density="exam"] .module-shell` is different from `.module-shell`).

- [ ] **Step 2: Remove orphaned rules**

Delete rules for selectors that reference deleted tokens:
- Any rule using `var(--module-basic)`, `var(--module-error)`, `var(--module-poly)` if not already replaced
- Any rule using `var(--calc-shell-bg)`, `var(--calc-result-bg)`, etc. if not already replaced

- [ ] **Step 3: Final browser verification**

Repeat the full test from Task 8, Step 9. Everything should look identical before and after cleanup.

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "style: consolidate duplicate CSS rules from previous redesign layers"
```

---

## Post-Implementation

After all tasks complete:
1. Run a final visual check across all 4 tabs, both themes, and mobile layout
2. Verify no JavaScript console errors
3. The calculator should look clean, flat, and functional — a proper academic tool
