# Numerical Analysis Lab — Backlog

Logged from the 2026-04-19 PM/Senior Dev review. These are the **Critical** items we chose to defer so we could focus first on completing the convergence graph. Do not ship the next wave without them.

## Critical — next up after convergence graph

### 1. Edge-case audit against existing brutal/stress test logs
**Why:** We already have large log files (`brutal_tests.js`, `bisection_brutal.js`, `bisection_nightmares.js`, `convergence_pathologies_logs.txt`, `extreme_test_logs.txt`, `stress_test_logs.txt`, and the `scripts/battery-*.js` families). No input that hit a crash, NaN path, or confusing UI state in those logs should survive into the shipping build.

**Scope:**
- Re-run each battery against the current `root-engine.js` + `root-ui.js`.
- Triage failures into: (a) engine bug, (b) UI rendering glitch, (c) acceptable but needs a clearer user-facing message.
- Fix (a) and (b). Add explicit "unsupported input" copy for (c).
- Keep this a one-afternoon effort; do not scope-creep into engine rewrites.

**Done when:** every battery passes without crashes, and every diagnostic reason string renders a coherent UI state (no "undefined", no silent failure, no stuck spinner).

### 2. Security pass on ExpressionEngine and math-display.js
**Why:** ExpressionEngine parses user-entered expressions. `math-display.js` renders rich output. If either of them ever drops into `eval`, `new Function`, or unsanitized `innerHTML` with user-derived strings, we have an XSS vector — even on a static site, especially once persistent state lands and stored expressions get rehydrated on page load.

**Scope:**
- Grep the codebase for `eval(`, `new Function(`, `Function(`, and every call site of `innerHTML =` / `insertAdjacentHTML`.
- For each `innerHTML` that interpolates a user-derived value, route through a known-safe helper (textContent, explicit createElement, or a small escape function).
- Confirm ExpressionEngine tokenises+parses rather than executing strings.
- Add a CSP meta tag (`default-src 'self'; script-src 'self'`) as belt-and-braces.
- Add a short note in `DESIGN_AUDIT.md` documenting the policy for future contributors.

**Done when:** no `eval`/`Function` exists in the source, and every `innerHTML` either uses a static template literal or explicitly escaped values.

### 3. Persistent state — localStorage per module
**Why:** "Refresh destroys my homework" is the single most painful UX failure mode for a tool students use during lab sessions. Every module should restore its last computation on reload.

**Scope:**
- One namespaced key per module: `nal:v1:module-1:last`, `nal:v1:module-4:last`, etc. Version the prefix so a future schema change is a safe reset, not a corruption.
- Save the **inputs** (expression, bracket, tolerance, method), not the rendered HTML. Re-run the engine on rehydrate so stored state cannot drift from engine logic.
- Throttle saves (debounce ~300ms) so keystrokes don't hammer storage.
- Gracefully handle `QuotaExceededError` and corrupt JSON — clear that key and continue.
- Add a small "restored from last session" hint near the hero the first time it rehydrates, with a dismiss.
- Do **not** persist anything that contains raw user-uploaded content (if we ever add that).

**Done when:** reloading any module reproduces the last state the user saw, including derived output, without network round-trips.

---

## Notes

- Order within this list is not strict — security (#2) and edge cases (#1) should probably ship before persistent state (#3), because #3 will rehydrate whatever bugs #1 and #2 miss.
- When any item is picked up, promote it to its own spec in `docs/superpowers/specs/` and follow the normal brainstorm → plan → implement cycle.
