// Validate a site.json against recipe/site.schema.json (JSON Schema draft 2020-12).
// Usage: node scripts/validate.mjs [path/to/site.json]
//        defaults to recipe/examples/innoe.site.json
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const schemaPath = new URL('recipe/site.schema.json', root)
const target = process.argv[2]
  ? new URL(process.argv[2], `file://${process.cwd()}/`)
  : new URL('recipe/examples/innoe.site.json', root)

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
const data = JSON.parse(readFileSync(target, 'utf-8'))

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)

const validate = ajv.compile(schema)
const ok = validate(data)

const file = fileURLToPath(target)
if (ok) {
  console.log(`✅ VALID — ${file} conforms to site.schema.json`)
  console.log(`   sections: ${data.sections.map((s) => s.type).join(' → ')}`)
} else {
  console.error(`❌ INVALID — ${file}`)
  for (const e of validate.errors) {
    console.error(`   ${e.instancePath || '(root)'} ${e.message}` +
      (e.params && Object.keys(e.params).length ? `  ${JSON.stringify(e.params)}` : ''))
  }
  process.exit(1)
}
