<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Bathroom, the fourth room of house 1, and a four-tile room-done card

- **Plan**: context/changes/bathroom-room/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-11-01
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning (fixed), 4 observations

Reviewed on `feat/bathroom-room` at b5a2a1e (diff `e451fa8..HEAD`, 34 files outside `public/assets`). The diff is small
(code: `src/core/roomDoneLayout.ts`, `RoomDoneCard.show`, data rows, `ROOM_PACKS` row), so plan-drift and quality were
read directly by the reviewer instead of two sub-agents (autonomous decision, handoff §6).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F1, fixed) |
| Success Criteria | PASS |

## Plan adherence (every planned change)

| file / symbol | plan | verdict |
|---|---|---|
| `src/core/roomDoneLayout.ts` `roomDoneCardRect` | width `max(minWidth, total + 2·padding)`, centred on `centerX`, `tileLefts`; spec passed in (core imports no data) | MATCH |
| `tests/roomDoneLayout.test.ts` | literals n = 0..5 (388/1144 … 16/1888), tiles inside card | MATCH |
| `src/data/layout.ts` `ROOM_DONE_LAYOUT.card` | `centerX`/`minWidth`/`padding`, no `left`/`width`; `tiles.left` gone; gap-204 comment | MATCH |
| `src/ui/widgets/RoomDoneCard.ts` `show` | fill, stroke, tile lefts and burst from the rect | MATCH |
| `tests/layout.test.ts`, `tests/roomDoneCardWiring.test.ts` | n 2..5 in screen, clear of HUD, "Dalej" inside, 2/3 = 388/1144; wiring source guard | MATCH |
| `scripts/make-task-art.mjs` `ROOM_PACKS` bathroom row, 21 WebP | `recolourBoard: false`, 18 furniture + 3 scene | MATCH |
| `src/data/rooms.ts` `BATHROOM`, `bathroomSlots`, `ROOMS` | manifest geometry, 5 + 7/9/10/12/13/15 = 71, after `CHILDREN` | MATCH |
| `src/data/roomArt.ts` `ROOM_SCENE_FILES.bathroom` | before/after/shadows | MATCH |
| `src/data/pl.ts` names/tasks/slots/variants | the plan's copy table, row-205 comments | MATCH |
| `src/data/houses.ts` `HOUSES['house-1']` | `{ room: 'bathroom', floor: 1, place: 1 }`, header comment | MATCH |
| `tests/fixtures/save-v6-children-done.json` + `fixtureLoadPath` case | frozen v6, load mirror lands in bathroom | MATCH |
| flipped e2e specs (kids-room #16, kitchen-room #2/#16, rooms-as-data, room-change) | per the plan's table | MATCH |
| docs: CLAUDE.md S-31 sentence, gaps 204 (edited) and 205, follow-ups | present | MATCH |
| `tests/e2e/bathroom-room.spec.ts`, `playwright.config.ts` `ROUND_SPEC` | two tests, risk ids in titles, rendered-frame proofs | MATCH |

No EXTRA code change. `context/foundation/roadmap.md` S-31 status `proposed` → `planning` (chain bookkeeping).
Save format v6 untouched; `git log e451fa8.. -- src/core/save.ts src/core/migrations` empty.

## Findings

### F1 — Stale test title after the bathroom row

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/fixtureLoadPath.test.ts — `it('save-v6-kitchen-done meets the children\'s room: …')`
- **Detail**: Phase 4 changed the assertion to four rooms (`['salon', 'kitchen', 'children', 'bathroom']`) but the
  title still said "house with three cells" — a later phase silently changed an earlier slice's contract text.
- **Fix**: title now reads "house with four cells (the bathroom listed since S-31)".
- **Decision**: FIXED (`fix(bathroom-room): poprawki po impl-review`)

### F2 — Layout test does not pin the padding

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/layout.test.ts — "lays the room list tiles … for two to five tiles"
- **Detail**: Re-executed break: dropping `2 * spec.padding` in `roomDoneCardRect` turns `tests/roomDoneLayout.test.ts`
  red (n = 4 and n = 5) while `tests/layout.test.ts` stays green (a card flush with its tiles still contains them).
  The pure test is the guard; the layout test proves fit in the screen. Acceptable split, recorded.
- **Fix**: none.
- **Decision**: RECORDED

### F3 — `describe` title of the house-1 cell tests names only the children's room

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/houseCells.test.ts — `describe('house-1 with the children\'s room (S-25)')`
- **Detail**: The two S-31 cases sit in the S-25 block; harmless, readable from the `it` titles.
- **Fix**: none.
- **Decision**: RECORDED

### F4 — Card-face pixel in the e2e spec proves nothing on its own

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/bathroom-room.spec.ts — `CARD_ONLY_POINT`
- **Detail**: The card face (255,247,222) is within 2 of the cream room behind it, so `CARD_ONLY_POINT` would pass
  with the old card too; the border checks `CARD_LEFT_EDGE`/`CARD_RIGHT_EDGE` carry the proof (handoff of phase 6
  says so; re-executed here: fixed 1144 card → red on `CARD_RIGHT_EDGE`).
- **Fix**: none.
- **Decision**: RECORDED

### F5 — Follow-up 10 trigger fires on every room slice

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: context/changes/bathroom-room/follow-ups/review-fixes.md item 10
- **Detail**: "the precache set" changes in S-32 and S-33 again; the item will be re-recorded each time. Kept as is.
- **Fix**: none.
- **Decision**: RECORDED

## Polish-language read (row 3.7, as a primary-school teacher)

Name "Łazienka". Captions in the nominative: "wanna z zasłonką", "umywalka i lustro", "regał z ręcznikami", "dywanik",
"roślina", "półka z zabawkami" — correct. Variants agree: wanna/roślina/półka (f.) → Naturalna/Słoneczna/Miętowa;
"umywalka i lustro" (two non-masculine-personal nouns, plural) → Naturalne/Słoneczne/Miętowe; regał/dywanik (m.) →
Naturalny/Słoneczny/Miętowy. Task labels imperative + accusative: "Postaw wannę z zasłonką", "Ustaw umywalkę i lustro"
(lustro acc. = nom.), "Postaw regał z ręcznikami", "Połóż dywanik", "Postaw roślinę", "Powieś półkę z zabawkami" —
correct and natural. Longest label (24 chars) is shorter than the shipped "Postaw skrzynię na zabawki" and is fitted by
`labelScale` in `RoomTaskButton`. No task content changed: `npm run sample` E1–E6 all OK. PASS.

## Success criteria observed in this review

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 4233 passed = baseline 4215 + 18 (roomDoneLayout 7, wiring 1, roomsData 4, houseCells 2, fixtureLoadPath 2, roomHit 1, bootBudget per-room 1) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1..E6` | all OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| Full e2e (orchestrator, pinned worktree b5a2a1e, `--workers=4`, load ~38) | 193 = 191 + 2; 180 passed + 13 load timeouts, all 13 green on `--last-failed --workers=1` (inherited from orchestrator, not re-run) |
| `bathroom-room.spec.ts` single, `--workers=1` | 2 passed (2.2 m) after the breaks were restored |
| Break: drop `2 * spec.padding` (phase 1 RED) | roomDoneLayout n=4, n=5 red; restored |
| Break: remove the `HOUSES` bathroom row (phase 4 RED) | 7 red across roomsData, houseCells, fixtureLoadPath; restored |
| Break: `RoomDoneCard.show` draws a fixed 1144 card (handoff break) | e2e #16 red on `CARD_RIGHT_EDGE` border poll; restored |

Hooks: no change to `.claude/settings.json` or hooks on the branch; no `--no-verify` in the log.

MERGE: CLEAR — all planned changes match, gate green (unit 4215 + 18), handoff breaks re-executed red, one stale test title fixed.
