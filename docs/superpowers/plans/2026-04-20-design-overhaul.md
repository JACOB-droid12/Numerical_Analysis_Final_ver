# Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the 20-item DESIGN_AUDIT.md and the calibrated `design-taste-frontend` rules to the Machine Arithmetic & Error Analysis Lab, transforming the surface feel without restructuring the architecture.

**Architecture:** Vanilla HTML/CSS/JS (no framework, no bundler). Edit `styles.css` (3,576 lines) for tokens/typography/layout/state, surgical edits to `index.html` for content/meta, and zero changes to engine JS files. Visual verification via the Playwright MCP `browser_*` tools that are already available in this session.

**Tech Stack:** HTML 5, CSS Custom Properties + container queries, vanilla ES module JS. No new dependencies. Active dial calibration: `DESIGN_VARIANCE=5`, `MOTION_INTENSITY=3`, `VISUAL_DENSITY=7` (defined in `skills/design-taste-frontend/SKILL.md`).

---

## Audit Reality Check (already done — skip these audit items)

Re-grepping confirmed several audit items are already implemented:

- **Audit #3 (sidebar 100vh → 100dvh):** DONE. `styles.css:1659` already uses `100dvh`. No `100vh` matches anywhere in the file.
- **Audit #4 (h1 size bump):** DONE. `styles.css:338-344` already uses `clamp(2rem, 4vw, 3rem)`, `line-height: 1.02`, `letter-spacing: -0.04em`, `text-wrap: balance`.
- **Audit #2 partial (warm `--bg`):** DONE for `--bg` (`#fafaf7` at line 30), but `--surface-0: #ffffff` (line 32) is still pure white — surface cooling is the remaining work.
- **Audit token for shadow tier:** `--shadow-soft` is already DEFINED with a tinted shadow at line 47 — but 19 components override to `box-shadow: none`. Reapplying it on the hero answer is what remains.

The 6 module accents currently sit at ~71-79% saturation; most need a 5-10% drop to hit the calibrated <70% rule.

---

## File Structure

Files modified by this plan (no new files except plan-internal):

| File | Responsibility | Modifications |
|------|----------------|---------------|
| `styles.css` | Single design system + components stylesheet | Tokens, typography, layout, interactivity, components, density |
| `index.html` | Page shell + module markup | OG/Twitter meta, sentence-case headers, inline-style extraction, varied empty-state copy |
| `app.js` | Module orchestration + render functions | None expected; verify no regressions |
| `root-ui.js` | Root-finding UI | Possibly varied empty-state copy if strings are constructed there |
| `DESIGN_AUDIT.md` | Audit ledger | Append a "resolved on 2026-04-20" footer with item disposition |
| `docs/superpowers/plans/2026-04-20-design-overhaul.md` | This plan | Created |

No new CSS files, no new JS files, no new dependencies. Single sweep.

---

## Task 0: Pre-flight & baseline snapshot

**Files:**
- Modify: none yet
- Verify: working tree, dev server, Playwright availability

- [ ] **Step 1: Confirm working tree is acceptable for further edits**

Run:
```bash
git status
```
Expected: `skills/design-taste-frontend/SKILL.md` is modified (calibrated skill from prior turn), `docs/superpowers/plans/2026-04-20-design-overhaul.md` is untracked (this file). Anything else uncommitted should be either intended for this overhaul or stashed before proceeding. If the user has unrelated in-flight work, stop and confirm before continuing.

- [ ] **Step 2: Commit the calibrated skill + this plan as Task 0 baseline**

Run:
```bash
git add skills/design-taste-frontend/SKILL.md docs/superpowers/plans/2026-04-20-design-overhaul.md
git commit -m "$(cat <<'EOF'
docs: calibrate design-taste skill and add overhaul plan

Tune dials for the Numerical Analysis Lab:
DESIGN_VARIANCE 8->5, MOTION_INTENSITY 6->3, VISUAL_DENSITY 4->7.
Strip React/Tailwind/Framer assumptions, unban serif for academic
context, permit 6-color module palette under <70% saturation.

Plan implements the 20-item DESIGN_AUDIT and the calibrated rules.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
Expected: 1 commit, 2 files changed.

- [ ] **Step 3: Start a static dev server in the background**

Run:
```bash
python -m http.server 8765 --directory "C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master"
```
Use `run_in_background: true`. Expected: server logs `Serving HTTP on :: port 8765`.

- [ ] **Step 4: Snapshot the baseline UI in light + dark + exam-density modes**

Use the Playwright MCP tool `mcp__plugin_playwright_playwright__browser_navigate` to open `http://localhost:8765/index.html`, then `mcp__plugin_playwright_playwright__browser_take_screenshot` for each of:
- light theme, default density, mod1 (basic) active
- dark theme, default density, mod1 active
- light theme, exam density (set `localStorage.setItem('density','exam')` then reload)
- mobile viewport: `mcp__plugin_playwright_playwright__browser_resize` to width=375, height=812; light theme, mod1
- dark theme, mod3 (rounding) active — tab through nav

Save screenshots to `docs/superpowers/plans/baseline-2026-04-20/` (create the dir). Filenames: `light-mod1.png`, `dark-mod1.png`, `light-exam.png`, `mobile-light.png`, `dark-mod3.png`.

Expected: 5 PNGs that you can compare against final-state screenshots in Task 9.

- [ ] **Step 5: Commit the baseline snapshots**

Run:
```bash
git add docs/superpowers/plans/baseline-2026-04-20/
git commit -m "docs: capture baseline screenshots before design overhaul"
```

---

## Task 1: Token foundation — z-index scale, surface cooling, accent desaturation, applied shadow tier

**Files:**
- Modify: `styles.css:1-26` (`:root` block — add `--z-*` tokens)
- Modify: `styles.css:28-126` (`html[data-theme="light"]` and `html[data-theme="dark"]` — surface cooling, accent desaturation)
- Modify: `styles.css:152` (skip-link `z-index: 10000` → `var(--z-skiplink)`)
- Modify: `styles.css:1780, 1876, 1919, 2723, 3518` (hardcoded z-index values → tokens)
- Modify: `styles.css` answer-hero block (apply `--shadow-soft`)
- Modify: `styles.css:1729-1732` (active sidebar nav — apply soft shadow tint)

This is one task because the token block is one logical unit; ordering changes within :root would make the diff hard to read if split.

- [ ] **Step 1: Read the current `:root` block to confirm line range**

Run via Read tool: `styles.css` lines 1-30. Verify the token block ends at line 26.

- [ ] **Step 2: Replace the `:root` block to add z-index scale**

Edit `styles.css`. OLD (lines 14-26):
```css
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --transition-fast: 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --transition-base: 240ms cubic-bezier(0.2, 0.8, 0.2, 1);

  --sidebar-width: 240px;
  --sidebar-collapsed-width: 56px;
  --sidebar-transition: 200ms ease;
}
```
NEW:
```css
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --transition-fast: 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --transition-base: 240ms cubic-bezier(0.2, 0.8, 0.2, 1);

  --sidebar-width: 240px;
  --sidebar-collapsed-width: 56px;
  --sidebar-transition: 200ms ease;

  /* Z-index scale — never use arbitrary values in component CSS */
  --z-overlay: 50;
  --z-sticky: 300;
  --z-popover: 500;
  --z-sidebar: 700;
  --z-modal: 800;
  --z-skiplink: 1000;
}
```

