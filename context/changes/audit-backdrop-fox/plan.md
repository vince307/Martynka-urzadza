# Salon backdrop after a WebGL context restore, an honest backdrop record, a missing fox named and stable — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-24-audit-backdrop-fox` (non-roadmap fix change, no roadmap edit). Source: the
maintainer's "zrob pr naprawczy" (2026-10-24) for the observability audit on branch
docs/observability-audit-2026-10-22-notebook-polish (PR #101: B-1, B-2, C-1) and the one on branch
docs/observability-audit-2026-10-23-fox-guide (PR #104: G-1, G-2). The pre-agreed decisions are
`context/runs/2026-10-24-audit-backdrop-fox/scope.md` items 1-8 (D0 in `change.md`); `research.md` answered every unknown
(R1-R6 in `handoff.md` § 6). This plan implements them and does not re-decide them:

- **B-1**: after a WebGL context loss and restore, every scene that owns a `SalonBackdrop` (`TaskScene`, `WelcomeScene`;
  no other) redraws it synchronously inside the renderer's `restorewebgl` handler through its refresh path, also while
  `TaskScene` sleeps; one `console.warn` per redraw; the Phaser 4.2.1 API used is pinned in `tests/phaserLoaderPin.test.ts`.
- **B-2**: the backdrop record says what was drawn: `drawn`, `blurred`, `renderer` ('webgl' | 'canvas'), `redraws`
  (runtime only, in the hook snapshot), plus one on-demand pixel read of the backdrop texture for e2e.
- **C-1**: `docs/art-inventory.md` names `public/fonts/MartynkaNext.ttf` in its two font spots.
- **G-1**: `GuideFox` records `guide` in `REGISTRY_KEYS.artFallbacks`; "Obrazki" names the fox in its own true sentence,
  and the screen-picture line says "napis lub rysunek" only when a picture with a stand-in is missing.
- **G-2**: a fox with any pose texture missing is hidden for the whole scene life (no blinking by phase); the hook
  snapshot carries `requested` beside `pose`.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave`, `SAVE_KEYS` and every
frozen fixture untouched). Every new record is runtime only. No game logic, balance, curriculum, generator or
child-facing content change (scope item 7). Nothing else from the two audits is folded in (scope item 8). **A phase that
finds it must change what is saved, a balance value, curriculum or child-facing content stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and spot-checked on this branch at
`f561460`:

- **Backdrop.** `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render(rooms, currentRoom)`: `clear()`, `backdropMode`,
  `captureCount += 1` before the `if (dt)`, blur only under `renderer.type === WEBGL` through
  `holder.enableFilters().filters?.internal.addBlur(...)` (result discarded), a new `salon-backdrop-<serial>` DynamicTexture
  per render, `dt.draw(holder)` + `dt.render()`, then an image and a separate wash rectangle (`PAGE_BACKGROUND`,
  `BACKDROP.washAlpha`). Getters `mode`, `captures` only.
- **Owners.** `TaskScene.create` builds it and calls the private `refreshBackdrop()` (stores `backdropRooms`); `onWake`
  re-captures when `REGISTRY_KEYS.rooms` changed; the `events.once('shutdown')` block pairs every `game.events` listener
  with an `off` and destroys the backdrop. `WelcomeScene.create` calls `this.backdrop.render(...)` inline (no refresh
  method); its `backdropState()` sits under the JSDoc meant for `targets()` (FU-NP 16 part).
- **No context listener anywhere in `src/`.** Phaser 4.2.1 `WebGLRenderer.dispatchContextRestored` recreates every GL
  wrapper, sets `contextLost = false`, then emits `'restorewebgl'` on the renderer; a DynamicTexture comes back blank
  (`pixels === null`), file and canvas textures come back (research, observed in headless Chromium).
- **Records.** `TaskSnapshot.backdrop: { mode, captures }` in `TaskScene.snapshot`; `WelcomeScene.backdropState()` the
  same shape; `src/testing/e2eHook.ts` only forwards both; `tests/e2e/support/hook.ts` `Snapshot.backdrop` is a
  hand-written copy of the shape.
- **Pixel API.** `DynamicTexture.snapshotPixel` → `snapshotArea` → under WebGL `renderer.snapshotFramebuffer(...,'pixel')`
  (synchronous `readPixels`, a `Color` to the callback); under Canvas `renderer.snapshotCanvas(this.canvas, callback,
  false, ...)` → `CanvasSnapshot` with `getPixel` false, which builds an `Image` asynchronously and never passes a `Color`
  (read in `node_modules/phaser/src/renderer/canvas/CanvasRenderer.js` and `renderer/snapshot/CanvasSnapshot.js`).
- **Fox.** `src/ui/widgets/GuideFox.ts` `show(pose)` checks `textures.exists` per call, so one missing pose hides the fox
  only in that pose's phases (G-2); `GuideSnapshot` = `pose, visible, rect, interactive, pops`; no `recordFallback`.
  `src/core/guide.ts` holds `GUIDE_ART` and `guidePose`.
- **Fallback record and lines.** `src/core/artPick.ts` `FallbackWhere = 'wallet' | 'notebook' | 'miniature' |
  'loading'`, `FALLBACK_ORDER` the same, `noteFallback` idempotent; `src/ui/artFallbacks.ts` `recordFallback`.
  `src/core/artHealth.ts` `artHealthLines` emits `{ kind: 'fallback', where }` from `FALLBACK_ORDER`;
  `src/ui/dom/artHealthView.ts` `textOf` (exhaustive switch) maps it to `pl.settings.artFallback(...)` through
  `pl.settings.artFallbackNames[where]` ("Zamiast obrazka gra rysuje: …" — untrue for the fox), and the UI `missing` line to
  `pl.settings.uiArtMissing(count, total)`, whose second sentence "Na tych ekranach zamiast obrazka jest napis lub
  rysunek." is untrue when only fox poses are missing. `UIScene.openSettings` builds the `artHealthLines({...})` input.
- **Callers of `uiArtMissing`**: `artHealthView.ts`, `tests/artHealthText.test.ts` (prefix check),
  `tests/e2e/health-lines.spec.ts` `#14 G-1` (exact text).
- **Docs.** `docs/art-inventory.md`: the sentence "Font `AtkinsonHyperlegibleNext.ttf` jest identyczny we wszystkich
  paczkach i w `public/fonts/`." and the table row "Font | wszystkie paczki | identyczny z `public/fonts/` | —".
  `docs/design-gaps.md` row 168 says "no text change, scope item 8" (fox-guide time).
- `context/foundation/lessons.md` does not exist (checked; nothing to apply).
- **Baseline** (contract): `main` `e020886`, unit `Tests  3891 passed`, e2e 155. Every phase measures its own branch
  baseline before its first edit and writes `baseline + delta`.

## Desired End State

- Forcing `WEBGL_lose_context` lose + restore on the welcome screen, on the task screen and while the room is open leaves
  the salon backdrop drawn: the hook's `backdrop.redraws` grows by one per restore per live owner, `drawn: true`, and the
  texture's centre pixel is opaque and not the page colour. The console carries one line per redraw.
- The hook snapshot's `backdrop` is `{ mode, captures, drawn, blurred, renderer, redraws }` on both screens; under
  WebGL `blurred: true`, `renderer: 'webgl'`.
- With `fox-think.webp` failing to load, the fox never shows on the task screen in any phase (idle, think, cheer, summary),
  `guide.requested` follows the round, `artFallbacks.guide === 'none'`, and "Obrazki" reads the count line without
  "napis lub rysunek" plus "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka."
- With the wallet picture missing (existing `#14 G-1`), the UI line still ends with the "napis lub rysunek" sentence.
- `docs/art-inventory.md` names `MartynkaNext.ttf`; row 168 describes the whole-session hide and the parent sentence;
  CLAUDE.md "Current state" carries one sentence group for this change; follow-ups with triggers recorded.

### Key Discoveries:

- The redraw must run inside the `restorewebgl` handler, synchronously: the event fires from the DOM event before the next
  game step, so no frame shows the blank texture; a deferred redraw (next frame, `wake`) shows at least one frame of
  wash only (research R1).
- `game.renderer` outlives scenes: its listener needs an `off` in each owner's `shutdown`, like the `game.events` ones.
- From the page, `canvas.getContext('webgl')` returns Phaser's own context (`'webgl2'` returns `null`), and
  `WEBGL_lose_context` exists in the Playwright 1.64 headless Chromium (SwiftShader) (research).
- A blank DynamicTexture reads `[0,0,0,0]`; the wash is a separate object, so the texture pixel is the salon alone.
- `FallbackWhere` indexes `pl.settings.artFallbackNames`: adding `'guide'` needs the `fallback` line typed over the drawn
  screens only, or typecheck fails in `artHealthView.ts`.
- `GuideFox` is built once per `TaskScene.create`, after the boot load; an availability check in its constructor sees the
  final texture set.

## What We're NOT Doing

- No save, storage, balance, curriculum, generator or child-facing text change; no new `E2EArtSeam` value and no edit of
  `vite/e2eHookGuard.mjs` (decision P-4).
- No `LOSE_WEBGL` handling (nothing renders while lost; Phaser already calls `preventDefault`); no redraw of anything but
  the backdrop (every other texture is file- or canvas-backed: `starBurst` uses `Graphics.generateTexture` → canvas).
- No edit of `pl.settings.artFallback` / `artFallbackNames` (health-lines FU 20 stays unfired, decision D5).
- No stand-in box or drawn fox; no change to fox placement, poses, motion or screens (gaps 165-167 untouched).
- No change to `artHealthLines` causes, cut, labels, folder or code lines; the generic follow-ups on `artHealth.ts` and
  `artHealthView.ts` are re-recorded open, not folded (scope item 8).
- Not folded: N-7, N-8, A-1 and every other finding of the two audits; FU-NP 16's `Keypad`, `starBurst`, `barSpan` parts;
  WelcomeScene's older follow-ups (autosave F4 carried, parent-settings F6) — re-recorded with this change's trigger.
- No proof on a real iPad that the context is ever lost (no device; the fix does not depend on it).
- No roadmap status edit (non-roadmap change).

## Implementation Approach

Pure rules and copy first, test-led (phase 1); then the fox widget and the one UIScene argument (phase 2); then the
backdrop record and the restore redraw with the Phaser pin and source guards (phase 3); then docs, follow-ups, the seam
sweep and the visual pass (phase 4, the last impl phase); then two e2e phases, one per finding family (5: backdrop
restore, 6: missing fox pose). Each code phase touches one widget family; e2e phases come after every feature is built.

## Critical Implementation Details

- **Timing & lifecycle.** The `restorewebgl` handler calls the scene's refresh path directly (no `time.delayedCall`, no
  `requestAnimationFrame`, no wait for `wake`), in every scene state including `TaskScene` asleep under the room. The
  handler is registered in `create` with a stored function reference and removed in the same `events.once('shutdown')`
  block that destroys the backdrop.
- **Pixel read is on demand.** `SalonBackdrop.pixel()` is called only by the hook's own getter `backdropPixel`, never by a
  snapshot or per frame: a `readPixels` on every `expect.poll` of 155 specs would stall SwiftShader for nothing.
- **The `fallback` line keeps its type narrow.** `guide` lives in `FallbackWhere`/`FALLBACK_ORDER` (record and hook) but is
  filtered out of the `fallback` line, typed `DrawnFallbackWhere = Exclude<FallbackWhere, 'guide'>`, so
  `artFallbackNames` stays exactly the four drawn screens.

## Phase 1: Fox availability rule and the "Obrazki" lines

Driver: tdd
Driver why: `guideAvailable`, the `guide` line and the `standIn` flag are absent pure rules with literal oracles — failing tests lead.

### Overview

The pure rule "all three poses exist", the `guide` fallback place, the new `guide` line and the `standIn` flag of the UI
`missing` line, with their Polish copy and the view's `case`.

### Changes Required:

#### 1. Fox availability

**File**: `src/core/guide.ts`

**Intent**: one pure rule the widget evaluates once, so a single missing pose hides the fox everywhere (G-2).

**Contract**: `guideAvailable(exists: (id: UiArtId) => boolean): boolean` — true only when every `GUIDE_ART` value
exists. Also export `GUIDE_IDS: readonly UiArtId[]` (the three `GUIDE_ART` values, for the UIScene caller in phase 2) if
the implementer needs it; no data value import into core.

#### 2. Fallback place

**File**: `src/core/artPick.ts`

**Intent**: the fox can be recorded like the other screens, for the hook and the parent line (G-1).

**Contract**: `FallbackWhere` gains `'guide'`; `FALLBACK_ORDER` appends `'guide'`; new
`type DrawnFallbackWhere = Exclude<FallbackWhere, 'guide'>`; the doc comment says the fox records `'none'` (nothing is
drawn in its place). `noteFallback` unchanged.

#### 3. Lines

**File**: `src/core/artHealth.ts`

**Intent**: a true parent line for the fox and a UI count line that promises a stand-in only when one exists.

**Contract**: `ArtHealthLine` changes: the `ok | missing` member gains `standIn?: boolean` (set only on the `ui` table's
`missing` line); `{ kind: 'fallback'; where: readonly DrawnFallbackWhere[] }`; new member `{ kind: 'guide' }`.
`ArtHealthLinesInput` gains `noStandIn?: readonly string[]` (UI keys whose screen draws nothing in their place: the fox
poses; the caller reads them from the data). `artHealthLines`: the `ui` `missing` line carries `standIn` = some
`ui.missing` key is not in `noStandIn` (absent input → every missing key has a stand-in, today's behaviour); after the
`font` line and before the `fallback` line, `{ kind: 'guide' }` when `fallbacks?.guide !== undefined`; the `fallback`
line lists `FALLBACK_ORDER` minus `'guide'`. Doc comment updated.

#### 4. Copy and view

**File**: `src/data/pl.ts` — `pl.settings.uiArtMissing(count, total, standIn: boolean)`: the second sentence "Na tych
ekranach zamiast obrazka jest napis lub rysunek." only when `standIn`; new `pl.settings.guideMissing: 'Lisek w rogu
zeszytu się nie pokazuje, bo brakuje jego obrazka.'` with a `DESIGN-GAP 168` comment (the kit has no parent text for a
picture with no stand-in).

**File**: `src/ui/dom/artHealthView.ts` — `textOf`: the UI `missing` branch passes `line.standIn ?? true`; new
`case 'guide': return pl.settings.guideMissing;`. Nothing else in the file.

#### 5. Tests

**Files**: `tests/guide.test.ts`, `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts`, and the exact-text call
in `tests/e2e/health-lines.spec.ts` `#14 G-1` (`uiArtMissing(1, total, true)`, the wallet has a stand-in; typecheck
covers `tests/`).

**Contract**: `guideAvailable` over a literal table (all three exist → true; each single pose missing → false; none →
false). `artHealthLines`: only fox keys missing with `noStandIn` = the three fox keys → `ui` `missing` line with
`standIn: false`; wallet missing → `standIn: true`; wallet + one fox key → `true`; no `noStandIn` → `true`;
`fallbacks: { guide: 'none' }` → one `{ kind: 'guide' }` line and no `fallback` line; `{ guide, wallet }` → both lines,
`fallback.where` = `['wallet']`; line order font → guide → fallback → code. `artHealthText`: `uiArtMissing(n, t, false)`
has no "napis lub rysunek", `(n, t, true)` ends with it; `guideMissing` is one sentence ending with a full stop.

### Success Criteria:

#### Automated Verification:

- New cases red against stubs (`guideAvailable` returns `true`, no `guide` line, `standIn` absent), green after; unit `<branch baseline> + N`
- Deliberate break: `guideAvailable` checks only `idle` → the single-missing rows red; `standIn` computed as `ui.missing.length > 0` → the "only fox keys" case red; each restored; meta-check: the oracles are literal tables and literal key lists, not values computed by the code under test
- `npm run typecheck` green with `'guide'` in `FallbackWhere` and `artFallbackNames` unchanged (`git diff main -- src/data/pl.ts` shows no edit of `artFallback`/`artFallbackNames`)
- `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum` empty
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`#14 G-1` text unchanged for the wallet)

