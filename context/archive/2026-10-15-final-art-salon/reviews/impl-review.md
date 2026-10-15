<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: S-16a `final-art-salon`

- **Plan**: context/changes/final-art-salon/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Date**: 2026-10-15
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Evidence observed in this review

- Local gate on `1dc079b`: lint OK, typecheck OK, `npm test` 2939 passed (baseline 2839 on main `334ff69`, +100: new suites `salonRemap`, `roomArt`, `roomMiniature`, `thumbFit`, `fitLabel` and the rewritten room/data tests), deploy and ops tests OK, `sample` E1-E6 exit 0, build OK with `e2e hook: absent (2 chunks checked)`.
- Full E2E `npx playwright test --config=<abs> --workers=4` launched Chromium in this session: **98 passed (7.1 min)**. Baseline 93 + 5 = 98: `room-purchase.spec.ts` 1 → 2 tests (phase 3), `salon-art.spec.ts` 0 → 4 (phase 10); `room-change` 2 → 2, `save-restart` 7 → 7.
- Deliberate break re-executed (phase 2, tdd): `remapLegacySalon` loop changed to round down (`cost + next <= spent`) → `tests/salonRemap.test.ts` 8 failed (`covers the spent stars...` for old 2-7, `old 2 becomes stage + sofa`, `old 4 becomes ...`); restored with `git checkout`, 62 passed. Same 8 as the phase 2 handoff's RED/break record. RED evidence of phases 1-3 in the handoff history names real assertions (`expected { ok: false, reason: 'bad-variant' } to match ...`, `expected [ 'floor' ] to deeply equal []`, `expected 'coffee-table' to be 'rug'`).
- Live-save remap verified on data (throwaway script, not committed): for every old `tasksDone` 0-10 with 6 realistic `chosen` variant patterns (66 cases) plus a second room: stars unchanged; other room the same object; new prefix value ≥ old spent or the room complete; every old piece whose slot still exists (sofa, rug, table→coffee-table, shelf→cabinet, picture→wall-frames) keeps its variant; every slot task of the new prefix has a `chosen` entry; no stale old keys; second call returns the same object (`remappedFrom` null); `tasksDone` 0 untouched; a new-layout save untouched; `encodeSave`/`decodeSave` round-trips; `saveSummary` never shows more done than total. Mapping 0→0, 1→1, 2→2, 3→3, 4→4, 5→5, 6→6, 7→6 (equal value), 8→7, 9→7, 10→7. 0 failures.
- Load and preview paths: `src/main.ts` `start` calls `remapLegacySalon` after `repairCurrentRoom`, before `createGame`; `UIScene.openImport` `summarize` remaps before `saveSummary`; `saver.replace` writes the raw import, which the next load remaps; export reads the registry (already remapped). `validRoom` (`src/core/save.ts`) accepts old `tasksDone` 8-10 (no upper bound), so old saves reach the remap. Save format stays v2.
- `git diff --exit-code main..HEAD -- tests/fixtures/` clean (byte-identical).
- Precache: `dist/sw.js` lists all 26 `assets/rooms/salon/*.webp`; the 26 files total 1 233 242 B; `dist/` 3.8 MB; `dist/_app/` has the entry, Phaser and CSS only (no lazy chunk).
- Nothing changed under `designs/`, `.gitignore`, `.claude/`, `deploy/`. `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (10-12 Oct) predate the branch: no hook bypass found.
- Teacher read of new strings (`src/data/pl.ts`, `src/data/rooms.ts`, `src/data/minigames.ts`): "Odnów ściany i podłogę", "Postaw sofę / komodę" (accusative), "Połóż dywan", "Postaw stolik / fotel", "Powieś obrazki" correct; variant names agree with their noun (sofa: Morska/Słoneczna/Listkowa, stolik: Dębowy/Kremowy/Turkusowy, komoda: Dębowa/Miętowa/Kremowa, fotel: Kremowy/Miętowy/Słoneczny); `roomArtMissing` agreement 1 nie wczytał się / 2 nie wczytały się / 5 nie wczytało się like `artMissing`. `MINIGAME_WORDS` SOFA, DYWAN, STOLIK, KOMODA, FOTEL, OBRAZKI are all captions; OBRAZKI (7 letters) is covered by `tests/wordRound.test.ts` (row fits the canvas, a round builds on E1-E6).
- Phase 6 thumbnail crop (`VariantPanel.show`, `setCrop` + `setPosition` with `thumbFit`): checked against Phaser 4.2.1 source (`Frame.setCropUVs` in unscaled frame pixels, `TransformerImage.run` offsets by `crop.x` before `applyITRS` scale). Rug 1111×640, visibleRect [16,16,1079,608], thumb 200 / inset 20: visible part lands at left+20 … left+180, centred. Correct while texture size = manifest size, which `tests/roomArt.test.ts` enforces from the WebP headers. Look is still for the visual gate (6.4).
- Seams: phase 3 geometry (`slotBox`, `visibleRect`) is what phase 5 `RoomLayer.show` (origin = anchor / size, position = x + anchor) and the hit-test use; `alphaAt` passes picture-local coordinates as the `AlphaAt` contract says; depth band 0-99 for the room, controls 110, outline 100, panel 120-123, particles 130, card 140+; `PageButton.setDepth` now also lifts its zone (unplanned, needed for the band).

## Findings

### F1 — Stage cross-fade resumes after the room wakes

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/RoomScene.ts `fadeStage` / `onSleep` in `create`
- **Detail**: The ghost images of the neglected room fade over `ANIMATION.stageFadeMs`. If the child leaves the room within that time (the room scene sleeps), the tween pauses; on `wake`, `refresh` redraws and the remaining fade plays over the renovated room. The end state is correct; only a short, partly faded neglected room is seen again. Same pattern for an interrupted pop.
- **Fix**: Track the ghosts (and the pop tween) and complete or destroy them in `onSleep`.
- **Decision**: DEFERRED — follow-up `follow-ups/review-fixes.md` (cosmetic, end state correct; a scene change here would need another E2E gate). Trigger: the visual gate (7.4) shows it, or the next change to `RoomScene.fadeStage`.

### F2 — Room miniature mixes stand-ins and pictures out of z order

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/RoomView.ts `drawRoomMiniature`
- **Detail**: Stand-ins for missing textures are drawn on the card's one `Graphics` at the card depth, loaded pictures as images above it. With some room art missing, a stand-in for a high-`z` slot (sofa) sits under a lower-`z` picture (rug) on the "Pokój gotowy!" miniature. Only when art is partly missing (the parent panel already says so); nothing throws.
- **Fix**: Draw each stand-in on its own `Graphics` at `depth + index / 1000`, in the same order as the pictures.
- **Decision**: DEFERRED — follow-up with trigger.

### F3 — `progress` listener of the loader is never removed

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/BootScene.ts `preload` / `create`
- **Detail**: Harmless today (the screen reference is null after `create`, the handler is guarded); the `LoadingScreen` constructor itself is not inside the guard.
- **Fix**: `this.load.off('progress', …)` in `create`.
- **Decision**: RECORDED — follow-up.

### F4 — Salon art line hidden while task art health is unknown

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/settingsPanel.ts / src/ui/dom/artHealthView.ts `createArtHealthView`
- **Detail**: The room line shows only when the task art health is known. Both are written by `BootScene.create` together, so the case does not occur in practice.
- **Fix**: Show the section when either is known.
- **Decision**: RECORDED — follow-up.

### F5 — Duplicated geometry and stand-in helpers

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/RoomView.ts `layerBox`, `rectOf`, `drawStandIn`; src/ui/widgets/RoomLayer.ts `show`; src/data/roomArt.ts `ROOM_ART.label`
- **Detail**: `layerBox` repeats `slotBox`; a `{left, top, width, height}` shape lives beside `Box` (F4 of S-10 closed only for the hit-test); `RoomLayer.show` re-implements the stand-in fill; stand-in captions come from `pl.room` in `RoomView.render` while `ROOM_ART.label` is read only by tests.
- **Fix**: Fold into one `Box` helper and one stand-in drawer at the next room change.
- **Decision**: RECORDED — follow-up.

### F6 — Stale comments from the placeholder salon

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/RoomScene.ts class doc, src/data/layout.ts `ROOM_LAYOUT` doc, src/ui/widgets/RoomView.ts `objectOf`, src/ui/widgets/RoomLayer.ts `object`
- **Detail**: "the salon drawn in code", "over `area`", "of the next phase".
- **Fix**: Reword.
- **Decision**: FIXED — 898517d (comments only; lint, typecheck, unit 2939, build re-run green).

### F7 — Raw style numbers in room widgets

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/VariantPanel.ts (tray radius/stroke/alpha), src/ui/widgets/RoomTaskButton.ts (label fractions), src/scenes/RoomScene.ts `celebrate` (particle speeds, star sizes)
- **Detail**: Visual constants written inline rather than in `src/data/layout.ts`; no balance numbers and no Polish literals in scenes or widgets. Several pre-date the slice.
- **Fix**: Move to `ROOM_LAYOUT` / `ANIMATION` at the next room change.
- **Decision**: RECORDED — follow-up.

MERGE: CLEAR — no open CRITICAL; every automated criterion met (lint, typecheck, unit 2939 = 2839 + 100, sample E1-E6, build with hook absent, E2E 98 = 93 + 5 observed here); the live-save remap verified on all old states with fixtures byte-identical; warnings deferred with triggers; manual rows are [visual] (orchestrator gate) and [human] 2.5, 10.4.
