# Professor PDF Analysis: One-Variable Equation Solvers

Source PDF: `C:/Users/Emmy Lou/Downloads/New folder (32)/On Numerical Analysis Solution of Equations in One Variable.pdf`

Basis of this report: the user-provided page transcription from the lecture deck, which is materially cleaner than raw OCR output.

Date: `2026-04-23`

## Purpose

Translate the professor's lecture into concrete calculator requirements for the Roots mini-app and `root-engine.js`.

## Verified Lecture Scope

The lecture is a one-variable equation-solving unit built around these methods:

1. Bisection
2. Fixed-point iteration
3. Newton's method
4. Secant method
5. False position / Regula Falsi

It starts with a population-growth equation that cannot be solved explicitly and uses that to motivate numerical root finding.

## Exact Lecture Details That Matter For The Calculator

### Bisection

The lecture emphasizes:

- IVT guarantee: `f` continuous on `[a,b]` with `f(a)f(b) < 0`
- repeated interval halving
- three stopping ideas:
  - `|p_N - p_(N-1)| < epsilon`
  - `|p_N - p_(N-1)| / |p_N| < epsilon`
  - `|f(p_N)| < epsilon`
- warning that each stopping criterion can be misleading on its own
- iteration caps as a practical safeguard
- smaller starting brackets reduce work
- theoretical bound:
  - `|p_n - p| <= (b-a)/2^n`
- iteration-count algebra from the bound

The lecture also states two implementation details explicitly:

- midpoint should be computed as `a + (b - a)/2`, not `(a + b)/2`
- sign testing should prefer `sgn(f(a_n)) sgn(f(p_n)) < 0` over direct multiplication to avoid overflow/underflow

Worked lecture example:

- `f(x) = x^3 + 4x^2 - 10`
- bracket `[1, 2]`
- relative-accuracy target `10^-4`
- lecture table reaches
  - `p_13 = 1.365112305`
  - with the next-bracket width giving a relative-error bound below `10^-4`

Iteration-count example:

- same function on `[1, 2]`
- target accuracy `10^-3`
- lecture conclusion: `10` iterations guarantee the target

### Fixed-Point Iteration

The lecture emphasizes:

- fixed point definition: `g(p) = p`
- convert `f(x) = 0` into `x = g(x)`
- existence theorem on `[a,b]`
- uniqueness via a contraction bound `|g'(x)| <= k < 1`
- theorem hypotheses are sufficient, not necessary
- choose a rearrangement with derivative as small as possible near the solution

Worked examples:

- `g(x) = x^2 - 2` has fixed points `2` and `-1`
- `g(x) = (x^2 - 1)/3` has a unique fixed point on `[-1,1]`
- `g(x) = 3^(-x)` on `[0,1]` shows the theorem does not prove uniqueness even when the fixed point is unique

Important lecture comparison:

For `x^3 + 4x^2 - 10 = 0`, the lecture gives five fixed-point rearrangements:

- `g1(x) = x - x^3 - 4x^2 + 10`
- `g2(x) = sqrt(10/x - 4x)`
- `g3(x) = (1/2) * sqrt(10 - x^3)`
- `g4(x) = sqrt(10 / (4 + x))`
- `g5(x) = x - (x^3 + 4x^2 - 10) / (3x^2 + 8x)`

Observed behavior in the lecture table:

- `g1` diverges
- `g2` becomes undefined
- `g3`, `g4`, and `g5` converge well
- `g5` is the fastest among the shown choices

This is one of the strongest teaching patterns in the entire PDF.

### Newton's Method

The lecture uses the standard tangent-line derivation:

- `x_(n+1) = x_n - f(x_n)/f'(x_n)`

Stopping rule:

- stop when `|x_n - x_(n+1)| < epsilon`

Worked examples:

- `f(x) = x^2 - 2`, starting from `x_1 = 1`
  - `1`
  - `1.5`
  - `1.416667`
  - `1.414216`
