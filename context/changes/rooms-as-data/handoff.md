# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-impl-review rooms-as-data` step of run 2026-10-30-rooms-kitchen: full-plan review done, verdict APPROVED,
`MERGE: CLEAR`; two WARNINGs fixed in `4b1c37e`. The next agent must not miss that the changed e2e test (finished salon, now read
through the hook's new `rooms` field instead of IndexedDB) has NOT been run in a browser yet: the orchestrator re-runs it.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phases `dd6db69` (p1), `901926e` (p2), `96f9128` (p3), `c9fcca5` (p4), `2c367e8` (p5), `01bedba` (p6), `9bfa475` (p7), review fix `4b1c37e`, plus docs commits; this handoff in `docs(rooms-as-data): przegląd implementacji` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5: 6.6 [visual], 6.7 [human], 6.8 [human], 6.9 [reviewer] (CI at ship), 7.2 (full e2e, orchestrator) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/rooms-as-data/reviews/impl-review.md` | review report: 0 critical, 2 warnings (fixed), 4 observations, migration evidence table; ends `MERGE: CLEAR` |
| `src/testing/e2eHook.ts` | hook snapshot gains `rooms` (deep-frozen copy of `REGISTRY_KEYS.rooms`; e2e build only) |
| `tests/e2e/support/hook.ts` | `Snapshot.rooms` type |
| `tests/e2e/rooms-as-data.spec.ts` | finished-salon test reads `save`, `house`, `rooms` from the hook after the reload; no `indexedDB.open` |
| `tests/saveV5.test.ts` | `it.each` over both v4 fixtures: decode + encode equals the literal fixture with `version: 5`, the house and guard placeholders |
| `context/changes/rooms-as-data/follow-ups/review-fixes.md` | entries 14 (done-card `mode`, Trigger: S-22) and 15 (frozen `copyOfHouseV5` stays, Trigger: next migration change) |
| `context/changes/rooms-as-data/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | pass / pass (before and after the fix) |
| `npm test` on a worktree of `main` `9d28753` | 209 files, 3962 passed (= contract baseline) |
| `npm test` at `66f16c4` / after `4b1c37e` | 4012 (3962 + 50) / 4014 (3962 + 52), 213 files (+4) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS |
| probe: v4 code (`main` worktree) on `save-v5.json` | `decodeSave` → `unreadable/future`; `writeVerdict` normal and replace → `refuse NewerSave` |
| probe: v5 code, both v4 fixtures decode+encode | deep-equal to the fixture + `version 5` + house + guard placeholders (lossless) |
| break: `LIFT_V4_HOUSE` resets `variants.roundsSince` | `tests/saveV5.test.ts` 4 red; restored |
| break: `toSession` drops `streak` | 3 red (the two new cases + v5 round trip; the older v4 "keeps every field" case stayed green = the gap F2 closes); restored, `git diff --stat` empty. Meta-check: the oracle is the frozen fixture literal, not migration output |
| e2e | NOT run: ports 4397/4398 held by the orchestrator's full suite |

## 4. Next command

Orchestrator first re-runs `npx playwright test tests/e2e/rooms-as-data.spec.ts -g "finished salon"` (green; then red with the break below, restored) and records 7.2; then the visual gate (rooms: salon before / after the stage / finished with the "Pokój gotowy!" done card, "Zmień wygląd", "Zapis gry" after `?e2eSave=v4-salon`), then `/10x-archive rooms-as-data`.

## 5. Open

- E2E re-run owed (F1): spec title `#10 rooms-as-data a finished salon reopens in the salon, never in the kitchen cell`; deliberate break: in `roomInRenovation` (`src/core/house.ts`) make an unknown room `return cell.room` instead of `continue` → red on `currentRoom` ("kitchen" vs "salon") and on `Object.keys(rooms)`; restore.
- 7.2 full e2e `<branch e2e baseline> + 3`, total equals `npx playwright test --list | tail -1` (orchestrator).
- Human checklist: 6.6 [visual] screenshots vs `main`; 6.7 [human] accept rollback risk (`pl.saveFuture`, `deploy/README.md` v5 note); 6.8 [human] accept unit + in-memory-seam proof instead of two real builds; 6.9 [reviewer] (CI at ship) job `check` of workflow `CI`, log `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Follow-ups: `context/changes/rooms-as-data/follow-ups/review-fixes.md` (1–15). DESIGN-GAP: none added.

## 6. Autonomous decisions

- **No subagents for the review.** Chosen: read the whole code diff and probe the migration first-hand. Rejected: the skill's two parallel subagents. Why: ~900 code lines and a save migration that ships to every device; a summary hand-off would lose the probes. Would change: a diff too large for one context.
- **Triage without asking (contract rule 1).** F1, F2 fixed (cheap WARNINGs); F3, F5, F6 accepted; F4 deferred with Trigger S-22. Would change: the maintainer reading the report and wanting F4 now.
- **F1 fix shape: hook field `rooms` (registry copy), not a stored-save read.** Why: the registry after reload is what the load path made of the stored save (`save.load === 'loaded'` proves it came from the store), and a move to the kitchen would show there directly; profile § 9 forbids a test-side IndexedDB read. Would change: a need to prove the bytes written (then expose the store's last write through the hook, as `writtenHouse` does for the seam store).
- **Playwright not run.** Both e2e ports were listening (orchestrator's run); per the step prompt no server was started. Would change: free ports.
