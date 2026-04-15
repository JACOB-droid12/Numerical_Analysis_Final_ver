# Bisection Stress-Test Failure Report

Date: 2026-04-15

Scope: This report consolidates the root-finding tests executed on the Numerical Analysis Teaching Lab bisection workflow during the focused validation passes and the later stress packs.

## 1. Overall verdict

- The app is mathematically trustworthy for ordinary continuous bisection problems with moderate-scale inputs, exact endpoint or midpoint roots, and standard algebraic/transcendental expressions already supported by the parser.
- The app is not yet trustworthy for student use on tiny-scale values, discontinuity traps, unsupported standard textbook functions, or scenarios where the UI wording must distinguish "valid bisection bracket" from "a root definitely exists."
- Under time pressure, the current behavior is risky because several failures look confident rather than obviously broken: tiny values can be collapsed to zero, epsilon-mode summaries can misstate actual work, and trig root-finding depends on the global angle mode in a way that can silently invalidate an otherwise standard textbook interval.

## 2. Blocker mathematical findings

### Tiny values below `1e-12` are silently zeroed, causing false roots and premature convergence

- Severity: Critical
- Category: wrong math
- Module or flow: `CalcEngine` zero cleaning -> `ExpressionEngine` evaluation -> `RootEngine` sign classification and stop logic
- Steps to reproduce:
  1. Run `f(x) = x^3 - 10^(-18)` on `[0, 10^(-4)]` with epsilon mode.
  2. Run `f(x) = e^(-1000x) - 10^(-12)` on `[0, 0.1]` with epsilon mode.
- Expected result:
  - The first problem should not treat `x = 0` as a root.
  - The second problem should converge near `0.02763102111593...`, not stop after a visibly loose interval.
- Observed result:
  - `x^3 - 10^(-18)` returns `root-at-a` with approximation `0`.
  - `e^(-1000x) - 10^(-12)` stops after 7 rows at `0.02734375` with `machine-zero`.
- Classification: numerical mismatch
- Why this matters to a student under time pressure:
  - The calculator appears to "prove" a root at the wrong location and can stop far too early while claiming success.
  - These are the hardest errors to catch manually because the UI shows a valid-looking answer.
- Suggested improvement:
  - Remove or isolate the global `1e-12` zero snap from root-classification logic.
  - Distinguish display cleanup from mathematical evaluation.
  - Avoid using `machine-zero` as a convergence reason for bisection unless the bracket width is also acceptably small.
- Evidence source:
  - independently derived
  - inferred from code/behavior

### Epsilon-mode metadata reports planned iterations, not actual work, after early exits

- Severity: High
- Category: misleading pedagogy/semantics
- Module or flow: `RootEngine.buildStopping()` -> early exit paths -> `RootUI.formatStoppingDetails()`
- Steps to reproduce:
  1. Run `f(x) = x^3 - 8` on `[0, 4]`.
  2. Run `f(x) = (x-1)(x^2+1)` on `[0, 2]`.
  3. Run `f(x) = x^10 - 10^100` on `[0, 2*10^10]`.
- Expected result:
  - If the solver stops on iteration 1 or at an endpoint, the stopping summary should say so clearly.
- Observed result:
  - The engine stores the precomputed epsilon-mode count and the UI continues to present that value even when only 0 or 1 actual rows were used.
- Classification: semantic mismatch
- Why this matters to a student under time pressure:
  - Students may copy an incorrect iteration count into homework or believe the algorithm needed far more work than it did.
- Suggested improvement:
  - Keep both numbers: `plannedIterations` and `actualIterations`.
  - UI copy should prefer `actualIterations` for completed runs and reserve `plannedIterations` for "required by the bound" messaging.
- Evidence source:
  - directly observed in app behavior
  - inferred from code/behavior

### Subnormal tolerances underflow to zero in the stopping formulas and are rejected

- Severity: High
- Category: wrong math
- Module or flow: `RootEngine.iterationsFromTolerance()` and `realNumber()` conversion path
- Steps to reproduce:
  1. Run `f(x) = x - 10^(-300)` on `[0, 10^(-299)]` with epsilon `10^(-320)`.
  2. Run `f(x) = x` on `[-10^(-300), 10^(-300)]` with epsilon `10^(-320)`.
