# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-implement` phase 11 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-11 are committed. Do not get wrong: save format stays v4 (fixtures, `deploy/`, `.github/` untouched); the hook field `unreachable` is read-only e2e state; phases 12-14 are `Driver: e2e` and prove browser-level risks.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-10 with handoffs, phase 11 (`feat(health-lines-and-smoke): Unreachable slots in the hook, docs and seam sweep (p11)`, sha in `git log`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (rows 11.1-11.5 ticked; 11.6 and 11.7 [reviewer], 11.8 [human] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/roomHit.ts` | `unreachableSlots(room, chosen, alphaAt?)` pure; `src/scenes/RoomScene.ts` `RoomSnapshot.unreachable` (e2e hook reads it through `room.snapshot`) |
| `src/pwa/registerServiceWorker.ts` | seam sweep: one `nameOf(error)` instead of three inline copies |
| `CLAUDE.md` | one "Health lines and deploy smoke" paragraph at the end of "Current state"; every name checked with grep in `src/`, `scripts/`, `vite/` |
| `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` | 14 deferred items, 14 `Trigger:` lines (incl. O-1(b), the `deploy/` half of 2217 P-4, A-6, A-8, L-7, `FontFace`, VO3, O-3 on return, B-6 measurement) |
| `tests/roomHit.test.ts` | `unreachableSlots` case |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3653 passed = 3652 + 1; deploy scripts OK; samples exit 0 |
| first RED | new case imports a function that did not exist (red by import before the change) |
| break | `unreachableSlots` filter made `false &&` (always empty): `AssertionError: expected [] to deeply equal [ 'armchair', 'cabinet', …(9) ]`, 1 red; restored, 25 green |
| meta-check | proves the field logic over an alpha that hits nothing; the real salon gives `[]` in the same case, the browser assertion is phase 12 |
| `validate-rule-files.sh` | PASS; a broken path in `CLAUDE.md` (`roomHitX.ts`) gave FAIL (missing: 1); restored, PASS |
| follow-ups | 14 entries = 14 `Trigger:` lines |
| save invariants | `SAVE_VERSION` 4; `git diff --stat main -- tests/fixtures deploy .github` empty |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 131 passed + known flake final-art-loading #15 (red once under load, green alone: 2 passed); total 132 = `playwright --list` 132; baseline 132 + 0; `playwright --list` 132 |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), after the run: empty |

Seam sweep (phases 1-10, `git diff main...HEAD`): one `isLocalHost`, one `errorName` in `save.ts` (the service-worker file had three inline copies, now `nameOf`); no "Task art failed to load" or "Music missing as the only cause" left (music warns carry the cause); the only `delayedCall` in `BootScene` is the hand-over to the next scene, not a limit; gap rows 139-150 are in order and present; every new registry key carries "runtime only, not in SAVE_KEYS"; the Phaser-internal use (`AudioFile.onProcess`, loader paths) is pinned by `tests/phaserLoaderPin.test.ts`. Recorded, not changed: the "Uruchom grę ponownie" strings that remain in `src/data/pl.ts` belong to the save and card sections, not to "Obrazki".

## 4. Next command

`/10x-e2e health-lines-and-smoke phase 12`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5, 11.6, 11.7; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Phases 12-14 (e2e): write-fail purchase and every chosen slot reachable (use `room.unreachable` from the snapshot), stalled/broken picture and missing font, sound lines.

## 6. Autonomous decisions

1. **Hook field as a pure `unreachableSlots` in `roomHit.ts`** (not a scene-only method), so a unit test proves it. Would change: reviewer wants it beside `slotTargets`.
2. **Follow-ups file has 14 entries**, adding one for the two phase-10 decisions (import preview note, `roomGrowth` range). Would change: reviewer drops it.
3. **CLAUDE.md paragraph appended to the "Current state" line** rather than a new line, matching the neighbours. Would change: nothing.
4. **Commit message proposed as given**, one commit for the phase plus a separate handoff commit. Would change: nothing.
