# Root Solution Report Design

## Context

The bisection root module already computes the approximate root, interval status, stopping result, convergence summary, sign analysis, and iteration table. To add extra-credit value, the program should also explain the computed result in a short classroom-style solution.

This should support the professor-facing goal: the tool should show that the method is understood, not only that the final root was calculated.

## Goal

Add a `Solution steps` section to the root module with a `Copy solution` action.

The feature should:

- Summarize the function and starting interval.
- Explain the initial sign check.
- State whether the interval brackets a root.
- Explain the stopping rule using the relevant formula.
- Report the approximate root and final error bound.
- Mention the selected significant digits and chopping/rounding rule.
- Copy the same report as plain text for pasting into a document or submission.

## Proposed UI

Add a panel inside `root-result-stage`, after the summary/sign cards and before the iteration table.

Panel title:

> Solution steps

Panel copy should appear as a short ordered list, for example:

1. Start with `f(x) = x^3 + 4x^2 - 10` on `[1, 2]`.
2. Check the endpoint signs: `f(a)` is negative and `f(b)` is positive, so the interval brackets a root.
3. Use the bisection midpoint formula `c = (a + b) / 2` and keep the half-interval with the sign change.
4. With `n = 4`, the error bound is `epsilon <= 0.0625`.
5. The approximate root after the final iteration is `1.4375`.
6. Machine values use `6` significant digits with `rounding`.

Add a button:

> Copy solution

After copying, the button or nearby status text should confirm:

> Solution copied.

## Behavior

The report should be generated from the existing `state.rootRun` object after a successful root computation. It should not change any root-engine behavior.

For invalid brackets or endpoint roots, the report should still explain what happened:

- invalid bracket: endpoint signs do not bracket a root, so bisection cannot proceed on the selected interval
- root at endpoint: one endpoint is already a root

The copy action should use the browser Clipboard API when available. If clipboard access fails, the app should show a short message telling the user to select and copy the text manually.

## Later Extra-Credit Ideas

List these in the docs or keep them as future backlog ideas:

- Graph the interval and mark the approximate root.
- Add professor-style presets, including `x^3 + 4x^2 - 10` on `[1, 2]`.
- Export the iteration table as CSV.
- Suggest a valid bracket if the chosen interval does not bracket a root.
- Compare Bisection with Newton or Secant if those methods were covered in class.

## Testing

Run:

- `node scripts\engine-correctness-audit.js`
- `node scripts\root-engine-audit.js`

Also source-check that the new IDs and copy exist:

- `root-solution-panel`
- `root-solution-steps`
- `root-copy-solution`
- `Solution steps`
- `Copy solution`

## Self-Review

- No placeholders remain.
- The feature is extra-credit aligned but still directly relevant to the bisection assignment.
- The report reuses existing computed data instead of adding a second root-solving path.
- The scope is limited to UI, report formatting, copy behavior, and tests/source checks.
