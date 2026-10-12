# Handoff — `task-round-stars` (slice S-04)

Written by the `/10x-research` step of autonomous run 2026-10-12-s04-s08. `research.md` answers the seven research
questions with source anchors; no plan or product code yet. The next agent must not adopt a generic "mask the answer"
hint rule: it was measured unsafe (ROUNDING, COMPLEMENT, DIV, 1-line ADD_SUB/MULT), see `research.md` § 2.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 2 (`docs(task-round-stars): change identity (autonomous run)`, `docs(task-round-stars): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/task-round-stars/research.md` | Research: round state machine and star rules from the PRD, hint-leak table for all 21 generators, E1 tiles simulation and `'select'` handling, Phaser 4 scene/widget split, font/precache finding, e2e hook build (measured dead-code removal), test-plan risks, design binding and kit copy, open choices for the plan |
| `context/changes/task-round-stars/change.md` | Frontmatter only: `status` new → preparing |
| `context/changes/task-round-stars/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/task-round-stars` |
| Throwaway hint audit (`node --import tsx`, scratchpad, 50 seeds × every skill E1–E6 = 4 850 tasks) | `hint[0]` leaks: MISSING/COMPLEMENT/DIV/COMPARE_DIFF 100%, ADD_SUB 53% and MULT 49% (exactly their 1-line hints), HALF 100%; BONDS/CHAIN/CHOOSE_OP/COMPARE_EXPR/MISSING_OP/FACT_FAMILY/SEQUENCE/ROUNDING 0% real |
| Throwaway `numberChoices` simulation (10 E1 keypad skills × 1000 × count 3 and 4) | 0 throws; answer position ~uniform; BONDS with `boundOf` gives impossible tiles (needs drawn total) |
| Throwaway Vite 6 + terser build, `define: { __E2E_HOOK__ }` from `process.env` | hook marker: 0 hits without flag, 1 hit with flag |
| Read of `node_modules/playwright/lib/runner/index.js` (webServer `launchProcess`) | `env` = `{...DEFAULT_ENVIRONMENT_VARIABLES, ...process.env, ...options.env}` |
| lint / typecheck / unit / build / e2e | not run: docs-only step (no code touched); baseline on main `58244a5` per contract (lint OK, typecheck OK, unit 441 passed, build OK, e2e 1 passed) — inherited, unverified |

No deliberate break: nothing testable was written in this step.

## 4. Next command

`/10x-plan task-round-stars`

## 5. Open

- Choices for the plan (recommendation in `research.md` § Open Questions): "Dalej" vs auto-advance (Dalej); ROUNDING exempt from the hint rule (yes, by type list); font TTF + `ttf` in `vite/config.shared.mjs` `globPatterns` now (yes); 3 vs 4 E1 tiles (4, from `balance.ts`); `'select'` excluded until S-13 (yes); where the hook-absence grep runs (CI, deploy build, `scripts/check-deploy.ts` `main`).
- E2E hook: `env: { E2E_HOOK: '1' }` on the app `webServer` entry (allowed addition), `__E2E_HOOK__` in `sharedConfig.define`; seed #8 then runs on the hook build — note it in the plan.
- DESIGN-GAP candidates for `docs/design-gaps.md` (created by the implementing step): kit "Podpowiedź" before an error, "Pokaż kroki" after the first error, another normal try after the steps instead of a retype without a star, "⌂ Do pokoju" in the HUD during a task (FR-011), round end before S-05, retype state copy, `'select'` mode.
- Follow-ups to write in this slice's `follow-ups/review-fixes.md`: hint content class c/b (COMPLEMENT, HALF, NUMBER_WORDS, ROMAN to-Roman, CALENDAR quarter, COMPARE_NUM equal, 1-line ADD_SUB/MULT, WORD, COMPARE_DIFF, DIV, EVEN_ODD single) `Trigger: S-17`; `'select'` UI `Trigger: S-13`; `context/foundation/test-plan.md` §3 phase 5 row, tools table and §6.6 stale `Trigger: /10x-test-plan refresh`; #9 rotate overlay has no spec.
- F14 in scope: `src/core/tasks/generators/missing.ts` `generateMissing` (two lines for a hidden operand) + teacher read.
- Manual (maintainer, iPad): touch reaction < 100 ms.
- No `lessons.md` in `context/foundation/`.

## 6. Autonomous decisions

1. **Scope taken from `change.md` § Open questions + step prompt; no AskUserQuestion.** Rejected: asking for scope. Why: contract rule 1. Would change: a maintainer question list on disk.
2. **Hint policy: keep `change.md` decision 3 (≥ 2 lines and line 0 not ending in the answer token), refined with a ROUNDING exemption; no generic mask.** Rejected: trailing/token mask for all types (measured unsafe or useless). Why: per-type masks are content work for S-17. Would change: the plan choosing per-type masks for class b types now.
3. **E2E hook via an `env` key on the app `webServer` entry, not a second server/port or `--mode e2e`.** Rejected: second entry + `dist-e2e/` (contract allows one extra port; doubles build), changing the app command. Why: ownership rules in `.claude/skills/10x-e2e-setup/references/playwright-setup-templates.md` allow an `env` key; dead-code removal measured. Would change: the maintainer requiring the seed to run on the exact production bundle (then a second build/serve step is needed and the contract port rule must be revisited).
4. **`'select'` skills excluded from S-04 draws, follow-up to S-13.** Rejected: building multi-select now. Why: roadmap § S-13 introduces select; no kit view; no step left empty. Would change: the plan finding US-01 needs every unlocked skill drawable now.
5. **Recommend kit "Dalej" after a correct answer.** Rejected: auto-advance timer. Why: kit `correct.png` shows it; star flight still non-blocking. Would change: the plan reading plan §6 "następne zadanie" as automatic.
6. **Clipboard copy skipped** (unattended run); command in §4.
