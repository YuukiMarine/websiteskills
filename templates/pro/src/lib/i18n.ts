// Helpers for bilingual rendering.
//
// Two strategies:
//  1) Visible DOM text → use the <T> component, which renders ALL languages and
//     lets CSS show the active one (so the language toggle is instant, no reload).
//  2) Non-DOM text (<title>, alt="", aria-label, meta) → use `pick()` to resolve a
//     single string at build time in the default language.
import { DEFAULT_LANG } from './site'
import type { LocalizedText } from './site'

/** Resolve a LocalizedText to one string: requested lang → default → first available. */
export function pick(t: LocalizedText | undefined, lang: string = DEFAULT_LANG): string {
  if (!t) return ''
  return t[lang] ?? t[DEFAULT_LANG] ?? Object.values(t)[0] ?? ''
}

/** CSS class for a language span used by <T> (see global.css bilingual rules). */
export function langClass(lang: string): string {
  return lang === 'en' || lang === 'zh' ? `i18n-${lang}` : 'i18n-other'
}

/** True if the text actually carries more than one language. */
export function isMultilingual(t: LocalizedText | undefined): boolean {
  return !!t && Object.keys(t).length > 1
}
