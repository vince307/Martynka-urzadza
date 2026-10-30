# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-implement rooms-as-data phase 3` step of run 2026-10-30-rooms-kitchen: phase 3 is committed (`96f9128`). The load path now merges
the saved house with data, follows the renovation rule and lists rooms from the house; `ROOM_ORDER` is gone. Phase 4 must not touch `src/core/save.ts` or fixtures.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, phase 3 `96f9128`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`); 1.4, 2.5, 3.5 open (e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/main.ts` | after `repairCurrentRoom`: `mergeHouse` with `houseLayout` (known id) or keep + warn (unknown id), then `nextRoom`; `houseEqual` / `movedFrom` mark dirty |
| `src/scenes/RoomScene.ts` | `listItems` = `roomsListView(houseRoomList(houseLayout(registry house, ...)))` |
| `src/data/rooms.ts` | `ROOM_ORDER` removed |
| `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs` | seam `?e2eSave=v4-salon` (marker `v4-salon`), `E2ESaveStoreLog.writtenHouse`, snapshot `house` and `currentRoom` |
| `tests/houseWiring.test.ts` (new), `tests/roomsData.test.ts`, `tests/e2eHookGuard.test.ts` | source guards, house-based list tests, marker list |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit baseline | 4002 (after phase 2) |
| unit after phase 3 | 212 files, 4008 tests passed: +6 |
| break 1 | `HOUSES` salon/kitchen swapped: 3 red in `roomsData` ("equals the old literal", first room, frozen cell); restored |
| break 2 | `nextRoom` called before `repairCurrentRoom` in `main.ts`: `houseWiring` order guard red; restored |
| meta-check | the guard proves order only; behaviour under a real v4 save is proven by phase 7 e2e |
| lint / typecheck | pass / pass |
| deploy scripts, `sample` E1-E6 | OK OK / all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| row 3.4 | `git diff 901926e --stat -- src/ui/widgets src/core/save.ts tests/fixtures public` empty |
| Playwright e2e | NOT run (orchestrator owns ports); row 3.5 left unticked |

## 4. Next command

`/10x-implement rooms-as-data phase 4`

## 5. Open

- Rows 1.4, 2.5, 3.5 stay unticked until the orchestrator's e2e (`--workers=4`, branch baseline + 0).
- The seam `v4-salon` is not yet used by a spec (phase 7). Manual rows 6.6-6.9 as in the plan. DESIGN-GAP: none. Follow-ups: none new.

## 6. Autonomous decisions

- Skill checkpoints (execution mode, manual gate, commit message, dirty paths) decided in place: implemented in this context, proposed message used, stopped after phase 3.
- `tests/e2eHookGuard.test.ts` marker list gained `v4-salon` (a required follow-on of the new marker, not in the plan's file list).
- Snapshot `house` is the registry value (null if unset); an unknown saved house id is kept as saved and warned, as the plan says.
- Earlier decisions (phase 2): `save-v5.json` built from `save-v4.json`; v4-era tests reworded to v5.
