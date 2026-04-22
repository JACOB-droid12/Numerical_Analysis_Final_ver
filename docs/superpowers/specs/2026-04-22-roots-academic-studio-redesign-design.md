# Roots Academic Studio Redesign Design

## Goal

Redesign the standalone Roots mini app into a warm, academic, answer-first study tool for quiz and worksheet usage. The page should feel like a polished numerical analysis solver rather than a raw calculator form.

This is a Roots-only UI/UX overhaul. It keeps the existing numerical behavior and the main calculator shell unchanged.

## Selected Direction

Use the **Academic Studio** direction:

- Warm parchment and notebook-inspired surfaces.
- Deep green/ink contrast for primary answer areas.
- Clear study-tool hierarchy: setup, answer, explanation, evidence.
- Serious enough for numerical analysis, but friendlier and easier to scan than the current generic panel layout.

The app remains a **single-screen fast calculator with guided sections**, not a multi-step wizard. Users should still be able to pick a method, enter values, run, and read the approximate root without extra navigation.

## Scope

In scope:

- Redesign `roots/index.html` layout structure for the standalone Roots app.
- Redesign `roots/roots.css` visual system, spacing, responsive behavior, and component hierarchy.
- Update `roots/roots-render.js` only where rendering structure or copy needs to support the new answer-first presentation.
- Update `roots/roots-app.js` only if small wiring changes are required for the redesigned UI.
- Update Roots-specific audit scripts when selectors or expectations need to reflect the new layout.

Out of scope:

- Numerical method changes in `root-engine.js`.
- Main calculator redesign in `index.html`, `app.js`, or `styles.css`.
- Companion site changes.
- New persistence, presets, or lesson content.
- A multi-page or wizard flow.

## User Experience

The redesigned screen should follow this order:

1. **Header and workflow promise**: identify the app as the Roots Guided Solver Studio and explain the quick workflow.
2. **Method rail or prominent method selector**: make all methods visible, with the active method clearly selected.
3. **Active method note**: explain when the selected method should be used.
4. **Problem setup**: show function input and method-specific parameters in a compact, scannable area.
5. **Quiz-ready answer**: place the approximate root first after a run, with method, stopping result, stopping parameters, and final metric.
6. **Interpretation and next action**: explain what the result means and what the user should do if they need a tighter or safer answer.
7. **Evidence section**: keep diagnostics, interval analysis, convergence graph, solution steps, copy solution, and iteration table below the main answer.

The default empty state should teach the workflow without looking like an error state.

## Visual System

The visual language should use:

- Parchment/warm paper backgrounds for setup and explanation surfaces.
- Deep green or ink-colored answer cards for the primary answer.
- Soft borders, rounded cards, and layered sections to imply a study notebook.
- Strong typography contrast between labels, answer values, and explanatory copy.
- Clear visual separation between "answer now" and "evidence below."

The design should avoid:

- Generic white cards stacked without hierarchy.
- Overly playful styling that weakens the academic feel.
- Dark dashboard styling that makes long tables harder to read.
- Heavy animations or decorative effects that slow down quiz usage.

## Interaction Rules

Method switching must stay fast and obvious. The active method should update:

- The visible input panel.
- The method guidance title, summary, and details.
- Any method-specific setup copy.

Running a method should still:

- Validate inputs through the existing flow.
- Render the answer-first result stage.
- Preserve diagnostics and warning behavior.
- Preserve graph, solution steps, and iteration table behavior.
- Preserve copy solution behavior.

The redesign should not add mandatory intermediate steps between entering values and running the solver.

## Responsive Behavior

Desktop layout should prioritize a two-zone structure:

- Method guidance/selector stays easy to find.
- Setup and answer areas get the most visual weight.

Tablet and mobile layouts should collapse into a single column:

- Header first.
- Method selector second.
- Problem setup third.
- Quiz-ready answer fourth.
- Evidence sections below.

Touch targets should remain comfortable for method tabs, form controls, and copy buttons.

## Accessibility

The redesign must preserve or improve:

- Semantic landmarks and headings.
- `role="tablist"` / `role="tab"` behavior for method switching.
- `role="tabpanel"` relationships for method-specific controls.
- `aria-live` status and error messaging.
- Visible focus states for keyboard users.
- Sufficient contrast for labels, inputs, answer cards, warnings, and table text.

Decorative visual elements should not create noisy screen reader output.

## Testing

Required verification:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Because this is UI-only, engine tests are not required unless an engine or request-packaging file changes. If `root-engine.js`, shared math engines, or numerical request behavior changes, also run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Live smoke test:

- Open `roots/index.html` in a local static server.
- Run Bisection with `f(x) = x^2 - 2`, `a = 1`, `b = 2`, `n = 4`.
- Confirm the quiz-ready answer renders approximate root `1.4375`.
- Confirm interpretation, next action, diagnostics, graph, solution steps, and iteration table remain reachable.

## Success Criteria

The redesign is successful when:

- A quiz user can identify where to enter values and where to read the answer within a few seconds.
- The approximate root is the dominant result after a run.
- The reason the method stopped is visible without opening a table.
- Detailed proof/evidence remains available without overwhelming the first view.
- The page feels intentionally designed as an academic solver, not a generic form.
- Existing Roots audits pass after being updated for the new layout.

