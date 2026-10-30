# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-implement rooms-as-data phase 6` step of run 2026-10-30-rooms-kitchen: phase 6 (docs, follow-ups, seam sweep) is committed (`01bedba`). The last implementation phase is done; phase 7 is the e2e spec, and the e2e rows 1.4, 2.5, 3.5, 4.4, 5.5, 6.5 belong to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, phase 3 `96f9128`, phase 4 `c9fcca5`, phase 5 `2c367e8`, phase 6 `01bedba`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged, skill epilogue not run) |
| `## Progress` rows remaining | 13 (`grep -c '^- \[ \]' plan.md`): e2e rows 1.4, 2.5, 3.5, 4.4, 5.5, 6.5; manual 6.6-6.9; phase 7 rows 7.1-7.3 (count as printed by grep) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | S-11 sentence now says v5 / `SAVE_VERSION` 5; one new F-04 sentence group before "Progress is tracked in" |
| `deploy/README.md` | docs-only rollback note for format v5 (`pl.saveFuture`, nothing overwritten) after the v4 note |
| `context/changes/rooms-as-data/follow-ups/review-fixes.md` | 13 open follow-ups, each with `Trigger:`, plus two closed by history |
| `src/core/house.ts`, `src/core/save.ts` | one `copyHouse` (exported from `house.ts`, `save.ts` imports it) |
| `src/data/roomArt.ts` | header no longer says "salon" only |
| `tests/e2e/save-migration.spec.ts` | titles and header say "current build" instead of "v4 build" (no logic change; phase 7 owns the spec) |
| `context/changes/rooms-as-data/plan.md` | rows 6.1-6.4 ticked with sha |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit | 213 files, 4012 tests passed (phase 5 baseline 4012, delta +0: no test added) |
| 6.1 `validate-rule-files.sh` (sandbox off) | PASS, 24 rule files, 0 missing; `save format v5` present in CLAUDE.md |
| 6.2 | 14 lines match `Trigger:` (13 open entries + the heading note), at least 10 |
| 6.3 | the grep hits only guard tests that name the removed symbols (`tests/houseWiring.test.ts`, `tests/roomDoneCardWiring.test.ts`) and `ROOM_SCENE_FILES` (the plan's `SCENE_FILES\b` has no left word boundary, so it matches the new name; intended); `HOUSE_V5 = ` appears once, in `src/core/migrations/house.ts` |
| 6.4 | `git diff --stat bc19919` over balance, curriculum, public and frozen fixtures v1-v4: empty |
| lint / typecheck | pass / pass |
| deploy scripts, `sample` E1-E6 | OK OK / all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| deliberate break | phase 6 names none (docs and a dedupe covered by existing tests); none run |
| Playwright e2e | NOT run (orchestrator owns ports); 6.5 left unticked |

## 4. Next command

`/10x-e2e rooms-as-data phase 7`

## 5. Open

- Unticked and not the implementer's: 1.4, 2.5, 3.5, 4.4, 5.5, 6.5 (orchestrator e2e `--workers=4`, branch baseline + 0), 6.6 [visual], 6.7 [human] rollback risk, 6.8 [human] two-real-builds decision, 6.9 [reviewer] CI at ship.
- Follow-ups: `context/changes/rooms-as-data/follow-ups/review-fixes.md`. DESIGN-GAP: none.
- `copyOfHouseV5` in `src/core/migrations/house.ts` is deliberately separate (frozen migration table must not depend on live helpers).

## 6. Autonomous decisions

- Skill checkpoints (execution mode, commit message, dirty paths) decided in place: implemented in this context, proposed message used, stopped after phase 6; epilogue not run.
- Seam sweep found and fixed: duplicate `copyHouse` in `save.ts` (reuse the one in `house.ts`; rejected a shared util file, not worth a module), stale `roomArt.ts` header, "v4 build" wording in `save-migration.spec.ts`. Already clean from earlier phases: `ROOM_ORDER`, `SALON_ART`, `pl.room.name`, `save.ts` header, `RoomDoneCard` doc, `make-task-art.mjs` header, `e2eHook.ts` seam doc.
- Spec titles changed to "current build" so they stay true at v6; reverse if phase 7 wants literal version names.
- Not editing `AGENTS.md`: grep showed it repeats no save-format facts.
