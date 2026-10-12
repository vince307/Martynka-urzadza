# Handoff — `first-launch-placement` (slice S-06)

Written by the `/10x-plan` step: `plan.md` (9 phases, `## Progress` with 46 pending rows) and `plan-brief.md` exist,
`change.md` is `planned`, roadmap S-06 is `planning`. The next agent must not miss the orchestrator's binding decision:
the child ALONE reaches a round (age tap → age-proposed stage → warm-up → play); the adult gate guards only CHANGING the
stage ("Rodzic" on the welcome) — it is not a precondition to play (deviation from FR-012's literal text, `[human]` 7.5).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | 3 on top of `37a9a62` after this step's commit (change identity, research, plan) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` |
| `## Progress` rows remaining | 46 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-launch-placement/plan.md` | Plan: phases 1–3 `tdd` (placement, warm-up, gate in `src/core/`), 4–6 `impl` (WelcomeScene + AgeButton + e2e helper; DOM gate + stage panel; warm-up in TaskScene), 7 `impl` seam sweep, 8–9 `e2e` (#12 proposed) |
| `context/changes/first-launch-placement/plan-brief.md` | Two-page brief with the decision table |
| `context/changes/first-launch-placement/change.md` | Status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-06 `proposed` → `planning` (At a glance row and `### S-06` Status) |
| `context/changes/first-launch-placement/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/first-launch-placement` |
| Code anchors re-read in this step | `BootScene.create`, `TaskScene.create`/`advance`/`autoReadFirst`/`freshRound`, `pick.ts` `pickSkills`/`playable`, `round.ts` `RoundState`, `e2eHook.ts` `installE2EHook`, `overlay.ts`, `PageButton`, `SummaryPanel` (fixed `stars.left`), `playwright.config.ts` `ROUND_SPEC`, `layout.ts` `SCENE_KEYS`/`REGISTRY_KEYS` — match research |
| Progress ↔ Success Criteria | one row per criterion in every phase (checked by hand) |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step (baseline in the contract: main @ 37a9a62, unit 671, e2e 8) |

## 4. Next command

`/10x-plan-review first-launch-placement`

## 5. Open

- Plan-review should check: phase 4 size (scene + widget + Boot seam + hook + helper adoption in two specs); that
  `page.clock.setFixedTime` leaves Phaser timers running in Playwright 1.64; that `narrator.speak` before `unlock` is
  harmless (phase 6 auto-read of the first task); that `PageButton` can take the "Rodzic" size (`WELCOME_LAYOUT.parent`).
- `[human]` rows (phase 7: 7.5–7.9; 5.7; 6.5): orchestrator decision vs FR-012, PRD OQ 1 answer, warm-up gap in
  ZADANIA §1, persona gets E1 on the child path until S-11, gate difficulty, iPad gate check, iPad auto-read.
- Follow-ups to be written in phase 7 (`follow-ups/review-fixes.md`): risk #12 (`Trigger: /10x-test-plan refresh`),
  `mountInstallHint` touch pass-through, S-11 save of `SessionLearner`, S-08 reuse of `openParentGate`, picture mode
  (S-14), maintainer choice on an earlier learner save, repeated prompt in a warm-up (S-07).
- DESIGN-GAP rows 15+ (phase 7): "Rodzic" button, adult gate, stage panel, sixth dot/star, welcome art, picture mode.

## 6. Autonomous decisions

1. Orchestrator's binding decision applied as written: child alone plays on the age proposal; "Rodzic" path optional
   (plan Autonomous decisions 1, `[human]` 7.5). Would change if the maintainer wants the gate as a precondition or a
   learner save lands before S-06.
2. Parent panel contains the age row, so the parent path realises FR-012 by itself (plan decision 2). Would change with
   S-11 (age remembered).
3. Gate 13–19 × 13–19 on a DOM digit pad (research options a + DOM pad). Would change after the S-17 playtest.
4. e2e helper in phase 4 (child path, clock fixed to October, age 8 → E3) switched to the parent path in phase 6 (age 10,
   choose E3 ⇒ no warm-up), so every phase passes the full gate including e2e. Would change if phases were merged.
5. No AskUserQuestion; the skill's complexity/question rounds and phase approval were decided from research + the step
   prompt; clipboard copy skipped (unattended). Would change only in an interactive session.