---

## Phase 2: The fox hides for the whole scene and is recorded

Driver: impl
Driver why: widget and scene glue over phase 1's rule — the risk is in the rendered canvas, proven by source guards here and the phase-6 e2e.

### Overview

`GuideFox` decides once whether it can show, records `guide` when it cannot, reports the requested pose; `UIScene`
passes the fox keys to the lines.

### Changes Required:

#### 1. Widget

**File**: `src/ui/widgets/GuideFox.ts`

**Intent**: no blinking by phase (G-2) and a recorded absence (G-1).

**Contract**: the constructor evaluates `guideAvailable((id) => scene.textures.exists(UI_ART_KEYS[id]))` once into a
readonly field and, when false, calls `recordFallback(scene, 'guide', 'none')` once; `show(pose)` stores
`requested = pose` first, then hides the fox when `pose === null` or the fox is unavailable, and otherwise no longer
checks `textures.exists` per pose (the pose texture is known to exist). `GuideSnapshot` gains `readonly requested:
GuidePose | null` (the last `show` argument; `null` before the first call). The class comment names DESIGN-GAP 168's new
wording (whole-session hide). Pop, reduced motion and no-input behaviour unchanged.

#### 2. Scene and hook types

**File**: `src/scenes/UIScene.ts` — the `artHealthLines({...})` call in `openSettings` passes `noStandIn` = the UI keys of
the three fox poses (`UI_ART_KEYS[id]` over `GUIDE_ART`'s values).

**File**: `tests/e2e/support/hook.ts` — `Snapshot.guide` gains `requested: 'idle' | 'cheer' | 'think' | null`.

`TaskSnapshot.guide` already is `GuideSnapshot` (no `TaskScene` edit expected).

#### 3. Source guards

**File**: `tests/guideWiring.test.ts`

**Contract**: `GuideFox.ts` calls `guideAvailable(` exactly once and inside the constructor body; contains
`recordFallback(` with `'guide'`; the `show` method body has no `textures.exists`; `UIScene.ts`'s `artHealthLines({`
call passes `noStandIn`.

### Success Criteria:

#### Automated Verification:

- `tests/guideWiring.test.ts` green with the new cases; unit `<phase-1 count> + N`
- Deliberate break: put `!this.scene.textures.exists(key)` back into `show` → the "no per-pose check" case red; delete the `recordFallback` call → its case red; each restored; meta-check: these are source guards of the wiring; on-screen behaviour (hidden in every phase, the panel text) is proven by phase 6
- `grep -n "requested" src/ui/widgets/GuideFox.ts tests/e2e/support/hook.ts` shows the field in both
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`fox-guide.spec.ts` `#11 no fox without its art` still green: `?e2eArt=ui` misses all three poses)

