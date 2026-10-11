#!/usr/bin/env bash
# Idempotent server bootstrap for Martynka urządza (static site behind Caddy).
# Run as root on the VPS shared with CoiledSpring:
#
#   sudo bash deploy/bootstrap.sh --site <IPv4|domain> --ci-pubkey "ssh-ed25519 AAAA... martynka-ci" [--bind <public IPv4>] [--ops-pubkey "ssh-ed25519 ... martynka-ops"]
#
# Caddy binds only the public IPv4 (--bind; defaults to --site when that is an
# IPv4, otherwise to the address of the default route), because tailscaled
# already listens on port 443 of the tailnet addresses.
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
#   9. (with --ops-pubkey) the agent's `martynka-ops` account: forced command with an
#      allowlist, one sudo rule to /usr/local/sbin/martynka-ops-root, repository clone
#      in /opt/martynka-src and /etc/martynka/ops.conf, so the agent can rerun this
#      bootstrap itself from whatever is merged on `main`
#
# It never touches CoiledSpring: not the `deploy`/`ops` users, /opt/coiled-spring,
# tailscale serve, Docker or existing UFW rules.
set -euo pipefail

SITE=""
CI_PUBKEY=""
BIND=""
OPS_PUBKEY=""
OPS_USER="martynka-ops"
OPS_SRC="/opt/martynka-src"
OPS_CONF_DIR="/etc/martynka"
OPS_CONF="$OPS_CONF_DIR/ops.conf"
OPS_SSHD_FILE="/etc/ssh/sshd_config.d/62-martynka-ops.conf"
OPS_SUDOERS="/etc/sudoers.d/martynka-ops"
OPS_SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ops"
REPO_URL="https://github.com/vince307/Martynka-urzadza.git"
MARTYNKA_USER="martynka"
MARTYNKA_ROOT="/srv/martynka"
DISPATCH_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/martynka-deploy"
CADDYFILE_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/Caddyfile"
SSHD_MATCH_FILE="/etc/ssh/sshd_config.d/61-martynka-deploy.conf"
TAILNET_FROM='100.64.0.0/10,fd7a:115c:a1e0::/48'
MIN_CADDY_FOR_IP="2.10.0"

usage() {
    echo "usage: $0 --site <IPv4|domain> --ci-pubkey \"<ssh public key>\" [--bind <public IPv4>] [--ops-pubkey \"<ssh public key>\"]" >&2
    exit 2
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --site) SITE="${2:-}"; shift 2 ;;
        --ci-pubkey) CI_PUBKEY="${2:-}"; shift 2 ;;
        --bind) BIND="${2:-}"; shift 2 ;;
        --ops-pubkey) OPS_PUBKEY="${2:-}"; shift 2 ;;
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
if [[ -n "$OPS_PUBKEY" ]]; then
    [[ "$OPS_PUBKEY" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]+ ]] || { echo "--ops-pubkey does not look like an SSH public key" >&2; exit 1; }
    [[ -f "$OPS_SRC_DIR/martynka-ops" && -f "$OPS_SRC_DIR/martynka-ops-root" ]] || { echo "deploy/ops/martynka-ops{,-root} missing next to this script" >&2; exit 1; }
fi

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
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes --batch -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
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
if [[ -z "$BIND" ]]; then
    if is_ipv4 "$SITE"; then
        BIND="$SITE"
    else
        BIND="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}' | head -n1)"
    fi
fi
is_ipv4 "$BIND" || { echo "cannot determine the public IPv4 to bind Caddy to; pass --bind <IPv4>" >&2; exit 1; }
CADDYFILE_TMP="$(mktemp)"
# __TLS__ becomes a `tls { issuer acme { profile shortlived } }` block for an IP
# address (Let's Encrypt short-lived IP certificate) and disappears for a domain.
sed -e "s|__SITE__|$SITE_BLOCK|" -e "s|__BIND__|$BIND|" "$CADDYFILE_SRC" | awk -v mode="$TLS_MODE" '
    /__TLS__/ {
        if (mode == "ip") {
            print "    tls {"
            print "        issuer acme {"
            print "            profile shortlived"
            print "        }"
            print "    }"
        }
        next
    }
    { print }' > "$CADDYFILE_TMP"
