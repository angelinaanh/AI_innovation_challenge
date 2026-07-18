# EduOne Design Style — "Playful STEAM"

Reference doc for how EduOne looks and feels. Originated from a Claude Design bundle
(`Curriculum Progress.dc.html`) built for the redesigned "Lộ trình học" (Learning Path)
page, then adopted as the app-wide visual language. Use this doc when designing or
implementing any new screen so new work stays consistent with existing screens.

Implementation lives in `frontend/src/styles/index.css` (shared tokens/classes) and
`frontend/src/features/learning-path/LearningPathPage.jsx` (the fullest example of every
pattern below).

## Principles

- **Playful but legible.** The audience is K-12 students. Rounder shapes, soft shadows,
  warm neutrals, and a gradient accent read as friendly without becoming childish or
  hurting readability.
- **Soft elevation, not hard drop-shadow.** Cards float with a diffuse blurred shadow
  (`0 3px 14px rgba(15,23,42,0.06)`), not a hard offset "3D button" shadow.
- **One accent gradient, five fixed STEAM colors.** Everything else (buttons, tabs,
  progress bars) pulls from the brand gradient or from Tailwind's stock neutrals — don't
  invent new one-off colors.

## Typography

| Role | Font | Weights | Where |
|---|---|---|---|
| Display / headings | `Baloo 2` | 700 (bold), 800 (extrabold) | Page titles, section titles, subject/chapter names — apply via the `.font-display` class or the existing `.section-title` class. |
| Body | `Nunito` | 400, 600, 700, 800, 900 | Everything else — this is the `:root` default, no class needed. |

Both are loaded via Google Fonts in `frontend/index.html`. CSS variables:
`--font-display` and `--font-body` (defined in `index.css`, `:root`).

## Color

### Neutral / background
- Page background: `--color-bg: #fbf9f5` (warm off-white, not cool gray).
- Card surfaces: white, `border: 1px solid #f1ede4` (warm hairline, not `#e2e8f0`).
- Muted text: Tailwind `slate-500`/`slate-400` as before — these didn't need to change.

### Brand gradient
`--gradient-brand: linear-gradient(90deg, #ff9a3c, #ff5c8a)` (orange → pink). Use for:
primary CTAs (`.primary-button`), the active grade-band tab (`.tab-pill-active`), and
progress-bar fills (`.overall-progress-fill`). This is the **one** accent gradient in the
app — don't create a second one for a different feature area.

### STEAM axis colors (canonical — do not deviate)
These are Tailwind's stock 500-family hues and are treated as fixed identity colors for
the five STEAM letters, wherever they appear (badges, progress rings, chapter nodes):

| Axis | Meaning | Solid (ring/icon) | Chip background | Chip text |
|---|---|---|---|---|
| S | Khoa học (Science) | `#22c55e` (green-500) | `#dcfce7` (green-100) | `#15803d` (green-700) |
| T | Công nghệ (Technology) | `#3b82f6` (blue-500) | `#dbeafe` (blue-100) | `#1d4ed8` (blue-700) |
| E | Kỹ thuật (Engineering) | `#f97316` (orange-500) | `#ffedd5` (orange-100) | `#c2410c` (orange-700) |
| A | Nghệ thuật (Arts) | `#a855f7` (purple-500) | `#f3e8ff` (purple-100) | `#7e22ce` (purple-700) |
| M | Toán học (Math) | `#ef4444` (red-500) | `#fee2e2` (red-100) | `#b91c1c` (red-700) |

Defined as `STEAM_META` in `LearningPathPage.jsx`. If a second screen needs STEAM colors,
lift this constant out to a shared module rather than redefining it.

### Everything else
General UI semantics (success, streak/warm, info, danger) keep using Tailwind's stock
`emerald` / `amber` / `sky` / `rose` / `violet` families exactly as before — those are
*not* part of the STEAM identity and didn't change.

## Shape & elevation