---

## Phase 3: Backdrop record and the redraw after a context restore

Driver: impl
Driver why: Phaser widget and scene lifecycle glue (renderer event, DynamicTexture rebuild) — nothing a pure test can lead; proven by the Phaser pin, source guards and the phase-5 e2e.

### Overview

`SalonBackdrop` records what it drew and can read one texture pixel; both owner scenes redraw on `restorewebgl`; the
hook exposes the record and the pixel; the Phaser 4.2.1 behaviour relied on is pinned.

### Changes Required:

#### 1. Widget record

**File**: `src/ui/widgets/SalonBackdrop.ts`

**Intent**: the record tells what was drawn, not what was asked (B-2), and a restore redraw is counted and logged (B-1).

**Contract**: exported `interface BackdropSnapshot { mode: BackdropMode; captures: number; drawn: boolean; blurred:
boolean; renderer: 'webgl' | 'canvas'; redraws: number }`; `render(rooms, currentRoom, cause: 'capture' | 'restore' =
'capture')` — `cause === 'restore'` bumps `redraws` and writes one
`console.warn(`Salon backdrop redrawn after a WebGL context restore (${scene key}, redraw ${n})`)` (developer English),
both at the top of `render`, before the `plain` early return (a restore in `plain` mode is still counted; `drawn: false`
tells that nothing was drawn — plan review F1);
`drawn` = a DynamicTexture was created and drawn at the last render (false in `plain` mode or when
`addDynamicTexture` returned null); `blurred` = the `addBlur(...)` result was defined at the last render; `renderer` from
`scene.sys.game.renderer.type === WEBGL`; `captures` keeps its meaning (every non-plain render). `snapshot():
BackdropSnapshot` (frozen). `pixel(): [number, number, number, number] | null` — `null` without a texture or under the
Canvas renderer (its `snapshotArea` returns an `Image` asynchronously, never a `Color`; decision P-2); under WebGL
`texture.snapshotPixel(centreX, centreY, cb)` with the `Color`'s red, green, blue, alpha, `null` if the callback did not
run synchronously. The class comment drops nothing; FU-NP 16's filter-camera note is answered in a one-line comment at
`holder.destroy(true)` (`GameObject.destroy` destroys `filterCamera` in 4.2.1, pinned).

