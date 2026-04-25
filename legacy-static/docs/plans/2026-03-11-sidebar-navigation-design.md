# Sidebar Navigation Design

## Problem

The horizontal tab bar and masthead tools (status strip, settings, catalog) consume significant vertical space and create visual clutter. On a teaching calculator where the math answer should be the first thing users find, this overhead competes with the content.

## Solution

Replace the horizontal tab bar with a collapsible left sidebar. Relocate the status strip, settings, and catalog into the sidebar. Restructure the app-shell as a CSS Grid with a sidebar column.

## Layout Structure

The `app-shell` becomes a two-column CSS Grid:

```
[sidebar] [main-content]
```

- Expanded sidebar column: ~240px fixed
- Collapsed sidebar column: ~56px (icon-only with tooltips)
- Main content: 1fr (fills remaining space)
- `data-sidebar="expanded"` / `data-sidebar="collapsed"` attribute on `app-shell` drives state
- CSS transition on `grid-template-columns` (~200ms ease) for smooth animation

## Sidebar Contents (top to bottom)

1. **Toggle button** -- arrow icon (left-pointing when expanded, right-pointing when collapsed)
2. **Module nav items** -- vertical list:
   - Module I: icon `sum`, label "Calculation"
   - Module II: icon `delta`, label "Errors"
   - Module III: icon `f(x)`, label "Polynomial"
   - Guide: icon `?`, label "Tutorial"
3. **Divider line**
4. **Status strip** -- Angle, Display, Engine chips stacked vertically
5. **Settings** -- theme toggle, angle toggle, display toggle (plain buttons, not inside a details element)
6. **Catalog** -- stays as a collapsible details element since it has longer content

### Collapsed state (icon-only)

- Nav items show only the icon
- CSS-only tooltips via `::after` pseudo-element on hover showing full name
- Status strip, settings, and catalog are hidden
- Toggle button shows right-pointing arrow

### Active state

Active module gets a subtle highlight (background or left border accent).

## Mobile Behavior (max-width: 768px)

- CSS Grid becomes single-column (no sidebar column)
- Sidebar starts hidden off-screen (`transform: translateX(-100%)`)
- A hamburger button appears in the top-left of the header to open it
- Sidebar slides over content as a drawer with a semi-transparent backdrop
- Tapping the backdrop or a nav item closes the drawer
- Overlay sidebar always shows the full expanded version (not icon-only)

## Interaction Details

- **Tab switching** -- same logic as today; clicking a nav item switches the visible panel and updates `aria-selected`
- **State persistence** -- save expanded/collapsed to localStorage (key: `ma-lab-sidebar-v1`) so it remembers across refreshes
- **Keyboard** -- Tab navigates sidebar items, arrow keys move between them. Toggle button is focusable.
- **Tooltips** -- CSS-only using `::after` pseudo-element in collapsed mode. No JS tooltip library.

## What Changes

### Removed from current layout

- Horizontal tab bar (`nav.tabs.tabs-home`) -- replaced by sidebar nav
- Status strip from masthead -- moved to sidebar
- Settings details element from masthead -- moved to sidebar as plain buttons
- Catalog details element from masthead -- moved to sidebar
- `tool-cluster` wrapper in masthead -- no longer needed

### Simplified masthead

- Keeps: eyebrow, h1, subtitle
- Loses: status strip, settings, catalog
- Becomes a slimmer header

### Unchanged

- Welcome strip (stays in main content area, below simplified masthead)
- All module panel contents (calculators, results, traces)
- All JS calculation logic
- All engine files (math-engine, calc-engine, expression-engine, poly-engine)

## Files Affected

- `index.html` -- restructure app-shell, move elements to sidebar, simplify masthead
- `styles.css` -- CSS Grid layout, sidebar styles, collapse/expand transitions, mobile overlay, remove horizontal tab styles
- `app.js` -- sidebar toggle logic, localStorage persistence, mobile backdrop handling, update tab-switching to work with sidebar nav
