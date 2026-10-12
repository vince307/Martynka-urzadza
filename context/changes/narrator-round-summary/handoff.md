# Handoff — `narrator-round-summary` (slice S-05)

Written by the `/10x-plan` step of autonomous run 2026-10-12-s04-s08. `plan.md` (12 phases: 4 tdd, 6 impl, 2 e2e) and `plan-brief.md` are written; `change.md` is `planned`; the roadmap row S-05 is `planning`; there is no product code yet. The plan reviewer must check the gesture rule (speech only in `pointerup`, `PageButton` in `pointerup`, `ActionButton` unchanged) and that phase 6 is the first place the `roundEnd` bar disappears, so phases 1–5 keep the old end of round working.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | 3 after this commit (`ad5535b` change identity, `35ed687` research, plus this plan commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 55 (`grep -c '^- \[ \]' plan.md`), none done |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/narrator-round-summary/plan.md` | full plan: 12 phases, each with `Driver:` / `Driver why:`, criteria as baseline + delta, deliberate break + meta-check, `## Autonomous decisions` (14), `## Progress` |
| `context/changes/narrator-round-summary/plan-brief.md` | two-page brief with the decision table |
| `context/changes/narrator-round-summary/change.md` | frontmatter status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-05 `Status` `proposed` → `planning` (At a glance row and the `### S-05` block) |
| `context/changes/narrator-round-summary/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/narrator-round-summary` |
| Success Criteria ↔ Progress mapping (script over `plan.md`) | 1:1 for all 12 phases (5/5, 5/5, 4/4, 3/3, 4/4, 6/6, 5/5, 4/4, 4/4, 9/9, 3/3, 3/3); every phase body has a `Driver:` line |
| `metadata-guard.mjs inspect` / `mark-planned` | inspect OK; `mark-planned` `{"changed":true}` |
| Code claims re-checked in this step | `roundView`/`barOf` (`roundEnd`, `switchVisible: false`), `TaskScene.advance`/`snapshot`/`targets`, `UIScene.create` (`input.enabled = false`), `ActionButton` (`pointerdown`), `StarCounter.value`, `installE2EHook`, `playwright.config.ts` `ROUND_SPEC`, `pl.round`/`pl.tasks.romanContexts`/`romanMonth`, generators setting `speak` (only `generateMissing`), ESLint browser-globals list |
| Gates (lint, typecheck, unit, build, e2e) | not run: docs-only step; baseline from the contract `main` @ `8467431`: unit 596 passed, e2e 4 passed |

## 4. Next command

/10x-plan-review narrator-round-summary

## 5. Open

- Manual-only Progress rows (checklist for the maintainer):
  - [ ] 10.5 `[human]` auto-read only as a session default by stage, no parent toggle until S-08 (FR-009)
  - [ ] 10.6 `[human]` "Do pokoju" not highlighted until S-09 (`summaryView` with `nextRoomTaskCost: null`, FR-010)
  - [ ] 10.7 `[human]` room returns to the screen the child left (kit), not a new round (against `change.md` decision 3)
  - [ ] 10.8 `[human]` first task after a cold start is never auto-read (browser gesture rule)
  - [ ] 10.9 `[human]` iPad (Safari, PWA) and Android listening check: voice quality, numerals in sentences, spelled Roman numerals, one unlock per session (PRD OQ 7)
  - `[reviewer]` teacher reads: 1.5 (generator `speak`), 2.5 (`czyta:` lines, `pl.speech`), 6.5 (`pl.summary`), 7.4 (`pl.room`); seam sweep 10.4
  - `[visual]` 5.4, 6.6, 7.5, 9.4 (states named in the plan, 1440×900 and 1024×768)
- DESIGN-GAPs planned (phase 10 writes them to `docs/design-gaps.md`): (a) highlighted "Do pokoju", (b) bonus line, (c) star row meaning, (d) no voice → speaker hidden, (e) empty room, (f) HUD counter on the summary; row 5 removed; row 4 rewritten by phase 9.
- Follow-ups planned (phase 10, `follow-ups/review-fixes.md`): room-task cost into `summaryView` (S-09); `numberToWords` above 1000 in speech (condition: listening check); "Oblicz" over compare prompts (`isExpression`); narrator risk for `/10x-test-plan refresh`; `autoRead` toggle (S-08) and save (S-11); carried from S-04: `pl.title` (S-06), solution-step dots.
- Known risks: iOS sticky activation; `UIScene` with input enabled must not swallow taps meant for `TaskScene` (covered by #11 after phase 5).

## 6. Autonomous decisions

1. **No interview, no complexity confirmation.** The skill asks for both; contract rule 1 forbids asking. Every open product question from research was decided from the kit, PRD and `change.md` and written into `plan.md` `## Autonomous decisions` (1–14).
   - Would change: nothing in this step.
2. **Room return follows the kit (back to the screen the child left), against `change.md` decision 3.**
   - Rejected: a new round after the room.
   - Why: the kit binds (profile § 6), and it gives one `scene.switch` path for the summary and the HUD switch.
   - A `[human]` row (10.7) names it. Would change: the maintainer wants the room to reset the round.
3. **12 phases, speech content first (phases 1–2), the `roundEnd` bar removed only in phase 6.**
   - Why: each phase must leave the game playable for a fresh agent, and the generator work keeps its own tdd phase with a teacher read (orchestrator guidance).
   - Would change: the plan review finds a phase too big for one agent; then split it.
4. **The HUD switch is phase 9, the last code phase before the seam sweep, and cuttable** (orchestrator guidance, `change.md` decision 3).
   - Would change: if it is cut, design-gaps row 4 and the follow-up go back to S-09.
5. **The narrator spec is its own file (`tests/e2e/narrator.spec.ts`), with `chromium-hook` `testMatch` widened.**
   - Rejected: adding it to `task-round.spec.ts`. That file stays on risk #11, which covers the round only.
   - Every hook spec stubs `speechSynthesis` through `page.addInitScript`.
   - Would change: `/10x-test-plan refresh` assigns the narrator a risk id.
6. **Phase 10 uses the profile-path deliberate break proven in S-04,** not a `CLAUDE.md` path.
   - Why: it is not certain that `validate-rule-files.sh` checks paths inside `CLAUDE.md`.
   - Would change: the validator does check them.
7. **Clipboard step skipped.** There is no one to receive it in an unattended run; the command is in §4.
8. **Next step is `/10x-plan-review`, as the step prompt fixes.**
