# Handoff — `final-art-p2` (slice S-16c)

The `/10x-impl-review final-art-p2` step of autonomous run `2026-10-15-fix-s16bcd` wrote this. The review is APPROVED with `MERGE: CLEAR`: there are no critical findings, and the four warnings are fixed in `04863b9`. The visual gate comes next. It must check the painted lifted-coin cell in `CoinWallet.paint` (row 4.4), because the e2e reads only the hook. The code proves the paint and the hook use the same `liftedSlot` call.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | phases 1-11 (`afac8e1` … `b434ef7`, p5 fix `0e865d1`), review fix `04863b9`, then this docs commit (`docs(final-art-p2): impl review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 4.4, 5.4, 6.3 [visual]; 7.4, 10.4 [human] |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/final-art-p2/reviews/impl-review.md` | the full review: 9 findings (F1-F3 and F9 are WARNINGs, all fixed; F4-F8 are OBSERVATIONs), suites, teacher read, `[reviewer]` rows, the `MERGE: CLEAR` line |
| `src/scenes/BootScene.ts` (`preload`) | F1: the `Loader.Events.ADD` listener that copies the per-file xhr timeout is now registered before any file is queued. The two loading pictures had timeout 0 |
| `tests/phaserLoaderPin.test.ts` | F1 tripwire: checks that `ADD` is still emitted in `addFile` and that the listener comes before the first `this.load.<type>(` |
| `src/data/balance.ts` (`loader` comment) | F2: the byte counts now match the files (1 922 277 + 151 016 = 2 073 293 B, about 41.5 s). `totalMs` stays 45 000 |
| `CLAUDE.md`, `src/data/layout.ts` (`UNLOCK_LAYOUT`, `LOADING_LAYOUT` comments) | F3: `TASK_LAYOUT.coinDrag.art.dropCenters` in place of the wrong `dropCentres`; stale comments for gaps 22 and 105 |
| `tests/e2e/load-and-tab-guard.spec.ts` | F9: the wait for `welcome` after the cut is 15 s, as in the test next to it |
| `context/changes/final-art-p2/plan.md` | `[reviewer]` rows 1.5, 2.5, 3.4, 4.5, 5.5, 6.4, 8.3 ticked with notes |
| `context/changes/final-art-p2/follow-ups/review-fixes.md` | F4, F5, F6 added, each with a `Trigger:` |
| `context/changes/final-art-p2/change.md` | status `impl_reviewed` |

## 3. Verification

All results below were observed in this step. Baseline is main `c16734d`: unit 3034, e2e 109.

| command | result |
|---|---|
| lint, typecheck, deploy scripts, `sample` E1-E6, build at c903c12 and at 04863b9 | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npm test` at c903c12 / 04863b9 | 3062 (3034 + 28) / 3063 (3034 + 29) |
| full e2e `--workers=4` at c903c12 | 116 passed, 1 failed: `load-and-tab-guard` "#15 A-1/A-2 …" hit the default 5 s wait for `welcome` (F9) |
| boot e2e specs (`load-and-tab-guard`, `final-art-loading`, `salon-load-health`, `final-sound-failure`) on the fixed tree | 10 passed |
| full e2e `--workers=4` at 04863b9 | 117 passed (109 + 8), 8.8 min; ports 4397/4398 checked free afterwards |
| break (tdd p1): `liftedSlot` without the touched-cell branch | `coinLayout` "is the touched cell: the FIRST of two equal coins…" went red (`expected 1 to be +0`); restored, 24 passed. Meta-check: the break proves the rule. The paint uses the same call, and `stepTrayDrag` leaves `mat` unchanged while a coin is carried |
| break (F1): new tripwire run against the pre-fix `BootScene.ts` (`git stash`) | red (`expected 3799 to be less than 3467`); green with the fix. Meta-check: it proves the order in the source, not the timeout at runtime. Phaser's `addFile` emitting `ADD` synchronously is pinned in the same test |
| `validate-rule-files.sh` | PASS (416 paths) |
| `git diff main...HEAD -- tests/fixtures src/core/save.ts deploy vite docs/human-checklist.md` | empty; `SAVE_VERSION` is 3 |

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- [visual] 4.4 MONEY_PAY E1/E2 at 1440 and 1024. Check the wallet art, six coins, the 10 zł note, the dimmed full tray, and the feedback bar drawn above the wallet's lower edge. Also check that a held coin leaves ITS OWN cell empty (`CoinWallet.paint`, `liftedSlot`).
- [visual] 5.4 loading screen (`LoadingScreen.showArt`): background, emblem, title, bar and slow line.
- [visual] 6.3 `UnlockCard` notebook; `RoomDoneCard` live tile, and the `salon-after` thumbnail with `?e2eArt=room`.
- [human] 7.4 iPad home-screen icon and Android maskable crop. [human] 10.4 paying by finger on the wallet art.
- Follow-ups F4 (slow-timer start mark), F5 (icon PNG weight), F6 (`make-icons.mjs` temp dir) are in `follow-ups/review-fixes.md`. The earlier carried items are unchanged.

## 6. Autonomous decisions

- **F9 fixed by widening a wait in a spec this slice did not write** (`load-and-tab-guard.spec.ts`).
  - Why: it went red once under 4 workers and was green alone. The neighbouring test and phase 9 already use 15 s for the same game-clock cut.
  - Rejected: recording it only as a flake, because it was not on the known-flake list (only money-pay #11 is).
  - Would change: a red run again at 15 s. That would point to a real start delay, not timing.
- **F1 fixed in the review, not deferred.** The fix moves an existing block and adds a test that went red on the old code. Would change: nothing; the fix restores the per-file limit the `balance.loader` comment promises.
- **F4, F5, F6 deferred with triggers.**
  - F4: behaviour equals main.
  - F5: a PNG optimiser would be a new dependency or tool.
  - F6: script-only, never shipped.
  - Would change: a report of the slow line appearing early, the precache going over budget, or the next edit to `make-icons.mjs`.
- **Gap 108 left "narrowed", not "CLOSED" (F7).** The tile is still partly our design, a live miniature with a pack fallback. Would change: the author asking for a fixed pack picture.
