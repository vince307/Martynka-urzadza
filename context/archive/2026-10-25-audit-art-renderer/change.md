---
change_id: audit-art-renderer
title: Board recolour refuses a wrong image, Canvas renderer named in "Obrazki", pouf contact shadow under the return button
status: archived
created: 2026-10-25
updated: 2026-10-25
archived_at: 2026-10-25T18:24:40Z
---

## Notes

Non-roadmap fix change of run 2026-10-25-audit-art-renderer (no roadmap row, no roadmap edit). Source: the maintainer's
"jedziemy" (2026-10-25) on the fix PR offered for the closing observability audit of run 2026-10-24-salon-style: the audit
report on branch docs/observability-audit-2026-10-24-salon-style (PR #107, report of 2026-10-25 11:57, file
2026-10-25_1157-salon-przed-remontem-cienie-konwersja-grafik.md under the observability audits folder). The report is not
on main; it is cited in prose only. Findings: M-1 (MEDIUM) and L-1 (LOW); plus the visual-gate observation of that run that
the pouf contact shadow sits behind the "Wróć do notesu" button. In this change M-1 and L-1 always mean the PR #107
findings (older audits reuse the ids).

Pre-agreed scope (context/runs/2026-10-25-audit-art-renderer/scope.md, items 1-6):

1. One fresh change `audit-art-renderer`.
2. M-1: `scripts/recolour-board.py` (`recolour`, `board_mask`) never writes a wrong image with exit 0: exit != 0 with the
   file name when the board mask covers an implausible share of the image (bounds from the two real backgrounds' measured
   shares, with margin) or the result has non-finite values; the mask share printed on stdout (lands in the `npm run art`
   log). Output byte-identical for the real art (`npm run art` re-run, `git status --porcelain public/` empty). A test
   proves both refusals on synthetic images; pins Pillow 12.1.0 + numpy 2.4.3 kept; CI (no `designs/`, no pinned Python)
   stays green: a Python-needing test skips with a stated reason where python or the pins are absent, never fails CI,
   never silently passes where they are present.
3. L-1: when the worn grade cannot be applied (no filters, Canvas) record it once per scene through `recordFallback` /
   `REGISTRY_KEYS.artFallbacks` with a new `FallbackWhere` value in `FALLBACK_ORDER`, for every caller that applies the
   grade (room, stage ghosts, miniature, backdrop; `drawRoomMiniature` stops ignoring the result); one `console.info` line
   with the renderer type at start; one short true Polish sentence in "Obrazki" (text only in `src/data/pl.ts`, no
   stand-in claim). Proof: e2e (forced Canvas through an existing seam or a new value inside an existing marker of
   `vite/e2eHookGuard.mjs`, absent from `dist/`) or a unit test of the wiring — research decides.
4. Pouf contact shadow behind "Wróć do notesu": research shows what is hidden and picks the smallest fix keeping slot
   geometry, hit areas and button positions; or a DESIGN-GAP row if the pack's layout puts the pouf under the button. No
   slot/button move without a [human] row.
5. No game logic, balance, costs, slots, variants or save change (save stays v4). Boot budget test stays green.
   Follow-ups with triggers; DESIGN-GAP rows only where the kit is silent on something visible.
6. Fold in nothing else (FU-SS F2 pixel guard, N-7, N-8 stay where they are).

Out of scope: the author's new worn art (pack `martynka-salon-worn-v1`) and any code that would swap the grade for it;
merging PR #107.

## Scope claims re-verified against the repo (branch `feat/audit-art-renderer` at `c123331`)

