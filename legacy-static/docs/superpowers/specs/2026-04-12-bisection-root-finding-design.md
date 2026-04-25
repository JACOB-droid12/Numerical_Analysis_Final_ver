# Bisection Root-Finding Module Design

Date: 2026-04-12
Project: Numerical Analysis Teaching Lab
Status: Approved for specification review

## Summary

Add a new dedicated `Roots` module to the existing browser-based numerical analysis app. The new module will implement the `Bisection Method` for approximating roots of a one-variable equation `f(x) = 0` over an interval `[a, b]`.

The module must support both polynomial and transcendental expressions, reuse the current significant-digit and chop/round machine-arithmetic system, and present the iteration process in a clear tabular format suitable for class demonstration and assignment checking.

## Goals

- Allow the user to enter a one-variable function `f(x)` using the app's existing expression syntax.
- Allow the user to enter an interval `[a, b]` and determine whether the interval brackets a root.
- Identify signs of `f(a)`, `f(b)`, and `f(c)` during the bisection process.
- Determine an approximate root of the function in the chosen interval.
- Support both stopping modes:
  - given tolerance `epsilon`, compute the minimum required number of iterations
  - given number of iterations `n`, compute the resulting tolerance or error bound
- Reuse the app's current finite-precision behavior:
  - `k` significant digits
  - `chopping` or `rounding`
- Allow the user to display:
  - exact signs only
  - machine signs only
  - both exact and machine signs
- Explain when to use exact signs, machine signs, or both.
- Present the iteration process in a table.

## Assignment Requirement Coverage

This design explicitly includes the required capabilities:

- `identify an approximate solution to an equation in an interval`
  - covered by the dedicated bisection workflow over `[a, b]` and the `Approximate root` summary card
- `identify sign of functions / apply evaluation of functions`
  - covered by evaluation of `f(a)`, `f(b)`, and `f(c)` plus selectable exact, machine, or both-sign display
- `determine roots of function`
  - covered by the iterative bisection solver that reports the current root approximation and interval status
- `determine number of iterations in order to achieve desired approximation`
  - covered by `Given tolerance epsilon` mode, which computes the minimum required number of iterations
- `determine tolerance (epsilon) given a number of iteration`
  - covered by `Given iterations n` mode, which computes the resulting tolerance or error bound
- `apply evaluations / operations / iterations with explicitly identified number of digits (whether chopped or rounded)`
  - covered by reuse of the app's existing `k` significant digits and `chop/round` machine-arithmetic engine for stepwise execution
- `present tabular presentation of the result of iteration`
  - covered by the iteration table showing interval updates, midpoint, function values, sign information, branch decision, and error bound

## Non-Goals

- Implement multiple root-finding methods in this version.
- Support systems of equations or multivariable functions.
- Add symbolic solving.
- Replace the existing expression, polynomial, or error modules.

## User Experience

### Navigation

Add a new sidebar tab named `Roots` beside the current modules. This opens a dedicated `Bisection Method Workbench`.

### Inputs

The module input area will contain:

- `Function f(x)` input for expressions such as:
  - `x^3 - x - 1`
  - `sin(x) - x/2`
  - `e^(-x) - x`
- Interval endpoints:
  - `a`
  - `b`
- Precision controls reused from the existing app:
  - significant digits `k`
  - machine rule `chop` or `round`
- Stopping mode selector:
  - `Given tolerance epsilon`
  - `Given iterations n`
- Numeric field for the selected stopping value
- Sign display selector:
  - `Machine only`
  - `Exact only`
  - `Both`
- Decision basis selector:
  - `Machine-based bisection`
  - `Exact-based bisection`

### Guidance Text

The UI will include short reasoning notes:

- `Machine-based bisection` should be chosen when the lesson or assignment requires chopping or rounding to affect every step of the method.
- `Exact-based bisection` should be chosen when the goal is to study the mathematically correct bracketing path while still showing machine values for comparison.
- `Both` sign display should be chosen when comparing how finite precision changes the branch decisions.

### Result Layout

The result area will include:

- `Approximate root` summary card
- `Interval status` summary card
- `Stopping result` summary card
- `Convergence summary` card
- `Sign analysis` card
- `Iteration table`

This keeps the module visually consistent with the app's existing result-card structure and teaching-oriented presentation.

## Functional Behavior

### Parsing and Evaluation

The module will parse `f(x)` using the existing `ExpressionEngine` with `allowVariable: true`.

The module must support:

- polynomial expressions
- transcendental expressions already supported by the expression engine
- textbook-style numeric input already accepted by the current app

### Interval Validation

Before iterating, the module must:

- verify that `a` and `b` are valid real inputs
- reject intervals where `a >= b`
- evaluate `f(a)` and `f(b)`
- determine whether the interval brackets a root according to the chosen decision basis

Possible interval statuses:

- valid bracket
- invalid bracket
- exact root at `a`
- exact root at `b`

### Bisection Iteration

For each iteration:

1. Compute midpoint `c = (a + b) / 2`
2. Evaluate `f(c)`
3. Display signs according to the sign display selector
4. Choose the next subinterval based on the chosen decision basis
5. Update the interval
6. Update the current error bound or tolerance estimate

### Decision Basis

#### Machine-Based Bisection

Use machine-evaluated values and machine-derived signs when deciding which half-interval to keep. This mode demonstrates how chopped or rounded arithmetic affects the path of the algorithm.

