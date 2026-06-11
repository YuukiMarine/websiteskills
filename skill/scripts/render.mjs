// Render a site.json into a static site using the bundled pro template.
// Usage: node ${HERMES_SKILL_DIR}/scripts/render.mjs <site.json> <out-dir>
// The template dir defaults to ${skill}/templates/pro; override with
// SITESMITH_TEMPLATE_DIR (useful in dev to point at an already-installed template).
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, cpSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , siteArg, outArg] = process.argv
if (!siteArg || !outArg) {
  console.error('usage: render.mjs <site.json> <out-dir>')
  process.exit(2)
}

const skillDir = dirname(dirname(fileURLToPath(import.meta.url))) // scripts/ -> skill/
const sitePath = resolve(siteArg)
const outDir = resolve(outArg)
const templateDir = process.env.SITESMITH_TEMPLATE_DIR
  ? resolve(process.env.SITESMITH_TEMPLATE_DIR)
  : resolve(skillDir, 'templates/pro')

if (!existsSync(sitePath)) {
  console.error(`❌ site.json not found: ${sitePath}`)
  process.exit(1)
}
if (!existsSync(resolve(templateDir, 'package.json'))) {
  console.error(`❌ template not found at ${templateDir} (set SITESMITH_TEMPLATE_DIR)`)
  process.exit(1)
}

// Ensure template deps are present (first run on a fresh box).
if (!existsSync(resolve(templateDir, 'node_modules'))) {
  console.log('• installing template dependencies (first run)…')
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: templateDir, stdio: 'inherit' })
}

// Optionally swap unsplash placeholders for real photos (no-op without a key).
let siteForBuild = sitePath
const resolver = resolve(skillDir, 'scripts/resolve-media.mjs')
if (process.env.UNSPLASH_ACCESS_KEY && existsSync(resolver)) {
  mkdirSync(outDir, { recursive: true })
  const resolvedSite = resolve(outDir, 'site.resolved.json')
  execFileSync('node', [resolver, sitePath, resolvedSite], { stdio: 'inherit' })
  siteForBuild = resolvedSite
}

console.log(`• building with template ${templateDir}…`)
execFileSync('npm', ['run', 'build'], {
  cwd: templateDir,
  stdio: 'inherit',
  env: { ...process.env, SITE_JSON: siteForBuild },
})

const builtDist = resolve(templateDir, 'dist')
const targetDist = resolve(outDir, 'dist')
rmSync(targetDist, { recursive: true, force: true })
cpSync(builtDist, targetDist, { recursive: true })

console.log(`✅ rendered → ${targetDist}`)
