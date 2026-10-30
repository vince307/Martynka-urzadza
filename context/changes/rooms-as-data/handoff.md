# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-tdd rooms-as-data phase 2` step of run 2026-10-30-rooms-kitchen: phase 2 is committed (`901926e`), `SAVE_VERSION` is now 5
and a save carries `house`. The one thing the next agent must not get wrong: frozen fixtures v1-v4 (incl. `save-v4-salon.json`) and
`save-v5.json` are never edited, and phase 3 must not touch `src/core/save.ts` or fixtures (row 3.4); the load path applies the house in `main.ts` only.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 28 (`grep -c '^- \[ \]' plan.md`); rows 2.1-2.4 ticked, 2.5 and 1.4 open (e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/migrations/house.ts` | new: `HOUSE_V5` (frozen), `LIFT_V4_HOUSE` (fresh copy of the house per lift) |
| `src/core/save.ts` | `SAVE_VERSION` 5, `MIGRATIONS[4]`, `validHouse` (checked last), `copyHouse`, `SessionSave.house`, `freshSession(house, stars)` |
| `src/core/types.ts` | `SaveV5`, `SaveState = SaveV5` |
| `src/data/houses.ts` | new: `HOUSES` (`house-1`: salon (0,0), kitchen (0,1)), `FIRST_HOUSE`; `FIRST_ROOM` now derives from it |
| `src/data/layout.ts`, `src/main.ts`, `src/scenes/UIScene.ts`, `src/testing/e2eHook.ts` | `REGISTRY_KEYS.house` in `SAVE_KEYS`, preBoot + snapshot, `freshSession(FIRST_HOUSE, …)` |
| `tests/saveV5.test.ts`, `tests/fixtures/save-v5.json` | new (v5 fixture = `save-v4.json` lifted, room `living`, house-1 with `living` cell; frozen) |
| other tests | `helpers.ts` `houseOf`; `save`, `saveV4`, `saveFile`, `autosave`, `idbStore`, `fixtureLoadPath`, `legacySalonMigration`, `rooms`, `ageBack`, `saveKeys` follow v5 |
| `plan.md` | rows 2.1-2.4 ticked with `901926e` |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit baseline | 3982 (after phase 1) |
| unit after phase 2 | 211 files, 4002 tests passed: +20 (saveV5 17, autosave 1, idbStore 1, fixtureLoadPath +1 fixture) |
| RED | stub `house.ts` + `tests/saveV5.test.ts`: 15 failed, first `AssertionError: expected 4 to be 5` (`is the current version`), also `TypeError: MIGRATIONS[4] is not a function`, `expected null to be 4` (migratedFrom) |
| GREEN | saveV5 17 passed, then full suite after updating v4-era tests |
| break 1 | `LIFT_V4_HOUSE` reusing `HOUSE_V5`: `two lifts do not share the house object` red; restored |
| break 2 | `house` dropped from `toSession`: 3 red (fixture round-trip, migrated-field case, encode copies); restored |
| break 3 | `house` check before `stars`: `checks the house after stars` red; restored |
| meta-check | v4 oracle = frozen fixture proven in phase 1; v5 oracle = literal house in the test; neither computed by the migration |
| lint / typecheck | pass / pass |
| deploy scripts, `sample` E1-E6 | OK OK / all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| row 2.3 diff vs `dd6db69` (fixtures v1-v4 + salon, `legacySalon.ts`) | empty |
| row 2.4 | `grep "freshSession(FIRST_ROOM" src` empty; layout.ts has `house` key and `SAVE_KEYS` entry |
| Playwright e2e | NOT run (orchestrator owns ports); row 2.5 e2e part left unticked. e2e specs read `SAVE_VERSION`, so they follow to 5 |

## 4. Next command

`/10x-implement rooms-as-data phase 3`

## 5. Open

- Rows 1.4 and 2.5 stay unticked until the orchestrator's e2e (`--workers=4`, expected branch baseline + 0).
- No load-time merge yet: a loaded session keeps its saved house (phase 3 adds `mergeHouse`, `nextRoom`, `ROOM_ORDER` removal).
- `fixtureLoadPath` now includes `save-v5`; `save.test.ts` and `saveFile.test.ts` use `save-v5.json` as the "current valid save".
- Manual rows 6.6-6.9 as in the plan. DESIGN-GAP: none. Follow-ups: none new.

## 6. Autonomous decisions

- Skill checkpoints (manual gate, how to proceed, commit message, dirty paths) decided in place: planned set only committed, stopped after phase 2, proposed message used.
- Phase keeps `Driver: tdd`; implementation did not exist. The `Skill` tool was invoked; its instructions followed from the plan.
- `save-v5.json` is built from `save-v4.json` (room `living`) rather than the salon fixture, so the many existing tests that used `save-v4.json` as "the current valid save" keep their `rooms.living` oracles; the salon is covered by lifting `save-v4-salon.json`. Would change: a reviewer wanting a salon v5 fixture (cheap to add as a second frozen file).
- Existing v4-era tests were reworded to v5 (`migratedFrom: 4`, `version: 5`, chain tables gain `4: MIGRATIONS[4]`, "future" probes use version 6); their v4 assertions on frozen fixtures were not weakened.
- `freshSession` takes a `HouseState`; tests use `houseOf(room)` in `tests/helpers.ts`.
