import type { APIRoute } from 'astro'
import { isAuthed } from '../../lib/auth'
import { getProject, updateProject, projectGlmKey } from '../../lib/store'
import { generateSite } from '../../lib/generate'
import { GLM_API_KEY } from '../../lib/env'

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return json({ ok: false, error: 'unauthorized' }, 401)
  const body = (await request.json().catch(() => ({}))) as { projectId?: string; brief?: string }
  if (!body.projectId || !body.brief) return json({ ok: false, error: 'projectId and brief required' }, 400)
  const project = await getProject(body.projectId)
  if (!project) return json({ ok: false, error: 'project not found' }, 404)

  const apiKey = projectGlmKey(project) || GLM_API_KEY
  const result = await generateSite({ apiKey, brief: body.brief, current: project.siteJson })
  if (result.ok && result.site) {
    const tpl = (result.site as { theme?: { template?: string } })?.theme?.template
    await updateProject(body.projectId, { siteJson: result.site, status: 'ready', template: tpl })
  }
  return json(result)
}
