---
change_id: audit-backdrop-fox
title: Salon backdrop after a WebGL context loss, honest backdrop record, missing fox named in "Obrazki"
status: planned
created: 2026-10-24
updated: 2026-10-24
archived_at: null
---

## Notes

Non-roadmap fix change of run 2026-10-24-audit-backdrop-fox (no roadmap row, no roadmap edit). Source: the maintainer's
"zrob pr naprawczy" (2026-10-24) for the two open observability audits:

- the audit report on branch docs/observability-audit-2026-10-22-notebook-polish (PR #101, report of 2026-10-23 07:42):
  B-1 (MEDIUM, backdrop lost after a WebGL context loss), B-2 (LOW, the backdrop record says what was asked, not what was
  drawn), C-1 (LOW, `docs/art-inventory.md` still names the old font file);
- the audit report on branch docs/observability-audit-2026-10-23-fox-guide (PR #104, report of 2026-10-24 18:25):
  G-1 (LOW, a missing fox is not named for the parent and the "Obrazki" sentence is untrue for it), G-2 (LOW, one missing
  pose makes the fox blink by round phase, and the hook loses the requested pose).

Neither report is on main; they are cited in prose only. Their ids collide with older audits (an older "G-2" exists in
`context/archive/2026-10-16-stale-tab-and-health/follow-ups/review-fixes.md` about the fallback choice): in this change
B-1, B-2, C-1, G-1, G-2 always mean the PR #101 / PR #104 findings.

Pre-agreed scope (context/runs/2026-10-24-audit-backdrop-fox/scope.md, items 1-8):

1. B-1: every scene that owns a `SalonBackdrop` listens to the renderer's restore event and redraws through its refresh
   path; one console line per redraw; a runtime counter in the e2e hook; an e2e test forces `WEBGL_lose_context`
   (lose + restore) and proves the backdrop is drawn again. Phaser API used is pinned in `tests/phaserLoaderPin.test.ts`.
2. B-2: the backdrop record carries `drawn`, `blurred`, `renderer` ('webgl' | 'canvas') and a redraw count (runtime only,
   hook snapshot); one e2e pixel read proving the backdrop texture is not the plain wash colour.
3. C-1: `docs/art-inventory.md` names `public/fonts/MartynkaNext.ttf` (plain zero, `npm run font`, `tests/fontZero.test.ts`).
4. G-1 (with fox follow-up F6): `GuideFox` records its fallback (`recordFallback`, `REGISTRY_KEYS.artFallbacks`, `guide`
   in `FallbackWhere`/`FALLBACK_ORDER`); the parent reads a true sentence for the fox (no stand-in, no "napis lub rysunek"
   claim). Text only in `src/data/pl.ts`.
5. G-2: a fox with ANY pose texture missing is not shown for the whole session; the hook snapshot carries `requested`
   beside `pose`; one test with one pose missing (e2e seam inside the `e2eArt` marker, or a unit test if enough).
6. No game logic, balance, curriculum or child-facing content change; save stays v4; nothing new in the save.
7. Nothing else from the audits (N-7, N-8, A-1 etc. stay open).

## Scope claims re-verified against the repo (branch `feat/audit-backdrop-fox` at `e020886`)

| claim (scope.md / audits) | repo now | correction |
|---|---|---|
| The backdrop is a `DynamicTexture` in `SalonBackdrop` | `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render`: `textures.addDynamicTexture`, `dt.draw(holder)`, `dt.render()`, one image + wash rectangle; a new key `salon-backdrop-<serial>` per render; `clear` removes the old texture | none |
| Scenes that show it: `TaskScene`, `WelcomeScene`, "any other" | only those two construct `SalonBackdrop` (`grep`); no other `addDynamicTexture`/`RenderTexture` in `src/`; `starBurst` uses `Graphics.generateTexture` (audit: canvas-backed, survives — not re-proven) | none for the list; research confirms whether `generateTexture` in Phaser 4.2.1 is GPU-bound |
| Scenes "call their existing refresh path" | `TaskScene.refreshBackdrop` exists (private; also stores `backdropRooms`); `WelcomeScene` has NO refresh method: `create` calls `this.backdrop.render(...)` inline | WelcomeScene needs a small refresh method (extract from `create`); not a new path, the same `render` call |
| No listener for context loss/restore in `src/` | `grep restorewebgl\|contextlost\|contextrestored\|RESTORE_WEBGL` in `src/` → nothing | none |
| Phaser 4.2.1 restore event | `node_modules/phaser` is 4.2.1; `Renderer.Events.RESTORE_WEBGL` = `'restorewebgl'`, emitted by `WebGLRenderer` "after all WebGL resources have been recreated", docs say dynamic textures must be redrawn by the game; `LOSE_WEBGL` also exists; `DynamicTexture` class comment: "You are responsible for the redrawing logic" | none; research checks the emitter (`game.renderer.on`) and whether a removed/re-added DynamicTexture works after restore |
| Scene sleep: TaskScene sleeps while the room is shown | `TaskScene` has `sleep`/`wake` listeners; `onWake` re-captures when `REGISTRY_KEYS.rooms` changed | a restore while TaskScene sleeps must still lead to a redraw (on the event or at wake): research decides |
| "a runtime counter in the e2e hook" | the task backdrop record is built in `TaskScene.snapshot` (`TaskSnapshot.backdrop: { mode, captures }`), the welcome one in `WelcomeScene.backdropState`, which `src/testing/e2eHook.ts` only forwards | the new fields go into `SalonBackdrop` getters + those two snapshot builders (and `TaskSnapshot` type), not into `e2eHook.ts` logic |
| Pin the used Phaser API in `tests/phaserLoaderPin.test.ts` | the file exists: version check + loader paths + audio decode seam (`describe('phaser loader pin')`, `describe('phaser audio decode seam pin')`) | a third `describe` for the renderer restore event / `DynamicTexture` API (name may say more than "loader": file name kept, as precedent with the decode seam) |
| B-2: `captureCount += 1` before `if (dt)` | confirmed in `SalonBackdrop.render`; blur only under `renderer.type === WEBGL` via `enableFilters().filters?.internal.addBlur` (optional chain: a missing `filters` is silent) | none |
| B-2: renderer 'webgl' \| 'canvas' | `src/main.ts` game config `type: AUTO` | none |
| B-2: e2e pixel read of the backdrop texture | `DynamicTexture.snapshotPixel(x, y, callback)` exists in 4.2.1 (async callback) | research proves it works in headless Chromium under WebGL and picks the pixel (a point where the salon is not wash colour) |
| B-1 e2e: force `WEBGL_lose_context` | Playwright Chromium (headless, e2e hook build on 4397) — extension availability not yet observed | research checks `getExtension('WEBGL_lose_context')` in the e2e Chromium; if absent, the fallback is a direct emit of the restore event (weaker, recorded) |
| C-1: one line in `docs/art-inventory.md` | TWO places: the sentence "Font `AtkinsonHyperlegibleNext.ttf` jest identyczny we wszystkich paczkach i w `public/fonts/`" and the table row "Font \| wszystkie paczki \| identyczny z `public/fonts/`"; `public/fonts/` holds `MartynkaNext.ttf` and `OFL.txt` | fix both |
| G-1: `recordFallback`, `REGISTRY_KEYS.artFallbacks`, `FallbackWhere`/`FALLBACK_ORDER` | `src/ui/artFallbacks.ts` `recordFallback`; `src/core/artPick.ts` `FallbackWhere` = wallet \| notebook \| miniature \| loading, `FALLBACK_ORDER` the same; callers `CoinWallet`, `UnlockCard`, `RoomDoneCard`, `BootScene` — not `GuideFox` | none |
| G-1: the parent line | `pl.settings.uiArtMissing` ends "Na tych ekranach zamiast obrazka jest napis lub rysunek."; `pl.settings.artFallback` is "Zamiast obrazka gra rysuje: …" with `artFallbackNames`; `artHealthLines` (`src/core/artHealth.ts`) builds the `artFallback` line from `FALLBACK_ORDER` | adding "lisek" to `artFallbackNames` alone would put it under "gra rysuje", which is untrue too: the fox needs its own true sentence (a `guide` entry kept out of the "rysuje" list, so `artHealthLines` changes), see decision D3 |
| G-1/G-2 hook | `artFallbacksSnapshot` already exists in `src/testing/e2eHook.ts` (task and loading snapshots), so a `guide` entry shows without hook code; the fox record is `GuideFox.snapshot` (`pose, visible, rect, interactive, pops`) via `TaskSnapshot.guide` in `TaskScene.ts` | `requested` goes into `GuideSnapshot` |
| G-2: one missing pose blinks | `GuideFox.show` checks `textures.exists(key)` per pose and sets `pose = null`, `visible = false` for a missing one | none |
| G-2 seam inside the `e2eArt` marker | `E2EArtSeam` in `src/testing/e2eHook.ts` = missing \| corrupt \| room \| stall \| stallall \| ui; `BootScene` UI queue: `seam === 'ui' ? UI_MISSING_URL : art.url`; marker `e2eArt` already in `E2E_HOOK_MARKERS` (`vite/e2eHookGuard.mjs`) | a new seam value (e.g. `fox`) is added to the union, the parser and that branch; the value string itself must not need a new marker (the build guard already fails on `e2eArt`) |
| Save stays v4 | `SAVE_VERSION = 4` in `src/core/save.ts`; nothing planned enters `SAVE_KEYS` | none |
| Gap 168 | `docs/design-gaps.md` row 168: "A missing pose texture shows no fox … (no text change, scope item 8)" | row 168 is updated by G-1/G-2 (whole-session hide, parent sentence) |

## Design kit views and spec sections this change binds (profile § 6)

- No kit view covers any visible part of this change. The kit has no settings panel (gap 26), no line for drawn fallbacks
  (gap 147), no guide view or missing-pose rule (gaps 165, 168), and blurs a static room picture (gap 155).
- B-1/B-2: no visible change when everything works; after a context restore the backdrop must look as before (gap 155).
  Console lines are developer-facing English (like every `console.warn` in `src/`), not player copy.
- G-1: copy keys `pl.settings.uiArtMissing`, `pl.settings.artFallback`, `pl.settings.artFallbackNames`, plus one new key
  for the fox sentence under `pl.settings` (wording decided in plan, short Polish, read like gap 147). DESIGN-GAP: the kit
  is silent on parent text for a picture with no stand-in → new gap row in `docs/design-gaps.md` (or row 168 amended).
- G-2: the child sees no fox for the whole session when any pose is missing → row 168 amended (DESIGN-GAP).
- Spec: PRD FR-037 (silent fox, decorative); `Martynka-urzadza.md` § 14 working rules (no player text in scenes, text in
  `data/`); profile § 6 tokens rule (no new colours expected; the wash colour stays `PAGE_BACKGROUND`).

## Migration

None expected. Save format stays v4 (`SAVE_VERSION` 4); every new record (backdrop `drawn`/`blurred`/`renderer`/redraws,
fox `requested`, the `guide` fallback) is runtime only, outside `SAVE_KEYS`. Profile § 4: no database.

## Open follow-ups triggered by this slice

| follow-up | trigger | take |
|---|---|---|
| FU-FG F6 "Obrazki" sentence for a missing fox (`context/archive/2026-10-23-fox-guide/follow-ups/review-fixes.md`) | next change to `pl.settings.uiArtMissing` | **folded in** (= G-1, scope item 4) |
| FU-NP 16 (`context/archive/2026-10-22-notebook-polish/follow-ups/review-fixes.md`): `SalonBackdrop.render` assumes `holder.destroy(true)` frees the filter camera; `WelcomeScene.backdropState` sits under the JSDoc of `targets` | next change to `SalonBackdrop` / `WelcomeScene` | **partly folded in**: the filter-camera release is read in the Phaser 4.2.1 source by research (a redraw per restore repeats `enableFilters`; a leak would grow), and the misplaced JSDoc is fixed since `WelcomeScene` is touched. The `Keypad`, `starBurst`, `barSpan` parts stay open. |
| FU-NP 14 backdrop re-capture cost | a playtest note of a stale piece | not fired, stays |
| FU-NP 5 `FontFace` load limit | change to font loading in `BootScene` | not fired (C-1 is docs only), stays |
| FU-FG F3 512 px art, F4 boot budget | resolution/size change; `bootBudget` red | not fired (no new art files), stays |
| Health-lines FU 20 "gra rysuje: zeszyt" for the book icon | a change to `artFallback` / `recordFallback` in `UnlockCard` | not fired unless the plan rewrites `pl.settings.artFallback`; if it does, fix the icon wording in the same edit (decision D5) |
| Generic triggers on `src/core/artHealth.ts` / `src/ui/dom/artHealthView.ts` (ASL-02..09, A-5, A-11, L-6, L-8, F4 of final-art-salon, the 2026-10-16 G-2/G-3/B-4/B-5, "Kod: line not muted") | next change to those files | G-1 is expected to touch `artHealthLines` (`artHealth.ts`) only; those items are re-recorded as open, not folded (scope item 8). `artHealthView.ts` is kept untouched if the new line fits the existing line rendering |

## Autonomous decisions

- **D0 Scope items 1-8**: pre-agreed by the maintainer 2026-10-24 (scope.md); taken as written, including "fold in nothing
  else". Would change: a new maintainer instruction.
- **D1 Next step `/10x-research`** (not the skill's default `/10x-plan`): chosen because the step prompt fixes it and the
  change has real unknowns: Phaser 4.2.1 restore behaviour of a removed/re-added `DynamicTexture` and of the filter camera,
  `snapshotPixel` in headless Chromium, `WEBGL_lose_context` availability in the e2e browser, and a redraw while
  `TaskScene` sleeps. Rejected `/10x-frame`: the framing is pre-agreed. Would change: nothing (prompt-fixed).
- **D2 Redraw path**: one `refresh` per scene, reused by the restore listener (TaskScene `refreshBackdrop`; WelcomeScene gets
  the extracted equivalent); the listener is removed on `shutdown` like the scene's other `game.events` listeners.
  Rejected: a listener inside `SalonBackdrop` itself (it would need the registry and the room id, which the scenes own).
  Would change: research finding that Phaser restores the DynamicTexture's framebuffer but not its contents only when the
  texture object is rebuilt — then the widget may own a `rebuild()` and the scenes just call it.
- **D3 Fox parent sentence**: a separate true sentence for screens without a stand-in (the fox), keyed under `pl.settings`,
  with `guide` in `FallbackWhere`/`FALLBACK_ORDER` but kept out of the "gra rysuje" list. Rejected: "lisek" inside
  `artFallbackNames` under "Zamiast obrazka gra rysuje" (untrue: nothing is drawn), and rewording `uiArtMissing` only
  (still no name for the fox). Would change: the maintainer's wording, or research showing `uiArtMissing` can name the fox
  in one sentence with no second line.
- **D4 G-2 test form**: a pure availability rule (all three pose keys exist → fox, else none for the session) unit-tested,
  plus one e2e with a new `e2eArt` seam value missing only one pose (the scope prefers an e2e seam; the snapshot
  `requested` field is only observable through the scene). Rejected: unit test alone (does not prove the scene never shows
  the fox in another phase). Would change: research finding the seam cannot be added without a new build-guard marker
  (then the unit test alone, recorded).
- **D5 Health-lines FU 20**: not folded unless `pl.settings.artFallback` is edited anyway. Would change: the plan editing that
  string.
- **D6 Design gaps**: row 168 amended (whole-session hide, parent sentence) and one new row for the fox "Obrazki" sentence
  if the plan does not fit it into 168; no row for B-1/B-2 (no visible change). Would change: a visible difference after
  restore found by research (e.g. black frame before redraw) → a gap row.
- **Plan step (P-1..P-11 in `plan.md` § Autonomous decisions)**: six phases (tdd rules → fox widget → backdrop → docs and
  sweep → two e2e phases); `pixel()` returns `null` under Canvas (source: the Canvas snapshot is an async Image); the
  Chromium INVALID_OPERATION log on restore accepted (no console assertions); G-2 e2e through `page.route`, which departs
  from scope item 6's literal options (`[human]` row 4.8); parent wording chosen autonomously (`[human]` row 4.7); the pixel
  through a separate hook getter `backdropPixel`. Would change: see each decision's reversal condition in `plan.md`.
