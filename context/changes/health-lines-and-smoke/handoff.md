# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 1 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phase 1 (deploy smoke asks for every
precached file) is committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, `registration.update()` runs once
per launch only, an `xhrLoader.status` 0 is the `network` cause, never "not on the server".

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phase 1 (`test(health-lines-and-smoke): … (p1)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 66 (71 minus rows 1.1–1.5, ticked) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/deploy-check/parse.ts` | new pure helpers `EXPECTED_TYPES`, `entryVerdict`, `precacheServed`, `precacheCovers`, `isLocalHost`, `failLine`; `roomArtCheck` kept untouched |
| `scripts/check-deploy.ts` | HEAD pool (8, 15 s `AbortSignal.timeout`, one retry), table checks under `if (sha7)`, hard-coded salon GET removed, `get` names the path, localhost skips the immutable check and `www` |
| `tests/deployCheck.test.ts` | 9 new tests over recorded responses (no network) |
| `context/changes/health-lines-and-smoke/plan.md` | rows 1.1–1.5 ticked |

## 3. Verification

| command | result |
|---|---|
| first RED (stubs returning wrong values) | `AssertionError: expected false to be true` (accepts 200 with the expected media type); `expected 'stub' to be 'timeout'` |
| `npx vitest run tests/deployCheck.test.ts` | 16 passed (7 old + 9 new) |
| break 1: `entryVerdict` ignoring the type | 1 failed (`expected true to be false`, the text/html-for-.webp case); restored |
| break 2: `precacheCovers` ignoring the last url | 1 failed (`expected true to be false`); restored. Meta: proves the verdict over recorded responses, not that Caddy still answers so |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1–E6 | Tests 3554 passed = baseline 3545 + 9 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| local smoke, `vite preview` on 4398, no SHA | `precache served: 121/121`, `all 16 checks ok`; with a fake SHA: four table lines ok (41/41, 5/5, 38/38, 24/24), only `build id` failed (fake sha); server killed |
| live smoke, rollback mode, once, `https://martynka-urzadza.pl` | last lines: `ok www redirects to apex — 301 → https://martynka-urzadza.pl/` / `all 17 checks ok` |
| `git diff --stat main -- deploy .github` | empty |
| e2e `--workers=4` | 132 passed (11.0m) = baseline 132 + 0, no flakes |
| stray processes | `ps -U $(id -u) … | grep -E 'sleep|until|while|playwright|vite'` empty; ports 4397/4398 free |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 2`

## 5. Open

- [reviewer] rows 1.6, 1.7 (CI at ship) not mine. [human] rows 2.6, 4.6, 8.6, 11.8 as before.
- Local `vite preview` answers 200 `text/html` for a missing file; the type assertion catches it.

## 6. Autonomous decisions

1. **Stubs before RED**: added stub helpers to `parse.ts` so the RED was an assertion failure, not an import error.
2. **Commit only the planned set**, stop after phase 1, message accepted as proposed. Would change: nothing.
3. **`roomArtCheck` left unchanged** next to `precacheCovers` (its test and name keep passing); the script now uses `precacheCovers('room pictures', …)`, so the old name is unused in the script. Would change: a wish to delete it.
4. **`Error` cause via `Object.assign`** because the tsconfig lib lacks the `ErrorOptions` overload.
