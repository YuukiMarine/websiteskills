---
name: sitesmith
description: Build and deploy a website by conversation — gather requirements, produce a validated site.json, render it with the Sitesmith template, and publish over Nginx. Use for "build/make me a website", landing pages, personal/business sites, portfolios.
version: 0.1.0
author: Sitesmith
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    category: web
    tags: [website, landing-page, builder, astro, nginx, deploy, bilingual]
---

# Sitesmith — Conversational Website Builder

Turn a few rounds of conversation into a finished, optionally bilingual website and
publish it. You produce **data, not code**: a single `site.json` that a fixed, well-
designed template renders. This keeps output stable and re-skinnable.

## When to Use

When the user wants to create or update a website, landing page, personal or business
site, or portfolio — e.g. "build me a site", "我想做个网站", "update my homepage",
"make a landing page for my bakery".

## Quick Reference

Reference files — load with `skill_view("sitesmith", "<path>")` only when needed:

- `references/site.schema.json` — the contract every `site.json` MUST satisfy
- `references/sections.md` — the 14 section types (incl. `posts`): when to use, fields, copy limits
- `references/theme.md` — theme tokens (template, colors, fonts, radius, density)
- `references/assets.md` — image strategy (placeholder / unsplash; never invent assets)
- `references/examples/innoe.site.json` — a complete single-page example (few-shot)
- `references/examples/multipage.site.json` — a multi-page + blog example (few-shot)

Scripts — run via the terminal tool:

| Action | Command |
|--------|---------|
| Validate | `node ${HERMES_SKILL_DIR}/scripts/validate.mjs <site.json>` |
| Render | `node ${HERMES_SKILL_DIR}/scripts/render.mjs <site.json> <out-dir>` |
| Deploy | `bash ${HERMES_SKILL_DIR}/scripts/deploy.sh <out-dir> <domain>` |

## Procedure

1. **Gather (3–5 turns, grouped questions — don't interrogate).**
   - Business name + one line on what they do; industry + who their customers are.
   - Primary goal (calls / bookings / sign-ups / sell / showcase).
   - Languages — default to the chat language; offer bilingual (e.g. en + zh).
   - **Scope: one page or multi-page?** Default to single-page. If they want more (or
     mention a blog), offer the standard set (Home / About / Services / Blog / Contact)
     and let them trim it — confirm the page list before building.
   - Top 3–5 services/products; what makes them different; any real numbers; contact
     details + the main call-to-action.
   - Vibe in a word or two (→ `theme`); assets (logo? brand color? real photos?).
   - If the user is terse or says "just make it nice", proceed on sensible defaults
     (a single page is the safe default).

2. **Draft `site.json`** conforming to `references/site.schema.json`. Study the matching
   example first (`innoe.site.json` for single-page, `multipage.site.json` for multi-page).
   Pick **5–8 sections per page** that match real content (see `references/sections.md` for
   the goal→section-spine map).
   - **Single-page:** everything goes in the top-level `sections`.
   - **Multi-page:** home stays in top-level `sections`; add `pages[]` (one entry per
     sub-page, each with its own `sections`). Navigation auto-derives from the pages. A
     blog is a page with a `posts` section (lightweight: headline cards, no article pages).
   Choose the look (see `references/theme.md`): **either** pick a styled template
   (`newchinese`/`cyber`/`portfolio`) when the brand has a strong, obvious aesthetic,
   **or — the default —** use `template:"pro"` and **design a bespoke palette yourself**
   (`primary`/`accent`/`neutral`/`font`/`radius`/`density`) from the business's feeling,
   so each site is one-of-a-kind. Handle every image per `references/assets.md`.

3. **Validate.** Run `validate.mjs`. On failure, read the errors, fix the JSON, re-run.
   Never proceed with an invalid file.

4. **Render.** Run `render.mjs <site.json> <out-dir>` → a static site at `<out-dir>/dist`.
   If `UNSPLASH_ACCESS_KEY` is set, render auto-swaps `unsplash` placeholders for real
   photos (credited); without it, themed placeholders render — both are fine to ship.

5. **Preview & iterate.** Summarize in plain language what you built ("a 5-page bilingual
   site: Home, About, Services, Journal, Contact" — or "a 6-section single page"). **Tell
   the user the site stays fully editable** — they can ask you anytime to add/remove pages
   or sections, rewrite copy, change colors, or add blog posts. Apply edits by re-emitting
   the **complete** `site.json`, then re-validate + re-render.

6. **Deploy** (only after the user approves the preview). Run `deploy.sh <out-dir>
   <domain>` → live over Nginx with HTTPS. Report the live URL.

## Pitfalls

- **Output is data, not code.** Only produce `site.json`. Never hand-write HTML/CSS.
- **Schema is law.** Field names and enum values must match exactly; omit unknown fields.
- **No invented assets.** Use Media `type:"placeholder"` (decorative) or `"unsplash"` with
  a `query` (content photo); use `"image"` only with a real URL the user gave. Logo
  defaults to `type:"text"` unless a real logo file exists.
- **Prefer icons over images** for features/services — Lucide names always render and recolor.
- **Every LocalizedText carries all site languages.** Translate idiomatically; never leave
  one blank.
- **Don't over-build.** 5–8 sections. Alternate section backgrounds; never two `dark` or
  two `primary` in a row. Always open with `hero`, close with `cta` or `contact`.
- **No compliance-risky claims** — no invented certifications, endorsements, government
  subsidies/grants, awards, or statistics the user did not state.
- **Single-page is the default.** Only add `pages[]` when the user wants a richer/multi-page
  site or a blog — and confirm the page list with them first. The blog (`posts`) is a
  headlines list, not full articles; say so, and note articles can be added later.

## Verification

- `validate.mjs` exits `0` (it prints the resolved section order).
- `render.mjs` produces `<out-dir>/dist/index.html`.
- After deploy, `curl -I https://<domain>` returns `200`.