#### 2. Owner scenes

**File**: `src/scenes/TaskScene.ts`

**Intent**: redraw on restore, awake or asleep.

**Contract**: `refreshBackdrop(cause: 'capture' | 'restore' = 'capture')` forwards `cause`; in `create`, a stored
handler `onRestore = (): void => this.refreshBackdrop('restore')` registered with
`this.game.renderer.on(Renderer.Events.RESTORE_WEBGL, onRestore)` (Phaser constant, never the string literal) and removed
with `off` in the existing `events.once('shutdown')` block; `TaskSnapshot.backdrop: BackdropSnapshot` built from
`this.backdrop?.snapshot()` (when absent: `mode: 'plain'`, zeros, `drawn`/`blurred` false, `renderer` still read from
`this.game.renderer.type` — plan review F3); public `backdropPixel()` forwarding `pixel()`.

**File**: `src/scenes/WelcomeScene.ts`

**Intent**: the same redraw for the first screen; the misplaced JSDoc fixed (FU-NP 16 part).

**Contract**: a private `refreshBackdrop(cause = 'capture')` extracted from `create`'s inline `render` call (same
arguments); the same `RESTORE_WEBGL` listener and `off` in its existing `shutdown` block; `backdropState():
BackdropSnapshot`; public `backdropPixel()`; the JSDoc "Centres of the buttons …" moves above `targets()`.

#### 3. Hook

**File**: `src/testing/e2eHook.ts` — a new read-only getter `backdropPixel` on `window.__martynkaE2E`: `null` while
loading, `welcome().backdropPixel()` on the welcome, else `task().backdropPixel()` (also while the room is open). No
other hook change; the snapshot already forwards `backdrop`.

**File**: `tests/e2e/support/hook.ts` — `Snapshot.backdrop` becomes `{ mode; captures; drawn; blurred; renderer:
'webgl' | 'canvas'; redraws }`; the `Hook` interface gains `backdropPixel: [number, number, number, number] | null` so
`readHook(page, 'backdropPixel')` works.

#### 4. Phaser pin and source guards