- `f(x) = 2x^3 + x^2 - x + 1`
  - lecture run converges near `-1.23375`
- failure case:
  - `f(x) = x^(1/3)`
  - Newton update becomes `x_(n+1) = -2x_n`
  - lecture uses this to show divergence / failure to converge

### Secant Method

The lecture motivates secant as derivative-free Newton.

Core formula:

- `x_n = x_(n-1) - f(x_(n-1))(x_(n-1) - x_(n-2)) / (f(x_(n-1)) - f(x_(n-2)))`

Lecture emphasis:

- only one new function evaluation per step after startup
- same successive-iterate stopping logic as Newton

### False Position

The lecture presents false position as:

- secant-style interpolation
- plus a sign test that preserves bracketing

This is framed as the main advantage over Newton and secant.

Comparison problem used in lecture:

- `x = cos x`
- equivalent root form `cos(x) - x = 0`
- root reported to `10` decimal places:
  - `0.7390851332`

Lecture comparison trend:

- Newton converges fastest
- secant follows closely
- false position preserves bracketing but is a bit slower

## Direct Alignment With The Current Repo

### Already Covered Well

The current Roots mini-app already matches the lecture on the major method set:

- `root-engine.js` implements all five methods
- `roots/index.html` exposes all five methods
- `roots/roots-engine-adapter.js` wires all five into the UI
- `roots/roots-render.js` already shows iteration tables, summaries, and step text

Lecture-aligned behavior already present:

- bisection has relative tolerance support
- the UI already calls relative tolerance the lecture-style default
- the engine guards invalid brackets and endpoint roots
- fixed-point UI already mentions `|g'(x)| < 1`
- Newton guards derivative-zero cases
- false position is already available as a bracketed alternative

### Numerical-Behavior Alignment Check

The engine already aligns with the lecture's sign-based guidance better than a naive implementation:

- it carries explicit exact and machine signs per point
- it makes interval decisions from sign values, not from multiplying raw function values in the UI layer

However, one lecture recommendation is not yet followed in the bisection midpoint implementation:

- current helper in [root-engine.js](C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-engine.js:701) returns `(left + right) / 2`
- the bisection loop in [root-engine.js](C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-engine.js:1393) also computes midpoint as `(left + right) / 2`

The lecture explicitly recommends:

- `a + (b - a)/2`

So there is a real engine-hardening opportunity here.

## Concrete Gaps To Build Next

### 1. Lecture Presets

The app should have one-click presets for the lecture's exact examples.

Minimum preset set:

- Bisection:
  - `f(x) = x^3 + 4x^2 - 10`
  - `a = 1`, `b = 2`
  - stopping: relative tolerance `1e-4`
- Bisection iteration-count demo:
  - same problem
  - target `1e-3`
- Fixed point:
  - the five `g1..g5` rearrangements for `x^3 + 4x^2 - 10 = 0`
  - same initial guess used in lecture table, `p0 = 1.5`
- Newton:
  - `f(x) = x^2 - 2`
  - `f'(x) = 2x`
  - `x0 = 1`
- Newton failure:
  - `f(x) = x^(1/3)`
  - `f'(x) = (1/3)x^(-2/3)`
  - `x0 = 0.1`
- Cross-method comparison:
  - `f(x) = cos(x) - x`
  - Newton start `x0 = pi/4`
  - Secant/false-position starts `0.5` and `pi/4`

### 2. Bisection Accuracy Helper

The lecture repeatedly teaches bisection as both:

- a method
- and a predictable error-bound machine

So the UI should explain:

- guaranteed absolute bound after `n` steps: `(b-a)/2^n`
- guaranteed iterations needed for target epsilon
- why actual error may be much smaller than the bound
- why `|f(p_n)|` alone is not enough
- why relative error was used in the lecture's `x^3 + 4x^2 - 10` example

