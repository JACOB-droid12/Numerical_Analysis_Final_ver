---
name: design-taste-frontend
description: Senior UI/UX Engineer calibrated for the Machine Arithmetic & Error Analysis Lab. Vanilla HTML/CSS/JS stack, editorial serif display, data-dense calculator interface, academic restraint on motion. Overrides default LLM biases toward SaaS-dashboard patterns and React/Tailwind assumptions.
---

# High-Agency Frontend Skill — Calibrated for the Numerical Analysis Lab

This is a project-specific calibration of the `design-taste-frontend` skill. Dials and rules have been tuned for a vanilla-stack educational calculator used during numerical analysis coursework. The general shape follows the canonical skill; overrides are tagged **[PROJECT OVERRIDE]** so the reasoning is visible.

## 1. ACTIVE BASELINE CONFIGURATION

* DESIGN_VARIANCE: **5** (1=Perfect Symmetry, 10=Artsy Chaos) — *calibrated down from 8*
* MOTION_INTENSITY: **3** (1=Static/No movement, 10=Cinematic/Magic Physics) — *calibrated down from 6*
* VISUAL_DENSITY: **7** (1=Art Gallery/Airy, 10=Pilot Cockpit/Packed Data) — *calibrated up from 4*

**Why these values [PROJECT OVERRIDE]:**
* Variance **5**: the page shell may break symmetry (sidebar + main + ambient aside), but numerical data MUST align predictably. Students compare digits across columns; misalignment corrupts the pedagogical signal.
* Motion **3**: the app is used during timed exams (`data-density="exam"` mode) and learning sessions. Perpetual motion is a cognitive tax. `prefers-reduced-motion` is already honored; respect it as the default, not the exception.
* Density **7**: tables of significant digits, IEEE-754 bit breakdowns, convergence logs, neighborhood expansions. This is a "cockpit" class interface. Data breathes through 1px lines and vertical rhythm, not card inflation.

**AI Instruction:** These are the calibrated defaults for THIS project. Do not revert to the canonical (8, 6, 4) baseline unless the user explicitly changes domains. ALWAYS listen to the user: adapt values dynamically based on what they request in chat. Use these (or user-overridden) values as global variables to drive Sections 3 through 7.

## 2. DEFAULT ARCHITECTURE & CONVENTIONS [PROJECT OVERRIDE]

The canonical skill assumes React/Next.js + Tailwind + Framer Motion. **None of that applies here.** This project is a vanilla-stack single-page app. Replace all canonical architecture directives with the following:

* **STACK:** Vanilla HTML 5, vanilla CSS (CSS Custom Properties for theming), vanilla JS (ES modules, loaded via `<script src="...?v=cachebust">`). No bundler is assumed. No JSX. No Tailwind. No Framer Motion. No TypeScript.
* **DEPENDENCY VERIFICATION [MANDATORY]:** Before using ANY external resource (font CDN, icon set, MathJax, Chart.js), verify it is either already present in `index.html` or `styles.css`, or flag the new dependency explicitly before use. No silent additions. Prefer zero-dependency solutions.
* **FRAMEWORK CONVERSIONS:**
  * "Server Components / Client Components" → N/A. Everything is client-side. Theme is bootstrapped pre-render via an inline `<script>` in `<head>` (keep that; it prevents flash-of-unstyled-theme).
  * "Use Tailwind classes" → Use semantic CSS class names and CSS Custom Properties. The project's tokens live in `:root` and `html[data-theme="dark"]` blocks in `styles.css`.
  * "Use Framer Motion for animations" → Use CSS `transition`/`animation` only. For scroll-driven effects that need JS, use `IntersectionObserver` — never `window.addEventListener('scroll')`.
  * "Use `useState`/`useReducer`" → Use module-scoped state objects and explicit `render*()` functions called after state changes. Prefer function-scoped state; reach for module-scoped only when truly shared.
