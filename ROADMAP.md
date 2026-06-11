# Sitesmith Roadmap

Phased plan from spec to a sellable, then scalable, product. Each phase is
independently demoable and builds on the previous one. Effort is rough
(1 unit ≈ a focused engineering day); treat as relative sizing, not commitment.

**Locked decisions (2026-06):** overseas/HK-SG nodes (no ICP filing) · semi-auto MVP ·
Push deploy (reuse `push.sh`) · constrained-recipe generation. These shape every phase.

Legend: ✅ done · 🔜 next · ⬜ planned

---

## Phase 0 — Recipe spec  ✅ done  (~done)

Define the contract everything else depends on.

- ✅ `site.schema.json` — 13 section types, theme, brand, nav, footer, contact,
  integrations; bilingual `LocalizedText`; `Media` with placeholder/unsplash.
- ✅ `RECIPE.md` — AI system instruction: role, hard rules, conversation flow,
  section/theme mapping, copy standards, output contract.
- ✅ `sections/README.md`, `theme.md`, `assets.md` — human + AI guidance.
- ✅ `examples/innoe.site.json` — reference build, **passes `npm run validate`**.

**Exit criteria:** ✅ a hand-written site.json validates; spec is internally consistent.

---

## Phase 1 — Template engine  ✅ done  (`templates/pro/`)

Turned the InnoE site into the first data-driven template + a renderer.

- ✅ Scaffolded Astro 6 + Tailwind v4 + astro-icon project under `templates/pro/`
  (vite override for the rolldown/tailwind conflict).
- ✅ Built **13 section components** 1:1 with the schema (hero, logos, features,
  services, about, stats, gallery, pricing, testimonials, team, faq, cta, contact),
  each typed from `site.json` — zero hardcoded copy.
- ✅ **Theme token layer** (`lib/theme.ts`): `theme{}` → inline CSS vars on `<html>`
  that override the `@theme` defaults (presets, primary/accent w/ derived
  hover/active/tint, neutral ramp, fonts, radius, density).
- ✅ **Renderer** (`pages/index.astro`): loads `site.json` (via `$SITE_JSON` / local /
  example fallback), type-narrowed dispatch, bilingual `<T>` + `[data-lang]` toggle
  (renders all langs, CSS shows active, instant switch, no reload).
- ✅ Media resolver v1: `placeholder`/`unsplash` → themed placeholder; real
  image/video pass through. Pages always complete offline.
- ✅ Robustness: **no-JS fallback** for scroll animations (content visible without JS),
  flash-free language restore, reduced-motion support.

**Verified:** `astro build` ✓ (1 page, 9 sections, bilingual 90/90 spans, 35 icons),
`astro check` ✓ 0 errors / 0 warnings, visual parity with InnoE confirmed via screenshots.
**Run:** `cd templates/pro && npm run dev` (uses the InnoE example), or
`SITE_JSON=/abs/path/site.json npm run build`.
**Exit criteria:** ✅ InnoE example renders on par with the live homepage; build succeeds.

---

## Phase 2 — Conversational build engine  🔄 skeleton done (E2E pending GLM key + Hermes box)

GLM-5.1 + RECIPE → a valid `site.json`, with iteration. **Delivered as a Hermes skill.**

> **Architecture pivot (confirmed 2026-06):** "Tencent Cloud + Hermes" = deploy
> **[Hermes Agent](https://github.com/NousResearch/hermes-agent)** (Nous Research's
> open-source autonomous agent, MIT, ~100k★, built-in skill system) on the customer's
> server. It is the conversational runtime. We do NOT write a bespoke chat loop — we
> **package `RECIPE` as a Hermes skill** that the customer's Hermes Agent loads, runs
> against their GLM-5.1 key, and uses to emit `site.json` + trigger deploy. This is
> exactly the "skills 规范" idea: our recipe IS a Hermes skill.

