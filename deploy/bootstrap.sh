#!/usr/bin/env bash
# Idempotent server bootstrap for Martynka urządza (static site behind Caddy).
# Run as root on the VPS shared with CoiledSpring:
#
#   sudo bash deploy/bootstrap.sh --site <IPv4|domain> --ci-pubkey "ssh-ed25519 AAAA... martynka-ci"
#
# What it does (each step prints [ok]/[skip]):
#   1. packages: rsync (ships rrsync) and Caddy from the official apt repository
#   2. user `martynka`, /srv/martynka/releases, authorized_keys restricted to the
#      tailnet and to the /usr/local/bin/martynka-deploy forced command
#   3. installs martynka-deploy
#   4. sshd Match block for `martynka` (ForceCommand, no forwarding, no TTY),
#      validated with `sshd -t` before reloading
#   5. /etc/caddy/Caddyfile from deploy/Caddyfile (IP certificate or domain)
#   6. UFW: allow 80/tcp and 443/tcp (nothing else is touched)
#   7. caddy enabled and (re)loaded
#   8. diagnostics
#
# It never touches CoiledSpring: not the `deploy`/`ops` users, /opt/coiled-spring,
# tailscale serve, Docker or existing UFW rules.
set -euo pipefail

SITE=""
CI_PUBKEY=""
MARTYNKA_USER="martynka"
MARTYNKA_ROOT="/srv/martynka"
DISPATCH_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/martynka-deploy"
CADDYFILE_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/Caddyfile"
SSHD_MATCH_FILE="/etc/ssh/sshd_config.d/61-martynka-deploy.conf"
TAILNET_FROM='100.64.0.0/10,fd7a:115c:a1e0::/48'
MIN_CADDY_FOR_IP="2.10.0"

usage() {
    echo "usage: $0 --site <IPv4|domain> --ci-pubkey \"<ssh public key>\"" >&2
    exit 2
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --site) SITE="${2:-}"; shift 2 ;;
        --ci-pubkey) CI_PUBKEY="${2:-}"; shift 2 ;;
        -h|--help) usage ;;
        *) echo "unknown argument: $1" >&2; usage ;;
    esac
done

[[ -n "$SITE" && -n "$CI_PUBKEY" ]] || usage
if [[ "$(uname -s)" != "Linux" ]] || ! command -v apt-get >/dev/null; then
    echo "this script must run ON THE VPS (Ubuntu/Debian), not on your workstation." >&2
    echo "copy deploy/ to the server and run it there; see deploy/README.md section 4." >&2
    exit 1
fi
[[ "$(id -u)" -eq 0 ]] || { echo "run as root" >&2; exit 1; }
[[ -f "$DISPATCH_SRC" && -f "$CADDYFILE_SRC" ]] || { echo "deploy/martynka-deploy or deploy/Caddyfile missing next to this script" >&2; exit 1; }
[[ "$CI_PUBKEY" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]+ ]] || { echo "--ci-pubkey does not look like an SSH public key" >&2; exit 1; }

ok()   { echo "[ok]   $*"; }
skip() { echo "[skip] $*"; }

