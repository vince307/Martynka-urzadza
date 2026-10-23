# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-research fox-guide` of run 2026-10-23-fox-guide: `research.md` resolves placement, screens, pose
rule, motion, art size, input and e2e, and proposes four phases. The next agent must not put the fox on the notebook's
inner face: the chosen spot is the right margin at the top-right corner (feet at 1792, 400; 320 px image, silhouette
≈ 188 × 220), and the geometry test must use the silhouette union of the three poses, not the image box.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | 2 on the branch: `docs(fox-guide): change identity (autonomous run)`, `docs(fox-guide): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/research.md` | research: (a) placement + full rect table with symbols and clearances, (b) screens, (c) pose rule + TaskScene hooks, (d) motion/depth/backdrop, (e) art pipeline (384² WebP, sizes measured), (f) input, (g) e2e hook + spec, DESIGN-GAP rows 165–168, proposed phases with drivers |
| `context/changes/fox-guide/change.md` | frontmatter only: `status: preparing`, `updated` (by the guard script) |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| `cwebp -resize {384,512} … -q 85 -alpha_q 100 -m 6` on the three pack PNGs (scratchpad only, nothing in the repo) | 384²: idle 13 700 B, cheer 15 086 B, think 13 598 B; 512²: 20 282 / 22 466 / 20 160 B |
| `metadata-guard.mjs inspect` / `mark-researched` | changed: true, status new → preparing |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-plan fox-guide`

## 5. Open

- Plan inputs: `research.md` § "Proposed phases for the plan" (1 art + table `impl`, 2 pose + geometry `tdd`,
  3 widget + scene + hook + gaps `impl`, 4 e2e spec `e2e`).
- DESIGN-GAP rows 165–168 are proposed in `research.md`, not yet added to `docs/design-gaps.md` (phase 3).
- `tests/uiArt.test.ts` `toHaveLength(5)` must become 8; the `balance.loader` comment (boot payload) must grow by ~42 KB.
- Visual-gate risk: 10 px of the silhouette over the paper face at x 1714–1724; fallback anchor x 1802 noted in
  `research.md` Open Questions.
- Follow-ups: none taken; `TaskScene.render` gets one call, so the child-flow-guards `modeWidgets` follow-up stays open
  (the fox reads the phase, not the mode); BootScene follow-ups untouched (no BootScene edit needed).

## 6. Autonomous decisions

- R-1: "180–240 px" = silhouette height (ears to base); image 320 px → silhouette 220. Rejected: canvas 180–240
  (silhouette 123–165, pose hard to read). Would change: maintainer says the canvas; then `GUIDE.displaySize` 240, same anchor.
- R-2: placement right margin at the top-right corner, astride the frame. Rejected: bottom-right (bar/"Dalej", hint bubble,
  gear), bottom-left ("Wróć", build id, stitches, wallet/tall column), top-left/top edge (prompt, "Do pokoju", 56 px gap).
  Would change: a layout change that puts content right of x 1700 above y 643, or the visual gate rejecting the look.
- R-3: screens — task layer of every round kind + cheer on `SummaryPanel` and `MinigameDoneCard`; hidden on `UnlockCard`.
  Rejected: hiding on the done card (it is the word/dice summary) and showing on the unlock card (scope names only task +
  summary). Would change: maintainer wanting the fox on the unlock card.
- R-4: pose = pure function of screen + `RoundPhase` (first idle; second/solution/retype think; done cheer). Would change: a
  new phase in `RoundPhase` (the `never` guard forces a decision).
- R-5: motion = `setTexture` + 1.06 pop, 240 ms; no cross-fade, no breathing. Would change: the visual gate finding the pop
  too lively or the swap too abrupt.
- R-6: WebP 384² (not 512²): the 1920 × 1080 backing store caps detail at the 320 scene px shown; 1.2 : 1 bilinear is clean
  without mipmaps; 20 KB less on a near-limit boot budget. Would change: a game config `resolution`/zoom > 1 or a larger fox.
- R-7: missing pose texture → that pose hidden, no `recordFallback`. Would change: a request to record it in "Obrazki" beyond the UI count.
- `/10x-research` clarification questions were not asked (no human); scope came from `change.md` + `scope.md` + the step prompt.