- ✅ **Studied Hermes skill format** → `docs/hermes-integration.md` (SKILL.md frontmatter +
  When-to-Use/Procedure/Pitfalls/Verification, `${HERMES_SKILL_DIR}` script invocation,
  progressive disclosure, skills = instructions + scripts within the agent's own tools).
- ✅ **Packaged `recipe/` as a Hermes skill** → `skill/` (SKILL.md + scripts + assembled
  references + bundled template). `scripts/build-skill.mjs` assembles it from canonical
  sources; verified locally.
- ✅ **`validate.mjs` + `render.mjs`** work end-to-end locally (site.json → valid → dist).
  `deploy.sh` skeleton in place (Phase 3).
- ✅ **Fallback implemented:** `scripts/generate.mjs` — a thin GLM client (same `recipe/`,
  no Hermes) with a validate-and-repair loop. Pipeline verified via `--dry-run`
  (~13k-token prompt); needs a GLM key to run live. Lets us prove generation quality
  with no server.
- ⏳ **Point Hermes at GLM-5.1** — config documented (`config.yaml` base_url → Zhipu /v4);
  needs the customer's key to verify.
- ⏳ **Validate-and-repair loop in conversation** — instructed in SKILL.md; needs a live
  Hermes + GLM run to confirm GLM-5.1 drives the tools + self-corrects.

**Resource gate:** end-to-end (conversation → valid site.json) needs a **GLM-5.1 key** and
a box running **Hermes Agent**. Everything buildable without them is done & verified.
**Risk:** GLM-5.1 JSON/tool-call adherence under Hermes. Mitigations: strong few-shot
(the example), schema in context, validate-and-repair loop.
**Exit criteria:** a non-technical user, chatting with their Hermes Agent, reaches a
schema-valid `site.json` in ≤5 turns on 3 business types (services, local biz, portfolio).

---

## Phase 3 — Install & deploy  🔄 scripts done (E2E pending a server)

From a prompt + GitHub link → skill installed → `site.json` → live HTTPS.

- ✅ **GitHub install** (`remote-install.sh`): the student's Hermes runs one command — it
  clones the repo, assembles the skill (`build-skill.mjs`), installs it **plus the
  community skills** into `~/.hermes/skills/`, and auto-installs Node 22 if missing.
- ✅ **`docs/install-prompt.md`**: the paste-to-Hermes prompt — the entire student install.
- ✅ **`skill/scripts/deploy.sh`**: rsync static site → `/var/www/<domain>` → Nginx
  vhost → Let's Encrypt. Supports local or SSH-push.
- ⏳ **End-to-end on a real HK/SG box** — all scripts ready; needs a server + domain.
- ⏳ `deploy.sh`: install nginx/certbot if missing, low-RAM build (swap), rollback.

> **Simplified (2026-06):** removed `bootstrap.sh` (Hermes comes pre-installed via the
> Tencent Cloud image), `scripts/package.mjs` + `skill/install.sh` (the tarball path), and
> `docs/runbook.md` — all replaced by the GitHub `remote-install` + deploy-assistant flow.

**Exit criteria:** student pastes the prompt → Hermes installs the skill → a chat builds
the site → `deploy.sh` serves it at `https://<domain>` with a valid cert.

---

## Phase 4 — Console MVP  🔄 core flow done (★ first sellable version)  (`console/`)

An Astro SSR web app wrapping Phases 1–3. This is what we sell.

- ✅ **Auth** (`lib/auth.ts`): session cookie + in-memory token + constant-time compare.
- ✅ **Wizard** (`new.astro`): prerequisite checklist (domain/server/GLM) + credential
  form → creates a project.
- ✅ **Chat builder + live preview** (`build/[id].astro`): chat panel → `/api/generate`
  (GLM, same `recipe/`) → `/api/render` (template build) → iframe preview at
  `/previews/<id>/`. Verified end-to-end with a seeded site (GLM gen pending credit).
- ✅ **Dashboard** (`index.astro`): project list + status badges over a JSON store.
- ✅ **Encrypted credentials** (`lib/crypto.ts`): AES-256-GCM with `ENC_KEY` (obfuscated
  fallback in dev). Verified: GLM key persists as `b64:`/`v1:`, never plaintext.
- ⏳ **Publish → deploy** (button present; wires to `deploy.sh`, needs a server) +
  credential live-validation (test SSH/GLM) + multi-tenant accounts.

**Exit criteria:** ✅ a user goes signup → wizard → chat → preview in the console;
remaining ⏳ is one-click publish on a real server.

**Risk:** holding customer SSH creds = liability. MVP mitigations: encryption at rest,
dedicated limited `deploy` user, scoped keys. Real fix = Phase 6 pull-agent.
**Exit criteria:** a non-technical user goes signup → chat → preview → live site, with
at most one human-assisted deploy click on our side.

---

## Phase 5 — Multi-template + asset pipeline  ✅ core done

Make it feel custom and let real media in.

- ✅ **4 templates**: `pro` (versatile), `newchinese` (rice-paper/ink/vermilion seal),
  `cyber` (neon/grid/scanlines/clipped cards), `portfolio` (stark B&W, oversized type,
  image-led). Architecture: single Astro project, each template = a `[data-template]`-
  scoped CSS layer (palette/fonts/shape/decoration/**entrance animations**) over shared,
  variable-driven components + `ss-hero`/`ss-eyebrow`/`ss-card` hooks. `theme.ts` only
  injects user-set fields, so each template's palette is the default. Switching
  `theme.template` re-skins the same `site.json` — verified with 3 demo sites.
- ✅ **Media resolver** (`skill/scripts/resolve-media.mjs`): swaps `type:"unsplash"` for
  real Unsplash photos (with `credit`), auto-wired into render, gated on
  `UNSPLASH_ACCESS_KEY` — no key still renders themed placeholders.
- ✅ **AI-driven bespoke theming** is the default path (design a palette per business);
  `theme.ts` injects only user-set fields, so each template's own palette is the default.
- ⬜ Upload box, text-to-image, live theme switcher — deferred to the **console (Phase 4)**.

**Exit criteria:** one `site.json` renders convincingly under all 3 templates; a
customer can upload a logo + photos and see them replace placeholders.

---

## Phase 6 — Scale & hardening  ⬜  (~12+ units)

Turn a working product into an operable business.

- ⬜ **Pull-agent**: small daemon on customer server polls control plane for new builds
  and self-deploys — we stop holding inbound SSH long-term. (Security upgrade over Push.)
- ⬜ Full automation: DNS verification, cert issuance/renewal, security-group opening
  via Tencent Cloud API (collect cloud API creds in onboarding).
- ⬜ Job queue + retries + observability for provision/deploy.
- ⬜ Billing (setup fee + monthly), plans, quotas.
- ⬜ Support runbook: GLM quota exhaustion, server down, cert renewal failure, rollback.
- ⬜ Backups + one-click rollback per site (versioned `site.json` + `dist`).

**Exit criteria:** zero-touch deploys; a control-plane compromise does not directly
expose customers' inbound SSH; a paying customer can be onboarded and billed end-to-end.

---

## Cross-cutting / open questions

- **"Hermes" product** — confirm which Tencent Cloud compute product this refers to
  (assumed Lighthouse/CVM). Affects server-setup defaults + security-group automation.
- **GLM model/version** — which GLM tier for generation? Affects JSON adherence and
  the validate-and-repair retry budget.
- **Build location** — build on control plane (ship `dist`) vs on server. Leaning
  control-plane to avoid small-instance OOM.
- **SSR vs static** — InnoE uses SSR (forms, admin). Generated sites with a contact
  form need SSR or a serverless form endpoint; pure-marketing sites can be static.
- **Domain registrar scope** — guide-only (customer self-serves) for MVP; API
  integration is post-MVP.
- **Data residency / privacy** — customer data lives on customer servers (a selling
  point); document it.

## Suggested near-term path

Phase 1 → 2 → 3 gets a working "chat → live site" demo (no console UI yet) that we can
show to validate demand. Phase 4 turns that demo into the product. Start Phase 1.
