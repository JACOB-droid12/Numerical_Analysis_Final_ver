# Engine Stress Coverage Design

## Summary

This pass hardens the numerical engine by expanding the targeted audit harness rather than refactoring the engine itself. The goal is to add more independently reasoned stress cases so the app has a stronger mathematical trust layer before any engine-boundary cleanup begins.

## Problem

The first engine audit pass was encouraging: the initial oracle-backed checks all passed. That is good news, but it does not yet mean the engine is broadly hardened.

The current harness is still narrow. Important high-risk categories remain under-tested:

- repeating-decimal storage behavior
- negative-value machine paths
- large exponent-shift interactions
- parity between scalar and calculator-style real storage
- polynomial sensitivity under harder conditions

Without those cases, future engine refactors could still introduce subtle regressions that the current harness would not catch.

## Goals

- Expand the Node audit harness with more high-signal deterministic stress cases
- Keep expectations independently derived and clearly labeled
- Strengthen trust in the engine before any maintainability refactor
- Record new results in the existing engine audit findings document

## Non-Goals

- No engine rewrite in this pass
- No broad random fuzzing in the first hardening round
- No UI changes unless a failing case reveals a semantic mismatch that must be documented
- No speculative refactor before new coverage is in place

## Chosen Approach

### Oracle-first stress harness expansion

Extend `scripts/engine-correctness-audit.js` with curated named case groups drawn from the numerical-analysis stress suite and course-style machine arithmetic behavior.

This was chosen because it gives the strongest, clearest trust signal for an educational calculator. Each new case should represent a meaningful numerical-analysis lesson, not just more lines of testing.

## New Coverage Areas

### 1. Repeating decimals

Focus on values such as `1/3`.

Check:

- stored machine value under chopping and rounding
- normalized form consistency
- whether displayed decimal expectations match the stored machine result

### 2. Negative-value paths

Focus on multiply and divide cases with a negative operand.

Check:

- sign handling under chopping and rounding
- whether normalization and stored signs remain consistent
- whether parity holds across scalar and calculator-style real paths

### 3. Exponent-shift interactions

Focus on cases with strong magnitude movement.

Check:

- normalization after sharp exponent movement
- stored-value correctness after trimming
- whether exponent rollover or shrinkage behaves consistently in both machine paths

### 4. Scalar vs calc parity

Focus on real-valued inputs that should produce the same stored machine result whether they pass through `MathEngine` or `CalcEngine`.

Check:

- same stored decimal result
- same normalized digits where applicable
- same chop/round behavior for comparable scalar real values

### 5. Polynomial sensitivity

Focus on harder polynomial cases than the first Taylor-style oracle.

Check:

- one near-root sensitivity case
- one cancellation-heavy case
- whether Horner, Direct, and final-only diverge only where the machine arithmetic explains it

## Findings Document Updates

The existing findings doc should be expanded with:

- the new hard-problem comparison results
- any newly discovered mismatches or ambiguities
- an updated top-priority recommendation list based on the expanded coverage

## Verification

Before calling this pass complete:

- confirm the harness runs cleanly end to end
- confirm each new case states its expected behavior explicitly
- confirm any failure is classified as numerical mismatch, semantic mismatch, or intended divergence
- confirm the findings document reflects the new coverage and outcomes
