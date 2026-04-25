---
name: Numerical Analysis Teaching Lab
description: A modern, beautiful, math-first calculator lab for numerical analysis learning.
colors:
  canvas: "#f7f8f5"
  surface: "#fcfcf8"
  surface-raised: "#ffffff"
  surface-muted: "#eef0eb"
  ink: "#171817"
  ink-muted: "#646964"
  ink-soft: "#8b918b"
  line: "#e0e4dd"
  line-strong: "#c9d0c6"
  action-blue: "#1f6feb"
  action-blue-strong: "#1557c0"
  graph-green: "#16855f"
  graph-orange: "#c66a18"
  error-red: "#c23934"
  warning-amber: "#a86500"
  dark-canvas: "#111312"
  dark-surface: "#191c1b"
  dark-ink: "#f0f2ed"
typography:
  display:
    fontFamily: "Inter, SF Pro Display, Segoe UI, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, SF Pro Display, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "0"
  title:
    fontFamily: "Inter, SF Pro Text, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Inter, SF Pro Text, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Inter, SF Pro Text, Segoe UI, system-ui, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0"
  mono:
    fontFamily: "JetBrains Mono, SFMono-Regular, Cascadia Mono, Consolas, monospace"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.surface-raised}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  input-expression:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  result-surface:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  graph-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Numerical Analysis Teaching Lab

## 1. Overview

**Creative North Star: "The Modern Math Console"**

This system is the target new design direction, not a record of the old UI. It should feel like a premium online calculator built for numerical analysis: fast, quiet, exact, and beautiful. The reference mix is Apple for spatial discipline and finish, and Desmos for approachable mathematical interaction.

The design serves students, instructors, and self-guided learners who need to enter formulas, compare exact and finite-precision results, inspect graphs, and understand iteration behavior. The interface must make the relationship between input, method, result, graph, and explanation feel immediate.

It explicitly rejects the old warm foundry look, decorative academic paper styling, generic dashboard patterns, neon calculator skins, and any visual effect that competes with formulas or graphs.

**Key Characteristics:**
- Clean light-first calculator surface with a practical dark mode.
- One primary action color used with discipline.
- System-sans typography for modern product clarity.
- Mono math values for exact comparison and trust.
- Spacious enough to feel premium, dense enough for repeated coursework.
- Graphs, tables, and result panels treated as first-class calculator surfaces.

## 1.1 Final Shaped Direction: Console First

**Console First** is the selected production direction for the Roots React workbench redesign.

The Roots workbench should behave like a focused answer workstation for students taking examinations and quizzes. It starts blank, expects students to enter their own quiz problem, and keeps one selected numerical method active at a time. The interface should prioritize confident answer entry, fast method setup, and immediate numerical evidence over guided teaching copy.

### Layout Model

- **Left method rail:** A compact method picker for Bisection, Newton, Secant, False Position, and Fixed Point. Only one method is selected at a time.
- **Center work stack:** The main equation input, method-specific parameters, tolerance controls, and calculate/reset actions.
- **Right Result Console:** The primary visual anchor. It shows the final root estimate, convergence status, tolerance, iteration count, and the shortest useful interpretation.
- **Supporting evidence:** Graph and iteration table sit below or adjacent to the result console as evidence, not as competing primary panels.

### First Load

- Start blank. Do not preload a sample equation.
- Show the method picker and equation input immediately.
- Keep result, graph, and iteration evidence in empty states until the student runs a calculation.
- Empty states should be quiet and functional, not instructional marketing.

### Exam UX Rules

- Keep the screen task-focused and low-distraction.
- Avoid long teaching prose in the primary workflow.
- Make invalid input, non-convergence, and interval mistakes obvious without moving the student away from the workbench.
- Preserve keyboard-friendly entry for formulas and numeric parameters.
- On mobile, stack solve-first: equation input, selected method parameters, calculate action, Result Console, then graph and table.

## 2. Colors

The palette is restrained, modern, and math-first: cool-tinted neutrals, one confident blue action color, and semantic graph colors used only when they clarify data.

### Primary
- **Action Blue**: The single primary product accent. Use for primary buttons, selected controls, focus states, active tabs, and links that move the task forward.
- **Action Blue Strong**: The hover, active, and pressed state for Action Blue.

### Secondary
- **Graph Green**: Use for converged states, positive method confidence, and one plotted series when graph comparison is needed.
- **Graph Orange**: Use for alternate plotted series, warnings in visualizations, and comparison methods.

### Tertiary
- **Error Red**: Use for invalid expressions, failed numerical runs, impossible intervals, and blocked calculations.
- **Warning Amber**: Use for caution states where a calculation completes but interpretation is unstable or sensitive.

### Neutral
- **Canvas**: The page background. Slightly tinted so the app never feels like a blank document.
- **Surface**: Standard panels, graph shells, and grouped work areas.
- **Surface Raised**: Inputs, result panels, selected cards, and the most interactive calculator surfaces.
- **Surface Muted**: Hover fills, subtle grouping, table headers, and inactive selected-adjacent states.
- **Ink**: Primary text and mathematical labels.
- **Ink Muted**: Secondary instructions, helper text, and metadata.
- **Ink Soft**: Disabled or tertiary explanatory text.
- **Line / Line Strong**: Dividers, panel outlines, table rules, and control borders.
- **Dark Canvas / Dark Surface / Dark Ink**: Practical dark-mode primitives only. Dark mode is a working environment, not a neon identity.

