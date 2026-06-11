#!/usr/bin/env bash
# Deploy a rendered site to the customer's server over Nginx + Let's Encrypt.
# Usage: deploy.sh <out-dir> <domain> [ssh-target]
#   ssh-target empty  → deploy on THIS machine (Hermes runs on the customer's box)
#   ssh-target set    → deploy to ubuntu@host (control-plane push model)
#
# STATUS: Phase 3 skeleton. The structure is real (mirrors the InnoE setup); it must be
# verified end-to-end on a HK/SG server before selling. See ROADMAP Phase 3.
set -euo pipefail

OUT_DIR="${1:?usage: deploy.sh <out-dir> <domain> [ssh-target]}"
DOMAIN="${2:?domain required}"
SSH_TARGET="${3:-${SITESMITH_SSH_TARGET:-}}"
DIST="${OUT_DIR%/}/dist"
WEBROOT="/var/www/${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
EMAIL="${SITESMITH_ADMIN_EMAIL:-admin@${DOMAIN}}"

[ -d "$DIST" ] || { echo "❌ no dist at $DIST — run render.mjs first"; exit 1; }

run() { if [ -n "$SSH_TARGET" ]; then ssh "$SSH_TARGET" "$1"; else bash -c "$1"; fi; }

echo "• syncing site → ${WEBROOT}"
if [ -n "$SSH_TARGET" ]; then
  ssh "$SSH_TARGET" "sudo mkdir -p '$WEBROOT' && sudo chown -R \$(whoami) '$WEBROOT'"
  rsync -az --delete "$DIST/" "$SSH_TARGET:$WEBROOT/"
else
  sudo mkdir -p "$WEBROOT"
  rsync -az --delete "$DIST/" "$WEBROOT/"
fi

echo "• writing Nginx vhost"
run "sudo tee '$NGINX_CONF' >/dev/null <<'CONF'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${WEBROOT};
    index index.html;
    location / { try_files \$uri \$uri/ \$uri.html =404; }
}
CONF
sudo ln -sf '$NGINX_CONF' '/etc/nginx/sites-enabled/${DOMAIN}.conf'
sudo nginx -t && sudo systemctl reload nginx"

echo "• issuing TLS certificate (Let's Encrypt)"
run "sudo certbot --nginx -d '${DOMAIN}' -d 'www.${DOMAIN}' --non-interactive --agree-tos -m '${EMAIL}' --redirect" || \
  echo "⚠️  certbot failed (DNS not pointed yet, or port 80 closed) — re-run after DNS resolves"

echo "✅ deployed: https://${DOMAIN}"
# TODO(Phase 3): install nginx/certbot if missing + open ufw 80/443; low-RAM build (swap);
#   DNS-resolves precheck; idempotent re-runs; keep previous dist for one-command rollback.
