---
date: 2026-10-24T19:19:07+0200
researcher: Claude (autonomous run 2026-10-24-audit-backdrop-fox, research step)
git_commit: 80432e8
branch: feat/audit-backdrop-fox
repository: Martynka-urzadza
topic: "Salon backdrop after a WebGL context loss (B-1, B-2), font line in the art inventory (C-1), missing fox named and stable (G-1, G-2)"
tags: [research, SalonBackdrop, TaskScene, WelcomeScene, GuideFox, artHealth, phaser-webgl-restore, e2e]
status: complete
last_updated: 2026-10-24
last_updated_by: Claude (autonomous run 2026-10-24-audit-backdrop-fox)
---

# Research: audit-backdrop-fox

**Date**: 2026-10-24T19:19:07+0200
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: 80432e8
**Branch**: feat/audit-backdrop-fox
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (scope items 1-8, pre-agreed by the maintainer 2026-10-24) and its open unknowns: how does Phaser 4.2.1 behave on
a WebGL context loss and restore (events, what survives, is a full backdrop re-render safe in the handler, does
`holder.destroy(true)` free the filter camera), how can the e2e build force lose + restore and read a backdrop pixel
deterministically, what a redraw while `TaskScene` sleeps needs, and how the missing fox is recorded, named for the parent and
kept stable (no blinking) with the smallest change. Sources: the audit report on branch
docs/observability-audit-2026-10-22-notebook-polish (PR #101, findings B-1, B-2, C-1) and the audit report on branch
docs/observability-audit-2026-10-23-fox-guide (PR #104, findings G-1, G-2).

## Summary

- **B-1 is real and the fix is small.** In Phaser 4.2.1 a `DynamicTexture` is blank (transparent) after a context restore; file and
  canvas textures are re-uploaded from their kept pixels. The renderer emits `'restorewebgl'` on itself after every GL resource is
  recreated and `contextLost` is back to false, so a synchronous `backdrop.render(...)` inside a `game.renderer.on('restorewebgl')`
  handler is safe (proven in headless Chromium: remove, `addDynamicTexture`, `enableFilters` + blur, `draw` + `render` in the
  handler gave a correct pixel and no error) and runs before the next frame, so no blank frame is shown after the restore.
- **B-2:** `SalonBackdrop.render` can record what it drew: `drawn` (the `addDynamicTexture` result), `blurred` (the blur controller
  returned by `filters?.internal.addBlur`), `renderer` (`'webgl' | 'canvas'` from `renderer.type`), and a restore redraw count.
  `DynamicTexture.snapshotPixel` is synchronous under WebGL and reads the texture's own framebuffer (no wash, no notebook), so a hook
  getter can return one pixel of the backdrop texture deterministically.
- **E2E:** Phaser asks for a `'webgl'` (WebGL1) context; from the page `canvas.getContext('webgl')` returns the same context and
  `WEBGL_lose_context` exists in the Playwright 1.64 headless Chromium (SwiftShader, Phaser boots as WebGL). Lose, wait, restore,
  then poll the hook's redraw count and pixel. The pixel of the old texture read [0,0,0,0] after a restore without redraw, so the
  assertion catches the bug.
- **G-2:** a pure availability rule (all three pose keys exist) computed once in `GuideFox`'s constructor hides the fox for the whole
  scene life; `requested` joins `GuideSnapshot`. One missing pose can be produced in e2e with `page.route(... fox-think.webp, abort)`
  (precedent: health-lines spec #14 G-1 aborts `wallet-open.webp`), so no new `E2EArtSeam` value and no build-guard question.
- **G-1:** the "Obrazki" sentence for the fox must be its own line: the `fallback` line says "gra rysuje" (untrue for the fox) and
  the UI `missing` line says "napis lub rysunek" (untrue when only fox poses are missing). Proposed copy below; the UI `missing` line
  gets a flag so its second sentence appears only when a non-fox screen picture is missing.
- **C-1:** two places in `docs/art-inventory.md` (the sentence about `AtkinsonHyperlegibleNext.ttf` and the table row "Font").

## Detailed Findings

### Phaser 4.2.1: context loss and restore (B-1)

Read in `node_modules/phaser/src/renderer/webgl/WebGLRenderer.js` and checked empirically in Playwright Chromium (scratch scripts
outside the repo, sandbox disabled for Chromium as the profile requires).

- `WebGLRenderer.setContextHandlers` registers canvas listeners `webglcontextlost` / `webglcontextrestored` with
  `dispatchContextLost` / `dispatchContextRestored`.
- `dispatchContextLost`: sets `contextLost = true`, warns, `emit(Events.LOSE_WEBGL)`, and calls `event.preventDefault()` (needed
  for the browser to allow a restore).
- `dispatchContextRestored`: returns early while `gl.isContextLost()`; otherwise `setExtensions`, `glWrapper.update`,
  `glTextureUnits.init`, `createResource()` over `glTextureWrappers`, `glBufferWrappers`, `glFramebufferWrappers`,
  `glProgramWrappers`, `glVAOWrappers`, then `bindUnits`, `resize`, `contextLost = false`, and only then
  `emit(Events.RESTORE_WEBGL)`. Event strings: `'losewebgl'` (`renderer/events/LOSE_WEBGL_EVENT.js`) and `'restorewebgl'`
  (`renderer/events/RESTORE_WEBGL_EVENT.js`). The emitter is the renderer itself, so `this.game.renderer.on('restorewebgl', fn)`
  works (observed: both events fired; `contextLost` was false inside the restore handler).
- The game loop keeps stepping while lost: `Game.step` does not check the flag; `WebGLRenderer.preRender` / `render` /
  `postRender` return early on `contextLost`. Updates and tweens continue.
- Textures on restore: `WebGLTextureWrapper.createResource` re-creates the GL texture and re-uploads `this.pixels`. File images
  and canvas textures keep their source there and come back. A render target has `pixels === null` and comes back blank.
  `WebGLFramebufferWrapper.createResource` rebuilds and reattaches the framebuffer, so a `DynamicTexture` is valid but empty.
  Observed: `snapshotPixel` on a DynamicTexture read [255,0,0,255] before the loss and [0,0,0,0] after the restore. The Phaser v4
  docs (context7, "DynamicTexture and Lost Context") say the same: these textures are blank after the context is recovered.
- `Graphics.generateTexture` (`gameobjects/graphics/Graphics.js`) draws into `textures.createCanvas`, so the star-burst texture
  (`src/ui/widgets/starBurst.ts`) is canvas-backed and survives (the audit's claim confirmed in source).
- Harmless console noise on restore: Chromium logs "WebGL: INVALID_OPERATION: delete: object does not belong to this context" from
  `WebGLFramebufferWrapper.createResource` deleting the stale framebuffer. An e2e test should not fail on console errors of that text.
- Re-render in the handler: observed safe. Inside a `restorewebgl` handler the sequence `textures.remove(old)`, `make.container`,
  `enableFilters().filters.internal.addBlur(...)`, `addDynamicTexture`, `draw` + `render`, `holder.destroy(true)` produced a
  correct pixel and no error. Filter render targets come from the renderer's `DrawingContextPool`; their framebuffers are among
  `glFramebufferWrappers` and are recreated, and filters draw into them fresh on each use.
- Blank frame: while lost nothing renders (unavoidable). The restore event fires from the DOM event before the next game step, so a
  synchronous redraw in the handler means no frame shows the transparent backdrop. A deferred redraw (next frame, or at `wake`)
  would show at least one frame of wash only. Conclusion for gap rows: no visible difference after restore → no new DESIGN-GAP for
  B-1/B-2 (decision D6 in `change.md` holds).
- FU-NP 16 (`holder.destroy(true)` frees the filter camera): resolved by source. `GameObject.destroy`
  (`gameobjects/GameObject.js`) runs `if (this.filterCamera) { this.filterCamera.destroy(); ... }` and `Camera.destroy`
  (`cameras/2d/Camera.js`) destroys `filters.internal` and `filters.external`; `Container.destroy` goes through the same path. So a
  redraw per restore does not leak filter cameras. The `Keypad`, `starBurst`, `barSpan` parts of FU-NP 16 are untouched.

### The backdrop in the app (B-1, B-2)

- `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render`: `clear()` (destroys image and wash, `textures.remove(texture)`), mode
  from `backdropMode`, `captureCount += 1` before the `if (dt)` (B-2 confirmed), blur only when `renderer.type === WEBGL` through
  `holder.enableFilters().filters?.internal.addBlur(...)` (the optional chain makes a missing `filters` silent), new key
  `salon-backdrop-<serial>` per render, `dt.draw(holder)` + `dt.render()`, then an image + a wash `rectangle` of `PAGE_BACKGROUND`
  at `BACKDROP.washAlpha`. The wash is a separate game object, not in the texture, so a pixel of the DynamicTexture is the salon
  picture alone (blank texture = alpha 0).
- Owners: exactly two scenes construct `SalonBackdrop` (`grep` over `src/`): `TaskScene` (`create`, `refreshBackdrop`, `onWake`
  re-captures when `REGISTRY_KEYS.rooms` changed, shutdown destroys) and `WelcomeScene` (`create` calls `this.backdrop.render(...)`
  inline; no refresh method). No other `addDynamicTexture` / `RenderTexture` in `src/`.
- `TaskScene.create` already pairs every `game.events` listener with an `off` in its `events.once('shutdown')` block; the restore
  listener belongs on `this.game.renderer` (not `game.events`) and needs the same pairing. A sleeping `TaskScene` (room open via
  `scene.switch`) can render its backdrop on the event: adding images to a sleeping scene's display list is allowed and the work is
  one capture. Recommendation: redraw on the event in both states; `onWake`'s `backdropRooms` comparison still catches a purchase.
- Guard: the listener only matters under WebGL (`renderer.type === WEBGL`); a Canvas renderer never emits it. `this.game.renderer`
  is typed as the union in Phaser's typings; `on`/`off` exist on both (EventEmitter).
- Records (B-2): `TaskScene.snapshot` builds `backdrop: { mode, captures }` (type field in `TaskSnapshot`), `WelcomeScene.backdropState`
  returns the same shape, and `src/testing/e2eHook.ts` only forwards them (`screen: 'welcome'` branch freezes `backdropState()`). The
  JSDoc "Centres of the buttons ... for the e2e hook" sits on `backdropState` instead of `targets` (FU-NP 16 part, fix while there).
- Proposed record (runtime only, outside `SAVE_KEYS`; `SAVE_VERSION` stays 4 in `src/core/save.ts`):
  `{ mode, captures, drawn: boolean, blurred: boolean, renderer: 'webgl' | 'canvas', redraws: number, pixel: [r,g,b,a] | null }`
  - `drawn`: `dt !== null` at the last render (false in `plain` mode).
  - `blurred`: the return of `filters?.internal.addBlur(...)` is defined (`FilterList.addBlur` in `gameobjects/components/FilterList.js` returns `this.add(new Blur(...))`) (false under Canvas or with no `filters`).
  - `renderer`: from `scene.sys.game.renderer.type === WEBGL`.
  - `redraws`: renders caused by `restorewebgl` (counted by the caller through a parameter such as `render(rooms, room, 'restore')`,
    or a separate `redraw()` that bumps it); `captures` keeps counting every render.
  - `pixel`: a getter that calls `texture.snapshotPixel(cx, cy, cb)` at the texture centre. Under WebGL it is synchronous
    (`DynamicTexture.snapshotArea` → `renderer.snapshotFramebuffer` with type `'pixel'` → `WebGLSnapshot` `readPixels`, callback
    called immediately, Y flipped internally); under Canvas `snapshotArea` goes to `renderer.snapshotCanvas` (the plan checks its
    sync-ness or reports `null` there). It is read only when the hook asks (a getter), never per frame. Note: `renderer.snapshotPixel`
    is different (async, next render, reads the game canvas with wash and notebook) and is not used.
- Console line (developer English like other `console.warn` in `src/`): one `console.warn` per restore redraw, e.g.
  `Salon backdrop redrawn after a WebGL context restore (<scene key>, redraw <n>)`.

### Phaser pin (tests/phaserLoaderPin.test.ts)

The file is a tripwire by source text (two `describe` blocks: loader pin, audio decode seam pin). A third `describe` (the file name
stays, as for the decode seam) can pin: `RESTORE_WEBGL_EVENT.js` exports `'restorewebgl'`; `WebGLRenderer.js`
`dispatchContextRestored` recreates `glFramebufferWrappers` before `this.emit(Events.RESTORE_WEBGL` (order by `indexOf`);
`DynamicTexture.js` has `snapshotPixel` going through `snapshotArea`; `GameObject.js` destroys `filterCamera` in `destroy`.

### E2E: forcing lose + restore and reading the pixel

- Environment observed: `@playwright/test` 1.64.0, `playwright.config.ts` has no launch args; headless Chromium renders WebGL with
  SwiftShader ("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device ...))") and Phaser boots with `renderer.type === WEBGL` (2).
- Phaser requests `canvas.getContext('webgl')` (WebGL1; `src/main.ts` sets `type: AUTO` and no `context`). From the page,
  `document.querySelector('canvas').getContext('webgl')` returns the same object as `game.renderer.gl`; `getContext('webgl2')` on
  that canvas returns `null`, so the spec must use `'webgl'`.
- Recipe (chromium-hook project, port 4397): `page.evaluate` → `gl.getExtension('WEBGL_lose_context').loseContext()`; wait for the
  lost state (poll a hook field such as `contextLost`, or a short fixed wait); `restoreContext()`; `expect.poll` until
  `backdrop.redraws` grows; then assert `backdrop.pixel` alpha is 255 (and `drawn: true`). Before the loss the same assertions hold
  (baseline). Deliberate break for the plan: remove the listener → `redraws` stays 0 and the pixel reads [0,0,0,0].
- Both screens can be covered: welcome (before an age tap) and task. The task case may also cover the sleeping scene (room open,
  restore, back to task, pixel non-blank).

### Fox guide (G-1, G-2)

- `src/ui/widgets/GuideFox.ts` `GuideFox.show`: per call, a missing texture of the requested pose sets `pose = null` and hides the
  image (G-2 blink confirmed); `GuideFox.snapshot` has no `requested`. `GuideFox` is built once in `TaskScene.create`, and
  `TaskScene.render` calls `this.guide.show(guidePose(screen, this.state.phase))`.
- Pure rule proposal: in `src/core/guide.ts` (already holds `GUIDE_ART: Record<GuidePose, UiArtId>`), e.g.
  `guideAvailable(exists: (id: UiArtId) => boolean): boolean` = every `GUIDE_ART` value exists. `GuideFox` evaluates it once in the
  constructor with `UI_ART_KEYS` + `textures.exists`; when false, `show` keeps the fox hidden for the scene's life and records the
  fallback once. `requested` = the argument of the last `show`.
- Recording (G-1): `src/ui/artFallbacks.ts` `recordFallback(scene, where, mode)` over `noteFallback` (`src/core/artPick.ts`), keyed by
  `FallbackWhere` = `'wallet' | 'notebook' | 'miniature' | 'loading'`, `FALLBACK_ORDER` the same. Callers today: `CoinWallet`,
  `UnlockCard`, `RoomDoneCard`, `BootScene`. The hook's `artFallbacksSnapshot` already forwards the whole record, so a `guide` entry
  shows without hook code.
- Lines: `src/core/artHealth.ts` `artHealthLines` emits `{ kind: 'fallback', where: FALLBACK_ORDER filtered }`, rendered by
  `src/ui/dom/artHealthView.ts` `textOf` as `pl.settings.artFallback(...)` with `pl.settings.artFallbackNames[where]`. Adding
  `'guide'` to `FallbackWhere` would put the fox under "Zamiast obrazka gra rysuje" (untrue) and, through the indexed access
  `artFallbackNames[where]`, require a name there. Proposal: keep `'guide'` in `FallbackWhere`/`FALLBACK_ORDER` (the record and the
  hook), filter it out of the `fallback` line (type that line's `where` as the drawn screens only), and emit a new line kind
  `{ kind: 'guide' }` when `fallbacks.guide` is set. `textOf` is an exhaustive `switch` over `ArtHealthLine`, so
  `artHealthView.ts` gains one `case` (the change.md hope to leave it untouched does not hold; its generic follow-up triggers fire
  and are re-recorded, not folded).
- The UI `missing` line: `pl.settings.uiArtMissing(count, total)` ends "Na tych ekranach zamiast obrazka jest napis lub rysunek."
  That is untrue when only fox poses are missing. Proposal: the `missing` line for table `ui` carries `standIn: boolean` = some
  missing UI key is not a fox key (the caller `UIScene` passes the fox keys, e.g. `guideKeys`, from `UI_ART_KEYS`; core does not
  import data values), and `uiArtMissing(count, total, standIn)` adds the second sentence only when `standIn`. Callers to update:
  `artHealthView.ts` `textOf`, `tests/artHealthText.test.ts` (checks `startsWith` only) and `tests/e2e/health-lines.spec.ts` #14 G-1
  (wallet missing → `standIn` true, text unchanged).
- Proposed parent copy (short Polish, `src/data/pl.ts` under `pl.settings`):
  `guideMissing: 'Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka.'` The first sentence of `uiArtMissing` already
  counts the files; this sentence names the screen element and says nothing is drawn in its place. `pl.settings.artFallback` is
  not edited, so health-lines FU 20 stays unfired (decision D5).
- E2E for one missing pose: `tests/e2e/health-lines.spec.ts` #14 G-1 already aborts one UI file with `page.route` under
  `test.use({ serviceWorkers: 'block' })`. The same works for `**/assets/ui/fox-think.webp`: the loader errors, `textures.exists`
  is false for `guideThink`, and the spec can assert `guide.visible: false` with `requested: 'idle'` at the start, still hidden after
  a miss (`requested: 'think'`) and after a right answer (`requested: 'cheer'`), plus the "Obrazki" fox sentence and no "napis lub
  rysunek" sentence. No new `E2EArtSeam` value is needed (the `e2eArt` marker question in decision D4 disappears).

### C-1 (docs/art-inventory.md)

Two spots: the sentence "Font `AtkinsonHyperlegibleNext.ttf` jest identyczny we wszystkich paczkach i w `public/fonts/`." and the
table row "Font | wszystkie paczki | identyczny z `public/fonts/` | —". `public/fonts/` holds `MartynkaNext.ttf` and `OFL.txt`; the
font is built by `npm run font` (`scripts/make-font.py`) from the pack's Atkinson file, checked by `tests/fontZero.test.ts`.

### Design source (profile § 6)

- No kit view covers any visible part: the kit has no settings panel (gap 26), no line for drawn fallbacks (gap 147), no guide view
  or missing-pose rule (gaps 165, 168), and blurs a static room picture (gap 155). Shared components reused: `SalonBackdrop`,
  `GuideFox` (`src/ui/widgets/`), `createArtHealthView` (`src/ui/dom/artHealthView.ts`); no new widget.
- DESIGN-GAP row 168 amendment (proposed text for the "Decision" column): "A missing texture of any pose hides the fox for the
  whole round screen (no stand-in box, no blinking by phase); the 'Obrazki' section names it in its own sentence
  (`pl.settings.guideMissing`), and the screen-picture line speaks of a caption or drawing only when a non-fox picture is missing
  (change audit-backdrop-fox)". Files column adds `src/core/guide.ts`, `src/core/artHealth.ts`, `src/data/pl.ts`.
- No new gap for B-1/B-2: with a synchronous redraw the restored screen looks as before.

## Code References

- `node_modules/phaser/src/renderer/webgl/WebGLRenderer.js` `setContextHandlers`, `dispatchContextLost`, `dispatchContextRestored`, `snapshotFramebuffer`
- `node_modules/phaser/src/renderer/events/RESTORE_WEBGL_EVENT.js`, `LOSE_WEBGL_EVENT.js` - event strings
- `node_modules/phaser/src/renderer/webgl/wrappers/WebGLTextureWrapper.js` `createResource`; `WebGLFramebufferWrapper.js` `createResource`
- `node_modules/phaser/src/textures/DynamicTexture.js` `snapshotPixel`, `snapshotArea` (class comment: redrawing is the game's job)
- `node_modules/phaser/src/renderer/snapshot/WebGLSnapshot.js` - synchronous `readPixels` for type `'pixel'`
- `node_modules/phaser/src/gameobjects/GameObject.js` `destroy` (filterCamera); `cameras/2d/Camera.js` `destroy`
- `node_modules/phaser/src/gameobjects/graphics/Graphics.js` `generateTexture` - canvas-backed
- `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render`, `clear`, `mode`, `captures`
- `src/scenes/TaskScene.ts` `create` (shutdown block, `onWake`), `refreshBackdrop`, `snapshot`, `TaskSnapshot.backdrop`
- `src/scenes/WelcomeScene.ts` `create`, `backdropState`, `targets`
- `src/testing/e2eHook.ts` - welcome branch of `snapshot`, `artFallbacksSnapshot`, `E2EArtSeam`
- `src/ui/widgets/GuideFox.ts` `GuideFox.show`, `snapshot`, `GuideSnapshot`; `src/core/guide.ts` `GUIDE_ART`, `guidePose`
- `src/core/artPick.ts` `FallbackWhere`, `FALLBACK_ORDER`, `noteFallback`; `src/ui/artFallbacks.ts` `recordFallback`
- `src/core/artHealth.ts` `ArtHealthLine`, `ArtHealthLinesInput`, `artHealthLines`; `src/ui/dom/artHealthView.ts` `textOf`
- `src/scenes/UIScene.ts` - the `artHealthLines({...})` call when the settings panel opens
- `src/data/pl.ts` `pl.settings.uiArtMissing`, `artFallback`, `artFallbackNames`
- `tests/phaserLoaderPin.test.ts`; `tests/e2e/notebook-polish.spec.ts` (#12 welcome backdrop, #11 re-capture after purchase); `tests/e2e/fox-guide.spec.ts` (#11 no fox without its art); `tests/e2e/health-lines.spec.ts` (#14 G-1 `page.route` abort)
- `docs/art-inventory.md` (font sentence and "Font" row); `docs/design-gaps.md` row 168

## Architecture Insights

- The renderer outlives scenes: a `game.renderer` listener must be removed on scene `shutdown` like the existing `game.events` ones.
- Records describe outcomes, not intent: both findings families (B-2: record is intent; G-2: record loses the request) are fixed by
  recording both sides (`captures` + `drawn`/`pixel`; `pose` + `requested`).
- Text stays in `src/data/pl.ts`; core returns line kinds; `artHealthView.ts` maps kinds to text (exhaustive switch).

## Historical Context (from prior changes)

- `context/archive/2026-10-22-notebook-polish/follow-ups/review-fixes.md` FU-NP 16 - filter-camera release (resolved by source above) and the misplaced JSDoc (fold in).
- `context/archive/2026-10-23-fox-guide/follow-ups/review-fixes.md` F6 - the untrue "Obrazki" sentence for the fox (folded in as G-1).
- `docs/design-gaps.md` row 168 - recorded "no text change" at fox-guide time; amended by this change.

## Related Research

- `context/archive/2026-10-22-notebook-polish/research.md` and `context/archive/2026-10-23-fox-guide/research.md` (both exist) - not re-read; this research relied on the current source.

## Proposed phases for the plan (drivers)

1. **Phase 1 - pure rules and copy (Driver: tdd).** `guideAvailable` in `src/core/guide.ts`; `'guide'` in `FallbackWhere`/`FALLBACK_ORDER`;
   `artHealthLines` emits `{ kind: 'guide' }`, drops `guide` from the `fallback` line, and adds `standIn` to the UI `missing` line
   (input `guideKeys`); `pl.settings.guideMissing` and `uiArtMissing(count, total, standIn)`; `artHealthView.ts` `textOf` case.
   Tests: `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts`, a guide test.
2. **Phase 2 - widgets, scenes, hook, pin, docs (Driver: impl).** `SalonBackdrop` record (`drawn`, `blurred`, `renderer`,
   `redraws`, `pixel`); `restorewebgl` listener in `TaskScene` and `WelcomeScene` (WelcomeScene gets `refreshBackdrop`, JSDoc moved to
   `targets`), `off` on shutdown, one `console.warn`; `GuideFox` availability once, `recordFallback(scene, 'guide', 'none')`,
   `requested`; `UIScene` passes `guideKeys`; `TaskSnapshot`/hook types; third `describe` in `tests/phaserLoaderPin.test.ts`;
   C-1 in `docs/art-inventory.md`; gap row 168.
3. **Phase 3 - browser proof (Driver: e2e).** Context loss spec (welcome and task, incl. restore while the room is open) with the
   pixel and `redraws`; fox spec with `fox-think.webp` aborted (hidden in every phase, `requested` follows the round, "Obrazki" fox
   sentence, no "napis lub rysunek"); existing #12/#11 backdrop and fox specs stay green.

## Open Questions

- `DynamicTexture.snapshotPixel` under the Canvas renderer (`renderer.snapshotCanvas`) was not checked for synchronous callback; the
  plan either verifies it or makes the `pixel` getter return `null` on Canvas (the e2e runs on WebGL only).
- Whether iPad Safari actually loses the context in a typical session stays unproven (no device); the fix does not depend on it.
- Calling `snapshotPixel` from a hook getter between frames rebinds the DynamicTexture's framebuffer; `snapshotFramebuffer` is
  expected to restore the binding (observed: no rendering glitch in the scratch test); the e2e run will confirm.
