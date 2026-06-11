import type { APIRoute } from 'astro'
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { isAuthed } from '../../lib/auth'
import { getProject } from '../../lib/store'

const TEMPLATES = resolve(process.cwd(), '..', 'templates', 'pro')
const PREVIEWS = resolve(process.cwd(), 'public', 'previews')

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return json({ ok: false, error: 'unauthorized' }, 401)
  const { projectId } = (await request.json().catch(() => ({}))) as { projectId?: string }
  if (!projectId) return json({ ok: false, error: 'projectId required' }, 400)
  const project = await getProject(projectId)
  if (!project?.siteJson) return json({ ok: false, error: 'no site to preview yet' }, 400)

  const base = `/previews/${projectId}/`
  mkdirSync(PREVIEWS, { recursive: true })
  const tmpSite = resolve(PREVIEWS, `${projectId}.site.json`)
  writeFileSync(tmpSite, JSON.stringify(project.siteJson))

  try {
    execFileSync('npm', ['run', 'build'], {
      cwd: TEMPLATES,
      env: { ...process.env, SITE_JSON: tmpSite, SITE_BASE: base },
      stdio: 'ignore',
    })
  } catch (e) {
    return json({ ok: false, error: 'render failed: ' + (e as Error).message }, 500)
  }

  const dest = resolve(PREVIEWS, projectId)
  rmSync(dest, { recursive: true, force: true })
  cpSync(resolve(TEMPLATES, 'dist'), dest, { recursive: true })
  return json({ ok: true, url: `${base}index.html` })
}