- Expected result:
  - The tolerance should remain a positive exact quantity or the app should clearly explain a machine-limit restriction.
- Observed result:
  - The solver throws `Enter a tolerance epsilon greater than 0.` because the exact rational tolerance is converted to a JavaScript number and underflows to `0`.
- Classification: numerical mismatch
- Why this matters to a student under time pressure:
  - The input is mathematically valid, but the app reports it as if the student entered an invalid tolerance.
- Suggested improvement:
  - Preserve exact rational arithmetic longer in stopping formulas.
  - If a fallback to JS numbers is unavoidable, show a precision-limit error instead of "epsilon must be greater than 0."
- Evidence source:
  - independently derived
  - inferred from code/behavior

### Discontinuity traps are not identified as discontinuities; singular midpoints surface as raw math errors

- Severity: High
- Category: wrong math
- Module or flow: `RootEngine.runBisection()` midpoint evaluation and Roots error reporting
- Steps to reproduce:
  1. Run `f(x) = 1/x` on `[-1, 1]`.
  2. Run `f(x) = 1/(x-1)` on `[0, 2]`.
- Expected result:
  - The app should reject the interval as unsafe for bisection or at least explain that a sign change across a discontinuity does not guarantee a root.
- Observed result:
  - The engine throws a raw `Division by zero.` error when the midpoint lands on the singularity.
- Classification: semantic mismatch
- Why this matters to a student under time pressure:
  - A raw divide-by-zero message does not explain why the interval is invalid for bisection and does not teach the continuity requirement.
- Suggested improvement:
  - Catch singular midpoint evaluation in the Roots flow and convert it into a root-specific discontinuity warning.
  - Add copy explaining that sign change alone is not enough without continuity.
- Evidence source:
  - directly observed in app behavior
  - inferred from code/behavior

### Negative-exponent expressions can be treated as exact-compatible even when they are evaluated through floating-point power

- Severity: High
- Category: wrong math
- Module or flow: `ExpressionEngine.isExactCompatible()` vs `CalcEngine.powValue()`
- Steps to reproduce:
  1. Evaluate `x^3 - 10^(-18)` at `x = 0`.
  2. Observe that the expression is tagged exact-compatible, but the exponent `-18` forces the power path through floating-point evaluation.
- Expected result:
  - Expressions using non-integer or negative powers should not be labeled exact-compatible if they are actually computed through the calculator-number path.
- Observed result:
  - The exact-compatibility check is syntactic and returns `true`, while the actual evaluation goes through `Math.pow()` and then the global zero-cleaning path.
- Classification: semantic mismatch
- Why this matters to a student under time pressure:
  - The app can silently mix exact and floating-point reasoning while presenting the result as exact-based bisection.
- Suggested improvement:
  - Align `isExactCompatible()` with the actual evaluator semantics for powers.
  - Negative exponents should not count as exact-compatible unless there is a genuine rational-power implementation.
- Evidence source:
  - inferred from code/behavior

## 3. Cross-module consistency findings

### Roots surfaces raw evaluation errors while other modules translate them into student-facing messages

- Title: Raw root errors are inconsistent with the rest of the calculator
- Severity: Medium
- Category: stale or inconsistent state
- Where it happens: Roots module error path
- Steps to reproduce:
  1. Run `1/x` on `[-1,1]` or `1/(x-1)` on `[0,2]`.
  2. Compare the resulting message with how Module I or the sandbox present divide-by-zero issues.
- Expected behavior:
  - Error messages should be normalized into student-facing explanations.
- Actual behavior:
  - Roots currently exposes the raw thrown message.
- Why this matters to a student under time pressure:
  - Inconsistent wording makes the tool harder to trust and harder to learn from.
- Suggested improvement:
  - Reuse the existing numeric-expression error formatting pattern in the Roots flow.

### Global angle mode creates valid/invalid bracket flips for trig problems

- Title: Trig root tests depend on a global DEG/RAD setting that is easy to miss
- Severity: Medium
- Category: stale or inconsistent state
- Where it happens: Roots module trig evaluation
- Steps to reproduce:
  1. Run `sin(x)` on `[3,4]`.
  2. Compare the result in `DEG` versus `RAD`.
- Expected behavior:
  - The interface should make the dependence on angle mode unmistakable before the user trusts the bracket validity.
- Actual behavior:
  - The same textbook interval is invalid in `DEG` and valid in `RAD`.
