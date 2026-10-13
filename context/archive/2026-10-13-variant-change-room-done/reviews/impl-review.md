<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi i „poprawki” w salonie

- **Plan**: context/changes/variant-change-room-done/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-13
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F1, fixed in this step) |
| Success Criteria | PASS |

## Evidence (re-run by the reviewer on `bda1a3e` + this step's fix)

| Gate | Result | Against baseline (36ead3c: 1035 unit, 24 e2e) |
|---|---|---|
| `npm run lint` | clean (`--max-warnings 0`) | = |
| `npm run typecheck` | clean | = |
| unit command (contract § Verification) | exit 0: `npm test` 71 files / 1078 passed, deploy + ops scripts `OK OK`, `sample` E1–E6 each `Naruszenia: 0` | 1078 = 1035 + 43 (new: roomHit, roomGesture, e2eStars test files; new cases in variantPanel, rooms, roomsData, layout, e2eHookGuard) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` | = |
| `npx playwright test` (plain, ran in this session) | 26 passed (2.1 m), servers 4397/4398 gone afterwards | 26 = 24 + 2 (`room-change.spec.ts`) |
| `validate-rule-files.sh` | PASS, 186 paths, missing 0 | — |

Deliberate breaks re-executed by the reviewer (each restored with `git checkout`, tree clean after):

1. `stepChange` returns `stars: stars - 1` on a confirmed change → `tests/variantPanel.test.ts` red: "confirm with a preview rewrites the variant and spends and counts nothing", "works when the room is complete and the balance is zero" and the risk #16 property ("seed N: balance never negative, every star accounted for", 10+ seeds). Meta-check: the expectations come from FR-018 "zmiana darmowa" and risk #16, not from the code.
2. `src/main.ts` calls `e2eStars(window.location.search)` without the `__E2E_HOOK__` guard → `npm run build` fails: `e2e hook leaked into the production bundle (e2eStars in _app/index-….js)`. Meta-check: proves the guard on the real bundle, not only the unit test of the guard.

The orchestrator's five e2e breaks (p4, p7a–d, `e2e-request-s10-p7.md` round 3) were not re-run; the full e2e suite was.

## Seam and safety checks

- **`?e2eStars` in production**: read only in `src/main.ts` behind `__E2E_HOOK__ ? e2eStars(...) : null` (`__E2E_HOOK__` = `process.env.E2E_HOOK === '1'` in `vite/config.shared.mjs`); `'e2eStars'` is in `E2E_HOOK_MARKERS`; `grep -rlE "e2eStars|__martynkaE2E|e2eMonth|e2eFail|E2E_MAX_STARS" dist/` finds nothing. Parser accepts only `^\d{1,3}$` ≤ 500, so the seam can never set a negative balance.
- **`holdPoint` after fix 96f7514**: its only caller is `RoomScene.slotTargets` → `installE2EHook` `targets.slots`. The product's hit-test is `slotAt` (unchanged by the fix), so the 3x3 margin changes no child-facing behaviour.
- **Free change**: `stepChange` copies `tasksDone`, returns the same `stars`, `bought: null`; `RoomScene.dispatch` writes `REGISTRY_KEYS.stars` only inside `if (step.bought)`; the `changed` branch writes `rooms` only.
- **No tap leak from the hold**: the hold zone is created before every button (Phaser `topOnly`), disabled in `redraw` while the panel or the card is up, and `feed` ignores events then; `VariantPanel` thumbnails and `PageButton` fire only on `pointerup` after their own `pointerdown` (break p7d in round 3); "Dalej" (y 624–732) and the mode button (x ≥ 1010) are clear of "Wybieram" and the thumbnails (`tests/layout.test.ts`).
- **No timers beyond the hold**: the only delay is the existing pop (`ANIMATION.purchasePopMs`, 0 with reduced motion) before the card is drawn; `showCard` re-checks `this.card`, which `sleep` clears.
- **Scenes without Polish text or balance numbers**: `RoomScene` takes copy from `pl.room.*`/`roomText` and the hold rules from `balance.roomHold`; geometry from `ROOM_LAYOUT`/`ROOM_DONE_LAYOUT`.
- **Phase contracts across agents**: `modeButton` moved off the task-button rect in p5 (overlapped the 3rd thumbnail) — recorded as handoff decision 11 and run-log p5; the layout test guards the new rect. The card's "Dalej" deliberately does not reuse `UNLOCK_LAYOUT.button` (plan-review F3). No later phase changed the reducer, gesture or hit-test contracts of p1–p2.
- **Hooks**: `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (12 Oct) predate the run; no hook bypass found.

## Teacher read (rows 2.4, 5.5)

Read as a Polish primary-school teacher, in context (card, tile, mode button, speaker):

- „Pokój gotowy!” — agreement correct (pokój m., gotowy m.), exclamation suits the reward; spoken form identical. OK.
- „Salon” (tile caption), „Wkrótce” (teaser) — correct, one word each, clear for a 7-year-old. OK.
- „Dalej” (existing `pl.unlock.next`) — same meaning as on the unlock card. OK.
- „Zmień wygląd” — imperative + accusative (wygląd, inanimate: acc = nom), same form as the task labels („Napraw podłogę”). OK.
- „Gotowe” — the usual Polish word for leaving an edit mode. OK.
- „Stuknij mebel, który chcesz zmienić.” — grammar correct (mebel acc. inanimate, relative „który” acc. m. inanimate), one sentence, no numerals. Semantics: the floor, walls and curtains are changeable too and are not „meble”; see F5 (copy decision, maintainer row 6.8).
- No new strings with numerals, so no numeral agreement to check; `sample` E1–E6: 0 violations (content untouched).

