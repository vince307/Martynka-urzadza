# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-implement fox-guide phase 4` of run 2026-10-23-fox-guide: `GuideFox`, the one `guide.show` call in `TaskScene.render`, the hook field `guide` and DESIGN-GAP rows 165-168 are committed as 953ed88. The next agent starts phase 4 (docs, follow-ups, seam sweep).

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phase 1 `e392442`, phase 2 `2d99dcf`, phase 3 `953ed88`, plus the handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 15 (`grep -c '^- \[ \]' plan.md`); 1.4 and 2.4 wait for the orchestrator's e2e |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/GuideFox.ts` | the widget: one Image at `GUIDE.anchor`, hidden on `null` or a missing texture, `setDisplaySize` after every `setTexture`, pop 1.06/240 ms only on a visible pose change and not under reduced motion, no input; `snapshot()` |
| `src/scenes/TaskScene.ts` | fox created after `drawNotebook`; `guide.show(guidePose(screen, phase))` once in `render()` before the unlock branch; `TaskSnapshot.guide` |
| `tests/e2e/support/hook.ts` | `Snapshot.guide?: { pose, visible, rect, interactive, pops }` (the hook spreads `TaskSnapshot`; `e2eHook.ts` not edited) |
| `tests/guideWiring.test.ts`, `tests/reducedMotionWiring.test.ts` | source guards (no `setInteractive`, reduced-motion check before `tweens.add`, one `guidePose(` before the first `return`) |
| `docs/design-gaps.md` | rows 165-168 |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| deliberate break: `guide.show` moved after the first return of `render()` | "before the first return" case red; restored, green |
| deliberate break: `setInteractive()` added in `GuideFox` | "never takes input" case red; restored, green |
| meta-check | these are source guards; the on-screen behaviour is proven by 3.5 (visual) and phase 5 (e2e) |
| `grep -c "^| 16[5-8] |" docs/design-gaps.md` | 4 |
| lint / typecheck / `npm test` | OK / OK / 3886 (phase 2) + 5 = 3891 passed |
| deploy scripts, `sample` E1-E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| e2e | NOT run (Chromium cannot start in the sandbox); orchestrator runs it, expect 150 + 0 |

## 4. Next command

`/10x-implement fox-guide phase 4`

## 5. Open

- Rows 1.4, 2.4, 3.4 stay unticked until the orchestrator's e2e run (150 + 0).
- Manual rows open: 3.5 [visual] (not done by this step), 4.5 [visual], 4.6 [human], 4.7 [human], 4.8 [reviewer].
- Phase 4 is docs, follow-ups (>= 6 Trigger lines, include the "Obrazki" parent-line follow-up F6 and the fallback anchor x 1802) and the seam sweep; boot payload 47.6 s of 48 s: no more boot art.
- `src/testing/e2eHook.ts` was not edited, so the narrator-round-summary follow-up did not fire.

## 6. Autonomous decisions

- Phase 3 is `Driver: impl`; the wiring tests were written alongside the code, deliberate breaks done after. Would change: none.
- Pop implemented as one yoyo tween of `guidePoseMs / 2` each way (total 240 ms) on scaleX/scaleY from the base scale read after `setDisplaySize`. Would change: the visual gate finding it too lively.
- A repeated `show` of the same visible pose returns early (no tween killed), so non-pose renders never disturb a running pop.
- Commit message taken as proposed; stopped after this phase.
