# Handoff — `final-sound` (slice S-16b)

Written by `/10x-impl-review final-sound` of run 2026-10-15-fix-s16bcd. The review is done (MERGE: CLEAR with one condition), change.md is `impl_reviewed`, four warnings are fixed in two `fix(final-sound)` commits. Do not get wrong: the reviewer did NOT observe a full e2e run on the last sha 82860d2 (Chromium stopped launching in this session) — the orchestrator must run it and see 109 passed before the visual gate is closed and the slice ships.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | docs + p1..p10 + handoffs, then `a15adf7` (fix: review fixes), `82860d2` (fix: reset spec waits for the reload), and this `docs(final-sound): impl review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 3: [human] 9.7, 10.6; [visual] 7.4 (all [reviewer] rows ticked: 1.4, 2.4, 3.4, 4.4, 5.5, 6.3, 7.5, 8.3) |
| Working tree | clean after the review commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/reviews/impl-review.md` | the review report (8 findings, Phaser 4.2.1 source checks, reviewer rows, MERGE line) |
| `src/data/pl.ts` (`settings.soundMissing`), `tests/artHealthText.test.ts` | F1: verb and pronoun agree with the count (test-first) |
| `src/ui/sound.ts` (`createSoundService` → `stopMusic`), `tests/soundMusic.test.ts` | F2: music turned off while waiting for the unlock ends as `off` and starts again (test-first) |
| `CLAUDE.md` (S-16a sentence), `docs/design-gaps.md` (row 114) | F3: stale `playPurchaseSound` note; gap row notes the agreement |
| `context/changes/final-sound/e2e-request-p10.md` | removed (its own text said to drop it; it still said p10b/p10c "NOT RUN") |
| `tests/e2e/save-transfer.spec.ts` ("#2 reset asks first …") | F4: the confirm tap wrapped in `reloadedBy` |
| `context/changes/final-sound/plan.md`, `change.md`, `handoff.md` | reviewer rows ticked, status, this file |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK (5360ec1 and after the fixes) |
| `npm test` on 5360ec1 | 3029 passed = baseline 2970 + 59 |
| `npm test` after a15adf7 | 3034 passed = baseline 2970 + 64 (+5 review tests) |
| deploy tests, ops tests, `sample` E1-E6 | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS (412 paths) |
| e2e full `--workers=4` on 5360ec1 and on a15adf7 (reviewer) | 108 passed + 1 failed each time: `save-transfer.spec.ts` "#2 reset asks first and ends on the welcome screen" (`Execution context was destroyed`) |
| reset test `--repeat-each` | branch before F4: 1/3; main a1625be (temporary worktree, removed): 6/6; branch 82860d2: 6/6 |
| e2e full on 82860d2 | NOT observed: Chromium no longer launched in this session (every test failed in 1 ms, twice); expected 109 = 104 + 5 (final-sound 3, final-sound-failure 2) |
| Phase 3 RED re-executed | main's `errorSignal.ts` + `loaderCut.ts` with branch tests: 2 assertion failures (`expected true to be false`; `called 1 times, but got 2 times`); restored, 11/11. Meta: assertion, not import error |
| F1 / F2 RED | new tests red on the branch code (`Nie wczytało się 1 dźwięk` vs `Nie wczytał się`; `expected 'loading' to be 'off'`), green after the fix |
| invariants | `SAVE_VERSION` 3; `git diff main -- tests/fixtures docs/human-checklist.md deploy vite .gitignore designs .claude` empty; 26 sound files byte-identical to the pack (`cmp`) |

Servers 4397/4398 killed; no other server started.

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- The orchestrator's full `npx playwright test --workers=4` on 82860d2 must show 109 passed (MERGE condition).
- [visual] 7.4: "Dźwięki" section of the settings panel at 1440 and 1024, missing line hidden on a healthy start.
- [human] 9.7: iPad listening (unlock on first touch, effects with speech, volume, music loop click, silent switch; author decisions: `purchase` on a free change, one `answer-retry`, `tap` + `round-bonus`).
- [human] 10.6: iPad offline, sounds from the cache.
- Observations recorded only (impl-review F5-F8): `NotSupportedError` quiet for every rejection (`QUIET_REJECTIONS` in `src/core/errorSignal.ts`), Chromium may decode OGG not M4A, `purchase` + `room-done` overlap at the last purchase (`RoomScene.dispatch`/`showCard`), precache +1.1 MB. Follow-ups with triggers stay in `follow-ups/review-fixes.md` (unchanged).

## 6. Autonomous decisions

- F4 fixed in the spec (wait for the reload with `reloadedBy`) rather than in the product: the reset works (it reaches the welcome screen); the failure is a hook read during navigation, a latent race on main exposed by the branch timing (main 6/6, branch 1/3). Rejected: making `readHook` swallow navigation errors globally (wider change to every spec). Would change: the reset failing to reach the welcome screen after the wait, or the race appearing in other reload specs.
- F2 fixed although rare on a tablet (the parent's taps unlock the context before the panel opens): one line plus a test, and a stuck "loading" would silently keep the music off for the session. Would change: nothing.
- `e2e-request-p10.md` removed in the fix commit: the request protocol says to drop it after the orchestrator's run, and it contradicted the ticked rows. Would change: an orchestrator rule to keep request files.
- MERGE: CLEAR with a condition instead of BLOCKED: every finding is fixed, the only gap is an environment failure (Chromium launch) for the final full run, which the orchestrator runs at every gate anyway. Would change: that run showing anything other than 109 passed.
