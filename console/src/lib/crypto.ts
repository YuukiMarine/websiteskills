// Encrypt secrets (SSH keys, GLM keys) at rest.
// With a real ENC_KEY (64 hex chars = 32 bytes) → AES-256-GCM.
// Without one (dev) → reversible base64 obfuscation, clearly tagged. NEVER ship prod
// without ENC_KEY set.
import crypto from 'node:crypto'
import { ENC_KEY } from './env'

export function encrypt(plain: string): string {
  if (!plain) return ''
  if (ENC_KEY.length === 64) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), iv)
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return 'v1:' + Buffer.concat([iv, tag, enc]).toString('base64')
  }
  return 'b64:' + Buffer.from(plain, 'utf8').toString('base64')
}

export function decrypt(blob: string): string {
  if (!blob) return ''
  if (blob.startsWith('v1:')) {
    const raw = Buffer.from(blob.slice(3), 'base64')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const enc = raw.subarray(28)
    const d = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), iv)
    d.setAuthTag(tag)
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
  }
  if (blob.startsWith('b64:')) return Buffer.from(blob.slice(4), 'base64').toString('utf8')
  return blob
}
