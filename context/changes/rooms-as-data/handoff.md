# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-implement rooms-as-data phase 4` step of run 2026-10-30-rooms-kitchen: phase 4 is committed (`c9fcca5`). The room name and thumbnail are per-room data and each done-card tile is drawn from its own room.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, phase 3 `96f9128`, phase 4 `c9fcca5`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`); 1.4, 2.5, 3.5, 4.4 open (e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/pl.ts` | `pl.room.names` replaces `pl.room.name`; `roomText.name(id)` |
| `src/core/types.ts`, `src/data/rooms.ts` | `RoomDef.name` removed; `RoomDef.thumbnail?` (salon: `UI_ART_KEYS.salonAfter`) |
| `src/core/artPick.ts` | `miniatureMode(..., thumbnailKey: string \| undefined)` |
| `src/ui/widgets/RoomDoneCard.ts`, `src/scenes/RoomScene.ts`, `src/scenes/UIScene.ts` | `show(items, catalogue, states, current)`; `savedRooms()`; `roomName` via `roomText.name` |
| `tests/roomDoneCardWiring.test.ts` (new), `tests/artPick.test.ts`, `tests/roomsData.test.ts`, `tests/e2e/save-transfer.spec.ts` + 7 tests without `name:` in RoomDef literals | guards and cases |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit baseline | 4008 (after phase 3) |
| unit after phase 4 | 213 files, 4010 tests passed: +2 |
| break 1 | `catalogue[item.id]` -> `catalogue[current]` in `RoomDoneCard`: wiring guard red (first guard version stayed green, strengthened to `catalogue[item.id]`); restored |
| break 2 | `undefined` thumbnail key returns `thumbnail`: picker case red; restored |
| meta-check | each sed verified by `cmp` against a saved copy; the guard is a source check, it cannot see pixels (visual pass 6.6 and phase 7) |
| lint / typecheck | pass / pass |
| deploy scripts, `sample` E1-E6 | OK OK / all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| row 4.3 | `pl.ts` diff only `name` -> `names` plus `roomText.name`; the two greps empty |
| Playwright e2e | NOT run (orchestrator owns ports); row 4.4 left unticked |

## 4. Next command

`/10x-implement rooms-as-data phase 5`

## 5. Open

- Rows 1.4, 2.5, 3.5, 4.4 stay unticked until the orchestrator's e2e (`--workers=4`, branch baseline + 0).
- The one declared parent-copy change: export/import/reset summaries print "Salon" instead of "salon" (the summary already capitalised, so likely no visible change; `tests/e2e/save-transfer.spec.ts` now reads `roomText.name`). DESIGN-GAP: none. Follow-ups: none new.

## 6. Autonomous decisions

- Skill checkpoints (execution mode, manual gate, commit message, dirty paths) decided in place: implemented in this context, proposed message used, stopped after phase 4.
- A teaser or a room missing from the catalogue is drawn as a teaser tile; `miniature()` reports the mode of the tile of `current`.
- `RoomScene` passes `{ ...saved rooms, [current]: resolved state }` as `states`.
- Earlier decisions (phases 2-3): `save-v5.json` built from `save-v4.json`; v4-era tests reworded to v5; marker `v4-salon` added to the guard test list.
