# Design Audit — Machine Arithmetic & Error Analysis Lab

Audit against the `/redesign-existing-projects` skill. No code changes applied. Each finding is tagged **[High]**, **[Med]**, or **[Low]** by expected visual impact per unit of risk. Pick the sections you want applied.

---

## 0. Snapshot

- **Stack:** vanilla HTML / CSS / JS. No framework. CSS custom properties drive theming.
- **Files:** `index.html` (1,312 lines) · `styles.css` (3,424 lines) · multiple JS engines.
- **Themes:** light + dark via `html[data-theme]`, bootstrapped pre-render. Also a `data-density="exam"` compact mode.
- **Fonts:** Source Serif 4 (display) · Source Sans 3 (body) · JetBrains Mono (numerals/code). Strong pairing.
- **Breakpoints:** container queries + `@media` at 980px / 860px / 768px / 720px.

## 1. What's already good (don't break these)

- Real font pairing with character — not "Inter everywhere."
- `text-wrap: balance` on h1/h2; `clamp()` for fluid type; `font-feature-settings: "tnum" 1, "lnum" 1` on numerals — tabular figures done right.
- Dark mode genuinely off-black (`#111113`), not pure black.
- Skip link, ARIA roles/live regions, `prefers-reduced-motion` and `prefers-contrast: more` support.
- Semantic HTML (`main`, `aside`, `nav`, `article`, `section`, `header`, `details`).
- Unicode glyphs (∑, Δ, f(x), √) as nav icons — sidesteps the Lucide/Feather fingerprint and fits the subject.
- Branded inline-SVG favicon.
- Focus rings present and visible.
- Custom `compute-pulse` loading animation — not a default spinner.
- Module-coloured left borders (`border-left: 3px solid var(--modN-soft)`) — semantic, restrained colour use.
- Active-press micro-interaction (`transform: scale(0.98)` on all buttons).
- Container queries for real layout responsiveness, not just breakpoints.
- Mobile-responsive tables with `td::before { content: attr(data-label) }` — a genuinely nice pattern.

---

## 2. Typography

### 2.1 H1 is undersized for a hero. [Med]
`styles.css:339` — `h1 { font-size: clamp(1.5rem, 2.5vw, 2rem); }`. The masthead headline caps at 32px on desktop, barely bigger than h2 (`clamp(1.45rem, 2.3vw, 2.2rem)`). Displays hero text should have presence.
**Fix:** bump to `clamp(2rem, 4vw, 3rem)` with `line-height: 1.02` and keep `letter-spacing: -0.04em`. Keep h2 where it is to preserve hierarchy.

### 2.2 Label tracking/size is redefined in two places. [Low]
`styles.css:321` sets `.result-label` etc. at `0.68rem / 0.12em`, then `styles.css:1969` overrides to `0.64rem / 0.1em`. Works, but the override tree is messy.
**Fix:** pick one. Consolidate into a single rule and delete the duplicate.

### 2.3 Weight range underused. [Low]
Only 400 / 500 / 600 / 700 are loaded. Good selection, but medium (500) and semibold (600) rarely appear — most emphasis jumps straight from 400 to 600 or 700.
**Fix:** audit `dd`, captions, and metadata to use 500 where 600/700 currently shouts. Subtler hierarchy.

### 2.4 Body copy can orphan. [Low]
Paragraphs like `.subtitle`, `.module-copy`, `.lesson-note` don't set `text-wrap: pretty`, which was designed for exactly this kind of multi-line copy.
**Fix:** add `text-wrap: pretty` to `.subtitle, .module-copy, .lesson-note, .focus-note, .result-caption`.

---

## 3. Colour and Surfaces

### 3.1 Light mode background is pure `#ffffff`. [High]
`styles.css:30` — `--bg: #ffffff`. Sterile. Every surface underneath it (`--surface-0: #f8f9fa`, `--surface-1: #f3f4f6`) is also a neutral grey, so the whole page reads as "Google doc on graph paper."
**Fix:** warm the canvas slightly — `#fafaf7` (warm paper) or `#fbfbfa` (off-white). Simultaneously cool `--surface-0`/`--surface-1` by a fraction so they still separate from `--bg`. Tiny change, big perceptual lift.

