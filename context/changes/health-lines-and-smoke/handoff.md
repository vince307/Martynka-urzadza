# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-impl-review` step of run `2026-10-16-audit-sweep`. The review is done and its fixes are committed (06c6a63). `change.md` status is `impl_reviewed`. Do not get wrong: save format stays v4. Rows 1.7 and 11.7 are proved by CI at ship, not before.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-14 with handoffs, review fix `fix(health-lines-and-smoke): poprawki po przeglądzie …` (06c6a63), this handoff commit `docs(health-lines-and-smoke): impl review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 12 open: [reviewer] (CI at ship) 1.7, 11.7; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/health-lines-and-smoke/reviews/impl-review.md` | full-plan review, phases 1-14. Verdict APPROVED after fixes: 2 critical (fixed), 5 warnings (4 fixed, 1 follow-up), 3 observations |
| `scripts/check-deploy.ts` | `GET_TIMEOUT_MS` (60 s) on `get` and the `www` fetch (F1) |
| `src/scenes/BootScene.ts` | `create` reads `document.fonts` in `try` (F2); `preload` `arm` rethrows a failed cut to the error boundary (F3) |
| `src/ui/sound.ts` | `record`: a `played` outcome resets `lockedCount` (F4) |
| `tests/soundMusic.test.ts` | new test "forgets the swallowed effects once a sound plays…" |
| `src/pwa/registerServiceWorker.ts` | comment at `update()` corrected (F6) |
| `docs/design-gaps.md` | rows 114 and 120 now point to 148-149 (F5) |
| `CLAUDE.md` | the health-lines paragraph names only `?e2eArt=ui` as a new seam (F5) |
| `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` | follow-ups 15-19, each with a `Trigger:` line (19 entries, 19 triggers) |
| `context/changes/health-lines-and-smoke/plan.md` | [reviewer] rows 1.6, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5, 11.6 ticked |
| `context/changes/health-lines-and-smoke/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK (before and after the fixes) |
| `npm test` + deploy scripts + `sample` E1-E6 | Before the fixes: Tests 3653 passed = contract baseline 3545 + 108. The per-phase deltas from the handoffs add up: 9+2+6+11+7+11+6+11+20+24+1 = 108. After the fixes: 3654 (+1 new test). Deploy scripts OK. Samples OK. |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -c 'missing-on-purpose\|stallall' dist/_app/*.js` = 0 |
| e2e `--workers=4`, run 1 (before fixes) | 139 passed (11.8 m) = contract baseline 132 + 7 (p12 +1, p13 +3, p14 +3), no flakes |
| e2e `--workers=4`, run 2 (after fixes) | 139 passed (11.6 m), no flakes |
| live smoke, rollback mode (no SHA), read-only against https://martynka-urzadza.pl | `precache served: 121/121`, `all 17 checks ok` (4.2 s). Same result again after F1. |
| smoke with SHA against `vite preview` of this build (port 4399, fake SHA `abcdef1`) | 4 table lines ok (task 41/41, screen 5/5, room 38/38, boot sounds 24/24); `precache served: 121/121`; immutable `skipped on localhost`. Only `build id` FAIL, which is expected with a fake SHA. Server killed. |
| `validate-rule-files.sh` | PASS (460 paths) |
| break 1 (tdd p2): `offlineView` without the `updateFailed` branch | RED by assertion: `expected { line: 'ready' } to deeply equal { line: 'updateFailed' }`; restored |
| break 2 (tdd p1): `entryVerdict` ignores the media type | RED by assertion: `fails a 404 and an SPA fallback …` `expected true to be false`; restored |
| break 3 (e2e p14a): `CoinWallet` without `recordFallback` | `#14 U-1 a missing wallet …` RED by assertion: Expected "drawn", Received undefined; restored |
| F4 test | RED first (`expected 3 to be +0`), green after the fix |
| meta-check | Breaks 1 and 2 prove the pure rules: the view and the verdict over recorded responses. Caddy's real answers are proved by the live run. Break 3 proves that the widget writes the record the panel reads. F2 and F3 have no automated proof (no DOM env, no browser without `document.fonts`); `load-and-tab-guard` and `error-boundary` stay green. |
| no-waiters `ps` (sandbox disabled) | nothing of mine (checked before the report) |
| `git diff main...HEAD -- deploy .github vite/config.shared.mjs tests/fixtures` | empty; `SAVE_VERSION` 4 |

## 4. Next command

`visual gate ("Obrazki" lines, "Dźwięki" lines, "Gra bez internetu" update-failed, salon carry line) then /10x-archive health-lines-and-smoke`

## 5. Open

- [reviewer] (CI at ship):
  - **1.7**: workflow `Deploy`, job `deploy`, step `Smoke check (deploy)`. The log must match `all [0-9]+ checks ok` and contain `precache served: 121/121`, or n/n for the count at that time.
  - **11.7**: workflow `CI`, job `check`. The log must show `e2e hook: absent (2 chunks checked)` and `Tests  3654 passed`.
- [visual] rows: 2.5, 5.5, 6.5, 7.5, 8.5, 10.6.
- [human] rows:
  - 2.6: accept that the update check runs only at launch.
  - 4.6: optional throttled Android cold start.
  - 8.6: real iPad, 3 locked touches.
  - 11.8: wording of gaps 139-150.
- Follow-ups 1-19 are in `follow-ups/review-fixes.md`. New in this step:
  - 15: purchase flush in `RoomScene.dispatch` is not browser-proved.
  - 16: the A-9 round skip is unit-proved only.
  - 17: dead helpers `roomArtCheck`, `bootLoadPhase`, `sectionState`, `parseSoundPrefs`, and `nameOf`.
  - 18: `UI_MISSING_URL` is not a build marker.
  - 19: `startMusic` `once('addfile')`.
- Archive note: the CLAUDE.md paragraph points at `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md`. Re-point it to the archive path and run `validate-rule-files.sh` after `/10x-archive`.

## 6. Autonomous decisions

1. **F1 smoke GET limit, 60 s** (not 15 s like HEAD). It covers the body read of the 1.4 MB Phaser bundle on a slow runner. An abort becomes a fetch error, so `get('/', RETRIES)` keeps its certificate retries. Rejected: adding `timeout-minutes` to `deploy.yml`, which is out of scope since no `.github/` change is allowed. Would change: a Deploy log showing a GET near 60 s.
2. **F3 rethrow instead of a narrower catch.** The slow line already has its own `try`, so only a failed cut reaches the outer catch. Rethrowing restores the error-boundary card that the old `delayedCall` path gave. Would change: the error boundary treating timer errors as noise.
3. **F4 reset on `played`.** Chosen over passing the live `locked` into `effectsLine`, because one place covers both lines and the existing pure tests stay. Would change: a device that plays one sound and then locks again, which would need the live flag.
4. **F7 accepted as follow-up 15**, not fixed now: a browser test of a 500 ms window would be timing-flaky. Would change: a seam that makes the debounce inert in the hook build.
5. **[reviewer] rows ticked** only after the checks in the report passed. 1.7 and 11.7 stay open for the ship step.
6. **The follow-ups were appended with a shell heredoc**, not the Edit tool as the step prompt asked. The content was checked afterwards: 19 entries, 19 `Trigger:` lines.

MERGE: CLEAR — both CRITICAL findings are fixed and every suite is green after the fixes (unit 3545 + 109, e2e 132 + 7, live rollback smoke 17/17). Only follow-ups, [visual] and [human] rows remain.