* **STATE MANAGEMENT:** Module-level state objects (e.g., `const appState = { ... }`) with explicit render functions. Keep mutation localized. Avoid leaking state across engine files (`calc-engine.js`, `root-engine.js`, `poly-engine.js`, `math-engine.js`, `expression-engine.js`, `ieee754.js`) without an explicit API.
* **STYLING POLICY:** Vanilla CSS, single `styles.css` file. Tokens via `:root` custom properties; theming via `html[data-theme="light|dark"]`. Density modes via `html[data-density="standard|exam"]`. Container queries are the preferred responsive primitive; `@media` only for viewport-relative concerns.
* **ANTI-EMOJI POLICY [CRITICAL, with project carve-out]:** NEVER use emoji faces, objects, or decorative pictograms in code, markup, text content, or alt text. **[PROJECT OVERRIDE]** Unicode mathematical symbols (`∑ Δ f(x) √ π ∫ ∞ ∂ ≈ ≠ ≤ ≥ × ÷ ± ∓ · ⊕ ⊗`) are explicitly PERMITTED — they are canonical math notation, not emoji, and the current sidebar uses them intentionally as a bias-break against the Lucide/Feather default. If a decorative icon is genuinely needed, prefer inline SVG primitives over any icon library.
* **RESPONSIVENESS & SPACING:**
  * Container queries FIRST for component-scoped responsiveness (the project already uses them for `.module-shell`, `.comparison-grid`).
  * `@media` breakpoints: the project has settled on `980px`, `860px`, `768px`, `720px`. Reuse these; do not introduce new breakpoints without reason.
  * Page-level width constraint: the project uses a flex shell with sidebar + main. If a new container is added, cap with `max-width` between `1200px` and `1440px` and `margin-inline: auto`.
  * **Viewport stability [CRITICAL]:** NEVER use `100vh` for full-height panels — iOS Safari will jump. ALWAYS use `100dvh`. This is an active bug in `styles.css` (`.sidebar-mobile` uses `100vh`) — flag and fix when touching that area.
  * **Grid over flex-math:** NEVER use `width: calc(33.33% - var(--gap))` tricks. ALWAYS use CSS Grid with `repeat(N, minmax(0, 1fr))` or named tracks.
* **ICONS:** **[PROJECT OVERRIDE]** NO icon library dependency. The project uses (a) Unicode math glyphs for semantic navigation and (b) inline branded SVGs (the favicon pattern is the model). If a genuinely new icon is needed, commission one as a ~24×24 inline SVG with a single stroke-width of `1.5px` or `2px`, chosen to match the project's existing stroke weight and optimized via SVGO.

## 3. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs statistically drift toward SaaS-marketing clichés. These rules counteract that drift for this specific project:

**Rule 1: Deterministic Typography [PROJECT OVERRIDE on the serif ban]**
* **Display/Headlines:** Use `Source Serif 4` (already loaded) as the display face. Keep `clamp(2rem, 4vw, 3rem)` for h1 with `line-height: 1.02` and `letter-spacing: -0.04em`. h2 sits at `clamp(1.45rem, 2.3vw, 2.2rem)`.
    * **[PROJECT OVERRIDE — serif UNBANNED]:** The canonical skill BANS serif for dashboards. This project is NOT a SaaS dashboard — it is an academic/educational calculator where an editorial serif reinforces the "textbook" feel and creates a strong pairing with the sans body. The existing Source Serif 4 + Source Sans 3 + JetBrains Mono trio is a project strength per `DESIGN_AUDIT.md`. PRESERVE it. Do not swap to Geist/Satoshi etc.
    * **ANTI-SLOP:** Inter remains BANNED. Do not introduce Inter regardless of context.
* **Body/Paragraphs:** Use `Source Sans 3`. Default to `font-size: 0.95rem`, `line-height: 1.55`, `color: var(--text)`, `max-inline-size: 65ch` on prose containers (`.subtitle`, `.module-copy`, `.lesson-note`). Add `text-wrap: pretty` on multi-line prose; `text-wrap: balance` is already on h1/h2.
* **Numerical data [PROJECT-SPECIFIC MANDATE]:** Use `JetBrains Mono` (already loaded) with `font-variant-numeric: tabular-nums lining-nums`. This applies to `<dd>` elements holding answers, `<td>` cells in result tables, IEEE-754 bit renderings, and convergence iterate values. Tabular figures are non-negotiable for digit-alignment comparisons.
* **Weight hierarchy:** 400 (body) / 500 (emphasis, captions, metadata) / 600 (labels, small headers) / 700 (display only). Audit jumps from 400→700 — interpose 500 where possible to soften hierarchy jumps.
* **Label tracking:** small-caps/labels at `letter-spacing: 0.1em` (NOT `0.12em` — consolidate around one value). Display headers at `-0.04em`. No duplicated tracking rules across files.

