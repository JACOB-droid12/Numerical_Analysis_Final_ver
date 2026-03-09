# Math Layout Alignment Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the preview/result math layout so operators like `+` and `−` stop dropping to the bottom of the line next to fractions, while preserving the improved fraction/power readability.

**Architecture:** Keep the current semantic math renderer and numeric logic intact. Apply a small structural adjustment in the binary renderer to keep additive rows stable, then retune the math CSS so operators are visually centered against tall fraction/power units instead of sharing the same baseline behavior as numbers and exponents.

**Tech Stack:** Static HTML/CSS/JS, existing `math-display.js` renderer, Playwright MCP for browser validation.

---

### Task 1: Lock the regression and target expressions

**Files:**
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/math-display.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`

**Step 1: Capture the broken alignment cases**
Use these as the required visual fixtures:
- `(1/3 + 6/5) + 0.948854 - (5/30 + 6/59)`
- `2x - x^3/3 + x^5/60`
- `3/4 + 5/6`
- `x^x + 1`

**Step 2: Confirm current regression outputs**
Record that the current issue is:
- fractions read better than before
- `+` and `−` sit too low relative to the fractions
- the line no longer feels like one balanced equation

**Step 3: Record numeric regression fixtures**
Keep these numeric checks unchanged after the styling fix:
- Module I expression:
  - `((1/3 + 6/5) + 0.948854) - (5/30 + 6/59)`, `k=8`, chopping
  - stepwise `2.2138257`
  - final-only `2.2138257`
- Module III:
  - `2x - x^3/3 + x^5/60`, `x = 3.14159/3`, `k=8`, rounding
  - final-only `1.7325897`
  - Horner `1.7325898`
  - Direct `1.7325897`

### Task 2: Tweak the binary renderer structure without changing semantics

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/math-display.js`

**Step 1: Keep one stable wrapper for additive rows**
In the binary-render path, keep additive/multiplicative expressions in a single stable row wrapper instead of creating a structure that encourages operator drift.

The target behavior is:
- fractions remain self-contained units
- powers remain self-contained units
- additive rows still read as one equation line
- no parser or AST behavior changes

**Step 2: Preserve these existing behaviors**
Do not change:
- fraction rendering structure
- radical rendering structure
- exact/reference value hierarchy
- complex/polar rendering
- parsing or arithmetic logic

**Step 3: Keep the current flattening boundary**
Only flatten enough to avoid nested inline rhythm problems. Do not remove wrappers in places where grouped math needs its own unit.

**Step 4: Run syntax check**
Run:
```bash
node --check "C:/Users/Emmy Lou/Downloads/New folder (16)/math-display.js"
```
Expected: success with no output

### Task 3: Retune operator alignment and line rhythm

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`

**Step 1: Adjust the shared math row alignment**
Retune these selectors together so the line reads as one balanced equation:
- `.math-display-primary`
- `.math-display-line`
- `.math-inline`
- `.math-inline-binary`

Target:
- slightly more vertical room
- calmer rhythm
- no bottom-heavy operators

**Step 2: Center operators against tall math**
Tune:
- `.math-op`
- `.math-sign`
- `.math-op-implicit`

Target:
- `+` and `−` should sit visually centered next to fractions
- implicit multiplication stays compact
- operators do not collide with fraction bars or denominators

Recommended approach:
- keep operators as inline-flex
- use a slight vertical compensation if needed
- avoid pushing them high enough to break simple expressions like `x+1`

**Step 3: Keep fraction readability gains**
Retune but do not undo the earlier improvement:
- `.math-frac`
- `.math-frac-num`
- `.math-frac-den`
- `.math-frac-bar`

Target:
- fractions stay roomy
- numerator/denominator stay centered
- the fraction block stays vertically centered in the line

**Step 4: Slightly soften superscript lift**
Tune:
- `.math-power`
- `.math-power-base`
- `.math-sup`
- `.math-sup-inner`

Target:
- exponents no longer feel like they float
- `x^3/3` reads as one stable numerator over denominator
- grouped exponents like `(x+1)^(3/2)` still stay visually grouped

**Step 5: Keep previews readable but compact**
Tune:
- preview/result row min-height
- line-height
- row-gap only as much as needed

Target:
- taller than before if necessary
- not bloated
- no clipped or mismatched parentheses

**Step 6: Keep this as one final override block**
Do not scatter the fix across older CSS sections. Put the final intended values into the last math-display tuning block so behavior stays predictable.

### Task 4: Browser-validate the visual fixtures

**Files:**
- Test live app at: `http://192.168.1.9:4173/index.html`

**Step 1: Validate the key broken case**
In Module I and Module III previews, confirm:
- `(1/3 + 6/5) + 0.948854 - (5/30 + 6/59)`
- `2x - x^3/3 + x^5/60`

Expected:
- `+` and `−` are no longer sitting at the bottom of the line
- the expression reads as one balanced equation
- fractions no longer look detached

**Step 2: Validate the supporting fixtures**
Check:
- `3/4 + 5/6`
- `x^x + 1`
- `(x+1)^(3/2)`
- `sqrt(1+x^2)`

Expected:
- grouped powers still read clearly
- fractions still breathe
- roots still align cleanly
- no visual collapse on narrow widths

### Task 5: Run numeric regression checks

**Step 1: Module I regression**
Run the expression:
- `((1/3 + 6/5) + 0.948854) - (5/30 + 6/59)`
- `k = 8`
- `Chopping`

Expected:
- stepwise `2.2138257`
- final-only `2.2138257`

**Step 2: Module III regression**
Run:
- `2x - x^3/3 + x^5/60`
- `x = 3.14159/3`
- `k = 8`
- `Rounding`

Expected:
- final-only `1.7325897`
- Horner `1.7325898`
- Direct `1.7325897`
