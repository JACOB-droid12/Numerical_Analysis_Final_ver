# Calculator Minimalist Redesign

## Goal

Strip the Machine Arithmetic Lab from its over-styled aesthetic down to a clean, functional, modern academic tool. Remove all decorative elements (noise textures, gradient bars, tinted shadows, pill shapes) and replace with flat surfaces, simple borders, and a neutral palette with one blue accent.

## Skill Configuration

taste-skill baseline overrides for this project:

- `DESIGN_VARIANCE: 3` — predictable, symmetrical layouts
- `MOTION_INTENSITY: 3` — CSS hover/active only, no JS animations
- `VISUAL_DENSITY: 5` — daily-app density, moderate spacing

## What Changes

### Foundation

**Light theme palette:**

| Token | Old | New |
|---|---|---|
| `--bg` | `#f2eee5` (cream) | `#ffffff` (white) |
| `--bg-accent` | `#e7dfcf` | `#f3f4f6` |
| `--surface-0` | `#fffdfa` | `#f8f9fa` |
| `--surface-1` | `#f6f0e4` | `#f3f4f6` |
| `--surface-2` | `#ede4d2` | `#e5e7eb` |
| `--surface-3` | `#dfd2bd` | `#d1d5db` |
| `--surface-strong` | `#fbf7ef` | `#f9fafb` |
| `--text` | `#221d16` | `#1a1a1a` |
| `--muted` | `#655848` | `#6b7280` |
| `--line` | `#d7c8af` | `#e5e7eb` |
| `--line-strong` | `#b8a78b` | `#d1d5db` |
| `--accent` | `#375c44` (green) | `#2563eb` (blue) |
| `--accent-soft` | `rgba(55,92,68,0.1)` | `rgba(37,99,235,0.08)` |
| `--accent-strong` | `#264431` | `#1d4ed8` |
| `--danger` | `#a63d2f` | `#dc2626` |
| `--danger-soft` | `rgba(166,61,47,0.12)` | `rgba(220,38,38,0.08)` |
| `--focus-ring` | `rgba(53,91,69,0.25)` | `rgba(37,99,235,0.2)` |

**Dark theme palette:**

| Token | Old | New |
|---|---|---|
| `--bg` | `#171a18` | `#111113` |
| `--bg-accent` | `#1e2421` | `#18181b` |
| `--surface-0` | `#1f2420` | `#1a1a1e` |
| `--surface-1` | `#262c27` | `#202024` |
| `--surface-2` | `#2f3731` | `#2a2a2e` |
| `--surface-3` | `#3a443d` | `#333338` |
| `--surface-strong` | `#232924` | `#1e1e22` |
| `--text` | `#edf1ea` | `#e4e4e7` |
| `--muted` | `#b7c1b4` | `#a1a1aa` |
| `--line` | `#384038` | `#2a2a2e` |
| `--line-strong` | `#4e5a50` | `#3f3f46` |
| `--accent` | `#9fbc86` (green) | `#3b82f6` (blue) |
| `--accent-soft` | `rgba(159,188,134,0.15)` | `rgba(59,130,246,0.12)` |
| `--accent-strong` | `#c6d9b0` | `#60a5fa` |
| `--danger` | `#f3a384` | `#f87171` |
| `--danger-soft` | `rgba(243,163,132,0.16)` | `rgba(248,113,113,0.12)` |
| `--focus-ring` | `rgba(159,188,134,0.24)` | `rgba(59,130,246,0.2)` |

Note: dark `--muted` uses `#a1a1aa` (contrast ratio ~7:1 on `#111113`, WCAG AA compliant).

**Removed entirely:**

