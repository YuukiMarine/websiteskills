import type { APIRoute } from 'astro'
import { checkPassword, createSession, destroySession, COOKIE } from '../../lib/auth'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData()
  const action = form.get('action')

  if (action === 'logout') {
    destroySession(cookies.get(COOKIE)?.value)
    cookies.delete(COOKIE, { path: '/' })
    return redirect('/login')
  }

  const password = String(form.get('password') ?? '')
  if (!checkPassword(password)) return redirect('/login?error=1')

  const token = createSession()
  cookies.set(COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: false, // dev over http; set true behind HTTPS in prod
    maxAge: 60 * 60 * 12,
  })
  return redirect('/')
}
