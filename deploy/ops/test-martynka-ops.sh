#!/usr/bin/env bash
# Local test of deploy/ops/martynka-ops (the forced-command shim). Uses a fake
# root helper, a fake sudo and a no-op logger in a temporary directory.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHIM="$HERE/martynka-ops"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/martynka-ops-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/bin"
cat > "$TMP/bin/sudo" <<'EOF'
#!/usr/bin/env bash
[ "$1" = "-n" ] && shift
exec "$@"
EOF
cat > "$TMP/bin/logger" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
cat > "$TMP/fake-root" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$@"
EOF
chmod +x "$TMP/bin/sudo" "$TMP/bin/logger" "$TMP/fake-root"

run() {
    PATH="$TMP/bin:$PATH" MARTYNKA_OPS_ROOT="$TMP/fake-root" SSH_ORIGINAL_COMMAND="$1" bash "$SHIM"
}

assert_eq() {
    local name="$1" expected="$2" actual="$3"
    if [[ "$expected" != "$actual" ]]; then
        echo "FAIL: $name: expected [$expected], got [$actual]" >&2
        exit 1
    fi
}

assert_rejected() {
    local name="$1" cmd="$2"
    if run "$cmd" >/dev/null 2>&1; then
        echo "FAIL: $name: accepted [$cmd]" >&2
        exit 1
    fi
}

assert_eq "help forwarded" "help" "$(run help)"
assert_eq "two words forwarded as two args" $'caddy-logs\n10m' "$(run 'caddy-logs 10m')"
assert_eq "switch id forwarded" $'switch\n20261011T192729Z-e6da12a' "$(run 'switch 20261011T192729Z-e6da12a')"
assert_eq "extra spaces collapsed" $'status' "$(run '  status  ')"

assert_rejected "empty" ""
assert_rejected "semicolon" "status; id"
assert_rejected "pipe" "status | cat"
assert_rejected "quote" "switch 'x'"
assert_rejected "glob" "switch *"
assert_rejected "too many words" "a b c d"
assert_rejected "newline" $'status\nid'

# martynka-ops-root bootstrap passes the page flags from ops.conf only when set.
# The helper's fixed paths are rewritten to a temporary clone and conf.
mkdir -p "$TMP/src/deploy"
cat > "$TMP/src/deploy/bootstrap.sh" <<'EOS'
#!/usr/bin/env bash
printf '%s\n' "$@"
EOS
git -C "$TMP/src" init -q
git -C "$TMP/src" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
sed -e "s|^SRC=.*|SRC=\"$TMP/src\"|" -e "s|^CONF=.*|CONF=\"$TMP/ops.conf\"|" "$HERE/martynka-ops-root" > "$TMP/ops-root"

write_conf() {
    printf 'SITE=%s\nBIND=1.2.3.4\nCI_PUBKEY=%q\nOPS_PUBKEY=%q\n%s' "$1" "ssh-ed25519 AAAA ci" "ssh-ed25519 BBBB ops" "$2" > "$TMP/ops.conf"
}
bootstrap_args() { bash "$TMP/ops-root" bootstrap | tail -n +2 | tr '\n' ' '; }

write_conf martynka-urzadza.pl ''
assert_eq "bootstrap without page flags" "--site martynka-urzadza.pl --bind 1.2.3.4 --ci-pubkey ssh-ed25519 AAAA ci --ops-pubkey ssh-ed25519 BBBB ops " "$(bootstrap_args)"
write_conf bystrow.ariom.cloud $'APP_PATH=/graj/\nLANDING_ROOT=/srv/bystrow-landing/current\nREDIRECT_FROM=martynka-urzadza.pl\n'
assert_eq "bootstrap with page flags" "--site bystrow.ariom.cloud --bind 1.2.3.4 --ci-pubkey ssh-ed25519 AAAA ci --ops-pubkey ssh-ed25519 BBBB ops --app-path /graj/ --landing-root /srv/bystrow-landing/current --redirect-from martynka-urzadza.pl " "$(bootstrap_args)"

echo "OK"
