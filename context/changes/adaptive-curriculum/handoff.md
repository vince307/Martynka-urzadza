# Handoff — `adaptive-curriculum` (slice S-07)

Written by the `/10x-research` step: `research.md` answers the five questions, `change.md` is `preparing`. The next agent
must not start the child at the first playable step on every cold start: research recommends a school-calendar floor
(`calendarStart(stage, month, age)`, research § 1, rule D) so production keeps its variety until S-11; and "większość"
is `≥ ceil(0.5·n)`, not `> 0.5` (corrects change.md decision 2).

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | 2 on top of `fd68216` (change identity; this step's `docs(adaptive-curriculum): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (via `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/research.md` | Research: start rule (options A–D, rule D with per-stage/month table), weights/mastery/unlock/easing with proposed `balance` shape, prompt uniqueness (pool sizes), unlock card (kit copy, 48 child-facing step names), e2e (determinism, hook fields, proposed risk #13 wording), F5 |
| `context/changes/adaptive-curriculum/change.md` | Status `new` → `preparing`, `updated` (metadata guard only) |
| `context/changes/adaptive-curriculum/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/adaptive-curriculum` |
| Prompt-pool measurement (`node --import tsx $TMPDIR/pool/pool.ts`, 2000 draws per playable skill, outside the repo) | 6 skills < 20 prompts, smallest `E1.7.complement_10` 9; playable steps per stage as in research § 1 table |
| Source reads | PRD (Success Criteria, US-01, FR-007/012/013/014/020, Business Logic), `Martynka-urzadza.md` §2/4/5/6/8/11, ZADANIA §1/§3, kit `preview.js`/`maths.css`/`style-guide.md`, test-plan § 2/§ 7, test-stack § E2E, specs + `support/welcome.ts`, `e2eHook.ts`, `e2eHookGuard.mjs`, `TaskScene`, core round/warm-up/placement |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline in the contract: main at fd68216, unit 767, e2e 14) |

## 4. Next command

`/10x-plan adaptive-curriculum`

## 5. Open

- Plan must decide (record under Autonomous decisions, `[human]` rows): start rule D (calendar floor; no literal PRD
  text, Success Criteria "zgodne z tym, co jest aktualnie w szkole" is the anchor); unlock during easing (research
  recommends allowing; change.md decision 4 said no); easing by weights instead of "mniejszy zakres, tryb z obrazkami";
  session-only adaptation until S-11; no stage auto-advance.
- Teacher read: new child-facing step-name field in `src/data/curriculum/*` (48 playable steps) and `pl.unlock` strings.
- DESIGN-GAP candidates (to `docs/design-gaps.md`): card narration; card after "Do pokoju".
- Follow-ups for the plan to write into `follow-ups/review-fixes.md`: test-plan refresh with risk #13 (wording in research
  § 5) and #12; `test-stack.md` § E2E missing the `chromium-hook` project / port 4397; ` = ?` moved to `Trigger: S-16`.
- If the plan picks a start rule that depends on the month for the parent path, `tests/e2e/support/welcome.ts`
  `passWelcome` needs `?e2eMonth` (today it uses the real date).

## 6. Autonomous decisions

1. Question scope taken from the step prompt + `change.md` § Open questions; no AskUserQuestion. Would change if the
   orchestrator adds questions.
2. Recommended start rule D (school-calendar floor, `behind` stage → whole stage, `minStartSteps` 2) over A (first step:
   regresses variety), B (whole stage: nothing to unlock), C (parent path only). Would change if the author wants every
   step earned (A, with a `[human]` row accepting the regression until S-11).
3. "Większość" = `≥ ceil(0.5·n)` because strict majority blocks a 2-skill step on one hard skill (ZADANIA §1). Would
   change if the author reads "większość" literally and accepts that.
4. Uniqueness by `prompt` string with same-skill retries (20), duplicate accepted after the limit. Would change if the
   teacher read finds near-duplicates with different strings disturbing.
5. Measurements via a throwaway script in `$TMPDIR` (no repo change); delegated reads to 3 read-only sub-agents.
