---
date: 2026-10-13T09:55:14+02:00
researcher: Claude (10x-research, orchestrator + 3 Explore subagents)
git_commit: 298c74d5fabc6c3bcd203b5bb73f9408e5dad55d
branch: docs/test-plan-refresh-2026-10-13
repository: Martynka-urzadza
topic: "Grounding the 2026-10-13 test-plan refresh: risks #12-#17, phases 5-7, e2e stack facts"
tags: [research, test-plan, e2e, playwright, curriculum, mastery, s-09, observability]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (10x-research)
---

# Research: grounding the 2026-10-13 test-plan refresh

**Date**: 2026-10-13T09:55:14+02:00
**Git Commit**: 298c74d (working tree: this change folder untracked)
**Branch**: docs/test-plan-refresh-2026-10-13

## Research Question

Ground every item of the change brief (`change.md` Notes, items 1-5) before `context/foundation/test-plan.md` is rewritten: wording and evidence for risks #12-#15, requirements-side evidence for the two new risks (S-09 purchase, difficulty curve), the state of rollout phase 5, the facts for the §4/§6 e2e cookbook, and the evidence numbers (audits, hot-spots, baseline). The interview answers in the brief (item 3) are maintainer decisions and are not re-checked.

## Summary

1. **Risks #12-#15 are proposed in four archived changes with ready wording, ratings and response rows** (details below). None is in `test-plan.md` yet (`context/foundation/test-plan.md:42-54` has rows #1-#11). Each has a local e2e spec already shipped, so the §3 phase 5 row can cover them as complete.
2. **S-09 purchase risk**: the requirements state that stars are deducted only on "Wybieram" and never lost (prd.md:52, :78, :147-150; Martynka-urzadza.md:24-25, :172-174). No requirement mentions double-tap protection or a non-negative balance in those words; both follow from the guardrail "nigdy utrata gwiazdek" (prd.md:52) and US-02 AC "short of stars nothing is deducted" (prd.md:78). Cheapest layer: unit/property on the pure purchase logic in `core` (S-09 not built, so the test-plan names the risk, the slice plan owns the tests).
3. **Difficulty curve: the requirements do not state a pace for unlocking a step.** In the five requirement documents checked (prd.md, Martynka-urzadza.md, docs/ZADANIA.md, roadmap.md, shape-notes.md) there is no number of rounds to unlock and no accuracy target. What they do state: weights 60/30/10, mastery 0-5, 3 in a row +1, a miss resets the streak (FR-013 prd.md:139; ZADANIA.md:37, :48-49); unlock at mastery >=4 in "most" skills of a step, one hard skill must not block a step (FR-014 prd.md:141-142); easing after two rounds below 3/5 means "smaller range, picture mode" (prd.md:194; ZADANIA.md:50-51); pace anchors: 3+ sessions a week for 4 weeks (prd.md:41), first room in about 1-2 weeks of play, 1-3 rounds per item (prd.md:42; Martynka-urzadza.md:166), unlocked steps should match what school is doing now (prd.md:43). Tuning is deferred to M8/S-17 (FR-027 prd.md:177; roadmap.md:339). A stage is one semester and has 6-10 playable steps (counted `childName` entries in `src/data/curriculum/E1.ts`-`E6.ts`: 8, 8, 8, 6, 10, 8). **Consequence**: the brief's rule "ranges taken from requirements, not the code" cannot be satisfied from the documents alone; the acceptance range has to be derived (semester length × sessions × rounds per session ÷ steps) with a maintainer-set rounds-per-session figure, or set directly by the maintainer. This is the one open decision for the plan.
4. **Phase 5 (local e2e) is shipped**: 7 specs, 23 tests, two projects and two web servers (details in Detailed Findings). `test-plan.md` still says `not started` (`context/foundation/test-plan.md:86`) and §4 still says "none yet" (`:97`). The update/kept-state part (#10) is not covered by any spec; it waits for S-11.
5. **Evidence numbers**: unit 63 files / 974 tests (vitest run, 4.6 s), e2e 7 specs / 23 tests; hot-spots (30 days = whole history, first commit 2026-10-10, 312 non-merge commits): `src/core/tasks` 88, `src/scenes` 57 file changes match the brief; `src/data` measures **112**, not 86 as the brief says (command below; the brief's figure is not reproducible, the plan uses 112). Audits: C-1/C-2 closed by PR #27; H-3/H-4 open; N-1 is in the follow-up audit that lives only on the unmerged PR #28 branch.

## Detailed Findings

### Risks #12-#15 (proposed wording, from the archive)

- **#12 first launch / placement (S-06)**: "the first launch cannot be finished by touch or ends on the wrong stage: an age tap misses, a tap on the adult gate reaches the game underneath, a wrong gate answer locks the parent out, the parent's choice is not the stage played, or the warm-up raises the stage, lowers it by more than one or below E1". High/Medium. Sources: PRD FR-012, US-03, roadmap S-06. Layer: unit (stage table × 12 months × 5 ages, warm-up grading, gate) + local e2e touch path. Must challenge: "placement logic has tests, so the screen works"; "a DOM overlay covers the canvas, so the canvas gets no touch". Anti-patterns: reading the gate answer from the hook instead of the dialog text; asserting on the month without a fixed `?e2eMonth`. Anchors: `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md:3`, `research.md:275-284`. Spec: `tests/e2e/first-launch.spec.ts` (6 tests).
- **#13 adaptive curriculum (S-07)**: a round draws outside the unlocked steps, a second try raises mastery, a step does not unlock once most skills are mastered, or the unlock card blocks the next round. Medium/Medium. Sources: FR-013, FR-014, US-01 AC (prd.md:66), roadmap S-07. Layer: unit/property over many seeds + one e2e to `screen: 'unlock'`. Anti-patterns: setting mastery from the test, one fixed seed, asserting task content. Anchors: `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md:7-10`, `research.md:269-273`. Spec: `tests/e2e/adaptive.spec.ts` (1 test).
- **#14 parent settings (S-08)**: a child enters parent settings by a tap or an ordinary hold, a tap under the dialog reaches the game, or a parent stage change does not take effect at once (next round still old stage, stars vanish); sub-case after observability: the panel must say when no Polish voice exists. High/Medium. Sources: FR-015, US-03 AC, PRD Access Control, roadmap S-08. Layer: unit (hold reducer, stage change, ranking, auto-read) + local e2e with touch via CDP. Anti-patterns: setting the stage through the hook, waiting a fixed time instead of for the dialog. Anchors: `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md:7-14`; `context/archive/2026-10-13-observability-c1-c2/plan.md:491-506`. Spec: `tests/e2e/parent-settings.spec.ts` (4 tests).
- **#15 error card**: "a thrown exception leaves a frozen screen without a word or dead touch" (`context/archive/2026-10-13-observability-c1-c2/plan.md:443`, `follow-ups/review-fixes.md:5`). Spec cases (plan.md:463-469): frame exception, boot failure (`?e2eFail=boot`), settings-callback exception show the restart card; browser noise does not. No PRD FR covers it; requirement-side evidence is the guardrails "Zero frustracji"/"Postęp nigdy nie ginie" (prd.md:52-53), plus the 2026-10-13 audit C-1/C-2. Follow-up for S-11: the card must promise a return to saved progress (review-fixes.md:7). Spec: `tests/e2e/error-boundary.spec.ts` (4 tests) + `tests/dialogSessions.test.ts` (AST) + `tests/inputSuspend.test.ts`.

### New risk: S-09 star purchase

- Roadmap row S-09 first-furniture-purchase, M4, FR-016, FR-017, US-02, proposed (`context/foundation/roadmap.md:59`, detail `:238-248`: "masz X/Y", stars taken only on "Wybieram").
- FR-016 (prd.md:147): costs 5-15, greyed button with "masz X/Y" when short. FR-017 (prd.md:149-150): 3 variants with preview, deduction only on "Wybieram", the "paid empty slot" Socrates note. FR-020 (prd.md:157): save right after paying (S-11). Guardrail prd.md:52; US-01 AC no negative star change (prd.md:67).
- Not in the requirements in these words: double-charge on a repeated tap, a balance below zero. The test-plan risk wording derives them from the guardrail, which is allowed evidence (PRD line).

### New risk: difficulty curve in practice

- Requirement numbers: see Summary 3. Code-only numbers (`src/data/balance.ts:9-11`): `unlockAt: 4`, `streakForGain: 3`, `unlockShare: 0.5` (ceil(n/2)), easing `weakBelow: 3, weakRounds: 2, rounds: 2`, weights 20/50/30 (the 20/50/30 easing weights are an agent decision still awaiting sign-off, `context/archive/2026-10-13-adaptive-curriculum/plan.md:576, :829`).
- Prior model (analysis, not requirement), `context/archive/2026-10-13-observability-c1-c2/research.md:236-272`, rounds to unlock a step after H-7, mean/median/p90: 2-skill step 19/18/28 at 60 %, 14/13/19 at 70 %, 11/10/14 at 80 %; 3-skill step 35/34/48, 25/24/33, 19/18/25. Follow-up "calibrate the step unlock after H-7, trigger S-17" (`follow-ups/review-fixes.md:6`). Audit 0659 M-12: easing can re-arm without end.
- A simulation that uses the code's own thresholds as its expected values would be an implementation mirror (§2 #1 anti-pattern). The test-plan row must say: the simulation drives the real `core` round/mastery/curriculum functions with a synthetic child of fixed first-try accuracy, and asserts against a range written down from requirements (pace derived from semester × sessions; "one hard skill does not block a step"; a 90 %-accurate child is not held for weeks) — never against numbers read from `balance.ts`.

### Phase 5 state and e2e stack facts (for §3, §4, §6)

- Playwright `@playwright/test` 1.64.0 (`package.json:31`, `package-lock.json:2363-2364`).
- `playwright.config.ts`: projects `chromium` (seed only) and `chromium-hook` (`ROUND_SPEC` regex, line 13: task-round, narrator, first-launch, adaptive, parent-settings, error-boundary), both Desktop Chrome 1280×720 `hasTouch: true` (lines 27-42); no Android profile (install hint covers the canvas, lines 29-31). Web servers: production build on 4398 (`reuseExistingServer: !CI`, lines 44-50) and the hook build `E2E_HOOK=1` into `dist-e2e/` on 4397 (`reuseExistingServer: false`, a stale server would carry the same build id, lines 51-59). Retries 2 in CI, 0 locally (line 19); never run in CI anyway.
- Build guard `vite/e2eHookGuard.mjs:6`: markers `__martynkaE2E`, `e2eMonth`, `e2eFail`, `e2e-forced-failure`; the production build fails if any marker appears, the hook build fails if any is missing (lines 16-33); wired in `vite/config.prod.mjs:3,8`; `__E2E_HOOK__` defined in `vite/config.shared.mjs:66`.
- Query params, e2e build only: `?e2eMonth=0..11` (`src/testing/e2eHook.ts:20-27`, read at `src/main.ts:71`), `?e2eFail=step|boot|settings` (`src/testing/e2eHook.ts:37-40`, `src/main.ts:88`; forced sites `src/scenes/BootScene.ts:21`, `TaskScene.ts:103`, `UIScene.ts:149`).
- Never `page.clock`: `setFixedTime` freezes `Date.now()`, Phaser 4.2.1 tweens read `Date.now()` for their delta, so tweens stop (camera shake offset, star flight hangs) (`context/archive/2026-10-13-first-launch-placement/plan.md:68-71`; comments `tests/e2e/adaptive.spec.ts:5-6`, `first-launch.spec.ts:3`).
- `holdTouch` (`tests/e2e/support/hook.ts:101-118`): CDP `Input.dispatchTouchEvent` touchStart, optional drift moves, `waitForTimeout(ms)` (the only fixed wait a spec may have: the hold is the gesture), touchEnd. Helpers: `tapScene` maps 1920×1080 scene coordinates through the canvas box; `passWelcome` (parent path, E3), `passWelcomeAsChild`, `openSettings` (`tests/e2e/support/welcome.ts:91, 95, 111`).
- Break patches: Chromium cannot start in the macOS sandbox; subagents write the spec plus a `git apply` break patch (production rule, not selectors) and the orchestrator runs green, applies the break, sees red, reverts (`context/foundation/autonomous-run.md:130`; protocol `context/runs/2026-10-13-fix-observability/prompt-phase.md:36`).
- AST test `tests/dialogSessions.test.ts`: parses `src/scenes/UIScene.ts` and `WelcomeScene.ts` with the TypeScript compiler API, every `onPass`/`onConfirm`/`onCancel` initializer must be an arrow whose body is `session.run(...)`, exactly 4 per file (lines 18-23, 45-52).
- `context/foundation/test-stack.md` is stale (single web server, seed only); out of scope for this change, noted as a follow-up.

### Device checks (for phase 7)

- No standalone device checklist exists. Device items are P1 bullets per run in `docs/human-checklist.md:36` (touch < 100 ms, voice, gate by finger, auto-read on E1/E2, 2 s hold comfort) and on the unmerged checklist branch (error card by finger, no-voice line). `context/foundation/autonomous-run.md` has no device step (grep iPad/Android/device: no match). So phase 7 is a new manual checklist, owned by the maintainer, triggered by changes to touch handling or scenes.

### Audits

- 0659 audit (`context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md`): 2 critical, 10 high. Closed by PR #27: C-1, C-2 (and H-1/H-2/L-6 as cases), H-6, L-8; H-7 partly (H-7r open). Open: H-3 (speech errors treated as interruptions), H-4 (speech unlock marked before confirmation, iOS silent session), H-5, H-8, H-9 (smoke does not run JS, no auto-rollback), H-10, M-12.
- 0924 follow-up audit exists only on branch `docs/observability-audit-2026-10-13-fix-observability` (PR #28, unmerged): 0 critical; N-1 (boundary installed after imports and narrator creation, so an early throw is a blank screen), N-4 (no error code on the card), N-6 (broken cached build shows the card every launch). The test plan may cite "audit 2026-10-13 follow-up (PR #28)" as evidence, not a path on main.

### Hot-spots and baseline

- Command: `git log --since="30 days ago" --no-merges --name-only --pretty=format: -- <dir> | grep -c .` → `src/data` 112, `src/core/tasks` 88, `src/ui` 67, `src/core` (excl. tasks) 59, `src/scenes` 57, `tests` (excl. e2e) 139, `tests/e2e` 35, `deploy` 26; 312 non-merge commits. Hottest files: `src/data/pl.ts` 32, `src/scenes/TaskScene.ts` 29, `src/data/layout.ts` 29.
- `npx vitest run`: 63 files, 974 passed. E2E: error-boundary 4, adaptive 1, first-launch 6, narrator 3, seed 1, task-round 4, parent-settings 4 = 23.

## Historical Context

- `context/archive/2026-10-12-test-plan-refresh-2026-10-12/plan.md`: the previous refresh's shape (one docs phase, schema checks by grep, risks appended never renumbered, §6 placeholders), reused here.
- Schema `.claude/skills/10x-test-plan/references/test-plan-schema.md`: §2 Source cells carry no files/symbols; §3 status literals fixed; 3-5 phases "sweet spot" (this refresh goes to 7, as the previous one went to 5; accepted because completed phases stay as history); §7 at most 5-6 bullets.

## Open Questions

1. **Difficulty-curve acceptance range** (maintainer): the requirements give no rounds-to-unlock target. Either the maintainer sets the range now, or phase 6 opens with that decision. A derivation the plan can propose: a stage is one semester (~20 school weeks) with 6-10 steps; at 3 sessions a week (prd.md:41) and R rounds per session, a child at 70 % first-try accuracy should unlock a step within 60·R ÷ steps rounds; R is not in any requirement.
2. Whether the agent may merge this PR itself: it touches only `context/`, but it is a strategy change, not an archive closeout (memory rule covers closeouts).

## Decisions (maintainer, 2026-10-13, after research)

1. **Difficulty-curve range: derive from the PRD with R = 2 rounds per session.** A stage is one semester (~20 school weeks) × 3 sessions a week (prd.md:41) × 2 rounds = ~120 rounds for the stage's 6-10 steps. Acceptance for the phase 6 simulation: a synthetic child at 70 % first-try accuracy unlocks a step at a median of at most 120 ÷ (steps in the stage) rounds (12-20); a 60 % child unlocks within the semester budget at p90; a 90 % child needs at most half the 70 % budget. The prior model (3-skill step at 70 %: median ~24 rounds) would fail this range, a real signal for S-17 calibration, not a reason to widen the range.
2. **Merge**: the agent may merge this docs-only PR itself once CI is green.