if [[ "$TLS_MODE" == "domain" ]]; then
    # www.<domain> redirects to the apex; the certificate for it is issued only
    # if its DNS A record exists (Caddy retries otherwise, without blocking the apex).
    cat >> "$CADDYFILE_TMP" <<EOF

www.$SITE {
    bind $BIND
    redir https://$SITE{uri} permanent
}
EOF
fi
# Format before comparing, so an unchanged config is detected as unchanged.
caddy fmt --overwrite "$CADDYFILE_TMP" >/dev/null 2>&1 || true
if [[ -f /etc/caddy/Caddyfile ]] && cmp -s "$CADDYFILE_TMP" /etc/caddy/Caddyfile; then
    rm -f "$CADDYFILE_TMP"
    skip "Caddyfile unchanged"
else
    [[ -f /etc/caddy/Caddyfile ]] && cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
    install -m 644 "$CADDYFILE_TMP" /etc/caddy/Caddyfile
    rm -f "$CADDYFILE_TMP"
    ok "Caddyfile written for $SITE_BLOCK (bind $BIND)"
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
systemctl reload caddy 2>/dev/null || systemctl restart caddy || true
sleep 3
if systemctl is-active --quiet caddy; then
    ok "caddy active"
else
    echo "caddy is not running; last log lines:" >&2
    journalctl -u caddy --since -2min --no-pager 2>/dev/null | tail -15 >&2
    exit 1
fi

# 9. agent ops account (optional) ---------------------------------------------
if [[ -z "$OPS_PUBKEY" ]]; then
    skip "ops profile not requested (--ops-pubkey)"
else
    command -v git >/dev/null || { apt-get install -y -qq git; ok "git installed"; }

    if ! id "$OPS_USER" >/dev/null 2>&1; then
        useradd --create-home --shell /bin/bash "$OPS_USER"
        ok "user $OPS_USER created"
    else
        skip "user $OPS_USER exists"
    fi
    OPS_HOME="$(getent passwd "$OPS_USER" | cut -d: -f6)"
    install -d -m 700 -o "$OPS_USER" -g "$OPS_USER" "$OPS_HOME/.ssh"
    OPS_AUTH="$OPS_HOME/.ssh/authorized_keys"
    OPS_LINE="restrict,from=\"$TAILNET_FROM\",command=\"/usr/local/sbin/martynka-ops\" $OPS_PUBKEY"
    touch "$OPS_AUTH"
    if grep -qF "$OPS_PUBKEY" "$OPS_AUTH"; then
        grep -vF "$OPS_PUBKEY" "$OPS_AUTH" > "$OPS_AUTH.tmp" || true
        printf '%s\n' "$OPS_LINE" >> "$OPS_AUTH.tmp"
        mv "$OPS_AUTH.tmp" "$OPS_AUTH"
        ok "$OPS_USER authorized_keys line refreshed"
    else
        printf '%s\n' "$OPS_LINE" >> "$OPS_AUTH"
        ok "$OPS_USER authorized_keys line added"
    fi
    chown "$OPS_USER:$OPS_USER" "$OPS_AUTH"
    chmod 600 "$OPS_AUTH"

    install -m 755 -o root -g root "$OPS_SRC_DIR/martynka-ops" /usr/local/sbin/martynka-ops
    install -m 755 -o root -g root "$OPS_SRC_DIR/martynka-ops-root" /usr/local/sbin/martynka-ops-root
    ok "/usr/local/sbin/martynka-ops and martynka-ops-root installed"

    SUDOERS_TMP="$(mktemp)"
    printf '%s\n' "# Installed by deploy/bootstrap.sh --ops-pubkey: $OPS_USER runs only the martynka-ops root helper." \
        "$OPS_USER ALL=(root) NOPASSWD: /usr/local/sbin/martynka-ops-root" > "$SUDOERS_TMP"
    visudo -cqf "$SUDOERS_TMP" || { rm -f "$SUDOERS_TMP"; echo "generated sudoers rule does not parse" >&2; exit 1; }
    install -m 440 -o root -g root "$SUDOERS_TMP" "$OPS_SUDOERS"
    rm -f "$SUDOERS_TMP"
    visudo -cq || { echo "sudoers does not parse after installing $OPS_SUDOERS" >&2; exit 1; }
    ok "sudoers rule for $OPS_USER installed"

    cat > "$OPS_SSHD_FILE.tmp" <<SSHD