### 3.2 Elevation is disabled. [High]
`--shadow-soft: none` and `--shadow-panel: none` in both light and dark, plus explicit `box-shadow: none` on `.module-shell`, `.control-band`, `.answer-hero`, `.disclosure`. Hierarchy is carried entirely by 1px borders. This is why everything reads as "wireframe" rather than finished UI.
**Fix:** re-enable a single, tinted shadow tier for "raised" cards (answer-hero hero cards, sidebar nav active state). Use a background-tinted shadow, e.g. `0 1px 2px rgba(17, 17, 19, 0.04), 0 8px 24px -12px rgba(17, 17, 19, 0.10)` in light; matching cool-navy-tinted for dark. Keep flat everywhere else; reserve shadow for the primary answer.

### 3.3 Six accent hues run at high saturation. [Med]
`mod1 #2563eb · mod2 #9333ea · mod3 #0891b2 · mod4 #059669 · mod5 #d97706 · mod6 #6b7280`. Only one module is visible at a time, so contextually this works — but mod2 purple + mod1 blue together in the sidebar "active tab shift" feels close to the "AI gradient" palette the skill flags.
**Fix:** desaturate each accent ~10% (stay in HSL-space) so they sit together. Optionally shift mod2 away from pure purple toward magenta or plum to distance from the blue.

### 3.4 Sidebar mobile backdrop is pure black. [Low]
`styles.css:1873` — `background: rgba(0, 0, 0, 0.4)`.
**Fix:** tint to match the app's bg, e.g. `rgba(17, 17, 19, 0.45)`.

### 3.5 Table-wrap uses pure black inner shadows. [Low]
`styles.css:832-833` — `rgba(0,0,0,0.08)` gradients for scroll edge hints.
**Fix:** swap to `color-mix(in srgb, var(--text) 8%, transparent)` so the hint tints with the theme.

### 3.6 Flat sections on light theme feel empty. [Low — optional]
Marketing-style surfaces (hero, welcome strip) have no texture or imagery.
**Fix:** optional — add a subtle 1-2% opacity noise overlay on `body::before` via a data-URL SVG. Very cheap, adds tactile depth. Skip if you want the tool to feel purely clinical.

---

## 4. Layout

### 4.1 Sidebar uses `height: 100vh`, not `100dvh`. [High — iOS bug]
`styles.css:1657`. On iOS Safari, `100vh` jumps when the address bar shows/hides. The rest of the app uses `100dvh` correctly; the sidebar is the odd one out.
**Fix:** `height: 100dvh` (one-char change).

### 4.2 `!important` war in field shells. [Med]
`styles.css:491-494`, `2055-2058`: borders/backgrounds/box-shadows overridden with `!important`. Symptom of specificity conflicts with the base `input` rule at line 269.
**Fix:** refactor the base `input` rule to use `:where()` for zero-specificity defaults, then drop `!important` from the shell overrides.