- [ ] **Step 3: Replace the light-theme color block to cool surfaces and desaturate accents**

Edit `styles.css`. OLD (lines 30-68 — covers `--bg` through `--mod6-soft` in light theme):
```css
  --bg: #fafaf7;
  --bg-accent: #f3f4f6;
  --surface-0: #ffffff;
  --surface-1: #f3f4f6;
  --surface-2: #e5e7eb;
  --surface-3: #d1d5db;
  --surface-strong: #f9fafb;
  --text: #1a1a1a;
  --muted: #6b7280;
  --line: #e5e7eb;
  --line-strong: #d1d5db;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.08);
  --accent-strong: #1d4ed8;
  --danger: #dc2626;
  --danger-soft: rgba(220, 38, 38, 0.08);
  --focus-ring: rgba(37, 99, 235, 0.2);
  --shadow-soft: 0 1px 2px rgba(24, 24, 27, 0.04), 0 8px 24px -12px rgba(24, 24, 27, 0.12);
  --shadow-panel: none;
  --surface-raised: #f3f4f6;
  --text-subtle: #6b7280;
  --on-accent: #ffffff;
  --warning: #b7791f;
  --radius: 6px;
  --radius-pill: 100px;
  --surface: #ffffff;

  --mod1-accent: #2b66de;
  --mod1-soft: rgba(43, 102, 222, 0.08);
  --mod2-accent: #9139e0;
  --mod2-soft: rgba(145, 57, 224, 0.08);
  --mod3-accent: #1a8ba2;
  --mod3-soft: rgba(26, 139, 162, 0.08);
  --mod4-accent: #158a64;
  --mod4-soft: rgba(21, 138, 100, 0.08);
  --mod5-accent: #c87519;
  --mod5-soft: rgba(200, 117, 25, 0.08);
  --mod6-accent: #6b7280;
  --mod6-soft: rgba(107, 114, 128, 0.08);
```
NEW (warm canvas, slightly cooler surfaces for separation, all 6 modules at <70% sat, tinted shadow already retained):
```css
  --bg: #fafaf7;
  --bg-accent: #f3f3ef;
  --surface-0: #fdfcf8;
  --surface-1: #f3f3ef;
  --surface-2: #e8e7e1;
  --surface-3: #d4d2cb;
  --surface-strong: #f7f6f1;
  --text: #1a1a1a;
  --muted: #6b6b73;
  --line: #e7e6e0;
  --line-strong: #d2d0c9;
  --accent: #3568c2;
  --accent-soft: rgba(53, 104, 194, 0.08);
  --accent-strong: #2a519b;
  --danger: #b8332b;
  --danger-soft: rgba(184, 51, 43, 0.08);
  --focus-ring: rgba(53, 104, 194, 0.22);
  --shadow-soft: 0 1px 2px color-mix(in srgb, var(--text) 4%, transparent), 0 8px 24px -12px color-mix(in srgb, var(--text) 10%, transparent);
  --shadow-panel: none;
  --surface-raised: #fdfcf8;
  --text-subtle: #6b6b73;
  --on-accent: #ffffff;
  --warning: #a16a1d;
  --radius: 6px;
  --radius-pill: 100px;
  --surface: #fdfcf8;

  /* Module accents — saturation capped <70% per calibrated taste skill */
  --mod1-accent: #3a6cba;
  --mod1-soft: rgba(58, 108, 186, 0.08);
  --mod1-strong: #2d568f;
  --mod1-contrast: #ffffff;
  --mod2-accent: #934aac;
  --mod2-soft: rgba(147, 74, 172, 0.08);
  --mod2-strong: #743887;
  --mod2-contrast: #ffffff;
  --mod3-accent: #2e8a9c;
  --mod3-soft: rgba(46, 138, 156, 0.08);
  --mod3-strong: #226878;
  --mod3-contrast: #ffffff;
  --mod4-accent: #2f8b6a;
  --mod4-soft: rgba(47, 139, 106, 0.08);
  --mod4-strong: #226753;
  --mod4-contrast: #ffffff;
  --mod5-accent: #b27520;
  --mod5-soft: rgba(178, 117, 32, 0.08);
  --mod5-strong: #8a5a18;
  --mod5-contrast: #ffffff;
  --mod6-accent: #6e6e76;
  --mod6-soft: rgba(110, 110, 118, 0.08);
  --mod6-strong: #54545b;
  --mod6-contrast: #ffffff;
```

- [ ] **Step 4: Replace the dark-theme color block with the same shape (cool tinting, desaturated accents, mod*-strong tokens)**

Edit `styles.css`. OLD (lines 80-118):
```css
  --bg: #111113;
  --bg-accent: #18181b;
  --surface-0: #1a1a1e;
  --surface-1: #202024;
  --surface-2: #2a2a2e;
  --surface-3: #333338;
  --surface-strong: #1e1e22;
  --text: #e4e4e7;
  --muted: #a1a1aa;
  --line: #2a2a2e;
  --line-strong: #3f3f46;
  --accent: #3b82f6;
  --accent-soft: rgba(59, 130, 246, 0.12);
  --accent-strong: #60a5fa;
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.12);
  --focus-ring: rgba(59, 130, 246, 0.2);
  --shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 30px -14px rgba(0, 0, 0, 0.7);
  --shadow-panel: none;
  --surface-raised: #202024;
  --text-subtle: #a1a1aa;
  --on-accent: #ffffff;
  --warning: #ecc94b;
  --radius: 6px;
  --radius-pill: 100px;
  --surface: #1a1a1e;

  --mod1-accent: #6ca7ef;
  --mod1-soft: rgba(108, 167, 239, 0.10);
  --mod2-accent: #c28cf2;
  --mod2-soft: rgba(194, 140, 242, 0.10);
  --mod3-accent: #2dcae1;
  --mod3-soft: rgba(45, 202, 225, 0.10);
  --mod4-accent: #43c796;
  --mod4-soft: rgba(67, 199, 150, 0.10);
  --mod5-accent: #ebbd33;
  --mod5-soft: rgba(235, 189, 51, 0.10);
  --mod6-accent: #a1a1aa;
  --mod6-soft: rgba(161, 161, 170, 0.10);
```
NEW:
```css
  --bg: #111113;
  --bg-accent: #17171a;
  --surface-0: #1a1a1e;
  --surface-1: #202024;
  --surface-2: #2a2a2e;
  --surface-3: #333338;
  --surface-strong: #1e1e22;
  --text: #e4e4e7;
  --muted: #9b9ba3;
  --line: #2a2a2e;
  --line-strong: #3f3f46;
  --accent: #5a9bf2;
  --accent-soft: rgba(90, 155, 242, 0.12);
  --accent-strong: #7eb1f5;
  --danger: #e26a64;
  --danger-soft: rgba(226, 106, 100, 0.12);
  --focus-ring: rgba(90, 155, 242, 0.28);
  --shadow-soft: 0 1px 2px color-mix(in srgb, #000 32%, transparent), 0 10px 30px -14px color-mix(in srgb, #000 56%, transparent);
  --shadow-panel: none;
  --surface-raised: #202024;
  --text-subtle: #9b9ba3;
  --on-accent: #0e0e10;
  --warning: #d8b13f;
  --radius: 6px;
  --radius-pill: 100px;
  --surface: #1a1a1e;

  /* Dark-mode module accents — saturation matched to light, brightness lifted for contrast */
  --mod1-accent: #6c9ce4;
  --mod1-soft: rgba(108, 156, 228, 0.10);
  --mod1-strong: #92b6ee;
  --mod1-contrast: #0e0e10;
  --mod2-accent: #b48ad0;
  --mod2-soft: rgba(180, 138, 208, 0.10);
  --mod2-strong: #c9a9df;
  --mod2-contrast: #0e0e10;
  --mod3-accent: #5cb6c7;
  --mod3-soft: rgba(92, 182, 199, 0.10);
  --mod3-strong: #87cdda;
  --mod3-contrast: #0e0e10;
  --mod4-accent: #5cb691;
  --mod4-soft: rgba(92, 182, 145, 0.10);
  --mod4-strong: #87ceae;
  --mod4-contrast: #0e0e10;
  --mod5-accent: #d4a649;
  --mod5-soft: rgba(212, 166, 73, 0.10);
  --mod5-strong: #e2bb73;
  --mod5-contrast: #0e0e10;
  --mod6-accent: #9b9ba3;
  --mod6-soft: rgba(155, 155, 163, 0.10);
  --mod6-strong: #b8b8be;
  --mod6-contrast: #0e0e10;
```

