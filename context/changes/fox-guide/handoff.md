# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-new fox-guide` of run 2026-10-23-fox-guide: the change identity exists, every scope.md / FR-037
claim is checked against the repo in `change.md`. The next agent must not assume an inner notebook corner is free in
every answer mode — none is at 180–240 px (see the claims table); measure each mode before choosing.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | 1 on the branch: `docs(fox-guide): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/change.md` | change identity: source, save/migration note (none, v4), art pack facts, claim / repo now / correction table, kit views bound + DESIGN-GAP note, triggered follow-ups, Autonomous decisions D-1..D-6 |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| `ls context/changes/fox-guide context/archive \| grep fox` | no prior change of that id (uniqueness check of `/10x-new`) |
| repo reads for the claims table | `scripts/make-task-art.mjs` (`UI_JOBS`, `SALON_V2`), `src/data/uiArt.ts`, `tests/uiArt.test.ts` (length 5), `src/scenes/BootScene.ts` (`queuers.ui`, `tables`, `withCauses`), `vite/config.shared.mjs` (`globPatterns` include webp), `scripts/check-deploy.ts` (`precacheCovers` over `UI_ART`), `src/data/layout.ts` (`TASK_LAYOUT`, `HUD_LAYOUT`, `SUMMARY_LAYOUT`), `src/core/notebookGeometry.ts`, `src/core/round.ts` (phases), `src/ui/motion.ts`, `src/main.ts` (no resolution) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-research fox-guide`

## 5. Open

- Research questions (from `change.md`): which corner (inner face vs. astride the frame / right or left margin) is free
  in tiles, keypad, select, drag (blocks, clock, coins), digits, tall picture, hint number line and the solution phase,
  plus the summary; what "180–240 px" measures (canvas vs. silhouette) and the WebP size; how the pose maps for the
  daily puzzle, word and dice minigames and the warm-up; whether the e2e hook (`src/testing/e2eHook.ts`) gets a
  read-only pose; how `npm run art` gets a third kit root (`scripts/make-task-art.mjs` `UI_JOBS` read only `SALON_V2`).
- `tests/uiArt.test.ts` pins `UI_ART` length 5 — must become 8 when the poses are added.
- DESIGN-GAP rows to add in `docs/design-gaps.md` (next numbers after 164): fox placement/size, pose motion, screens
  where it shows, missing-art behaviour. None added yet.
- Follow-ups: none names the guide; code-touch triggers listed in `change.md` § "Open follow-ups triggered by this
  slice" (health-lines-and-smoke § 18 `UI_MISSING_URL`, final-art-salon F3 `BootScene` progress listener,
  stale-tab-and-health G-2.. `loaderror` labels, child-flow-guards `modeWidgets` in `TaskScene.render`, TaskScene
  lifecycle audit items) — each taken only if the plan edits that symbol.

## 6. Autonomous decisions

- D-1: scope.md items 1–8 recorded as pre-agreed by the maintainer 2026-10-23. Would change: only the maintainer.
- D-2: next step `/10x-research` instead of the skill default `/10x-plan` — the corner needs per-mode measurement; also
  fixed by the step prompt. Would change: nothing (prompt-fixed).
- D-3: corner candidates include sitting astride the notebook frame or in the side margin, because no inner corner is
  free in every mode at the scope's size; rejected shrinking the fox or moving content. Would change: research finding a
  free inner corner in every mode/phase at ≥ 180 px.
- D-4: default presence = task screen (incl. warm-up, puzzle) + summary, not the unlock card or minigame done card;
  rejected deciding finally before the variant flows are mapped. Would change: research showing a variant screen whose
  corner is occupied or whose outcomes do not map to poses.
- D-5: working hypothesis — pose = pure function of the round `phase` in `src/core/` (first → idle, second/solution/retype
  → think, done → cheer), no new state. Would change: a flow whose outcomes are not in the round phase.
- D-6: no migration, `SAVE_VERSION` stays 4. Would change: nothing in scope.
- Clipboard hand-off of `/10x-new` skipped (no human at the terminal); the next command is §4.
