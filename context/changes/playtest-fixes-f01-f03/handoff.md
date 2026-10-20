# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-plan` step of run 2026-10-20-playtest-boot. The plan (9 phases: 1–3, 5 `tdd`, 4, 6, 7 `impl`,
8–9 `e2e`) is written and committed; no product code yet. The next agent must not let the variety picker consume a
different number of rng calls than `pickRoundSkills` — the "shares unchanged" proof rests on that alignment.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03`, cut from `main` at `64fd3ea` |
| Commits | 3 on the branch: `fea1184` (change identity), `8a884c1` (research), this step's `docs(playtest-fixes-f01-f03): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 45 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below written) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/playtest-fixes-f01-f03/plan.md` | the plan: save-format table (v4 kept per piece), Critical Implementation Details (variety contract, warm-up halves, "Wróć" exit order), 9 phases with `Driver`/`Driver why`, `## Autonomous decisions` A-1..A-9, `## Progress` |
| `context/changes/playtest-fixes-f01-f03/plan-brief.md` | two-page brief with the decision table |
| `context/changes/playtest-fixes-f01-f03/change.md` | frontmatter `status: preparing → planned` only |
| `context/changes/playtest-fixes-f01-f03/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/playtest-fixes-f01-f03` |
| awk over plan.md: Success Criteria bullets vs Progress rows per phase | 1:6/6, 2:3/3, 3:5/5, 4:7/7, 5:4/4, 6:5/5, 7:5/5, 8:3/3, 9:3/3 (one-to-one) |
| `grep -c '^Driver: ' plan.md` / `'^Driver why: '` | 9 / 9 |
| `metadata-guard.mjs inspect` then `mark-planned` | `changed: true`; roadmap has no `playtest-fixes-f01-f03` item (untouched) |
| code reads (this step) | `src/core/round/pick.ts`, `warmup.ts`, `unique.ts`, `src/core/longPress.ts`, `src/core/rng.ts` `pick` (one `int` per call), `buildAdaptiveRound`, `TaskScene.create`/`applyParentStage`, `HUD_LAYOUT.settings`, `REGISTRY_KEYS`/`SAVE_KEYS`, `PageButton` — consistent with research |
| lint / typecheck / tests / build / e2e | not run: docs-only step; the orchestrator may be running `baseline.sh` on this checkout |

## 4. Next command

`/10x-plan-review playtest-fixes-f01-f03`

## 5. Open

- **ARTIFACT GAP:** the contract's baseline line is still the placeholder `<<<BASELINE>>>`; the plan tells every phase
  to measure its own branch baseline and report `baseline + delta`.
- Manual rows (human checklist): 1.6 [reviewer] teacher read of printed rounds; 3.5 [reviewer] teacher read of the
  balance change; 4.5, 4.6 [visual] gear and hint at 1440/1024 (task and room); 4.7 [reviewer] the hint string;
  6.4 [visual] "Wróć" states at 1440/1024; 6.5 [reviewer] `TaskScene.backToAge` exit order; 7.4 **[human]** PRD FR-009
  contradicts the new default (decision A-7); 7.5 [reviewer] `Martynka-urzadza.md` edits.
- DESIGN-GAPs to add: row 151 (gear tap hint, phase 4), row 152 ("Wróć", phase 6); rows 25 and 28 rewritten (phase 4).
- Follow-ups to write in phase 7 (`follow-ups/review-fixes.md`): PRD FR-009; audit M-1 (`TaskScene.applyParentStage`),
  M-2, M-13, H-3, H-4 deferred; F4/F6 closed in code; E1/E2 silent parent path moot; hint once vs every tap; finer type
  key.
- Ship step (not a phase row): F-01..F-03 status "naprawione (#PR)" in `docs/playtest-feedback.md` (PA-5).
- Risk: plan-review should check `buildWarmup`'s new `rules` argument choice (phase 2 leaves it to the implementer)
  and the `TASK_LAYOUT.ageBack` fit in the 180 px margin (phase 6).

## 6. Autonomous decisions

- P-1 No questions asked (contract rule 1): research + scope.md settle every product choice; the remaining ones are
  A-1..A-9 in plan.md `## Autonomous decisions`, each with its reversal condition. Would change: none.
- P-2 A-2 "Wróć" hidden for a parent-placed learner (research recommendation). Would change: maintainer wanting it for
  every learner.
- P-3 A-3/A-4 "Wróć" in the left margin for the whole warm-up/first round, no confirm. Would change: playtest reports
  of accidental taps.
- P-4 A-5 cap only in the pick, neighbours by an rng-free reorder (rejected research's extra "not previous" filter).
  Would change: a test showing avoidable neighbours after the reorder.
- P-5 A-7 PRD FR-009 not hand-edited (reverses change.md D-6 by its own reversal condition: CLAUDE.md "never hand-write
  files in `context/`"); `[human]` row 7.4 + follow-up. Would change: maintainer allowing the hand edit.
- P-6 A-8 no E1/E2 silence e2e; unit pin instead. Would change: a reader bypassing `effectiveAutoRead`.
- P-7 Phase split: ≤ 1 new UI component per phase (`SettingsHint` in 4; "Wróć" reuses `PageButton` in 6); seam sweep in
  phase 7 before the e2e phases 8–9 (contract). Would change: plan-review finding a phase too large.
