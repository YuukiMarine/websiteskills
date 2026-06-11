#!/usr/bin/env node
// generate.mjs — thin GLM client: a business brief → a validated site.json.
//
// This is the agent-agnostic fallback for Phase 2: it drives the SAME recipe the Hermes
// skill uses, but needs no Hermes and no server — just a GLM key. Use it to verify the
// core product risk (AI generation quality) at the lowest possible cost.
//
// Usage:
//   GLM_API_KEY=xxx node scripts/generate.mjs "a cozy bakery in SG, wants walk-ins" --lang en,zh
//   GLM_API_KEY=xxx node scripts/generate.mjs --interactive
//   node scripts/generate.mjs --dry-run "..."          # assemble + validate pipeline, no API call
//
// Env: GLM_API_KEY (required unless --dry-run), GLM_MODEL (default glm-4.6),
//      GLM_BASE_URL (default Zhipu /v4), GLM_MAX_REPAIRS (default 3)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const recipe = resolve(root, 'recipe')

// ── config ──────────────────────────────────────────────────────────────────
const API_KEY = process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY
const MODEL = process.env.GLM_MODEL || 'glm-4.6'
const BASE_URL = (process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4').replace(/\/$/, '')
const MAX_REPAIRS = Number(process.env.GLM_MAX_REPAIRS || 3)

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let brief = ''
let outPath = resolve(root, 'out/site.json')
let langs = ''
let interactive = false
let dryRun = false
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '-o' || a === '--out') outPath = resolve(args[++i])
  else if (a === '--lang') langs = args[++i]
  else if (a === '--interactive' || a === '-i') interactive = true
  else if (a === '--dry-run') dryRun = true
  else brief += (brief ? ' ' : '') + a
}

if (!API_KEY && !dryRun) {
  console.error('❌ set GLM_API_KEY (get one at https://z.ai). Or use --dry-run.')
  process.exit(2)
}

// ── recipe context (same files the Hermes skill bundles) ─────────────────────
const RECIPE = readFileSync(resolve(recipe, 'RECIPE.md'), 'utf-8')
const SCHEMA_TEXT = readFileSync(resolve(recipe, 'site.schema.json'), 'utf-8')
const SECTIONS = readFileSync(resolve(recipe, 'sections/README.md'), 'utf-8')
const THEME = readFileSync(resolve(recipe, 'theme.md'), 'utf-8')
const ASSETS = readFileSync(resolve(recipe, 'assets.md'), 'utf-8')
const EXAMPLE = readFileSync(resolve(recipe, 'examples/innoe.site.json'), 'utf-8')
const schema = JSON.parse(SCHEMA_TEXT)

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

const systemPrompt = [
  RECIPE,
  '\n\n---\n# JSON Schema (authoritative — your output MUST validate against this)\n',
  '```json\n' + SCHEMA_TEXT + '\n```',
  '\n\n---\n# Section catalogue\n',
  SECTIONS,
  '\n\n---\n# Theme system\n',
  THEME,
  '\n\n---\n# Asset strategy\n',
  ASSETS,
  '\n\n---\n# Reference example (study its SHAPE; do NOT copy its content)\n',
  '```json\n' + EXAMPLE + '\n```',
  '\n\n---\n# Output contract\nReturn ONLY one JSON object that validates against the schema — a single ```json fenced block, no prose.',
].join('')

function buildUserMsg(b, l) {
  let m = `Business brief:\n${b}\n`
  if (l) m += `\nLanguages: ${l} (provide every LocalizedText in ALL of these).`
  m += `\nProduce the complete site.json now.`
  return m
}

// ── GLM (OpenAI-compatible) ──────────────────────────────────────────────────
async function callGLM(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 8000 }),
  })
  if (!res.ok) throw new Error(`GLM ${res.status}: ${(await res.text()).slice(0, 400)}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

function extractJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  let c = fence ? fence[1] : text
  const first = c.indexOf('{')
  const last = c.lastIndexOf('}')
  if (first >= 0 && last > first) c = c.slice(first, last + 1)
  return JSON.parse(c)
}

async function generate(b, l) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildUserMsg(b, l) },
  ]
  for (let attempt = 1; attempt <= MAX_REPAIRS + 1; attempt++) {
    process.stdout.write(`• GLM attempt ${attempt}/${MAX_REPAIRS + 1} (${MODEL})… `)
    const content = await callGLM(messages)
    let data
    try {
      data = extractJSON(content)
    } catch (e) {
      console.log('✗ not JSON')
      messages.push({ role: 'assistant', content })
      messages.push({ role: 'user', content: `That was not valid JSON (${e.message}). Return ONLY one valid JSON object.` })
      continue
    }
    if (validate(data)) {
      console.log('✅ valid')
      return data
    }
    const errs = validate.errors
      .map((e) => `${e.instancePath || '(root)'} ${e.message} ${JSON.stringify(e.params || {})}`)
      .join('\n')
    console.log(`✗ ${validate.errors.length} schema error(s)`)
    messages.push({ role: 'assistant', content })
    messages.push({
      role: 'user',
      content: `Your JSON failed schema validation:\n${errs}\n\nFix ALL of these and return the COMPLETE corrected JSON object only.`,
    })
  }
  throw new Error(`could not produce valid site.json after ${MAX_REPAIRS + 1} attempts`)
}

async function gatherBrief() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  console.log('Describe the business (name, what they do, goal, languages). Empty line to finish.')
  const lines = []
  for (;;) {
    const l = await rl.question('> ')
    if (!l.trim()) break
    lines.push(l)
  }
  rl.close()
  return lines.join(' ')
}

// ── main ─────────────────────────────────────────────────────────────────────
if (dryRun) {
  console.log('— dry run (no API call) —')
  console.log(`  recipe files loaded: RECIPE.md, schema, sections, theme, assets, example`)
  console.log(`  schema compiled OK (ajv)`)
  console.log(`  system prompt: ${systemPrompt.length.toLocaleString()} chars (~${Math.round(systemPrompt.length / 4).toLocaleString()} tokens)`)
  console.log(`  model: ${MODEL}   endpoint: ${BASE_URL}/chat/completions`)
  console.log(`  brief: ${brief ? JSON.stringify(brief.slice(0, 80)) : '(none — pass one or --interactive)'}`)
  console.log(`  languages: ${langs || '(model decides; default to brief language)'}`)
  console.log('✅ pipeline ready — set GLM_API_KEY and drop --dry-run to generate.')
  process.exit(0)
}

const finalBrief = brief || (interactive ? await gatherBrief() : '')
if (!finalBrief) {
  console.error('❌ provide a brief: node scripts/generate.mjs "..."  (or --interactive)')
  process.exit(2)
}

try {
  const site = await generate(finalBrief, langs)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(site, null, 2) + '\n', 'utf-8')
  console.log(`\n✅ wrote ${outPath}`)
  console.log(`   sections: ${site.sections.map((s) => s.type).join(' → ')}`)
  console.log(`   languages: ${site.meta.languages.join(', ')}`)
  console.log(`\nRender it →`)
  console.log(`   SITESMITH_TEMPLATE_DIR=templates/pro node skill/scripts/render.mjs ${outPath} out`)
} catch (e) {
  console.error(`\n❌ ${e.message}`)
  process.exit(1)
}
