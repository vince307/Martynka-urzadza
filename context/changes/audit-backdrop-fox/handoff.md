# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-research` step of run 2026-10-24-audit-backdrop-fox: `research.md` answers every unknown from `change.md` (Phaser 4.2.1 restore, e2e recipe, fox rule and copy) and proposes three phases. The next agent must not defer the backdrop redraw to a later frame or to `wake` (a synchronous `render` inside the `restorewebgl` handler is what avoids a blank frame), and must use `getContext('webgl')` (not `webgl2`) in the e2e spec.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 2 on top of `e020886`: `docs(audit-backdrop-fox): change identity (autonomous run)`, `docs(audit-backdrop-fox): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/research.md` | findings for B-1, B-2, C-1, G-1, G-2 with Phaser 4.2.1 source anchors, e2e recipe, proposed record fields, Polish copy, gap 168 text, phases with drivers |
| `context/changes/audit-backdrop-fox/change.md` | frontmatter only: `status: preparing`, `updated: 2026-10-24` |
| `context/changes/audit-backdrop-fox/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-backdrop-fox` |
| Phaser 4.2.1 source read | `WebGLRenderer.dispatchContextRestored` emits `'restorewebgl'` after `createResource` over all wrappers and `contextLost = false`; `dispatchContextLost` calls `preventDefault`; `GameObject.destroy` destroys `filterCamera`; `Graphics.generateTexture` uses `createCanvas`; `FilterList.addBlur` returns the filter |
| scratch Playwright 1.64 Chromium script (outside the repo, sandbox disabled) | WebGL via SwiftShader, Phaser `renderer.type` WEBGL; `WEBGL_lose_context` present; lose/restore fired both Phaser events; DynamicTexture pixel [255,0,0,255] before, [0,0,0,0] after restore; full re-render inside the handler gave the right pixel with no error; `canvas.getContext('webgl') === game.renderer.gl`, `getContext('webgl2')` null |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no product code; baseline on `main` `e020886` per the agent contract (unit 3891, e2e 155), inherited, unverified here |

No deliberate break (nothing to protect yet). Every browser and process the step started was closed by the research worker.

## 4. Next command

`/10x-plan audit-backdrop-fox`

## 5. Open

- Plan inputs (`research.md` § Proposed phases): Phase 1 tdd (`guideAvailable` in `src/core/guide.ts`, `guide` in `FallbackWhere`/`FALLBACK_ORDER`, `artHealthLines` `guide` line + `standIn` on the UI `missing` line, `pl.settings.guideMissing`, `uiArtMissing(count, total, standIn)`, `artHealthView.ts` `textOf` case); Phase 2 impl (`SalonBackdrop` record `drawn`/`blurred`/`renderer`/`redraws`/`pixel`, `restorewebgl` listener in `TaskScene` and `WelcomeScene` with `off` on shutdown, `WelcomeScene.refreshBackdrop`, JSDoc moved to `targets`, `GuideFox` once-per-scene availability + `recordFallback(scene, 'guide', 'none')` + `requested`, pin `describe` in `tests/phaserLoaderPin.test.ts`, `docs/art-inventory.md` two spots, gap row 168); Phase 3 e2e (lose/restore on welcome and task incl. room open, pixel + `redraws`; `page.route` abort of `fox-think.webp`).
- Proposed copy: `pl.settings.guideMissing` = "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka."; `uiArtMissing` second sentence only when a non-fox screen picture is missing.
- DESIGN-GAP: row 168 amendment text in `research.md` § Design source; no new row for B-1/B-2.
- Open questions: `snapshotPixel` sync-ness under the Canvas renderer (plan verifies or returns `null`); Chromium logs "INVALID_OPERATION: delete: object does not belong to this context" on restore (harmless; specs must not fail on it).
- Follow-ups: FU-NP 16 filter-camera part resolved by source (record it closed in the plan), its `Keypad`/`starBurst`/`barSpan` parts stay open; `artHealthView.ts` generic triggers fire (one new `case`) and are re-recorded as open, not folded. No `follow-ups/review-fixes.md` yet.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **R1 Redraw timing**: synchronous `backdrop.render` inside the `restorewebgl` handler, also while `TaskScene` sleeps. Rejected: redraw at the next frame or at `wake` (shows at least one frame of wash only). Why: the event fires after Phaser recreated every GL resource, before the next game step (source + observed). Would change: a Phaser update that emits the event before framebuffers are recreated (the pin test would turn red).
- **R2 Listener owner**: per scene (change.md D2 kept). Rejected: `SalonBackdrop` subscribing itself. Why: scope item 2 says the scenes call their refresh path, and TaskScene's `backdropRooms` bookkeeping lives in the scene. Would change: a third backdrop owner (then a shared helper).
- **R3 Pixel read**: a `SalonBackdrop` getter using `DynamicTexture.snapshotPixel` (synchronous under WebGL, texture framebuffer only), forwarded by the hook getter. Rejected: `renderer.snapshotPixel` (async, includes wash and notebook) and screenshot decoding (no PNG decoder dependency). Would change: the getter disturbing rendering in e2e.
- **R4 G-2 e2e seam**: `page.route` abort of `fox-think.webp` (precedent health-lines #14 G-1). Rejected: a new `E2EArtSeam` value (change.md D4's option). Why: no product/hook code for a test-only path, no build-guard question. Would change: the service worker serving the file despite `serviceWorkers: 'block'`.
- **R5 Fox line**: own `{ kind: 'guide' }` line plus a `standIn` flag on the UI `missing` line (D3 kept and extended). Rejected: "lisek" in `artFallbackNames` (untrue "gra rysuje"), and leaving `uiArtMissing` as is (untrue "napis lub rysunek" when only fox poses are missing). Would change: the maintainer's wording.
- **R6 No new DESIGN-GAP for B-1/B-2** (D6 kept): no visible difference after a synchronous redraw. Would change: a playtest showing a black frame after restore.
