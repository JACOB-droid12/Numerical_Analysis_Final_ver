# Engine Correctness Audit Design

## Summary

This pass focuses on the calculation engine itself rather than the UI. The goal is to audit the highest-risk numerical behaviors first, identify where the app could silently teach the wrong thing, and use those findings to guide a later architecture cleanup.

The audit is intentionally targeted instead of broad. For an educational numerical-analysis tool, a small number of subtle edge cases matter more than noisy wide coverage.

## Problem

The current engine split is promising, but some mathematical behavior and UI-facing result shaping still live close together:

- `math-engine.js` handles exact rational arithmetic and machine approximation rules
- `calc-engine.js` handles calculator-style values, complex-number behavior, and machine storage for those values
- `expression-engine.js` handles parsing plus exact and stepwise evaluation
- `poly-engine.js` handles polynomial-specific evaluation paths
- `app.js` still assembles engine outputs into teaching-oriented result objects

That creates two risks:

- subtle numerical inconsistencies can hide inside otherwise clean UI behavior
- later refactors may rearrange uncertain behavior without first proving which behaviors are correct

## Goals

- Audit the most error-prone numerical behaviors before refactoring engine boundaries
- Identify the engine's mathematical assumptions and ambiguous cases
- Separate real correctness issues from acceptable implementation choices
- Produce clear follow-up recommendations for engine cleanup and maintainability work

## Non-Goals

- No broad engine rewrite in this pass
- No new numerical-analysis features
- No speculative cleanup before findings are gathered
- No fuzz-heavy test program as the first step

## Chosen Approach

### Targeted numerical QA audit

Audit a short list of high-risk behaviors, derive expected outcomes independently, and compare those expectations against the current engine.

This was chosen because it gives the strongest signal with the least churn. It also keeps the next architecture pass honest: we will refactor around verified mathematical boundaries instead of guessed ones.

## Audit Areas

### 1. Machine approximation behavior

Focus on:

- chopping vs rounding boundary cases
- guard-digit carry behavior
- zero and near-zero normalization
- exponent movement after trimming
- consistency between `MathEngine.machineApprox` and `CalcEngine.machineApproxValue`

Primary files:

- `C:\Users\Emmy Lou\Downloads\New folder (16)\math-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`

### 2. Expression stepwise behavior

Focus on:

- whether each intermediate stored step uses the selected machine rule
- whether stepwise and final-only intentionally diverge where they should
- whether trace data reflects the stored values students are meant to inspect

Primary file:

- `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`

### 3. Exact-path vs calc-path switching

Focus on:

- when the engine leaves exact rational evaluation
- whether that switch is predictable
- whether special functions, complex values, or unsupported exact cases fall back consistently

Primary files:

- `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`

### 4. Polynomial consistency

Focus on:

- agreement and intentional disagreement among Horner, Direct, and final-only paths
- whether polynomial stepwise storage follows the same machine rules used elsewhere
- whether shared approximation logic behaves consistently with Module I

Primary files:

- `C:\Users\Emmy Lou\Downloads\New folder (16)\poly-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\math-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`

## Deliverables

The audit should produce:

- a short engine assumption map
- a targeted set of reproducible numerical checks
- findings ranked by severity or confidence
- a follow-up recommendation list:
  - fix now
  - document as intended behavior
  - refactor boundary later

## Maintainability Outcome

This audit is also the first step toward cleaner architecture. Once the engine's correctness pressure points are known, the next cleanup pass can separate:

- pure math logic
- machine-storage logic
- expression and polynomial orchestration
- UI-facing formatting and teaching summaries

That sequencing should make future refactors safer and more maintainable.

## Verification

Before calling the audit complete:

- confirm every audited case has a stated expected behavior
- confirm expectations are derived independently of the implementation being checked
- confirm findings distinguish correctness bugs from documented trade-offs
- confirm the follow-up recommendations point to concrete engine boundaries for cleanup
