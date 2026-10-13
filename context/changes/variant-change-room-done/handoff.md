# Handoff — `variant-change-room-done` (slice S-10)

Written by the implementation-review step. Phases 1–7 are committed and reviewed (APPROVED, `MERGE: CLEAR`); only the visual gate and [human] rows remain. Do not re-open the reducer or the seam: both were re-proven by breaks in this step.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | `a8deb20`..HEAD (phases 1–7, fix `96f7514`, handoffs) + this step's `docs(variant-change-room-done): przegląd implementacji` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 9: [visual] 4.6, 4.7, 5.6, 5.7; [human] 3.5, 6.6, 6.7, 6.8, 6.9 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/variant-change-room-done/reviews/impl-review.md` | full-plan review: 0 critical, 1 warning (fixed), 5 observations; teacher read; seam checks; ends with `MERGE: CLEAR` |
| `docs/design-gaps.md` | row 38 corrected (F1: the second tap of a double tap on „Zamknij” toggles the mode) |
| `src/data/layout.ts` | `ROOM_LAYOUT.modeButton`/`slot` comments reordered, row reference 38 (F2; comment-only, no value changed) |
| `context/changes/variant-change-room-done/follow-ups/review-fixes.md` | F4, F6 (`Trigger: S-16`), F5 (`Trigger: human checklist row 6.8`) |
| `context/changes/variant-change-room-done/plan.md` | rows 2.4, 5.5, 6.5 [reviewer] ticked |
| `context/changes/variant-change-room-done/change.md` | status `impl_reviewed` |

## 3. Verification

Observed in this step (baseline on `36ead3c`: 1035 unit, 24 e2e):