| claim (scope.md / audit PR #107) | repo now | correction |
|---|---|---|
| M-1: `recolour` returns an all-black image with exit 0 when `board_mask` is empty | `scripts/recolour-board.py` `recolour`: `mean_lum = a[filled].mean()` (NaN on an empty mask), `tgt` NaN, `np.clip(out, 0, 255).astype(np.uint8)` with no `isfinite` check, `main` saves unconditionally; `check_versions`, the argv and colour checks exist; no mask-share check, no stdout print | none (the audit's local probe is not re-run here; research re-runs it on a synthetic image) |
| A mask leaking into the room recolours the room silently | `board_mask` floods from the frame edges over hue 95-165 / s > 0.30; no upper bound on `filled.sum()` | none |
| `npm run art` stops on a non-zero exit of the Python step | `scripts/make-task-art.mjs`: `execFileSync('python3', [.../recolour-board.py, source, tmpPng, BOARD_COLOUR], { stdio: ['ignore','inherit','inherit'] })` in `try`, `console.error('recolour-board failed for …')` + exit; stdout is inherited, so a printed share lands in the log | none |
| Byte-identical rebuild is possible locally | `designs/` present locally (salon-v2 pack among the kits); `python3 -I` sees Pillow 12.1.0 / numpy 2.4.3 (checked now) | none; research proves it by re-running `npm run art` and `git status --porcelain public/` |
| CI has no Python pins | `.github/workflows/ci.yml` has no `setup-python` / pip step; no test in `tests/` runs Python today (`fontZero.test.ts` reads bytes in TS) | none; the skip rule (scope item 2) must be designed fresh — no precedent test to copy |
| L-1: `applyWornGrade` returns false under Canvas | `src/ui/wornGrade.ts` `addGrade`: `image.enableFilters().filters?.internal.addColorMatrix()`, false when absent | none |
| Callers that apply the grade: room, stage ghosts, miniature, backdrop | `RoomView.ts` `buildWorn` (used by `RoomView.drawWorn` and `RoomScene.fadeStage` ghosts) and `drawRoomMiniature` (used by `RoomDoneCard` and `SalonBackdrop.render`) — the only two call sites of `applyWornGrade` | the backdrop has no call of its own: it goes through `drawRoomMiniature`, so fixing `drawRoomMiniature` covers both the done-card miniature and the backdrop (each needs its scene to record) |
| `drawRoomMiniature` ignores the result | `drawRoomMiniature`: `if (piece.worn) applyWornGrade(...)`, result dropped; returns `GameObjects.Image[]` | none; `SalonBackdrop.render` derives `gradedCount` from `filters?.internal.list.length` instead (hook only) |
| Nothing records the renderer outside the e2e hook | `src/main.ts` `type: AUTO`; no `console.info` of the renderer in `src/`; `BackdropSnapshot.renderer` and `RoomSnapshot.worn.graded` are hook-only; `RoomView.drawWorn` lays `ROOM_LAYOUT.worn.canvasWash` without any record | none |
| Fallback channel: `recordFallback`, `REGISTRY_KEYS.artFallbacks`, `FallbackWhere`, `FALLBACK_ORDER` | `src/ui/artFallbacks.ts` `recordFallback` (idempotent via `noteFallback`); `src/core/artPick.ts` `FallbackWhere = 'wallet' \| 'notebook' \| 'miniature' \| 'loading' \| 'guide'`, `DrawnFallbackWhere` excludes `guide`; `src/core/artHealth.ts` `artHealthLines` pushes a `guide` line, then one `fallback` line listing the drawn ones as "Zamiast obrazka gra rysuje: …" (`pl.settings.artFallback`) | a worn/Canvas value must NOT join the "gra rysuje" list (untrue: the furniture is drawn, only its look differs) — it needs its own line kind like `guide` (precedent: audit-backdrop-fox D3). "once per scene": `noteFallback` keeps the first mode per key in the registry, which is game-wide, so it is once per game; research checks whether a per-scene guard is still needed for the `console.info`/call cost |
| `miniature` already exists in `FallbackWhere` | `RoomDoneCard` records `miniature` for a non-live miniature mode | the new value must be distinct from `miniature` (different meaning: drawn picture vs ungraded look) |
| e2e seam to force Canvas | markers in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`: `e2eMonth, e2eFail, e2eStars, e2eSave, e2eSkills, e2eArt, stallall, e2eDay, e2eVariant, legacy-salon`; `src/main.ts` already reads `e2eArt` for the loader config (`stall`, `stallall`); no renderer seam exists | research decides: a new `e2eArt` value (e.g. `canvas`) switching `type` in `main.ts` keeps it inside an existing marker; feasibility of Canvas in headless Chromium + the whole game under Canvas is research's question |
| Pouf contact shadow sits behind "Wróć do notesu" | data: pouf slot `x 458, y 736, 278 x 218, anchor [139, 202], visibleRect [16,16,246,186]` → visible box x 474-720, y 752-938; `contactShadows` pouf `widthFactor 0.95, offset [8,-6]`, `heightRatio 0.32` → ellipse centre (605, 932), 234 x 75 → x 488-722, y 895-969; `ROOM_LAYOUT.resume` `left 240, top 892, 480 x 116` → x 240-720, y 892-1008; depths: contact graphics `depth.shadows` 2, controls 110 | by the data the button covers almost the whole ellipse AND the bottom ~46 px of the pouf's visible box (y 892-938) — the pouf itself is partly under the button by the pack's layout. Research confirms on a frame (visibleRect is a bounding box, not the painted outline) and picks: shadow tweak vs DESIGN-GAP row |
| No save change; save stays v4 | `src/core/save.ts` `SAVE_VERSION = 4` | none — no migration expected (profile § 4: no database) |
| Boot budget test exists | `tests/bootBudget.test.ts` present | none; no asset size change is expected (byte-identical art) |

## Design sources this slice binds (profile § 6)

- Kit: `Martynka-urzadza.md` and `designs/martynka-maths-A-v1/style-guide.md` have no worn look, no Canvas variant, no
  "Obrazki" wording for a renderer, and no contact shadows — already DESIGN-GAP rows 169 (worn grade, Canvas wash), 170
  (board recolour), 171 (contact shadows), 172 (missing worn texture) in `docs/design-gaps.md`. The parent sentence for
  the Canvas look is a new DESIGN-GAP (row amended or added by the plan; wording never claimed to come from the kit).
- Room-return view: kit `.return-note` button (`pl.room.resume` "Wróć do notesu", `ROOM_LAYOUT.resume`, gap rows 12 and
  31) — its position is not moved by this slice.
- Copy keys this slice binds: `pl.settings` (new key for the renderer sentence beside `guideMissing`,
  `artFallback`, `artFallbackNames`), `pl.room.resume` (read only). Colours: none new; any shadow tweak uses
  `ROOM_LAYOUT.contactShadow` / `SALON.contactShadows` data.
- Migration: none expected. Save format stays v4 (`SAVE_VERSION` 4); the fallback record is runtime only, outside
  `SAVE_KEYS`.

## Triggered follow-ups (from `context/archive/*/follow-ups/review-fixes.md`)

| follow-up | trigger fires on | take |
|---|---|---|
| salon-style 3 (Canvas renderer before state) | a report of a Canvas-renderer device | not fired (no report); L-1 creates the signal it lacks; reference it, the look itself stays a wash |
| salon-style F2 / impl-review F2 (no automated check of the worn LOOK, pixel guard) | next change to `applyWornGrade`, `gradeMatrix` or `RoomView` `drawContactShadows` | fires if the plan touches `applyWornGrade` or `drawContactShadows`; NOT folded (scope item 6: "FU-SS F2 pixel guard stays where it is"); re-record open |
| salon-style F4 (`ghostTweens` until sleep) | next change to `fadeStage` | fires if `fadeStage` records the fallback; not folded (bounded, unrelated); re-record open |
| final-art-salon F2 (miniature stand-ins on one Graphics) and salon-extra-slots F2 (miniature does not clip curtains) | next change to `drawRoomMiniature` | fire (L-1 edits `drawRoomMiniature`); not folded (no relation to the grade result); re-record open |
| final-art-salon F1 (`fadeStage` ghosts on sleep) | — | already closed by salon-style; nothing to do |
| salon-extra-slots L-R8 / L-R11 (`stepPanel` refusals, `celebrate`) | next change to `RoomScene` | fire if `RoomScene` is edited; not folded; re-record open |
| save-observability L-R9 / salon-load-health M-5 | next change to `stars.ts` or the purchase flow | not fired (no purchase or star code) |
| audit-backdrop-fox F1 (`pixel()` null under Canvas) | a Canvas report or an e2e project that runs on Canvas | fires if research picks a Canvas e2e; then record it as still open (no pixel proof under Canvas) or note the Canvas run only checks the record, not pixels |
| audit-backdrop-fox F6 / notebook-polish 16 (`isSalonPixel`, `holder.destroy(true)`) | next change to `SalonBackdrop` / `SalonBackdrop.render` | fire only if `SalonBackdrop.render` is edited (likely: the backdrop must record the fallback through its scene); not folded; re-record open |
| final-art-salon F4 and salon-load-health L-6 / L-8 (art-health view: section hidden while task art unknown; `data-state`; unit test of `createArtHealthView`) | next change to the "Obrazki" section / `artHealthView.ts` | fire (L-1 adds a line kind to `artHealthView.ts` `textOf`); L-8's unit test of the view is cheap and in the area — plan may add the view test for the new line only; F4 and L-6 not folded; re-record open |
| audit-boot-hidden-tab G-3 (fallback record per room miniature) | next change to `src/ui/artFallbacks.ts` or the room miniature | fires; not folded (a different record: which miniature mode), re-record open — unless the plan's per-scene record makes it trivial, then the plan decides and records |
| health-lines-and-smoke 20 ("gra rysuje: zeszyt" vs icon) | change to `artFallback` / `recordFallback` in `UnlockCard` | not fired unless `pl.settings.artFallback` is edited (it should not be) |
| fox-guide F6 | — | closed by audit-backdrop-fox |
| audit-backdrop-fox F5 (generic `artHealth.ts` triggers: load-and-tab-guard A-5, A-11; save-reason-and-recovery ASL-*; stale-tab-and-health G-2, G-3, B-4, B-5) | change to `artHealth.ts` / `artHealthView.ts` | fire; not folded (scope item 6); re-record open as a group |
| salon-load-health M-6 second half, texture atlas, GPU memory note | next change to the room art set | not fired: the art must stay byte-identical |
| final-art-salon VO2 / F5 / F7 (one stand-in drawer) | next change to `RoomView.render`, or a second room | fires only if `RoomView.render` is edited (`drawWorn` / `drawContactShadows` are its helpers — plan decides); not folded |

## Autonomous decisions

Pre-agreed by the maintainer 2026-10-25 (context/runs/2026-10-25-audit-art-renderer/scope.md):

- **S1** One fresh change `audit-art-renderer` on `feat/audit-art-renderer`, stopping at an open PR (merge on "zmerguj").
- **S2** M-1: refuse (exit != 0, file name) on an implausible mask share or non-finite output; print the share; byte-identical
  output for the real art; a synthetic-image test of both refusals that skips cleanly with a stated reason without
  python/pins and never silently passes where they are present; pins unchanged.
- **S3** L-1: a new `FallbackWhere` value recorded through `recordFallback` once per scene by every grade caller (room,
  ghosts, miniature, backdrop; `drawRoomMiniature` uses the result), one start-up `console.info` with the renderer type, one
  true Polish sentence in "Obrazki" (only in `src/data/pl.ts`, no stand-in claim); proof by e2e (seam inside an existing
  marker) or a unit test of the wiring.
- **S4** Pouf shadow: smallest fix keeping slot geometry, hit areas and button positions, or a DESIGN-GAP row; no slot or
  button move without a [human] row.
- **S5** No game logic, balance, costs, slots, variants or save change; save v4; boot budget test green.
- **S6** Fold in nothing else (FU-SS F2 pixel guard, N-7, N-8 stay open). Out of scope: the author's worn art, merging PR #107.

Decided in this step (the skill would have stopped to ask):

- **N1 Next command**: `/10x-research audit-art-renderer` (the step prompt fixes it), not the skill's default `/10x-plan`:
  three open questions need measurement first (the real backgrounds' mask shares, Canvas feasibility in headless Chromium,
  what the pouf frame actually shows). Would change: nothing — fixed by the run.
- **N2 Separate parent line kind for the Canvas look**, not a member of the "Zamiast obrazka gra rysuje" list. Rejected:
  adding the new value to `DrawnFallbackWhere` (the sentence would claim a drawing replaces a picture — untrue, the
  furniture is shown, only without the worn look). Why: same reasoning as audit-backdrop-fox D3 for the fox. Would change:
  research or the maintainer preferring one combined sentence.
- **N3 The backdrop counts as a grade caller through `drawRoomMiniature`**: one fix in `drawRoomMiniature` (return or report
  the grade result) serves both the done card and the backdrop; each caller records in its own scene. Rejected: a second
  `applyWornGrade` call path in `SalonBackdrop`. Would change: research finding the backdrop must record from a scene that
  does not own the miniature call.
- **N4 Pouf**: the claim table shows the button covers part of the pouf itself by the pack's layout; the expected outcome is
  a DESIGN-GAP row (plus at most a shadow-only tweak that changes no geometry). Not decided here — research confirms on a
  frame. Would change: a frame showing the painted pouf clear of the button.
- **N5 Triggered follow-ups**: none folded beyond what scope requires; the plan re-records every fired one as open in
  `follow-ups/review-fixes.md` (archive-convention "re-recorded open"). The salon-load-health L-8 view test is allowed only
  for the new line. Would change: research showing one is required for L-1 to be correct.
