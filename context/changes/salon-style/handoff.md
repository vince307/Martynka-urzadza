# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-tdd salon-style phase 1` step: phase 1 is committed (7d2e520), rows 1.1-1.4 ticked. Nothing is drawn yet; the next agent
must not read the new required `RoomDef.worn` / `contactShadows` as drift (the plan adds them), and `scene.furnishingsBefore` stays until phase 3.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | five before this handoff: identity, research, plan, plan review, `test(salon-style): worn grade and piece rules (p1)` 7d2e520 |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/colorGrade.ts` | `gradeMatrix(GradeParams): number[]` (pure, no Phaser) |
| `src/core/rooms.ts` | `wornPieces`, `contactShadowPieces(room, state, heightRatio)`, types `WornPiece`, `ContactShadowPiece` |
| `src/core/types.ts` | `GradeParams`, `WornDef`, `ContactShadowDef`; `RoomDef.worn` and `.contactShadows` (required) |
| `src/data/rooms.ts` | `SALON.worn` (10 pieces, z order) and `SALON.contactShadows` (4) |
| `src/data/layout.ts` | `ROOM_LAYOUT.worn` (grade, soft, canvasWash) and `ROOM_LAYOUT.contactShadow` |
| `tests/colorGrade.test.ts`, `tests/roomWorn.test.ts` | 13 new cases (3 + 10) |
| `tests/roomFixtures.ts`, `tests/roomShown.test.ts` | `worn: []`, `contactShadows: []` added to the literals |
| `context/changes/salon-style/plan.md`, `change.md`, `handoff.md` | rows 1.1-1.4 ticked; status in_progress; this file |

## 3. Verification

| command | result |
|---|---|
| RED (against stubs: identity matrix, both piece rules `[]`) | 7 failed, 6 passed. First: `AssertionError: cell 0: expected 1 to be close to 0.5794` (colorGrade); `expected [] to deeply equal [ 'salon/wall-frames', …(9) ]` (roomWorn) |
| GREEN | `npx vitest run tests/colorGrade.test.ts tests/roomWorn.test.ts`: 13 passed |
| deliberate break 1: `mul(sat, mix)` -> `mul(mix, sat)` (order swap) | 2 red (both literal-matrix cases), restored |
| deliberate break 2: dropped the `stagesDone > 0` guard | 2 red (after-stage case, never-shown property), restored |
| deliberate break 3: `art.x + def.offset[0]` (no anchor) | 1 red (literal-coordinate case), restored |
| meta-check | oracles are literals from the research prototype / hand computed from `SALON` numbers, not from the code; the order-swap break is detected only because the sepia/saturation matrices do not commute |
| `npm run lint`, `typecheck` | clean |
| `npm test` | 3928 passed, 206 files (baseline 3915, +13) |
| deploy scripts, `sample` E1-E6 | OK, all exit 0 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/pl.ts` | empty |
| Playwright | not run (orchestrator; phase 1 expects baseline 160 + 0) |

## 4. Next command

`/10x-implement salon-style phase 2`

## 5. Open

- Manual rows (phase 5): 5.6-5.10 [human]/[visual], 5.11 [reviewer] as in the plan.
- Known risk carried: nested per-image ColorMatrix filters in `SalonBackdrop.render` (plan "Known risks").
- Follow-ups for phase 5 and DESIGN-GAPs 169-172 (107 and 109 amended): unchanged from the plan-review handoff. The new data comments cite gap rows 169-171, not yet written to `docs/design-gaps.md`.

## 6. Autonomous decisions

- `RoomDef.worn` / `contactShadows` made required (plan says "gains"): only `tests/roomFixtures.ts` and `tests/roomShown.test.ts` needed edits, other literals build on `TEST_ROOM_PARTS`. Rejected: optional fields (would hide a room without a worn set). Would change: a room added without the pieces.
- Stubs lived in the real files (`gradeMatrix` identity, piece rules `[]`) so RED is an assertion failure, not a missing module. Would change: nothing.
- Driver stays `tdd`; no redirect (grep showed the rules absent).
- No lessons file exists; none applied.
