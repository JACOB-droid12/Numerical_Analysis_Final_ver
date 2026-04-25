# Roots React Pilot Design

Date: 2026-04-23

## Summary

Migrate only the Roots Workbench into a new isolated `roots-react/` pilot using Vite, React, TypeScript, Tailwind, and npm scripts. The existing static calculator and the current `roots/` standalone app remain intact as working backups.

The first pass uses a typed adapter around the existing tested root-finding engine. It does not rewrite numerical logic. The goal is a working React Roots Workbench that is easier for Codex, Claude Code, and other agentic AI tools to inspect, modify, test, and eventually deploy to Vercel.

## Approved Direction

Use the component-native refinement approach.

This means the React pilot preserves the product workflow and numerical behavior, but does not blindly port the DOM structure. The new app should use React components, TypeScript contracts, method metadata, and local Tailwind styling to make responsibilities clearer.

The approved first-pass stack is:

- Vite
- React
- TypeScript
- Tailwind
- npm scripts

The approved first-pass deferrals are:

- No GSAP in pass 1.
- No shadcn/ui in pass 1.
- No numerical engine conversion in pass 1.
- No edits to the main calculator or existing `roots/` backup in pass 1. A future bridge requires a separate approved plan.

## Why Migrate

The current static Roots Workbench is valuable because it is simple, offline-friendly, and already tested. It should remain available.

The current setup is less friendly for agentic coding tools because behavior depends on DOM IDs, global `window.*` objects, load order, and large files that combine event wiring, state, rendering, copy, graph output, and result formatting. Agents can work on it, but they must infer many contracts from runtime code and are more likely to edit unrelated areas.

The React pilot improves this by giving agents:

- Small files named by responsibility.
- Typed method names, form values, engine requests, run results, and row shapes.
- Repeatable commands such as `npm run dev`, `npm run build`, and `npm run typecheck`.
- A clear adapter boundary between UI and numerical behavior.
- Local styling in the pilot instead of changes to shared global CSS.
- A deployable Vercel root that can be isolated to `roots-react/`.

## Scope

The pilot includes the full Roots calculation workflow:

- Bisection
- Newton-Raphson
- Secant
- False Position
- Fixed Point
- Angle mode behavior
- Machine configuration with significant digits and chopping or rounding
- Iteration-count and tolerance stopping modes
- Answer-first result display
- Copy answer
- Evidence display with diagnostics, graph, solution steps, and iteration table

The pilot does not migrate the rest of the calculator.

The pilot does not replace the current `roots/` app during pass 1.

The pilot does not convert the numerical engine to TypeScript during pass 1.

## Architecture

Add a new `roots-react/` directory at the repository root.

The existing static app remains as-is:

- `index.html`
- `app.js`
- `styles.css`
- `roots/index.html`
- `roots/roots-app.js`
- `roots/roots-state.js`
- `roots/roots-render.js`
- `roots/roots-engine-adapter.js`
- `roots/roots.css`

The new app owns only its isolated files:

- `roots-react/package.json`
- `roots-react/vite.config.ts`
- `roots-react/tsconfig.json`
- `roots-react/tsconfig.node.json`
- `roots-react/tailwind.config.ts`
- `roots-react/postcss.config.js`
- `roots-react/index.html`
- `roots-react/src/`

The React app should load or copy the existing engine dependencies in their current order:

1. `math-engine.js`
2. `calc-engine.js`
3. `expression-engine.js`
4. `root-engine.js`

The first implementation plan should copy the engine files into `roots-react/public/legacy/` so Vite can serve them as static assets. A typed adapter then accesses `window.RootEngine` after the legacy files load.

This preserves the current numerical behavior while keeping the React code isolated.

## Component Boundaries

The React pilot should use focused components:

- `App.tsx`: app shell and top-level layout.
- `components/MethodPicker.tsx`: all five methods, labels, method groups, keyboard-accessible selection.
- `components/AngleToggle.tsx`: degree/radian state and rerun messaging.
- `components/MethodForm.tsx`: renders active method fields from metadata.
- `components/SymbolInsertBar.tsx`: reusable math symbol insertion controls.
- `components/RunControls.tsx`: run action, status, and form-level error placement.
- `components/AnswerPanel.tsx`: approximate root, method, stopping summary, final metric, copy answer.
- `components/EvidencePanel.tsx`: collapsible full work area.
- `components/DiagnosticsPanel.tsx`: interval/sign/decision diagnostics and method warnings.
- `components/ConvergenceGraph.tsx`: graph of iteration path.
- `components/SolutionSteps.tsx`: ordered explanation and copy full solution.
- `components/IterationTable.tsx`: method-specific table headers and rows.
- `components/EmptyState.tsx`: pre-run state.

The state hook should be:

- `hooks/useRootsWorkbench.ts`

It owns:

- active method
- angle mode
- method form state
- cached runs by method
- current error
- current status message
- evidence expanded/collapsed state

## Typed Contracts

Create shared contracts in `src/types/roots.ts`.

The first pass should define explicit types for:

- `RootMethod`
- `AngleMode`
- `MachineMode`
- `MachineConfig`
- `StoppingKind`
- `ToleranceType`
- `StoppingConfig`
- `BracketOptions`
- `MethodFormState`
- `RootRunResult`
- `RootSummary`
- `IterationRow`
- `MethodFieldConfig`
- `MethodConfig`

The result types can start as pragmatic structural types that cover the fields used by the UI. They do not need to model every internal engine field on day one, but every field read by React should be typed.

Method metadata should live in `src/config/methods.ts` and define:

- method label
- method group
- summary
- details
- default form values
- required fields
- advanced fields
- table column definitions
- symbol insertion target

