# Root Module Hardening Design

Date: 2026-04-13
Project: Numerical Analysis Teaching Lab
Status: Approved design, pending implementation plan

## Summary

Harden the Roots module around the four issues found during the student/professor QA pass. The scope is intentionally narrow: improve result integrity, sign explanation consistency, angle-mode resilience, and exact-versus-machine disagreement visibility without changing the bisection method itself.

## Goals

- Prevent invalid brackets from displaying a usable-looking approximate root.
- Keep trigonometric root results consistent with the active angle mode.
- Make solution-step prose follow the selected decision basis: exact signs or machine signs.
- Explicitly warn when exact and machine signs disagree at endpoints or iteration points.

## Non-Goals

- Add new root-finding methods.
- Redesign the Roots module layout.
- Change the bisection stopping formulas.
- Refactor unrelated machine arithmetic, polynomial, error analysis, or IEEE-754 modules.

## Targeted Changes

### Invalid Bracket Output

When `RootEngine` returns `intervalStatus: "invalid-bracket"`, the primary `Approximate root` card should show `N/A` or `No approximation`, not the left endpoint. The solution steps should continue explaining that the selected interval does not bracket a root and that the user must choose a new interval.

### Angle Mode Resilience

The Roots module already sends `state.angleMode` into `RootEngine.runBisection()`. When the global angle mode changes, an existing Roots result must not remain stale. The preferred behavior is to recompute the Roots result if one exists and the current inputs are still valid; clearing the result with a short status message is acceptable if recomputation would be riskier. The visible Roots copy should also mention that trig functions use the current Angle setting in the sidebar.

### Decision-Basis Solution Text

`buildRootSolutionSteps()` should describe the endpoint signs using the same sign basis that the solver used to decide the interval. If `run.decisionBasis` is `machine`, the prose should say machine signs are being used and should not describe a machine-zero endpoint as positive just because the exact sign is positive. If `run.decisionBasis` is `exact`, the prose should keep the textbook explanation based on exact signs.

### Exact/Machine Sign Disagreement Warnings

The initial sign analysis should explicitly note when exact and machine signs differ at `a` or `b`. Iteration rows should include notes for disagreement at `a`, `b`, or `c`, not only the midpoint. These notes should be short enough to remain readable in the existing table and mobile stacked-row layout.

## Implementation Sketch

- Update `root-engine.js` to provide endpoint and row-level sign-disagreement metadata or richer note text.
- Update `app.js` to render invalid-bracket approximations as `N/A` and to generate solution steps from the active decision basis.
- Update `app.js` angle-mode refresh behavior so Roots results are recomputed or cleared when DEG/RAD changes.
- Update `index.html` Roots helper copy to mention the active Angle setting for trig functions.
- Keep existing element IDs and control values so current event wiring and tests remain stable.

## Verification Plan

Run the existing automated checks:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Run browser checks:

- `x^2 + 1` on `[0, 1]` shows no approximation for an invalid bracket.
- `sin(x) - x/2` on `[1, 2]` does not leave stale output when switching DEG/RAD.
- `((10000 + x) - 10000)` on `[-2, 2]` with `k = 1`, chopping, and machine signs deciding has internally consistent solution prose.
- Exact/machine sign disagreements appear in the sign summary or table notes.

## Self-Review

- No placeholders remain.
- Scope is limited to the four QA findings.
- The design keeps the existing bisection algorithm and stopping formulas unchanged.
- The angle-mode behavior is explicit and does not allow stale trig results to remain silently visible.
- Exact and machine signs are treated as separate concepts in both computed results and teaching prose.
