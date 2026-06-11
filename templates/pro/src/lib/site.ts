// Loads and types the site.json that drives this template.
// Source: $SITE_JSON (absolute path) or ./site.json relative to cwd.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── Shared value types ──────────────────────────────────────────────────────
export type LocalizedText = Record<string, string>
export type Background = 'default' | 'muted' | 'dark' | 'primary' | 'gradient'

export interface Media {
  type: 'image' | 'video' | 'placeholder' | 'unsplash'
  src?: string
  query?: string
  alt?: LocalizedText
  aspect?: 'square' | 'video' | 'portrait' | 'wide' | 'auto'
  credit?: string
}
export interface Cta {
  label: LocalizedText
  href: string
  style?: 'primary' | 'secondary' | 'ghost' | 'link'
  icon?: string
}
export interface Social {
  platform: string
  href: string
}
export interface NavLink {
  label: LocalizedText
  href: string
}

// ── Sections (discriminated union on `type`) ────────────────────────────────
interface SectionBase {
  id?: string
  eyebrow?: LocalizedText
  heading?: LocalizedText
  subheading?: LocalizedText
  background?: Background
  visible?: boolean
}
export interface HeroSection extends SectionBase {
  type: 'hero'
  variant?: 'split' | 'centered' | 'image-bg'
  heading: LocalizedText
  bullets?: LocalizedText[]
  primaryCta?: Cta
  secondaryCta?: Cta
  media?: Media
}
export interface LogosSection extends SectionBase {
  type: 'logos'
  logos: { name: string; media?: Media }[]
}
export interface FeaturesSection extends SectionBase {
  type: 'features'
  variant?: 'grid' | 'list' | 'alternating'
  columns?: 2 | 3 | 4
  items: { icon?: string; title: LocalizedText; body: LocalizedText; link?: Cta }[]
}
export interface ServicesSection extends SectionBase {
  type: 'services'
  items: {
    icon?: string
    title: LocalizedText
    body: LocalizedText
    price?: LocalizedText
    media?: Media
    cta?: Cta
  }[]
}
export interface AboutSection extends SectionBase {
  type: 'about'
  variant?: 'text-media' | 'media-text' | 'centered'
  body: LocalizedText
  media?: Media
}
export interface StatsSection extends SectionBase {
  type: 'stats'
  items: { value: string; suffix?: string; label: LocalizedText }[]
}
export interface GallerySection extends SectionBase {
  type: 'gallery'
  variant?: 'grid' | 'masonry' | 'carousel'
  items: { media: Media; caption?: LocalizedText }[]
}
export interface PricingSection extends SectionBase {
  type: 'pricing'
  plans: {
    name: LocalizedText
    price: LocalizedText
    period?: LocalizedText
    description?: LocalizedText
    features: LocalizedText[]
    cta: Cta
    featured?: boolean
  }[]
}
export interface TestimonialsSection extends SectionBase {
  type: 'testimonials'
  variant?: 'grid' | 'carousel' | 'single'
  items: { quote: LocalizedText; author: string; role?: LocalizedText; avatar?: Media; rating?: number }[]
}
export interface TeamSection extends SectionBase {
  type: 'team'
  members: { name: string; role: LocalizedText; bio?: LocalizedText; photo?: Media; socials?: Social[] }[]
}
export interface FaqSection extends SectionBase {
  type: 'faq'
  items: { q: LocalizedText; a: LocalizedText }[]
}
export interface CtaSection extends SectionBase {
  type: 'cta'
  heading: LocalizedText
  primaryCta: Cta
  secondaryCta?: Cta
}
export interface ContactSection extends SectionBase {
  type: 'contact'
  showForm?: boolean
  formFields?: ('name' | 'email' | 'phone' | 'company' | 'message' | 'subject')[]
  showDetails?: boolean
}

export type Section =
  | HeroSection
  | LogosSection
  | FeaturesSection
  | ServicesSection
  | AboutSection
  | StatsSection
  | GallerySection
  | PricingSection
  | TestimonialsSection
  | TeamSection
  | FaqSection
  | CtaSection
  | ContactSection

// ── Top-level objects ───────────────────────────────────────────────────────
export interface Theme {
  template: 'pro' | 'newchinese' | 'cyber' | 'portfolio'
  colorPreset?: string
  primary?: string
  accent?: string
  neutral?: string
  font?: { heading?: string; body?: string }
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  density?: 'compact' | 'comfortable' | 'spacious'
  mode?: 'light' | 'dark' | 'auto'
}
export interface Logo {
  type: 'text' | 'image'
  text?: string
  src?: string
  alt?: string
}
export interface Meta {
  siteName: string
  domain?: string
  description: LocalizedText
  keywords?: string[]
  languages: string[]
  defaultLanguage: string
  ogImage?: Media
  favicon?: string
}
export interface Brand {
  name: string
  logo: Logo
  tagline?: LocalizedText
}
export interface Nav {
  links?: NavLink[]
  cta?: Cta
  sticky?: boolean
  showLangToggle?: boolean
}
export interface Footer {
  tagline?: LocalizedText
  columns?: { title: LocalizedText; links: NavLink[] }[]
  socials?: Social[]
  copyright?: LocalizedText
}
export interface ContactInfo {
  email?: string
  phone?: string
  whatsapp?: string
  address?: LocalizedText
  mapEmbed?: string
  hours?: LocalizedText
}
export interface Site {
  meta: Meta
  theme: Theme
  brand: Brand
  nav?: Nav
  sections: Section[]
  footer?: Footer
  contact?: ContactInfo
  integrations?: Record<string, unknown>
}

// ── Load ─────────────────────────────────────────────────────────────────────
function resolveSitePath(): string {
  // 1) explicit override (how the deploy pipeline injects a customer's site)
  if (process.env.SITE_JSON) return resolve(process.env.SITE_JSON)
  // 2) a site.json placed in the project root
  const local = resolve(process.cwd(), 'site.json')
  if (existsSync(local)) return local
  // 3) dev fallback: the bundled InnoE reference build
  return resolve(process.cwd(), '../../recipe/examples/innoe.site.json')
}

export const site: Site = JSON.parse(readFileSync(resolveSitePath(), 'utf-8'))
export const LANGS = site.meta.languages
export const DEFAULT_LANG = site.meta.defaultLanguage
