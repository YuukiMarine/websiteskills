#!/usr/bin/env bash
# Sitesmith skill — one-command remote installer.
# Run on a server that ALREADY has Hermes Agent + Node 22 + git.
#   curl -fsSL https://raw.githubusercontent.com/YuukiMarine/websiteskills/main/remote-install.sh | bash
#
# Hermes can run this itself: paste the install prompt (docs/install-prompt.md) and it
# will execute this command and confirm.
set -euo pipefail

REPO="${SITESMITH_REPO:-https://github.com/YuukiMarine/websiteskills}"
BRANCH="${SITESMITH_BRANCH:-main}"
DEST="${HERMES_SKILLS_DIR:-$HOME/.hermes/skills}/sitesmith"

say() { printf '\033[36m• %s\033[0m\n' "$1"; }

# 0) prerequisites ------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 22 ]; then
  if command -v apt-get >/dev/null 2>&1; then
    say "Node.js 22 not found — installing it"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
  else
    echo "❌ Node.js 22+ is required (the skill renders sites with Astro). Please install it, then re-run."
    exit 1
  fi
fi
command -v git >/dev/null 2>&1 || { echo "❌ git is required."; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say "fetching Sitesmith ($REPO @ $BRANCH)"
git clone --depth 1 -b "$BRANCH" "$REPO" "$TMP/repo" 2>/dev/null

say "assembling the skill bundle"
( cd "$TMP/repo/skill" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 )
node "$TMP/repo/scripts/build-skill.mjs" >/dev/null

say "installing to $DEST"
mkdir -p "$DEST"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude node_modules "$TMP/repo/skill/" "$DEST/"
else
  rm -rf "${DEST:?}"/* && cp -a "$TMP/repo/skill/." "$DEST/"
fi

say "installing dependencies (this can take a minute)"
( cd "$DEST" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 )
( cd "$DEST/templates/pro" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 )
chmod +x "$DEST/scripts/deploy.sh" 2>/dev/null || true

# community skills — copy each into ~/.hermes/skills/ (their own deps install on first use)
SKILLS_DIR="${HERMES_SKILLS_DIR:-$HOME/.hermes/skills}"
if [ -d "$TMP/repo/skills" ]; then
  for dir in "$TMP/repo/skills"/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    cname="$(basename "$dir")"
    say "installing community skill: $cname"
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --delete --exclude node_modules "$dir" "$SKILLS_DIR/$cname/"
    else
      rm -rf "${SKILLS_DIR:?}/$cname" && cp -a "$dir" "$SKILLS_DIR/$cname"
    fi
  done
fi

say "verifying"
node "$DEST/scripts/validate.mjs" "$DEST/references/examples/innoe.site.json"

cat <<EOF

✅ Sitesmith installed → $DEST
   Hermes will list it as "sitesmith" (in skills_list).

Next:
  • Set your GLM key:  hermes model   → Custom endpoint
      base_url  https://api.z.ai/api/coding/paas/v4
      model     glm-4.6   (or your GLM-5.1 id)
  • Then just say:  "build me a website for ..."
EOF
