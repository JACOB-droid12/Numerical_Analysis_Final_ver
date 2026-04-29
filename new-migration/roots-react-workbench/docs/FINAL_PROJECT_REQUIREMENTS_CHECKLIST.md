# Final Project Requirements Checklist

This checklist maps the Roots Workbench to the professor's project requirements. Modern engine is now the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.

For a step-by-step classroom presentation script, see [PROFESSOR_DEMO_CHECKLIST.md](./PROFESSOR_DEMO_CHECKLIST.md).

| Professor Requirement | App Feature | Status | Notes |
|---|---|---|---|
| Approximate roots of functions / equations in one variable. | Roots Workbench supports Bisection, False Position, Secant, Fixed Point, and Newton-Raphson. | Covered | Use `x` as the variable. |
| Choose one method among discussed methods. | Method rail lets users choose Bisection, Newton-Raphson, Secant, False Position, or Fixed Point. | Covered | Recommended demo method: Bisection. |
| Input values/expressions efficiently. | Equation Studio provides expression fields, method-specific inputs, presets, math key helper, and quick command menu. | Covered | Expressions support powers, parentheses, constants, and common functions. |
| Maximum allowable significant digits. | Computation settings provide `Digits` per method. | Covered | Modern engine uses this for displayed final root/table/CSV values. Some Modern methods support method-level precision behavior. Legacy compatibility fallback remains available for strict stepwise machine arithmetic. |
| Identify approximate solution in an interval. | Bracket methods accept interval `[a, b]`; Bisection helper shows bracket validity and solution interval behavior. | Covered | Use Bisection demo `[1, 2]`. |
| Identify signs of functions / evaluate functions. | Classroom tools show `f(a)`, sign of `f(a)`, `f(b)`, sign of `f(b)`, and whether `f(a) * f(b) < 0`. | Covered | This directly supports IVT/bracket validation. |
| Determine roots of a function. | Result panel displays the approximate root and stopping result. | Covered | Tables and graph provide supporting work. |
| Determine number of iterations to achieve desired tolerance. | Bisection helper computes `N = ceil(log2((b - a) / epsilon))`. | Covered | Intended for classroom Bisection setup. |
| Determine tolerance/epsilon given number of iterations. | Bisection helper computes `epsilon = (b - a) / 2^N`. | Covered | Shows the guaranteed Bisection interval bound. |
| Apply evaluations/operations/iterations with explicitly identified digits, chopped or rounded. | Computation settings provide `Digits` and `Rule: Round/Chop`. | Covered with mode distinction | Modern engine formats displayed final root/table/CSV values. Modern bracket-method internals also have tested optional boundary-level calculation precision, but strict Legacy stepwise arithmetic remains available through Legacy compatibility fallback. |
| Present tabular iteration results. | Evidence workspace includes method-aware iteration tables. | Covered | Modern engine uses classroom notation such as `n`, `a_n`, `b_n`, `p_n`, `f(p_n)`, and Approx. Error. |
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

Modern engine table notation:

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

## Legacy Compatibility Fallback vs Modern Engine

Legacy compatibility fallback runs through:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern engine is the default engine. It runs through:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> TypeScript methods -> math.js evaluator
```

Modern engine is tested against unit tests, Playwright smoke tests, side-by-side Legacy compatibility fallback comparisons, and mpmath golden oracle fixtures.

Rollback options:

- Set `VITE_ROOT_ENGINE=legacy`.
- Choose Legacy compatibility fallback in Advanced/testing.

Legacy should not be removed until a separate removal task explicitly approves it.

## Computation Settings

The top Computation settings panel is the single source of truth for digit/rule presentation:

```text
Digits
Rule: Round / Chop
Stop by
```

Legacy compatibility fallback behavior:

```text
Digits and Rule affect legacy calculation behavior. This fallback is retained for strict stepwise machine-arithmetic compatibility.
```

Modern engine behavior:

```text
Digits and Rule format displayed final root, table, and CSV values. Some Modern methods support method-level precision behavior, but strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback.
```

This is the current UI-facing behavior. Under the isolated Modern method API, supported bracket methods also expose optional boundary-level calculation precision for tests and future wiring. That boundary-level mode is not the same as Legacy stepwise expression arithmetic.

## Approx. Error Meaning

`Approx. Error` means the difference between successive approximations, such as:

```text
|p_n - p_(n-1)|
```

It is not true error unless an exact root is known.

## Known Limitations

- Symbolic differentiation is deferred.
- Strict Legacy stepwise expression-level machine arithmetic is not fully ported to Modern engine.
- Fixed Point multi-formula ranking and advanced seed/batch helpers are implemented, but Legacy compatibility fallback remains the fallback for strict machine-arithmetic parity.
- Legacy compatibility fallback and Modern engine may differ in stop reason labels, iteration counts, and row details even when the final root agrees.