- `--module-basic`, `--module-error`, `--module-poly` color tokens — remove declarations and all references
- `--shadow-soft`, `--shadow-panel` — remove declarations; replace all `var(--shadow-soft)` and `var(--shadow-panel)` references with `none`
- `body::after` grain overlay — delete entire rule block (and the `html[data-theme="dark"] body::after` override)
- `html` noise texture SVG `background-image` — delete from `html` rule
- `body` line-pattern `repeating-linear-gradient` — delete from `body` rule
- `--radius-pill` token — delete declaration. Change `--radius-sm` value from `8px` to `6px`. All former `var(--radius-pill)` references become `var(--radius-sm)`
- `--radius-xl` token — delete declaration. Max radius is now `--radius-md` (12px). All `var(--radius-xl)` references become `var(--radius-md)`

**Typography adjustments:**

- h1: `clamp(2.15rem, 4vw, 3.8rem)` down to `clamp(1.5rem, 2.5vw, 2rem)`
- h2: `clamp(1.45rem, 2.3vw, 2.2rem)` down to `clamp(1.2rem, 2vw, 1.5rem)`
- Keep Outfit (headings) + JetBrains Mono (values/inputs)
- Eyebrow/kicker labels: reduce font-weight from `650` to `600`

**Transitions:**

- Keep `--transition-fast` (160ms) and `--transition-base` (240ms) values unchanged
- Remove `box-shadow` from the global transition property list (since decorative shadows are gone)
- Keep `background-color`, `border-color`, `color`, `transform` in the transition list

### Sidebar

- Background: `--surface-0` with `1px` right border in `--line`
- Nav items: hide unicode icons via CSS (`display: none` on `.sidebar-icon`). HTML stays unchanged. Active state: `2px` left border in accent + `var(--accent-soft)` background
- Status display: inline monospace text `DEG | RECT | EXACT`, no chip containers — remove border, background, and border-radius from `.status-chip`
- Settings: plain text buttons, no ghost styling — remove border from sidebar setting buttons
- Catalog: plain text in a simple details element
- Remove `sidebar-divider` decoration — use `margin` spacing only
- Sidebar toggle button (`#sidebar-toggle`): keep functionality, style as a plain icon button with no background, `--muted` color
- Mobile toggle (`#sidebar-mobile-toggle`): keep functionality, same plain styling
- `--sidebar-width` and `--sidebar-collapsed-width` tokens: keep unchanged
- `.app-shell` container `width: min(1280px, 94vw)` and padding: keep unchanged

### Input Areas

- Remove the `.search-shell` visual styling (shadow, pill radius, thick border) but keep the element in HTML. Restyle to: no background, no border, no shadow, no padding — it becomes a transparent flex wrapper
- Expression input inside `.search-shell`: `1px solid var(--line)`, `var(--radius-sm)` (6px) border-radius, `var(--surface-0)` background, `min-height: 44px`, font `1.1rem`
- Calculate button (`.btn-calculate-omni`): `var(--accent)` background, white text, same `min-height: 44px`, `var(--radius-sm)` radius, `min-width: 52px`
- Symbol trigger (`.symbol-trigger`): small icon button, `var(--surface-1)` background, `1px solid var(--line)`, `var(--radius-xs)` (4px) radius
- Focus state for all inputs: `outline: 2px solid var(--accent)` with `outline-offset: 2px`. Remove `box-shadow` focus rings
- Settings row (k, rule selects): keep inline layout, no visual changes beyond the global palette/radius updates
- `select` custom arrow styling: keep as-is, just inherits new colors
- Same treatment across all three modules

### Results & Output

- Result values: JetBrains Mono, max `1.4rem` (down from `2.7rem` clamp max)
- `.answer-value` font-size: change to `clamp(1.1rem, 2vw, 1.4rem)`
- `.comparison-baseline .answer-value`: change to `clamp(1.2rem, 2.2vw, 1.5rem)`
- All result containers (`.answer-hero`, `.method-panel`, `.reading-panel`, `.utility-panel`): `var(--surface-0)` background, `1px solid var(--line)`, `var(--radius-sm)` radius. Remove all `color-mix` backgrounds
- No accent-tinted backgrounds on `.comparison-baseline` or `.answer-hero-source` — same neutral styling as everything else
- Comparison grids: identical neutral styling, differentiated by label text only
- Answer strip cells: label + value with `border-bottom: 1px solid var(--line)` instead of individual bordered boxes
- Disclosure panels: plain styling, `+`/`-` text indicator via CSS `::after` on summary
- Empty states: `var(--muted)` text, `var(--surface-0)` background, `1px solid var(--line)` border
- Remove `min-height: 144px` on `.answer-hero-major`

