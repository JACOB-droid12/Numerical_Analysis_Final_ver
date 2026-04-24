# Roots React UI/UX Foundation Design

## Context

The Roots React pilot already preserves the legacy root-finding behavior through the React adapter and synced legacy engine files. The next phase should improve the app shell before adding new features, so future work has stable places to land.

The approved direction is a hybrid:

- professional calculator/workbench at the core,
- modern premium product surface around it,
- no numerical engine rewrite,
- no legacy static app changes.

This phase applies only to `roots-react/` and release documentation if needed.

## Goals

1. Make the answer-first workflow obvious: method -> inputs -> run -> copy answer.
2. Make the app feel modern without making the math feel decorative or secondary.
3. Give future agentic coding tools clearer component boundaries.
4. Preserve all existing methods, angle mode behavior, cached run behavior, diagnostics, graph, steps, and iteration table.
5. Keep the React pilot ready for Vercel deployment and CI verification.

## Non-Goals

- Do not change `root-engine.js` numerical behavior.
- Do not rewrite the adapter unless layout changes expose a genuine contract problem.
- Do not add new numerical methods.
- Do not add save/share/export/session features yet.
- Do not add AI explanation features yet.
- Do not edit `index.html`, `app.js`, `styles.css`, or `roots/`.
- Do not make a marketing landing page around the tool.

## Product Shape

Use a command-workbench layout with selected premium polish.

Desktop layout:

```text
Left rail       Center work area             Right answer rail
-----------     -----------------------      ---------------------
Method list     Expression/input composer    Answer card
Angle mode      Symbol bar                   Confidence/status
Method meta     Run controls                 Evidence preview
```

Expanded evidence remains below or behind a clear disclosure:

```text
Full work
Diagnostics | Graph | Solution steps | Iteration table
```

Mobile layout stacks in workflow order:

```text
Header
Method selector
Inputs
Run controls
Answer
Evidence preview
Full work
```

## Visual Direction

The current dark slate shell is serviceable but too generic and card-heavy. Replace it with a more intentional product surface:

- restrained dark neutral base,
- sharper NET+ identity through a controlled accent system,
- fewer nested card borders,
- stronger answer typography,
- clearer rail/work-area separation,
- compact method controls,
- lighter evidence hierarchy.

Typography should remain readable and practical. The UI should not use oversized hero-page typography because this is an operational calculator, not a landing page.

## Component Architecture

Keep existing behavior-heavy pieces, but reorganize presentation into clearer shell components:

| Component | Responsibility |
|-----------|----------------|
| `WorkbenchShell` | Page frame, responsive grid, major regions |
| `WorkbenchHeader` | NET+ identity, short context, angle toggle |
| `MethodRail` | Method selection and compact method metadata |
| `InputComposer` | Expression field, method fields, symbols, run controls |
| `AnswerRail` | Answer, copy action, confidence/status, evidence preview |
| `FullWorkTabs` | Diagnostics, graph, steps, iteration table |

Existing components can be reused inside these boundaries:

- `MethodPicker` becomes part of `MethodRail`.
- `MethodForm`, `SymbolInsertBar`, and `RunControls` become part of `InputComposer`.
- `AnswerPanel`, `ConfidenceSummary`, and `EvidencePreview` become part of `AnswerRail`.
- `EvidencePanel` should become tabbed or segmented through `FullWorkTabs`.

Do not split numerical or state logic out of `useRootsWorkbench` during this phase unless a small presentational helper is necessary.

## Data Flow

The data flow remains unchanged:

```text
useRootsWorkbench
  -> active method/config/form state
  -> adapter-backed run action
  -> displayRun/displayConfig
  -> presentation components
```

Presentation components receive typed props only. They should not call the legacy engine directly.

## Interaction Design

Primary workflow:

1. Select a method.
2. Edit the expression and method inputs.
3. Run the method.
4. Read and copy the approximate root.
5. Inspect confidence and evidence only when needed.

Required interactions:

- Method controls keep clear active state.
- Angle mode remains visible but secondary.
- Copy answer stays prominent in the answer rail.
- Stale result state remains obvious when inputs change after a run.
- Full work can expand without pushing the answer out of context on desktop.
- Evidence sections use tabs or segmented controls so the page is not a long wall of panels by default.

## Motion

Use GSAP only if it improves state clarity. This phase should not introduce cinematic landing-page motion.

Allowed motion:

- subtle entrance for answer/evidence after a successful run,
- smooth full-work expand/collapse,
- small active-method transition,
- reduced-motion fallback.

Avoid:

- scroll-pinning,
- large parallax,
- decorative animated backgrounds,
- motion that delays solving.

## Accessibility

- Preserve semantic regions for method input, answer, and full work.
- Keep keyboard operation for method selection, inputs, copy button, evidence toggles, and tabs.
- Maintain visible focus states.
- Ensure answer values wrap without overflowing.
- Respect `prefers-reduced-motion`.
- Keep contrast strong enough for dark UI.

## Responsive Requirements

Desktop:

- three-region workbench should fit without horizontal scrolling,
- answer rail must remain visually prominent,
- evidence preview should not crowd the answer.

Tablet:

- method rail can compress into a top segmented section,
- answer can move below inputs if needed.

Mobile:

- single-column workflow order,
- no text overlap,
- controls maintain touch-friendly size,
- full work defaults collapsed.

## Testing And Verification

Before completing implementation:

1. Run `.\scripts\roots-react-release-check.ps1`.
2. Confirm no diff in `index.html`, `app.js`, `styles.css`, or `roots/`.
3. Browser-check desktop and mobile viewports.
4. Run at least one calculation for:
   - Bisection,
   - Newton-Raphson,
   - Secant,
   - False Position,
   - Fixed Point.
5. Verify:
   - answer appears,
   - copy button works or reports failure clearly,
   - stale result state appears after input edits,
   - evidence preview appears,
   - full work tabs/sections are reachable,
   - no console errors.

## Implementation Notes

- Keep Tailwind as the styling system.
- Keep `lucide-react` for icons.
- Use existing `Button` and `cn` helpers where possible.
- Add small UI primitives only when they reduce duplication.
- Do not add shadcn/ui during this phase unless a specific component gap becomes costly.
- Do not add new dependencies beyond GSAP usage already installed.

## Success Criteria

The phase is successful when the Roots React pilot feels like a modern, serious workbench and future features have obvious insertion points, while calculation behavior remains unchanged and the release gate passes.
