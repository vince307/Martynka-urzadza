<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Pierwszy mebel za gwiazdki: salon, zadanie remontowe i wybór 1 z 3 wariantów

- **Plan**: context/changes/first-furniture-purchase/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8
- **Date**: 2026-10-13
- **Verdict**: APPROVED
- **Findings**: 0 critical, 3 warnings, 4 observations
- **Diff base**: `git diff bb969f7...HEAD` (26 files outside `context/`, +1485/−53), reviewed at `6f41b1f`, fixes in `4f63d28`

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification observed in this review

| Command | Result |
|---|---|
| `npm run lint` | OK (0 warnings), before and after the fix commit |
| `npm run typecheck` | OK, before and after |
| `npm test` + `deploy/test-martynka-deploy.sh` + `deploy/ops/test-martynka-ops.sh` + `npm run sample -- E1..E6` | OK; vitest 1033 passed = baseline 974 + 59 (stars 3, rooms 10, roomsData 8, variantPanel 32, motion 5, layout +1 net: 16 → 17 with 2 rewritten); every stage `Naruszenia: 0` |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (plain, in this session, on `6f41b1f`) | 24 passed = baseline 23 + 1 (`room-purchase.spec.ts` 51.6 s); servers on 4397/4398 killed after |
| `validate-rule-files.sh` | PASS (183 paths, 0 missing) after the fix |
| Deliberate break (unit) | `stepPanel` keeps the panel open after a successful confirm → `tests/variantPanel.test.ts` "confirm with a preview buys, closes the panel…" red (`expected { kind: 'open', taskId: 't1', … } to deeply equal { kind: 'closed' }`); second break: the panel re-targets the next task after a purchase (defeats the stale guard too) → also "a second confirm in a row buys nothing, even with stars for the next task" red. Restored, tree clean. Meta-check: the first break alone leaves the double-confirm test green because the stale-panel guard is a second, independent defence — the same finding p3 recorded; the second break proves the double-confirm test guards the reducer, not a coincidence. |

The fix commit `4f63d28` touches only comments and docs (`src/scenes/RoomScene.ts` class comment, `docs/design-gaps.md`, `CLAUDE.md`); no runtime behaviour changed, so the e2e run on `6f41b1f` stands for it.

## Seam and contract checks

- **Star balance contract (p1/p4 vs p6)**: `REGISTRY_KEYS.stars` is written in exactly three places — `main.ts` `preBoot` (0), `TaskScene.syncStars` (`earn(balance, starsEarned - before)`) and `RoomScene.dispatch` (only when `stepPanel` returns `bought`, with `step.stars` from `core`). The scene never compares balance and cost. `sessionStars` is gone. `applyParentStage`/`beginRound` no longer carry stars (already on the balance). Consistent.
- **Child safety**: `earn` ignores negative/NaN/fractional deltas (wrong answers never remove stars); `purchase` refuses `short`, so the balance never drops below 0 (property test over 20 seeds × 200 events); no timers, no fail state; scenes hold no Polish text or balance numbers (all from `pl.ts`, `layout.ts`, `rooms.ts`).
- **tdd phases**: RED evidence in the p1–p3 handoffs names real assertions on stubs (`expected -1 to be +0`, `expected [] to have a length of 10`, `expected { kind: 'closed' } to deeply equal { kind: 'open', … }`); re-executed one (above). Unit deltas reconcile per phase with the run log (987, 995, 1027, 1032, 1032, 1033, 1033).
- **e2e spec `room-purchase.spec.ts` (plan-review F1)**: not vacuous — it plays rounds until `S >= cost1 + 6` and asserts `expect(S).toBeGreaterThanOrEqual(needed)` and `S >= cost * 2 + 1` before the double tap; breaks A/B (orchestrator, run-log p8) went red at the balance assertions.
- **Hook bypass**: none. `.claude/` has no diff against `bb969f7`; `.claude/settings.json` mtime 2026-10-10 (before the run); no hook muted.
- **Teacher read** (as a Polish primary-school teacher, rows 2.5 and 6.4): task labels are imperatives with the correct accusative ("Napraw podłogę", "Pomaluj ściany", "Powieś zasłony", "Wstaw kanapę", "Połóż dywan", "Postaw stolik", "Postaw lampę", "Powieś półkę", "Postaw kwiatek", "Powieś obraz"); slot captions in the nominative ("podłoga", "ściany", "zasłony", "kanapa", "dywan", "stolik", "lampa", "półka", "kwiatek", "obraz"); "Salon", "Wybieram", "Zamknij", "Wróć do notesu" correct; "masz 3/5" is digits only, so no numeral agreement is needed, short and clear next to the star. All short, understandable for a 7-year-old. PASS.

## Findings

