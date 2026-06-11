// Validate a site.json against the skill's bundled schema (references/site.schema.json).
// The agent runs this after drafting/editing site.json; non-zero exit = fix and retry.
// Usage: node ${HERMES_SKILL_DIR}/scripts/validate.mjs <site.json>
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = dirname(dirname(fileURLToPath(import.meta.url))) // scripts/ -> skill/
const schemaPath = resolve(skillDir, 'references/site.schema.json')

const target = process.argv[2]
if (!target) {
  console.error('usage: validate.mjs <site.json>')
  process.exit(2)
}
const targetPath = resolve(target)

let schema, data
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
} catch (e) {
  console.error(`❌ cannot read schema at ${schemaPath}: ${e.message}`)
  process.exit(2)
}
try {
  data = JSON.parse(readFileSync(targetPath, 'utf-8'))
} catch (e) {
  console.error(`❌ ${targetPath} is not valid JSON: ${e.message}`)
  process.exit(1)
}

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

if (validate(data)) {
  console.log(`✅ VALID — ${targetPath}`)
  console.log(`   sections: ${(data.sections || []).map((s) => s.type).join(' → ')}`)
  process.exit(0)
}

console.error(`❌ INVALID — ${targetPath}`)
for (const e of validate.errors) {
  console.error(
    `   ${e.instancePath || '(root)'} ${e.message}` +
      (e.params && Object.keys(e.params).length ? `  ${JSON.stringify(e.params)}` : '')
  )
}
process.exit(1)
