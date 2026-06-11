// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import node from '@astrojs/node'

// The Sitesmith console — a multi-tenant SSR web app that wraps the build/deploy flow.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: true },
  },
  integrations: [icon()],
})
