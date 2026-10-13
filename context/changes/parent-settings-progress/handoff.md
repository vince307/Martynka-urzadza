# Handoff — `parent-settings-progress` (slice S-08)

Written by the `plan` step (autonomous run 2026-10-12-s04-s08). `plan.md` has 11 phases: e2e helper de-dup (impl),
four tdd logic phases, three impl glue/UI phases, the seam sweep, and two e2e phases for #14 (proposed). The next agent
must check two things against the code. First, `TaskScene.applyParentStage` adds the open round's stars to
`sessionStars` before `freshRound()`. Second, the stage change is triggered by `GAME_EVENTS.parentStage` plus the `wake`
check, not by `changedata-learner` (that would fire inside `finishWarmup`).

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2` (change identity), `965c602` (research), and one docs commit from this step: `docs(parent-settings-progress): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 53 (all) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/parent-settings-progress/plan.md` | Full plan: 11 phases, each with `Driver:`/`Driver why:` lines; 13 autonomous decisions; Known risks; `## Progress` |
| `context/changes/parent-settings-progress/plan-brief.md` | Two-page brief with the key-decisions table |
| `context/changes/parent-settings-progress/change.md` | Frontmatter status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-08 `proposed` → `planning`, in At a glance and in the `### S-08` block |
| `context/changes/parent-settings-progress/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/parent-settings-progress` |
| Local gate | Not run: docs-only step, no source file changed |
| `grep -c '^- \[ \]' plan.md` | 53 |
| `grep -nE '^Driver:' plan.md` | 11 lines: impl, tdd ×4, impl ×4, e2e ×2. The e2e phases (10, 11) come after the seam sweep (phase 9) |
| Success Criteria ↔ Progress | Checked by hand: one Progress row per criterion in every phase. The Chromium fallback for phases 10–11 is a note, not a criterion |
| Code claims re-read in this step | `TaskScene` (`create`, `beginRound`, `finishRound`, `finishWarmup`, `onWake`, `toRoom`), `UIScene.create`, `round.ts` `answer`, `mastery.ts` `recordRound`, `curriculum.ts` `currentStepOf` (private), `placement.ts`, `types.ts` `Settings`, `dialog.ts`, `stagePanel.ts`, `parentGate.ts`, `installHint.ts`, `main.ts`, `e2eHook.ts`, `layout.ts` `HUD_LAYOUT`/`REGISTRY_KEYS`, `playwright.config.ts` `ROUND_SPEC`, `support/{hook,welcome}.ts` exports |
| Deliberate break | None: no test or code in this step |

## 4. Next command

/10x-plan-review parent-settings-progress

## 5. Open

- `[human]` rows (post-run checklist):
  - 6.7: the install hint no longer leaks taps (iPad/Android).
  - 9.6: settings stay session-only until S-11. After a cold start the parent sees the welcome again, the default auto-read and an empty progress view.
  - 9.7: the feel of the 2 s hold on iPad/Android.
  - 9.8: the PRD deviations, (a) to (e).
- The reviewer should check these in plan-review:
  - Is `REGISTRY_KEYS.inputSuspender` set in `preBoot` from `booting.input` valid in Phaser 4.2.1? The `InputManager` must exist at `preBoot`. If it does not, the counter is created lazily on first use.
  - Is the progress panel readable at 1024×768?
- DESIGN-GAPs 25–28 are planned for phase 9 (`docs/design-gaps.md`): the icon and its spot, the parent panel, the progress view with its empty state, and the hold without feedback.
- Follow-ups planned for phase 9 (`follow-ups/review-fixes.md`): risk #14 for the test plan; for S-11, saving `Settings`, the history `example` field and `pendingUnlock` as `{ stage, step }`; the early save for daily play; S-12 adds export/import/reset to the same panel; S-17 calibrates `holdMs`/`moveTolerance`.
- Every follow-up whose `Trigger:` names S-08 is in scope:
  - the `autoRead` switch: phases 3, 6 and 7;
  - the stage change behind the gate: phases 3, 6 and 7;
  - the e2e helpers: phase 1;
  - `pendingUnlock`, cleared on a stage change: phase 3;
  - the history example: phase 4;
  - the install-hint leak, an adjacent trigger: phase 6.

## 6. Autonomous decisions

1. **Every open question from research was decided as research and the orchestrator recommended.** The detail is in plan.md § Autonomous decisions 1–13. The choices were:
   - `autoRead: boolean | null`;
   - the skill named by the step title plus mistake examples;
   - the history filtered to the current stage;
   - a 30 px tolerance and 2000 ms, both in `balance.parentSettings`;
   - the install-hint fix on the global counter.
   - Rejected: the alternatives listed there.
   - What would change it: the maintainer's `[human]` 9.8 review.
2. **The panel applies changes on „Zatwierdź”/„Anuluj” rather than as instant toggles** (plan decision 10).
   - Why: the parent can look at the progress view without side effects.
   - What would change it: a playtest showing that parents forget to confirm.
3. **The stage-change trigger is a game event plus a `wake` check, not a registry `changedata` listener.**
   - Why: `finishWarmup` writes the learner's new stage before it sets `this.stage`, so a registry listener would fire in the middle of the warm-up.
   - What would change it: `finishWarmup` reordered and covered by a test.
4. **Phase 1 (e2e helper de-dup) comes first, as impl** (orchestrator guidance).
   - Proof: the 15 specs stay green with no assertion changed.
   - The orchestrator runs the specs if Chromium does not launch in the agent session.
5. **No AskUserQuestion; complexity rated HIGH.**
   - The skill's interview rounds and phase-structure approval were decided in place, following the research and the orchestrator guidance (contract rule 1).
   - The clipboard copy was skipped (unattended session).