- [ ] **Step 5: Replace hardcoded z-indexes with tokens**

Edit `styles.css` six locations:

Location 1 — `styles.css:152` (.skip-link):
```css
  z-index: 10000;
```
→
```css
  z-index: var(--z-skiplink);
```

Location 2 — `styles.css:1780` (collapsed sidebar tooltip):
```css
  z-index: 100;
```
→
```css
  z-index: var(--z-popover);
```

Location 3 — `styles.css:1876` (sidebar mobile backdrop):
```css
  z-index: 999;
```
→
```css
  z-index: var(--z-modal);
```

Location 4 — `styles.css:1919` (sidebar mobile container):
```css
    z-index: 1000;
```
→
```css
    z-index: var(--z-modal);
```

Location 5 — `styles.css:2723` (varies by surrounding rule — verify it's the noise overlay or compatible):

Read context first via `Read` tool with offset 2715 limit 20 to confirm what `z-index: 50` belongs to. If it is a fixed pointer-events overlay (per audit §5 / calibrated skill §5), replace with `var(--z-overlay)`. If it's ambiguous, leave it and note in commit message.

Location 6 — `styles.css:3518` (verify context similarly via Read offset 3510 limit 20). If sticky element, use `var(--z-sticky)`; else leave with note.

- [ ] **Step 6: Apply the soft shadow tier to the primary answer hero**

Find `.answer-hero` in `styles.css` (use Grep). Confirm whether it currently has `box-shadow: none`. Replace with:
```css
.answer-hero {
  /* keep existing properties; ADD or REPLACE the box-shadow line: */
  box-shadow: var(--shadow-soft);
}
```
This is the ONLY surface that gets the soft shadow tier. All other components keep `box-shadow: none`.

- [ ] **Step 7: Tint active sidebar nav with the soft shadow**

Edit `styles.css:1728-1732` (`.sidebar-nav-item.active`):
```css
.sidebar-nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 600;
}
```
→
```css
.sidebar-nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 600;
  box-shadow: inset 2px 0 0 var(--accent-strong);
}
```
(Inset shadow as a left-edge accent rule — this is `box-shadow` used for a 1px ledger line, not a drop shadow. Compatible with the calibrated motion-3 / variance-5 rules.)

- [ ] **Step 8: Verify CSS still parses and tokens resolve**

Open the page in Playwright (already running on :8765 from Task 0):
```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_console_messages
```
Expected: no CSS parse errors, no console warnings about missing custom properties. The page should render with the new (warmer, slightly cooler-surfaced) light theme.

- [ ] **Step 9: Take a quick comparison snapshot of the answer hero**

```
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Compare to `baseline-2026-04-20/light-mod1.png`. The answer-hero card should now have a faint tinted shadow; surfaces should read warmer; accents should look slightly muted vs the pre-change blue/purple.

- [ ] **Step 10: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
feat(css): add z-index scale, cool surfaces, desaturate module accents

- Introduce --z-skiplink, --z-modal, --z-sidebar, --z-popover,
  --z-sticky, --z-overlay tokens; replace hardcoded values.
- Cool light-mode surfaces (--surface-0..3) so they separate from
  the warmer --bg #fafaf7 canvas without clashing.
- Drop saturation on all six module accents below 70% (calibrated
  taste-skill rule); add --modN-strong and --modN-contrast tokens.
- Apply --shadow-soft (tinted via color-mix) only to the primary
  answer hero card and an inset edge on the active sidebar nav.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Kill the field-shell `!important` war via `:where()`

**Files:**
- Modify: `styles.css:270-279` (base `input, select` rule)
- Modify: `styles.css:488-500` (`.search-shell input` — remove `!important`)
- Modify: `styles.css:2055-2060` (duplicate field-shell block — remove `!important`)

- [ ] **Step 1: Read the current base input rule**

Read `styles.css` lines 270-280:
```css
input,
select {
  width: 100%;
  min-height: 48px;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  color: var(--text);
}
```

- [ ] **Step 2: Refactor base input rule to use `:where()` for zero-specificity defaults**

Edit `styles.css:270-279`:

OLD:
```css
input,
select {
  width: 100%;
  min-height: 48px;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  color: var(--text);
}
```
NEW:
```css
:where(input, select) {
  width: 100%;
  min-height: 48px;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  color: var(--text);
}
```

`:where()` keeps the selector targeting the same elements but reduces specificity to (0,0,0), so any class-based override wins without needing `!important`.

- [ ] **Step 3: Drop the `!important`s from the search-shell input rule**

Edit `styles.css:488-500`. OLD:
```css
.search-shell input {
  grid-area: input;
  min-height: 44px;
  padding: 0.5rem 0.72rem;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--surface-0) !important;
  box-shadow: none !important;
  font-size: 1.1rem;
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: -0.01em;
}
```
NEW:
```css
.search-shell input {
  grid-area: input;
  min-height: 44px;
  padding: 0.5rem 0.72rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  box-shadow: none;
  font-size: 1.1rem;
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 4: Drop the `!important`s from the duplicate field-shell block**

Edit `styles.css:2055-2060`. Read the surrounding 10 lines first to confirm exact selector (it may be `.search-shell input` again, or a sibling class). OLD pattern:
```css
  border: 1px solid var(--line) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--surface-0) !important;
  box-shadow: none !important;
```
NEW:
```css
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-0);
  box-shadow: none;
```

If the block at lines 2055-2060 is identical-purpose to lines 488-500, mark it for deletion in Task 3 (consolidation). For now just remove `!important`s so the file still works.

- [ ] **Step 5: Verify in browser — focus the search input, confirm visual is unchanged**

Reload `http://localhost:8765/index.html` and click into the omni-search input.
```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_click on the search input
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Expected: input retains the same border, background, border-radius, focus ring, font as before (since the rules are now lower-specificity but still match). No layout shift.

- [ ] **Step 6: Grep-verify `!important` count dropped**

Run via Grep tool:
```
pattern: !important
path: styles.css
output_mode: count
```
Expected: count drops by 8 (4 from line 491-495 region, 4 from 2057-2060 region). Remaining `!important`s should all be inside `[hidden]`, `.visually-hidden`, `prefers-reduced-motion`, or `data-density="exam"` blocks — those are legitimate.

- [ ] **Step 7: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
refactor(css): drop !important from field shells via :where()

Lower the base input/select rule to (0,0,0) specificity using
:where() so component overrides win without flag-waving. Removes
8 instances of !important from .search-shell field rules.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Merge duplicate `data-density="exam"` blocks

**Files:**
- Modify: `styles.css:1413-1554` (primary exam-density block)
- Modify: `styles.css:2104-2110` (duplicate redefinitions)
- Modify: `styles.css:2326-2341` (second duplicate region)

- [ ] **Step 1: Read all three exam-density regions to understand the overlap**

Read `styles.css` lines 1413-1560.
Read `styles.css` lines 2100-2120.
Read `styles.css` lines 2320-2360.

Catalog each `html[data-density="exam"]` selector that appears more than once. From the earlier grep, the recurring selectors include:
- `html[data-density="exam"] .welcome-strip` (lines 1424, 2106, 2328)
- `html[data-density="exam"] .module-shell` (lines 1447, 2110, 2333)
- `html[data-density="exam"] .control-band` / `.summary-band` / `.result-stage` / `.comparison-board` (lines 1456-1460, 2338-2341)

- [ ] **Step 2: Decide which block is authoritative**

The primary block at 1413-1554 is the most comprehensive. The blocks at 2104-2110 and 2326-2341 are partial reapplications likely added during a later refactor pass (the comment "Calculator-first normalization reset" / "Modern academic calculator redesign" suggests two competing refactors). Treat 1413-1554 as authoritative.

- [ ] **Step 3: Diff the duplicate selectors against the authoritative block**

For each selector that appears in both, compare property-by-property. Three outcomes:
- **Identical** → delete the duplicate.
- **Superset (later block adds new properties)** → merge new properties into the authoritative block, then delete the duplicate.
- **Conflicting (later block changes a value)** → flag for user decision. The later block's value usually wins in CSS source order, so the authoritative block must adopt it.

Document each selector's disposition inline in a temporary file `/tmp/exam-dedupe.md` — keep it tracked locally only, do not commit. Example row:

```
| selector | line A | line B | line C | disposition |
| .welcome-strip | 1424 | 2106 | 2328 | merge B+C into A: B adds margin-bottom, C adds border-top |
| .module-shell  | 1447 | 2110 | 2333 | merge: C wins padding (superset) |
```

- [ ] **Step 4: Apply the merges**

For each row in the disposition table, edit the authoritative block (1413-1554) to absorb merged properties, then delete the duplicate selectors at 2104-2110 and 2326-2341.

If a selector at 2104-2110 or 2326-2341 has NO equivalent in 1413-1554 (rare), MOVE it into the authoritative block in alphabetical or thematic order.

- [ ] **Step 5: Verify exam-density mode still renders correctly**

In Playwright:
```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_evaluate → document.documentElement.setAttribute('data-density', 'exam')
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Compare to `baseline-2026-04-20/light-exam.png`. Should be visually identical (or very nearly so — minor differences are acceptable if they trace to a deliberate merged property).

- [ ] **Step 6: Verify standard density still renders correctly**

```
mcp__plugin_playwright_playwright__browser_evaluate → document.documentElement.setAttribute('data-density', 'standard')
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Compare to `baseline-2026-04-20/light-mod1.png`. Should be unchanged.

- [ ] **Step 7: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
refactor(css): merge duplicate data-density='exam' blocks

Three separate exam-density definitions (lines 1413-1554, 2104-2110,
2326-2341) were the result of overlapping refactor passes. Consolidate
into one authoritative block; the two duplicate regions are removed.

Visual parity verified in light + dark exam mode.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Typography polish — label tracking consolidation, text-wrap pretty, weight 500 audit

**Files:**
- Modify: `styles.css:314-327` (uppercase-label rule — set tracking to 0.1em)
- Modify: `styles.css:1949, 2147, 2164, 2304, 2611` (other label tracking values — consolidate to 0.1em or remove if redundant)
- Modify: `styles.css:358-367` (prose containers — add `text-wrap: pretty`)
- Modify: `styles.css` weight-700 audit

- [ ] **Step 1: Consolidate uppercase-label tracking to 0.1em**

Edit `styles.css:314-327`. OLD:
```css
.eyebrow,
.module-kicker,
.result-label,
.method-kicker,
.status-name,
dt,
.source-line {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
```
NEW:
```css
.eyebrow,
.module-kicker,
.result-label,
.method-kicker,
.status-name,
dt,
.source-line {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
```

(Tracking now `0.1em`; weight dropped from 600 to 500 to soften — the tracking + uppercase is already doing the work, weight 600 was over-emphasis.)

- [ ] **Step 2: Audit and resolve duplicate label tracking**

Read each of these locations and decide:
- `styles.css:1795` (`letter-spacing: 0.1em` on `.sidebar-section-label`) — already correct. Leave.
- `styles.css:1949` (`letter-spacing: 0.14em`) — read context; if it's the sidebar `.status-chip`-like rule, drop to `0.1em`.
- `styles.css:1972` (`letter-spacing: 0.1em`) — already correct. Leave.
- `styles.css:2164` (`letter-spacing: 0.12em`) — read context; if it's an uppercase label, drop to `0.1em` and DELETE the rule entirely if it's now redundant with the consolidated rule at 314-327.

For each, apply the appropriate Edit; if the rule becomes a duplicate of the rule at 314-327, delete the redundant declaration.

- [ ] **Step 3: Add `text-wrap: pretty` to prose containers**

Edit `styles.css:358-367`. OLD:
```css
.subtitle,
.module-copy,
.lesson-note,
.focus-note,
.result-caption,
.control-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}
```
NEW:
```css
.subtitle,
.module-copy,
.lesson-note,
.focus-note,
.result-caption,
.control-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  text-wrap: pretty;
  max-inline-size: 65ch;
}
```

The `max-inline-size: 65ch` enforces the calibrated body-copy width rule. `text-wrap: pretty` prevents orphaned last-line single words.

- [ ] **Step 4: Audit weight-700 jumps**

Run via Grep:
```
pattern: font-weight: 700
path: styles.css
output_mode: content
-n: true
```
For each match, judge whether the surrounding context calls for 700 (display headlines, primary buttons) or whether 600 would be sufficient (labels, dt elements, metadata). Where 600 suffices, drop. Note: the `<button>` rule at line 216 uses `font-weight: 600` already — that's fine.

For each appropriate downgrade, apply the Edit. Aim for no more than 5 places using 700 in the entire file (display h1/h2, hero answer-value, and one or two emphasis spots).

- [ ] **Step 5: Verify h1 and prose render correctly**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Compare to `baseline-2026-04-20/light-mod1.png`. The h1 should look the same (it was already correct). Body prose should now wrap with no last-line orphans where applicable.

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
style(css): consolidate label tracking, add text-wrap pretty to prose

- One canonical uppercase-label rule at 0.1em / weight 500 (was 0.12em / 600).
- Drop redundant duplicate label-tracking declarations elsewhere.
- text-wrap: pretty + max-inline-size: 65ch on prose containers prevents
  orphaned last-line words.
- Audit font-weight: 700 down to display + hero only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Layout — weighted comparison grid, table-wrap tinted edges, mobile sidebar audit

**Files:**
- Modify: `styles.css` `.comparison-grid-triple` and `.comparison-grid-quad` (weight columns)
- Modify: `styles.css` `.table-wrap` (tinted scroll-edge gradients)
- Verify: mobile sidebar uses `100dvh` (audit was stale; double-check)

- [ ] **Step 1: Locate and weight the triple/quad comparison grids**

Run via Grep:
```
pattern: comparison-grid-triple|comparison-grid-quad
path: styles.css
output_mode: content
-n: true
```
For each match, find the `grid-template-columns` declaration. Replace the equal-fraction layout with a weighted layout that emphasizes the primary answer column.

Triple grid OLD:
```css
.comparison-grid-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
```
NEW:
```css
.comparison-grid-triple {
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
}
```

Quad grid OLD (likely):
```css
.comparison-grid-quad {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```
NEW:
```css
.comparison-grid-quad {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
}
```

- [ ] **Step 2: Tint the table-wrap scroll-edge gradients**

Run via Grep:
```
pattern: \.table-wrap
path: styles.css
output_mode: content
-n: true
```
Read the matched block. The audit (§3.5) noted lines 832-833 use `rgba(0,0,0,0.08)`. Replace with `color-mix(in srgb, var(--text) 8%, transparent)`.

OLD pattern (illustrative):
```css
.table-wrap {
  background:
    linear-gradient(to right, var(--surface-0), transparent 12px) left,
    linear-gradient(to left, var(--surface-0), transparent 12px) right,
    radial-gradient(at left, rgba(0, 0, 0, 0.08), transparent 70%) left,
    radial-gradient(at right, rgba(0, 0, 0, 0.08), transparent 70%) right;
  background-repeat: no-repeat;
  background-size: 24px 100%, 24px 100%, 16px 100%, 16px 100%;
  background-attachment: local, local, scroll, scroll;
}
```
NEW:
```css
.table-wrap {
  background:
    linear-gradient(to right, var(--surface-0), transparent 12px) left,
    linear-gradient(to left, var(--surface-0), transparent 12px) right,
    radial-gradient(at left, color-mix(in srgb, var(--text) 8%, transparent), transparent 70%) left,
    radial-gradient(at right, color-mix(in srgb, var(--text) 8%, transparent), transparent 70%) right;
  background-repeat: no-repeat;
  background-size: 24px 100%, 24px 100%, 16px 100%, 16px 100%;
  background-attachment: local, local, scroll, scroll;
}
```

The actual current values may differ — read first, then apply the tinted-mix replacement to whatever `rgba(0, 0, 0, X)` exists inside `.table-wrap`.

- [ ] **Step 3: Tint the sidebar mobile backdrop**

Run via Grep:
```
pattern: \.sidebar-mobile-backdrop|sidebar-mobile.*background.*rgba\(0
path: styles.css
output_mode: content
-n: true
```
Wherever the mobile backdrop uses `rgba(0, 0, 0, 0.4)`, replace with `color-mix(in srgb, var(--bg) 40%, transparent)` so it tints with the theme.

- [ ] **Step 4: Confirm mobile sidebar uses `100dvh`**

Read `styles.css` around line 1919 (the mobile media query). If `height: 100vh` or `min-height: 100vh` exists in any mobile sidebar rule, replace with the `dvh` equivalent. (Earlier grep found no `100vh` matches, so this should be a no-op verification.)

- [ ] **Step 5: Verify in Playwright at mobile viewport**

```
mcp__plugin_playwright_playwright__browser_resize → width=375, height=812
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_click on sidebar-mobile-toggle (the hamburger)
mcp__plugin_playwright_playwright__browser_take_screenshot
```
The sidebar should slide in over a tinted backdrop (no longer pure black). Compare to `baseline-2026-04-20/mobile-light.png`.

Reset viewport: `mcp__plugin_playwright_playwright__browser_resize → width=1440, height=900`.

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
feat(css): weight primary comparison column, tint scroll-edges

- .comparison-grid-triple: 1.25fr 1fr 1fr (primary answer wider).
- .comparison-grid-quad: 1.2fr 1fr 1fr 1fr.
- .table-wrap edge-fade gradients now tint via color-mix(var(--text)).
- Sidebar mobile backdrop tinted to var(--bg) 40% instead of pure black.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Interactivity — real ghost hover, scroll-smooth, sidebar tooltip delay

**Files:**
- Modify: `styles.css:220-222` (filled button hover)
- Modify: `styles.css:264-268` (ghost button hover)
- Modify: `styles.css` (top of file, near `:root` blocks) — add `html { scroll-behavior: smooth; }` guarded
- Modify: `styles.css:1779-1785` (collapsed-sidebar tooltip)

- [ ] **Step 1: Replace `filter: brightness` hover with explicit hover state for filled buttons**

Edit `styles.css:220-222`. OLD:
```css
button:hover {
  filter: brightness(0.9);
}
```
NEW:
```css
button:hover:not(:disabled) {
  background: var(--accent-strong);
  transform: translateY(-1px);
}
```

This gives filled buttons a real hover affordance: a slight lift + a one-shade-darker accent.

- [ ] **Step 2: Replace ghost button hover with a visible state**

Edit `styles.css:264-268`. OLD:
```css
button.ghost:hover {
  background: var(--surface-1);
  border-color: var(--line-strong);
  filter: none;
}
```
NEW:
```css
button.ghost:hover:not(:disabled) {
  background: var(--surface-2);
  border-color: var(--line-strong);
  color: var(--text);
}
```

The change from `--surface-1` to `--surface-2` makes the hover background darker than the ghost's resting background, so the affordance is visible. (Previously, `.ghost` resting state was `background: var(--surface-1)` and `:hover` was the same — invisible.)

- [ ] **Step 3: Add `scroll-behavior: smooth` guarded by `prefers-reduced-motion`**

Find the `prefers-reduced-motion` media query at `styles.css:1130-1135` (already exists). Read context.

Then add a new top-level rule near the `:root` block. Edit `styles.css` to insert AFTER line 26 (end of `:root`), BEFORE line 28 (`html[data-theme="light"]`):

NEW (insert these 3 lines):
```css

html {
  scroll-behavior: smooth;
}
```

Verify the existing `prefers-reduced-motion` media query at 1130-1135 already overrides scroll-behavior. From the earlier grep:
```
1131:    scroll-behavior: auto !important;
```
Yes — already correct. The smooth behavior is gated by the existing reduced-motion override.

- [ ] **Step 4: Add a `transition-delay` to the collapsed-sidebar tooltip**

Edit `styles.css:1764-1781` (`.app-shell[data-sidebar="collapsed"] .sidebar-nav-item::after`):

OLD:
```css
.app-shell[data-sidebar="collapsed"] .sidebar-nav-item::after {
  content: attr(aria-label);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-xs);
  background: var(--surface-3);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
  z-index: var(--z-popover);
}
```
NEW:
```css
.app-shell[data-sidebar="collapsed"] .sidebar-nav-item::after {
  content: attr(aria-label);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-xs);
  background: var(--surface-3);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1) 250ms;
  box-shadow: var(--shadow-soft);
  z-index: var(--z-popover);
}
```

The added `250ms` after the timing function is a delay — tooltip won't flash on quick mouse-overs. Also adds the soft shadow tier.

- [ ] **Step 5: Verify hover states in Playwright**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_hover on the omni-search "calculate" button
mcp__plugin_playwright_playwright__browser_take_screenshot
```
The button should look slightly lifted with a darker accent. Then:
```
mcp__plugin_playwright_playwright__browser_hover on a ghost button (e.g., "Open machine trace" if visible, else any .ghost)
mcp__plugin_playwright_playwright__browser_take_screenshot
```
The ghost button should show a clear background-shade change.

