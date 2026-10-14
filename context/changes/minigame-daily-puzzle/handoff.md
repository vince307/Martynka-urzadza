# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-tdd` phase 1 step (autonomous run 2026-10-14-save-s13b-s15-s14b). Save format v2 is built and committed
(`b0ad4ba`); phases 2-13 are untouched. Phase 2 (`backup-v1`, `migration-failed`) MUST ship in the same PR: phase 1 alone
overwrites a child's v1 save with v2 without a backup copy.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + `b0ad4ba` (phase 1) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 64 (`grep -c '^- \[ \]' plan.md`); phase 1 rows 1.1-1.4 ticked, 1.5 [reviewer] and 1.6 [human] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `VariantState`, `SaveV2`, `SaveState = SaveV2` (`SaveV1` stays as migration input) |
| `src/core/save.ts` | `SAVE_VERSION = 2`, exported `MIGRATIONS[1]`, `validVariants`, `importProblem` (names the problem after migration), `variants` in `SessionSave`/`encodeSave`/`toSession`/`freshSession` |
| `src/core/saveFile.ts` | `parseImport` uses `importProblem` (a corrupt v1 file still names its field) |
| `src/data/layout.ts`, `src/main.ts` | `REGISTRY_KEYS.variants` in `SAVE_KEYS`; registry seeded at preBoot, snapshot reads it |
| `tests/fixtures/save-v2.json`, `save-v2-fresh.json` | new frozen v2 fixtures (v1 fixtures untouched) |
| `tests/save.test.ts`, `saveFile.test.ts`, `saveKeys.test.ts`, `autosave.test.ts`, `rooms.test.ts` | new/updated tests (see §6 for the updated ones) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, before production code) | `AssertionError: expected { kind: 'ok', …(2) } to deeply equal { kind: 'ok', migratedFrom: 1, …(1) }` (v1 fixture migrates); 32 tests red in save/saveFile |
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` + deploy scripts + `sample` E1-E6 | unit 2239 passed (baseline 2224, +15); sample no violations; deploy scripts OK |
| `npm run build` | OK, `e2e hook: absent` |
| `npx playwright test --config=...` | 63 passed (baseline 63, +0), run in this session |
| `git diff --stat main -- tests/fixtures/save-v1*` | empty (byte-identical) |
| Deliberate break A: `MIGRATIONS[1]` without `variants` | 60 red; restored. Meta: red because the frozen v1 fixture's migrated output fails validation (reads the file, not a literal) |
| Break B: `encodeSave` writes `version: 1` | 26 red; restored |
| Break C: `saveProblem` ignores `variants` | 6 red (bad-variants cases, missing block); restored |

## 4. Next command

`/10x-tdd minigame-daily-puzzle phase 2` (Phase 2: Bezpieczeństwo migracji; `Driver: tdd`)

## 5. Open

- 1.5 [reviewer], 1.6 [human] (one-way door: a rollback to a v1 build shows the "newer version" card) stay open.
- `saveProblem` now checks `version === 2` only; v1 files are checked via `importProblem` (migrate then validate). Phase 2's backup must copy the raw v1 value BEFORE the first v2 write.
- `src/main.ts` snapshot falls back to `session.variants` if the registry key is missing.
- `tests/e2e/save-transfer.spec.ts` still builds a v1 `playableSave` and imports it (valid: migrated); phase 3/11 may switch it.

## 6. Autonomous decisions

1. **Existing tests changed, not weakened.** `save.test.ts` "v1 format did not change" became the same round-trip check on the v2 fixtures; "future" now uses `SAVE_VERSION + 1`; the migration-chain tests pass `MIGRATIONS[1]` as step 1; `saveFile`/`saveKeys`/`autosave`/`rooms` tests that used a v1 object as the current save use v2 (v1 import coverage kept and extended). Would change: a reviewer reading any of these as lost coverage.
2. **Added `importProblem`** (not in plan) so import of a corrupt v1 file keeps naming the broken field (`saveProblem` on the raw v1 would say `version`). Rejected: making `saveProblem` accept v1.
3. **`MIGRATIONS` exported** for the chain tests. Rejected: re-declaring the step in tests (would not read the real one).
