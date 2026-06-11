// Session auth: constant-time password check + in-memory token store + SameSite cookie.
// Mirrors the InnoE admin-auth pattern. Single operator for the MVP.
import crypto from 'node:crypto'
import { CONSOLE_PASSWORD } from './env'

const TTL_MS = 1000 * 60 * 60 * 12 // 12h
const sessions = new Map<string, number>() // token -> created-at

export const COOKIE = 'ss_console'

export function checkPassword(pw: string): boolean {
  const a = Buffer.from(String(pw ?? ''))
  const b = Buffer.from(CONSOLE_PASSWORD)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, Date.now())
  return token
}

export function validSession(token?: string | null): boolean {
  if (!token) return false
  const created = sessions.get(token)
  if (!created) return false
  if (Date.now() - created > TTL_MS) {
    sessions.delete(token)
    return false
  }
  return true
}

export function destroySession(token?: string | null): void {
  if (token) sessions.delete(token)
}

/** Astro helper: returns true if the request carries a valid session cookie. */
export function isAuthed(cookies: { get(name: string): { value: string } | undefined }): boolean {
  return validSession(cookies.get(COOKIE)?.value)
}