**File**: `tests/phaserLoaderPin.test.ts` — a new `describe('phaser webgl restore pin')`: `RESTORE_WEBGL_EVENT.js`
exports `'restorewebgl'`; in `WebGLRenderer.js` `dispatchContextRestored`, the `glFramebufferWrappers` re-creation comes
before `this.emit(Events.RESTORE_WEBGL` (by `indexOf` within the function's text); `DynamicTexture.js` `snapshotPixel`
goes through `snapshotArea` with `'pixel'`; `GameObject.js` `destroy` destroys `filterCamera`. The hint names
`src/ui/widgets/SalonBackdrop.ts` and e2e `backdrop-restore.spec.ts`.

**File**: `tests/backdropRestoreWiring.test.ts` (new) — for each of `TaskScene.ts` and `WelcomeScene.ts`: one
`renderer.on(Renderer.Events.RESTORE_WEBGL` and one matching `renderer.off(Renderer.Events.RESTORE_WEBGL` inside the
`'shutdown'` block; the handler calls `refreshBackdrop('restore')` with no `delayedCall`/`requestAnimationFrame`/`'wake'`
on the way; `snapshotPixel(` appears only in `src/ui/widgets/SalonBackdrop.ts` within `src/`; no file in `src/` other than
the two scenes constructs `new SalonBackdrop(` (a third owner must add its listener).

### Success Criteria:

#### Automated Verification:

- `tests/phaserLoaderPin.test.ts` and `tests/backdropRestoreWiring.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: delete the `off` in `TaskScene`'s shutdown block → wiring case red; wrap the WelcomeScene redraw in `this.time.delayedCall(0, …)` → wiring case red; change the pin's expected event string → pin red; each restored; meta-check: the wiring cases are source guards and the pin reads Phaser's own source, so on-screen redraw is proven by phase 5, not here
- `grep -rn "restorewebgl" src` empty (only the Phaser constant is used)
- `git diff --stat main -- src/core/save.ts tests/fixtures vite/e2eHookGuard.mjs` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`notebook-polish.spec.ts` `#12` and `#11` backdrop cases still green with the grown record)

---

## Phase 4: Docs, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, inventory and gap rows, follow-ups and leftovers over phases 1-3 plus the screenshot matrix — docs and glue.

### Overview

C-1, row 168, CLAUDE.md, follow-ups with triggers, the sweep, and screenshots of every touched state.

### Changes Required:

#### 1. Inventory and gaps

**File**: `docs/art-inventory.md` (C-1) — the font sentence names `public/fonts/MartynkaNext.ttf` (Atkinson Hyperlegible
Next with a plain zero, built from the pack's `AtkinsonHyperlegibleNext.ttf` by `npm run font`, checked by
`tests/fontZero.test.ts`); the "Font" table row says the same in short. Polish like the rest of the file.

**File**: `docs/design-gaps.md` — row 168 amended (the "Decision" column from `research.md` § Design source: a missing
texture of any pose hides the fox for the whole round screen, no stand-in, no blinking; "Obrazki" names it in its own
sentence `pl.settings.guideMissing`; the screen-picture line speaks of a caption or drawing only when a non-fox picture is
missing; change audit-backdrop-fox); "Files" adds `src/core/guide.ts`, `src/core/artHealth.ts`, `src/data/pl.ts`. No new
row (B-1/B-2 have no visible difference after a synchronous redraw, decision D6).

#### 2. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` only if it repeats the facts — grep first)

**Intent**: one or two sentences in the existing style, e.g.: Backdrop restore and fox health (change audit-backdrop-fox;
save format stays v4): `TaskScene` and `WelcomeScene` redraw the `SalonBackdrop` synchronously on the renderer's
`Renderer.Events.RESTORE_WEBGL` (Phaser 4.2.1 behaviour pinned in `tests/phaserLoaderPin.test.ts`, listeners guarded by
`tests/backdropRestoreWiring.test.ts`), the backdrop record carries `drawn`, `blurred`, `renderer` and `redraws` and the
e2e hook reads one texture pixel (`backdropPixel`); a fox with any pose missing stays hidden for the whole scene
(`guideAvailable` in `src/core/guide.ts`), records `guide` in `REGISTRY_KEYS.artFallbacks`, the hook reports
`guide.requested`, and "Obrazki" names it with `pl.settings.guideMissing` (the UI line's stand-in sentence only when a
non-fox picture is missing, `standIn`). Fix sentences made untrue (the fox-guide sentence group's "a missing pose" wording,
if it says per pose).

#### 3. Seam sweep

**Files**: anything phases 1-3 left

**Intent**: one `snapshotPixel` user; no `textures.exists` left in `GuideFox.show`; no second backdrop record shape (the
hook, `TaskSnapshot` and `WelcomeScene.backdropState` all use `BackdropSnapshot`, the e2e copy matches it); no
`'restorewebgl'` literal; stale comments (`artPick.ts` `FallbackWhere` doc, `artHealthLines` doc, `GuideFox` class
comment, `SalonBackdrop` class comment); `pl.settings` keys unused nowhere; `FALLBACK_ORDER` users still right.

#### 4. Follow-ups

**File**: `context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item, each with a `Trigger:` line: `pixel()` returns `null` under Canvas (Trigger: a
Canvas-renderer report or an e2e project on Canvas); real-device context loss unproven (Trigger: a playtest note of a
plain page after the tablet slept or switched apps); FU-NP 16 remainder — `Keypad`, `starBurst`, `barSpan` parts open,
filter-camera part closed by the pin (Trigger: the next change to `starBurst`, `Keypad` or the bar layout); WelcomeScene's
carried follow-ups re-recorded (autosave carried F4 / observability F4 `openParent` guard, parent-settings F6 suspender
cast) — closed if the sweep finds them already fixed, else open (Trigger: a non-final error path in WelcomeScene or the
next change to `WelcomeScene.openParent`); the generic triggers on `artHealth.ts` / `artHealthView.ts` (load-and-tab-guard
A-5, A-11; salon-load-health; audit-boot-hidden-tab; post-run-polish; save-reason-and-recovery ASL-02..09; stale-tab-and-health
G-2, G-3, B-4, B-5) re-recorded open (Trigger: unchanged, cited; plan review F2);
narrator-round-summary's hook follow-up ("`null` targets while the room is open") recorded closed (already in
`e2eHook.ts` `targets`); fox-guide F6 recorded closed (= G-1).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "guideAvailable\|RESTORE_WEBGL\|backdropPixel" CLAUDE.md` present
- `grep -c "MartynkaNext.ttf" docs/art-inventory.md` ≥ 2 and `grep -n "identyczny we wszystkich paczkach i w" docs/art-inventory.md` empty
- `grep -n "^| 168 |" docs/design-gaps.md` mentions `guideMissing` and no longer says "no text change"
- `grep -c "Trigger:" context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` ≥ 5
- `grep -rn "snapshotPixel" src` lists only `src/ui/widgets/SalonBackdrop.ts`
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [human] Accept the parent wording: `pl.settings.guideMissing` "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." and the UI count line losing its "napis lub rysunek" sentence when only fox poses are missing (decision P-5; scope item 5 fixes the place, not the words)
- [human] Accept the G-2 proof form: one missing pose is produced in e2e by `page.route` aborting `fox-think.webp` (precedent `#14 G-1`), not by a new value inside the `e2eArt` marker of `vite/e2eHookGuard.mjs`, and backed by the `guideAvailable` unit table — scope item 6 names "an e2e seam inside the existing `e2eArt` marker … or a unit test"; this is neither literally (decision P-4)
- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (Playwright fallback for the context loss: `page.evaluate` on `getContext('webgl')`'s `WEBGL_lose_context`): welcome screen before a loss and after lose + restore; task screen before and after lose + restore; task screen after lose + restore while the room was open, back on the task; settings "Obrazki" with `fox-think.webp` aborted (count line without "napis lub rysunek" + the fox sentence); settings "Obrazki" with `wallet-open.webp` aborted (stand-in sentence kept); task screen with `fox-think.webp` aborted at idle, after a miss and after a right answer (no fox in any) — the backdrop looks the same before and after the restore in every pair
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in an earlier `check` log: `Tests  3891 passed (3891)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 5: The backdrop survives a context restore — e2e (#12, #11)

Driver: e2e
Driver why: the blank DynamicTexture exists only in the rendered WebGL context (risk #12 welcome by touch, #11 round by touch behind the same backdrop); built by phase 3, contract `E2E=on`.

### Overview

One new spec `tests/e2e/backdrop-restore.spec.ts` (hook build, port 4397) forces lose + restore and proves the redraw.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/backdrop-restore.spec.ts` (titles `#12 …` / `#11 …`)

**Contract**: model on `notebook-polish.spec.ts` and `support/{hook,welcome}.ts`; a local helper `loseAndRestore(page)`:
`page.evaluate` → `document.querySelector('canvas')!.getContext('webgl')!.getExtension('WEBGL_lose_context')!.loseContext()`,
`expect.poll` on `gl.isContextLost()` true, then `restoreContext()` (always `'webgl'`, never `'webgl2'`). A local
`isSalonPixel(px)`: non-null, alpha 255, RGB ≠ `PAGE_BACKGROUND` (imported from `src/data/layout.ts`). Pixel read through
`readHook(page, 'backdropPixel')`.
- `#12 the welcome backdrop is drawn again after a WebGL context restore` — on the welcome: `backdrop.mode === 'salon'`,
  `drawn`, `blurred`, `renderer === 'webgl'`, `redraws === 0`, pixel salon; `loseAndRestore`; `expect.poll` `redraws === 1`,
  `drawn: true`, pixel salon; an age tap still starts the game.
- `#11 the task backdrop is drawn again after a WebGL context restore` — same on the task screen, then a right answer still
  plays.
- `#11 a restore while the room is open redraws the sleeping task backdrop` — answer the open task, open the room
  (`roomSwitch`), `loseAndRestore`; while still in the room `redraws === 1` and pixel salon; back to the task (`resume`):
  pixel salon, the round goes on.
No console-error assertion (Chromium logs a harmless "INVALID_OPERATION: delete: object does not belong to this context"
on restore; decision P-3). No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through
`expect.poll`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: remove `WelcomeScene`'s listener → the welcome test red with `redraws 0` and pixel `[0,0,0,0]`; remove `TaskScene`'s listener → both task tests red; make `TaskScene`'s handler return early while `this.sys.isSleeping()` → only the room test red; each restored), green after
- `npx playwright test tests/e2e/backdrop-restore.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Phase 6: A missing fox pose hides the fox for the whole round and is named — e2e (#11, #14)

Driver: e2e
Driver why: the whole-session hide and the panel sentence exist only in the rendered canvas and the DOM panel (risk #11 round by touch with the fox, #14 parent panel); built by phases 1-2, contract `E2E=on`.

### Overview

One `describe` added to `tests/e2e/fox-guide.spec.ts` with `fox-think.webp` aborted.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/fox-guide.spec.ts` — `test.describe('one pose missing', …)` with `test.use({ serviceWorkers: 'block' })`
and `page.route('**/assets/ui/fox-think.webp', (route) => route.abort())` before `passWelcome` (model: `health-lines.spec.ts`
`#14 G-1`):
- `#11 one missing pose hides the fox in every phase` — at the task start `guide.visible === false`, `requested ===
  'idle'`; after `answerWrong` `requested === 'think'`, still hidden; after `answerRight` (retype or a new task)
  `requested` follows, still hidden; on the summary hidden; `artFallbacks.guide === 'none'`; the round plays to the
  summary.
- `#14 the pictures section names the missing fox` — `openSettings`: `pl.settings.guideMissing` visible (exact);
  `pl.settings.uiArtMissing(1, UI_ART.length, false)` visible (exact); no text containing "napis lub rysunek"; no
  `pl.settings.artFallback(` line.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: restore the per-pose `textures.exists` check in `GuideFox.show` and drop the constructor rule → "every phase" red (fox visible at idle); delete the `recordFallback` call → "pictures section" red; pass no `noStandIn` in `UIScene` → "pictures section" red on the exact count line; each restored), green after
- `npx playwright test tests/e2e/fox-guide.spec.ts tests/e2e/health-lines.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<phase-5 e2e count> + 2`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `guideAvailable` literal table; `artHealthLines` `standIn`, `guide` line, narrowed `fallback` line and order;
  `uiArtMissing` with and without the stand-in sentence (phase 1).
- Source guards: fox rule once in the constructor, `recordFallback('guide')`, no per-pose check, `noStandIn` passed
  (phase 2); restore listener on/off in both owners, synchronous redraw, single `snapshotPixel` user, no third owner
  (phase 3).
- Phaser 4.2.1 pin: restore event string, framebuffers recreated before the emit, `snapshotPixel` path, `filterCamera`
  destroyed (phase 3).

### Integration Tests:

- `tests/e2e/backdrop-restore.spec.ts` (three tests, risks #12/#11) and two new tests in `tests/e2e/fox-guide.spec.ts`
  (risks #11/#14) on the hook build.

### Manual Testing Steps:

1. Hook build: on the welcome, in the console, lose and restore the `webgl` context: the salon stays behind the buttons,
   one console line.
2. Same on the task screen and with the room open; back on the task the salon is there.
3. Block `fox-think.webp`: no fox in any phase; "Obrazki" names the fox without "napis lub rysunek".

## Performance Considerations

One extra capture per restore per live owner (rare event). The pixel read is on demand from the e2e hook only (never in
production code paths, never per frame). No new texture, no new boot payload.

## Migration Notes

None: save format stays v4; every new record is runtime only.

## Known risks

- A Phaser upgrade that emits `restorewebgl` before framebuffers are recreated, or changes the DynamicTexture restore:
  the pin turns red first (research R1).
- `snapshotPixel` between frames rebinds the texture framebuffer; research saw no glitch; phase 5's run confirms (the
  getter is never called outside e2e).
- Phase 6's `page.route` abort of `fox-think.webp` is a network failure, so "Obrazki" also shows the `cause`/`advice`/`code`
  lines for it; the `#14` test asserts only the fox sentence, the exact count line and the absence of "napis lub rysunek"
  and of the `artFallback(` line, never the whole line list (plan review F4).
- `fox-guide.spec.ts` `#11 no fox on the unlock card` walks the slow E4 road (known load-flake family, profile § 8); the
  new tests do not use it.

## Autonomous decisions

- **P-1 Six phases**: tdd rules → fox widget → backdrop → docs/sweep → two e2e phases. Rejected: research's three phases
  (each code phase would carry two widget families and the docs). Why: small, independently green phases, each run by a
  fresh agent, and the last impl phase carries the sweep (step prompt). Would change: per-phase overhead dominating in the
  orchestrator's measurements.
- **P-2 `pixel()` returns `null` under the Canvas renderer** (research open question, decided by source). Under Canvas
  `DynamicTexture.snapshotArea` calls `snapshotCanvas(canvas, callback, false, …)`, and `CanvasSnapshot` with `getPixel`
  false loads an `Image` asynchronously and never hands a `Color`. Rejected: a Canvas pixel via the texture's own canvas
  context (`getImageData`) — extra code for a renderer no e2e runs. Would change: an e2e project on the Canvas renderer
  or a Canvas-only bug report (follow-up).
- **P-3 The Chromium "INVALID_OPERATION: delete: object does not belong to this context" log on restore is accepted**:
  it comes from Phaser's `WebGLFramebufferWrapper.createResource` deleting the stale framebuffer, is harmless (research
  observed a correct pixel and no error), and no spec asserts console silence. Rejected: patching Phaser or filtering the
  console. Would change: a spec that fails on console errors, or a visible glitch after restore.
- **P-4 G-2 e2e through `page.route` abort of `fox-think.webp`** (research R4), backed by the `guideAvailable` unit
  table. Rejected: a new `E2EArtSeam` value inside the `e2eArt` marker (change.md D4's option) — product/hook code for a
  test-only path. **Departs from scope item 6's literal options** ("an e2e seam inside the existing `e2eArt` marker … or a
  unit test") → `[human]` row 4.8. Would change: the service worker serving the file despite `serviceWorkers: 'block'`,
  or the maintainer asking for the seam.
- **P-5 Parent copy**: `guideMissing` "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." and
  `uiArtMissing(count, total, standIn)` (research R5). Rejected: "lisek" inside `artFallbackNames` (untrue "gra rysuje"),
  a single rewritten `uiArtMissing` sentence naming the fox (still untrue for a missing wallet + fox mix). Wording chosen
  without the maintainer → `[human]` row 4.7. Would change: the maintainer's wording.
- **P-6 Pixel through a separate hook getter `backdropPixel`, not inside the snapshot**: a GPU readback on every poll of
  every spec is avoidable; scope item 3 lists `drawn`, `blurred`, `renderer` and the redraw count for the snapshot (all
  there) and asks only for "one e2e pixel read". Rejected: `pixel` as a snapshot field. Would change: a spec needing the
  pixel in the same frozen read as the record.
- **P-7 Redraw counted by a `cause` argument of `render`** (research's option), `captures` unchanged in meaning (existing
  `#11 re-capture after a purchase` relies on it). Rejected: a separate `redraw()` method (two entry points to keep in
  step). Would change: a third cause of re-render.
- **P-8 Listener registered on every renderer type** (a Canvas renderer never emits it) — no `WEBGL` guard around `on`/
  `off`. Would change: Phaser typings refusing `on` on the renderer union.
- **P-9 `noStandIn` input, not a core import of `UI_ART_KEYS`** (research, the core/data injection style of
  `artHealthLines`' `labels`). Would change: a second picture without a stand-in (then a `standIn` column in `UI_ART`).
- **P-10 Older WelcomeScene and artHealth follow-ups re-recorded, not folded** (scope item 8: fold in nothing else).
  Would change: a maintainer instruction.
- **P-11 e2e risk ids**: backdrop #12 (welcome) and #11 (task), as `notebook-polish.spec.ts` does; fox #11 and #14
  (parent panel). Would change: the test plan adding a rendering-resilience risk.

## References

- Research: `context/changes/audit-backdrop-fox/research.md`; identity `context/changes/audit-backdrop-fox/change.md`
- Scope: `context/runs/2026-10-24-audit-backdrop-fox/scope.md`
- Format example: `context/archive/2026-10-23-fox-guide/plan.md`
- Code: `src/ui/widgets/SalonBackdrop.ts` (`render`, `clear`), `src/scenes/TaskScene.ts` (`create` shutdown block,
  `refreshBackdrop`, `snapshot`, `TaskSnapshot`), `src/scenes/WelcomeScene.ts` (`create`, `backdropState`, `targets`),
  `src/testing/e2eHook.ts` (`__martynkaE2E` getters), `src/ui/widgets/GuideFox.ts`, `src/core/guide.ts`,
  `src/core/artPick.ts`, `src/core/artHealth.ts` (`artHealthLines`), `src/ui/dom/artHealthView.ts` (`textOf`),
  `src/scenes/UIScene.ts` (`openSettings`), `src/data/pl.ts` (`settings.uiArtMissing`), `tests/phaserLoaderPin.test.ts`,
  `tests/e2e/health-lines.spec.ts`, `tests/e2e/notebook-polish.spec.ts`, `tests/e2e/fox-guide.spec.ts`,
  `node_modules/phaser/src/renderer/webgl/WebGLRenderer.js` (`dispatchContextRestored`),
  `node_modules/phaser/src/textures/DynamicTexture.js` (`snapshotArea`),
  `node_modules/phaser/src/renderer/snapshot/CanvasSnapshot.js`
- Docs: `docs/art-inventory.md`, `docs/design-gaps.md` row 168
- Test plan: `context/foundation/test-plan.md` risks #11, #12, #14

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fox availability rule and the "Obrazki" lines

#### Automated

- [x] 1.1 New cases red against stubs (`guideAvailable` returns `true`, no `guide` line, `standIn` absent), green after; unit `<branch baseline> + N` — 8263f8b
- [x] 1.2 Deliberate break: `guideAvailable` checks only `idle` → the single-missing rows red; `standIn` computed as `ui.missing.length > 0` → the "only fox keys" case red; each restored; meta-check: the oracles are literal tables and literal key lists, not values computed by the code under test — 8263f8b
- [x] 1.3 `npm run typecheck` green with `'guide'` in `FallbackWhere` and `artFallbackNames` unchanged (`git diff main -- src/data/pl.ts` shows no edit of `artFallback`/`artFallbackNames`) — 8263f8b
- [x] 1.4 `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum` empty — 8263f8b
- [ ] 1.5 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`#14 G-1` text unchanged for the wallet)

### Phase 2: The fox hides for the whole scene and is recorded

#### Automated

- [x] 2.1 `tests/guideWiring.test.ts` green with the new cases; unit `<phase-1 count> + N` — 63fb936
- [x] 2.2 Deliberate break: put `!this.scene.textures.exists(key)` back into `show` → the "no per-pose check" case red; delete the `recordFallback` call → its case red; each restored; meta-check: these are source guards of the wiring; on-screen behaviour (hidden in every phase, the panel text) is proven by phase 6 — 63fb936
- [x] 2.3 `grep -n "requested" src/ui/widgets/GuideFox.ts tests/e2e/support/hook.ts` shows the field in both — 63fb936
- [ ] 2.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`fox-guide.spec.ts` `#11 no fox without its art` still green: `?e2eArt=ui` misses all three poses)

### Phase 3: Backdrop record and the redraw after a context restore

#### Automated

- [x] 3.1 `tests/phaserLoaderPin.test.ts` and `tests/backdropRestoreWiring.test.ts` green; unit `<phase-2 count> + N` — 706a01b
- [x] 3.2 Deliberate break: delete the `off` in `TaskScene`'s shutdown block → wiring case red; wrap the WelcomeScene redraw in `this.time.delayedCall(0, …)` → wiring case red; change the pin's expected event string → pin red; each restored; meta-check: the wiring cases are source guards and the pin reads Phaser's own source, so on-screen redraw is proven by phase 5, not here — 706a01b
- [x] 3.3 `grep -rn "restorewebgl" src` empty (only the Phaser constant is used) — 706a01b
- [x] 3.4 `git diff --stat main -- src/core/save.ts tests/fixtures vite/e2eHookGuard.mjs` empty — 706a01b
- [ ] 3.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`notebook-polish.spec.ts` `#12` and `#11` backdrop cases still green with the grown record)