- [ ] **Step 6: Verify smooth scroll**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html#sidebar
```
Scroll should be smooth, not instant. (If `prefers-reduced-motion` is set in the test browser, it'll be instant — that's correct behavior.)

- [ ] **Step 7: Commit**

```bash
git add styles.css
git commit -m "$(cat <<'EOF'
feat(css): real hover states, smooth scroll, tooltip delay

- Filled buttons: replace filter:brightness with explicit
  --accent-strong + 1px lift; gives a visible hover affordance.
- Ghost buttons: hover background shifts to --surface-2 (was
  --surface-1, identical to resting state — invisible hover).
- html { scroll-behavior: smooth } at top level (already overridden
  by the existing prefers-reduced-motion guard).
- Collapsed-sidebar tooltip: 250ms transition-delay so it doesn't
  flash on quick mouse-overs; adds soft shadow tier.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Components — button.link tertiary, nested disclosure tier, status-chip restoration

**Files:**
- Modify: `styles.css` (after the `button.ghost` rule) — add `button.link`
- Modify: `styles.css` `.disclosure.disclosure-secondary` block (nested tier — drop full border)
- Modify: `styles.css:1949-1955` region (status-chip restoration)
- Modify: `index.html` — wherever a tertiary action exists, swap class to `button link`

- [ ] **Step 1: Add `button.link` tertiary style**

