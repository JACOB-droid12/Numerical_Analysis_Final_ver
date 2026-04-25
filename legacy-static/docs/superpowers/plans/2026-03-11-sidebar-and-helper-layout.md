# Sidebar & Helper Layout Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visual contrast to sidebar settings section and fix the Single Operation Helper input layout to group expression fields separately from config fields.

**Architecture:** CSS-only changes for the grid layout; one HTML element added for the sidebar section label. Existing `.sidebar-divider` rule gets enhanced to be visible.

**Tech Stack:** HTML, CSS (CSS Grid)

**Spec:** `docs/superpowers/specs/2026-03-11-sidebar-and-helper-layout-design.md`

---

## Chunk 1: Sidebar and Helper Layout

### Task 1: Enhance sidebar divider visibility

**Files:**
- Modify: `styles.css:1530-1533` (existing `.sidebar-divider` rule)

- [ ] **Step 1: Modify the `.sidebar-divider` CSS rule**

In `styles.css`, change the existing rule at line 1530 from:

```css
.sidebar-divider {
  border: none;
  margin: var(--space-2) 0;
}
```

to:

```css
.sidebar-divider {
  border: none;
  border-top: 1px solid var(--line);
  margin: var(--space-3) var(--space-2);
}
```

This makes the divider visible as a thin line with more vertical breathing room.

- [ ] **Step 2: Verify visually**

Open `index.html` in the browser. Confirm the sidebar now shows a thin horizontal line between the nav items and the settings area, with spacing above and below. Check both light and dark themes.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "style: make sidebar divider visible with line and spacing"
```

### Task 2: Add sidebar section label

**Files:**
- Modify: `index.html:64` (add element as first child of `.sidebar-tools`)
- Modify: `styles.css` (add new `.sidebar-section-label` rule after `.sidebar-divider`)

- [ ] **Step 1: Add the label element to HTML**

In `index.html`, insert a new line after line 64 (`<div class="sidebar-tools">`), before the `.sidebar-status` div:

```html
<span class="sidebar-section-label">Settings</span>
```

So the structure becomes:

```html
<div class="sidebar-tools">
  <span class="sidebar-section-label">Settings</span>
  <div class="sidebar-status" aria-label="Calculator status">
```

- [ ] **Step 2: Add CSS for the section label**

In `styles.css`, add a new rule after the `.sidebar-divider` block (after line 1533):

```css
.sidebar-section-label {
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0 var(--space-3);
  margin-bottom: calc(-1 * var(--space-2));
}
```

- [ ] **Step 3: Verify visually**

Open in browser. Confirm "SETTINGS" label appears above the status chips (ANGLE, DISPLAY, ENGINE). Confirm it disappears when sidebar is collapsed (click the collapse toggle). Check both themes.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "style: add Settings section label to sidebar"
```

### Task 3: Fix Single Operation Helper grid layout

**Files:**
- Modify: `styles.css:444-446` (`.field-grid-basic` rule)

- [ ] **Step 1: Change the grid template columns**

In `styles.css`, change line 444-446 from:

```css
.field-grid-basic {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
```

to:

```css
.field-grid-basic {
  grid-template-columns: 3fr minmax(5rem, 1fr) 3fr 2fr 2fr;
}

.field-grid-basic > label:nth-child(4) {
  margin-left: var(--space-4);
}
```

This makes:
- Columns 1 & 3 (Operand A, Operand B): wide at 3fr
- Column 2 (Operation dropdown): narrow, min 5rem
- Columns 4 & 5 (Significant digits, Machine rule): medium at 2fr
- Extra left margin on column 4 creates visual separation between the expression and config zones

- [ ] **Step 2: Verify visually**

Open in browser, navigate to the Tutorial tab, find the Single Operation Helper. Confirm:
- Operand A and Operand B inputs are wider than before
- The Operation dropdown is narrower (just needs to show +, -, *, /)
- There is a visible gap between Operand B and Significant digits
- Significant digits and Machine rule are grouped together on the right
- The echo boxes and Calculate button below are not affected

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "style: rebalance single operation helper grid into expression + config zones"
```