### Phase 4: Docs, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 4.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "guideAvailable\|RESTORE_WEBGL\|backdropPixel" CLAUDE.md` present — b46be2a
- [x] 4.2 `grep -c "MartynkaNext.ttf" docs/art-inventory.md` ≥ 2 and `grep -n "identyczny we wszystkich paczkach i w" docs/art-inventory.md` empty — b46be2a
- [x] 4.3 `grep -n "^| 168 |" docs/design-gaps.md` mentions `guideMissing` and no longer says "no text change" — b46be2a
- [x] 4.4 `grep -c "Trigger:" context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` ≥ 5 — b46be2a
- [x] 4.5 `grep -rn "snapshotPixel" src` lists only `src/ui/widgets/SalonBackdrop.ts` — b46be2a
- [ ] 4.6 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 4.7 [human] Accept the parent wording: `pl.settings.guideMissing` "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." and the UI count line losing its "napis lub rysunek" sentence when only fox poses are missing (decision P-5; scope item 5 fixes the place, not the words)
- [ ] 4.8 [human] Accept the G-2 proof form: one missing pose is produced in e2e by `page.route` aborting `fox-think.webp` (precedent `#14 G-1`), not by a new value inside the `e2eArt` marker of `vite/e2eHookGuard.mjs`, and backed by the `guideAvailable` unit table — scope item 6 names "an e2e seam inside the existing `e2eArt` marker … or a unit test"; this is neither literally (decision P-4)
- [ ] 4.9 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (Playwright fallback for the context loss: `page.evaluate` on `getContext('webgl')`'s `WEBGL_lose_context`): welcome screen before a loss and after lose + restore; task screen before and after lose + restore; task screen after lose + restore while the room was open, back on the task; settings "Obrazki" with `fox-think.webp` aborted (count line without "napis lub rysunek" + the fox sentence); settings "Obrazki" with `wallet-open.webp` aborted (stand-in sentence kept); task screen with `fox-think.webp` aborted at idle, after a miss and after a right answer (no fox in any) — the backdrop looks the same before and after the restore in every pair
- [ ] 4.10 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in an earlier `check` log: `Tests  3891 passed (3891)`, `e2e hook: absent (2 chunks checked)`)