**Rule 2: Color Calibration [PROJECT OVERRIDE on single-accent rule]**
* **[PROJECT OVERRIDE — 6 modules allowed]:** The canonical rule is "max 1 accent." This project uses a 6-module pedagogical color system (`--mod1` blue, `--mod2` purple/magenta, `--mod3` teal, `--mod4` emerald, `--mod5` amber, `--mod6` slate). These are wayfinding signals, not decoration. PRESERVE the system. Enforce these constraints instead:
  * Only ONE module is visible at a time in the main panel (by module activation).
  * Sidebar chrome may show module chips together — desaturate those by an additional ~5% beyond base to prevent rainbow clash.
  * Saturation cap: **< 70%** for all six modules (stricter than the canonical < 80% rule). Shift mod2 away from pure purple toward magenta/plum to distance from mod1 blue and break the "AI gradient" association.
  * Each module exposes three tokens: `--modN-soft` (background tint), `--modN-strong` (solid accent), `--modN-contrast` (text-on-accent). Never define a fourth.
* **THE LILA BAN:** "AI Purple/Blue" gradient aesthetic remains BANNED. No purple button glows, no neon gradients, no multi-stop rainbow fills, no duotone treatments on text.
* **COLOR CONSISTENCY:** One gray family. The project currently tints greys subtly cool in dark mode and slightly warm in light — pick and commit. Warm neutrals (`#fafaf7`, `#f6f5f0`) pair better with Source Serif than cool. **Light-mode `--bg` should NOT be pure `#ffffff`** (per `DESIGN_AUDIT.md` §3.1). Dark-mode `--bg` should NOT be pure `#000` — `#111113` is the current value, keep it or go `#0e0e10`.
* **Tinted shadows:** Shadows must tint with the theme. Use `color-mix(in srgb, var(--text) 8%, transparent)` instead of `rgba(0,0,0,0.08)`. Reserve shadow for the PRIMARY answer card (`.answer-hero`) and active sidebar nav state; keep everything else flat and carried by 1px borders. See `DESIGN_AUDIT.md` §3.2.

**Rule 3: Layout Diversification [PROJECT OVERRIDE on centered-hero ban + 3-col ban]**
* **ANTI-CENTER BIAS:** Centered hero H1 sections are banned when `DESIGN_VARIANCE > 4`. With the calibrated `DESIGN_VARIANCE=5`, prefer left-aligned masthead headlines over centered ones. The current masthead is already left-aligned — keep it.
* **[PROJECT OVERRIDE — 3-column equal grids permitted for parallel numerical results]:** The canonical rule forbids "3 equal cards horizontally." This project's `.comparison-grid-triple` and `.root-summary-grid` are N-column grids of SEMANTICALLY PARALLEL computations (e.g., x, x*, x**; or three iterative methods side-by-side). They are appropriate here. Apply instead:
  * Weight the primary answer card: `grid-template-columns: 1.25fr 1fr 1fr` for triples (per `DESIGN_AUDIT.md` §4.3).
  * Align baselines across columns: titles, labels, and values must share Y-position row-by-row.
  * Pin CTAs (e.g., "Copy result", "Open trace") to the bottom of each card via grid/flex end-alignment, so they form a clean horizontal line.
* **Asymmetry budget:** At `DESIGN_VARIANCE=5`, spend asymmetry on the SHELL (sidebar vs main, welcome strip vs module shell), NOT on the numerical comparison surfaces. Keep data surfaces gridded and predictable.
* **Mobile override:** Any asymmetric desktop layout MUST collapse to strict single-column at `< 720px` or `< 768px`. Match the existing breakpoints in `styles.css`.

**Rule 4: Materiality, Shadows, "Anti-Card Overuse" [PROJECT OVERRIDE]**
* **[PROJECT OVERRIDE — dashboard hardening tuned for VISUAL_DENSITY=7]:** The canonical rule says at `VISUAL_DENSITY > 7` eliminate cards entirely. At the calibrated `VISUAL_DENSITY=7`:
  * Use cards ONLY for the primary answer surface and the active-module shell where elevation communicates hierarchy.
  * Use `border-block-start: 1px solid var(--line)` and `border-inline-start: 3px solid var(--modN-strong)` to group sections WITHOUT wrapping in a card.
  * Tables live inside `.table-wrap` with an overflow hint, NOT a card. Edge gradients should use `color-mix(in srgb, var(--text) 8%, transparent)` not raw `rgba(0,0,0,...)`.
  * Disclosures (`<details>`) use a single border-left accent instead of a full card border when they are NESTED under another disclosure — break the "six identical stacked accordions" look noted in `DESIGN_AUDIT.md` §7.1.
* **Shadow policy:** Reintroduce ONE shadow tier for the hero answer and the active sidebar nav state only. Values: `0 1px 2px color-mix(in srgb, var(--text) 4%, transparent), 0 8px 24px -12px color-mix(in srgb, var(--text) 10%, transparent)`. Dark-mode equivalent with a cool tint. Every other surface: flat, bordered. No widespread `box-shadow` — the current code's `box-shadow: none` defaults are correct, just add the one tier back for the hero.