- Why this matters to a student under time pressure:
  - A student can appear to "fail" a correct textbook problem simply by inheriting the wrong global setting.
- Suggested improvement:
  - Surface the angle mode more prominently in the Roots result area and warn on trig expressions when the current mode is likely inconsistent with standard textbook expectations.

### Missing `tan()` and `ln()` support prevents several textbook root problems from being tested at all

- Title: Standard function coverage is incomplete for root-finding assignments
- Severity: Medium
- Category: semantic labeling consistency
- Where it happens: `ExpressionEngine` call handling
- Steps to reproduce:
  1. Run `tan(x)` on `[1,2]`.
  2. Run `ln(x)` on `[-1,2]`.
- Expected behavior:
  - Either support those functions or present a clear "not yet supported in this module" message.
- Actual behavior:
  - The parser throws `Unsupported function: tan` and `Unsupported function: ln`.
- Why this matters to a student under time pressure:
  - These are ordinary textbook functions; failure looks like a calculator defect rather than a declared scope limit.
- Suggested improvement:
  - Add `tan()` and `ln()` support or clearly list supported functions near the root input.

## 4. Usability, accessibility, and cognitive-load findings

### The invalid-bracket message can imply "no root exists" instead of "bisection assumptions are not satisfied"

- Severity: Medium
- Category: wording and lesson alignment
- Where it happens: invalid bracket results and solution steps
- Steps to reproduce:
  1. Run `(x-1)^2` on `[0,3]` or `(x-1)(x-2)` on `[0,3]`.
- Expected behavior:
  - The app should explain that same-sign endpoints do not prove no root exists; they only prove the interval is not a valid bisection bracket.
- Actual behavior:
  - The current messaging is correct at a narrow level but not explicit enough about the method limitation.
- Why this matters to a student under time pressure:
  - Students may confuse "bisection cannot proceed" with "the equation has no root."
- Suggested improvement:
  - Add one sentence clarifying the method limitation whenever an invalid bracket is reported.

### Multiple-root intervals produce a single answer without warning

- Severity: Medium
- Category: cognitive-load issue
- Where it happens: oscillatory or multi-root intervals such as `sin(50x)` on `[0.01,1]`
- Steps to reproduce:
  1. Run `sin(50x)` on `[0.01,1]`.
  2. Tighten epsilon and note that the solver returns one root near `0.6911503838`.
- Expected behavior:
  - The app should at least warn that the interval may contain multiple roots and that bisection will follow only one sign-change path.
- Actual behavior:
  - The result looks final and unique.
- Why this matters to a student under time pressure:
  - Students may copy the answer without realizing many other valid roots exist in the interval.
- Suggested improvement:
  - Add a heuristic warning for high-frequency oscillatory inputs or repeated sign changes in sampled preview points.

### Epsilon-mode summaries are pedagogically misleading on early exits

- Severity: Medium
- Category: wording and lesson alignment
- Where it happens: stopping summary and solution steps
- Steps to reproduce:
  1. Run any exact endpoint or midpoint case in epsilon mode.
- Expected behavior:
  - The app should distinguish "bound-required iterations" from "iterations actually used."
- Actual behavior:
  - The current copy can read as if the algorithm actually performed the full theoretical count.
- Why this matters to a student under time pressure:
  - It encourages copying the wrong iteration count and makes the solver seem less efficient or less mathematically transparent.
- Suggested improvement:
  - Rewrite the stopping summary to show both numbers whenever they differ.

## 5. Hard-problem comparison results

### Earlier targeted tests

| Problem statement | Independently derived result | Calculator result | Match classification | Short note on what the case proves |
| --- | --- | --- | --- | --- |
| `x^2 - 3` on `[1,2]`, `epsilon = 1e-4` | Need `14` iterations; 14th midpoint is `1.73199462890625` | `14` rows; approximation `1.73199462891` | exact match | The solver returns the final midpoint, not the true root rounded to 5 decimals. |
| `e^(-x) - x` on `[0,1]`, `epsilon = 1e-5` | Root `0.56714329040978...`; `17` iterations by the width bound | `17` rows; approximation `0.56714630127` | exact match | Core transcendental bisection works. |
| `x^3 - 8` on `[0,4]`, `epsilon = 0.001` | Midpoint `2` is an exact root on iteration `1` | `rows = 1`, approximation `2`, but epsilon metadata still says `12` required | semantic mismatch | Solver stops correctly, but the summary misstates the iteration count. |
| `sin(x)` on `[3,4]`, `epsilon = 1e-4` | In `RAD`, root near `pi`; in `DEG`, no valid bracket | `RAD`: approximation `3.14154052734`; `DEG`: invalid bracket | semantic mismatch | Angle mode materially changes validity. |
| `x^2 - 4` on `[3,5]` | No sign change; reject | invalid bracket | exact match | Invalid bracket handling works on ordinary same-sign cases. |