Formatting should live in `src/lib/resultFormatters.ts` and include:

- method display labels
- stop reason labels
- stopping parameter text
- answer copy text
- solution copy text
- interpretation text
- next action text
- method-specific table row mapping

## Adapter Contract

Create `src/lib/rootEngineAdapter.ts`.

The adapter is the only React-side module that calls legacy `RootEngine`.

It should expose a typed function similar to:

```ts
runRootMethod(method, formState, angleMode): RootRunResult
```

The adapter maps typed form state to the current engine option objects:

- `runBisection`
- `runNewtonRaphson`
- `runSecant`
- `runFalsePosition`
- `runFixedPoint`

The adapter should normalize thrown errors into predictable UI failures. React components should not directly depend on DOM IDs or legacy field IDs.

## Calculation Strategy

The React migration includes real calculations in pass 1.

Pass 1 uses the existing tested JavaScript engine through a typed adapter. This preserves current numerical behavior and avoids combining UI migration risk with numerical rewrite risk.

Converting the calculation engine to TypeScript would help eventually because it would remove global load-order assumptions, improve typed contracts, simplify isolated unit tests, and make future agentic refactors safer. That conversion should be planned as a later phase after the React pilot is stable and parity-tested.

The later engine conversion should include parity tests against the current audit scripts before replacing the adapter-backed behavior.

## User Workflow

The first screen is the workbench, not a landing page.

The workflow remains:

1. Choose method.
2. Enter function and method values.
3. Run the method.
4. Copy the approximate answer.
5. Open evidence only when needed.

All five methods remain visible and equally available. False Position and Fixed Point are not hidden behind secondary menus.

The answer panel should remain dominant after a run. Evidence is secondary and should include diagnostics, graph, solution steps, and iteration table.

Desktop layout should use three work zones:

- method rail
- setup workspace
- answer and evidence panel

Mobile layout should stack:

- method selection
- setup
- answer
- evidence

The visual direction remains NET+ and disciplined lab-tool. The migration is not a full redesign.

## Package And Scripts

`roots-react/package.json` should include at least:

- `dev`: start Vite
- `build`: run TypeScript checking and Vite production build
- `typecheck`: run TypeScript without emitting
- `preview`: preview the built app

Testing scripts can be added after the scaffold is stable.

The repository root should not receive a package.json during this pilot. A root package strategy requires separate approval.

## Verification

Existing deterministic audits remain the numerical source of truth:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Because pass 1 does not edit engine files, these audits validate that the legacy behavior remains intact.

React-side verification should include:

- `npm run typecheck` inside `roots-react/`
- `npm run build` inside `roots-react/`
- manual browser smoke test for all five methods
- manual check for angle mode rerun behavior
- manual copy answer and copy solution check

Later verification should add:

- adapter parity tests
- component rendering tests
- repeatable browser workflow tests

## Vercel Strategy

The eventual Vercel project should use `roots-react/` as the project root.

Expected build settings:

- install command: `npm install`
- build command: `npm run build`
- output directory: `dist`

The static calculator and current `roots/` app remain local backups for this pilot. A curated static deployment for them is separate future work.

## Migration Phases

Phase 1: Create the isolated pilot folder and toolchain.

- Add `roots-react/`.
- Add Vite, React, TypeScript, Tailwind, and npm scripts.
- Keep root app files unchanged.

Phase 2: Establish legacy engine loading and typed adapter.

- Copy the current engine dependency files into `roots-react/public/legacy/` in the correct order.
- Add TypeScript declarations for the legacy globals.
- Implement the typed adapter.

Phase 3: Build component-native workbench UI.

- Add method metadata.
- Add method picker.
- Add method forms for all five methods.
- Add angle mode.
- Add run controls and error/status handling.

Phase 4: Render results.

- Add answer panel.
- Add copy answer.
- Add evidence panel.
- Add diagnostics.
- Add convergence graph.
- Add solution steps and copy full solution.
- Add iteration table.

Phase 5: Verify and prepare for deployment.

- Run existing engine audits.
- Run React typecheck and build.
- Smoke-test all five methods.
- Document Vercel project-root settings.

Phase 6: Later numerical engine conversion.

- Plan a separate TypeScript engine extraction.
- Add parity tests before changing numerical behavior.
- Convert shared arithmetic and expression dependencies deliberately.

## Risks And Mitigations

Risk: legacy engine globals are not ready when React runs.

Mitigation: add a dedicated legacy engine loader and render a loading/error state before calculations are enabled.

Risk: copied engine files drift from the root files.

Mitigation: add a small copy/sync script in the implementation plan. Keep root engine audits as the correctness gate.

Risk: TypeScript result types overfit the current UI.

Mitigation: type only the fields the React UI reads in pass 1, then expand contracts when tests require it.

Risk: the pilot becomes a redesign instead of a migration.

Mitigation: keep NET+ direction, answer-first workflow, and all current method capabilities. Defer GSAP, shadcn, and advanced visual polish.

Risk: engine conversion causes numerical drift.

Mitigation: do not convert the engine in pass 1. Treat conversion as a later phase with parity tests.

## Acceptance Criteria

The design is satisfied when the implementation plan can create a `roots-react/` pilot that:

- leaves the current static calculator and `roots/` app intact
- runs as a Vite React TypeScript app
- uses Tailwind for local styling
- includes npm scripts for development, typechecking, building, and previewing
- exposes all five root-finding methods
- preserves angle mode behavior
- computes results through the existing `RootEngine`
- shows the answer-first result workflow
- provides diagnostics, graph, solution steps, and iteration table as secondary evidence
- passes TypeScript and production build checks
- keeps existing engine audits passing
- can later be deployed with Vercel using `roots-react/` as the project root
