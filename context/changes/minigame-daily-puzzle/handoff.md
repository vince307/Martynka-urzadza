# Handoff — `minigame-daily-puzzle` (slice S-15)

Updated by the `/10x-e2e` phase 11 finishing step (spec committed as `aac2e84`, e2e evidence from the orchestrator). Earlier: phase 10 step (last impl/tdd phase). Seam sweep, design-gap rows 79-87, CLAUDE.md sentence and follow-ups are done. Phases 11-13 are e2e.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-10 (…, `120a26f` p9, `94bb48c` p10) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 9: 9.3 ticked from the orchestrator note (63 passed on 120a26f), 9.4 [visual], 9.5 [human] open; phase 10: 10.1-10.4 ticked, 10.5 [reviewer], 10.6 [human] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `docs/design-gaps.md` | rows 79-87 (79 puzzle screen, 80 x2 mark, 81 no announcement/room-chooser, 82 summary + done card star line, 83 no on-demand hint, 84 no star after "Pokaż", 85 letter row/Ó Ł, 86 dice faces + solution lines, 87 cards for `future` / `migration-failed` saves) |
| `CLAUDE.md` | "Current state" sentence for S-15 (save v2, `variants`, schedule, puzzle, minigames, seams `e2eDay`/`e2eVariant`/`?e2eSave=v1`) |
| `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md` | 12 follow-ups, each with `Trigger:` (incl. F5, F7, backup-v1 read-back, "replace never takes the v1 backup") |
| `src/**` comments | `DESIGN-GAP` comments now match rows (pl.ts save cards 82 -> 87, MinigameDoneCard 85 -> 82, "due in phase 10" removed), `save.ts` header no longer says version 1 only, `balance.ts` comment, `freshRound` variant comment |

## 3. Verification

| Command | Result |
|---|---|
| validate-rule-files.sh | PASS (missing: 0) |
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent (2 chunks checked)`) |
| unit + deploy scripts + sample E1-E6 | 2322 passed (branch baseline 2322, +0, comments/docs only); deploy scripts OK; every sample exit 0 |
| Break | `src/core/day.ts` -> `nope-day.ts` in CLAUDE.md: validator `MISSING … FAIL`; restored, PASS |
| e2e (orchestrator) | save-migration 2 passed (27.3 s). No spec fix needed |
| Break p11a | `MIGRATIONS[1]` zeroes the stars, `-g "#10 a v1 save loads"`: red `toBe` Expected 7, Received 0. Restored |
| Break p11b | autosaver skips the backup, `-g "#2 after a round"`: red `toEqual`, expected first op "backup", received "write". Restored |
| Full e2e after restore | `--workers=4`: 65 passed (4.8 min) = 63 + 2; `src/` has no diff |
| This step | lint OK, tsc OK, unit 2322 passed, build `e2e hook: absent (2 chunks checked)`, ports 4397/4398 free |
| Teacher read | no change to generators or content lists |

## 4. Next command

`/10x-e2e minigame-daily-puzzle phase 12`

## 5. Open

- 10.5 [reviewer], 10.6 [human]; 9.4, 9.5, 8.4, 8.5, 7.5, 7.6, 6.5, 5.5, 5.6, 4.4, 3.4-3.6, 1.5, 1.6, 2.5 as before.
- Phase 11-13 e2e specs: see "Specs the orchestrator must watch" in the p9 notes: dice/word rounds appear from the 4th ordinary round unless `?e2eVariant=off`.

## 6. Autonomous decisions

1. Gap numbering: kept research rows 79-86; the dice row 86 covers the faces and the solution-line spot (the `room-chooser` buttons folded into row 81); the save cards of phase 3 got a new row 87 and their comments in `pl.ts` were renumbered from 82. Would change: the reviewer prefers the research numbering literally.
2. Follow-up "replace (import/reset) never takes the v1 backup" recorded with trigger "a replace path before the first normal write after a migration, or v3".
3. Mixed phase: none (impl).
4. Phase 11 (e2e): spec `tests/e2e/save-migration.spec.ts` (2 tests; `save-migration` added to `ROUND_SPEC`), uses `?e2eSave=v1&e2eMonth=10&e2eVariant=off`; learner compared by stage, mastery, history, pendingUnlock (not unlockedStep/currentRoom). e2e ran under the orchestrator (65 passed, both breaks red); 11.1-11.4 ticked. 10.4 ticked from the orchestrator note (63 passed on 94bb48c). Local gate: lint, tsc, build ("e2e hook: absent"), unit 2322 (+0) green.
