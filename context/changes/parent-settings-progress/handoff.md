# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 8 step (`/10x-implement` phase 8, autonomous run 2026-10-12-s04-s08). Phase 8 added the progress preview to the settings panel (current step, up to 3 weakest skills with up to 2 mistake examples, empty state). Phases 1-8 of 11 are committed; e2e is the orchestrator's gate (Chromium not launchable here). Row 7.3 is ticked from the orchestrator's run on `b5efc5e`; 8.1 stays open until the orchestrator runs e2e on the phase 8 commit.

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | p1-p7 as before (last `b5efc5e`, handoff `0aff6d7`), `0d1d820` (p8), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 24 (8.1 open for e2e, 8.4 reviewer, 8.5 visual, 7.5, 7.6, 6.6, 6.7, plus phases 9-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/progressView.ts` | `createProgressView(view: ProgressView)`: section with "Postępy" heading, step line, "Do poćwiczenia" list (step title + mastery, nested example list) or the empty paragraph; renders only, no computation |
| `src/ui/dom/settingsPanel.ts` | new option `progress: ProgressView`; preview sits after the reading group, before the sticky actions |
| `src/scenes/UIScene.ts` | computes `progressView(getStage(learner.stage), learner, { mastery: balance.mastery, view: balance.parentSettings })` when the gate passes (closes settings if the stage were missing) |
| `src/data/pl.ts` | `pl.settings.progressHeading`, `currentStep`, `weakestHeading`, `mastery`, `example`, `empty` |
| `src/ui/dom/overlay.ts` | `createText` also accepts `h2` |
| `src/style.css` | `.parent-progress*` (left aligned, examples 0.8em, wrapping) |
| `context/changes/parent-settings-progress/plan.md` | rows 7.3, 8.2, 8.3 ticked |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 948 passed (branch baseline 948, +0) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -rl __martynkaE2E dist/` empty |
| Deliberate break | `UIScene` gives the panel `progressView` of `{ ...learner, history: [] }`: unit suite stays 948 green, as the plan predicts; restored. Meta-check: this phase claims no unit coverage of the wiring; the rendered content is proved by e2e phase 11 |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate`. Orchestrator command: `npx playwright test` (expected 15 passed; no spec touched) |

## 4. Next command

/10x-implement parent-settings-progress phase 9

## 5. Open

- Row 8.1: orchestrator `npx playwright test` on `0d1d820` (expected 15 passed).
- Rows 8.4 [reviewer] (teacher read: strings are number-only templates, e.g. "Krok 3 z 8: <tytuł>", "opanowanie 2 z 5", "<polecenie> — odpowiedź dziecka: 12, poprawnie: 15"), 8.5 [visual] (1440x900 and 1024x768, empty / 1 / 3 items with a long word prompt; "Zatwierdź" and "Anuluj" visible without scrolling; the sticky bar is the only guarantee, check it does not hide the last example), 7.5, 7.6, 6.6, 6.7.
- DESIGN-GAPs for phase 9 (docs/design-gaps.md): settings gear icon, settings panel, sticky actions, progress preview and empty state; comments exist in `layout.ts`, `pl.ts`, `settingsPanel.ts`, `progressView.ts`.
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e).

## 6. Autonomous decisions

1. The step line uses `StepDef.title` (what `progressView` returns, per plan and 9.8) rather than `childName`, which only some playable steps have; a parent-facing step name is the title. Would change if the maintainer wants the child-facing name (then `progressView` needs `childName ?? title`).
2. The preview is for the learner's current stage at opening, not the stage picked inside the panel (plan: "bieżący etap ucznia").
3. `UIScene` closes the panel flow if `getStage` returns undefined (type guard; cannot happen with the six stages).
4. `createText` widened to `h2` for the preview heading (matches the existing `.parent-dialog h2` style).
5. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
