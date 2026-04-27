---
name: Roots Workbench Glass Console
description: A Mac-style glass answer workstation for numerical analysis learning.
colors:
  canvas-warm: "#f3eee6"
  canvas-cream: "#f9f5ec"
  surface-glass: "#fffdf8"
  surface-muted: "#eef0eb"
  ink: "#171817"
  text: "#191a19"
  muted: "#64645e"
  quiet: "#9b9a91"
  line: "#e0e4dd"
  line-strong: "#c9d0c6"
  action-blue: "#2f73d6"
  action-blue-strong: "#2159ad"
  graph-green: "#1e7e55"
  graph-green-strong: "#176c49"
  graph-orange: "#b86a13"
  error-red: "#c3423f"
  shell-black: "#101010"
typography:
  display:
    fontFamily: "Inter, SF Pro Display, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 720
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, SF Pro Display, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 720
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "Inter, SF Pro Text, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.96rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "0"
  body:
    fontFamily: "Inter, SF Pro Text, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "Inter, SF Pro Text, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0"
  mono:
    fontFamily: "JetBrains Mono, SFMono-Regular, Cascadia Mono, Consolas, monospace"
    fontSize: "0.92rem"
    fontWeight: 520
    lineHeight: 1.25
    letterSpacing: "0"
rounded:
  control: "9px"
  toolbar: "11px"
  panel: "16px"
  window: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.graph-green}"
    textColor: "{colors.surface-glass}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  panel-action:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.toolbar}"
    padding: "0 12px"
    height: "40px"
  expression-input:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 72px 8px 12px"
---

# Design System: Roots Workbench Glass Console

## 1. Overview

**Creative North Star: "The Glass Calculator Desk"**

Roots Workbench should feel like a polished Mac-style answer workstation for numerical analysis. The visual shell frames the app as a focused calculator desk: a dark desktop surround, a translucent work window, a compact method rail, and a Result Console that acts as the trusted answer surface.

This is still product UI. The visual atmosphere must serve repeated classroom work, not become a showpiece. The glass treatment is allowed when it reinforces hierarchy, grouping, and a sense of a premium local tool. Formula entry, method setup, answer confidence, graphs, and iteration tables remain the focal objects.

The system rejects generic dashboards, worksheet PDFs, neon calculator skins, purple-blue AI gradients, and plain wireframes. It also rejects unstructured decoration: every blur, gradient, and shadow must clarify the workstation model.

**Key Characteristics:**
- Mac-like glass workbench shell with a dark outer desk.
- Light, warm calculator surfaces with restrained green and blue action states.
- Compact toolbar and method rail for fast classroom repetition.
- Large math display and root result as the primary visual anchors.
- Tables and graphs treated as evidence surfaces, not decorative widgets.

## 2. Colors

The palette is a warm glass console: cream desktop light, translucent white surfaces, dark ink, green computation states, and blue utility actions.

### Primary
- **Computation Green:** The main solve and convergence color. Use it for the run action, current success states, selected numerical evidence, and high-confidence method states.
- **Utility Blue:** The secondary action color. Use it for focus rings, command affordances, selected tabs when they are utility controls, and links that move the task forward.

### Secondary
- **Graph Orange:** Use for alternate plotted series, warnings in visualizations, and comparison values.
- **Shell Black:** Use only for the outer desktop frame and deep active segmented controls.

### Tertiary
- **Error Red:** Use for invalid expressions, failed runs, impossible intervals, and blocked calculations.

### Neutral
- **Warm Canvas:** The page atmosphere behind the workbench.
- **Glass Surface:** Translucent panel and toolbar material. Use for major work surfaces, popovers, inputs, and result containers.
- **Ink:** Primary text, mathematical labels, and toolbar text.
- **Muted Ink:** Secondary labels, metadata, helper copy, and status text.
- **Line:** Subtle borders, table rules, and panel outlines.

### Named Rules

**The Workbench Color Rule.** Green belongs to computation, blue belongs to utility, orange belongs to comparison, and red belongs to failure. Do not use these colors as decoration.

**The Glass Has A Job Rule.** Translucent material is allowed only on the shell, toolbars, major panels, and popovers. It must make layers easier to understand.

## 3. Typography

**Display Font:** Inter or SF Pro Display with Segoe UI and system-ui fallbacks.
**Body Font:** Inter or SF Pro Text with Segoe UI and system-ui fallbacks.
**Label/Mono Font:** JetBrains Mono with SFMono-Regular, Cascadia Mono, and Consolas fallbacks.

**Character:** The type is modern, compact, and calculator-like. Product labels stay calm and sans-serif. Numeric evidence, expressions, and computed values use mono or math typography to preserve trust.