| Command | Result |
|---|---|
| `npm run lint` | clean (before and after the F2 comment edit) |
| `npm run typecheck` | clean |
| unit command (contract) | exit 0: `npm test` 1078 passed (baseline 1035, +43), deploy/ops scripts OK, `sample` E1–E6 `Naruszenia: 0` |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rlE "e2eStars|__martynkaE2E|e2eMonth|e2eFail|E2E_MAX_STARS" dist/` empty |
| `npx playwright test` (plain, this session) | 26 passed (baseline 24, +2); 4397/4398 not listening afterwards |
| `validate-rule-files.sh` | PASS (186 paths, missing 0) |

Deliberate breaks re-executed: (1) `stepChange` returns `stars - 1` → `variantPanel.test.ts` red on "confirm with a preview … spends and counts nothing", "works when the room is complete and the balance is zero" and the risk #16 property seeds; restored. Meta-check: expectations from FR-018/risk #16, not the code. (2) `main.ts` reads `e2eStars` without `__E2E_HOOK__` → `npm run build` fails "e2e hook leaked … (e2eStars in _app/index-….js)"; restored. Meta-check: proves the guard on the real bundle. Orchestrator e2e breaks p4, p7a–d inherited (round 3), not re-run; the full suite was.

## 4. Next command

visual gate (S-10 hold outline, change panel, change mode, Pokój gotowy! card)

## 5. Open

- [visual] 4.6, 4.7, 5.6, 5.7: hold outline (`RoomView.highlight`), change panel without/with preview, rug pop over the sofa (V2), captions (`captionAnchor`), card `RoomDoneCard`, mode button „Zmień wygląd”/„Gotowe”, reduced motion — 1440×900 and 1024×768, hook build with `?e2eStars=40`/`96`; gestures via a throwaway Playwright spec (profile § 8).
- [human] 3.5 (`?e2eStars` seam), 6.6 (`balance.roomHold` 600 ms / 40 px), 6.7 (UX decisions of mode/card/list), 6.8 (copy „Zmień wygląd”, „Wkrótce”, and F5 hint „Stuknij mebel…”), 6.9 (iPad/Android).
- Follow-ups in `follow-ups/review-fixes.md`: S-11 save after change, S-16 art (+F4 `Box` types, F6 `RoomDoneCard` glyph numbers), v1.1 `ROOM_ORDER`, M8 tuning, F5 copy.
- F3 accepted: `RoomScene.redraw` narration follows `card`, so the speaker can read „Pokój gotowy!” during the 260 ms pop.

## 6. Autonomous decisions

Impl-review step:

R1. Reviewed in the main session without the skill's two sub-agents: ~1000 code lines in 20 files read in full; the riskiest claims verified by reading and re-run breaks. Rejected: delegating (would only summarise the same files). Would change: a larger diff.
R2. Triage in place: F1 (doc row) and F2 (comments) fixed as cheap; F3 accepted; F4/F6 deferred to S-16 (art reworks those files); F5 left to the maintainer's copy row 6.8. Would change: maintainer disagreement on disk.
R3. `holdPoint` (fix `96f7514`) judged hook-only: its sole caller is `RoomScene.slotTargets` → `targets.slots`; the product's touch uses `slotAt`, unchanged. Would change: a product caller of `holdPoint` appears.
R4. Teacher read passes all new strings; „mebel” noted (F5) rather than changed, because the plan fixed the copy and row 6.8 is the maintainer's. Would change: maintainer picks the alternative.

Earlier steps (kept):

1. Triage done in place (no AskUserQuestion): every CRITICAL/WARNING fixed in plan.md with its recommended fix; OBSERVATIONS F6/F7 accepted. Would change: maintainer disagreement on disk.
2. F1 — added pure `roomGesture` to phase 1 (tdd) rather than leaving gesture rules in `RoomScene` (rejected: in-scene feed like `UIScene`, untestable before phase 7). Why: CLAUDE.md logic-in-core rule and the slice check "hold must not trigger on release". Would change: phase-1 agent finds it duplicates `longPress` wholesale.
3. F2 — accepted "Zamknij" sharing `modeButton`'s place (S-09 precedent) over moving the mode button. Would change: visual gate shows the double-tap toggle confuses.
4. Deep mode without a sub-agent: the riskiest claims were few and local, verified directly. Would change: a broader blast radius.
5. Phase 1 stayed `Driver: tdd`; adding the `mode: 'buy'` literal to `PanelState` and the existing tests was done inline as the type change. Stubs (wrong values) were written before tests only to get an assertion RED. Would change: none.
6. `Box` is `{left, top, right, bottom}` and `roomGesture` returns `held` only while the press is `holding`. Would change: phase 4 scene needs another shape.
7. Phase 2: caption anchors floor (300, 820) and walls (300, 240), `captionCharWidth` 20 (conservative estimate). Strings teacher-read: gender/accusative fine ("Stuknij mebel"), no numerals, short sentences. `RoomView` must use `captionAnchor` in phase 4. Would change: visual gate shows overlap.
8. Phase 3: F6 taken: `e2eStars` is read next to `e2eFail` in `main.ts` and passed into `createGame` as `startStars` (like `month`). Cap 500 (`E2E_MAX_STARS`), 1-3 digit decimals only. Would change: nothing.
9. Phase 4: the hold zone is one `Zone` over `ROOM_LAYOUT.area` created before the buttons; its input is disabled while a panel is open (set in `redraw`). `feed` ignores events while the panel is open. Hold outline is a separate graphics at depth 1 so `render` does not clear it. F5 solved with `roomText` in `pl.ts` (one cast in data, none in scenes). Would change: visual gate shows layering problems.
10. Phase 4 e2e not runnable (MachPort): orchestrator gate; break deferred to phase 7 as the plan says.
11. Phase 5: `ROOM_LAYOUT.modeButton` is 1010,892 570x128, not the `taskButton` rect (that rect overlaps the 3rd thumbnail; plan said "miniatury nie nachodzą"). Card is 220..780 (ends at tray.top) with "Dalej" at y 624 above "Wybieram" instead of reusing `UNLOCK_LAYOUT.button`. `RoomDoneCard.show(items, room, state)` takes the salon's `RoomDef` + state for the miniature (one room in v1); tile name is `pl.room.name`. `PageButton.setDepth` added so the button sits over the card graphics. Auto-read stage comes from the registry learner (`effectiveAutoRead`), speaking skipped without settings/learner. Would change: visual gate shows overlap or odd layering.
12. Phase 5 e2e not runnable (MachPort): orchestrator gate. Teacher read of strings (row 5.5 stays [reviewer]): "Pokój gotowy!", "Salon", "Wkrótce", "Dalej", "Zmień wygląd", "Gotowe", "Stuknij mebel, który chcesz zmienić." - no numerals, imperative accusative OK.
13. Phase 6: docs only. Archived S-09 follow-ups are not edited; their closure is recorded in this change's follow-ups file. Design gap row text for 32/36 is covered inside rows 41 (no separate edit to rows 32 and 36). Would change: reviewer wants the old rows amended.

14. Phase 7: e2e not runnable (MachPort): `e2e: not runnable in this session (MachPort) — orchestrator gate`. Spec left uncommitted per protocol; request file written. Hold-over-thumbnail point asserted inside the floor rect. Would change: green run shows the point hits another slot.

15. Phase 7 round 2: `toRoom` fixed (first task solved by retype, pays 0, then `roomSwitch`); Chromium again not launchable (MachPort); spec + config stay uncommitted; request file has "Round 2 changes". Would change: green run shows other state-dependent targets.

16. Fix step: fixed the geometry in core (`holdPoint` margin) rather than widening `slotAt` or the scene's hit zone: the slot rectangle is what the child sees, so a touch on its very edge missing it is correct; the e2e target must sit inside. Margin step/2 = 10 px covers the ±1.5 px scale rounding. Would change: a device check shows real fingers miss small slots.
17. Phase 7 finish: committed spec + config untouched (proven as is); rows 7.1-7.6 ticked on the orchestrator round-3 evidence; change.md `implemented` with [reviewer]/[visual]/[human] rows still open. Would change: impl-review wants the breaks re-run.
