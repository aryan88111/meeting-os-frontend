#!/bin/sh
set -eu

PORT="${PORT:-80}"
BACKEND_URL="${BACKEND_URL:-https://meeting-os-backend.onrender.com}"
# Strip any trailing slash so Nginx variable proxy_pass preserves original $request_uri
BACKEND_URL="${BACKEND_URL%/}"

# Extract IPv4 nameservers from /etc/resolv.conf for Nginx runtime DNS resolver
RESOLVERS=$(awk '/^nameserver[ \t]+[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/{print $2}' /etc/resolv.conf 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')
if [ -z "$RESOLVERS" ]; then
  RESOLVERS="127.0.0.11 8.8.8.8 1.1.1.1"
fi

sed \
  -e "s|__PORT__|${PORT}|g" \
  -e "s|__RESOLVERS__|${RESOLVERS}|g" \
  -e "s|__BACKEND_URL__|${BACKEND_URL}|g" \
  /etc/nginx/nginx.render.template > /etc/nginx/conf.d/default.conf

echo "[render-nginx] Configured Nginx on port ${PORT} with backend upstream ${BACKEND_URL} (resolvers: ${RESOLVERS})"