## Findings

### F1 — Design-gap row 38 described the double tap on „Zamknij” wrongly

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: docs/design-gaps.md row 38
- **Detail**: Row 38 said the second tap of a double tap on „Zamknij” "only re-opens the same panel". In a done room `ROOM_LAYOUT.close` (1100–1580 × 908–1004) lies inside `ROOM_LAYOUT.modeButton` (1010–1580 × 892–1020), so the second tap toggles the change mode (as the plan, plan-review F2 and the comment in `tests/layout.test.ts` say). The maintainer reads this row for decision 6.7.
- **Fix**: Row 38 now says the second tap toggles the mode and costs nothing.
- **Decision**: FIXED (this step)

### F2 — Misplaced layout comment with a wrong design-gap row

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts `ROOM_LAYOUT.modeButton` / `ROOM_LAYOUT.slot`
- **Detail**: p5 inserted `modeButton` between the slot comment and `slot`, so the slot comment described `modeButton`; the mode-button comment cited row 40 (the room list) instead of 38.
- **Fix**: Comments reordered above their own keys; row reference 38. Comment-only change, no value changed.
- **Decision**: FIXED (this step)

### F3 — The speaker reads „Pokój gotowy!” during the pop, before the card is drawn

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/RoomScene.ts `redraw` (narration line)
- **Detail**: `narration` follows `this.card` (set at once), not `this.cardDrawn`; for ≤ `purchasePopMs` (260 ms) a press on the HUD speaker reads the title before the card is visible. Harmless, and it matches the plan ("Od chwili ustawienia stanu").
- **Fix**: none needed; revisit if the visual gate or a device test finds it odd.
- **Decision**: ACCEPTED

### F4 — Two `Box` types with different shapes

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/roomHit.ts `Box` ({left, top, right, bottom}); src/ui/widgets/RoomView.ts `Box` ({left, top, width, height})
- **Detail**: Same name, different shapes; `RoomView.render`, `highlight` and `drawRoomMiniature` each convert `slotBox` output by hand. Correct today; a mix-up would compile only where the fields differ.
- **Fix**: rename one (e.g. `Edges`) or add a `toRect` helper when S-16 reworks slot frames. Follow-up `Trigger: S-16`.
- **Decision**: DEFERRED to follow-ups/review-fixes.md

### F5 — Hint „Stuknij mebel…” while walls, floor and curtains can change too

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/data/pl.ts `pl.room.change.hint`
- **Detail**: Grammar is correct, but „mebel” excludes the floor, walls and curtains, which the mode changes too. A 7-year-old may not try them.
- **Fix**: keep for now (plan copy, maintainer decision row 6.8); an alternative „Stuknij to, co chcesz zmienić.” keeps the same length without the noun.
  - Strength: no noun to agree with, covers every slot.
  - Tradeoff: vaguer; the maintainer chose the plan copy.
  - Confidence: MED — copy taste, not a rule.
  - Blind spot: how children read it on a device.
- **Decision**: DEFERRED to the maintainer (row 6.8), follow-up `Trigger: human checklist 6.8`

### F6 — Drawing constants in `RoomDoneCard` outside the layout tokens

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/RoomDoneCard.ts `drawRoomTile` (check-mark stroke 7), `drawTeaserTile` (padlock 28/56/44/8/18, `top + 70`)
- **Detail**: Placeholder glyph geometry inline in the widget; the rest of the card reads `ROOM_DONE_LAYOUT`. Not player-facing text or balance numbers; replaced by art in S-16.
- **Fix**: move into `ROOM_DONE_LAYOUT.tiles` if the placeholder outlives S-16. Follow-up `Trigger: S-16`.
- **Decision**: DEFERRED to follow-ups/review-fixes.md

## Rows

- 2.4 [reviewer] teacher read — ticked (above).
- 5.5 [reviewer] teacher read in context — ticked (above).
- 6.5 [reviewer] seam sweep — ticked: no duplicate helpers beyond F4, stale comments fixed (F2), no dead keys (`pl.room.name` used by `RoomDoneCard`, `roomText` replaces the casts), every gap 37–41 has a `DESIGN-GAP` comment in code (10 references), follow-ups carry `Trigger:` lines.

## Autonomous decisions

1. Deep review in the main session without the two sub-agents the skill describes: the code diff is ~1000 lines in 20 files, read in full here (reducer, hit-test, gesture, scene, card, seam); the riskiest claims (free change, seam in production, holdPoint use, tap leak) were verified by reading and by re-run breaks. Would change: a larger diff.
2. Triage in place (no AskUserQuestion): F1/F2 fixed (cheap, docs/comments), F3 accepted, F4/F6 to follow-ups (S-16 reworks those files), F5 left to the maintainer's copy row 6.8. Would change: maintainer disagreement on disk.

MERGE: CLEAR — all gates re-run green (unit 1035+43, e2e 24+2 in this session), both re-executed breaks red then restored, `e2eStars` absent from dist/, no critical findings; the only fixes were a design-gap row and layout comments.
