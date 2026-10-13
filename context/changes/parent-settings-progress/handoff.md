# Handoff — `parent-settings-progress` (slice S-08)

Written by the `research` step (autonomous run 2026-10-12-s04-s08): `research.md` answers the six questions with
evidence, and `change.md` is now `preparing`. The next agent must keep two things right. First, the in-place stage
change has to add the open round's stars to `TaskScene.sessionStars` (as `beginRound` does), or the counter drops.
Second, game input under the DOM dialogs is suspended globally through `game.input.enabled`, not scene by scene.

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2` (change identity) + one docs commit from this step: `docs(parent-settings-progress): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/parent-settings-progress/research.md` | The research, anchored by symbol. It covers: the long press in Phaser 4.2.1 plus a CDP held-touch helper; the icon spot (x 1782–1878, y 952–1048); global input suspension; the in-place stage-change recipe; capturing `firstWrong` and `example` in the history; the weakest-skills ranking and empty states; `effectiveAutoRead`; hook additions; proposed risk #14; the e2e helper de-dup |
| `context/changes/parent-settings-progress/change.md` | Frontmatter only: status `new` → `preparing` |
| `context/changes/parent-settings-progress/handoff.md` | This file |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/parent-settings-progress` |
| Local gate | Not run: docs-only step, no source file changed |
| Decisive claims re-checked by grep | All five confirmed: `InputPlugin.isActive` requires `manager.enabled`; the `TouchManager` window listeners check `manager.enabled`; `Pointer.touchcancel` sets `wasCanceled = true`; `currentStepOf` in `src/core/curriculum.ts` is a private `const`; `recordRound` slices to `historyLength`; `ROUND_SPEC` in `playwright.config.ts` limits the `chromium-hook` project |
| Prompt statistics | Throwaway tsx script outside the repo: 3280 tasks (seed 7, 40 per playable skill). Prompt length median 9, p95 77, max 115 characters |
| Deliberate break | None: no test or code in this step |

## 4. Next command

/10x-plan parent-settings-progress

## 5. Open

- Plan decisions, each with a recommendation in `research.md` § Open Questions:
  - the `Settings` shape (`autoRead: boolean | null` vs a separate `autoReadByParent`);
  - the parent-facing skill name (step `title` plus mistake examples);
  - a history filter to the current stage;
  - the movement tolerance (~30 game px) and the 2000 ms threshold in `balance`;
  - whether `mountInstallHint` joins the input suspension in this slice.
- A new e2e spec must be added to `ROUND_SPEC` in `playwright.config.ts`, otherwise it runs without the hook.
- No DOM unit-test environment exists (no jsdom or happy-dom). S-06 covers its DOM by e2e only; S-08 should do the same unless the plan adds a dependency.
- Only a device can confirm these: no callout or loupe on iPad during a 2 s hold, `contextmenu` on Android (suppression recommended), and no synthetic click on the dialog after the finger lifts (the e2e should prove it).
- Proposed test-plan risk **#14**, wording in `research.md` § 6. It goes to follow-ups as `Trigger: /10x-test-plan refresh`; no test-plan edit in this slice.
- DESIGN-GAPs to add after row 24 of `docs/design-gaps.md`: the settings icon and its spot, the parent settings panel, and the progress view with its empty state.
- `[human]` rows carried over from `change.md`: settings are session-only until S-11, and an open round is abandoned on a parent stage change.

## 6. Autonomous decisions

1. **The research question came from `change.md` § Open questions plus the step prompt; no interview was held** (contract rule 1).
   - Rejected: asking for scope.
   - Why: the artifacts define it fully.
   - What would change it: none in an unattended run.
2. **Recommended global `game.input.enabled` suspension (ref-counted) over looping through the scenes.**
   - Rejected: `getScenes(true)` with saved per-scene flags. It misses the sleeping `TaskScene`, it does not cover the install hint mounted at boot, and `UIScene.create` forces input on.
   - What would change it: a widget that needs `POINTER_UP_OUTSIDE` while a dialog is open (none found in `src/`).
3. **Recommended a weakest-skills ranking limited to skills with at least one first-try miss.**
   - Rejected: mastery alone.
   - Why: mastery is 0 both for skills never played and for skills played correctly fewer than 3 times.
   - What would change it: if mastery gained a "seen" marker.
4. **Recommended step `title` plus mistake examples as the parent-facing skill name.**
   - Rejected: a new `SkillDef.label` for 82 skills (large teacher-read surface) and task-type labels (still ambiguous in 4 steps).
   - What would change it: the maintainer wants named skills, which means new content in `src/data/`.
5. **Delegation: three read-only workers in parallel.**
   - The decisive claims were re-checked in the main context.
   - Rejected: a single local sweep, because the areas were independent.
   - What would change it: nothing for this step.