| Token | Value | Used for |
|---|---|---|
| Radius — pill | `999px` | Tabs, chips, badges, buttons that are fully round |
| Radius — card | `20–24px` | `.surface`, `.subject-card`, `.practical-card` |
| Radius — control | `12–14px` | Buttons, inputs, nav items, icon buttons |
| Shadow — resting | `0 3px 14px rgba(15,23,42,0.06–0.08)` | Cards at rest |
| Shadow — hover/lift | `0 10–14px 26–34px rgba(15,23,42,0.10–0.14)` | Card hover (translateY(-4→-6px)) |
| Shadow — colored glow | `0 4–6px 12–16px rgba({accent},0.3–0.4)` | Primary buttons, active tab, badges |

Older screens (quiz/exercise cards in the lesson player, the tutor drawer) still use the
original tighter 8px radius and flat `0 Npx 0 color` "chunky" shadow — that's an
intentionally separate, not-yet-migrated area; don't mix the two shadow styles on the same
screen.

## Motion

Defined once in `index.css`, reused everywhere:

```css
@keyframes bounceIn { 0%{transform:scale(1)} 30%{transform:scale(1.18)} 55%{transform:scale(0.92)} 75%{transform:scale(1.06)} 100%{transform:scale(1)} }
@keyframes marchAnts { to { background-position: 40px 0, 40px 40px, 0 40px, 0 0; } }
@keyframes bobDot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes popIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
```

- `bounceIn` (`.tab-pill-bounce`) — brief tactile feedback when a tab is clicked.
- `popIn` — entrance animation for a view/panel that just mounted (grid view, detail view).
- `bobDot` (`.lesson-pill-icon-bob`) — the "in progress / current" lesson's icon gently
  bobs to draw the eye without being distracting.
- `marchAnts` (used inside `.practical-card`) — animated dashed border, signals "optional /
  not yet required" the same way a dashed outline does in design tools.

All of this is already covered by the app's global
`@media (prefers-reduced-motion: reduce)` block, which zeroes animation/transition
durations — no per-component reduced-motion handling needed.

## Component patterns

### STEAM tag / badge
```jsx
<span className="steam-badge" style={{ background: meta.bg, color: meta.text }}>
  {axis}
</span>
```
`meta` comes from `STEAM_META[axis]`. Add `withLabel` text (`{axis} · {meta.label}`) in
detail/header contexts; keep it to the bare letter in dense contexts like grid cards.

### Circular SVG progress ring
Two concentric `<circle>`s (track + progress), rotated -90° so the arc starts at 12
o'clock, animated via `stroke-dashoffset`:

```
r = (size - strokeWidth) / 2
circumference = 2 * π * r
dashoffset = circumference * (1 - pct / 100)
```
See `ProgressRing` in `LearningPathPage.jsx` for the full implementation (60px for grid
cards, 80px for a subject detail header).

### Gradient tab pills
A pill-shaped row (`.tab-pill-row`) of buttons (`.tab-pill`); the active one gets
`.tab-pill-active` (brand gradient fill + white text) and, on click, a one-shot
`.tab-pill-bounce`.

### Dashed "optional" card
`.practical-card` — a card whose *border* (not the whole card) is an animated dashed
rectangle (`marchAnts`), signaling "optional, doesn't block progress." Use this pattern
specifically for optional/supplementary content, not for required steps.

## Accessibility

- Keep `button:focus-visible, a:focus-visible { outline: 3px solid #38bdf8; }` (global,
  already defined) — don't suppress focus rings on new interactive elements.
- STEAM chip text colors (the `*-700` shades) were chosen to keep readable contrast on
  their `*-100` backgrounds — don't swap in the raw `-500` "solid" shade as chip text.
- Respect `prefers-reduced-motion` (already global) rather than adding new
  animation-critical UI (i.e., don't rely on `bobDot`/`marchAnts` alone to convey state —
  they're a reinforcement of a status already shown via color/icon/text).
