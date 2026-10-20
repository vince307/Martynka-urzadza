# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-research` step of run `2026-10-20-playtest-boot`: `research.md` answers every research question
of the previous handoff, `change.md` is `preparing`. The next agent must not get wrong: the warm-up ALSO writes
`history` (`endRound(…, 'warmup')` records before its early return), so "first ordinary round finished" is derived
from `variants` (`roundsSince` etc., research § F-02 b), not from `history` alone; save format stays v4.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03`, cut from `main` at `64fd3ea` |
| Commits | 2 on the branch (`fea1184` change identity; this step: `docs(playtest-fixes-f01-f03): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below were written) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/playtest-fixes-f01-f03/research.md` | source-backed research: F-01 readers and tests, F-02 (a) gear tokens + `longPress` tap path, F-02 (b) save/scene/round-lifecycle for "Wróć" with the v4 predicate, F-03 type definition, per-step type counts, draw/rng flow, tests at risk, recommended variety design; open product questions for the plan |
| `context/changes/playtest-fixes-f01-f03/change.md` | frontmatter only: `status: new → preparing`, `updated` (via the skill's metadata guard) |
| `context/changes/playtest-fixes-f01-f03/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/playtest-fixes-f01-f03` |
| greps of `autoReadStages|effectiveAutoRead` (src, tests), `autoRead|spoken|narrat` (tests/e2e), `HUD_LAYOUT.settings`, `longPress` callers, `docs/design-gaps.md` last row (150) | findings in research.md § F-01, § F-02 (a) |
| sub-agent reads (two read-only agents) of `curriculum.ts`, `round/pick.ts`, `round/warmup.ts`, `round/unique.ts`, `artFilter.ts`, `mastery.ts`, `variants.ts`, `save.ts`, `TaskScene`, `WelcomeScene`, `BootScene`, fixtures; spot-checked by me: `endRound` warm-up early return after `recordRound`, `afterRound` `roundsSince + 1`, `roundView` `switchVisible` | consistent with research.md |
| one-off `node --import tsx` scripts in `$TMPDIR/vr/` (count types per playable step; simulate 2000 seeds/step of today's draw) — not committed | 15 one-type / 17 two-type / 30 ≥3-type steps; 41.9 % rounds with > 2 of a type, 59.7 % with a same-type neighbour |
| lint / typecheck / tests / build / e2e | not run: docs-only step; the orchestrator may run `baseline.sh` on this checkout |

## 4. Next command

`/10x-plan playtest-fixes-f01-f03`

## 5. Open

- Product choices for the plan (research.md "Open Questions"): "Wróć" hidden for a parent-placed learner
  (`stageOverriddenByParent`) — recommended; "Wróć" visible during the whole warm-up/first round in the left margin
  (x 0–180) vs between tasks only; gear hint bubble placement and `balance.parentSettings` hint duration; optional
  E1/E2 silence e2e.
- Tests the plan must account for: add a pin of `balance.narrator.autoReadStages` = `[]` (none exists); keep
  `pickRoundSkills`/`pickSkills` long-count share tests (`tests/curriculumPick.test.ts`, `tests/review.test.ts`,
  `tests/reviewGuards.test.ts`) by adding the variety rule as a new per-round function; `tests/warmup.test.ts` halves;
  `tests/longPress.test.ts` "a short tap … never fires" with an additive `tap` field (`src/core/roomGesture.ts` also
  uses `longPress`); `tests/e2e/parent-settings.spec.ts` "#14 only a 2-second hold …" is where the hint gets asserted.
- "Wróć" exit order (research § F-02 b): cleanup → `registry.set(learner, null)` → `saver.flush('now')` → stop UI and
  Room scenes → `scene.start(welcome)`; never `advance`/`finishRound`.
- DESIGN-GAPs to add from row **151** in `docs/design-gaps.md`: gear tap hint, "Wróć" to the age choice; rows 25 and
  28 rewritten (gear no longer muted).
- Docs to edit in the plan: `Martynka-urzadza.md` (Założenia lektor line; task-screen narrator bullet), PRD FR-009
  (D-6), CLAUDE.md "Current state" (F-01..F-03 sentence; stale `buildWarmup` location → `src/core/round/warmup.ts`).
- Follow-ups: audit M-1 (survives in `TaskScene.applyParentStage`), M-2, M-13, H-3, H-4 fire but stay deferred
  (re-record in this change's `follow-ups/review-fixes.md`); F4/F6 WelcomeScene guards closed in code (per change.md).

## 6. Autonomous decisions

- R-1 Research scope taken from change.md and the previous handoff § 5 (no question asked). Would change: none.
- R-2 "Task type" = `SkillDef.type` (generator key), not `params.variant`. Rejected: finer key (one-type steps only
  15 → 10, and a child perceives "clock" as one kind). Would change: the maintainer counting e.g. set-the-clock and
  read-the-clock as different types.
- R-3 D-2 refined: "first ordinary round finished" = `variants.roundsSince > 0 || lastMinigame || puzzleDay ||
  puzzlesDone.length > 0 || history.length > balance.warmup.length`; D-2's runtime-flag fallback not needed. Would
  change: a variant becoming possible before the first ordinary round, or a v5 field allowed.
- R-4 Variety rule recommended as a new per-round function (bucket roll unchanged, filtered skill pick with relax
  cap → no-repeat → whole bucket, then an rng-free reorder; warm-up reorders within halves). Rejected: changing
  `pickRoundSkills` in place (breaks the meaning of the 20000-draw share tests). Would change: the plan finding the
  rng-count invariant unnecessary.
- R-5 Recommended: hide "Wróć" for a parent-placed learner. Would change: maintainer wanting it for every first
  round. (Plan decides.)