### Stress pack results

| Problem statement | Independently derived result | Calculator result | Match classification | Short note on what the case proves |
| --- | --- | --- | --- | --- |
| `1/x` on `[-1,1]` | No root; discontinuity at `0` invalidates the bracket | raw `Division by zero.` error | semantic mismatch | The app does not falsely return a root, but it does not explain the continuity failure. |
| `tan(x)` on `[1,2.5]` | No valid bisection bracket across asymptote; should reject if supported | `Unsupported function: tan` | semantic mismatch | This is a function-support gap, not a numerical bisection answer. |
| `(x-1)^2` on `[0,3]` | Root exists, but no sign change; bisection must reject | invalid bracket | exact match | The method limitation is handled correctly. |
| `sin(x)` on `[0,pi]` | Left endpoint root at `0` | `root-at-a`, approximation `0` | exact match | Endpoint-root detection works. |
| `(x-1)^2 - 1e-10` on `[0.999985,1.000005]` | Root at `0.99999` | `root-at-midpoint`, approximation `0.99999` | exact match | Tight narrow interval with exact midpoint/root handling works. |
| `sin(x) - x + x^3/6` on `[-2,2]` | Midpoint `0` is the exact root | `root-at-midpoint`, approximation `0` | exact match | This case is less numerically evil than it first appears because the first midpoint is already the root. |
| `e^x - e^10` on `[0,20]` | Midpoint `10` is the exact root | `root-at-midpoint`, approximation `10` | exact match | Large-magnitude exact midpoint roots work. |
| `e^(1000x) - e^(10000)` on `[0,20]` | Overflow-prone; should be trapped clearly | `Value is not finite.` | semantic mismatch | Overflow is detected, but the message is generic. |
| `sin(50x)` on `[0.01,1]` | One admissible root is `11*pi/50 ≈ 0.6911503838`; many others also exist | converges near `0.69115039` | exact match | The solver follows one sign-change path but gives no multiple-root warning. |
| `x^4 - 10x^2 + 9` on `[0,4]` | Same-sign endpoints; reject despite hidden roots | invalid bracket | exact match | Full-interval hidden roots are correctly rejected. |
| `x^4 - 10x^2 + 9` on `[0,2]` and `[2,4]` | Roots at `1` and `3` respectively | exact midpoint root in one row for both | exact match | Split intervals behave correctly. |
| `(x-1.00001)(x-1.00003)(x-1.00005)` on `[0.9999,1.0001]` | One of the three close roots should be isolated | approximation `1.00005` after 2 rows | exact match | Near-coincident roots can still work when the midpoint lands favorably. |
| `x - 0.99999*sin(x) - 1.5` on `[0,pi]` | Root `≈ 2.267167334868338` | approximation `2.26716733486826` | exact match | The solver handled the Kepler-style case correctly; the earlier reference value was wrong. |

### 20-case brutal pack results