### Phase 5: The backdrop survives a context restore — e2e (#12, #11)

#### Automated

- [x] 5.1 Spec red before (deliberate breaks, each run alone with `-g`: remove `WelcomeScene`'s listener → the welcome test red with `redraws 0` and pixel `[0,0,0,0]`; remove `TaskScene`'s listener → both task tests red; make `TaskScene`'s handler return early while `this.sys.isSleeping()` → only the room test red; each restored), green after — SHA
- [ ] 5.2 `npx playwright test tests/e2e/backdrop-restore.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- [ ] 5.3 Full local gate green

### Phase 6: A missing fox pose hides the fox for the whole round and is named — e2e (#11, #14)

#### Automated

- [ ] 6.1 Spec red before (deliberate breaks, each run alone with `-g`: restore the per-pose `textures.exists` check in `GuideFox.show` and drop the constructor rule → "every phase" red (fox visible at idle); delete the `recordFallback` call → "pictures section" red; pass no `noStandIn` in `UIScene` → "pictures section" red on the exact count line; each restored), green after
- [ ] 6.2 `npx playwright test tests/e2e/fox-guide.spec.ts tests/e2e/health-lines.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<phase-5 e2e count> + 2`; total equals `npx playwright test --list | tail -1`
- [ ] 6.3 Full local gate green
