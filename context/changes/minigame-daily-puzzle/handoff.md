# Handoff — `minigame-daily-puzzle` (slice S-15)

Updated by the `/10x-e2e` phase 12 finishing step (spec committed as `a87aef0`, e2e evidence from the orchestrator). Phases 11-12 done; phase 13 (daily puzzle e2e) is next. Do not run Playwright in finishing steps: the orchestrator does.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-12 (…, `94bb48c` p10, `aac2e84` p11, `a87aef0` p12) + handoffs |
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
| Spec fix (orchestrator) | `startE1` used age '6', for which E1 is the PROPOSED stage and its button reads "Klasa 1, I półrocze (propozycja)", so the exact-name tap timed out in all 3 tests (150 s). Changed to age '10+' (as art-tasks/art-stand-in do) |
| minigames after fix | 3 passed (37.2 s) |
| Break p12a (afterRound stops counting), `-g "after three ordinary rounds"` | red `toBe` Expected "word", Received undefined. Restored |
| Break p12b (letter only on first try), `-g "Hasło reveals"` | red `toBe` Expected 1, Received 0. Restored |
| Break p12c (board touch zones shifted one field), `-g "Zakrywanka covers"` | red `toEqual` on the covered list. Restored |
| Full suite after restore, `--workers=4` | 64 passed, 1 flaky failure = parent-settings #14 (random round drew a clock-set task; `setClock` poll Expected 8, Received 2), a known load flake (3rd time this run); parent-settings alone ×4 = 16/16. `src/` has no diff. ESLint clean on the spec |
| `playwright test --list` | Total: 68 tests in 19 files (65 + 3) |
| This step | lint OK, tsc OK, unit 2322 passed (+0), build `e2e hook: absent (2 chunks checked)`, ports 4397/4398 free. Playwright not run here (orchestrator ran it) |
| Teacher read | no change to generators or content lists |

## 4. Next command

`/10x-e2e minigame-daily-puzzle phase 13`

## 5. Open

- 10.5 [reviewer], 10.6 [human]; 9.4, 9.5, 8.4, 8.5, 7.5, 7.6, 6.5, 5.5, 5.6, 4.4, 3.4-3.6, 1.5, 1.6, 2.5 as before.
- parent-settings #14 load flake (random clock-set task, `setClock` poll): follow-up, test should force skills with `?e2eSkills`. Phase 13 e2e spec: see "Specs the orchestrator must watch" in the p9 notes: dice/word rounds appear from the 4th ordinary round unless `?e2eVariant=off`.

## 6. Autonomous decisions

1. Gap numbering: kept research rows 79-86; the dice row 86 covers the faces and the solution-line spot (the `room-chooser` buttons folded into row 81); the save cards of phase 3 got a new row 87 and their comments in `pl.ts` were renumbered from 82. Would change: the reviewer prefers the research numbering literally.
2. Follow-up "replace (import/reset) never takes the v1 backup" recorded with trigger "a replace path before the first normal write after a migration, or v3".
3. Mixed phase: none (impl).
4. Phase 11 (e2e): spec `tests/e2e/save-migration.spec.ts` (2 tests; `save-migration` added to `ROUND_SPEC`), uses `?e2eSave=v1&e2eMonth=10&e2eVariant=off`; learner compared by stage, mastery, history, pendingUnlock (not unlockedStep/currentRoom). e2e ran under the orchestrator (65 passed, both breaks red); 11.1-11.4 ticked. 10.4 ticked from the orchestrator note (63 passed on 94bb48c). Local gate: lint, tsc, build ("e2e hook: absent"), unit 2322 (+0) green.
5. Phase 12 (e2e): spec `tests/e2e/minigames.spec.ts` (3 tests; `minigames` in `ROUND_SPEC`); 12.1 ticked although the full suite had one known flake (spec itself green, flake test green alone ×4). Would change: the flake reappears outside parent-settings.
