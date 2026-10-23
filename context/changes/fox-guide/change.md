---
change_id: fox-guide
title: Fox guide (silent mascot in the corner of the task notebook, PRD FR-037)
status: planned
created: 2026-10-23
updated: 2026-10-23
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** maintainer 2026-10-23 — the mascot art is delivered in the local, gitignored folder
`designs/martynka-fox-guide-v1` (`assets/fox-idle.png`, `fox-cheer.png`, `fox-think.png`, `README.md`,
`manifest.json`, `qa-report.json`, `preview.png`); implement PRD FR-037 (the silent guide in the corner of the task
notebook). Decisions in `context/runs/2026-10-23-fox-guide/scope.md`. Autonomous run `2026-10-23-fox-guide`, its only
slice `fix:fox-guide`; branch `feat/fox-guide` cut from `main` at `1962312`. No roadmap block and no roadmap status
edits. Out of scope (scope.md): the observability audit findings of PR #101 and street/houses/residents (FR-032–FR-036).

**PRD binding.** FR-037 (`context/foundation/prd.md`, nice-to-have after v1): a small animal guide in the style of the
game's art in the corner of the task notebook, three poses (calm, joy after a good answer, thought after a miss); it does
not speak, has no dialogue or story, never covers the task, never shows disappointment; under the system "reduce motion"
it changes pose without animation. Non-Goals carry the matching exception ("Brak fabuły, dialogów, postaci… Wyjątki po v1:
… niemy przewodnik w rogu zeszytu (FR-037), bez dialogów, wyborów i historii").

**Save format and storage.** No migration expected: `SAVE_VERSION` stays **4** (`src/core/save.ts`), `SAVE_KEYS`
(`src/data/layout.ts`) unchanged, nothing new in IndexedDB or `localStorage` (profile § 4 has no DB; save migrations are
code in `src/core/save.ts`). The pose is derived from the round state at render time (runtime only). A change that would
need v5 or a stored field is outside scope.md item 5.

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

**Content rule:** no change to `src/data/curriculum/`, `wordTemplates.ts`, generators or task copy is planned, so no
teacher read is due. Geometry/motion tokens go to `src/data/layout.ts`; no player-facing text is expected (scope item 8;
the art table's `label` is `''`).

**Art pack facts (read 2026-10-23, `designs/martynka-fox-guide-v1`).** Three 1024 × 1024 PNG RGBA, transparent, outer
16 px transparent, no ground shadow, light upper left, common scale (`manifest.json` `sourceScale` 0.6135), common
anchor (512, 900) = (0.5, 0.87890625). `qa-report.json` solid bounds: idle x 325–862, cheer x 264–866 (both paws up, one
gold star above the head, top y 200), think x 324–865 (top y 196); all y to 900. So the silhouette is about 0.68 of the
canvas height and up to 0.59 of its width; the cheer pose is ~60 px (source) wider to the left than idle — the README
insists on keeping the whole canvas and one anchor for every pose (never trim per pose). Looked at `preview.png`: a
friendly orange fox, closed-eye smile in cheer, paw at chin in think; none looks disappointed (FR-037 holds for the art).

## Scope claims re-verified against the repo (branch `feat/fox-guide` at `1962312`)

| claim (scope.md / FR-037) | repo now (symbols) | correction |
|---|---|---|
| Art goes "through the existing pipeline (`npm run art` / `scripts/make-task-art.mjs`)" into `public/assets/ui/` | `scripts/make-task-art.mjs` has `UI_JOBS` → `UI_OUT` (`public/assets/ui`), but every UI job reads from `SALON_V2` (`designs/martynka-salon-v2`) only; the script aborts unless `KIT` and `SALON_V2` exist; cwebp `-q 85 -alpha_q 100 -m 6`, resize `[w,h]` or source size | the pipeline needs a **third kit root** (`designs/martynka-fox-guide-v1`) plus its existence check, or a `from`-root per job. Alpha is preserved by the existing flags. The header comment lists the UI pictures by name — update it |
| "the `UI_ART` table in `src/data/uiArt.ts`" | `UiArtId` union of 5 ids, `UI_ART` (5 `def` rows: key `ui/<file>`, url `assets/ui/<file>.webp`, width/height of the WebP, `label`), `UI_ART_KEYS` record | confirmed. `label: ''` already exists for `loadingBackground`/`loadingEmblem` (no stand-in box), so "missing → no fox" has precedent. `tests/uiArt.test.ts` pins `UI_ART` length **5**, checks every file's WebP header size, no orphan file in `public/assets/ui`, and `UI_ART_KEYS` = ids — all must grow to 8 |
| "loaded in `BootScene`" | `BootScene.preload` `queuers.ui` loads every `UI_ART` entry except the two loading pictures (queued first); `bootQueue` order `loadingArt, font, task, room, ui, sound`; the e2e seam `?e2eArt=ui` swaps the url for `UI_MISSING_URL` | confirmed: a new `UI_ART` row is loaded with no BootScene edit (the `ui` queuer iterates the table). The `?e2eArt=ui` seam makes every non-loading UI picture missing, fox included — a ready proof of "missing → no fox" |
| "precached" | `vite/config.shared.mjs` precache globs include `webp` (CLAUDE.md: js, css, html, png, webp, ogg, m4a, woff2, ttf) | confirmed, nothing to add |
| "counted in the existing UI art health line" | `BootScene.create` writes `REGISTRY_KEYS.uiArtHealth` from `artHealth(UI_ART…)` via `withCauses('Ui', UI_ART, …)`; `artHealthLines` (`src/core/artHealth.ts`) shows the `ui` table in "Obrazki"; the boot loader's `tables().ui` names a failed file's table; `pictureCutCount` counts `ui` cuts | confirmed: a new row is counted automatically. `tests/e2e/health-lines.spec.ts` reads `UI_ART.length` as the total, so it follows the table. "Logged like other UI art" = the existing `loaderror` line (`loadErrorLine`) |
| "The deploy smoke `precacheCovers` keeps covering `UI_ART`" | `scripts/check-deploy.ts` `precacheCovers('screen pictures', precache, UI_ART.map((a) => a.url))` (only with a SHA) | confirmed, covered automatically |
| "Display size about 180–240 px in the 1920 × 1080 scene"; WebP "about 384–512 px … sharp on retina tablets" | the game canvas is a 1920 × 1080 backing store scaled by CSS (`Scale.FIT`, no `resolution`/zoom in `src/main.ts`); the existing art rule (`make-task-art.mjs`): "Output sizes are at most twice the displayed size" | sharpness is capped by the canvas's own scene pixels (~1.07 device px per scene px on a 2048-wide iPad), so 2× the display size buys downscale quality, not retina detail; 384–512 is consistent with the 2× rule. **Ambiguity:** "180–240 px" may mean the 1024 canvas scaled (silhouette then ~120–165 px tall) or the silhouette itself (canvas ~265–350 px). Research decides and states which |
| "Research picks the corner from `notebookGeometry.ts` and `layout.ts`" | `TASK_LAYOUT.notebook` left 180, top 204, 1560 × 788 (face 196–1724 × 220–976); `notebookGeometry` gives stitches (x ~236–262), margin line (x 288), ribbon top right (x ~1600–1648, y 188–262); `CONTENT_LEFT` 314 | **no inner corner is free in every mode at 180–240 px:** bottom left = stitches/margin strip (~118 px wide) and the drag wallet (`coinDrag.wallet` x 314–1108, y 380–905) / tall picture columns down to y 960; bottom right = keypad (x 1120–1636 to ~y 934) in keypad/digits modes, the tiles bar span x 355–1625 to y 960, drag tray/OK/solution x 1240–1680 to y 820; top right = prompt (maxWidth 1292 centred → x 314–1606 at y 290) and the ribbon; top left = prompt and margin. Candidates outside the inner face: the **right margin** x 1740–1920 (free from y 204 to the gear bubble `HUD_LAYOUT.settingsHint`, bottom 936, gear 1782–1878 × 952–1048) and the **left margin** x 0–180 above `TASK_LAYOUT.ageBack` (16–164 × 880–976) and the build-id caption (`PLACEHOLDER_FRAME.margin`, bottom left). A fox straddling the frame at a corner is "in the corner of the notebook" without touching the content. Research measures each mode (tiles, keypad, select, drag × 3 kinds, digits, tall, hint line, solution phase) and picks |
| "never covers … the progress beads or the HUD" | beads `TASK_LAYOUT.dots` (centre 960, y 96); HUD in `UIScene` (a scene above `TaskScene`): `roomSwitch` 104–420, speaker 1494–1598, star counter 1622–1818 (y 44–148), gear bottom right, hint bubble over the right margin | the HUD scene draws above TaskScene, so a fox under the gear bubble would be covered by the HUD, not cover it; the geometry test should still keep the fox clear of the HUD rects and the bubble (research) |
| "it may also cheer on the round summary"; "what does the summary layer look like" | `SummaryPanel` (layer of `TaskScene`, `SUMMARY_LAYOUT`): title y 290, star row left 656 y 420 (98 px), "+N" y 578 (114 px star), bonus y 722, page buttons 454–1390 × 816–944; star burst from "+N" (gap 163, `starBurst.ts`). Unlock card (`UNLOCK_LAYOUT.card` 388–1532 × 284–944) and `MinigameDoneCard` replace it on their screens | bottom right of the summary (x 1390–1724, y ~700–976) is free inside the notebook; the margins are free too. Whether the fox shows on the unlock card, minigame boards (word letters, dice board), the daily puzzle and the warm-up is not in scope.md → research/plan decide (see Autonomous decisions D-4) |
| "Poses: idle by default; cheer after a correct answer (back to idle at the next task); think after a miss (until the next correct answer or the next task)" | the round state machine (`src/core/round.ts`) has `phase` `first` → (correct) `done`, (miss) `second` → (correct) `done`, (miss) `solution` → `retype` → `done`; `next` returns to `first` with `index + 1` | the pose can be a **pure function of the round phase** (`first` → idle, `second`/`solution`/`retype` → think, `done` → cheer) in `src/core/`, no new state; the summary is `done` of the last task. Minigame/dice/puzzle variants run in the same scene with their own flow — research maps them |
| "Under `prefersReducedMotion()` the pose swaps with no animation" | `src/ui/motion.ts` `prefersReducedMotion(win)` reads `matchMedia` at the moment an animation would start; every notebook-polish motion uses it (`TaskScene.bounce`, `wobble`, `flyStar`) and tokens in `ANIMATION` (`src/data/layout.ts`) | confirmed; new tokens (pose-change ms ≤ 300, optional breathing) belong in `ANIMATION` |
| "Decorative only: never takes input" | Phaser objects take no input unless `setInteractive`; `TaskScene` gestures (drag, `pointerupoutside` → cancel) are scene-level listeners filtered by the reducers' own hit tests | a non-interactive `Image` cannot steal a tap; the risk is a scene-level `pointerdown` handler reading `currentlyOver` — research checks the drag/clock paths. The e2e hook (`src/testing/e2eHook.ts`) has no fox field yet; adding a read-only `guide` pose is a research/plan call |
| "No new save field; save stays v4" | `SAVE_VERSION` 4, `MIGRATIONS` chain to v4 (`src/core/save.ts`) | confirmed, no migration (see Notes) |

## Design kit views and spec sections this change binds (profile § 6)

Source of truth: `Martynka-urzadza.md` (plan), `designs/martynka-maths-A-v1/` (`screenshots/task-keypad.png`,
`task-tiles.png`, `summary.png`, `style-guide.md`, `screen.css`), and for the art itself the delivered pack
`designs/martynka-fox-guide-v1` (README: canvas, anchor, poses). The kit is read-only.

- **task-keypad.png / task-tiles.png** and their states (correct, second-try, hint): the fox must sit beside these
  views without moving or covering any element of them.
- **summary.png**: the optional cheer on the summary must not cover the star row, "+N", the bonus line or the page
  buttons.
- **The kit has no view of the guide** (no position, size, motion or depth for a mascot in any screenshot or in
  `screen.css`) → **DESIGN-GAP** rows in `docs/design-gaps.md` (next free numbers after 164) for: placement and size,
  pose-change motion (and breathing, if any), presence on the summary/unlock/minigame/puzzle screens, the "missing art →
  no fox" fallback. Never invented beyond scope.md; each row cites scope.md as the maintainer's decision.

## Open follow-ups triggered by this slice

`grep -i -E "Trigger.*(fox|lisek|mascot|maskot|FR-037|przewodnik|guide)" context/archive/*/follow-ups/review-fixes.md`
returns **nothing**: no follow-up names the guide. Follow-ups whose trigger is a code touch this slice is *likely* to
make (take = only if the plan really touches that symbol; otherwise left open):

- `context/archive/2026-10-17-health-lines-and-smoke/follow-ups/review-fixes.md` § 18 — `UI_MISSING_URL` not a build
  marker; Trigger includes "the `ui` queuer in `BootScene.preload`". Take: the fox needs **no** edit of the `ui` queuer
  (it iterates `UI_ART`); if the plan does edit it, add `missing-on-purpose` to `vite/e2eHookGuard.mjs` in the same phase.
- `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` F3 — `BootScene` never removes its loader
  `progress` listener; Trigger "the next change to `BootScene`". Take: out of scope unless BootScene is edited; a
  one-line fix if it is.
- `context/archive/2026-10-16-stale-tab-and-health/follow-ups/review-fixes.md` (G-2, G-3, B-4, B-5 — the `loaderror`
  listener labels every image "Task art failed to load") — Trigger "the next change to `BootScene.preload` or to
  `artHealth`". Take: out of scope unless those are edited (the fox should not need it).
- `context/archive/2026-10-16-child-flow-guards/follow-ups/review-fixes.md` — `modeWidgets` not yet the only mode switch
  in `TaskScene.render`; Trigger "the next change to `TaskScene.render`, or a new answer mode". Take: if the fox is
  updated from `TaskScene.render`, keep it mode-agnostic (it reads the phase, not the mode) and leave the follow-up open;
  record that in the impl review.
- TaskScene round-lifecycle/narrator triggers (audit M-1, M-2, M-13, H-3, H-4 in several archives;
  `2026-10-21-post-run-polish` item at "next change to `TaskScene` round lifecycle") — Take: the fox reads state and does
  not change `beginRound`/`finishRound`/narrator; out of scope, stay open.

## Autonomous decisions

- **D-1 — scope.md items 1–8 and "Out of scope"**: pre-agreed by the maintainer 2026-10-23 (one fresh change
  `fox-guide`; corner of the task notebook, optional cheer on the summary, geometry test over every answer mode and the
  solution phase, 180–240 px; idle/cheer/think rules, never disappointed, no text/speech; pose change ≤ 300 ms, none
  under reduced motion; decorative, no input, save v4; WebP through `npm run art` + `UI_ART`, BootScene, precache, UI
  health line, missing → no fox with `label: ''`; DESIGN-GAP rows and follow-ups; no logic/balance/content change;
  stop at an open PR). Nothing to reverse without the maintainer.
- **D-2 — next step `/10x-research` (not the skill's default `/10x-plan`)**: chosen because the corner choice needs a
  per-mode measurement of the layout (no inner corner is free in every mode, table above) and the variant screens need
  mapping; also fixed by the step prompt. Would change: none (prompt-fixed).
- **D-3 — the fox may sit astride the notebook frame or in the margin, not only on the inner face**: chosen as a
  candidate for research because no inner corner is free in every mode at the scope's size; rejected: shrinking the fox
  below ~180 px or moving content to make room (scope item 8 forbids layout/content changes beyond the fox; a smaller
  fox breaks item 2). Would change: research finding an inner corner free in every mode and phase at ≥ 180 px.
- **D-4 — screens beyond the task and summary (unlock card, minigame boards, daily puzzle, warm-up)**: left to
  research/plan with a default of "task screen (all rounds incl. warm-up and puzzle) + summary; not on the unlock card
  or the minigame done card", since scope.md names only the task screen and the summary and FR-037 says "zeszyt z
  zadaniami". Rejected: deciding now without the variant flow mapped. Would change: research showing a variant screen
  where the corner is occupied or the pose rules do not map.
- **D-5 — pose as a pure function of the round phase in `src/core/`** (recorded as the working hypothesis for
  research, not a plan): matches the CLAUDE.md rule "logic in `core/` with tests first", needs no stored field.
  Rejected: a pose state kept in the scene. Would change: research finding a flow (e.g. dice minigame) whose
  outcomes are not in the round phase.
- **D-6 — no migration**: `SAVE_VERSION` stays 4 (scope item 5, confirmed in the repo). Would change: nothing in scope.
