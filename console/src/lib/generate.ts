// GLM site generation for the console — drives the same recipe/ the Hermes skill uses.
// Loads recipe context once, calls the project's GLM key, validates + repairs against
// the schema. Agent-agnostic: any OpenAI-compatible endpoint works.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { GLM_BASE_URL, GLM_MODEL } from './env'

const RECIPE_DIR = resolve(process.cwd(), '..', 'recipe')
const rf = (p: string) => readFileSync(resolve(RECIPE_DIR, p), 'utf-8')

const SCHEMA = JSON.parse(rf('site.schema.json'))
const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(SCHEMA)

const SYSTEM = [
  rf('RECIPE.md'),
  '\n\n# JSON Schema (output MUST validate)\n```json\n' + JSON.stringify(SCHEMA) + '\n```',
  '\n\n# Section catalogue\n' + rf('sections/README.md'),
  '\n\n# Theme system\n' + rf('theme.md'),
  '\n\n# Asset strategy\n' + rf('assets.md'),
  '\n\n# Reference example\n```json\n' + rf('examples/innoe.site.json') + '\n```',
  '\n\nReturn ONLY one JSON object that validates against the schema.',
].join('')

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
export interface GenResult {
  ok: boolean
  site?: unknown
  error?: string
}

export async function generateSite(opts: {
  apiKey: string
  model?: string
  brief: string
  current?: unknown
}): Promise<GenResult> {
  if (!opts.apiKey) return { ok: false, error: 'No GLM API key set for this project.' }
  const messages: Msg[] = [{ role: 'system', content: SYSTEM }]
  if (opts.current) {
    messages.push({ role: 'user', content: 'Current site.json:\n```json\n' + JSON.stringify(opts.current) + '\n```' })
  }
  messages.push({ role: 'user', content: opts.brief + '\n\nProduce the complete site.json now.' })

  for (let attempt = 1; attempt <= 4; attempt++) {
    let content: string
    try {
      content = await callGLM(opts.apiKey, opts.model || GLM_MODEL, messages)
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
    let data: unknown
    try {
      data = extractJSON(content)
    } catch {
      messages.push({ role: 'assistant', content })
      messages.push({ role: 'user', content: 'That was not valid JSON. Return ONLY one JSON object.' })
      continue
    }
    if (validate(data)) return { ok: true, site: data }
    const errs = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '(root)'} ${e.message}`)
      .join('\n')
    messages.push({ role: 'assistant', content })
    messages.push({ role: 'user', content: 'Schema errors:\n' + errs + '\n\nReturn the COMPLETE corrected JSON.' })
  }
  return { ok: false, error: 'Could not produce a valid site after retries.' }
}

async function callGLM(key: string, model: string, messages: Msg[]): Promise<string> {
  const res = await fetch(`${GLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 8000 }),
  })
  if (!res.ok) throw new Error(`GLM ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return j.choices?.[0]?.message?.content ?? ''
}

function extractJSON(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  let c = fence ? fence[1] : text
  const a = c.indexOf('{')
  const b = c.lastIndexOf('}')
  if (a >= 0 && b > a) c = c.slice(a, b + 1)
  return JSON.parse(c)
}
