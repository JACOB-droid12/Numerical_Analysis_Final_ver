# Sidebar Settings Contrast & Single Operation Helper Layout

**Date:** 2026-03-11
**Status:** Approved

## Problem

1. **Sidebar**: The navigation items (Calculation, Errors, Polynomial, Tutorial) and settings area (ANGLE/DISPLAY/ENGINE status, theme toggles, catalog) share the same flat styling with no visual separation, making the sidebar look samey and unorganized.

2. **Single Operation Helper**: The five input fields (Operand A, Operation, Operand B, Significant digits, Machine rule) sit in equal-width columns with no visual grouping, making the layout feel scattered.

## Design

### 1. Sidebar Settings Separation

**Approach:** Enhance existing divider + add section label

The `<hr class="sidebar-divider">` already exists at line 62 of `index.html` between `.sidebar-nav` and `.sidebar-tools`. Its current CSS (`border: none; margin: var(--space-2) 0`) makes it invisible.

**HTML changes** (`index.html`):
- Add `<span class="sidebar-section-label">Settings</span>` as the first child of `.sidebar-tools` (before `.sidebar-status`). This element is implicitly hidden when sidebar collapses since `.sidebar-tools` is hidden in collapsed mode.

**CSS changes** (`styles.css`):
- Modify existing `.sidebar-divider` rule (line 1530): change `border: none` to `border: none; border-top: 1px solid var(--line)`, increase margin to `var(--space-3) var(--space-2)`
- Add new `.sidebar-section-label` rule: `font-size: 0.6rem`, `letter-spacing: 0.1em`, `text-transform: uppercase`, `color: var(--muted)`, `padding: 0 var(--space-3)`, `margin-bottom: calc(-1 * var(--space-2))` (tighten gap to status chips below)

**Scope:** 1 line HTML, ~12 lines CSS. No JS changes.

### 2. Single Operation Helper Grid Layout

**Approach:** CSS-only grid change to create two visual zones

The `.field-grid-basic` currently uses `grid-template-columns: repeat(5, minmax(0, 1fr))` (line 444). There are 5 `<label>` children inside `.field-grid-basic`.

**CSS changes** (`styles.css`):
- Change `.field-grid-basic` to `grid-template-columns: 3fr minmax(5rem, 1fr) 3fr 2fr 2fr` (5 columns, no spacer column)
- Add a larger left margin or gap to separate expression from config: `.field-grid-basic > label:nth-child(4) { margin-left: var(--space-4); }` to create visual separation between Operand B and Significant digits
- Column sizing: operands get 3fr (wide), operation gets minmax(5rem, 1fr) (narrow), config fields get 2fr each (medium)

This avoids the spacer-column problem entirely — 5 children map to 5 columns, with a margin on the 4th child creating the visual gap.

**Scope:** CSS-only, no HTML changes. No JS changes. Does not touch the echo/summary boxes below the inputs.

## Files Modified

- `index.html` — 1 element added (sidebar section label)
- `styles.css` — modify existing `.sidebar-divider`, add `.sidebar-section-label`, modify `.field-grid-basic` and add `nth-child(4)` margin rule

## Out of Scope

- Operand echo boxes below the input row (left as-is per user request)
- Any other module layouts or sidebar navigation styling
- JavaScript behavior changes
