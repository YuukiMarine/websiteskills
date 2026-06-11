# Sitesmith

> Conversational website builder + auto-deploy, **BYO-infra** model.
> A customer brings their own domain, their own server (Tencent Cloud HK/SG node),
> and their own GLM API key. Sitesmith walks them from "nothing" to "live HTTPS site"
> through a few rounds of chat. We sell the automation + the AI builder + the
> templates + support — the customer owns their infrastructure and data.

> 占位名 `sitesmith`，可改。InnoE 是它的第一套模板与第一个真实案例。

---

## Core idea: three layers

```
 RECIPE (the "skill")        site.json (AI output)        Template (renderer)
 ──────────────────────      ─────────────────────        ───────────────────
 schema + instructions  ─►   structured site data    ─►   Astro site → build → deploy
 that constrain the AI       (validates, no code)         (pro / minimal / bold)
```

The AI **never writes code**. It produces a `site.json` (data) that any template can
render. This is what makes output stable and re-skinnable. See `recipe/RECIPE.md`.

## End-to-end product flow (9 steps)

```
1 signup → 2 buy domain/server/GLM (guided checklist) → 3 enter creds (validated)
→ 4 bootstrap server (SSH) → 5 bind DNS → 6 TLS cert → 7 AI chat builds site.json
→ 8 render + deploy (nginx) → 9 iterate
```

Locked decisions for the MVP (2026-06):
- **Market:** overseas / HK-SG nodes — **no ICP filing** required.
- **Scope:** semi-automatic MVP — console does wizard + chat; provision/deploy via
  our scripts with a human in the loop.
- **Connection:** Push — control plane holds SSH creds and `rsync`-deploys
  (reuses InnoE's `push.sh`). Evolve to a pull-agent at scale.
- **Generation:** constrained recipe — AI fills `site.json`; we ship a few templates
  derived from InnoE. Media handled by a resolver (placeholder/unsplash/upload).

## Repo layout

```
recipe/
  RECIPE.md            # system instruction for the build AI (the "skill")
  site.schema.json     # authoritative site.json contract (draft 2020-12)
  sections/README.md   # section catalogue: meaning, when-to-use, copy limits
  theme.md             # theme token system (colors/fonts/radius/density → CSS vars)
  assets.md            # the 4 asset classes + Media resolver pipeline
  examples/
    innoe.site.json    # reference build (bilingual, validated)
scripts/
  validate.mjs         # ajv validator: `npm run validate [path]`
ROADMAP.md             # phased plan (Phase 0 → 6)
```

## Status

- **Phase 0 — Recipe spec: ✅ done & validated.** `npm run validate` passes.
- **Phase 1 — Template engine: ✅ done.** `templates/pro/` renders any `site.json`
  (13 sections, bilingual, themeable). `cd templates/pro && npm run dev`.
- **Phase 2 — Hermes skill: 🔄 skeleton done.** `skill/` packages the recipe as a
  Hermes Agent skill (SKILL.md + validate/render/deploy scripts). See
  `docs/hermes-integration.md`. `scripts/generate.mjs` is the agent-agnostic GLM
  fallback. End-to-end conversation→site needs a GLM-5.1 key + a Hermes box.
- **Phase 3 — Install & deploy: 🔄 scripts done.** Install is a **prompt + GitHub link**
  the student's Hermes runs itself (`remote-install.sh` → installs the build skill +
  community skills; Node auto-installed). `skill/scripts/deploy.sh` publishes over Nginx +
  Let's Encrypt. Needs a HK/SG server to verify E2E.
- **Phase 4 — Console: 🔄 core flow done.** `console/` (Astro SSR) — auth, new-site
  wizard, dashboard, and a chat-builder with **live iframe preview** (`/api/generate` →
  `/api/render`). Credentials encrypted at rest. `cd console && npm run dev`. Remaining:
  one-click publish (needs a server) + credential live-validation.
- Next: wire publish-to-deploy on a real server, and/or a live **GLM-5.1** run.
- **Deployment assistant (teaching, 🔄):** students install the skill by pasting a
  **prompt + GitHub link** their own Hermes runs itself (`remote-install.sh`,
  `docs/install-prompt.md`) — no SSH, no terminal. A guided **10-step web wizard** is at
  `console/` → `/assistant`. Published to `github.com/YuukiMarine/websiteskills`.
  Next: deploy the assistant to innoe.io + a Tauri desktop build.

See `ROADMAP.md` for the full plan.

## Install on a Hermes box

Students paste the prompt from `docs/install-prompt.md` to their Hermes, or run on the
server:

```bash
curl -fsSL https://raw.githubusercontent.com/YuukiMarine/websiteskills/main/remote-install.sh | bash
```

It installs the build skill + community skills into `~/.hermes/skills/`. See `INSTALL.md`.

## Validate a site definition

```bash
npm install
npm run validate                          # checks the InnoE example
npm run validate path/to/other.site.json  # check any site.json
```

## Generate a site from a brief (needs a GLM key)

The agent-agnostic fallback — drives the same `recipe/` the Hermes skill uses, no Hermes
required. Self-repairs against the schema. Use it to verify generation quality cheaply.

```bash
node scripts/generate.mjs --dry-run "a cozy bakery in SG" --lang en,zh   # no key: checks the pipeline
export GLM_API_KEY=...          # from https://z.ai
export GLM_MODEL=glm-4.6        # or your GLM-5.1 model id
node scripts/generate.mjs "a cozy bakery in Singapore, wants walk-ins" --lang en,zh
# → out/site.json  (validated)
```

## Render & preview a site.json

```bash
SITESMITH_TEMPLATE_DIR=templates/pro node skill/scripts/render.mjs out/site.json out
open out/dist/index.html        # or: npx serve out/dist
```
