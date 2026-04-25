# Engine Correctness Audit Findings

## 1. Overall Verdict

- Expanded verdict: mathematically trustworthy for the current deterministic stress suite. The harness now passes 42 out of 42 checks across machine approximation, engine result packages, repeating decimals, negative-value paths, exponent-shift interactions, scalar-vs-calc parity, expression stepwise behavior, exact-path vs calc-path switching, polynomial consistency, and polynomial sensitivity.
- Maintainability verdict: the engine-boundary cleanup is complete for Module I and Module III. Both engines now expose `evaluateComparison()` helpers that return structured result packages, and `app.js` consumes those packages directly instead of assembling comparison objects from multiple raw engine calls. The 42-case harness covers the new helpers alongside the original mathematical checks.

## 2. Blocker Mathematical Findings

No blocker mathematical findings were discovered in the expanded stress pass.

What was independently verified:

- canonical multiplication oracle: `2.1892 * 3.7008`
- rollover oracle: `9.9996`, `k = 4`
- repeating decimal storage: `1/3`, `k = 6`
- negative-value storage on the canonical product
- small-magnitude exponent rollover: `0.00099996`, `k = 4`
- cancellation sanity check: `1000001 - 1000000`, `k = 6`, chopping
- exact-compatible arithmetic path versus calculator-path fallback
- Taylor-style polynomial final-only oracle: `2x - x^3/3 + x^5/60`, `x = 3.14159 / 3`, `k = 8`
- near-root polynomial sensitivity: `(x - 2)^13`, `x = 2.0001`, `k = 6`, chopping
- cancellation-heavy polynomial sensitivity: `(x - 1)^5`, `x = 1.0001`, `k = 6`, chopping

Classification so far:

- exact match: 42
- formatting-only difference: 0
- numerical mismatch: 0
- semantic mismatch: 0
- stale/import-state mismatch: 0

Evidence source:

- independently derived: the scalar machine oracles, cancellation oracle, Taylor-style polynomial final-only oracle, and the exact/final-only values for the two sensitivity polynomials
- directly observed in the engine harness: scalar-vs-calc parity, exact/calc path compatibility checks, and the magnitude of stepwise divergence in the sensitivity cases
- inferred from code structure: engine responsibility boundaries and maintainability pressure points

## 3. Engine Responsibility Map

### `math-engine.js`

- exact rational arithmetic
- normalized scalar machine-number trimming
- numerical-analysis error metrics and bounds

### `calc-engine.js`

- calculator-style values, including complex numbers
- approximate machine storage for real and complex calculator values
- calculator-facing stored-value formatting utilities

### `expression-engine.js`

- expression tokenization and parsing
- exact-compatible versus calculator-path evaluation
- stepwise machine evaluation traces

### `poly-engine.js`

- polynomial parsing and validation
- exact polynomial evaluation
- Horner, Direct, and final-only approximate evaluation

### `app.js`

- student-facing result shaping, semantic labels, and presentation logic built on top of engine outputs

## 4. Hard-Problem Comparison Results

### Canonical multiplication

- Problem: `2.1892 * 3.7008`
- Independently derived result:
  - exact `8.10179136`
  - `k = 8`, chop `8.1017913`
  - `k = 8`, round `8.1017914`
- Calculator result:
  - exact `8.10179136`
  - `k = 8`, chop `8.1017913`
  - `k = 8`, round `8.1017914`
- Match classification: exact match
- What this proves: the baseline machine approximation oracle is correct.

### Repeating decimal storage

- Problem: `1/3`, `k = 6`
- Independently derived result:
  - chop `0.333333`
  - round `0.333333`
  - normalized form `digits 333333`, exponent `0`
- Calculator result:
  - chop `0.333333`
  - round `0.333333`
  - normalized form `digits 333333`, exponent `0`
- Match classification: exact match
- What this proves: repeating-decimal storage is currently stable for this canonical case.

### Negative-value and exponent-shift paths

- Problem:
  - negative canonical product `-8.10179136`, `k = 8`
  - small rollover case `0.00099996`, `k = 4`
- Independently derived result:
  - negative path keeps the sign with the correct stored mantissa
  - small rollover chops to `0.0009999` and rounds to `0.001`
  - small rollover normalized rounded form uses digits `1000`, exponent `-2`
- Calculator result:
  - all of the above match exactly
- Match classification: exact match
- What this proves: sign handling and small-magnitude exponent rollover are currently correct.

### Scalar-vs-calc parity

