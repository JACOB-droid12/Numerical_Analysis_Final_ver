# Roots Guided Solver Studio Design

Date: 2026-04-22
Topic: Roots Phase 3 guided solver UX
Status: Approved design direction, awaiting user review before implementation planning

## Goal

Redesign the Roots mini app into a fast, quiz-friendly Guided Solver Studio.

The app should still behave like a calculator: choose a method, enter values, run, and get the answer quickly. The difference is that the experience should feel intentional, visually clear, and useful under time pressure. The approximate root should be the first thing the user sees, followed by the reason the method stopped and the shortest useful interpretation of what to do next.

## Selected Direction

Use Direction A: Guided Solver Studio.

This direction was selected because it is the best fit for quiz and fast calculator usage:

- It preserves quick method switching.
- It keeps the answer path short.
- It gives enough guidance for students without forcing a slow wizard flow.
- It makes successful and failed runs easier to interpret.

Direction B, Method Lab Console, is better for deep instructor-style trace inspection but risks feeling too dense for quiz speed. Direction C, Workbook Flow, is better for assignment preparation but risks slowing down users who only need a fast calculator.

## UX Thesis

Answer first, explanation second, trace third.

The current Roots mini app has the right technical pieces: tabs, inputs, diagnostics, graph, solution steps, and iteration table. The issue is that those pieces still read as a functional shell rather than a focused product experience. Phase 3 should turn the existing pieces into a coherent solver interface.

The redesigned flow should communicate:

1. What method am I using?
2. What inputs are required?
3. What is the approximate root?
4. Why did the method stop?
5. What should I do next if the result is incomplete or invalid?
6. Where can I inspect the table or copy the solution?

## Primary User Scenario

A student is taking a quiz or solving a worksheet problem. They need to:

- pick Bisection, Newton-Raphson, Secant, False Position, or Fixed Point quickly,
- enter the function and required starting values,
- set the machine precision and stopping rule,
- run the method,
- copy or read the approximate root and stopping explanation,
- inspect the iteration table only if needed.

The app should reduce visual searching. A correct run should feel like a fast calculator. A failed run should feel recoverable rather than cryptic.

## Scope

This is a Roots mini-app UX pass.

Likely files to modify:

- `roots/index.html`
- `roots/roots.css`
- `roots/roots-render.js`
- `scripts/roots-mini-app-static-audit.js`
- `scripts/roots-mini-app-ui-audit.js`

Possible files to modify only if needed:

- `roots/roots-state.js`
- `roots/roots-app.js`

Avoid unless a clear UI requirement exposes missing data:

- `root-engine.js`

Do not edit for ordinary Roots UX work:

- `index.html`
- `app.js`
- `styles.css`

The main calculator should remain only a bridge to `roots/index.html`.

## Visual And Layout Direction

The page should feel like a focused numerical solving workspace, not a generic form page.

Required visual changes:

- Introduce a stronger page hero for Roots with a concise product promise.
- Make the method tabs feel like solver modes, not plain buttons.
- Create a compact selected-method solver panel with the active method, required inputs, and run action.
- Make the result stage read as a quiz answer panel.
- Visually demote secondary material: diagnostics, graph, solution steps, and iteration table should be easy to find but not compete with the approximate root.
- Improve spacing and grouping so inputs, result, and trace each have a distinct role.

The visual direction should be polished but not flashy. This is still a numerical analysis tool, so clarity and speed win over decorative intensity.

## Fast Calculator Behavior

The redesign should preserve direct manipulation:

- No multi-screen wizard.
- No required onboarding modal.
- No hidden required fields.
- No extra confirmation before running.
- Method tabs remain visible.
- The run button remains close to the expression input.
- Existing defaults continue to allow a quick successful Bisection run.

Guidance should be inline and compact. It should help users move faster, not slow them down.

## Result Experience

The result stage should be reorganized around a primary quiz-ready answer.

Primary result content:

- approximate root
- method name
- stopping result
- stopping parameters
- final error or bound when available
- short interpretation line
- short next action line

Example successful interpretation:

```text
The requested iterations completed. Use this root if your quiz asks for n = 4.
```

Example next action:

```text
Need a tighter answer? Increase n or switch to tolerance mode.
```

Example invalid bracket guidance:

```text
The endpoints do not bracket a sign change. Try values where f(a) and f(b) have opposite signs.
```

The existing diagnostics should still appear, but the user should not need to parse diagnostic cards to understand the basic outcome.

## Method-Specific Guidance

Each method should get compact guidance in the selected solver panel and result interpretation.

Bisection:

