// Console configuration via environment. Copy .env.example → .env for local dev.
export const CONSOLE_PASSWORD = process.env.CONSOLE_PASSWORD || 'sitesmith'
// 64-hex-char (32-byte) key for encrypting stored credentials at rest. Empty in dev =
// credentials are stored obfuscated only (see lib/crypto.ts) — set a real key in prod.
export const ENC_KEY = process.env.ENC_KEY || ''
// Optional: a GLM key the console uses for generation when a project hasn't set its own.
export const GLM_API_KEY = process.env.GLM_API_KEY || ''
export const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.6'
export const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'
