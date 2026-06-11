# Theme System

How `site.theme` becomes a live look. One `site.json` can be re-rendered under any
template that implements these tokens — theme is data, not code.

## Token flow

```
site.theme  ──►  CSS custom properties on :root  ──►  Tailwind v4 @theme + components
```

Every template MUST read the same token contract so a customer can switch templates
without editing content:

| theme field | becomes | notes |
|-------------|---------|-------|
| `template` | which package renders | pro / minimal / bold |
| `colorPreset` | a named palette → sets `--color-primary`, `--color-accent` | shipped per template |
| `primary` / `accent` | overrides the preset hex | wins over `colorPreset` |
| `neutral` | Tailwind neutral ramp (`--color-surface`, `--color-fg`, borders) | slate/gray/zinc/neutral/stone |
| `font.heading` / `font.body` | `--font-heading` / `--font-body` (loaded via Fontsource) | CJK → Noto Sans SC |
| `radius` | `--radius` scale (none→full) | applied to cards, buttons, inputs |
| `density` | `--space` scale + section padding | compact/comfortable/spacious |
| `mode` | light / dark / `auto` (prefers-color-scheme) | dark derives surfaces from neutral |

## Color rules

- A preset defines `primary`, `accent`, and a derived 50–950 ramp for each.
- If `primary` is given as hex, the renderer generates the ramp (e.g. via a
  perceptual lightness scale) and picks a readable `accent` if none supplied.
- Contrast is enforced at render: text-on-primary must hit WCAG AA. The renderer
  auto-flips to white/near-black text — the AI never specifies text colors.

## Built-in presets (shared by all templates)

| preset | primary | mood |
|--------|---------|------|
| `indigo` | indigo-600 | corporate, techy, trustworthy |
| `emerald` | emerald-600 | fresh, health, growth |
| `slate` | slate-700 | neutral, premium, understated |
| `sunset` | orange-500 | warm, energetic, consumer |
| `mono` | near-black | editorial, minimal, luxury |

## Templates (Phase 1+ deliverables)

- **pro** — the InnoE-derived template. Rich sections, gradients, float badges.
  Best default for service businesses.
- **minimal** — generous whitespace, restrained type, no gradients. Editorial/luxury.
- **bold** — large display type, high-contrast blocks, motion accents. Startups.

All three implement every section type in `site.schema.json`, so any `site.json`
renders under any template. Differences are purely visual.

## What the AI sets vs what the template owns

- **AI sets:** template, colorPreset OR primary/accent, neutral, fonts, radius,
  density, mode. That's it.
- **Template owns:** spacing math, shadows, component shapes, animation, exact ramps,
  responsive behavior, accessibility. The AI must never emit raw CSS or class names.

## Two ways to theme

1. **Styled template** — when the brand has a strong, obvious aesthetic, pick
   `newchinese` / `cyber` / `portfolio`. Each ships a complete look (palette, fonts,
   motion); set `template` and leave colors/fonts unset to use the template's identity.

2. **AI-driven bespoke theme — the default.** For everything else, set `template:"pro"`
   (a neutral, variable-driven base) and *design the palette yourself* from the business:
   `primary` (+ optional `accent`), `neutral`, `font`, `radius`, `density`. Still a plain,
   standard `site.json` — no code — but a one-of-a-kind result, not a canned skin.

### Designing a bespoke palette (method)

| Business feeling | primary | neutral | font.heading | radius | density |
|---|---|---|---|---|---|
| corporate / finance / trust | deep blue or indigo | slate | Inter / Sora | md | comfortable |
| health / eco / fresh | green or teal | stone | Manrope | lg | comfortable |
| food / hospitality / warm | orange / amber / terracotta | stone | Manrope / Sora | lg | comfortable |
| luxury / premium / minimal | near-black or one deep tone | zinc | Sora / Space Grotesk | sm | spacious |
| creative / kids / playful | coral / pink / violet | neutral | Plus Jakarta Sans | full | comfortable |
| tech / SaaS / startup | electric blue or violet | zinc | Space Grotesk | lg | spacious |

Method: choose ONE `primary` that carries the mood; let the renderer derive `accent`, or
set a complementary/analogous hue. Match neutral warmth to the primary (warm → stone,
cool → slate/zinc). Pick a heading font whose character fits (geometric = modern,
humanist = friendly). `spacious` reads premium, `compact` reads utilitarian. Pick a real
brand color — WCAG-AA contrast is enforced by the renderer, so text can't become unreadable.
