#!/usr/bin/env node
// resolve-media.mjs — turn `type:"unsplash"` media into real photos via the Unsplash API.
// Walks a site.json and replaces each unsplash Media with a real image (type:"image" +
// src + credit). No key → leaves them untouched (renderer shows themed placeholders),
// so this step is always safe to run. Optional Phase-5 enrichment before render.
//
// Usage: UNSPLASH_ACCESS_KEY=xxx node scripts/resolve-media.mjs <site.json> [out.json]
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const KEY = process.env.UNSPLASH_ACCESS_KEY
const [, , inArg, outArg] = process.argv
if (!inArg) {
  console.error('usage: resolve-media.mjs <site.json> [out.json]')
  process.exit(2)
}
const inPath = resolve(inArg)
const outPath = outArg ? resolve(outArg) : inPath
const site = JSON.parse(readFileSync(inPath, 'utf-8'))

if (!KEY) {
  console.log('• no UNSPLASH_ACCESS_KEY — leaving unsplash media as placeholders (safe).')
  process.exit(0)
}

const ORIENT = { square: 'squarish', portrait: 'portrait', wide: 'landscape', video: 'landscape', auto: 'landscape' }
const cache = new Map()
let resolved = 0
let failed = 0

async function fetchPhoto(query, aspect) {
  const cacheKey = `${query}|${aspect || 'auto'}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)
  const orientation = ORIENT[aspect || 'auto'] || 'landscape'
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}&client_id=${KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  const photo = data.results?.[0]
  if (!photo) return null
  // Unsplash guideline: fire the download endpoint (fire-and-forget) and attribute.
  if (photo.links?.download_location) {
    fetch(`${photo.links.download_location}&client_id=${KEY}`).catch(() => {})
  }
  const out = { src: photo.urls.regular, credit: `Photo by ${photo.user?.name || 'Unknown'} on Unsplash` }
  cache.set(cacheKey, out)
  return out
}

// Walk the whole document, resolving any Media object with type:"unsplash" + query.
async function walk(node) {
  if (Array.isArray(node)) {
    for (const x of node) await walk(x)
    return
  }
  if (node && typeof node === 'object') {
    if (node.type === 'unsplash' && typeof node.query === 'string') {
      try {
        const p = await fetchPhoto(node.query, node.aspect)
        if (p) {
          node.type = 'image'
          node.src = p.src
          node.credit = p.credit
          resolved++
        } else {
          failed++
        }
      } catch (e) {
        console.warn(`  ! "${node.query}": ${e.message}`)
        failed++
      }
    }
    for (const k of Object.keys(node)) await walk(node[k])
  }
}

await walk(site)
writeFileSync(outPath, JSON.stringify(site, null, 2) + '\n', 'utf-8')
console.log(`✅ resolved ${resolved} unsplash image(s)${failed ? `, ${failed} unresolved` : ''} → ${outPath}`)
