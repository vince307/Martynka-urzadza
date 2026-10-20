# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-new` step of run `2026-10-20-playtest-boot`: the change folder exists with `change.md` (status
`new`), source claims re-verified, maintainer decisions and follow-up triage recorded. The next agent must not get
wrong: the save format stays v4 (scope.md hard limit) and the PA-1..PA-6 decisions in `change.md` are the
maintainer's, not open questions.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03`, cut from `main` at `64fd3ea` |
| Commits | 1 on the branch (this step: `docs(playtest-fixes-f01-f03): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were written) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/playtest-fixes-f01-f03/change.md` | change identity: save-format statement (stays v4), "source claim / repo now / correction" table for F-01..F-03, design-kit views and copy keys bound, triggered follow-ups with take, Autonomous decisions (PA-1..PA-6 pre-agreed by the maintainer 2026-10-20, D-1..D-7 agent interpretations) |
| `context/changes/playtest-fixes-f01-f03/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/playtest-fixes-f01-f03` |
| repo reads (grep/sed of `balance.ts`, `voice.ts`, `SettingsIcon.ts`, `layout.ts` `HUD_LAYOUT.settings`, `longPress.ts`, `UIScene.feed`, `placement.ts`, `round/warmup.ts`, `round/pick.ts`, `round/unique.ts`, `curriculum.ts` `buildAdaptiveRound`, `Martynka-urzadza.md`, `prd.md` FR-009) | every source claim checked; corrections in the change.md table |
| one-off `node --import tsx` script (scratchpad, not committed) counting playable skills/types per step with `playable` | per-stage table quoted in change.md (single-type steps in every stage) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, and the orchestrator runs `baseline.sh` (build + e2e) on this checkout meanwhile |

## 4. Next command

`/10x-research playtest-fixes-f01-f03`

## 5. Open

- Research questions: (1) every unit/e2e assertion that assumes E1/E2 read by themselves (`tests/narratorVoice.test.ts`,
  `tests/e2e/narrator.spec.ts`, `parent-settings.spec.ts`, `tests/e2e/support/hook.ts`); (2) where `LearnerState.history`
  is written (`TaskScene.finishRound` / `endRound`) and whether the warm-up writes it — the D-2 "first round finished"
  signal; whether `validateSave` accepts a learner-less save with stars; (3) `longPress` tap outcome and `UIScene.feed`;
  (4) a variety rule inside `pickRoundSkills` / `pickSkills` that keeps 60/30/10 and `withoutArtBlocked` `minCurrent`,
  plus review-step groups and `artRetries` interplay; (5) audit M-1/M-2/M-13 commit order in `TaskScene` against a
  "Wróć" exit mid-round.
- DESIGN-GAPs to add (from row **151** in `docs/design-gaps.md`): gear tap hint, "Wróć" to the age choice; rows 25 and
  28 rewritten (gear no longer muted).
- Docs to edit in the plan: `Martynka-urzadza.md` (Założenia lektor line; task-screen narrator bullet), PRD FR-009
  (D-6), CLAUDE.md "Current state" (F-01..F-03 sentence; also its stale `buildWarmup` location).
- Follow-ups: M-1/M-2/M-13/H-3/H-4 fire but stay deferred (re-record in this change's `follow-ups/review-fixes.md`);
  F4/F6 WelcomeScene guards are already closed in code (mark closed). Full table in change.md.

## 6. Autonomous decisions

- PA-1..PA-6: the maintainer's pre-agreed decisions (scope.md § 1), recorded verbatim in change.md — not reversible by
  an agent.
- D-1 "first round" = warm-up plus the first ordinary round (E1: first ordinary round). Would change: maintainer reads
  it as the warm-up only.
- D-2 "Wróć" sets the learner to `null`, drops the unfinished round, keeps stars; "finished" derived from saved data
  (no new field). Would change: research shows `history` unusable or a learner-less save with stars refused → runtime
  flag fallback.
- D-3 variety rule acts inside the weighted bucket (shares kept), relaxes cap then no-repeat, may reorder the 5 tasks.
  Would change: reordering breaks review groups or minigames → ordinary rounds only.
- D-4 gear hint once per page load, runtime only, not holding the input switch. Would change: maintainer wants it on
  every tap.
- D-5 gear at full opacity with HUD button tokens. Would change: a designer gear view.
- D-6 PRD FR-009 edited in the same change. Would change: a rule that only `/10x-prd` writes the PRD → follow-up.
- D-7 next step `/10x-research` rather than `/10x-plan` (skill default): three areas and a TaskScene exit path need
  grounding. Would change: none — the run's step order fixes it too.
