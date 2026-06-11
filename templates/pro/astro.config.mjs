// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'

// template-pro renders a Sitesmith `site.json` into a static marketing site.
// The site definition is loaded at build time from $SITE_JSON (see src/lib/site.ts);
// `site:` is injected per-build from the customer's domain via $SITE_URL.
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  // SITE_BASE lets the console serve a preview build under /previews/<id>/.
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: true },
  },
  integrations: [icon()],
})
