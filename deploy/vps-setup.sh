#!/usr/bin/env bash
# AINOS one-shot server setup for a fresh Ubuntu VPS (22.04 / 24.04).
#
#   curl -fsSL https://raw.githubusercontent.com/yurekh-solutions/ainos/main/deploy/vps-setup.sh | sudo bash
#
# What it does: Node 20, swap if RAM is small, clone the repo, install deps,
# prisma generate, production build, PM2 process, Nginx reverse proxy on
# ainossuite.com, then SSL with Let's Encrypt (skipped if DNS is not pointing
# here yet). It is safe to re-run: every step checks before acting.
#
# The .env file is NOT created here. Upload it from your own machine first:
#   scp "C:\...\ainos\.env" root@<VPS_IP>:/srv/ainos/.env
set -euo pipefail

DOMAIN="ainossuite.com"
CERT_EMAIL="admin@ainossuite.com"
REPO="https://github.com/yurekh-solutions/ainos.git"
APP_DIR="/srv/ainos"
APP_USER="ainos"
APP_PORT=3000
NODE_MAJOR=20

log() { printf '\n\033[1;36m>>> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!! %s\033[0m\n' "$*"; }

[ "${EUID:-1}" -eq 0 ] || { echo "Run as root:  curl ... | sudo bash"; exit 1; }
# shellcheck disable=SC1091
. /etc/os-release
log "OS: ${PRETTY_NAME:-unknown}"

log "1/8  base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates nginx ufw openssl

log "2/8  swap (only when RAM is below 4 GB)"
MEM_KB=$(awk '/MemTotal/{print $2}' /proc/meminfo)
if [ "$MEM_KB" -lt 3800000 ] && [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  warn "4 GB swap added (build will be slow but will fit)"
fi
sysctl -w vm.swappiness=20 >/dev/null || true

log "3/8  Node ${NODE_MAJOR}"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v && npm -v

log "4/8  application user + code"
id -u "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --depth 1 "$REPO" "$APP_DIR"
else
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --depth 1 origin main
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  cat <<MSG

$(warn ".env is missing - stopping here")

Upload it from your Windows PC (PowerShell), then run this script again:

  scp "C:\\Users\\yurek\\OneDrive\\Desktop\\yuvraj\\ainos\\.env" root@<VPS_IP>:$APP_DIR/.env

MSG
  exit 2
fi
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

log "5/8  normalise .env (host values + required keys)"
# Trailing slash in NEXTAUTH_URL breaks OAuth redirect matching.
sed -i -E "s#^(NEXTAUTH_URL|NEXT_PUBLIC_APP_URL)=https://${DOMAIN}/+\$#\1=https://${DOMAIN}#" "$APP_DIR/.env"
grep -q '^NEXTAUTH_URL=' "$APP_DIR/.env" || echo "NEXTAUTH_URL=https://${DOMAIN}" >> "$APP_DIR/.env"
grep -q '^NEXT_PUBLIC_APP_URL=' "$APP_DIR/.env" || echo "NEXT_PUBLIC_APP_URL=https://${DOMAIN}" >> "$APP_DIR/.env"
grep -q '^NEXTAUTH_URL_BASE=' "$APP_DIR/.env" || echo "NEXTAUTH_URL_BASE=https://${DOMAIN}" >> "$APP_DIR/.env"
grep -q '^NEXT_PUBLIC_SITE_URL=' "$APP_DIR/.env" || echo "NEXT_PUBLIC_SITE_URL=https://${DOMAIN}" >> "$APP_DIR/.env"
if ! grep -q '^CRON_SECRET=' "$APP_DIR/.env"; then
  echo "CRON_SECRET=$(openssl rand -hex 32)" >> "$APP_DIR/.env"
fi
for key in DATABASE_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET REDIS_URL; do
  grep -q "^${key}=" "$APP_DIR/.env" || warn "missing in .env: ${key}"
done

log "6/8  dependencies + Prisma client + production build"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci --no-audit --no-fund"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npx prisma generate"
HEAP=$([ "$MEM_KB" -lt 3800000 ] && echo 3072 || echo 4096)
log "     build with NODE_OPTIONS=--max-old-space-size=${HEAP} (10-25 min on small VPS)"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && NODE_OPTIONS=--max-old-space-size=${HEAP} npx next build --webpack"

log "7/8  PM2 process"
command -v pm2 >/dev/null || npm i -g pm2 >/dev/null 2>&1
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && PORT=${APP_PORT} pm2 delete ainos >/dev/null 2>&1 || true"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && PORT=${APP_PORT} pm2 start server.js --name ainos --update-env"
sudo -u "$APP_USER" bash -lc "pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null || true
sleep 3
curl -fsS "http://127.0.0.1:${APP_PORT}/api/ping" && echo "  <- app is answering on 127.0.0.1:${APP_PORT}"

log "8/8  Nginx + firewall"
cat > /etc/nginx/sites-available/ainos <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/ainos /etc/nginx/sites-enabled/ainos
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

POINTED_HERE=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -n1 || true)
PUBLIC_IP=$(curl -fsS https://api.ipify.org || echo -)
if [ "$POINTED_HERE" = "$PUBLIC_IP" ]; then
  log "DNS already points here - requesting SSL"
  apt-get install -y -qq certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --agree-tos -m "$CERT_EMAIL" --non-interactive --redirect || warn "certbot failed - re-run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  warn "DNS for ${DOMAIN} resolves to ${POINTED_HERE:-nothing}, not this server (${PUBLIC_IP:-unknown})."
  warn "Point the GoDaddy A record here and DELETE the old GoDaddy Node.js app, then run:"
  warn "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

log "Done"
echo "  app dir : $APP_DIR"
echo "  process : pm2 status   |   logs: pm2 logs ainos"
echo "  health  : curl -s http://127.0.0.1:${APP_PORT}/api/health"
