# Professor Demo Checklist

Use this checklist before classroom demos, project presentations, or groupmate validation. Modern engine is now the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.

## 1. Bisection Demo

Goal: approximate a root in a valid interval and present the iteration table.

Use:

```text
f(x) = x^3 + 4x^2 - 10
[a, b] = [1, 2]
```

Expected setup:

- `f(1) = -5`
- `f(2) = 14`
- `f(a) * f(b) < 0`, so the bracket is valid by the Intermediate Value Theorem.

Expected table columns:

```text
n | a_n | b_n | p_n | f(p_n)
```

In Modern engine classroom table notation, this appears as:

```text
n | aₙ | bₙ | pₙ | f(pₙ) | Approx. Error
```

Expected result:

```text
root near 1.365
```

Suggested validation:

- Confirm the bracket sign panel reports `f(a)` negative and `f(b)` positive.
- Confirm the table updates `a_n` or `b_n` based on the sign of `f(p_n)`.
- Confirm the final approximation is near `1.365`.

## 2. Newton-Raphson Demo

Goal: show Newton correction using the professor's table notation.

Use:

```text
f(x) = x^2 - 2
f'(x) = 2*x
x0 = 1
```

Stopping target:

```text
Stop when successive approximations differ by less than 0.0001.
```

Expected Modern engine classroom columns:

```text
n | pₙ | f(pₙ) | f′(pₙ) | f(pₙ)/f′(pₙ) | pₙ₊₁ | Approx. Error
```

Expected result:

```text
root near 1.41421356
```

Suggested validation:

- Confirm the correction column `f(pₙ)/f′(pₙ)` is visible.
- Confirm `pₙ₊₁ = pₙ - f(pₙ)/f′(pₙ)`.
- Confirm the final result rounds to `1.4142136` when shown to 8 significant digits.

## 3. Round-Off Demo

Goal: show decimal chopping and rounding to significant digits.

Use:

```text
π = 3.141592653589793...
k = 5 significant digits
```

Expected display:

```text
chopped π = 3.1415
rounded π = 3.1416
```

Suggested validation:

- Open `Computation settings`.
- Set `Digits` to `5`.
- Select `Chop`.
- Confirm the π preview shows `3.1415`.
- Select `Round`.
- Confirm the π preview shows `3.1416`.

## 4. Error Demo

Goal: validate absolute error, relative error, significant digits, and the quiz-style square-root example.

Use:

```text
true value p = 1.73205081
approximation p* = 1.7325897
```

Expected values:

```text
absolute error ≈ 0.00053889
relative error ≈ 0.00031113
significant digits = 4
```

Formula reminders:

```text
absolute error = |p - p*|
relative error = |p - p*| / |p|
significant digits rule: |p - p*| / |p| <= 5 × 10^-t
```

## 5. Notes For Reviewers

- Chopping/Rounding uses the top `Computation settings` controls.
- Legacy compatibility fallback machine arithmetic can still affect legacy internal calculations through its existing `k digits` and `Rule` fields.
- Modern engine uses `Digits` and `Rule` for displayed final root, table, CSV, and helper values. Some Modern methods support method-level precision behavior, but strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback.
- Approx. Error means the difference between successive approximations, not true error unless an exact root is known.
- Modern engine is the default.
- Rollback path: set `VITE_ROOT_ENGINE=legacy` or choose Legacy compatibility fallback in Advanced/testing.
- Legacy should not be removed until a separate removal task.
- Do not use display-only chopping/rounding results as proof that the internal root-method arithmetic has been chopped or rounded.

## Quick Demo Order

1. Start in Modern engine mode and run the Bisection demo.
2. Optionally switch to Legacy compatibility fallback and rerun the same Bisection demo for compatibility comparison.
3. Open the table and confirm classroom notation.
4. Run the Newton-Raphson demo and confirm the correction column.
5. Use Computation settings to show π chopping and rounding.
6. Mention that strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback.
