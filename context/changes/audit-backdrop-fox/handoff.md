# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-e2e` step, phase 6 (last phase), of run 2026-10-24-audit-backdrop-fox: a missing fox pose hides the fox and is named in "Obrazki". Rows 6.2 and 6.3 (full e2e count, full gate) are the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | 18e7eff (spec, p6), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | implemented |
| `## Progress` rows | 6.1 ticked with 18e7eff; 6.2, 6.3 left; earlier open rows 1.5, 2.4, 3.5, 4.6-4.10, 5.2, 5.3 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/fox-guide.spec.ts` | new `describe('one pose missing')` (aborts `fox-think.webp`, service worker blocked): `#11 one missing pose hides the fox in every phase`, `#14 the pictures section names the missing fox` |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/fox-guide.spec.ts --workers=1` | 7 passed (5 old + 2 new) |
| break 1: `GuideFox.show` checks `textures.exists(key)` per pose instead of `available`, constructor `recordFallback` dropped | both new tests red (fox visible at idle; `guideMissing` line absent); restored |
| break 2: drop `recordFallback(scene, 'guide', 'none')` only | both new tests red (`artFallbacks.guide` assertion; panel line); restored |
| break 3: drop `noStandIn` from `UIScene` | only the `#14` test red (exact `uiArtMissing(1, total, false)` line); restored |
| lint, typecheck | green |
| full e2e, unit, build | not run (orchestrator) |

Break 2 also reddens the #11 test because it asserts `artFallbacks.guide === 'none'`.

## 4. Next command

`/10x-impl-review audit-backdrop-fox`

## 5. Open

- Rows 6.2, 6.3, 5.2, 5.3 and the earlier 1.5, 2.4, 3.5, 4.6-4.10 wait for the orchestrator's full e2e / human / visual / reviewer. Expected e2e total: branch baseline + 3 (phase 5) + 2 (phase 6). `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **E-1 Lose handle**: `getExtension('WEBGL_lose_context')` returns null on a lost context, so the extension object is kept from the loss call and reused for `restoreContext()`. Would change: never (browser rule).
- **E-2 ROUND_SPEC**: new spec added to the regex so it runs on the hook build (port 4397), as earlier runs did.
- **E-3 Welcome tap**: the age tap after restore uses the hook's `ages` targets directly (not `passWelcomeAsChild`, which reloads the page).

- **E-4 Phase 6 break proof**: the "per-pose check" break was applied with the constructor rule dropped, as the plan says. Would change: never.