### 3. Fixed-Point Rearrangement Comparison

This should be a first-class teaching feature.

Expected behavior:

- show `g1..g5` side by side
- flag each run as convergent, divergent, or undefined
- show iteration counts and final value
- optionally estimate `|g'(x)|` near the current iterate

This would make the lecture's biggest conceptual lesson visible in the app.

### 4. Cross-Method Comparison Mode

The lecture directly compares Newton, secant, and false position on `x = cos x`.

The app should support a comparison panel with:

- final approximation
- iterations completed
- last error
- bracket preserved or not
- derivative required or not
- convergence speed note

### 5. Theorem And Safeguard Notes

Each method should surface the exact classroom reason it works or fails.

Recommended notes:

- Bisection:
  - IVT guarantee
  - guaranteed convergence
  - bound `(b-a)/2^n`
- Fixed point:
  - `g([a,b]) subset [a,b]`
  - `|g'(x)| < 1` as the key convergence signal
- Newton:
  - tangent-line update
  - derivative must stay nonzero
- Secant:
  - derivative-free Newton approximation
- False position:
  - secant update with bracketing retained

### 6. Lecture-Matched Failure Language

Recommended UI/result copy:

- `Not a valid starting bracket.`
- `Derivative is zero at the current iterate.`
- `This fixed-point rearrangement diverges from the solution.`
- `This fixed-point rearrangement becomes undefined.`
- `Theoretical uniqueness is not guaranteed on this interval.`

## Engine-Level Work Suggested By The Lecture

### High Priority

- Change bisection midpoint calculation from `(a + b) / 2` to `a + (b - a) / 2`
- consider using the same safer midpoint helper everywhere bracket midpoints are formed

### Medium Priority

- make the bisection iteration-bound formula available as a public helper or render-time utility
- expose a lecture-style absolute-error bound field in result summaries
- label bound versus actual observed error more explicitly

### Already Good

- sign-tracking and sign-based decisions are already in place
- relative-tolerance handling is already in place for bisection

## Test Cases The PDF Gives Us For Free

These should be added or strengthened in `scripts/root-engine-audit.js` and related Roots audits.

### Bisection

- `x^3 + 4x^2 - 10` on `[1,2]`
- verify the midpoint progression matches the lecture table under a compatible machine setting
- verify the solver can certify the `10^-3` iteration-count example

### Fixed Point

- `g1` diverges
- `g2` becomes undefined
- `g3`, `g4`, and `g5` converge near `1.365230013`

### Newton

- `x^2 - 2` from `x0 = 1`
- `x^(1/3)` from `x0 = 0.1` should not be reported as convergent

### Secant / False Position / Newton Comparison

- `cos(x) - x`
- compare convergence to `0.7390851332`

## File Targets For Future Work

Likely edit map if this lecture drives implementation:

- `roots/index.html`
  - lecture preset controls
  - theorem cards
  - comparison panel entry points
- `roots/roots-state.js`
  - preset definitions
  - comparison-mode state
- `roots/roots-app.js`
  - preset loading
  - shared-run orchestration
- `roots/roots-render.js`
  - theorem notes
  - bound explanations
  - fixed-point comparison cards
  - cross-method comparison table
- `roots/roots-engine-adapter.js`
  - request packaging for comparison runs
- `root-engine.js`
  - midpoint hardening
  - optional helper exposure for bound calculations
- `scripts/root-engine-audit.js`
  - lecture-derived regression cases

## Practical Conclusion

The lecture does not reveal a missing method. The repo already has the method set.

What the lecture does reveal is the shape the calculator should take if it is meant to match classroom use:

- built-in lecture examples
- explicit theorem-backed guidance
- visible error bounds, not just answers
- comparison across methods
- comparison across fixed-point rearrangements
- small numerical-safety improvements in the engine

That is the highest-value path for making the calculator feel like the professor's course material rather than a generic root solver.
