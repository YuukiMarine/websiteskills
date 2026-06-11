# Asset Strategy

The hard question you raised: *most media and SVG can't be reused per customer.* True
— but only one of four asset classes is genuinely per-customer. The other three are
template-owned and fully reusable. Generation must **never block** on a missing file.

## The four classes

| Class | Reusable? | How it's handled | AI emits |
|-------|-----------|------------------|----------|
| **Icons** | ✅ always | Lucide set shipped in every template, recolored by theme | `icon: "shield-check"` |
| **Decorative SVG** (blobs, grids, waves, gradients) | ✅ always | A themed SVG kit per template; follows color tokens | nothing — template adds them |
| **Theme visuals** (colors, fonts, shadows, layout) | ✅ always | CSS tokens from `theme` | `theme{}` only |
| **Content media** (hero shot, gallery, team, logos, testimonial avatars) | ❌ per-customer | Resolver pipeline below | `Media` object |

So the AI only ever decides about **content media**, and even then it emits an
*intent*, not a file.

## The Media resolver pipeline

`Media.type` tells the pipeline how to obtain the real asset at build time:

```
type: "image"        → use src as-is (customer-provided URL or upload token)
type: "unsplash"     → fetch a photo matching `query` (Unsplash API), cache locally
type: "placeholder"  → render a themed placeholder (gradient + icon + label)
type: "video"        → use src (mp4/embed)
```

Resolution order at build:
1. If a real upload exists for this slot → use it (always wins).
2. Else if `type:"unsplash"` → fetch + cache by query hash.
3. Else → themed placeholder, so the page is always complete and on-brand.

This means: **a brand-new customer with zero assets still gets a finished,
good-looking site on the first render.** They swap in real photos later via uploads,
no regeneration needed — same `site.json`, the resolver just finds the upload.

## Guidance the AI follows (from RECIPE §2)

- Prefer `icon` over imagery wherever a concept can be iconified (features, services,
  steps, values). Icons are free and perfect.
- Reserve `Media` for places a real scene/face matters: hero, gallery, team,
  testimonials, logos.
- Default to `type:"placeholder"` for decorative slots, `type:"unsplash"` (with a
  specific `query`) for content photos, `type:"image"` only with a real source.
- Logo: `brand.logo.type:"text"` unless a file is provided.

## Phase notes

- **Phase 1 MVP:** placeholders only (no external fetch) — proves the resolver and
  gives complete pages offline.
- **Phase 5 (done):** `resolve-media.mjs` swaps `type:"unsplash"` for real Unsplash
  photos (with `credit`), auto-wired into render and gated on `UNSPLASH_ACCESS_KEY` —
  no key still renders themed placeholders. Upload box + text-to-image arrive with the
  console (Phase 4).
