# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 1 step (`/10x-implement` phase 1, autonomous run 2026-10-12-s04-s08). Phase 1 moved the duplicated e2e
helpers into `tests/e2e/support/hook.ts` and the gate steps into `support/welcome.ts`; production code untouched. The e2e
proof (15 passed, plus the break) is the orchestrator's: Chromium cannot launch in this session (MachPort).

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2`, `965c602`, `d355ca0`, `33a40d3` (plan review), `d72768a` (phase 1), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (phase 1 of 11 committed; status moves at the last phase) |
| `## Progress` rows remaining | 51 (rows 1.1, 1.2, 1.5 ticked; 1.3 and 1.4 wait for the orchestrator's e2e run) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/support/hook.ts` | Now exports `Snapshot`/`Targets` (union of what the specs read), `toPage`, `tapScene`, `tapNumber`, `answerWrong`, `answerRight`, `phaseIs`, `tapNext` (checks once), `tapTarget` (polls), `screenIs`, `silenceSpeech` |
| `tests/e2e/support/welcome.ts` | Now exports `openWelcome(page, month?)`, `gateProblem`, `typeIntoGate`, `openGate(page, month?)`, `passWelcomeAsParent`, `passWelcome`, `passWelcomeAsChild`; its copies of `readHook`/`tapScene` are gone |
| `tests/e2e/{task-round,first-launch,narrator,adaptive}.spec.ts` | Local copies removed, imports from `support/`; narrator keeps `answer(page, right)` as a one-line wrapper and its own speech fakes, `cleanTask`/`playTask`/`playRound` stay local |
| `context/runs/2026-10-12-s04-s08/e2e-break-s08-p1.patch` | Deliberate break for the orchestrator (see §3) |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` | 57 files, 881 passed (baseline 881 + 0) |
| `npm run build` | OK, `e2e hook: absent` |
| `git diff --stat` of d72768a | only `tests/e2e/**` (6 files) |
| local copies | `grep -c "^const readHook\|^const tapScene\|^const fromHook" tests/e2e/*.spec.ts` = 0 in every file |
| `test(` count | task-round 4, first-launch 6, narrator 3, adaptive 1, seed 1 = 15 |
| `expect(` count (before to after) | task-round 42 to 40, first-launch 47 to 41, narrator 19 to 17, adaptive 15 to 15; every removed line is inside a moved helper (`tapScene`/`toPage` box, `fromHook` poll, `phaseIs`, `tapNext`, `screenIs`, `gateProblem`, `openGate`/`openWelcome`); none added or changed in a `test(...)` body |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate`. Orchestrator command: `npx playwright test` (expected 15 passed) |
| Deliberate break (orchestrator) | `git apply context/runs/2026-10-12-s04-s08/e2e-break-s08-p1.patch` (phaseIs polls `.not.toBe(phase)`), then `npx playwright test tests/e2e/task-round.spec.ts tests/e2e/first-launch.spec.ts`: expect red in both (task-round `beforeEach` waits for phase `first`, first-launch `playTask`). Then `git checkout tests/e2e/support/hook.ts`. Meta-check: the break is in a helper, so it proves only that specs use the shared helper, which is the phase's goal |

## 4. Next command

/10x-tdd parent-settings-progress phase 2

## 5. Open

- Rows 1.3 and 1.4 (e2e green and the break) are the orchestrator's; re-dispatch phase 1 if `npx playwright test` is red.
- Type unification note: shared `Snapshot`/`Targets` are the union of the spec-local types (all `Targets` round fields `Point | null`, `ages?`/`parent?` optional); the welcome screen's snapshot carries only `screen` and `learner`, as before. `passWelcomeAsParent` now reads the gate through `gateProblem` (named dialog `Pytanie dla rodzica`) instead of the unnamed `getByRole('dialog')`; same strings and same checks.
- `[human]` rows (post-run checklist): 6.7 install hint no longer leaks taps; 9.6 session-only settings until S-11; 9.7 feel
  of the 2 s hold on iPad/Android; 9.8 PRD deviations (a)–(e).
- Implementers of phases 2/6/10: `createInputSuspender(target, onRelease?)` contract (plan.md Critical Implementation
  Details "Wstrzymanie wejścia"); phase 10 proves it with the third break (row 10.4).
- Phase 8: the visual gate must show "Zatwierdź"/"Anuluj" without scrolling at 1024x768 (row 8.5).
- DESIGN-GAPs 25–28 and follow-ups as planned for phase 9 (including the S-12 export privacy note).
- Every `Trigger: S-08` follow-up is in scope (list in reviews/plan-review.md Grounding).

## 6. Autonomous decisions

1. **Shared types are a union, not generics.** Rejected: per-spec generic `readHook<T>`. Why: one `Snapshot`/`Targets` keeps helpers typed and specs unchanged. What would change it: a hook field whose type differs between screens.
2. **`tapScene` built on `toPage`** (one copy of the canvas mapping, same math). What would change it: a spec needing the page point without tapping (narrator already uses `toPage`).
3. **`openWelcome` takes `month?: number`** instead of a search string; first-launch passes `OCTOBER`. Same URL (`/?e2eMonth=9`).
4. **Commit message and stop-after-phase decided in place** (contract rule 1); no AskUserQuestion.
