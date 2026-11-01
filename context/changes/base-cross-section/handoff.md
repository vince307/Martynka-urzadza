# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-research` step of run `2026-10-31-space-base`. `research.md` is committed and `change.md` is `preparing`; no product code was touched. The next agent must not get this wrong: stopping `HouseScene` in `TaskScene.backToChoice` is NOT enough, because the scene instance survives stop/start (Phaser 4.2.1) and `HouseScene.loadArt`'s `artQueued` flag is never reset in `create`, so the second building's pictures would never load; and the base airlock must get its own file name (`base-1-cell-closed`), not reuse `cell-closed`.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | 4 on top of `9a44799`: `25761bd` change identity, `2f8ccb0` handoff after identity, `3fd2d02` research, plus this handoff commit |
| pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/base-cross-section/research.md` | source-backed research: base cross-section as data, per-building style/art/label, frame verdict, stale scene, fallbacks, WebP sizes, e2e path, save verdict, FR-046 celebration |
| `context/changes/base-cross-section/change.md` | frontmatter only: `status: preparing`, `updated: 2026-11-01` |
| `context/changes/base-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/base-cross-section` (observed) |
| `cwebp -quiet -q 85 -alpha_q 100 -m 6` on `designs/bystrow-space-base-v1/assets/base/{base-1-shell,cell-closed}.png` (scratchpad output) | 81 970 B and 12 308 B (observed); house art today 44 964 + 5 554 + 8 600 = 59 118 B |
| Pillow composite: `#e8efeb` + base shell + 3 airlocks + house `cell-frame.png` at (236, 620) (scratchpad) | frame clearly visible, matches the shell's gold trims (observed, image viewed) |
| `grep` of `node_modules/phaser/src/scene/SceneManager.js` `switch`/`start` | `switch` wakes a sleeping target else `start`s it; `start` reuses `getScene(key)` (observed) |
| `grep -rn 'księżyc' src` | no hit (observed): the manifest label is not game copy |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-plan base-cross-section`

## 5. Open

- Plan inputs (details in `research.md` § Summary):
  - Style per building: extend `HouseGeometry` (`src/core/types.ts`) with `background` and `teaser` (colour, shadow or null, weight); base values from the pack preview `#e8efeb`, `#245c59`, 600, no shadow; `HouseView.render` reads them instead of `HOUSE_LAYOUT.background`/`HOUSE_LAYOUT.teaser`.
  - Art: add `base-1-shell` and `base-1-cell-closed` rows to `HOUSE_ART` (`src/data/houseArt.ts`) and to `scripts/make-task-art.mjs` (from `SPACE`, into `HOUSE_OUT`, no recolour); `HouseScene.shellReady`/`loadArt` filter `HOUSE_ART` by the geometry's keys; `HOUSE_GEOMETRY['base-1']` with `cellFrame: 'house/cell-frame'`.
  - `tests/houseArt.test.ts` "weighs at most 80 000 B in all" fails once the base rows exist: make it a per-building sum (base about 102 900 B with the shared frame).
  - `tests/houseCells.test.ts` "HOUSE_GEOMETRY data" expects `['base-1']` without geometry: flips by design.
  - Label: `pl.house.open` becomes a record keyed by house id ('Dom', 'Baza', FR-048), read in `RoomScene.redraw`; the e2e hook needs a field exposing the label.
  - `TaskScene.backToChoice`: stop `SCENE_KEYS.house`; `HouseScene.create`: reset `artQueued`/`artSettled` (follow-up 17, extended).
  - FR-046 Mostek celebration: D4 default holds (one tile, "Dalej" stays in Mostek, "Baza" button after the card); house-cross-section follow-up 21 (`houseButton` null while the card is up) belongs in the Mostek e2e.
  - E2E: `passWelcome(page, { ...QUIET, e2eStars: '100' }, 'space')` (`tests/e2e/support/welcome.ts`).
- Risks: stand-in shell in `HouseView.standInShell` draws a house roof for the base (gap row or a per-geometry flag; house-cross-section follow-up 20 fires if `HouseView` changes); house-cross-section follow-up 19 (`onProcessError` line) fires with the `loadArt` change.
- DESIGN-GAP rows to write in `/10x-implement` (after 198 in `docs/design-gaps.md`): base frame reuses the house `cell-frame`; base stand-in shell; zoom-out "Baza" (closes 195); last-module celebration without a teaser (narrows 196).
- Follow-ups carried unchanged: first-building-choice 11, 16, 18 (fallbacks unreachable for the base on the inspected paths), 19, gap 198 (D7); house-cross-section 2, 4, 5, 9, 11.

## 6. Autonomous decisions

- R1 — research done locally without sub-agents. Chosen: local reads (one subsystem, already mapped by `change.md`). Rejected: 2–4 parallel workers (the skill default) as duplicate reading of the same six files. Would change: a scope spanning several subsystems.
- R2 — recommend style fields on `HouseGeometry`, not a sibling `HOUSE_STYLE`. Why: one record per building view, `cellFill` already a pack colour there, `HouseView` stays branch-free. Rejected: `if base` in the view (roadmap risk). Would change: the plan finding `HouseGeometry` should stay pure geometry for the street (S-26); then a sibling record keyed by house id.
- R3 — keep one flat `HOUSE_ART` and filter by geometry keys. Why: deploy smoke and orphan test keep working unchanged. Rejected: a per-building table (two smoke lines, two orphan checks). Would change: a building whose art lives in another folder.
- R4 — reuse the house frame on the base (confirms change.md default). Why: the composite reads well. Would change: the in-game visual gate showing a clash.
- R5 — follow-up 17 fix extended to an instance-flag reset. Why: Phaser reuses the scene instance on `start`. Would change: none foreseen (source-verified).
- R6 — save format stays v6 (confirms D6). Would change: a saved per-building view field, none found.
- R7 — D4 kept as the plan's default for FR-046. Would change: the author's answer to the roadmap unknown.
- The skill's AskUserQuestion clarifications were not used (contract rule 1); the question set came from `change.md` and the step prompt.
