#!/usr/bin/env bash
# Local test of deploy/martynka-deploy: switch, prune, rollback, validation,
# status. Runs in a temporary directory; needs only bash and coreutils.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DISPATCH="$HERE/martynka-deploy"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/martynka-deploy-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

export MARTYNKA_ROOT="$TMP"
export MARTYNKA_KEEP=5
mkdir -p "$TMP/releases"

run() {
    SSH_ORIGINAL_COMMAND="$1" bash "$DISPATCH"
}

assert() {
    local name="$1"; shift
    if ! "$@"; then
        echo "FAIL: $name" >&2
        exit 1
    fi
}

ids=()
# Releases arrive one at a time (as CI uploads them) and are switched to in order.
for i in 1 2 3 4 5 6 7; do
    id="20261011T00000${i}Z-abc000${i}"
    mkdir -p "$TMP/releases/$id"
    echo "<title>Martynka urządza $i</title>" > "$TMP/releases/$id/index.html"
    ids+=("$id")
    out="$(run "switch $id")"
    assert "switch prints id ($id)" test "$out" = "switched to $id"
done

assert "current points to last release" test "$(readlink "$TMP/current")" = "releases/${ids[6]}"
count="$(ls -1 "$TMP/releases" | wc -l | tr -d ' ')"
assert "prune keeps 5 newest" test "$count" -eq 5
assert "oldest release pruned" test ! -d "$TMP/releases/${ids[0]}"
assert "previous recorded" test "$(cat "$TMP/.previous")" = "${ids[5]}"

# rollback goes to previous, and previous becomes the one we left
out="$(run rollback)"
assert "rollback output" test "$out" = "switched to ${ids[5]}"
assert "rollback target" test "$(readlink "$TMP/current")" = "releases/${ids[5]}"
assert "previous after rollback" test "$(cat "$TMP/.previous")" = "${ids[6]}"

# validation
if run "switch not-a-release" 2>/dev/null; then
    echo "FAIL: bad id accepted" >&2; exit 1
fi
if run "switch 20261011T000099Z-deadbee" 2>/dev/null; then
    echo "FAIL: missing release accepted" >&2; exit 1
fi
if run "bash" 2>/dev/null; then
    echo "FAIL: arbitrary command accepted" >&2; exit 1
fi
if run "switch ../etc" 2>/dev/null; then
    echo "FAIL: traversal accepted" >&2; exit 1
fi

# status mentions current
assert "status shows current" bash -c "SSH_ORIGINAL_COMMAND=status bash '$DISPATCH' | grep -q 'current:  ${ids[5]}'"

# permissions: files readable by others after switch
assert "index readable" test "$(stat -f '%Lp' "$TMP/releases/${ids[5]}/index.html" 2>/dev/null || stat -c '%a' "$TMP/releases/${ids[5]}/index.html")" = "644"

echo "OK"