Edit `styles.css` immediately after line 268 (end of `button.ghost:hover`).

NEW:
```css

button.link {
  background: transparent;
  border: none;
  padding: 0.25rem 0.4rem;
  color: var(--accent-strong);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
}

button.link:hover:not(:disabled) {
  color: var(--accent);
  text-decoration-thickness: 2px;
  background: transparent;
  transform: none;
}

button.link:active:not(:disabled) {
  transform: none;
}
```

Three rules: resting, hover (thicker underline, no lift since this is a low-key inline action), and active (no scale — keep it visually quiet).

- [ ] **Step 2: Distinguish nested disclosures**

Run via Grep:
```
pattern: disclosure-secondary|details-section|tools-section|utility-panel-nested
path: styles.css
output_mode: content
-n: true
```
Find the rule that defines the nested-disclosure visual treatment. Currently it likely matches the top-level disclosure (full border). Edit to drop the full border and use a left-edge accent only:

OLD pattern (illustrative):
```css
.disclosure.disclosure-secondary {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.85rem;
  background: var(--surface-0);
}
```
NEW:
```css
.disclosure.disclosure-secondary {
  border: none;
  border-inline-start: 2px solid var(--line-strong);
  border-radius: 0;
  padding: 0.4rem 0 0.4rem 0.85rem;
  margin-inline-start: 0.4rem;
  background: transparent;
}
```

