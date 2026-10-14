# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-new` step (autonomous run 2026-10-14-save-s13b-s15-s14b). The change identity exists; nothing is
researched or planned yet. The next agent must not treat the author's decisions (Hasło z wyników + Zakrywanka, ×2 in
`balance.ts`, agent-written original LOGIC puzzles, save v2 approved) as open questions — they are decided inputs in
`change.md`.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 1 on the branch: `docs(minigame-daily-puzzle): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/minigame-daily-puzzle/change.md` | Change identity: decided inputs, roadmap claims vs repo table, proposed scope, design-kit views and copy keys, DESIGN-GAPs to add (rows from 79), save v2 expectation, triggered follow-ups with take, 8 autonomous decisions |
| `context/changes/minigame-daily-puzzle/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/minigame-daily-puzzle` (observed) |
| Local gate (lint, typecheck, unit, build, e2e) | Not run — docs-only step, no code changed. Baseline on main per the contract (inherited, unverified here): `lint OK; typecheck OK; unit OK Tests 2224 passed; build OK; e2e OK 63 passed`. |
| Claims in `change.md` | Checked against the repo at `1441161` by reading `src/core/round.ts`, `src/core/save.ts` (`SAVE_VERSION = 1`, empty `MIGRATIONS`, `future` by version > current), `src/core/saveFile.ts`/`saveHealth.ts`/`autosave.ts` (`future` handling), `src/scenes/TaskScene.ts` (`freshRound`, `finishRound`, `advance`, `applyParentStage`, `syncStars`), `src/data/balance.ts`, `src/data/layout.ts` (`REGISTRY_KEYS`, `SAVE_KEYS`), `src/data/rooms.ts`, grep of `src/` for LOGIC/minigame code (none), the expansion pack (`manifest.json` `miniGames`, `style-guide.md`, `preview.js`, screenshots `dice-idle.png`, `word-first-letter.png`). |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-research minigame-daily-puzzle`

## 5. Open

- Research questions (from `change.md` decisions 1–7): shape of the v2 variant block (`src/core/save.ts`, `src/core/types.ts` `SaveV1` → `SaveV2`); where a third round kind plugs into `TaskScene.freshRound` / `finishRound` (and M-1/M-2/M-13 ordering for it); whether Hasło tasks count toward mastery (`endRound`); Zakrywanka length (13 throws vs `balance.round.length` 5) and range for E3–E4; puzzle data model and how its text gets the same checks as tasks (`validateTask`, plural agreement, `src/data/nouns.ts`); a day seam for e2e (like `e2eMonth` in `src/testing/e2eHook.ts`, marker in `vite/e2eHookGuard.mjs`); whether the migrated save reaches IndexedDB through the normal autosave (then S12-02/03/11 stay untriggered) or through `Autosaver.replace`.
- DESIGN-GAPs to add in `docs/design-gaps.md` (from row 79): daily puzzle screen and ×2 mark, the variant announcement, summary with ×2, non-0–12 board if any, long/short words and Ó/Ł in the letter tiles.
- `[human]` row to add in the plan: the author reads every LOGIC puzzle as a teacher before release (contract § S-15).
- Triggered follow-ups with my take: `change.md` § „Triggered follow-ups” (in scope: v1→v2 step + backup copy, L-S1, S12-09, visual-gate O1 future card body, M-1/M-2/M-13 for the new branch; research decides: two-build e2e, S12-14, S13-06; out with new triggers: two instances/S12-15, M-S1 deploy part, S12-07/08/12/13).
- Roadmap Open Question 2 is answered (plan § 13) — mark it resolved at archive time.

## 6. Autonomous decisions

1. Save v2 expected (minimal variant-state block) — rejected session-only state and deriving from `history`; why: FR-024/FR-025 need state across sessions, `history` is capped at 200 and does not record variant rounds, the maintainer approved v2; would change if research shows `history` + `at` suffice without a shape change.
2. Hasło reveals one letter per correct answer (kit), not "results sorted ascending" (ZADANIA) — kit is the view source (profile § 6); would change if the author asks for the catalogue variant in the `[human]` read.
3. Hasło words from data, salon items, kit list as the starting point — would change if research prefers "the next furniture to buy" as the word.
4. Daily puzzle only for E3–E4 (v1 pool); other stages get a minigame in that slot — would change if research finds the E3 puzzles fit E5.
5. ×2 applies to the puzzle's stars including a second try; no time limit — would change if the plan makes the daily puzzle a multi-puzzle round with a bonus.
6. Zakrywanka stays 0–12 with + and − for every stage in v1, range as stage data — would change if the teacher read finds it too easy for E3–E4.
7. Variant rounds do not feed mastery (provisional) — would change if Hasło draws its tasks from the learner's skills.
8. Next step `/10x-research`, not the skill's default `/10x-plan` — fixed by the step prompt.
