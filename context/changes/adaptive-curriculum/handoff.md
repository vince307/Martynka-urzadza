# Handoff — `adaptive-curriculum` (slice S-07)

Written by the `/10x-plan-review` step: verdict PROCEED, three warnings fixed in `plan.md`, `change.md` is
`plan_reviewed`. The next agent must not plan the start of the unlock pointer as "first playable step": rule D
(calendar floor, formula and oracle table in plan.md § Critical Implementation Details) stands and was re-verified in
this step; phase 9 is now ONE e2e test with `test.setTimeout(180_000)`.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | 8 on top of `fd68216` (change identity; research; plan; 3 handoff fixes; plan review; this count fix) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 44 (all; 11 of them `[human]`/`[reviewer]`/`[visual]`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/reviews/plan-review.md` | Plan review report: grounding, focus points (a)–(f), F1–F5 with decisions, `VERDICT: PROCEED` |
| `context/changes/adaptive-curriculum/plan.md` | Fixes: Phase 3 bucket edge cases (F4); Phase 7 card as a `render()` branch + hook order (F3); Phase 8 S-17 follow-up text and [human] 8.6 note (F1); Phase 9 one test, 180 s timeout, rows 9.1–9.3 (+1 e2e) (F2); Known risks (F1, F2); decision 11 |
| `context/changes/adaptive-curriculum/change.md` | `status: planned` → `plan_reviewed` |
| `context/changes/adaptive-curriculum/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/adaptive-curriculum` |
| Rule D + playable steps + prompt pools (`node --import tsx $TMPDIR/pr/check.ts`, outside the repo, real `stages`/`getGenerator`) | playable steps match plan Current State; all 36 floor cells equal the plan oracle; pools < 12 prompts: only `E1.7.complement_10` 9, `E1.6.even_odd_single_10` 11 |
| Progress↔Phase (`grep '^## Phase'`, `'^### Phase'`, `Driver:` count, no checkboxes outside Progress) | 9/9 phases, 9 `Driver:` lines, 44 rows |
| Path/symbol grounding (`ls -l`, `grep`) | 16/16 paths, all cited symbols present |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline in the contract: main at fd68216, unit 767, e2e 14) |

## 4. Next command

`/10x-tdd adaptive-curriculum phase 1`

## 5. Open

- `[human]` rows (plan Phase 8): 8.5 session-only until S-11; 8.6 rule D (now also notes F1: E3 October step 6 and E6
  February step 4 run ~1 month ahead of the book); 8.7 `≥ ceil(0.5·n)`; 8.8 unlock during easing; 8.9 easing by
  weights; 8.10 no stage auto-advance.
- Teacher read: 48 `StepDef.childName` (row 6.5) and `pl.unlock` (row 7.5).
- E2E phase 9: one test; if Chromium cannot launch, request file `context/runs/2026-10-12-s04-s08/e2e-request-s07-p9.md`
  with break patches on `TaskScene.startNextRound` (ignores `pendingUnlock`) and the card's „Dalej” (does not clear it).
  Measure the run time (handoff §3 of phase 9); raise the timeout if one E4 keypad round exceeds ~12 s.
- Follow-ups the phase-8 agent writes (`follow-ups/review-fixes.md`): test-plan risks #13/#12, `test-stack.md` § E2E
  `chromium-hook`, ` = ?` → `Trigger: S-16`, S-11 floor `max(saved, calendarStart)`, early save covers mastery, S-08
  history without prompt, S-17 calibration incl. the floor formula alternative (plan-review F1).
- DESIGN-GAPs planned (rows 22+): narrator on the card, card after „Do pokoju”, book placeholder.

## 6. Autonomous decisions

1. Rule D kept with its formula and oracle (orchestrator decision; not clearly wrong): the E3/E6 ahead-of-book effect
   is recorded as a Known risk and a S-17 calibration item instead of changing the formula. Would change if the
   maintainer's 8.6 read rejects October E3 at step 6 — then the book-step-index variant (rounded down) replaces it.
2. Phase 9 merged into one test (room round-trip folded into the path) with a 180 s timeout, rejecting two tests that
   each walk ~4–12 rounds to the card. Would change if a failure in the room path proves hard to diagnose in one test.
3. Card state as a `TaskScene.render` branch (F3) — the only way the summary cannot reappear over the card.
4. F5 grep criterion left as is (fits the F5 scope). Skill's interactive triage and save-mode questions decided in
   place (save + triage now, fixes applied, no AskUserQuestion).