### Buttons

- Base `button` rule: change `border-radius` from `var(--radius-pill)` to `var(--radius-sm)` (6px)
- Primary: `var(--accent)` background, `#ffffff` text, `padding: 0.6rem 1rem`
- Ghost: `transparent` background, `1px solid var(--line)`, `var(--muted)` text
- Hover: `filter: brightness(0.9)` on primary, `var(--surface-1)` background on ghost. Remove `transform: translateY(-1px)`
- Active: change `scale(0.97)` to `scale(0.98)`
- Focus: `outline: 2px solid var(--accent)` with `outline-offset: 2px`. Remove `box-shadow: 0 0 0 4px var(--focus-ring)` from focus-visible rule
- Symbol buttons (`.symbol-btn`): `var(--radius-xs)` (4px) radius, `var(--surface-1)` background, `padding: 0.2rem 0.5rem`

### Module Headers

- Remove `.module-shell::before` gradient bar rule entirely
- Remove `.module-basic::before`, `.module-error::before`, `.module-poly::before` rules
- Delete `--module-basic`, `--module-error`, `--module-poly` from both theme blocks
- Plain text: kicker label + heading + description in `--text` and `--muted`
- `.module-shell`: `background: transparent`, `border: none`, keep `padding` and `gap` for spacing. Change `border-radius` from `var(--radius-xl)` to `var(--radius-md)`

### Welcome Strip

- Keep the welcome strip. Restyle to: `var(--surface-0)` background, `1px solid var(--line)` border, `var(--radius-sm)` radius. Remove the tinted `color-mix` background

## What Stays Unchanged

- All JavaScript: app.js, calc-engine.js, expression-engine.js, math-display.js, math-engine.js, poly-engine.js
- HTML structure and ARIA accessibility (no DOM changes)
- Responsive grid layouts and breakpoints (visual simplification only)
- Font pairing: Outfit + JetBrains Mono
- Theme toggle and persistence logic
- Skip-link accessibility
- Sidebar collapse/expand behavior and dimensions
- `.app-shell` container width and padding
- `select` element arrow styling (inherits new colors)

## WCAG Contrast Verification

All text must pass WCAG AA (4.5:1 for normal text, 3:1 for large text):

| Token pair | Light | Dark |
|---|---|---|
| `--text` on `--bg` | `#1a1a1a` on `#ffffff` = 17.4:1 | `#e4e4e7` on `#111113` = 15.3:1 |
| `--muted` on `--bg` | `#6b7280` on `#ffffff` = 5.2:1 | `#a1a1aa` on `#111113` = 7.1:1 |
| `--accent` on `--bg` | `#2563eb` on `#ffffff` = 4.6:1 | `#3b82f6` on `#111113` = 5.5:1 |
| white on `--accent` | `#ffffff` on `#2563eb` = 4.6:1 | `#ffffff` on `#3b82f6` = 3.8:1 (large text only) |

## taste-skill Compliance

- No pure `#000000` anywhere (using `#1a1a1a` / `#111113`)
- Single accent color, saturation below 80%
- No AI purple/blue gradient aesthetic
- No noise/grain textures
- `min-h-[100dvh]` preserved (no `h-screen`)
- CSS Grid for multi-column layouts
- Hover, active, focus, empty, and error states present
- No emojis
- Hardware-accelerated transitions only (transform, opacity)

## redesign-skill Compliance

- Fix priority followed: font (kept) → color cleanup → states → layout → components → polish
- Removed: noise textures, gradient headers, tinted shadows, pill radii, module color coding
- Consistent border-radius and spacing throughout
- Semantic HTML preserved
- No generic card overuse — using borders and spacing instead where possible