is_ipv4() { [[ "$1" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; }

version_ge() {
    # version_ge A B: true if A >= B (dotted numbers)
    [[ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" == "$2" ]]
}

# 1. packages --------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
if ! command -v rsync >/dev/null || [[ ! -x /usr/bin/rrsync ]]; then
    apt-get update -qq
    apt-get install -y -qq rsync
    ok "rsync installed"
else
    skip "rsync present"
fi

if ! command -v caddy >/dev/null; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
    ok "caddy installed ($(caddy version | awk '{print $1}'))"
else
    skip "caddy present ($(caddy version | awk '{print $1}'))"
fi

CADDY_VERSION="$(caddy version | awk '{print $1}' | sed 's/^v//')"
if is_ipv4 "$SITE"; then
    if ! version_ge "$CADDY_VERSION" "$MIN_CADDY_FOR_IP"; then
        echo "caddy $CADDY_VERSION is older than $MIN_CADDY_FOR_IP; IP certificates (profile shortlived) need a newer Caddy. Upgrade caddy or use a domain." >&2
        exit 1
    fi
fi

# 2. user and directories -------------------------------------------------
if ! id "$MARTYNKA_USER" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash "$MARTYNKA_USER"
    ok "user $MARTYNKA_USER created"
else
    skip "user $MARTYNKA_USER exists"
fi

install -d -m 755 -o "$MARTYNKA_USER" -g "$MARTYNKA_USER" "$MARTYNKA_ROOT" "$MARTYNKA_ROOT/releases"
ok "$MARTYNKA_ROOT/releases ready"

HOME_DIR="$(getent passwd "$MARTYNKA_USER" | cut -d: -f6)"
install -d -m 700 -o "$MARTYNKA_USER" -g "$MARTYNKA_USER" "$HOME_DIR/.ssh"
AUTH_KEYS="$HOME_DIR/.ssh/authorized_keys"
AUTH_LINE="restrict,from=\"$TAILNET_FROM\",command=\"/usr/local/bin/martynka-deploy\" $CI_PUBKEY"
touch "$AUTH_KEYS"
if grep -qF "$CI_PUBKEY" "$AUTH_KEYS"; then
    # replace any previous line carrying this key with the current options
    grep -vF "$CI_PUBKEY" "$AUTH_KEYS" > "$AUTH_KEYS.tmp" || true
    printf '%s\n' "$AUTH_LINE" >> "$AUTH_KEYS.tmp"
    mv "$AUTH_KEYS.tmp" "$AUTH_KEYS"
    ok "authorized_keys line refreshed"
else
    printf '%s\n' "$AUTH_LINE" >> "$AUTH_KEYS"
    ok "authorized_keys line added"
fi
chown "$MARTYNKA_USER:$MARTYNKA_USER" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

# 3. dispatcher ------------------------------------------------------------
install -m 755 -o root -g root "$DISPATCH_SRC" /usr/local/bin/martynka-deploy
ok "/usr/local/bin/martynka-deploy installed"

# 4. sshd Match block --------------------------------------------------------
install -d -m 755 /etc/ssh/sshd_config.d
cat > "$SSHD_MATCH_FILE.tmp" <<EOF
# Martynka urządza: CI deploy user is limited to the martynka-deploy dispatcher.
Match User $MARTYNKA_USER
    ForceCommand /usr/local/bin/martynka-deploy
    AllowTcpForwarding no
    AllowAgentForwarding no
    X11Forwarding no
    PermitTTY no
    PasswordAuthentication no
    AuthenticationMethods publickey
EOF
if [[ -f "$SSHD_MATCH_FILE" ]] && cmp -s "$SSHD_MATCH_FILE.tmp" "$SSHD_MATCH_FILE"; then
    rm -f "$SSHD_MATCH_FILE.tmp"
    skip "sshd Match block unchanged"
else
    mv "$SSHD_MATCH_FILE.tmp" "$SSHD_MATCH_FILE"
    chmod 644 "$SSHD_MATCH_FILE"
    if sshd -t; then
        systemctl reload ssh 2>/dev/null || systemctl reload sshd
        ok "sshd Match block installed and sshd reloaded"
    else
        echo "sshd -t failed; removing $SSHD_MATCH_FILE and NOT reloading sshd" >&2
        rm -f "$SSHD_MATCH_FILE"
        exit 1
    fi
fi

# 5. Caddyfile ---------------------------------------------------------------
if is_ipv4 "$SITE"; then
    SITE_BLOCK="https://$SITE"
    TLS_MODE="ip"
else
    SITE_BLOCK="$SITE"
    TLS_MODE="domain"
fi
CADDYFILE_TMP="$(mktemp)"
# __TLS__ becomes a `tls { profile shortlived }` block for an IP address (Let's
# Encrypt short-lived IP certificate) and disappears for a domain.
sed -e "s|__SITE__|$SITE_BLOCK|" "$CADDYFILE_SRC" | awk -v mode="$TLS_MODE" '
    /__TLS__/ {
        if (mode == "ip") { print "    tls {"; print "        profile shortlived"; print "    }" }
        next
    }
    { print }' > "$CADDYFILE_TMP"
if [[ -f /etc/caddy/Caddyfile ]] && cmp -s "$CADDYFILE_TMP" /etc/caddy/Caddyfile; then
    rm -f "$CADDYFILE_TMP"
    skip "Caddyfile unchanged"
else
    [[ -f /etc/caddy/Caddyfile ]] && cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
    install -m 644 "$CADDYFILE_TMP" /etc/caddy/Caddyfile
    rm -f "$CADDYFILE_TMP"
    ok "Caddyfile written for $SITE_BLOCK"
fi
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
ok "Caddyfile validates"

# 6. UFW -----------------------------------------------------------------------
if command -v ufw >/dev/null; then
    ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null
    ok "ufw: 80/tcp and 443/tcp allowed"
else
    skip "ufw not installed"
fi

# 7. caddy service -------------------------------------------------------------
systemctl enable --now caddy >/dev/null 2>&1 || true
systemctl reload caddy 2>/dev/null || systemctl restart caddy
ok "caddy enabled and reloaded"

# 8. diagnostics ---------------------------------------------------------------
echo
echo "--- diagnostics"
echo "caddy:      $(caddy version | awk '{print $1}'), $(systemctl is-active caddy)"
echo "listeners:  $(ss -ltnp 2>/dev/null | grep -E ':80 |:443 ' | awk '{print $4, $6}' | tr '\n' ';')"
echo "tailscale:  $(tailscale serve status 2>/dev/null | head -3 | tr '\n' ' ' || echo 'n/a')"
echo "releases:   $(ls -1 "$MARTYNKA_ROOT/releases" 2>/dev/null | wc -l) in $MARTYNKA_ROOT/releases; current -> $(readlink "$MARTYNKA_ROOT/current" 2>/dev/null || echo '(none yet)')"
echo "site:       $SITE_BLOCK (first release will be served after the CI deploy)"
echo "done."