Same treatment for `.tools-section`, `.utility-panel-nested`, `.utility-panel.utility-panel-subtle` if they share the nested role.

For the `summary` chevron inside nested disclosures, replace the `+/−` indicator with a `›` chevron that rotates on `[open]`:
```css
.disclosure.disclosure-secondary > summary::before {
  content: "›";
  display: inline-block;
  margin-inline-end: 0.4rem;
  color: var(--muted);
  transition: transform var(--transition-fast);
}
.disclosure.disclosure-secondary[open] > summary::before {
  transform: rotate(90deg);
}
```

- [ ] **Step 3: Restore the sidebar status-chip subtle treatment**

Run via Grep:
```
pattern: \.status-chip|\.status-line
path: styles.css
output_mode: content
-n: true
```
The audit (§7.3) noted the chip class was stripped to invisibility around line 1950. Read the current rule.

Choose option A (rename to `.status-line` for honesty) OR option B (restore subtle chip). Option B is preferred for the calibrated taste:
```css
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  background: var(--surface-1);
  border: 1px solid var(--line);
  font-size: 0.74rem;
  color: var(--muted);
}
```
Apply the subtle chip rule, replacing the existing strip-to-nothing rule.

- [ ] **Step 4: Wire button.link in index.html where appropriate**

Run via Grep:
```
pattern: class="ghost".*Open|class="ghost".*Show|class="ghost".*Reveal
path: index.html
output_mode: content
-n: true
```
For "Open machine trace" or similar low-priority inline disclosures, change the class from `ghost` to `link`. Aim for 2-4 conversions in `index.html`. Example:

OLD: `<button class="ghost" data-action="open-trace">Open machine trace</button>`
NEW: `<button class="link" data-action="open-trace">Open machine trace</button>`

Only change buttons whose semantic role is "tertiary inline action," not buttons that are semantically equivalent to "Apply" or "Reset."

- [ ] **Step 5: Verify in Playwright — sidebar status chips and nested disclosures**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_take_screenshot of the sidebar
```
The status chips ("Angle · DEG", "Theme · Light", etc.) should now have a subtle pill shape with a 1px border and `--surface-1` background.

```
mcp__plugin_playwright_playwright__browser_click on a top-level disclosure (e.g., "Sandbox")
```
Inside, any nested disclosure should now show as a left-bordered indented section with a `›` chevron, NOT a duplicate full card.

- [ ] **Step 6: Commit**

```bash
git add styles.css index.html
git commit -m "$(cat <<'EOF'
feat(css): tertiary button.link, nested disclosure tier, status-chip restored

- button.link: text-only with underline-thickness hover, no transform
  on press. Wired to 2-4 low-priority inline actions in index.html.
- .disclosure.disclosure-secondary etc. drop full border, use a
  left-edge accent + indented chevron to signal nesting.
- .status-chip restored to a subtle pill (was stripped invisible).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Content — sentence case, varied empty-state copy, inline-style extraction, OG meta

**Files:**
- Modify: `index.html` (multiple locations — sentence case headers)
- Modify: `index.html:278-281` (inline `style="..."` extraction)
- Modify: `index.html` (multiple `<dd>` elements with "Ready to calculate")
- Modify: `app.js` and `root-ui.js` if empty-state strings are constructed in JS
- Modify: `styles.css` — add `.utility-stack h3` and `.utility-stack .module-kicker` classes
- Modify: `index.html` `<head>` — add OG and Twitter meta tags

- [ ] **Step 1: Convert module headers to sentence case**

Run via Grep:
```
pattern: <h2>|<h3>
path: index.html
output_mode: content
-n: true
```
For each header, decide:
- "Machine Arithmetic Workbench" → "Machine arithmetic workbench"
- "Machine arithmetic basics" → already sentence case, leave
- Module names that are proper nouns (e.g., "IEEE-754 Inspector") — keep "IEEE-754" capitalized but lowercase the surrounding words: "IEEE-754 inspector".

Edit each header in `index.html` accordingly. Do NOT touch the masthead `<h1>` ("Machine Arithmetic & Error Analysis Lab" / similar) — that is the brand/title and may stay title-case if the user prefers; flag it explicitly when committing.

- [ ] **Step 2: Vary empty-state copy**

