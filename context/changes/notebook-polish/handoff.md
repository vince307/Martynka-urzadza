# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-impl-review` step. The full plan (phases 1-12) has been reviewed. The verdict is `MERGE: CLEAR`. The review found four warnings and fixed all of them in `050b185`. The next step is the visual gate. It must look at the [visual] rows of the plan in the hook build. Since the review fix, the "OK" of select, drag, coins and clock tasks now really wobbles or bounces, so watch that too.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` (cut from `main` at `6e426ed`) |
| Commits | 36 on the branch: p1 `a659097` ... p12 `18d0cee`, review fix `050b185`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 13 (`grep -c '^- \[ \]' plan.md`): [visual] 2.4, 2.5, 3.5, 3.6, 4.5, 5.5, 6.5, 7.5, 8.4, 9.4, 10.5, 11.7 and [human] 11.8 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/notebook-polish/reviews/impl-review.md` | The full review report: findings F1-F8, the suites I re-ran, the breaks, and the line `MERGE: CLEAR` |
| `src/ui/widgets/chunky.ts` | Changes to `ChunkyFace`:<br>• `place` returns early when the rect is unchanged, so the tweens survive a repaint. A face still pressed down is released.<br>• `reset` puts back both x (`baseX`) and y. |
| `src/scenes/TaskScene.ts` | Changes to the wobble:<br>• `wobble` reads its rest position from `target.x` after `stopWobble()` and stores it in `wobbling.rest`. It no longer uses `setData('restX')`.<br>• `stopWobble` puts the object back only while `chain.isPlaying()`. |
| `tests/motionWiring.test.ts` | New case: same-rect early return before `reset()`, `reset` restores `baseX`, and `wobble`/`stopWobble` no longer use `getData`/`setData`. Proven red by a deliberate break. |
| `tests/e2e/notebook-polish.spec.ts`, `tests/e2e/support/welcome.ts` | The counter test is pinned to `?e2eSkills=E1.1.compare_qty_10`. `passWelcomeAsChild` takes an optional `query`. |
| `tests/artLayout.test.ts` | `AREAS` is read from `TASK_LAYOUT.picture` instead of the old pre-margin literals. |
| `src/data/layout.ts` | Comments only: `expression`, `hint`, `starCounter`. |
| `CLAUDE.md`, `docs/design-gaps.md` | The gear is a static pill, not a `ChunkyFace`. Row 158 now says "flat mid-colour face". |
| `context/changes/notebook-polish/follow-ups/review-fixes.md` | Entries 15 (literals and borrowed tokens) and 16 (small seams), each with a `Trigger:` line; 21 `Trigger:` lines in total. |
| `context/changes/notebook-polish/plan.md` | Rows ticked:<br>• e2e rows 4.4, 5.4, 6.4, 7.4, 8.3, 9.3, 10.4 and 11.5, citing the orchestrator evidence plus my own runs.<br>• Row 11.6 [reviewer]. |
| `context/changes/notebook-polish/change.md` | `status: impl_reviewed` |

## 3. Verification

All observed in this step. Baselines are from the contract: unit 3736, e2e 144.

| command | result |
|---|---|
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build at `6837a96` | green; unit 3780 (3736 + 44) |
| full e2e `--workers=2` at `6837a96` | 147 passed. The 3 failures were all load timeouts:<br>• `adaptive` #13: 180 s limit<br>• `stale-tab` B-1 ×2: `loading` after 5 s<br>The run took 44 min. |
| full e2e `--workers=2` after the fix (before the spec pin) | 144 passed. Two failures were load timeouts: `first-launch` #12 (canvas at 90 s) and `stale-tab` B-1. The third was a real spec defect: `notebook-polish` "counter shows" got `select` where it expected `tiles` (F3). |
| `--workers=1` on `notebook-polish`, `stale-tab`, `first-launch`, `adaptive` after the pin | 19 passed |
| `npx playwright test --list` | 150 tests in 40 files = 144 + 6 |
| lint, typecheck, unit, deploy scripts, `sample` E1-E6, build after all fixes | green; unit 3781 (3736 + 45); `e2e hook: absent (2 chunks checked)` |
| break, tdd p1 | `staggerDelays` over `spanMs`: 3 cases red in `motionRules.test.ts` (real assertions, e.g. `[0,133,267,400]` vs `[0,50,100,150]`); restored |
| break, e2e p12 #2 | `onWake` re-capture removed: "captured again" red (`captures` 1, expected > 1); restored |
| break, e2e p12 #1 | `setValue` moved from `onStars` into `starLanded`: the pinned "counter shows" test red (`"0"`, expected `"1"`); restored |
| break, review fix | same-rect early return disabled: new `motionWiring` case red; restored |
| meta-check | Break #1 proves the synchronous counter now that the test always taps a tile. The `motionWiring` case is a source guard; the real behaviour of the OK wobble is for the visual gate. |
| hook bypass check | `.claude/settings.json` and hooks unchanged since before the run; no suppressions in the diff |

## 4. Next command

`visual gate`

## 5. Open

- **[visual] rows 2.4-11.7.** Desktop 1440 and tablet 1024, in the hook build on 4399.
  - Also check the "OK" wobble and bounce in select, drag, coins and clock tasks. They are visible only since `050b185`, in `ChunkyFace.place` and `TaskScene.wobble`.
  - Check that `TASK_LAYOUT.barSpan.keypad` (x 310) does not cross the margin line (follow-up 16).
- **[human] row 11.8.** For the maintainer:
  - iPad Safari: `fontHealth` loaded, with the plain 0 and diacritics.
  - Decision D-1: no spine band, and the shadow falls straight down.
- **Follow-ups 1-16** are in `follow-ups/review-fixes.md`. The new ones are 15 and 16.
- **Known load flakes** on this machine under `--workers=2`: `adaptive` #13, `stale-tab` B-1, `first-launch` #12. Each is green when run serially.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **F1, how to keep the OK tweens.**
  - Chosen: an early return in `ChunkyFace.place` when the rect is unchanged.
  - Rejected: making `SelectTiles`, `BlockMat`, `CoinWallet` and `ClockSet` skip `showCentered` when already shown. That is 4 call sites, and the next widget would repeat the bug.
  - The early return also releases a face left pressed, because `ActionButton.place` clears `pressed` and the `pointerup` would otherwise leave the face on its lip.
  - What would change it: a widget that relies on `place` at the same rect as a hard reset. None was found, and `hide()` still resets.
- **F2, where the wobble keeps its rest position.**
  - Chosen: the current x, stored in the `wobbling` record, with a restore only while the chain plays.
  - Rejected: clearing the data key in `ChunkyFace.place`. That ties the widget to a scene detail.
  - What would change it: wobbling a non-chunky object that moves while it sways.
- **F3, how to make the counter test deterministic.**
  - Chosen: pin the skill with `?e2eSkills`.
  - Rejected: skipping forward to the first tile task. That makes the timing the test measures noisy.
  - What would change it: E1 dropping `compare_qty_10`, or the skill changing its input mode.
- **Severity.** I treated F1 as a WARNING, not a CRITICAL. It left the motion undelivered in four modes, but caused no harm, no offset and no lost input. Fixing it was cheap.
  - What would change it: a maintainer rule that an undelivered planned motion blocks a merge.
- **Ticked e2e rows** on the orchestrator's evidence plus my own full runs, as the step prompt allows. The load timeouts were re-checked serially before I judged them.