### Hierarchy
- **Display** (720, 2.5rem, 1.05): Reserved for major workbench titles when shown.
- **Headline** (720, 1.05rem, 1.2): Workflow headings such as Equation Studio and Result.
- **Title** (650, 0.96rem, 1.15): Method labels, panel titles, selected states, and compact headings.
- **Body** (400, 0.94rem, 1.45): Helper text, diagnostics, classroom notes, and short explanations.
- **Label** (650, 0.78rem, 1.2): Toolbar labels, compact metadata, field labels, and tab labels.
- **Mono** (520, 0.92rem, 1.25): Inputs, tolerances, root estimates, iteration values, and copied output.

### Named Rules

**The Numeric Evidence Rule.** Anything the user compares numerically must use mono, math typography, or tabular numerals.

**The No Display Labels Rule.** Never use display typography for buttons, tabs, field labels, or data tables.

## 4. Elevation

Elevation is a hybrid of translucent material, crisp one-pixel borders, inner highlights, and soft long shadows. The outer shell can feel physical. Interior calculator surfaces should stay quiet unless selected, focused, or carrying the primary answer.

### Shadow Vocabulary
- **Glass Window Lift** (`0 30px 90px -44px rgba(0, 0, 0, 0.72)`): Use only on the full workbench window.
- **Glass Surface Lift** (`0 22px 68px -42px rgba(52, 44, 34, 0.62), inset 0 1px 0 rgba(255, 255, 255, 0.74)`): Use on primary translucent panels.
- **Control Press Lift** (`inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 18px 32px -24px rgba(23, 105, 73, 0.78)`): Use on the solve action and selected computation controls.
- **Focus Glow** (`0 0 0 4px rgba(47, 115, 214, 0.14)`): Use only with keyboard focus or active input selection.

### Named Rules

**The Earned Material Rule.** Blur, shine, and shadow are reserved for structure and state. If a surface does not create hierarchy or feedback, keep it flat.

## 5. Components

### Buttons

- **Shape:** Compact rounded rectangles for tool controls (9px to 11px). Never use pills for core calculator actions.
- **Primary:** Computation Green fill with tinted white text, compact height, and a crisp pressed state.
- **Hover / Focus:** Hover raises contrast subtly. Focus uses the Utility Blue outline or glow.
- **Secondary / Ghost / Tertiary:** Secondary actions use glass surface fill, thin borders, and muted hover fills. Toolbar icon buttons stay square and icon-first.

### Chips

- **Style:** Symbol chips are compact, bordered, and math-forward. They can use translucent glass fill when inside the workbench shell.
- **State:** Selected computation chips use Computation Green only when they affect the numerical result. Inactive chips stay neutral.

### Cards / Containers

- **Corner Style:** Major panels use 16px. Controls use 9px to 11px. The outer workbench window uses 24px on desktop.
- **Background:** Major panels use Glass Surface material. Inputs and result objects use brighter glass. Tables use muted glass or surface layers.
- **Shadow Strategy:** See Elevation. Use depth for the shell, popovers, selected surfaces, and answer objects.
- **Border:** Use one-pixel translucent white or neutral borders. Do not use decorative side stripes.
- **Internal Padding:** 16px for compact panels, 22px to 24px for major equation and result surfaces.

### Inputs / Fields

- **Style:** Expression fields are prominent but not oversized. Numeric fields are compact, aligned, and mono.
- **Focus:** Utility Blue border and focus glow. Do not use warm accent focus colors.
- **Error / Disabled:** Error states use Error Red with direct copy. Disabled controls reduce opacity but keep labels readable.

### Navigation

Navigation is a compact workbench control system: top utility toolbar, left method rail, evidence tabs, and segmented settings. Active states must be obvious through fill and text contrast, not decoration.

### Result Console

The Result Console is the signature component. It carries the final root estimate, stopping result, error or residual, freshness, method, and copy action. It should feel like a calculator output drawer, not a generic dashboard card.

### Calculator Notebook

The Calculator Notebook gives the expression a tactile calculator-screen moment. It can use enlarged math typography, a subtle cursor mark, and compact machine status, as long as it does not obscure entry speed.

## 6. Do's and Don'ts

### Do:

- **Do** make the shell feel like a focused Mac-style calculator desk.
- **Do** use glass material on major layers when it clarifies hierarchy.
- **Do** keep the Result Console visually dominant after a run.
- **Do** use Computation Green for solving and convergence, and Utility Blue for focus and commands.
- **Do** keep formulas, graph evidence, and iteration tables clearer than any atmospheric effect.
- **Do** keep touch targets practical on mobile, even when desktop controls are compact.

### Don't:

- **Don't** make the interface look like a generic corporate dashboard.
- **Don't** use purple-blue AI gradients, neon calculator skins, worksheet PDF styling, or plain wireframe styling.
- **Don't** use glass blur as loose decoration. It must define shell, layer, or state.
- **Don't** use side-stripe borders greater than 1px as decorative accents.
- **Don't** use gradient text.
- **Don't** let traffic-light chrome, background gradients, or glass highlights compete with formulas or results.
