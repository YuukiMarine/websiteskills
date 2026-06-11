// Assemble the distributable Hermes skill from canonical sources.
//   recipe/*         -> skill/references/    (single source of truth for the spec)
//   templates/pro/*  -> skill/templates/pro  (so the skill is self-contained on the box)
// Then validate the bundled example against the bundled schema.
// Run:  node scripts/build-skill.mjs   (requires `npm install` inside skill/ first)
import { cpSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const recipe = resolve(root, 'recipe')
const skill = resolve(root, 'skill')
const refs = resolve(skill, 'references')

console.log('• assembling references/ from recipe/')
rmSync(refs, { recursive: true, force: true })
mkdirSync(resolve(refs, 'examples'), { recursive: true })
copyFileSync(resolve(recipe, 'site.schema.json'), resolve(refs, 'site.schema.json'))
copyFileSync(resolve(recipe, 'sections/README.md'), resolve(refs, 'sections.md'))
copyFileSync(resolve(recipe, 'theme.md'), resolve(refs, 'theme.md'))
copyFileSync(resolve(recipe, 'assets.md'), resolve(refs, 'assets.md'))
cpSync(resolve(recipe, 'examples'), resolve(refs, 'examples'), { recursive: true })

console.log('• copying templates/pro → skill/templates/pro')
const tpl = resolve(skill, 'templates/pro')
rmSync(tpl, { recursive: true, force: true })
mkdirSync(dirname(tpl), { recursive: true })
cpSync(resolve(root, 'templates/pro'), tpl, {
  recursive: true,
  filter: (src) => !/[/\\](node_modules|dist|\.astro|\.claude)([/\\]|$)/.test(src),
})

console.log('• validating bundled example against bundled schema')
execFileSync('node', [resolve(skill, 'scripts/validate.mjs'), resolve(refs, 'examples/innoe.site.json')], {
  stdio: 'inherit',
})

console.log(`✅ skill assembled at ${skill}`)
console.log('   → copy this directory to ~/.hermes/skills/sitesmith/ on the customer box')
