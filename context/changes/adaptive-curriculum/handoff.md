# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-impl-review adaptive-curriculum` (full plan, phases 1–9). Verdict APPROVED, `MERGE: CLEAR`; three
warnings fixed in `88e898c`, which touches scene code (`TaskScene.startNextRound`), so **e2e must be re-run on
`88e898c` before the visual gate** — this session could not launch Chromium.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phases `8fd7bd0` … `7d03dc7` (p9), handoff `ea069c4`; review fix `88e898c`; this docs commit after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 7 (`grep -c '^- \[ \]' plan.md`): 7.6 [visual]; 8.5–8.10 [human] |
| Working tree | clean after the commit (scratch scripts live outside the repo) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/reviews/impl-review.md` | review report (F1–F8), ends with the MERGE line |
| `context/changes/adaptive-curriculum/reviews/teacher-read.md` | teacher read of the 48 child step names and `pl.unlock` (rows 6.5, 7.5) |
| `context/changes/adaptive-curriculum/follow-ups/review-fixes.md` | + section "Impl-review": `pendingUnlock` without stage (Trigger S-08/S-11), `Adaptation` keys (S-11), `playableSteps`/`firstPlayableSteps` (next change) |
| `context/changes/adaptive-curriculum/plan.md` | rows 5.5, 6.5, 7.5, 8.4 ticked with evidence |
| `context/changes/adaptive-curriculum/change.md` | `status: impl_reviewed` |
| `src/scenes/TaskScene.ts` (88e898c) | `startNextRound`: no drawable card → `closeUnlock()`; DESIGN-GAP rows 23, 24 commented |
| `src/core/curriculum.ts`, `src/core/placement.ts` (88e898c) | `STAGE_ORDER` exported once; private `currentStepOf` shared by `skillBuckets` and `unlockReady` |
| `src/data/curriculum/E4.ts` (88e898c) | step 2 `childName` „Działania do 100” |
| `src/data/layout.ts`, `src/data/pl.ts`, `src/ui/widgets/UnlockCard.ts`, `docs/design-gaps.md` (88e898c) | DESIGN-GAP row numbers, row 22 wording |
| `tests/e2e/adaptive.spec.ts`, `tests/e2e/support/welcome.ts` (88e898c) | header comments only |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (before and after 88e898c) |
| `npm test` | 881 passed = main baseline 767 + 114 (unchanged by 88e898c) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` × 6 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -rl "__martynkaE2E\|e2eMonth" dist/` empty |
| `npx playwright test` | NOT run successfully: `browserType.launch: Target page, context or browser has been closed` for every test (sandbox); evidence = orchestrator 15/15 on `7d03dc7` (baseline 14 + 1). Re-run needed on `88e898c`. Ports 4397/4398 checked free afterwards |
| Domain script on real `stages` | 21 600 rounds (ages × months × stages × normal/easing × 30 seeds): all 5 tasks, no duplicate prompt; 30 second tries → mastery 0, then 12 first tries → 4; E4 September floor 2 → unlocks 4 after round 3; 2 weak rounds → `easedRounds` 2, weights 20/50/30 |
| Break 1: `recordRound` treats `'second'` as `'first'` | 3 red (mastery.test.ts ×2, curriculumEnd warm-up); restored |
| Break 2: `unlockReady` `>` instead of `>=` | 5 red in curriculumEnd.test.ts; restored. Meta-check: expectations come from ZADANIA §1 / decision 3, not from `balance` |

## 4. Next command

visual gate (orchestrator), then /10x-archive adaptive-curriculum and ship

## 5. Open

- E2E re-run on `88e898c` (orchestrator): `npx playwright test`, expect 15 passed (main baseline 14 + 1).
- Row 7.6 [visual]: summary with pending card, card with the longest and shortest name, round after „Dalej” at
  1440×900 and 1024×768 vs `designs/martynka-maths-A-v1/screenshots/unlock.png`.
- Rows 8.5–8.10 [human] (maintainer checklist): cold start resets mastery until S-11; calendar floor (rule D);
  „większość” = `≥ ceil(0.5 · n)`; unlock during easing; easing = weights 20/50/30; no automatic stage advance.
- Follow-ups in `follow-ups/review-fixes.md`: `SessionLearner.pendingUnlock` without stage (Trigger S-08 or S-11),
  `recordRound`/`endRound` result keys (S-11), `playableSteps` vs `firstPlayableSteps` (next change), plus the earlier
  ones (risk #13/#12 test-plan refresh, test-stack `chromium-hook`, S-11 save, S-16 book art and ` = ?`, S-17 calibration).
- DESIGN-GAP rows 22–24 in `docs/design-gaps.md`, each with a code comment.

## 6. Autonomous decisions

1. Skill questions decided in place: implement in this context, proposed commit message, stop after phase 8.
2. `buildRound` removed with its test (unit 882 -> 881); the plan allowed "- tests of the removed `buildRound`".
3. Deliberate break for 8.2 used `RULE_FILES` in the env file instead of a profile path, then restored.
4. Follow-ups written in Polish like the rest of `context/changes`; design-gap rows in English like the existing table.
5. AGENTS.md: dropped the "(sync, then bootstrap ...)" aside to stay under 400 words; it remains in CLAUDE.md.
6. Phase 9: Chromium unavailable in the agent session; the orchestrator's green and break runs were used as evidence (rows ticked citing them). Spec reviewed, not rewritten. Commit message uses the orchestrator-specified title.
7. Impl-review triage, no AskUserQuestion: the skill's "how to proceed" = triage now. Chosen: fix the three cheap
   warnings (F1 stuck card fallback, F2 duplicated helpers, F3 comments) in one `fix(...)` commit; defer F5, F6, F8 as
   follow-ups with triggers; accept F7. Rejected: fixing `pendingUnlock` to `{ stage, step }` now (changes the
   `SessionLearner` shape S-08/S-11 will touch anyway). Would change: a stage switch landing before S-08.
8. Teacher read: changed only E4.2 („Działania z małą liczbą” → „Działania do 100”); kept E3.8 „Przekraczanie
   dziesiątki”, E5.2, E5.6 because no clearly better name fits 28 characters. Would change: the maintainer's or a
   teacher's own read in the visual gate.
9. E2E: a single plain `npx playwright test` failed at browser launch (sandbox); no `dangerouslyDisableSandbox`. The
   fix commit changes scene code, so the MERGE line makes the orchestrator's e2e re-run on `88e898c` explicit. Would
   change: an e2e red on `88e898c` → BLOCKED until fixed.
10. The F1 fix falls back to "clear and play on" instead of throwing: no fail states for the child (CLAUDE.md working
    rules). Would change: a decision that missing data must fail loudly in development builds.