# Martynka urządza: agent account is limited to the martynka-ops forced command.
Match User $OPS_USER
    ForceCommand /usr/local/sbin/martynka-ops
    DisableForwarding yes
    PermitTTY no
    PasswordAuthentication no
    KbdInteractiveAuthentication no
    AuthenticationMethods publickey
SSHD
    if [[ -f "$OPS_SSHD_FILE" ]] && cmp -s "$OPS_SSHD_FILE.tmp" "$OPS_SSHD_FILE"; then
        rm -f "$OPS_SSHD_FILE.tmp"
        skip "sshd Match block for $OPS_USER unchanged"
    else
        mv "$OPS_SSHD_FILE.tmp" "$OPS_SSHD_FILE"
        chmod 644 "$OPS_SSHD_FILE"
        if sshd -t; then
            systemctl reload ssh 2>/dev/null || systemctl reload sshd
            ok "sshd Match block for $OPS_USER installed and sshd reloaded"
        else
            echo "sshd -t failed; removing $OPS_SSHD_FILE and NOT reloading sshd" >&2
            rm -f "$OPS_SSHD_FILE"
            exit 1
        fi
    fi

    if [[ -d "$OPS_SRC/.git" ]]; then
        git -C "$OPS_SRC" fetch -q origin main && git -C "$OPS_SRC" merge -q --ff-only origin/main
        ok "$OPS_SRC at $(git -C "$OPS_SRC" rev-parse --short HEAD)"
    else
        git clone -q --branch main "$REPO_URL" "$OPS_SRC"
        ok "$OPS_SRC cloned at $(git -C "$OPS_SRC" rev-parse --short HEAD)"
    fi

    install -d -m 700 -o root -g root "$OPS_CONF_DIR"
    CONF_TMP="$(mktemp)"
    printf 'SITE=%q\nBIND=%q\nCI_PUBKEY=%q\nOPS_PUBKEY=%q\n' "$SITE" "$BIND" "$CI_PUBKEY" "$OPS_PUBKEY" > "$CONF_TMP"
    install -m 600 -o root -g root "$CONF_TMP" "$OPS_CONF"
    rm -f "$CONF_TMP"
    ok "$OPS_CONF written"
fi

# 8. diagnostics ---------------------------------------------------------------
echo
echo "--- diagnostics"
echo "caddy:      $(caddy version | awk '{print $1}'), $(systemctl is-active caddy)"
echo "listeners:  $(ss -ltnp 2>/dev/null | grep -E ':80 |:443 ' | awk '{print $4, $6}' | tr '\n' ';')"
echo "tailscale:  $(tailscale serve status 2>/dev/null | head -3 | tr '\n' ' ' || echo 'n/a')"
echo "releases:   $(ls -1 "$MARTYNKA_ROOT/releases" 2>/dev/null | wc -l) in $MARTYNKA_ROOT/releases; current -> $(readlink "$MARTYNKA_ROOT/current" 2>/dev/null || echo '(none yet)')"
echo "site:       $SITE_BLOCK (first release will be served after the CI deploy)"
if [[ -n "$OPS_PUBKEY" ]]; then echo "ops:        $OPS_USER ready, source $(git -C "$OPS_SRC" rev-parse --short HEAD 2>/dev/null)"; fi
sleep 5
echo "caddy log (last minute, certificates/errors):"
journalctl -u caddy --since -1min --no-pager 2>/dev/null | grep -iE 'certificate|error|obtain' | tail -8 | sed 's/^/  /' || true
echo "done."
