# Sidebar Settings Contrast & Single Operation Helper Layout

**Date:** 2026-03-11
**Status:** Approved

## Problem

1. **Sidebar**: The navigation items (Calculation, Errors, Polynomial, Tutorial) and settings area (ANGLE/DISPLAY/ENGINE status, theme toggles, catalog) share the same flat styling with no visual separation, making the sidebar look samey and unorganized.

2. **Single Operation Helper**: The five input fields (Operand A, Operation, Operand B, Significant digits, Machine rule) sit in equal-width columns with no visual grouping, making the layout feel scattered.

## Design

### 1. Sidebar Settings Separation

**Approach:** Subtle divider + spacing + section label

**HTML changes** (`index.html`):
- Add `<hr class="sidebar-divider">` between `.sidebar-nav` and `.sidebar-tools`
- Add `<span class="sidebar-section-label">Settings</span>` above the status chips inside `.sidebar-tools`

**CSS changes** (`styles.css`):
- `.sidebar-divider`: 1px solid `var(--line)`, horizontal margins `var(--space-2)`, vertical margin `var(--space-3)`, no height/border-style override needed beyond standard hr reset
- `.sidebar-section-label`: font-size `0.6rem`, letter-spacing `0.1em`, text-transform uppercase, color `var(--muted)`, small bottom margin

**Scope:** ~2 lines HTML, ~15 lines CSS. No JS changes.

### 2. Single Operation Helper Grid Layout

**Approach:** CSS-only grid change to create two visual zones

**CSS changes** (`styles.css`):
- Change `.field-grid-basic` from `grid-template-columns: repeat(5, minmax(0, 1fr))` to `grid-template-columns: 3fr minmax(5rem, 1fr) 3fr var(--space-4) 2fr 2fr`
- Columns 1-3: Expression zone (Operand A, Operation dropdown, Operand B) — operand inputs are wider, operation dropdown is narrower
- Column 4: Visual spacer gap (empty column using `var(--space-4)` width)
- Columns 5-6: Config zone (Significant digits, Machine rule) — narrower, grouped together
- Use `nth-child` selectors to place the 5 label children into the correct grid columns (skipping column 4)

**Scope:** CSS-only, no HTML changes. No JS changes. Does not touch the echo/summary boxes below the inputs.

## Files Modified

- `index.html` — sidebar divider and label (2 elements added)
- `styles.css` — sidebar divider/label styles + field-grid-basic grid change

## Out of Scope

- Operand echo boxes below the input row (left as-is per user request)
- Any other module layouts or sidebar navigation styling
- JavaScript behavior changes
