# Install Sitesmith on a Hermes box

Sitesmith is a [Hermes Agent](https://github.com/NousResearch/hermes-agent) skill that
builds & deploys websites by conversation.

## The easy way — let your Hermes install it

Paste the prompt from [`docs/install-prompt.md`](docs/install-prompt.md) to your own
Hermes Agent. It runs the install itself and confirms. **No SSH, no terminal** — for a
student, the entire "installation" is a message + a link.

## Prerequisite

A server already running **Hermes Agent** — e.g. a Tencent Cloud HK/SG image with Hermes
pre-installed, or the official Hermes installer. That's the only requirement;
`remote-install.sh` installs Node 22 itself if it's missing.

## Manual one-liner (optional)

If you'd rather run it on the server yourself:

```bash
curl -fsSL https://raw.githubusercontent.com/YuukiMarine/websiteskills/main/remote-install.sh | bash
```

This fetches Sitesmith and installs the `sitesmith` build skill **plus the bundled
community skills** into `~/.hermes/skills/` (dependencies and verification included).

## Then use it

1. Point Hermes at GLM-5.1 (z.ai): `hermes model` → Custom endpoint →
   `https://api.z.ai/api/coding/paas/v4` + your GLM key.
2. Chat: *"build me a website for …"* — Hermes gathers, generates, renders, and (on your
   approval) deploys over Nginx.

See `README.md` for architecture and `CREDITS.md` for community-skill attribution.