### 4.3 Triple/quad answer-strip is strictly symmetric. [Low]
`.comparison-grid-triple { grid-template-columns: repeat(3, minmax(0, 1fr)); }` and quad equivalents — the "three equal card columns" pattern the skill flags. Context-appropriate here (they're parallel results), but consider giving the primary answer more visual weight, e.g. `1.25fr 1fr 1fr` in `comparison-grid-triple`, matching the existing `root-summary-grid` pattern at `styles.css:3306`.
**Fix:** weight the primary result card.

### 4.4 Z-index values are not on a scale. [Low]
Skip-link `10000`, sidebar-mobile `1000`, backdrop `999`, tooltip `100`. Arbitrary ladder.
**Fix:** introduce `--z-skiplink / --z-modal / --z-popover / --z-sticky` tokens in `:root`.

### 4.5 Optical alignment in the search-shell. [Low]
`.btn-calculate-omni` is `min-height: 44px` next to an `input` at `min-height: 44px`, both in a grid row. The `=` glyph at `1.15rem` usually sits ~1-2px above optical centre in the button.
**Fix:** check and apply a `padding-bottom: 1px` (or `line-height: 1`) on the calculate button if the glyph reads high.

---

## 5. Interactivity and States

### 5.1 `filter: brightness(0.9)` hover is a lazy default. [Med]
`styles.css:221`. Works for dark text on coloured buttons; on the ghost button it does nothing visible (`button.ghost:hover { filter: none }`), so ghost hover is currently invisible.
**Fix:** give ghost a real hover — `background: var(--surface-2); border-color: var(--line-strong)` — and replace brightness with a tiny translate + tinted background-shift on filled buttons. Feels more intentional.

### 5.2 Sidebar tooltip on collapsed nav is plain. [Low]
`styles.css:1762` — the pseudo-element tooltip appears at `:hover`, background `--surface-3`. No shadow, no delay.
**Fix:** add `transition-delay: 200ms` on `opacity` so it doesn't flash on quick mouse-overs; add a light tinted shadow.

### 5.3 No `scroll-behavior: smooth`. [Low]
The skip-link and any `href="#..."` jump instantly.
**Fix:** `html { scroll-behavior: smooth; }` (already excluded via the `prefers-reduced-motion` block — safe to add).

### 5.4 Disabled buttons lose their press affordance correctly. [Low — no fix needed]
`button:disabled { transform: none; }` — good detail, keep.

---

## 6. Content and Copy

### 6.1 Mixed case on headings. [Low]
"Machine Arithmetic Workbench" (Title Case) vs "Machine arithmetic basics" (sentence case) on sibling headings.
**Fix:** pick one. Sentence case reads warmer and is more modern; your tutorial cards already use it, your module headers don't.

### 6.2 "Ready to calculate" is used as empty-state and placeholder. [Low]
Repeated across ~20 dd elements. Not wrong, but every empty cell says the same thing.
**Fix:** vary by context: "Awaiting k" for the digits cell, "Awaiting operand" for the input cells, etc. Adds a trace of personality.

### 6.3 No exclamation-mark / "Oops!" cliches detected. [no-op]
Error copy is direct: "Not calculated yet." Keep it that way.

---

## 7. Component Patterns

### 7.1 `.disclosure` accordions are the dominant disclosure pattern. [Low]
Used for sandbox, single-op helper, neighborhood details, catalog, welcome strip, root advanced options. That's six accordions on one panel in the basic module. The skill flags "accordion FAQ everywhere" — here they're pedagogically appropriate (progressive disclosure), but six stacked rows with identical `+`/`−` indicators blur together.
**Fix:** distinguish tiers — nested/secondary disclosures could drop the border and use an indented chevron instead of `+`, visually signalling "this is a detail of the thing above."

### 7.2 Button hierarchy is binary (filled/ghost). [Low]
Most CTAs are filled; most secondary actions are ghost. No tertiary style (text-only link).
**Fix:** add a `button.link` style (no border, no background, just accent-coloured underlined text) for low-priority inline actions like "Open machine trace."

### 7.3 Status chips in the sidebar are neutralised. [Low]
`styles.css:1950` strips `.status-chip` to `padding:0; border:none; background:transparent`. They're labels, not chips anymore. The `.status-chip strong` mono styling still works, so it reads fine — but the `.status-chip` class is now lying.
**Fix:** either rename to `.status-line` or bring back a subtle chip treatment (small radius, `var(--surface-1)` background, 0.2rem 0.5rem padding) for the sidebar so "Angle · DEG" looks like a toggle-able setting.

---

## 8. Iconography

### 8.1 No issues — this is a strength.
Unicode math glyphs in the sidebar (`∑ Δ f(x) √ 64 ?`) are on-brand for a numerical analysis tool and avoid the Lucide/Feather default. Don't change.

### 8.2 Mobile hamburger is `☰`. [Low — optional]
Fine, but a 3-line stack SVG would let you tween it to an × on open.

---

## 9. Code Quality

### 9.1 Inline styles in HTML. [Low]
`index.html:278-281` has `style="margin-bottom: var(--space-1);"` and `style="margin: 0 0 var(--space-2) 0;"` inside the single-op helper.
**Fix:** move to `.utility-stack h3` and `.utility-stack .module-kicker` classes.

### 9.2 Duplicate blocks at the end of `styles.css`. [Med]
Lines ~1413-1554 define `html[data-density="exam"]` rules, then ~2104-2110 redefine some of the same selectors (`.module-shell`, `.welcome-strip`). Lines ~1555 and ~2132 both have the comment "Calculator-first normalization reset" / "Modern academic calculator redesign" — two overlapping refactors.
**Fix:** merge the two exam-density blocks. Delete the duplicate selectors. Keep one authoritative location.

### 9.3 Missing social / OG meta. [Low]
`<title>` and `<meta description>` are present; no `og:title`, `og:image`, `twitter:card`. If this ever gets linked in chat or LMS, it'll preview as a bare URL.
**Fix:** add OG tags in `<head>`. Generate one matching SVG/PNG share card from the favicon palette.

### 9.4 Script versioning is manual. [no-op]
`?v=student5`, `?v=cw1`, `?v=root3` — a hand-bumped cachebust scheme. Works; don't touch unless you're wiring a build step.

---

## 10. Strategic Omissions

### 10.1 No footer at all. [Low]
Appropriate for a single-page lab — no legal, no sitemap, no credits. Consider a thin footer with the course/unit reference and a link to the `lesson-roundoff.pdf` that already exists in the repo.

### 10.2 No custom 404. [no-op]
Not applicable; SPA-style tabs, no routing.

### 10.3 No cookie consent. [no-op]
Local-only, no tracking (`localStorage` for theme is exempt under most jurisdictions). Keep it that way.

### 10.4 "Skip to calculator" link present. [no-op — good]

---

## Prioritised fix list

Ordered by visual-impact-per-risk. Each item is self-contained; skip any you don't want.

| # | Fix | Severity | Effort | Section |
|---|-----|----------|--------|---------|
| 1 | Re-enable tinted shadow tier on hero answer cards | High | S | 3.2 |
| 2 | Warm the light-mode `--bg` and cool the surfaces | High | S | 3.1 |
| 3 | Sidebar `100vh` → `100dvh` | High | XS | 4.1 |
| 4 | H1 size bump for hero | Med | XS | 2.1 |
| 5 | Desaturate mod1–mod6 accents ~10% | Med | S | 3.3 |
| 6 | Real ghost-button hover state | Med | XS | 5.1 |
| 7 | Kill `!important` in field-shell via `:where()` | Med | M | 4.2 |
| 8 | Merge duplicate exam-density blocks | Med | M | 9.2 |
| 9 | Weight the primary comparison card (1.25fr) | Low | XS | 4.3 |
| 10 | Add `text-wrap: pretty` to body copy | Low | XS | 2.4 |
| 11 | Nested disclosure tier (no border, indented chevron) | Low | S | 7.1 |
| 12 | Button.link tertiary style | Low | XS | 7.2 |
| 13 | Z-index scale tokens | Low | S | 4.4 |
| 14 | Consolidate label tracking rule | Low | XS | 2.2 |
| 15 | Tint sidebar backdrop | Low | XS | 3.4 |
| 16 | `scroll-behavior: smooth` | Low | XS | 5.3 |
| 17 | Vary "Ready to calculate" placeholders | Low | S | 6.2 |
| 18 | Sentence case on module headers | Low | XS | 6.1 |
| 19 | Move inline styles to classes | Low | XS | 9.1 |
| 20 | OG / social meta tags | Low | XS | 9.3 |

**Suggested first pass** (highest impact, lowest risk, self-contained): **1, 2, 3, 4, 5**. Under 40 lines of CSS diff, transforms the surface feel without touching component structure.