Run via Grep:
```
pattern: Ready to calculate
path: index.html
output_mode: content
-n: true
```
Replace each occurrence with context-specific copy. Mapping:

| Cell semantic role | New copy |
|--------------------|----------|
| `<dd>` for k/digits | "Awaiting k" |
| `<dd>` for first operand | "Awaiting operand a" |
| `<dd>` for second operand | "Awaiting operand b" |
| `<dd>` for fl(x) result | "Not yet rounded" |
| `<dd>` for absolute error | "Pending result" |
| `<dd>` for relative error | "Pending result" |
| Generic placeholder | "Awaiting input" |

For each `<dd>` element, read 3 lines of surrounding context (the `<dt>` label) to determine which mapping applies, then apply the Edit.

If "Ready to calculate" also appears as a JS-constructed string, run via Grep on `app.js` and `root-ui.js`:
```
pattern: Ready to calculate
path: .
glob: *.js
output_mode: content
-n: true
```
Replace each JS occurrence with the same contextual copy.

- [ ] **Step 3: Extract inline styles from index.html**

Read `index.html` lines 275-285 to confirm the inline-styled elements:
```html
<h3 style="margin-bottom: var(--space-1);">…</h3>
<p class="module-kicker" style="margin: 0 0 var(--space-2) 0;">…</p>
```

Replace with classed equivalents. Edit `index.html`:
OLD:
```html
<h3 style="margin-bottom: var(--space-1);">
```
NEW:
```html
<h3>
```
And:
OLD:
```html
<p class="module-kicker" style="margin: 0 0 var(--space-2) 0;">
```
NEW:
```html
<p class="module-kicker module-kicker-tight">
```

Then add to `styles.css` (near the `.utility-stack` rules):
```css
.utility-stack h3 {
  margin-bottom: var(--space-1);
}

.module-kicker.module-kicker-tight {
  margin: 0 0 var(--space-2) 0;
}
```

- [ ] **Step 4: Add OG and Twitter meta tags to `<head>`**

Read `index.html` lines 1-30 to confirm `<head>` structure.

Insert AFTER the existing `<title>` and `<meta name="description">` tags:
```html
  <meta property="og:title" content="Machine Arithmetic & Error Analysis Lab">
  <meta property="og:description" content="An academic workbench for IEEE-754 representation, significant-figure arithmetic, and root-finding methods. Vanilla web, no dependencies.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="og-card.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Machine Arithmetic & Error Analysis Lab">
  <meta name="twitter:description" content="IEEE-754, significant figures, bisection, Newton, secant. A pedagogical calculator for numerical analysis.">
  <meta name="twitter:image" content="og-card.svg">
```

The `og-card.svg` file does not yet exist. Create it as a minimal branded card matching the favicon palette. For now, use a placeholder SVG saved at the repo root:

Create `og-card.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="Machine Arithmetic and Error Analysis Lab">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fafaf7"/>
      <stop offset="1" stop-color="#f3f3ef"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(80, 90)">
    <text font-family="Source Serif 4, Georgia, serif" font-size="64" font-weight="700" letter-spacing="-2" fill="#1a1a1a">Machine Arithmetic</text>
    <text y="80" font-family="Source Serif 4, Georgia, serif" font-size="64" font-weight="700" letter-spacing="-2" fill="#1a1a1a">&amp; Error Analysis Lab</text>
    <text y="180" font-family="Source Sans 3, system-ui, sans-serif" font-size="28" font-weight="500" fill="#6b6b73">IEEE-754 · significant figures · bisection · Newton · secant</text>
    <text y="430" font-family="JetBrains Mono, monospace" font-size="22" fill="#3a6cba">f(x) = x³ − 2x − 5    →    1.6483482</text>
  </g>
</svg>
```

- [ ] **Step 5: Verify in Playwright**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_evaluate → document.querySelectorAll('h2, h3').forEach(h => console.log(h.textContent.trim()))
mcp__plugin_playwright_playwright__browser_console_messages
```
Confirm headers print in sentence case as expected.

```
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Visually confirm empty-state cells now show varied copy, not all "Ready to calculate".

Verify OG card renders by navigating directly:
```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/og-card.svg
mcp__plugin_playwright_playwright__browser_take_screenshot
```

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js root-ui.js og-card.svg
git commit -m "$(cat <<'EOF'
content: sentence-case headers, varied empty states, OG meta

- Module headers normalized to sentence case (h1 brand title preserved).
- Empty-state cells get role-specific copy (Awaiting k, Awaiting
  operand a, Not yet rounded, Pending result, Awaiting input) instead
  of one repeated 'Ready to calculate'.
- Two inline style="" attributes extracted to .utility-stack h3 and
  .module-kicker-tight classes.
- OG and Twitter meta tags + matching og-card.svg added.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Visual verification + accessibility verification

**Files:**
- Read-only: `index.html`, `styles.css`
- Create: `docs/superpowers/plans/final-2026-04-20/` (new dir for final-state screenshots)

- [ ] **Step 1: Take final-state screenshots in the same matrix as baseline**

```
mcp__plugin_playwright_playwright__browser_resize → 1440x900
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_evaluate → localStorage.setItem('theme','light'); localStorage.setItem('density','standard'); location.reload()
mcp__plugin_playwright_playwright__browser_wait_for → 1 second
mcp__plugin_playwright_playwright__browser_take_screenshot → save as final-2026-04-20/light-mod1.png
```
Repeat for the same 5 states as baseline:
- light-mod1.png
- dark-mod1.png
- light-exam.png
- mobile-light.png
- dark-mod3.png

To switch theme: `mcp__plugin_playwright_playwright__browser_evaluate → document.documentElement.setAttribute('data-theme', 'dark')`.

To switch density: `setAttribute('data-density', 'exam')`.

To switch modules: click the appropriate sidebar nav item.

- [ ] **Step 2: Diff baseline vs final visually**

