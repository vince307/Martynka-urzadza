# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-e2e rooms-as-data phase 7` step of run 2026-10-30-rooms-kitchen: phase 7 (e2e spec) is committed (`9bfa475`); this was the last phase, `change.md` status is now `implemented`.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, phase 3 `96f9128`, phase 4 `c9fcca5`, phase 5 `2c367e8`, phase 6 `01bedba`, phase 7 `9bfa475`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 7.2 (full-suite clause, orchestrator), 6.6 [visual], 6.7 [human], 6.8 [human], 6.9 [reviewer] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/rooms-as-data.spec.ts` | 3 hook-build tests on the `v4-salon` seam (#10 x2, #2); the last one reads the real IndexedDB (`martynka` / `saves` / `profile:default`) after a reload |
| `tests/e2e/support/hook.ts` | `Snapshot` gained `house`, `currentRoom`, `store.writtenHouse` (types only; the hook already reported them) |
| `playwright.config.ts` | `rooms-as-data` added to `ROUND_SPEC` (webServer entries untouched) |
| `context/changes/rooms-as-data/plan.md` | rows 1.4, 2.5, 3.5, 4.4, 5.5, 6.5 (e2e clause), 7.1, 7.3 ticked |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `npx playwright test tests/e2e/rooms-as-data.spec.ts tests/e2e/save-migration.spec.ts --workers=1` | 5 passed |
| break: `main.ts` load merge bypassed (`house: savedHouse`), `-g "a v4 salon save opens"` | red (house diff), restored |
| break: `LIFT_V4_HOUSE` drops `chosen`, same `-g` | red, restored |
| break: `migrated: undefined` in `main.ts`, `-g "after a round the save is written"` | red (ops/backup), restored |
| break: `roomInRenovation` returns the unknown cell, `-g "finished salon"` | red, `currentRoom` "kitchen" vs "salon", restored |
| break "drop `house` from `toSession`" | stayed green: the load-path merge (`mergeHouse` in `main.ts`) rebuilds the house from data; replaced by the merge bypass above |
| lint / typecheck / unit / build | pass / pass / 213 files 4012 tests / `e2e hook: absent (2 chunks checked)` |
| full e2e suite | NOT run (orchestrator) |

## 4. Next command

`/10x-impl-review rooms-as-data`

## 5. Open

- 7.2 full-suite clause (`baseline + 3`, `--list` total) is the orchestrator's; 6.6 [visual], 6.7 [human] rollback risk, 6.8 [human] two-real-builds decision, 6.9 [reviewer] CI at ship.
- Follow-ups: `context/changes/rooms-as-data/follow-ups/review-fixes.md`. DESIGN-GAP: none.
- Blind spot recorded: a done-card test that returns the current room for every tile is unaffected (one room); covered by the phase-4 guard.

## 6. Autonomous decisions

- Break "drop `house` from `toSession`" replaced by bypassing the load-path merge (rule broken: the house comes from data on load), because the original is masked by design.
- The saved-state check uses a raw IndexedDB read in the spec (no hook field exposes `rooms` keys); `rooms` has no `kitchen` key proved there.
- Earlier e2e rows ticked with the orchestrator's 167/167 evidence only for their e2e clause.