**Rule 5: Interactive UI States [PROJECT MANDATE]**
LLMs default to "happy-path only" states. This project MUST implement all four:
* **Loading:** Use the existing `compute-pulse` animation for in-progress computations. Skeleton blocks (not circular spinners) for data-table fetches. `prefers-reduced-motion`: replace the pulse with a static "Computing…" text state.
* **Empty states:** Vary the empty-cell copy by context (per `DESIGN_AUDIT.md` §6.2). "Awaiting k" for the digits cell. "Awaiting operand" for input cells. "Not yet computed" for final results. Never use a single catch-all string for every empty cell.
* **Error states:** Inline, aria-live="polite", tied to the specific control. NEVER `window.alert()`. Error text color uses a desaturated warning tone, not pure red. Match the existing `.error-hint` class.
* **Tactile feedback:** `transform: scale(0.98)` on `:active` for all buttons — this is already implemented; don't remove it. Add `transition: transform 120ms cubic-bezier(0.2, 0, 0, 1)` if missing.
* **Hover:** `button:hover` must have a real visible change. The current `filter: brightness(0.9)` is invisible on ghost buttons — replace with `background: var(--surface-2); border-color: var(--line-strong)` for ghost, and a small translate + tinted background-shift for filled (per `DESIGN_AUDIT.md` §5.1).
* **Focus:** Visible focus ring, 2px, offset 2px, color `var(--focus)`. Never `outline: none` without a replacement. Skip-link already works — preserve.

**Rule 6: Data & Form Patterns [PROJECT MANDATE]**
* **Form layout:** Label ABOVE input. Helper text below input at `0.8rem`, `color: var(--text-muted)`. Error text below input at `0.8rem`, `color: var(--warn-text)`. Use `gap: var(--space-1)` in the input block.
* **Input styling:** Use the project's base `input` rule at `styles.css:269`. Refactor that rule to use `:where(input)` for zero-specificity defaults, then DELETE the `!important` war in the field-shell overrides (`styles.css:491-494`, `2055-2058`) per `DESIGN_AUDIT.md` §4.2.
* **Numerical inputs:** `inputmode="decimal"` for decimal entry, `inputmode="numeric"` for integers. Never `type="number"` — it hides precision and kills `tabular-nums`.
* **Tables of numbers:** Right-align numeric columns. Left-align labels. Use `text-align: start` / `text-align: end` (logical) not `left`/`right`. Apply `font-variant-numeric: tabular-nums` on the `<td>` or on an `--nums` container.

## 4. CREATIVE PROACTIVITY (Anti-Slop) [PROJECT OVERRIDE]

The canonical skill's "liquid glass refraction," "magnetic micro-physics," "perpetual micro-interactions," "layout transitions," and "staggered orchestration" are all Framer-Motion-dependent and motion-heavy. At the calibrated `MOTION_INTENSITY=3`, most of these are **disabled**. Replace with these project-appropriate anti-slop techniques:

* **Module color transitions:** When the active module changes, transition `--active-accent` via CSS custom property animation. Duration `220ms`, easing `cubic-bezier(0.2, 0, 0, 1)`. The sidebar active indicator should slide via `transform`, never via animating `top`/`height`.
* **Compute-pulse on result reveal:** Already implemented. On new computation, briefly pulse the result number's background opacity. 400ms, single iteration. `prefers-reduced-motion`: swap for a static "Updated" chip that decays over 2s.
* **Focus-first interactions:** Keyboard focus should always have a visible, high-contrast ring. Use `:focus-visible` not `:focus` to avoid ring flash on mouse click.
* **Scroll anchoring:** `html { scroll-behavior: smooth; }` — already guarded inside `prefers-reduced-motion: no-preference`. Smooth for keyboard skip-link, static for reduced-motion.
* **Container-query-driven layout:** Prefer `@container` rules over JS layout measurement. The project already uses this pattern — extend it, don't replace.
* **Bias-break motifs [project-specific]:** Unicode math glyphs in the sidebar (∑ Δ f(x) √ 64 ?). Branded inline-SVG favicon. Module-colored left borders. These ARE the project's anti-slop signatures. DO NOT remove them in the name of "modernization."

**Explicitly BANNED in this project [PROJECT OVERRIDE]:**
* Magnetic-cursor buttons, mouse-following glows, cursor trails — distraction during exam mode.
* Perpetual/infinite loops (shimmer forever, float forever, pulse forever). Only the `compute-pulse` during active computation is allowed.
* Parallax scrolling, sticky-stack cards, horizontal scroll hijack — the page is a single-screen tool, not scrolltelling.
* Gooey menus, dynamic islands, morphing modals — the project uses `<details>` disclosures and this is the right pattern for progressive disclosure of numerical methods.
* Custom mouse cursors and cursor trails (also banned globally in the canonical skill — reaffirmed here).

