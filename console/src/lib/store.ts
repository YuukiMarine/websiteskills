// Project store — JSON file at data/projects.json (gitignored). Secrets stored encrypted.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { encrypt, decrypt } from './crypto'

export type ProjectStatus = 'setup' | 'building' | 'ready' | 'deployed'

export interface Project {
  id: string
  name: string
  domain?: string
  serverIp?: string
  sshUser?: string
  template?: string
  status: ProjectStatus
  createdAt: number
  updatedAt: number
  siteJson?: unknown
  lastDeployAt?: number
  // secrets (encrypted at rest)
  glmKeyEnc?: string
  sshKeyEnc?: string
}

const DATA = path.join(process.cwd(), 'data', 'projects.json')

async function load(): Promise<Project[]> {
  try {
    return JSON.parse(await readFile(DATA, 'utf-8')) as Project[]
  } catch {
    return []
  }
}
async function persist(list: Project[]): Promise<void> {
  await mkdir(path.dirname(DATA), { recursive: true })
  await writeFile(DATA, JSON.stringify(list, null, 2), 'utf-8')
}

export async function listProjects(): Promise<Project[]> {
  return (await load()).sort((a, b) => b.createdAt - a.createdAt)
}
export async function getProject(id: string): Promise<Project | undefined> {
  return (await load()).find((p) => p.id === id)
}

export interface NewProjectInput {
  name: string
  domain?: string
  serverIp?: string
  sshUser?: string
  sshKey?: string
  glmKey?: string
}
export async function createProject(input: NewProjectInput): Promise<Project> {
  const list = await load()
  const now = Date.now()
  const p: Project = {
    id: crypto.randomBytes(6).toString('hex'),
    name: input.name || 'Untitled site',
    domain: input.domain || undefined,
    serverIp: input.serverIp || undefined,
    sshUser: input.sshUser || undefined,
    status: 'setup',
    createdAt: now,
    updatedAt: now,
    glmKeyEnc: encrypt(input.glmKey || ''),
    sshKeyEnc: encrypt(input.sshKey || ''),
  }
  list.push(p)
  await persist(list)
  return p
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | undefined> {
  const list = await load()
  const i = list.findIndex((p) => p.id === id)
  if (i < 0) return undefined
  list[i] = { ...list[i], ...patch, updatedAt: Date.now() }
  await persist(list)
  return list[i]
}

/** Decrypted GLM key for a project (server-side only). */
export function projectGlmKey(p: Project): string {
  return decrypt(p.glmKeyEnc || '')
}
export function projectSshKey(p: Project): string {
  return decrypt(p.sshKeyEnc || '')
}