Open both screenshot directories. Confirm:
- Light theme: warmer canvas, slightly cooler surfaces, soft tinted shadow on the answer hero, desaturated module accents.
- Dark theme: same shadow/accent changes; cool tinting unchanged.
- Exam density: visually identical to baseline (verifying the dedupe didn't change rendering).
- Mobile: tinted backdrop on sidebar overlay.
- Dark + mod3 (teal): module color clearly less saturated than baseline.

If any unintended visual regression appears (text shift, layout reflow, missing border), trace to the originating task and patch with a follow-up commit.

- [ ] **Step 3: Verify keyboard navigation and focus rings**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_press_key → Tab (5 times — should reach skip-link, then sidebar nav, then main controls)
mcp__plugin_playwright_playwright__browser_take_screenshot
```
Skip link should appear at top-left when focused. Each focused element should show a 2px solid focus ring.

- [ ] **Step 4: Verify reduced-motion behavior**

```
mcp__plugin_playwright_playwright__browser_evaluate → matchMedia('(prefers-reduced-motion: reduce)').matches
```
If false (test browser doesn't have reduced-motion set by default), use the Playwright emulation path:
```
mcp__plugin_playwright_playwright__browser_run_code → page.emulateMedia({ reducedMotion: 'reduce' })
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_evaluate → window.scrollTo({ top: 1000, behavior: 'smooth' })
```
Should jump (no animation), confirming the reduced-motion override is wired.

Reset emulation before continuing other steps.

- [ ] **Step 5: Verify no console errors**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
mcp__plugin_playwright_playwright__browser_console_messages
```
Expected: clean console, no warnings, no errors. If any appear that didn't appear in baseline, investigate (likely a CSS custom property reference that lost its definition).

- [ ] **Step 6: Verify all six modules cycle without errors**

```
mcp__plugin_playwright_playwright__browser_navigate → http://localhost:8765/index.html
```
Click through every sidebar nav item in order (mod1 through mod6 plus utilities). After each click:
```
mcp__plugin_playwright_playwright__browser_console_messages
```
Expected: no errors. Each module's accent color (left border, kicker color, primary action button) should reflect the desaturated palette.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/plans/final-2026-04-20/
git commit -m "docs: capture final screenshots after design overhaul"
```

---

## Task 10: Audit refresh + final commit

**Files:**
- Modify: `DESIGN_AUDIT.md` (append disposition footer)

- [ ] **Step 1: Append a "resolved on 2026-04-20" footer to DESIGN_AUDIT.md**

Edit `DESIGN_AUDIT.md`. After the existing "Suggested first pass" line, append:

```markdown

---

## Resolution log — 2026-04-20

| # | Item | Disposition |
|---|------|-------------|
| 1 | Re-enable tinted shadow tier on hero answer cards | Done — `--shadow-soft` applied to `.answer-hero` and inset edge on `.sidebar-nav-item.active` |
| 2 | Warm the light-mode `--bg` and cool the surfaces | Done — `--bg` was already `#fafaf7`; surfaces (`--surface-0..3`) re-tinted slightly cool for separation |
| 3 | Sidebar `100vh` → `100dvh` | Already done before this pass; confirmed no `100vh` matches in `styles.css` |
| 4 | H1 size bump for hero | Already done before this pass; `clamp(2rem, 4vw, 3rem)` confirmed at line 340 |
| 5 | Desaturate mod1–mod6 accents ~10% | Done — all six modules now <70% saturation; added `--modN-strong` and `--modN-contrast` tokens |
| 6 | Real ghost-button hover state | Done — `--surface-2` background shift; filled buttons use `--accent-strong` + 1px lift |
| 7 | Kill `!important` in field-shell via `:where()` | Done — base `input,select` rule now uses `:where()`; 8 `!important`s removed |
| 8 | Merge duplicate exam-density blocks | Done — single authoritative block at lines 1413+; later duplicates absorbed or removed |
| 9 | Weight the primary comparison card (1.25fr) | Done — `comparison-grid-triple` and `-quad` weighted |
| 10 | `text-wrap: pretty` on body copy | Done — applied with `max-inline-size: 65ch` to prose containers |
| 11 | Nested disclosure tier (no border, indented chevron) | Done — `.disclosure.disclosure-secondary` and siblings use left-edge accent + `›` chevron |
| 12 | `button.link` tertiary style | Done — added with no-lift hover, wired to 2-4 low-priority actions in `index.html` |
| 13 | Z-index scale tokens | Done — `--z-skiplink/-modal/-sidebar/-popover/-sticky/-overlay` |
| 14 | Consolidate label tracking rule | Done — single rule at 0.1em/weight 500; duplicates removed |
| 15 | Tint sidebar backdrop | Done — `color-mix(in srgb, var(--bg) 40%, transparent)` |
| 16 | `scroll-behavior: smooth` | Done — at top-level `html`, gated by existing reduced-motion override |
| 17 | Vary "Ready to calculate" placeholders | Done — context-specific copy (Awaiting k, Awaiting operand a, Not yet rounded, etc.) |
| 18 | Sentence case on module headers | Done — h2/h3 normalized; brand h1 preserved |
| 19 | Move inline styles to classes | Done — `.utility-stack h3` and `.module-kicker-tight` classes |
| 20 | OG / social meta tags | Done — OG/Twitter tags + minimal branded `og-card.svg` |

Calibrated taste-skill rules also applied: `--mod*-strong` and `--mod*-contrast` tokens added to fulfill the "each module exposes three tokens" rule from the calibrated skill (§3 Rule 2).
```

- [ ] **Step 2: Final commit**

```bash
git add DESIGN_AUDIT.md
git commit -m "$(cat <<'EOF'
docs: log design overhaul resolution against DESIGN_AUDIT.md

All 20 audit items resolved (some were already done before this pass —
items 3, 4, and partial 2). Calibrated taste-skill rules also applied:
six --modN-strong/--modN-contrast tokens, <70% accent saturation,
soft shadow tier reserved for the primary answer hero only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Stop the dev server**

If the background bash from Task 0 Step 3 is still running, kill it:
```bash
# Use BashOutput / KillShell tool with the shell ID from Task 0 Step 3
```

- [ ] **Step 4: Print a summary for the user**

Output to the user:
- 10 commits landed (Tasks 0-10).
- Files touched: `styles.css`, `index.html`, `app.js` (if empty-state strings touched), `root-ui.js` (if empty-state strings touched), `og-card.svg` (new), `DESIGN_AUDIT.md`.
- Before/after screenshots at `docs/superpowers/plans/baseline-2026-04-20/` and `docs/superpowers/plans/final-2026-04-20/`.
- Net `!important` count dropped by 8.
- All 6 modules now under 70% saturation.

---

## Self-review checklist (the planner's last filter)

Before handing off to the executor:

- [x] **Spec coverage:** Every numbered DESIGN_AUDIT item (1-20) has a task or is explicitly noted as already-done.
- [x] **Calibrated skill rules covered:** Tokens for `--modN-strong`/`--modN-contrast` added (§3 Rule 2). Shadow tier reserved for hero only (§3 Rule 4). Z-index scale (§5). Tabular-nums and serif preserved (§3 Rule 1). 6-color palette under <70% saturation (§3 Rule 2). Empty/loading/error states verified (Task 9). `100dvh` audit (§4 — confirmed no offenders). `prefers-reduced-motion` honored.
- [x] **Placeholder scan:** No "TBD", no "implement later", no "similar to above" without showing the code, no "add appropriate error handling" without specifics.
- [x] **Type/name consistency:** Token names (`--z-skiplink`, `--z-modal`, etc.) used consistently across Task 1 and Task 6. `--modN-strong` / `--modN-soft` / `--modN-contrast` triplet defined in Task 1 and not contradicted later. Class names (`.module-kicker-tight`, `.utility-stack h3`) introduced once and referenced once.
- [x] **Bite-sized steps:** Each step is one verifiable action (read, edit, run, screenshot, commit). No step exceeds ~5 minutes for a competent vanilla-JS engineer with Playwright access.
- [x] **Frequent commits:** 11 commits total (Tasks 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 each terminate in one commit). All commits are reversible without disturbing later work.
- [x] **Test strategy fits the medium:** This is CSS/HTML, not logic. "Tests" are visual snapshots via Playwright + Grep-based assertions for code-quality rules (no `!important` outside density blocks, no `100vh`). Documented in Tasks 0 and 9.
- [x] **No new dependencies:** Vanilla stack preserved. No npm install steps.
- [x] **Risk awareness:** Token changes (Task 1) ripple through every component. Verification step (Task 1 Step 8/9) catches CSS parse errors and missing-token warnings before later tasks build on the changes.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-design-overhaul.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Good for this plan because Tasks 1-8 are largely independent CSS edits that benefit from isolated context per task and intermediate visual verification.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints. Good if you want to watch each step and steer in real time.

**Which approach?**
