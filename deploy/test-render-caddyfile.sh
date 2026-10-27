#!/usr/bin/env bash
# Local test of deploy/render-caddyfile.sh: the site file for plain domain, IP,
# landing + game under a path and the old-domain redirect. Needs bash, node;
# validates with Docker (caddy:2.10) when it is available.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RENDER="$HERE/render-caddyfile.sh"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/martynka-render-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
BIND=179.198.222.94

fail() { echo "FAIL: $*" >&2; exit 1; }

contains() { # name text needle
    grep -qF -- "$3" <<<"$2" || fail "$1: missing [$3] in:
$2"
}
lacks() {
    ! grep -qF -- "$3" <<<"$2" || fail "$1: unexpected [$3] in:
$2"
}

validate() { # name text
    if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
        echo "skip: caddy validate for $1 (no docker)"
        return 0
    fi
    mkdir -p "$TMP/sites"
    printf '%s\n' "$2" > "$TMP/sites/martynka.caddy"
    docker run --rm -v "$TMP/sites:/etc/caddy/sites:ro" caddy:2.10 \
        caddy validate --adapter caddyfile --config /etc/caddy/sites/martynka.caddy >/dev/null 2>"$TMP/err" \
        || fail "$1: caddy validate failed: $(tail -5 "$TMP/err")"
}

# The cache rules of the game, exactly as in deploy/Caddyfile.
CACHE_RULES=(
    '@immutable path /_app/*'
    'header @immutable Cache-Control "public, max-age=31536000, immutable"'
    '@nocache path / /index.html /sw.js /manifest.webmanifest'
    'header @nocache Cache-Control "no-cache"'
    'header /manifest.webmanifest Content-Type "application/manifest+json"'
)

test_domain_matches_today() {
    local out; out="$(bash "$RENDER" --site martynka-urzadza.pl --bind $BIND)"
    contains domain "$out" 'martynka-urzadza.pl {'
    contains domain "$out" "bind $BIND"
    contains domain "$out" 'root * /srv/martynka/current'
    for r in "${CACHE_RULES[@]}"; do contains domain "$out" "$r"; done
    contains domain "$out" 'www.martynka-urzadza.pl {'
    contains domain "$out" 'redir https://martynka-urzadza.pl{uri} permanent'
    ! grep -qE '^ +profile shortlived$' <<<"$out" || fail "domain: IP-only tls block"
    # Same block as the template on main (the live server must not change).
    local old; old="$(git -C "$HERE" show main:deploy/Caddyfile 2>/dev/null || true)"
    if [[ -n "$old" ]]; then
        local expect; expect="$(sed -e 's|__SITE__|martynka-urzadza.pl|' -e "s|__BIND__|$BIND|" -e '/__TLS__/d' <<<"$old")"
        [[ "$out" == "$expect"$'\n\nwww.martynka-urzadza.pl {'* ]] || fail "domain: differs from today's template"
    fi
    validate domain "$out"
}

test_subdomain_has_no_www() {
    local out; out="$(bash "$RENDER" --site bystrow.ariom.cloud --bind $BIND)"
    contains subdomain "$out" 'bystrow.ariom.cloud {'
    lacks subdomain "$out" 'www.bystrow'
    validate subdomain "$out"
}

test_app_path_and_landing() {
    local out; out="$(bash "$RENDER" --site bystrow.ariom.cloud --bind $BIND --app-path /graj/ --landing-root /srv/bystrow-landing/current)"
    contains app "$out" 'redir /graj /graj/ permanent'
    contains app "$out" 'handle_path /graj/* {'
    contains app "$out" 'root * /srv/martynka/current'
    for r in "${CACHE_RULES[@]}"; do contains app "$out" "$r"; done
    contains app "$out" 'handle {'
    contains app "$out" 'root * /srv/bystrow-landing/current'
    contains app "$out" 'max-age=604800'
    lacks app "$out" 'www.'
    validate app "$out"
}

test_redirect_from() {
    local out; out="$(bash "$RENDER" --site bystrow.ariom.cloud --bind $BIND --app-path /graj/ --landing-root /srv/bystrow-landing/current --redirect-from martynka-urzadza.pl)"
    contains redirect "$out" 'martynka-urzadza.pl, www.martynka-urzadza.pl {'
    contains redirect "$out" 'handle /sw.js {'
    contains redirect "$out" 'root * /srv/martynka/legacy'
    contains redirect "$out" 'redir https://bystrow.ariom.cloud/graj{uri} permanent'
    [[ "$(grep -c 'root \* /srv/martynka/current' <<<"$out")" -eq 1 ]] || fail "redirect: game must be served only under the new site"
    [[ "$(grep -c "bind $BIND" <<<"$out")" -eq 2 ]] || fail "redirect: both blocks must bind $BIND"
    validate redirect "$out"
}

test_kill_switch_js() {
    node --check "$HERE/sw-kill-switch.js" || fail "kill switch: syntax"
    for w in unregister caches.delete navigate skipWaiting; do
        grep -qF "$w" "$HERE/sw-kill-switch.js" || fail "kill switch: missing $w"
    done
}

test_ip_mode() {
    local out; out="$(bash "$RENDER" --site 179.198.222.94 --bind $BIND)"
    contains ip "$out" 'https://179.198.222.94 {'
    grep -qE '^ +profile shortlived$' <<<"$out" || fail "ip: no shortlived profile"
    lacks ip "$out" 'www.'
    validate ip "$out"
}

test_flags_paired() {
    local rc
    for args in "--app-path /graj/" "--landing-root /srv/x" "--app-path graj --landing-root /srv/x" "--app-path /graj --landing-root /srv/x"; do
        rc=0
        # shellcheck disable=SC2086
        bash "$RENDER" --site bystrow.ariom.cloud --bind $BIND $args >/dev/null 2>&1 || rc=$?
        [[ "$rc" -eq 2 ]] || fail "flags: [$args] exited $rc, expected 2"
    done
}

for t in test_domain_matches_today test_subdomain_has_no_www test_app_path_and_landing test_redirect_from test_kill_switch_js test_ip_mode test_flags_paired; do
    "$t"
    echo "ok   $t"
done
echo "OK"