### Named Rules

**The One Accent Rule.** Action Blue is the only primary accent. Do not introduce copper, purple, gold, or academic paper colors from the previous design.

**The Graph Color Rule.** Green and orange belong to plotted data, convergence, and method comparison. They are not decorative theme colors.

## 3. Typography

**Display Font:** Inter or SF Pro Display, with Segoe UI and system-ui fallbacks.
**Body Font:** Inter or SF Pro Text, with Segoe UI and system-ui fallbacks.
**Label/Mono Font:** JetBrains Mono, with SFMono-Regular, Cascadia Mono, and Consolas fallbacks.

**Character:** Typography should feel modern, technical, and calm. Use one strong sans family for product coherence, then reserve mono for expressions and numeric evidence.

### Hierarchy
- **Display** (700, 2.5rem, 1.05): Product title and major workbench headers only.
- **Headline** (650, 1.75rem, 1.12): Main panel headings and key result groups.
- **Title** (650, 1rem, 1.25): Form groups, result cards, graph titles, and method sections.
- **Body** (400, 1rem, 1.55): Guidance, descriptions, and explanatory copy with a target line length of 65 to 75 characters.
- **Label** (650, 0.76rem, 1.2): Field labels, compact metadata, axis labels, tab labels, and table headers.
- **Mono** (500, 0.95rem, 1.4): Expressions, tolerances, root estimates, iteration values, and computed output.

### Named Rules

**The Modern Product Type Rule.** Do not use serif display typography in the new design. This should feel like a precise modern calculator, not a paper handout.

**The Mono Evidence Rule.** Any value the user compares numerically must use mono or tabular numerals.

## 4. Elevation

The new system uses restrained depth: mostly tonal separation, crisp 1px lines, and one soft shadow tier for surfaces that are active, selected, or carrying the primary answer. Shadows must feel like Apple-style physical softness, never heavy dashboard cards.

### Shadow Vocabulary
- **Surface Lift** (`0 1px 2px rgba(23, 24, 23, 0.05), 0 12px 30px -18px rgba(23, 24, 23, 0.22)`): Use for focused result panels, active popovers, and selected calculator surfaces.
- **Control Focus Glow** (`0 0 0 4px rgba(31, 111, 235, 0.14)`): Use only with a focused input or selected segmented control.

### Named Rules

**The Earned Depth Rule.** Depth appears when a surface is interactive, selected, or primary. Static panels stay flat.

## 5. Components

### Buttons

- **Shape:** Familiar rounded rectangles (8px), never pill buttons for core calculator actions.
- **Primary:** Action Blue fill, white-tinted text, 650 weight, and compact 10px by 16px padding.
- **Hover / Focus:** Hover uses Action Blue Strong. Focus uses a visible blue outline or glow.
- **Secondary / Ghost / Tertiary:** Secondary buttons use raised white surfaces, 1px Line borders, and subtle Surface Muted hover. Tertiary actions are text buttons only when the action is low-risk and inline.

### Chips

- **Style:** Symbol chips and method chips use compact rounded rectangles, neutral borders, and mono math labels where appropriate.
- **State:** Selected chips use Action Blue only when selection affects computation. Inactive chips stay neutral.

### Cards / Containers

- **Corner Style:** 12px for panels and result surfaces, 8px for controls.
- **Background:** Surface for grouped work areas, Surface Raised for inputs and primary result surfaces.
- **Shadow Strategy:** Flat by default. Surface Lift only for the active result or selected surface.
- **Border:** 1px Line by default. Line Strong only for high-emphasis boundaries or table structure.
- **Internal Padding:** 16px for compact panels, 24px for major graph or result areas.

### Inputs / Fields

- **Style:** Expression fields are prominent, rounded, and mono. Standard numeric fields are compact but never cramped.
- **Focus:** Blue outline or Control Focus Glow. Do not use copper, gold, dashed, or paper-like emphasis.
- **Error / Disabled:** Error states use Error Red with direct copy. Disabled fields reduce contrast but keep labels readable.

### Navigation

Navigation should feel like a modern calculator workbench: predictable tabs or a compact rail, clear active states, and no decorative brand rail. Active navigation uses Action Blue and Surface Raised, not old accent colors or side-stripe decoration.

### Signature Component

The **Result Console** is the new primary answer surface. It combines the final value, convergence status, tolerance, and short explanation in one visually connected unit. It should feel closer to a Desmos result drawer than an academic card.

## 6. Do's and Don'ts

### Do:

- **Do** make the input, selected method, graph, iteration table, and final result feel connected.
- **Do** use Action Blue as the single primary accent.
- **Do** use system-sans typography for the product shell and mono typography for mathematical evidence.
- **Do** keep controls familiar, fast, and keyboard-friendly.
- **Do** design graph and result surfaces as core calculator objects, not supporting decoration.
- **Do** keep dark mode calm, readable, and practical.

### Don't:

- **Don't** reuse old warm foundry, copper, gold, sage, or decorative paper styling.
- **Don't** use serif display typography for the new product direction.
- **Don't** use neon, glassmorphism, purple-blue AI gradients, or heavy decorative backgrounds.
- **Don't** make the app look like a generic corporate dashboard.
- **Don't** let decoration compete with formulas, graphs, iteration tables, or result summaries.
- **Don't** use side-stripe borders greater than 1px as decorative accents on cards or callouts.
- **Don't** use gradient text.
- **Don't** use identical card grids for core calculator workflows.
