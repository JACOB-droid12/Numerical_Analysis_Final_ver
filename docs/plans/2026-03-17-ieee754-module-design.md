# IEEE-754 Module Design

## Summary

Add a new top-level `IEEE-754` teaching module to the numerical analysis lab. The module will focus on IEEE-754 double precision (64-bit) only and support both decimal-to-binary encoding and binary-to-decimal decoding in a split, side-by-side workflow.

The goal is to make the app better at common classroom tasks: converting values into their stored 64-bit representation, decoding known bit patterns, understanding sign/exponent/mantissa fields, and relating a stored floating-point value to spacing, ULP, and special-case behavior.

## Problem

The current app covers machine arithmetic, error analysis, and polynomial evaluation, but it does not provide a dedicated IEEE-754 conversion and interpretation surface.

There is already a standalone helper file available in the workspace, but it is not integrated into the app shell, navigation, or teaching flow. Without a first-class module, users cannot easily work common IEEE-754 exercises such as:

- convert a decimal number to its 64-bit stored representation
- decode a 64-bit pattern into a decimal value
- identify sign, biased exponent, true exponent, and mantissa fields
- recognize zero, subnormal, infinity, and NaN cases
- inspect spacing and interval context around a stored value

## Goals

- Add a new top-level `IEEE-754` tab in the existing sidebar navigation
- Support both `Decimal -> IEEE-754` and `IEEE-754 -> Decimal` directly in the same module
- Restrict scope to IEEE-754 double precision (64-bit) only
- Present sign, exponent, mantissa, classification, normalization, and interpretation clearly
- Show interval / ULP teaching context for finite values
- Fit the visual and interaction style of the current app

## Non-Goals

- No 32-bit float mode in this pass
- No deep engine refactor across `MathEngine`, `CalcEngine`, or `PolyEngine`
- No new backend, dependency, or build step
- No attempt to replace the app's existing machine arithmetic modules

## Chosen Approach

### New self-contained top-level module

Add a new sidebar tab and panel for IEEE-754 instead of embedding the feature inside Module I or wiring it only into internal engines.

This was chosen because it makes the feature discoverable, keeps it aligned with the app's existing module-based teaching structure, and avoids overloading the single-operation helper with a second conceptually separate workflow.

The core conversion logic should remain isolated in a dedicated script based on the existing helper file. `app.js` should handle tab behavior, input validation, rendering, and status updates, while `index.html` and `styles.css` provide a native-looking UI shell for the new module.

## Layout And User Flow

The new `IEEE-754` tab appears alongside the existing `Calculation`, `Errors`, `Polynomial`, and `Tutorial` tabs.

Inside the module, the first visible layer is a split converter layout with two equal input cards:

### 1. Decimal to IEEE-754

- decimal input field
- convert button
- short hint text with sample values such as `0.1`, `-13.25`, `1e-300`, `Infinity`, and `NaN`

### 2. IEEE-754 to Decimal

- 64-bit binary input field
- decode button
- hint text that accepts grouped or ungrouped bits

Below the input cards, one shared result stage updates from whichever conversion was run most recently.

The shared result stage should include:

- full 64-bit pattern grouped as `sign | exponent | mantissa`
- decoded sign bit
- biased exponent
- true exponent
- mantissa bits and interpretation
- final decimal value
- classification note (`normal`, `subnormal`, `zero`, `infinity`, `NaN`)
- explanation block for normalization or special-case behavior
- interval / ULP panel for teaching spacing
- a steps area whose content depends on the conversion direction

This preserves visibility for both workflows without nested navigation or mode hiding.

## Data Flow

The IEEE-754 module should use the helper file as the conversion source of truth and expose its API similarly to the other app scripts.

Two primary flows will exist:

### Decimal input flow

1. Read the decimal input string
2. Validate accepted decimal-like values, including `Infinity`, `-Infinity`, and `NaN`
3. Convert through the IEEE helper
4. Normalize the returned data into a UI-friendly result object
5. Render the shared result stage and direction-specific explanation steps

### Binary input flow

1. Read the binary input string
2. Strip spaces and separators
3. Require exactly 64 binary digits after cleanup
4. Decode through the IEEE helper
5. Normalize the returned data into the same result shape used by the renderer
6. Render the shared result stage and direction-specific explanation steps