## 5. PERFORMANCE GUARDRAILS

* **Animation primitives:** Animate EXCLUSIVELY `transform` and `opacity`. Never `top`, `left`, `width`, `height`, `margin`, `padding`. Current code complies — don't regress it.
* **DOM cost of textures:** If adding a noise/grain overlay (`DESIGN_AUDIT.md` §3.6 flags this as optional), apply it to a `body::before` pseudo-element with `position: fixed; inset: 0; pointer-events: none; z-index: var(--z-overlay);`. NEVER apply to scrolling containers or to the body directly (forces continuous GPU repaint).
* **Z-index discipline:** Introduce `--z-skiplink (10000)`, `--z-modal (800)`, `--z-sidebar (700)`, `--z-popover (500)`, `--z-sticky (300)`, `--z-overlay (50)` tokens in `:root` (per `DESIGN_AUDIT.md` §4.4). Delete arbitrary `z-index: 9999` values.
* **Script loading:** Scripts at end of `<body>`, preserve the manual `?v=...` cache-bust scheme the project uses (don't introduce a bundler without being asked). Add `type="module"` only if the script actually uses imports.
* **Font loading:** Subset weights to the four actually used (400/500/600/700). Preload the display weight (`<link rel="preload" as="font" ...>`) if it's above-the-fold. Fallback stack in `font-family` so the first paint uses a system serif/sans with close metrics.
* **Image strategy:** No images in the current design, and none are needed. If a diagram or figure becomes necessary, use inline SVG for anything procedural (IEEE-754 bit diagrams), and `<img>` with `loading="lazy"` + `decoding="async"` + explicit `width`/`height` for raster assets.

## 6. TECHNICAL REFERENCE (Dial Definitions) [PROJECT-CALIBRATED]

### DESIGN_VARIANCE (Level 1–10) — Calibrated baseline: **5**
* **1–3 (Predictable):** All content centered, symmetrical grids, equal paddings, same-height cards.
* **4–7 (Offset) — YOU ARE HERE at 5:**
  * Shell is asymmetric: sidebar (`260px`) + main + optional ambient aside.
  * Masthead left-aligned, not centered.
  * Module shell has a 3px left border in the module accent color.
  * Data grids REMAIN symmetric and gridded — asymmetry does not cross into numerical surfaces.
  * Weight the primary comparison column: `1.25fr 1fr 1fr` not `1fr 1fr 1fr`.
  * Vary disclosure depth: top-level `<details>` have a card border; nested ones drop to a left-border only.
* **8–10 (Asymmetric):** DO NOT ENTER without user request. Masonry for the module grid, massive offset whitespace, asymmetric type scales — this level breaks calculator usability.
* **MOBILE OVERRIDE:** At `< 768px`, the sidebar overlays and main becomes single-column (`w-full`, `padding-inline: var(--space-4)`). Any triple-column comparison grid collapses to single-column with the primary result ordered first. The current CSS handles this — verify before any overhaul.

### MOTION_INTENSITY (Level 1–10) — Calibrated baseline: **3**
* **1–3 (Static) — YOU ARE HERE at 3:**
  * CSS `:hover`, `:active`, `:focus-visible` transitions only.
  * Transition properties: `transform`, `opacity`, `background-color`, `border-color`, `color`. Duration `120ms–240ms`. Easing `cubic-bezier(0.2, 0, 0, 1)` or `ease-out`.
  * ONE allowed named animation: `compute-pulse` for in-progress computations.
  * `scroll-behavior: smooth` guarded by `@media (prefers-reduced-motion: no-preference)`.
  * No scroll-linked animations. No `IntersectionObserver`-based reveals unless the feature is genuinely better with them (rare).
* **4–7 (Fluid CSS):** Load-in cascades with `animation-delay`, staggered reveals. DO NOT enter without user request.
* **8–10 (Advanced Choreography):** GSAP / ScrollTrigger / parallax. Not applicable — no build step, no dependencies.
* **`prefers-reduced-motion: reduce` is LAW:** at any intensity, the reduced-motion media query must disable all non-essential animation. `compute-pulse` is the only allowed exception, and even then prefer a static "Computing…" label. This is currently wired correctly — preserve the pattern.

### VISUAL_DENSITY (Level 1–10) — Calibrated baseline: **7**
* **1–3 (Art Gallery Mode):** Huge section gaps, generous whitespace. NOT appropriate for this tool.
* **4–6 (Daily App Mode):** Standard spacing. The `data-density="standard"` mode operates here.
* **7–10 (Cockpit Mode) — YOU ARE HERE at 7:**
  * Section gap: `var(--space-4)` or `var(--space-5)` max.
  * Table row height: `2.25rem` standard, `1.875rem` in exam density.
  * No card-wrapping around single values — use `border-top: 1px solid var(--line)` separators and `--modN-strong` left-borders for grouping.
  * All numeric output uses `JetBrains Mono` with `font-variant-numeric: tabular-nums lining-nums`.
  * The `data-density="exam"` mode pushes density toward 8.5 — tighten all paddings by ~20%, suppress non-essential disclosures, hide the welcome strip. This mode already exists; preserve it.

## 7. AI TELLS (Forbidden Patterns) [PROJECT-TUNED]

### Visual & CSS
* **NO neon/outer glows.** Inner borders and tinted shadows only.
* **NO pure black (`#000000`).** Use `#111113` (current dark `--bg`) or `#0e0e10`.
* **NO pure white (`#ffffff`) for light-mode canvas.** Use `#fafaf7` or `#fbfbfa`. Pure white is `DESIGN_AUDIT.md` §3.1's flagged issue.
* **NO oversaturated accents.** Keep saturation < 70% (project rule, stricter than canonical).
* **NO excessive gradient text / multi-stop text gradients.** H1s use solid color, weight, and tracking for presence.
* **NO custom mouse cursors / cursor trails / mouse-follow glows.**
* **NO `!important` unless scoped to density-override rules or print styles.** The field-shell `!important` war is a code-smell to resolve, not a pattern to imitate.

### Typography
* **NO Inter.** Banned globally. Source Serif 4 + Source Sans 3 + JetBrains Mono is the project's stack.
* **NO Lucide/Feather icons.** Unicode math glyphs and inline SVGs only.
* **NO oversized hero H1s that scream.** `clamp(2rem, 4vw, 3rem)` is the ceiling (per `DESIGN_AUDIT.md` §2.1 fix).
* **NO title-case on some headers and sentence-case on others.** Commit to sentence case (warmer, more modern, consistent with tutorial cards).
* **[PROJECT OVERRIDE]** Serif is NOT banned here. The canonical anti-serif rule is suspended for this academic context.

### Layout & Spacing
* **NO `100vh` on full-height panels** — use `100dvh`.
* **NO arbitrary z-index values.** Use the `--z-*` token scale.
* **NO duplicated CSS selectors across distant file sections.** Consolidate `html[data-density="exam"]` blocks (per `DESIGN_AUDIT.md` §9.2).
* **NO flexbox `calc(33.33% - Xrem)` math.** Use CSS Grid with `repeat(N, minmax(0, 1fr))` or explicit track sizes.
* **[PROJECT OVERRIDE]** 3-column equal grids are NOT forbidden when the columns hold semantically parallel numerical results. Weight the primary column.

### Content & Data [PROJECT-SPECIFIC]
* **NO made-up math.** Every example function, every example iterate, every displayed result must be mathematically correct.
* **NO fake-precision fake-numbers.** Avoid padding with zeros ("5.000000") to look thorough. Use real precision: if the method converged to 5 sigfigs, show 5 sigfigs.
* **NO "Jane Doe"–style invented persona data.** This project has no user-generated content — the canonical rules about avatars, phone numbers, and stock "diverse team" photos DO NOT APPLY.
* **NO filler words in UI copy:** "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changer", "Delve", "Tapestry", "In the world of…". Use concrete verbs: "Compute", "Iterate", "Compare", "Reveal", "Round".
* **NO exclamation marks in success messages.** "Computed." not "Computed!".
* **NO "Oops!" error messages.** "Bisection failed: sign change required." not "Oops! Something went wrong."
* **NO lorem ipsum.** Use real example prose tied to the numerical method being taught.
* **NO dead `href="#"` links.** Either wire to a real section or render as a non-link element (e.g., `<button>` with the action).

### External Resources & Components
* **NO new CDN dependencies** without explicit user approval. The project is vanilla by choice.
* **NO Unsplash / stock photos.** No persona avatars. If placeholder imagery ever becomes needed, use `https://picsum.photos/seed/{seed}/{w}/{h}` and document it.
* **NO shadcn/ui, Radix, Ark, Headless UI, Catalyst, or any component library.** This project has none and adding one is out of scope.

## 8. THE CREATIVE ARSENAL [PROJECT-FILTERED]

The canonical skill lists ~50 advanced UI concepts. Most are inappropriate for a calculator-forward academic tool. The following subset IS compatible with this project and may be pulled from when a feature genuinely benefits:

### Permitted for this project
* **Module color wayfinding:** The 6-module color system acts as a "chroma grid" for navigation — keep using it. Active module's color tints the masthead, the sidebar indicator, the module-shell left border, and the primary action button.
* **Tabbed progressive disclosure:** `<details>` + `<summary>` for optional methods, advanced options, and explanations. Already the dominant pattern — refine tiers (nested vs top-level) per `DESIGN_AUDIT.md` §7.1.
* **Inline KaTeX / MathJax rendering:** If mathematical notation becomes necessary beyond what Unicode covers, introduce KaTeX (lighter than MathJax) behind an explicit user approval.
* **Responsive card-to-table pattern:** The existing `td::before { content: attr(data-label) }` pattern for mobile table collapse is excellent. Extend, don't replace.
* **Animated SVG line drawing [restrained]:** For a single pedagogical moment (e.g., illustrating bisection bracket convergence on a function plot), a restrained SVG draw animation can pay for itself. Wrap in `prefers-reduced-motion: no-preference`, duration ≤ 1.5s, trigger explicit (button click or `IntersectionObserver`), ONE-SHOT only.
* **Skeleton shimmer for table rows:** During async method computation, show skeleton rows that match the final row layout. Shimmer is CSS-only, 1.5s cycle, halts on reduced-motion.
* **Sticky section-heading behavior:** If the module content becomes long enough to scroll independently, the module kicker + h2 can `position: sticky; top: 0` to maintain orientation. Currently not needed.

### Banned for this project [PROJECT OVERRIDE]
Everything not in the above list, including: bento grids with perpetual motion, holographic foil cards, tilt cards, particle explosions, text scramble effects, kinetic typography grids, liquid swipe transitions, dome galleries, coverflow carousels, magnetic buttons, gooey menus, mac-dock magnification, dynamic islands, mesh gradient backgrounds, glitch effects, ripple click effects. These are solutions to SaaS-marketing and portfolio problems. This project has neither.

## 9. THE "MOTION-ENGINE" BENTO PARADIGM — **DISABLED [PROJECT OVERRIDE]**

The canonical skill's Section 9 describes a Vercel-core / Bento-2.0 motion-engine aesthetic with perpetual Framer Motion animations, infinite loops, spring physics, and `layoutId`-driven transitions. **This entire section is disabled for this project.**

**Why disabled:**
* No Framer Motion. No React. No build step. No dependency budget for Framer at `~50kb`.
* `MOTION_INTENSITY=3` forbids perpetual/infinite animations.
* The project's users need focus during exam mode; a "dashboard that feels alive" is the opposite of what they need.
* The calculator surfaces are functionally static — they display a computed result, they do not benefit from "breathing" status indicators or shimmering loading gradients on the main answer.

**If the user explicitly requests Bento/SaaS-marketing aesthetic for a new page** (e.g., a separate landing/overview page at `/about` or `/methods-index`), revisit this section then. Until then: disabled.

## 10. FINAL PRE-FLIGHT CHECK [PROJECT-CALIBRATED]

Evaluate output against this matrix before shipping. This is the LAST filter you apply.

Stack & architecture:
- [ ] Did you avoid introducing React, Next.js, Tailwind, Framer Motion, shadcn, or any icon library?
- [ ] Are new dependencies flagged explicitly (none should be added silently)?
- [ ] Did you preserve the project's cache-bust pattern (`?v=...`) on script tags?
- [ ] Is module state kept out of the DOM as a source of truth?

Typography:
- [ ] Source Serif 4 for display / Source Sans 3 for body / JetBrains Mono for numbers — did you preserve it?
- [ ] No Inter anywhere?
- [ ] Tabular numerics wired on every numeric `<dd>`, `<td>`, and result cell?
- [ ] H1 uses `clamp(2rem, 4vw, 3rem)` with `line-height: 1.02` and `letter-spacing: -0.04em`?
- [ ] `text-wrap: pretty` on prose containers; `balance` on h1/h2?

Color & surfaces:
- [ ] Light `--bg` is NOT pure white; dark `--bg` is NOT pure black?
- [ ] All 6 module accents are at < 70% saturation?
- [ ] Shadows are tinted via `color-mix(in srgb, var(--text) X%, transparent)` not raw `rgba(0,0,0,...)`?
- [ ] Shadow tier applied only to primary answer card and active sidebar nav state?

Layout:
- [ ] All full-height panels use `100dvh`, never `100vh`?
- [ ] Comparison grids weight the primary column (`1.25fr 1fr 1fr`)?
- [ ] Z-index values drawn from the `--z-*` token scale?
- [ ] No `!important` outside density overrides or print styles?
- [ ] Mobile layout collapses to single-column at the existing breakpoints?

Motion:
- [ ] All animations on `transform` and `opacity` only?
- [ ] `prefers-reduced-motion: reduce` disables non-essential motion?
- [ ] No perpetual / infinite animations (only `compute-pulse` during active work)?
- [ ] `scroll-behavior: smooth` guarded by `prefers-reduced-motion: no-preference`?

States:
- [ ] Loading, empty, error states all defined for every new interactive surface?
- [ ] Hover states visible on BOTH filled and ghost buttons?
- [ ] Focus ring visible on `:focus-visible`, never suppressed?
- [ ] `:active` has `scale(0.98)` tactile feedback (preserve, don't remove)?

Content:
- [ ] No made-up math; every example is mathematically correct?
- [ ] No filler words ("Elevate", "Seamless", etc.)?
- [ ] Sentence case on all headers consistently?
- [ ] Empty-state copy varies by context (not all "Ready to calculate")?

Accessibility:
- [ ] Skip-link preserved?
- [ ] ARIA live regions for async computation results?
- [ ] `prefers-contrast: more` honored?
- [ ] Keyboard nav reaches every interactive control with a visible focus ring?
- [ ] Semantic HTML (`main`, `aside`, `nav`, `article`, `section`, `header`, `details`) preserved?

Cleanup debt (from `DESIGN_AUDIT.md`):
- [ ] Duplicate `html[data-density="exam"]` blocks merged?
- [ ] Label-tracking duplication consolidated (one rule, not two)?
- [ ] Inline `style="..."` attributes moved to classes?
- [ ] `!important` in field-shell refactored via `:where()`?

---

## Appendix A: Project Context Card

Paste this into any subagent prompt that needs project context:

> **Project:** Machine Arithmetic & Error Analysis Lab. Single-page educational calculator covering IEEE-754 representation, significant-figure arithmetic, bisection / Newton / secant / false-position root finding, polynomial evaluation, and expression parsing. Used by students learning numerical analysis, often during timed exams (`data-density="exam"` mode).
>
> **Stack:** Vanilla HTML / CSS (custom properties, container queries) / vanilla JS (ES modules, no bundler). Theme bootstrapped via inline `<script>` in `<head>`. Dark + light themes via `html[data-theme]`. Standard + exam density via `html[data-density]`.
>
> **Typography:** Source Serif 4 (display) / Source Sans 3 (body) / JetBrains Mono (numerals). This pairing is a project strength — preserve it.
>
> **Accent system:** 6-module color palette (`--mod1` blue, `--mod2` magenta/plum, `--mod3` teal, `--mod4` emerald, `--mod5` amber, `--mod6` slate). Each module exposes `-soft`, `-strong`, `-contrast` tokens. Saturation capped at < 70%.
>
> **Dials:** `DESIGN_VARIANCE=5`, `MOTION_INTENSITY=3`, `VISUAL_DENSITY=7`.
>
> **Key files:** `index.html` (1312 lines), `styles.css` (3576 lines, soon to be restructured), `app.js` (3265 lines), `calc-engine.js`, `root-engine.js`, `root-ui.js`, `poly-engine.js`, `math-engine.js`, `expression-engine.js`, `ieee754.js`, `math-display.js`.
>
> **Active audit:** `DESIGN_AUDIT.md` at repo root. 20 prioritized findings. Suggested first pass: items 1–5 (tinted shadows, warm bg, 100dvh, h1 bump, desaturate accents).
>
> **Non-goals:** Framework migration. Icon-library introduction. Bento/SaaS-marketing aesthetic. Perpetual motion. Cursor glows.

## Appendix B: Quick dial override table

If the user asks for a different feel, these are the recommended dial combos that remain coherent with the project's identity:

| Mode | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY | When to use |
|------|-----------------|------------------|----------------|-------------|
| Exam / focus mode | 4 | 2 | 8 | During exams; maximize data, minimize motion |
| Standard (default) | **5** | **3** | **7** | Everyday student use |
| Teaching / lecture | 5 | 4 | 6 | Projected on a classroom screen; slight motion for attention |
| Print / PDF export | 3 | 1 | 6 | Print stylesheet; static |
| Showcase / demo | 7 | 5 | 5 | Portfolio / conference demo; one-shot reveal animations allowed |

Never enter `DESIGN_VARIANCE ≥ 8`, `MOTION_INTENSITY ≥ 6`, or `VISUAL_DENSITY ≤ 3` without explicit user request.
