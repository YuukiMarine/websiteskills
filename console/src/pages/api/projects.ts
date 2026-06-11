import type { APIRoute } from 'astro'
import { isAuthed } from '../../lib/auth'
import { createProject } from '../../lib/store'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!isAuthed(cookies)) return redirect('/login')
  const f = await request.formData()
  const project = await createProject({
    name: String(f.get('name') ?? '').trim() || 'Untitled site',
    domain: String(f.get('domain') ?? '').trim(),
    serverIp: String(f.get('serverIp') ?? '').trim(),
    sshUser: String(f.get('sshUser') ?? '').trim(),
    sshKey: String(f.get('sshKey') ?? ''),
    glmKey: String(f.get('glmKey') ?? '').trim(),
  })
  return redirect(`/build/${project.id}`)
}
