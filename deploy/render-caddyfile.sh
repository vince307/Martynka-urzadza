#!/usr/bin/env bash
# Renders the site file /etc/caddy/sites/martynka.caddy to stdout.
#
#   render-caddyfile.sh --site <IPv4|domain> --bind <public IPv4>
#                       [--app-path /graj/ --landing-root <dir>] [--redirect-from <domain>]
#
# Without --app-path the game is served at the root of --site (the block of
# deploy/Caddyfile). With --app-path/--landing-root (always together) the game
# moves under that path and <landing-root> is served at /. --redirect-from adds
# a block that sends an old domain (and www.) permanently to the new address,
# except /sw.js, which serves the kill-switch service worker so that browsers
# with the old PWA installed drop it.
# Caddy binds only the public IPv4: tailscaled owns :443 on the tailnet addresses.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$HERE/Caddyfile"
LEGACY_ROOT="/srv/martynka/legacy"

usage() {
    echo "usage: $0 --site <IPv4|domain> --bind <IPv4> [--app-path /graj/ --landing-root <dir>] [--redirect-from <domain>]" >&2
    exit 2
}

is_ipv4() { [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; }
is_domain() { [[ "$1" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$ ]]; }

SITE="" BIND="" APP_PATH="" LANDING_ROOT="" REDIRECT_FROM=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --site) SITE="${2:-}"; shift 2 ;;
        --bind) BIND="${2:-}"; shift 2 ;;
        --app-path) APP_PATH="${2:-}"; shift 2 ;;
        --landing-root) LANDING_ROOT="${2:-}"; shift 2 ;;
        --redirect-from) REDIRECT_FROM="${2:-}"; shift 2 ;;
        -h|--help) usage ;;
        *) echo "unknown argument: $1" >&2; usage ;;
    esac
done

[[ -n "$SITE" && -n "$BIND" ]] || usage
is_ipv4 "$BIND" || { echo "--bind must be an IPv4 address" >&2; exit 2; }
is_ipv4 "$SITE" || is_domain "$SITE" || { echo "--site must be an IPv4 address or a domain" >&2; exit 2; }
if [[ -n "$APP_PATH" || -n "$LANDING_ROOT" ]]; then
    [[ -n "$APP_PATH" && -n "$LANDING_ROOT" ]] || { echo "--app-path and --landing-root go together" >&2; exit 2; }
    [[ "$APP_PATH" =~ ^/([A-Za-z0-9._-]+/)+$ ]] || { echo "--app-path must start and end with / (e.g. /graj/)" >&2; exit 2; }
    [[ "$LANDING_ROOT" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "--landing-root must be an absolute path" >&2; exit 2; }
fi
if [[ -n "$REDIRECT_FROM" ]]; then
    is_domain "$REDIRECT_FROM" || { echo "--redirect-from must be a domain" >&2; exit 2; }
fi

if is_ipv4 "$SITE"; then
    SITE_BLOCK="https://$SITE"
    TLS_MODE="ip"
else
    SITE_BLOCK="$SITE"
    TLS_MODE="domain"
fi

if [[ -z "$APP_PATH" ]]; then
    # The game at the root: the template, as it always was.
    # __TLS__ becomes a `tls { issuer acme { profile shortlived } }` block for an IP
    # address (Let's Encrypt short-lived IP certificate) and disappears for a domain.
    sed -e "s|__SITE__|$SITE_BLOCK|" -e "s|__BIND__|$BIND|" "$TEMPLATE" | awk -v mode="$TLS_MODE" '
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
        { print }'
else
    # The game under APP_PATH, a landing page at /. The game's directives are the
    # template's body (everything after the __TLS__ line, minus the closing brace),
    # so both layouts share one set of cache rules. handle_path strips the prefix,
    # so the matchers (/_app/*, /sw.js, ...) stay relative to the game.
    echo "$SITE_BLOCK {"
    echo "    bind $BIND"
    if [[ "$TLS_MODE" == "ip" ]]; then
        printf '    tls {\n        issuer acme {\n            profile shortlived\n        }\n    }\n'
    fi
    echo
    echo "    redir ${APP_PATH%/} $APP_PATH permanent"
    echo
    echo "    handle_path ${APP_PATH}* {"
    echo "        root * /srv/martynka/current"
    awk '
        found && /^}/ { exit }
        found { if ($0 == "") print; else print "    " $0 }
        /__TLS__/ { found = 1 }' "$TEMPLATE"
    echo "    }"
    cat <<EOF

    handle {
        root * $LANDING_ROOT
        encode zstd gzip

        # HTML is always revalidated; everything else it references is cached for a week.
        @html path / *.html
        header @html Cache-Control "no-cache"
        @assets not path / *.html
        header @assets Cache-Control "public, max-age=604800"

        file_server
    }
}
EOF
fi

if [[ "$TLS_MODE" == "domain" && "$SITE" =~ ^[^.]+\.[^.]+$ ]]; then
    # www.<domain> redirects to the apex; the certificate for it is issued only
    # if its DNS A record exists (Caddy retries otherwise, without blocking the apex).
    cat <<EOF

www.$SITE {
    bind $BIND
    redir https://$SITE{uri} permanent
}
EOF
fi

if [[ -n "$REDIRECT_FROM" ]]; then
    cat <<EOF

$REDIRECT_FROM, www.$REDIRECT_FROM {
    bind $BIND

    # Kill switch for browsers that installed the PWA from the old domain.
    handle /sw.js {
        root * $LEGACY_ROOT
        header Cache-Control "no-cache"
        file_server
    }

    handle {
        redir https://$SITE${APP_PATH%/}{uri} permanent
    }
}
EOF
fi