#### Exact-Based Bisection

Use exact evaluation when available to decide which half-interval to keep. Machine-evaluated values may still be displayed for comparison, but they do not determine the branch decision in this mode.

If an expression cannot be represented exactly by the current exact-evaluation path, the module must clearly label the result as calculator-evaluated rather than exact-rational.

### Stopping Modes

#### Given Tolerance Epsilon

The user enters a desired tolerance `epsilon`. The module computes the minimum number of iterations required using the standard bisection bound based on the initial interval width.

#### Given Iterations n

The user enters the number of iterations `n`. The module computes the resulting tolerance or error bound after `n` iterations.

The module should report both:

- the user-selected stopping value
- the derived companion value

Example:

- if the user gives `epsilon`, show the required `n`
- if the user gives `n`, show the resulting `epsilon`

## Precision and Machine Arithmetic

The new module must reuse the current machine-arithmetic system already used elsewhere in the app.

### Required Reuse

- `math-engine.js` for significant-digit chopping and rounding
- `expression-engine.js` for function parsing and evaluation
- existing app helpers for formatting and instructional labels

### Precision Rule

For `Machine-based bisection`, all stored values involved in the iterative process should follow the app's stepwise machine-arithmetic convention:

- interval endpoints used in iteration
- midpoint
- evaluated function values
- comparisons used for sign-based interval updates

This matches the current app's distinction between:

- `stepwise machine arithmetic`
- `final-only comparison`

### Comparison Output

The module may optionally show a comparison between:

- machine-stepwise values
- exact or reference values

This comparison is for learning support and must not confuse the main reported answer. The summary should clearly label whether the reported approximation came from machine-stepwise or exact-decision execution.

## Sign Presentation

The user may choose among three display modes:

### Exact Only

Display exact function values and exact signs only. This is best when the focus is the mathematical behavior of the method.

### Machine Only

Display chopped or rounded function values and machine signs only. This is best when the assignment is explicitly about machine arithmetic and finite-precision effects.

### Both

Display exact and machine values or signs side by side. This is best for classroom comparison and for showing when machine arithmetic changes the sign-based decision path.

When exact and machine signs disagree, the module must highlight this clearly in both the sign analysis area and the iteration table.

## Iteration Table

Each row in the iteration table must include:

- iteration number `i`
- current `a_i`
- current `b_i`
- midpoint `c_i`
- displayed `f(a_i)`
- displayed `f(b_i)`
- displayed `f(c_i)`
- displayed sign information based on the chosen sign display mode
- branch decision:
  - keep `[a_i, c_i]`
  - keep `[c_i, b_i]`
- current interval width
- current error bound or tolerance estimate
- optional note when exact and machine signs disagree

The table should be easy to read in a classroom or submission screenshot and should align with the app's current polished tabular style.

## Summary Cards

### Approximate Root

Show the latest midpoint accepted by the algorithm as the current root approximation.

### Interval Status

Show whether the interval is:

- a valid bracket
- invalid
- resolved immediately by an endpoint root
- resolved by an exact zero at the midpoint

### Stopping Result

Show why the method stopped:

- tolerance reached
- iteration limit reached
- exact zero found
- invalid starting interval

### Convergence Summary

Show:

- the selected stopping mode
- the user-entered control value
- the derived value for the other stopping quantity

### Sign Analysis

Show `f(a)`, `f(b)`, sign interpretation, and whether the initial interval brackets a root under the chosen decision basis.

## Edge Cases and Validation

The module must handle the following cases cleanly:

- empty function input
- invalid expression syntax
- non-real interval endpoints
- `a >= b`
- no sign change under the chosen decision basis
- root exactly at `a`
- root exactly at `b`
- root exactly at a midpoint
- machine sign differs from exact sign
- expressions whose exact form is unavailable, requiring calculator-based evaluation labels

Error and warning messages should be instructional rather than generic.

## Internal Architecture

Add a new engine file named `root-engine.js`.

Responsibilities of `root-engine.js`:

- interval validation
- stopping-mode calculations
- bisection iteration loop
- exact-sign and machine-sign packaging
- iteration row data assembly
- root summary data assembly

Existing modules reused:

- `expression-engine.js`
- `math-engine.js`
- `app.js`
- `math-display.js`

The new engine should keep the logic for the root module isolated so that app wiring remains clear and future methods can be added later without tangling the existing modules.

## Verification Plan

The completed feature should be checked with at least these scenarios:

- polynomial with a valid bracket and known real root
- transcendental expression with a valid bracket
- invalid interval with no sign change
- root at an endpoint
- midpoint reaching exact zero
- `given epsilon` mode
- `given n` mode
- machine-only sign display
- exact-only sign display
- both-sign display
- a case where finite precision changes the apparent sign or branch path

## Implementation Notes

- The main recommended answer shown to the user should be the result from the configured execution mode, not a mixed or ambiguous hybrid.
- Terminology in the UI should stay consistent with the rest of the app, especially around `chop`, `round`, `stepwise`, and `final-only`.
- The module should prioritize clarity for teaching and grading over dense technical controls.

## Approval Outcome

The approved direction is:

- dedicated `Roots` module
- `Bisection Method` only for this version
- support for both polynomial and transcendental expressions
- support for both `epsilon`-based and `n`-based stopping
- selectable sign display: exact only, machine only, both
- explanatory reasoning for which sign mode and decision basis to choose