- Problem: compare scalar storage and calculator-style real storage for the same real-valued inputs
- Independently derived result: comparable real values should produce the same stored decimal and normalized form across both paths
- Calculator result:
  - parity holds for `1/3`, the negative canonical round case, and the small rollover round case
- Match classification: exact match
- What this proves: the scalar and calculator real paths are aligned for the tested cases.

### Cancellation sanity check

- Problem: `1000001 - 1000000`, `k = 6`, chopping
- Independently derived result:
  - exact result `1`
  - stepwise stored result `0`
  - final-only result `1`
- Calculator result:
  - exact result `1`
  - stepwise stored result `0`
  - final-only result `1`
- Match classification: exact match
- What this proves: the expression stepwise path respects stored-operand cancellation semantics.

### Exact-path vs calc-path switching

- Problem:
  - exact-compatible arithmetic: `2 + 3/4`
  - calculator-path case: `sqrt(2)`
- Independently derived result:
  - `2 + 3/4` should stay exact-compatible and equal `11/4`
  - `sqrt(2)` should not be exact-compatible in this engine model
- Calculator result:
  - `2 + 3/4` stays exact-compatible and evaluates to `11/4`
  - `sqrt(2)` is not exact-compatible
- Match classification: exact match
- What this proves: the tested path-switch cases are predictable.

### Taylor-style polynomial comparison

- Problem: `2x - x^3/3 + x^5/60`, with `x = 3.14159 / 3`
- Independently derived result:
  - final-only chop `1.7325896`
  - final-only round `1.7325897`
- Calculator result:
  - final-only chop `1.7325896`
  - final-only round `1.7325897`
  - Horner stepwise `1.7325896`
  - Direct stepwise `1.7325896`
- Match classification: exact match
- What this proves: the final-only polynomial oracle is correct for this textbook case, and the two stepwise methods agree here.

### Near-root polynomial sensitivity

- Problem: `(x - 2)^13`, with `x = 2.0001`, `k = 6`, chopping
- Independently derived result:
  - exact value `0.10000000 * 10^-51`
  - final-only value `0.100000 * 10^-51`
- Calculator result:
  - exact value `0.10000000 * 10^-51`
  - final-only value `0.100000 * 10^-51`
  - Horner stepwise `-68.4`
  - Direct stepwise `40`
- Match classification: exact match
- What this proves: the engine is correctly exposing a severe sensitivity case where stepwise evaluation can diverge dramatically from the tiny final-only value.

### Cancellation-heavy polynomial sensitivity

- Problem: `(x - 1)^5`, with `x = 1.0001`, `k = 6`, chopping
- Independently derived result:
  - exact value `0.10000000 * 10^-19`
  - final-only value `0.100000 * 10^-19`
- Calculator result:
  - exact value `0.10000000 * 10^-19`
  - final-only value `0.100000 * 10^-19`
  - Horner stepwise `0`
  - Direct stepwise `0`
- Match classification: exact match
- What this proves: the engine is correctly surfacing cancellation-driven loss of significance under low precision.

## 5. Cross-Module Consistency Findings

Not audited in this engine-only pass. The current findings do not yet prove Module I/II/III import consistency or stale-state behavior.

## 6. Usability, Accessibility, and Cognitive-Load Findings

Not the focus of this pass. No issue is recorded here unless it changes the meaning of the mathematics, and no such issue was discovered in the engine-only audit.

## 7. Top 5 Improvements Before Students Should Rely on the App

1. Formalize the exact-path vs calc-path contract in one place so future features cannot create silent semantic drift.
2. Extract reusable harness helpers so future stress cases are cheaper to add and easier to read.
3. Add a follow-up audit for cross-module import consistency and stale-state behavior now that the core engine contracts are cleaner.
4. Expand parity coverage toward deeper complex-number storage behavior, not just scalar-real alignment.
5. Extend the result-package pattern to Module II if its boundary has similar ad hoc assembly.

## 8. Residual Risks

- Complex-number machine storage parity is still not deeply audited.
- The harness is deterministic and high-signal, but it is still not a broad random sweep.
- Cross-module imports and UI stale-state handling remain outside this engine-only pass.
- Future refactors could still damage semantics if they bypass or weaken the current audit harness.
- Module II and some UI summary logic are still more tightly coupled to `app.js` than ideal.

## 9. Recommended Next Command

`/brainstorm` to design the next cleanup pass (Module II boundary or cross-module import consistency), using the 42-case harness as the safety rail.
