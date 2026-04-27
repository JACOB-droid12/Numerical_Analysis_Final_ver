# Final Project Requirements Checklist

This checklist maps the Roots Workbench to the professor's project requirements. Legacy remains the default/stable engine. Modern beta is opt-in for testing and comparison.

For a step-by-step classroom presentation script, see [PROFESSOR_DEMO_CHECKLIST.md](./PROFESSOR_DEMO_CHECKLIST.md).

| Professor Requirement | App Feature | Status | Notes |
|---|---|---|---|
| Approximate roots of functions / equations in one variable. | Roots Workbench supports Bisection, False Position, Secant, Fixed Point, and Newton-Raphson. | Covered | Use `x` as the variable. |
| Choose one method among discussed methods. | Method rail lets users choose Bisection, Newton-Raphson, Secant, False Position, or Fixed Point. | Covered | Recommended demo method: Bisection. |
| Input values/expressions efficiently. | Equation Studio provides expression fields, method-specific inputs, presets, math key helper, and quick command menu. | Covered | Expressions support powers, parentheses, constants, and common functions. |
| Maximum allowable significant digits. | Computation settings provide `Digits` per method. | Covered | Legacy uses this for machine arithmetic. Modern beta uses it for display/table/CSV formatting. |
| Identify approximate solution in an interval. | Bracket methods accept interval `[a, b]`; Bisection helper shows bracket validity and solution interval behavior. | Covered | Use Bisection demo `[1, 2]`. |
| Identify signs of functions / evaluate functions. | Classroom tools show `f(a)`, sign of `f(a)`, `f(b)`, sign of `f(b)`, and whether `f(a) * f(b) < 0`. | Covered | This directly supports IVT/bracket validation. |
| Determine roots of a function. | Result panel displays the approximate root and stopping result. | Covered | Tables and graph provide supporting work. |
| Determine number of iterations to achieve desired tolerance. | Bisection helper computes `N = ceil(log2((b - a) / epsilon))`. | Covered | Intended for classroom Bisection setup. |
| Determine tolerance/epsilon given number of iterations. | Bisection helper computes `epsilon = (b - a) / 2^N`. | Covered | Shows the guaranteed Bisection interval bound. |
| Apply evaluations/operations/iterations with explicitly identified digits, chopped or rounded. | Computation settings provide `Digits` and `Rule: Round/Chop`. | Covered with mode distinction | Legacy applies these during calculations. Modern beta applies these to displayed final root/table/CSV values only. |
| Present tabular iteration results. | Evidence workspace includes method-aware iteration tables. | Covered | Modern beta uses classroom notation such as `n`, `a_n`, `b_n`, `p_n`, `f(p_n)`, and Approx. Error. |
| Support polynomial functions. | Expression engine supports polynomial expressions such as `x^3 + 4*x^2 - 10`. | Covered | Recommended demo equation is polynomial. |
| Support transcendental functions. | Expression support includes `sin`, `cos`, `tan`, `exp`, `ln/log`, `sqrt`, and `cbrt`. | Covered | Transcendental examples are recommended as extended tests. |

## Recommended Demo

Use Bisection for the main professor demo:

```text
f(x) = x^3 + 4*x^2 - 10
[a, b] = [1, 2]
```

Expected setup:

```text
f(1) = -5
f(2) = 14
f(a) * f(b) < 0
```

Expected result:

```text
root near 1.365
```

Expected table columns:

```text
n | a_n | b_n | p_n | f(p_n)
```

Modern beta table notation:

```text
n | aₙ | bₙ | pₙ | f(pₙ) | Approx. Error
```

## Recommended Quiz / Problem-Set Verification Cases

Use these for final classroom validation:

| Topic | Case | Expected |
|---|---|---|
| Bisection signs | `x^3 + 4*x^2 - 10` on `[1, 2]` | Valid bracket, root near `1.365` |
| Newton-Raphson | `f(x)=x^2 - 2`, `f'(x)=2*x`, `x0=1` | Root near `sqrt(2)` |
| Newton correction column | Same Newton case | Table shows `f(p_n)/f'(p_n)` |
| Round-off | `pi`, `k=5`, chop | `3.1415` |
| Round-off | `pi`, `k=5`, round | `3.1416` |
| Error calculation | true `1.73205081`, approx `1.7325897` | absolute error about `0.00053889`; relative error about `0.00031113`; significant digits `4` |
| Transcendental support | `cos(x) - x` | Root near `0.739085` in radians |
| Log support | `ln(x) - 1` on `[2, 4]` | Root near `e` |

## Legacy vs Modern Beta

Legacy is the default engine used by the current app. It runs through:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern beta is an opt-in comparison engine. It runs through:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> TypeScript methods -> math.js evaluator
```

Modern beta is tested against unit tests, Playwright smoke tests, side-by-side Legacy comparisons, and mpmath golden oracle fixtures, but it is not the default.

## Computation Settings

The top Computation settings panel is the single source of truth for digit/rule presentation:

```text
Digits
Rule: Round / Chop
Stop by
```

Legacy behavior:

```text
Digits and Rule affect Legacy method calculations.
```

Modern beta behavior:

```text
Digits and Rule affect displayed final root, table values, and CSV/export values only.
Modern beta internal calculations use standard precision.
```

This distinction is intentional so Modern beta can preserve high-precision raw details while still showing classroom-compatible chopped or rounded values.

## Approx. Error Meaning

`Approx. Error` means the difference between successive approximations, such as:

```text
|p_n - p_(n-1)|
```

It is not true error unless an exact root is known.

## Known Limitations

- Symbolic differentiation is deferred.
- Modern beta is not the default engine.
- Modern beta machine arithmetic is currently display-only.
- Fixed Point multi-formula ranking mode for quiz-style comparison problems is not fully implemented.
- Legacy and Modern beta may differ in stop reason labels, iteration counts, and row details even when the final root agrees.
