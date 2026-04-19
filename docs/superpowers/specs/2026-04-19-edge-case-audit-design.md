# Edge-Case Audit — Design Specification

**Date:** 2026-04-19
**Status:** Approved
**Backlog ref:** `docs/superpowers/backlog.md` item #1

## 1. Problem

The codebase has 21 test scripts (273 cases in the main runner + ~100 in standalone scripts) that exercise edge cases across all engine modules. Some of these tests may expose crashes, NaN paths, "undefined" in the UI, or confusing stop-reason messages. No input that hit a failure in these logs should survive into the shipping build.

## 2. Approach

**Automated-first.** Run all scripts via Node.js, parse pass/fail output, generate a structured findings report, then fix in priority order.

## 3. Triage Categories

Each failure is categorized:

| Category | Meaning | Action |
|---|---|---|
| **(a) Engine bug** | Wrong answer, NaN, crash, unhandled exception | Fix in engine JS (`root-engine.js`, `calc-engine.js`, `expression-engine.js`, `poly-engine.js`) |
| **(b) UI rendering glitch** | "undefined" in output, missing field, broken formatting | Fix in UI JS (`root-ui.js`, `app.js`, `math-display.js`) |
| **(c) Acceptable limitation** | Divergent method hitting cap, domain errors, inherent IEEE-754 loss | Add/improve `stopReason` string so UI renders a clear explanation |

## 4. Test Inventory

### Main runner (`run-all-255.js`) — 7 suites, 273 cases

| Suite | File | Expected |
|---|---|---|
| Cat 1–4 | `scripts/battery-cat1-4.js` | 60 |
| Cat 2–3 | `scripts/battery-cat2-3.js` | 35 |
| Convergence | `scripts/convergence-tests.js` | 70 |
| Cat 9–10 | `scripts/battery-cat9-10.js` | 42 |
| Cat 11–12 | `scripts/battery-cat11-12.js` | 37 |
| Validation | `scripts/battery-validation.js` | 18 |
| Supplemental 11 | `scripts/supplemental-brutal-11.js` | 11 |

### Standalone scripts — run individually

| Script | Focus |
|---|---|
| `scripts/brutal-tests.js` | Extreme root-finding inputs |
| `scripts/accuracy_brutal_tests.js` | Precision verification |
| `scripts/extreme-stress-test.js` | Boundary conditions |
| `scripts/stress-test.js` | General stress |
| `scripts/sigfig_stress_test.js` | Significant digit logic |
| `scripts/engine-correctness-audit.js` | Engine output correctness |
| `scripts/root-engine-audit.js` | Root engine comprehensive |
| `scripts/root-ui-precision-audit.js` | UI precision formatting |
| `scripts/ieee754-audit.js` | IEEE-754 conversion |

## 5. Process

1. **Run phase** — Execute `node scripts/run-all-255.js` + each standalone script. Capture stdout/stderr.
2. **Triage phase** — Parse output, categorize every failure into (a)/(b)/(c).
3. **Fix phase** — Fix (a) engine bugs and (b) UI glitches inline. For (c) acceptable limitations, add/improve the `stopReason` or diagnostic message.
4. **Verify phase** — Re-run all scripts. Zero crashes, zero "undefined", every stop reason is a readable sentence.

## 6. Output

- **Findings report:** `docs/reports/2026-04-19-edge-case-audit.md` — table of every failure, its category, and resolution
- **Fixed source files** — committed with descriptive messages
- **All scripts passing** on re-run

## 7. Scope Boundaries

**In scope:**
- Running all 21 test scripts
- Fixing engine bugs and UI rendering glitches surfaced by the tests
- Adding clear user-facing messages for acceptable limitations

**Out of scope:**
- Engine rewrites or algorithm changes
- Writing new test scripts
- Performance optimization
- Security audit (separate backlog item)
- Persistent state (separate backlog item)

## 8. Done When

- Every battery passes without crashes
- Every diagnostic `stopReason` string renders a coherent UI state
- No "undefined", no silent failure, no stuck spinner
- Findings report committed
