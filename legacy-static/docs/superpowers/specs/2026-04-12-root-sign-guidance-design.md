# Root Sign Guidance Design

## Context

The bisection root module currently includes an expandable panel labeled "Advanced sign behavior" with two controls: one for signs shown in the iteration table and one for signs used to choose the next interval. The feature is mathematically useful, but the current wording assumes the user already understands the difference between exact signs and machine signs.

This is confusing for the intended audience: numerical analysis students and instructors checking assignment-style work. The interface should explain the idea before asking the user to choose a setting.

## Goal

Make the sign settings feel like a guided explanation instead of a hidden technical setting. The user should understand:

- Bisection uses the sign of `f(x)` to decide which half of the interval keeps the root.
- Exact signs come from the mathematical value.
- Machine signs come from the selected chopping or rounding rule.
- Showing signs in the table is different from using signs to choose the next interval.
- The recommended default is to show both signs while letting exact signs choose the interval, unless the problem explicitly requires machine-sign decisions.

## Proposed UI

Rename the panel from "Advanced sign behavior" to "How should signs be handled?".

Add a short explanatory paragraph before the dropdowns:

> Bisection checks the signs of `f(a)`, `f(b)`, and `f(c)` to decide which half of the interval keeps the root. Exact signs use the real mathematical value. Machine signs use the chopped or rounded value from your selected digit rule.

Rename the dropdown labels:

- "Show signs as" becomes "Signs shown in the table"
- "Use signs for interval decision" becomes "Signs used to choose the next interval"

Replace the note with a recommendation:

> Recommended for most textbook solutions: show both signs, but let exact signs choose the interval. Choose machine signs only if your professor asks every bisection decision to follow chopping or rounding.

## Behavior

No calculation behavior changes. The existing values remain:

- `root-sign-display`: `both`, `machine`, `exact`
- `root-decision-basis`: `machine`, `exact`

The existing dynamic reasoning note can continue updating when either dropdown changes, but it should stay in plain student-facing language.

## Error Handling

No new error states are required. The existing validation for function expression, interval, significant digits, stopping mode, and stopping value remains unchanged.

## Testing

Run the existing audits after the copy and markup update:

- `node scripts\engine-correctness-audit.js`
- `node scripts\root-engine-audit.js`

If browser verification is available, open the root module and check that the explanation reads clearly in the expanded panel. If the browser tool is blocked by the known Playwright permission issue, record that limitation and rely on source review plus the numerical audits.

## Self-Review

- No placeholders remain.
- The design only changes copy and explanatory hierarchy, not numerical behavior.
- The recommendation explains when to choose exact signs versus machine signs.
- The scope is small enough for one implementation patch.