The renderer should work from a common result object so the display layer is not tightly coupled to one conversion direction.

## Validation And Error Handling

Validation should match the app's current approach: inline errors, field focus on failure, and minimal interruption.

### Decimal validation

- accept normal decimal syntax
- accept scientific notation
- accept `Infinity`, `-Infinity`, and `NaN`
- reject empty or invalid text with a clear inline message

### Binary validation

- allow spaces between groups
- allow a raw 64-bit string
- strip non-bit separators if intentionally supported by the parser
- reject any cleaned value that is not exactly 64 bits

### Error presentation

- render inline feedback inside the IEEE module
- mark invalid fields with `aria-invalid`
- focus the first invalid field
- keep error copy short and direct

## Special Cases

The module should handle IEEE-754 edge cases explicitly and visibly.

### Zero

- preserve `+0` and `-0` distinction when relevant
- show all-zero exponent and mantissa
- classify the value as zero

### Subnormal numbers

- label the value as subnormal
- show that there is no implicit leading `1`
- compute exponent interpretation accordingly

### Infinity

- label positive and negative infinity clearly
- show exponent all ones and mantissa all zeros
- suppress standard interval messaging

### NaN

- label as NaN
- show exponent all ones with non-zero mantissa
- explain that NaN does not map to an ordinary real interval

### Final stored bit pattern

For decimal-to-binary conversion, the final 64-bit result should come from the browser's native double-precision storage path so the displayed answer matches actual IEEE-754 double behavior rather than only an approximate hand-work simulation.

## Teaching Output

The steps area should adapt to the direction of conversion.

### Decimal to IEEE-754 steps

- determine the sign bit
- separate integer and fractional parts conceptually
- show repeated division / multiplication notes where available
- explain normalization into binary scientific form
- show exponent biasing
- show final field assembly into `sign | exponent | mantissa`

### IEEE-754 to Decimal steps

- split the 64-bit pattern into fields
- decode sign
- convert biased exponent to true exponent
- reconstruct the significand
- note whether the value is normal, subnormal, infinity, or NaN
- show final interpreted decimal value

### Interval / ULP panel

For finite values, show:

- spacing / ULP idea
- neighboring value context when meaningful
- interval wording consistent with current teaching style

For infinities and NaN, replace the panel content with explicit "not standard for this value class" messaging instead of pretending the same interpretation applies.

## Implementation Structure

The module should remain self-contained and avoid unnecessary coupling to the existing machine arithmetic engines.

### Files expected to change

- `index.html`
  - add sidebar nav item for `IEEE-754`
  - add new module panel and result-stage markup
- `styles.css`
  - add IEEE module layout, bit-pattern styling, and responsive behavior
- `app.js`
  - wire the new tab
  - add IEEE input handlers, validation, rendering, and status updates
- `to add/ieee754.js`
  - migrate or adapt into a loadable project script location as part of implementation

### UI styling direction

Reuse the current app's visual language:

- hero answer cards for the primary converted value
- metric lists for sign/exponent/mantissa details
- mono styling for bit patterns
- disclosure or secondary panels for deeper explanation
- mobile-friendly stacked layout when space is limited

## Verification

Before calling the feature complete, verify both correctness and integration behavior.

### Core conversion checks

- `0`
- `-0`
- `0.1`
- `13.25`
- a very small subnormal case
- `Infinity`
- `NaN`
- known 64-bit patterns decoded back to expected values

### UI checks

- new sidebar tab switches correctly
- only one panel is active at a time
- inline validation behaves like the other modules
- status announcements remain accessible
- layout works on desktop and mobile widths

### Regression checks

- existing `Calculation`, `Errors`, `Polynomial`, and `Tutorial` tabs still function
- existing compute flows still produce results after the new script and tab are added

## Open Implementation Notes

- The helper currently lives in an untracked `to add` folder, so implementation should decide whether to move it, rename it, or wrap it for production use.
- The final render layer should avoid duplicating raw helper structures directly in the DOM; a small adapter in `app.js` will keep the UI code cleaner.
- Because the app is teaching-focused, explanation clarity matters as much as mathematical correctness.
