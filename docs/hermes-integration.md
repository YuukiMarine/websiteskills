# Hermes Integration — Research & Architecture

How Sitesmith ships as a **Hermes Agent skill** that runs on the customer's own
server, talks to them, and turns a few rounds of conversation into a live website.

Sources: [Hermes Agent repo](https://github.com/NousResearch/hermes-agent) ·
[Skills system](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) ·
[Creating skills](https://hermes-agent.nousresearch.com/docs/developer-guide/creating-skills) ·
[AI providers](https://hermes-agent.nousresearch.com/docs/integrations/providers)

---

## 1. What Hermes Agent is

An open-source (MIT) autonomous agent by Nous Research, ~100k★. It runs on a server,
has a built-in **skill system**, a `terminal` tool (runs shell), file tools, three-layer
memory, and multi-channel messaging. Crucially for us: **it works with any
OpenAI-compatible LLM endpoint**, so it can be pointed at the customer's GLM-5.1 key.

This reframes "Tencent Cloud + Hermes" from the original brief: Hermes Agent **is** the
conversational runtime on the customer's box. We don't build a chat loop — we ship a skill.

## 2. Skill anatomy (what we must produce)

A skill is a directory under `~/.hermes/skills/<category>/<name>/`:

```
sitesmith/
├── SKILL.md          # required: frontmatter + procedural instructions
├── references/       # loaded on demand (schema, section catalogue, theme, assets, example)
├── scripts/          # executables the agent runs via its terminal tool
└── templates/        # the pro template (so the skill is self-contained on the box)
```

**SKILL.md frontmatter** (required: `name`, `description`, `version`, `author`,
`license`; optional: `platforms`, `metadata.hermes.{category,tags,requires_tools}`,
`required_environment_variables`, `required_credential_files`).

**SKILL.md body** (documented template): `# Title` → intro → `## When to Use` →
`## Quick Reference` → `## Procedure` → `## Pitfalls` → `## Verification`.

**Script invocation:** the agent runs e.g. `node ${HERMES_SKILL_DIR}/scripts/render.mjs …`
via its `terminal` tool. Tokens substituted at load time: `${HERMES_SKILL_DIR}` (skill's
absolute path), `${HERMES_SESSION_ID}`. Inline `` !`cmd` `` exists but is disabled by
default — we rely on explicit script paths, not inline shell.

**Discovery = progressive disclosure:** Level 0 `skills_list()` (name+description+category,
~3k tokens, always in the system prompt) → Level 1 `skill_view(name)` (full SKILL.md) →
Level 2 `skill_view(name, path)` (a specific reference file). So SKILL.md stays lean and
the heavy material (full schema, section catalogue) lives in `references/`, pulled only
when needed.

**Important constraint:** skills **do not define their own tools or permissions**. They
are instructions + scripts that run inside the agent's *existing* tool permissions. So
"deploy" works because Hermes already has a terminal tool — our script just uses it.

## 3. Key architecture decisions

### D1 — Phase 2 + Phase 3 fuse into one skill
Because the agent can execute our `scripts/` via terminal, a single `sitesmith` skill
covers the whole arc: gather → `site.json` → validate → render → deploy → iterate. No
separate deploy product; deploy is `scripts/deploy.sh` the agent calls after the user
approves the preview.

### D2 — GLM-5.1 at the model layer, not in the skill
The customer configures Hermes once (`hermes model` → Custom endpoint, or `config.yaml`):
```yaml
model:
  default: glm-4.6            # or the GLM-5.1 model id
  provider: custom
  base_url: https://api.z.ai/api/coding/paas/v4   # Zhipu OpenAI-compatible endpoint
  api_key: ${their GLM key}
```
The skill is model-agnostic — it never sees the key. Zero AI cost to us.

### D3 — Single source of truth, assembled into the skill
`recipe/` stays the canonical spec (schema, sections, theme, assets, example).
`scripts/build-skill.mjs` assembles the distributable skill: copies `recipe/*` into
`skill/references/`, copies `templates/pro` into `skill/templates/pro`, and validates.
Edit once in `recipe/`; rebuild the skill. (`skill/references/` + `skill/templates/` are
generated — gitignored.)

### D4 — Credentials & deploy inputs
- **GLM key** → model layer (D2).
- **Server/deploy info** (host, SSH user, domain) → collected by the agent in
  conversation and passed to `deploy.sh` as args/env, or declared via
  `required_environment_variables` so Hermes prompts for them and stores non-secret bits
  in `config.yaml`. SSH key uses `required_credential_files`.

### D5 — Where the template runs / build location
The skill carries `templates/pro`. `render.mjs` injects `site.json` via `$SITE_JSON` and
runs `astro build` → static `dist/`. On a 1 GB Lighthouse box `astro build` can be tight;
mitigation options (Phase 3): add swap, or build once and ship `dist` from the control
plane. Static output (no Node runtime) keeps the deployed site cheap; a contact form
needs either a serverless endpoint or SSR (revisit in Phase 3).

## 4. The skill's runtime flow (agent's view)

```
user: "make me a site for my bakery"
  → agent loads sitesmith skill (skill_view)
  → 3–5 turns gathering requirements (Procedure §gather)
  → drafts site.json against references/site.schema.json
  → terminal: node scripts/validate.mjs site.json    (repair loop on failure)
  → terminal: node scripts/render.mjs site.json ./out (astro build)
  → shows preview / asks for edits
  → terminal: bash scripts/deploy.sh ./out <domain>   (rsync + nginx + certbot)
  → "your site is live at https://bakery.com"
```

## 5. What we can build & verify now vs. later

| Item | Build now | Verify now | Needs |
|------|-----------|-----------|-------|
| Skill package (SKILL.md + structure) | ✅ | ✅ format-conformant | — |
| `render.mjs` (site.json → dist) | ✅ | ✅ locally (reuses Phase 1) | — |
| `build-skill.mjs` (assemble skill) | ✅ | ✅ locally | — |
| GLM config recipe | ✅ (docs) | ⏳ | customer GLM key |
| Conversation→site.json quality | ✅ (SKILL.md prompts) | ⏳ | Hermes + GLM key |
| `deploy.sh` (live over Nginx) | ✅ skeleton | ⏳ | a HK/SG server (Phase 3) |

## 6. Open questions / risks
- **GLM-5.1 model id** on Zhipu's `/v4` endpoint (confirm exact string for `config.yaml`).
- **Tool-use under GLM:** Hermes leans on tool-calling; verify GLM-5.1 drives Hermes'
  terminal/file tools reliably (affects whether the agent can self-run our scripts).
- **Skill size vs. progressive disclosure:** keep SKILL.md lean; push detail to references.
- **Fallback:** if Hermes coupling is heavy, the same `recipe/` + `scripts/` drive a thin
  standalone GLM client — the design is agent-agnostic on purpose.