### F1 — A quick double tap on the lower edge of "Wybieram" re-opens the panel for the next task

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/data/layout.ts` (`ROOM_LAYOUT.choose`, `ROOM_LAYOUT.taskButton`), `src/scenes/RoomScene.ts` (`redraw`)
- **Detail**: "Wybieram" spans y 800–908 and the task button y 880–1008, overlapping at x 1100–1580 × y 880–908. They never show together, but after a purchase `redraw` shows the next task's button in the same synchronous step, so the second tap of a fast double tap that lands in that strip opens the panel for the next task. No stars are taken (open deducts nothing; a confirm needs a fresh pick), so risk #16 holds, but the child sees an unexpected panel. The e2e double tap hits the centre of "Wybieram" (y 854), outside the strip; the layout tests check the tray targets against each other, not against the task button.
- **Fix**: move the task button (or the panel buttons) so no panel target overlaps it, and add a layout test "no tray target overlaps the task button".
  - Strength: removes the transition overlap at the source; the test keeps it removed.
  - Tradeoff: changes the room's bottom band right before the visual gate; better tuned with screenshots in front of you.
  - Confidence: HIGH — the overlap is arithmetic on `ROOM_LAYOUT`.
  - Blind spot: how often a child's double tap lands in a 28 px strip on a real tablet (row 7.10 device check).
- **Decision**: DEFERRED — follow-up in `follow-ups/review-fixes.md` (Trigger: S-09 visual gate or S-10).

### F2 — Design gap row 36 contradicted the code (label narration)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `docs/design-gaps.md` row 36
- **Detail**: Row 36 said the room label is "Not read … narration of room labels is a follow-up", while `RoomScene.redraw` sets `REGISTRY_KEYS.narration` to the label and the HUD speaker reads it (plan decision 11). No such follow-up existed.
- **Fix**: rewrite row 36 to describe the speaker reading the label.
- **Decision**: FIXED in `4f63d28`.

### F3 — Row 34 and CLAUDE.md described a "star flying from the counter" that the room does not draw

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `docs/design-gaps.md` row 34, `CLAUDE.md` (Current state, S-09 sentence)
- **Detail**: `RoomScene.celebrate` draws a scale pop and a particle burst of stars at the slot; nothing flies from the counter. The visual gate would have checked against the wrong description.
- **Fix**: describe the burst from the slot and that reduced motion also stops the task scene's flying star.
- **Decision**: FIXED in `4f63d28`.

### F4 — `pl.room.name` ("Salon") is a dead key

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `src/data/pl.ts` (`room.name`)
- **Detail**: Planned in phase 2 but only `tests/roomsData.test.ts` reads it; the rooms list (S-10) is its natural user.
- **Fix**: use it in S-10's rooms list or remove it.
- **Decision**: DEFERRED — follow-up (Trigger: S-10).

### F5 — Repeated text-key casts and room lookup

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/scenes/RoomScene.ts` (`redraw`, `snapshot`), `src/ui/widgets/RoomTaskButton.ts` (`show`), `src/ui/widgets/RoomView.ts` (`render`)
- **Detail**: `(pl.room.tasks as Record<string, string>)[…]` appears twice and the slot variant once; `RoomScene.snapshot` repeats `ROOMS[...] ?? ROOMS[FIRST_ROOM]` instead of calling `room()`.
- **Fix**: one typed lookup helper; `snapshot` uses `this.room()`.
- **Decision**: DEFERRED — follow-up (Trigger: the next change to RoomScene or the room widgets).

### F6 — Stale class comment "It owns no state"

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/scenes/RoomScene.ts` (`RoomScene` class comment)
- **Detail**: Written in phase 5; phase 6 added the `panel` field.
- **Fix**: "It owns only the variant panel's state".
- **Decision**: FIXED in `4f63d28` (comment only).

### F7 — The purchase pop ignores slot depth; one e2e negative check is not polled

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/scenes/RoomScene.ts` (`celebrate`), `tests/e2e/room-purchase.spec.ts` ("Wybieram" with no variant)
- **Detail**: (a) the pop graphic is added on top of the room, so a rug (depth 2) bought after the sofa (depth 5) briefly draws over the sofa for ~520 ms — cosmetic, visible at the visual gate. (b) after tapping "Wybieram" with no preview the spec asserts `stars === S` without waiting; Phaser handles the DOM pointer event synchronously, and the later preview poll plus break B (red on `stars === S` after the thumbnail) cover the scene seam, so the check is a weak but not vacuous extra.
- **Fix**: none now; (a) note for the visual gate, (b) poll if the spec is touched again.
- **Decision**: RECORDED.

## Progress rows ticked by this review

- 2.5 [reviewer] teacher read — PASS (above).
- 6.4 [reviewer] teacher read of "Wybieram", "Zamknij" and `pl.room` in context — PASS.
- 7.5 [reviewer] seam sweep — PASS after `4f63d28`: no duplicate drawing helpers beyond F5, stale comments fixed (F6), every DESIGN-GAP comment has a row (31–36, 10 and 12 updated) and rows match the code (F2, F3), follow-ups carry `Trigger:` lines; dead key F4 recorded.

Still open: [visual] 4.6, 5.5, 6.5, 6.6; [human] 7.6–7.10.

MERGE: CLEAR — no critical findings; the local gate, sample E1–E6 and the full e2e suite (24 = 23 + 1) pass on this branch, and the one behavioural warning (F1) takes no stars and is queued for the visual gate.