| Problem statement | Independently derived result | Calculator result | Match classification | Short note on what the case proves |
| --- | --- | --- | --- | --- |
| `x^3 - x - 2` on `[1,2]`, `epsilon = 1e-12` | Root `1.5213797068045676`; about `40` iterations | `40` rows; `1.52137970680542` | exact match | Core textbook bisection is sound. |
| `cos(x) - x` on `[0,1]`, `epsilon = 1e-12` | Root `0.7390851332151607` | `39` rows; `0.739085133214758` | exact match | Near-zero residual triggers a final `machine-zero`, but numerically the root is good. |
| `e^(-x) - x` on `[0,1]`, `epsilon = 1e-12` | Root `0.5671432904097838` | `38` rows; `0.567143290409149` | exact match | Strong transcendental case. |
| `(x-1)^7` on `[0,2]` | Exact midpoint root `1` | one-row exact root | exact match | Flat odd root is handled well when midpoint is exact. |
| `x^3 - 10^(-18)` on `[0,10^(-4)]` | Root `10^(-6)`, not `0` | `root-at-a`, approximation `0` | numerical mismatch | Tiny constant was collapsed to zero. |
| `sin(1000x)` on `[0.003,0.004]` | Root `pi/1000 ≈ 0.0031415926535897933` | `0.00314159265439957` | exact match | Oscillatory but continuous brackets work. |
| `e^x - 1` on `[-10^(-8),10^(-8)]` | Midpoint root `0` | one-row midpoint root | exact match | Tiny symmetric interval is fine when midpoint is exact. |
| `sqrt(x) - 0.1` on `[0,1]` | Root `0.01` | `0.00999999999930878` | exact match | Domain boundary is handled well. |
| `e^(-1000x) - 10^(-12)` on `[0,0.1]` | Root `12 ln(10) / 1000 ≈ 0.02763102111592855` | `0.02734375` after `7` rows, `machine-zero` | numerical mismatch | Tiny target value is erased by the zero threshold. |
| `x^10 - 10^100` on `[0,2*10^10]` | Midpoint root `10^10` | one-row exact root | exact match | Large exact midpoint root is handled correctly. |
| `x^2 - 4` on `[2,5]` | Left endpoint root `2` | `root-at-a`, approximation `2` | exact match | Endpoint root handling is correct. |
| `(x-1)(x^2+1)` on `[0,2]` | Midpoint root `1` | one-row exact root | exact match | Midpoint root handling is correct. |
| `(x-1)^2` on `[0,3]` | Reject; no sign change | invalid bracket | exact match | Correct method-limitation behavior. |
| `(x-1)(x-2)` on `[0,3]` | Reject; no sign change | invalid bracket | exact match | Correct method-limitation behavior. |
| `1/(x-1)` on `[0,2]` | Reject or warn about discontinuity | raw `Division by zero.` | semantic mismatch | Continuity trap is not explained. |
| `tan(x)` on `[1,2]` | Reject if supported | `Unsupported function: tan` | semantic mismatch | Parser support gap. |
| `ln(x)` on `[-1,2]` | Domain error or reject if supported | `Unsupported function: ln` | semantic mismatch | Parser support gap. |
| `x - 10^(-300)` on `[0,10^(-299)]`, epsilon `10^(-320)` | Root `10^(-300)` | rejects epsilon as not greater than zero | numerical mismatch | Subnormal tolerance underflow in stopping formulas. |
| `x` on `[-10^(-300),10^(-300)]`, epsilon `10^(-320)` | Midpoint root `0` | rejects epsilon as not greater than zero | numerical mismatch | Same underflow path. |
| `(x-1)(x-1.000000000001)` on `[0.999999999999,1.000000000002]` | This interval is not a valid sign-change bracket | invalid bracket | exact match | Clustered roots do not confuse the sign test here. |

## 6. Top 5 improvements before students should rely on the app

1. Remove the global `1e-12` zero-cleaning rule from root-finding decisions and reserve it for display-only cleanup.
2. Separate `plannedIterations` from `actualIterations` in epsilon mode and fix all stopping summaries to show the real work performed.
3. Add root-specific discontinuity and singularity handling so asymptote traps are explained rather than exposed as raw divide-by-zero errors.
4. Align exact-compatibility detection with actual evaluator behavior, especially for powers with negative exponents and other calculator-number-only paths.
5. Expand or clearly declare supported root-finding functions, prioritizing `tan()` and `ln()`, and add warnings for trig angle mode and possible multiple-root intervals.

## 7. Residual risks

- False convergence may still exist for other tiny-scale expressions because the zero-cleaning threshold affects evaluation globally, not only the cases already tested.
- The parser/function gap means several common textbook cases remain untestable until support is expanded.
- Multiple-root and discontinuity detection are still largely heuristic questions; the current tool does not perform continuity analysis or interval scanning.
- Overflow and underflow behavior outside the tested cases may still produce generic or misleading errors.
- The report is based on engine-driven verification plus code inspection; a full browser-UI rerun of every case was not completed for each test because the browser tooling was partially constrained in this workspace.

## 8. Recommended next command

- `/harden`
