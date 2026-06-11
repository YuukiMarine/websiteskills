// Turns site.theme into an inline CSS-variable string injected on <html>.
// IMPORTANT: only fields the user *explicitly* set are emitted. Anything omitted is
// left to the template's CSS (global.css for `pro`, or styles/<template>.css scoped by
// [data-template]) — that's what lets each template ship its own palette/fonts/shape
// while still letting a user override per-site.
import type { Theme } from './site'

const PRESETS: Record<string, { primary: string; accent: string }> = {
  indigo: { primary: '#4f46e5', accent: '#06b6d4' },
  emerald: { primary: '#059669', accent: '#f59e0b' },
  slate: { primary: '#334155', accent: '#0ea5e9' },
  sunset: { primary: '#f97316', accent: '#e11d48' },
  mono: { primary: '#111827', accent: '#6b7280' },
}

const NEUTRALS: Record<string, { ink: string; mutedInk: string; surfaceMuted: string; border: string; dark: string }> = {
  slate: { ink: '#0f172a', mutedInk: '#475569', surfaceMuted: '#f8fafc', border: '#e2e8f0', dark: '#0f172a' },
  gray: { ink: '#111827', mutedInk: '#4b5563', surfaceMuted: '#f9fafb', border: '#e5e7eb', dark: '#111827' },
  zinc: { ink: '#18181b', mutedInk: '#52525b', surfaceMuted: '#fafafa', border: '#e4e4e7', dark: '#18181b' },
  neutral: { ink: '#171717', mutedInk: '#525252', surfaceMuted: '#fafafa', border: '#e5e5e5', dark: '#171717' },
  stone: { ink: '#1c1917', mutedInk: '#57534e', surfaceMuted: '#fafaf9', border: '#e7e5e4', dark: '#1c1917' },
}

const FONTS: Record<string, string> = {
  Inter: "'Inter Variable'",
  Sora: "'Sora Variable'",
  Manrope: "'Manrope Variable'",
  'Plus Jakarta Sans': "'Plus Jakarta Sans Variable'",
  'Space Grotesk': "'Space Grotesk Variable'",
  Orbitron: "'Orbitron Variable'",
  Lora: "'Lora Variable'",
  'IBM Plex Sans': "'IBM Plex Sans'",
  'Source Sans 3': "'Source Sans 3 Variable'",
  'Noto Sans SC': "'Noto Sans SC'",
}
const FONT_FALLBACK_BODY = "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"
const FONT_FALLBACK_HEADING = "'Inter Variable', system-ui, sans-serif"

const RADII: Record<string, string> = { none: '0px', sm: '8px', md: '12px', lg: '16px', full: '24px' }
const DENSITY: Record<string, [string, string]> = {
  compact: ['3.5rem', '5rem'],
  comfortable: ['5rem', '7rem'],
  spacious: ['6rem', '9rem'],
}

/** Darken a #rrggbb hex by `amount` (0–1) toward black. */
function darken(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = Math.round(((n >> 16) & 255) * (1 - amount))
  const g = Math.round(((n >> 8) & 255) * (1 - amount))
  const b = Math.round((n & 255) * (1 - amount))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Light tint of a color toward white (for primary-light surfaces). */
function tint(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function themeVars(theme: Theme): string {
  const vars: Record<string, string> = {}

  // Colors — only when the user opts in (primary or colorPreset). Otherwise the
  // template's own palette (CSS) wins.
  if (theme.primary || theme.colorPreset) {
    const preset = PRESETS[theme.colorPreset ?? ''] ?? PRESETS.indigo
    const primary = theme.primary ?? preset.primary
    const accent = theme.accent ?? preset.accent
    vars['--color-primary'] = primary
    vars['--color-primary-hover'] = darken(primary, 0.1)
    vars['--color-primary-active'] = darken(primary, 0.2)
    vars['--color-primary-light'] = tint(primary, 0.92)
    vars['--color-accent'] = accent
  }

  if (theme.neutral) {
    const n = NEUTRALS[theme.neutral] ?? NEUTRALS.slate
    vars['--color-ink'] = n.ink
    vars['--color-muted-ink'] = n.mutedInk
    vars['--color-surface-muted'] = n.surfaceMuted
    vars['--color-border'] = n.border
    vars['--color-dark'] = n.dark
  }

  if (theme.font?.heading) {
    vars['--font-heading'] = `${FONTS[theme.font.heading] ?? "'Sora Variable'"}, ${FONT_FALLBACK_HEADING}`
  }
  if (theme.font?.body) {
    vars['--font-body'] = `${FONTS[theme.font.body] ?? "'Inter Variable'"}, ${FONT_FALLBACK_BODY}`
  }
  if (theme.radius) vars['--radius'] = RADII[theme.radius] ?? RADII.lg
  if (theme.density) {
    const [py, pyLg] = DENSITY[theme.density] ?? DENSITY.comfortable
    vars['--section-py'] = py
    vars['--section-py-lg'] = pyLg
  }

  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}
