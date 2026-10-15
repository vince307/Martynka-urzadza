# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by `/10x-tdd salon-load-health phase 1`: save format v3 with the old salon in `MIGRATIONS[2]` is done and committed (826150c). The one thing not to get wrong in phase 2: `remapLegacySalon`/`LEGACY_SALON` are still live in `main.ts`/`UIScene` (a no-op on v3), and `tests/legacySalonMigration.test.ts` pins `LEGACY_SALON_V2` to `LEGACY_SALON`, so deleting the data must turn that pin into a literal (frozen) check.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | identity, research, plan, plan review, `826150c` (p1) + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 5 closes it) |
| `## Progress` rows remaining | 22 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/migrations/legacySalon.ts` | new: `LIFT_V2_SALON` (total, M-2 marker = old-only keys), frozen `LEGACY_SALON_V2`, `SALON_V3_TARGET` |
| `src/core/save.ts` | `SAVE_VERSION` 3, `MIGRATIONS[2]`, `saveProblem`/`encodeSave` use the constant |
| `src/core/types.ts` | `SaveV3`, `SaveState = SaveV3` |
| `src/testing/e2eHook.ts` | `legacy-salon` seam returns the frozen v2 fixture (no `legacySalonSession`) |
| `tests/legacySalonMigration.test.ts` | new, 27 cases (rule B literals 1..10, M-2, totality, idempotence, table pins) |
| `tests/fixtures/save-v3.json`, `save-v2-legacy-salon.json` | new fixtures (legacy one generated from `encodeSave(legacySalonSession())` while `SAVE_VERSION` was 2); no frozen fixture changed |
| `tests/save.test.ts`, `saveFile.test.ts`, `e2eSave.test.ts`, `autosave.test.ts` | version 3 asserts, v2 fixtures decode with `migratedFrom 2`, `saveProblem` cases on v3 (plan-review F2), seam test, future = version 4 |
| `tests/e2e/{salon-art,save-migration,save-backup-health}.spec.ts` | `writtenVersion` 3 and titles |
| `context/changes/salon-load-health/plan.md` | Progress 1.1-1.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, step stubbed to identity) | `AssertionError: expected [ '1' ] to deeply equal [ '1', '2' ]` (MIGRATIONS registered), plus 16 more assertion failures; 50 failed in the whole suite before the implementation |
| `npm run lint` / `npm run typecheck` | pass / pass |
| `npm test` | 2972 passed (baseline 2939, +33: 27 new file, +1 seam, +5 save.test v3 cases) |
| deploy + ops shell tests, `sample` E1-E6 | pass |
| `npm run build` | pass, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 98 passed (baseline 98, +0) |
| `git diff --exit-code main -- tests/fixtures/` | clean; only 2 new untracked-then-added files |
| Deliberate break 1 (marker = any key not in target slots) | red: M-2 `armchair-2` test only; restored |
| Deliberate break 2 (no shape guard) | red: `rooms: null`, `chosen: null`, `salon: null` throw TypeError; restored |
| Deliberate break 3 (target cost 7 -> 8) | red: v3 target pin; restored |
| Meta-check | cases run on raw v2 bytes through `decodeSave`, so the chain (not a direct call with a validated session) is what is proved |

## 4. Next command

`/10x-tdd salon-load-health phase 2` (phase 2, `Driver: tdd`)

## 5. Open

- [human] 1.6 (v3 one-way door, rollback shows the `future` card); [reviewer] 1.5 (`save.ts` imports only `./migrations/legacySalon`, no `src/data`); 3.5 and 2.6 as in the earlier handoff.
- Phase 2 e2e: SV2-01 in `tests/e2e/save-backup-health.spec.ts` must accept `backup` `pending|failed`; `tests/autosave.test.ts` `migrated` cases will see the start write.
- The orchestrator ran no e2e for p1; the 98 above are mine from this session.

## 6. Autonomous decisions

1. **Mixed-phase split**: tests/step/fixtures TDD'd; the `e2eHook.ts` seam swap and the e2e spec version edits were inline scaffolding. Driver stays `tdd`.
2. **Step is total by returning the input with `version: 3`** for any shape it does not recognise (also a non-record `raw` is returned as is). Rejected: throwing (would be `migration-failed`). Would change: a product wish to name malformed salons apart from `corrupt`.
3. **Unrecognised extra salon fields are kept** (`...salon`); old values for dropped keys vanish with the old list. Would change: a v4 field in the room.
4. **`future` test uses version 4**, and `save-v3.json` is `save-v2.json` with the version changed (same content, living room).