- Emphasize interval and sign change.
- Explain whether exact or machine signs decide the interval.
- For epsilon mode, clearly distinguish absolute and relative tolerance.

False Position:

- Emphasize interval and interpolation.
- Explain retained-endpoint stagnation as a known behavior, not a crash.

Newton-Raphson:

- Emphasize starting point and derivative.
- Explain zero derivative and unstable steps in plain language.

Secant:

- Emphasize two starting points and no derivative.
- Explain denominator stagnation or repeated points clearly.

Fixed Point:

- Emphasize that the user enters `g(x)`, not `f(x)`.
- Explain convergence risk with `|g'(x)| < 1` near the fixed point.
- Explain cycles and divergence as iteration behavior.

## Edge-Case Guidance

The UI should provide specific next steps for common non-success states:

- invalid bracket: choose endpoints with opposite signs
- discontinuity or singularity: choose an interval or guess away from undefined points
- derivative zero: change the starting point or check the derivative
- stagnation: change starting guesses or method
- divergence: choose a closer starting point, reduce step risk, or use a bracket method
- cycle detected: choose a different fixed-point form or starting value
- iteration cap: increase max attempts only if the trend is improving
- tolerance not reached: increase iterations or loosen epsilon

These messages belong in rendering/UI interpretation. The numerical engine should remain unchanged unless the UI cannot infer the needed state from current run data.

## Copy-Ready Output

The copy solution behavior should remain, but Phase 3 should make copied output more quiz-friendly.

The copied text should prioritize:

- method name
- function
- machine precision and rule
- stopping condition
- approximate root
- stopping reason
- concise solution steps

This does not need to become a full worksheet export. It should remain short enough to paste into quiz notes or a calculator proof area.

## Data Flow

The existing engine and adapter flow should remain:

```text
roots/index.html controls
-> roots/roots-app.js reads fields
-> roots/roots-engine-adapter.js builds RootEngine request
-> root-engine.js returns run package
-> roots/roots-render.js renders result, diagnostics, graph, steps, and table
```

Phase 3 should add interpretation in `roots/roots-render.js` using existing `run.summary`, `run.stopping`, `run.rows`, `run.warnings`, and method metadata.

If a small state helper is needed for method labels or copy text, it can live in `roots/roots-state.js`. Avoid adding a broad new architecture layer unless the implementation plan proves the render file would become too tangled.

## Accessibility

The redesigned UI must keep or improve accessibility:

- Preserve tab semantics for method selection.
- Preserve live-region behavior for diagnostics/status.
- Keep keyboard focus visible.
- Keep form labels explicit.
- Keep table headers and responsive table behavior.
- Avoid relying on color alone for stop states or warnings.
- Ensure the primary answer panel remains readable on mobile.

## Responsive Behavior

Mobile use matters for quiz scenarios.

Required behavior:

- Method tabs wrap cleanly and remain easy to tap.
- The selected solver panel becomes a single-column layout.
- The approximate root remains visible before the table.
- Tables stay horizontally scrollable.
- Copy and run actions remain reachable without excessive scrolling.

## Testing And Audits

Run after implementation:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Also run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Run the engine audits if implementation changes `root-engine.js` or depends on engine output assumptions. Running the full set is recommended because this is a broad Roots UX pass.

Static/UI audits should be extended to protect new landmarks, such as:

- primary quiz answer panel
- interpretation or next-action text
- method guidance shell
- copy-ready solution behavior
- responsive table and result hierarchy

## Success Criteria

The design succeeds if:

- a student can run a default Bisection example quickly,
- the approximate root is visually dominant,
- the stopping reason is understandable without reading the table,
- failed or incomplete runs provide a concrete next action,
- method switching remains fast,
- graph, table, diagnostics, and solution steps remain available,
- the app feels like a real Roots calculator experience instead of a plain detached form.

## Non-Goals

- Do not redesign the main calculator shell.
- Do not introduce a framework or build system.
- Do not turn the app into a required step-by-step wizard.
- Do not add backend behavior.
- Do not change numerical algorithms for visual reasons.
- Do not expand into companion-site work.
- Do not remove existing advanced finite-precision controls.

## Implementation Planning Notes

The implementation plan should break this into small tasks:

1. Add static audit expectations for new UX landmarks.
2. Restructure the Roots HTML result and solver shell.
3. Add render helpers for interpretation and next action text.
4. Update copy-ready solution text.
5. Polish CSS for desktop and mobile hierarchy.
6. Run the full Roots verification set.

The plan should favor incremental commits and keep the math engine untouched unless a specific missing field blocks the approved UX.
