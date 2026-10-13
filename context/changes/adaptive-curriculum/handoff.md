# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-implement adaptive-curriculum phase 7`. Phase 7 committed (`e584911`). Rows 5.5, 6.5, 7.5 are [reviewer], 7.6 [visual]; row 7.3 waits for the orchestrator's e2e.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, 2 `1c384c5`, 3 `ee93ff9`, 4 `dba1791`, 5 `0aedeff`, 6 `58bf417`, 7 `e584911`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.5, 6.5, 7.3 (orchestrator e2e), 7.5, 7.6 [reviewer]/[visual], phases 8-9 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/UnlockCard.ts` | new widget: card, code-drawn book, title, step name, "Dalej" (`PageButton`); `show(name)`, `hide()`, `target()` |
| `src/scenes/TaskScene.ts` | `unlockShown` flag; `render()` card branch before the summary branch (`hideTaskLayer`, `unlockView`); `startNextRound` shows the card when `pendingUnlock !== null`, `closeUnlock` clears it and calls `beginRound`; `TaskSnapshot.unlock`, `TaskTargets.unlockNext` |
| `src/data/layout.ts`, `src/data/pl.ts` | `UNLOCK_LAYOUT`, colours `unlockCard`/`unlockBorder`, font roles `unlockTitle` 66/800 and `unlockName` 48/750, `TASK_TOUCH_TARGETS.unlockNext`; `pl.unlock` {title, next, spoken} |
| `src/testing/e2eHook.ts` | `screen: 'unlock'` (order room, unlock, summary, task), `targets.unlockNext` (null in the room) |
| `tests/layout.test.ts` | unlock card test (+1); weight test exempts `unlockTitle` (kit 800) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (`npm test`) | baseline 881 + 1 = 882 passed; deploy tests OK x2; `sample` E1-E6 `Naruszenia: 0` x6 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| Break | `UNLOCK_LAYOUT.button.height` 108 -> 90: `AssertionError: unlockNext height: expected 90 to be greater than or equal to 96` (2 tests red); restored, green |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

Orchestrator: run `npx playwright test` on `e584911`, expect 14 passed (+0; no spec reaches the card yet, phase 9 does). Visual (row 7.6): the card shows after "Kolejna runda" only when `learner.pendingUnlock` is set (hook: `screen === 'unlock'`, tap `targets.unlockNext`).

## 4. Next command

`/10x-implement adaptive-curriculum phase 8`

## 5. Open

- Row 7.5 [reviewer]: teacher read of `pl.unlock` — title „Nowa umiejętność!” (kit), „Dalej” (kit), spoken line „Nowa umiejętność! <nazwa kroku>.”
- Row 7.6 [visual]: screenshots vs `unlock.png`. The book is a code-drawn placeholder; the button label uses the 46 px `pageButton` role (kit 44 inside the card).
- Phase 8 must add the design-gap rows to `docs/design-gaps.md`: book art (S-16), card narration, card after "Do pokoju" (the code carries DESIGN-GAP comments in `UnlockCard.ts` and `layout.ts`).
- Rows 5.5, 6.5 still [reviewer]; 6.5 notes in the p6 handoff are unchanged (48 names in `E1.ts`…`E6.ts`).

## 6. Autonomous decisions

1. Skill questions decided in place: implement in this context, proposed commit message, stop after phase 7.
2. Card state is a scene flag `unlockShown` read by `render()`; the pending data stays in the registry learner. "Dalej" clears `pendingUnlock` before `beginRound`, so the next round draws from the raised `unlockedStep`. Stars of the finished round join the session only in `beginRound`, once.
3. If `pendingUnlock` has no `childName` in the stage steps (cannot happen for playable steps), `unlockView` returns null and the summary shows; would change if a non-playable step could unlock.
4. `closeUnlock` is the only place that clears `pendingUnlock`; the room switch is hidden (`roomSwitch` false) while the card is open, so "Do pokoju" is only reachable from the summary and the card waits.
5. Spoken line `Nowa umiejętność! <name>.`, read on the "Kolejna runda" tap when `autoRead`, via the existing narration registry key (the HUD speaker reads the same).
6. Kit title weight 800 is allowed in the weight test (like the brand line).
