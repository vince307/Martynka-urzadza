---
date: 2026-10-12T20:30:43+02:00
researcher: Claude (10x-research, subagent)
git_commit: dc4ec0c56780a1bdfb73ab696346d52827f8a46e
branch: feat/e2e-local-gate
repository: Martynka-urzadza
topic: "Grounding the test-plan refresh for a LOCAL browser e2e layer (Playwright, Chromium, not in CI)"
tags: [research, test-plan, e2e, playwright, pwa, service-worker, overlay, s-04, s-11]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (10x-research, subagent)
---

# Research: local browser e2e layer for the test-plan refresh

**Date**: 2026-10-12T20:30:43+02:00
**Researcher**: Claude (10x-research, subagent)
**Git Commit**: dc4ec0c (working tree: this change folder untracked, `designs/` holds the maintainer's untracked work)
**Branch**: feat/e2e-local-gate
**Repository**: Martynka-urzadza

## Research Question

Ground the refresh of `context/foundation/test-plan.md` for a LOCAL browser e2e layer (Playwright, Chromium; not in CI). For each browser-level risk the maintainer chose (change.md Notes, decisions 1–3): ground the real failure path in code, verify or correct the response intent, name the cheapest layer, flag what is speculative. Also: ports, the cost of one run, how the local gate would run it (profile `GATE_E2E`). The test plan itself stays anchor-free; anchors live here.

Maintainer decisions taken as fixed (not re-litigated): e2e is a local gate and stays out of CI (§7 keeps the CI exclusion); the four risks (offline start, S-04 round by touch, update keeps state, "Obróć tablet" overlay); no e2e budget for scene looks or task content; WebKit and performance recorded as open, iPad stays manual.

Decisions taken in this step instead of asking (the skill's questions, decided by the researcher): Context7 was used for Playwright facts; Playwright was not installed and no long-running server was started (instruction); `npm run build` was run once to inspect `dist/sw.js`; the hook recommendation for S-04 is a recommendation for the S-04 plan, not a decision.

## Summary

1. **Offline start** is real and cheap to prove in Chromium. The production build precaches 10 URLs including `index.html` and the 3 `_app/` bundles, registers a navigation route bound to `index.html`, and activates with `skipWaiting` + `clients.claim` (observed in `dist/sw.js` built at dc4ec0c). Registration runs only in production and only after `window.load` (`src/pwa/registerServiceWorker.ts:5-11`). Proof: first visit → wait until `navigator.serviceWorker.controller` is set → `context.setOffline(true)` → reload → assert the navigation and the 3 bundles came `fromServiceWorker()` and `#game-container canvas` exists. Cheapest layer: **local e2e (Chromium)**; nothing below a browser runs a service worker. Proof marker today: canvas present + `fromServiceWorker()`; the build id is drawn on the canvas (`src/scenes/BootScene.ts:66-74`) and is not readable from the DOM.
2. **"Obróć tablet"** is pure CSS: `.overlay` is `display: none` (`src/style.css:41-58`) and `@media (orientation: portrait)` flips `.overlay-rotate` to `flex` (`src/style.css:103-107`). A Playwright viewport change (`page.setViewportSize`) re-evaluates the media query, so `toBeVisible()` / `toBeHidden()` on `.overlay-rotate` proves it. Cheapest layer: **local e2e**, about a second on the same server; jsdom/happy-dom do not compute media-query cascades, so a unit test could only grep the CSS text (weak). This also replaces the iframe workaround the profile needs for Claude in Chrome (`context/foundation/autonomous-run.md:129,137`).
3. **Update keeps state**: the silent update exists today (`vite/config.shared.mjs:25-28,55-57`, `registerType: 'autoUpdate'`, `injectRegister: null`), but there is no state yet: `src/storage/` is empty and save/migrations are roadmap S-11 (`context/foundation/roadmap.md:261-271`). **Testable now**: build A is served, then build B; the open page keeps A, the next launch runs B, and B still boots offline. **After S-11**: state written under A is identical under B (US-04). Two builds need different build ids: `GITHUB_SHA` overrides the git SHA (`vite/config.shared.mjs:11-15`). `vite preview` serves `dist/` with `sirv(..., { dev: true })` (`node_modules/vite/dist/node/chunks/dep-3O3b9SCF.js:48641-48643`), so a rebuild into the same `outDir` is served without restarting the server (inferred from `dev: true`, not run).
4. **S-04 round by touch** (not built): Phaser listens to touch on the canvas when touch is detected at boot (`node_modules/phaser/src/device/Input.js:39-42`, `node_modules/phaser/src/input/touch/TouchManager.js:332-335`) and maps page coordinates through the scale manager (`node_modules/phaser/src/input/InputManager.js:1038-1039`). Recommendation for the S-04 plan: **a read-only test hook compiled in only for an e2e build** that exposes the round state from `core/` (task index, choices, correct answer, stars, phase: first try / hint / worked solution) and the tap targets in 1920×1080 scene space; the test taps with `page.touchscreen.tap` at coordinates converted through the canvas bounding box (real input path, `hasTouch: true`). Rejected: pure coordinate tapping (cannot know the right answer), a DOM mirror in the shipped build (second rendering path to keep in sync).

Corrections to assumptions (details below): `npm run preview` without `--port` binds **4173**, a protected port (Vite default, `node_modules/vite/dist/node/constants.js:142`, `vite/config.prod.mjs` sets no `preview.port`); emulating an Android tablet user agent shows the install-hint overlay over the canvas (`src/pwa/platform.ts:41-42`, `src/style.css:75-77`); Playwright supports service workers only on Chromium, so WebKit cannot automate the offline risk at all and the iPad stays manual.

## Detailed Findings

### 1. Offline start of the production build

Failure path in code:
- PWA config: `vite/config.shared.mjs:25-60`. `registerType: 'autoUpdate'` (`:28`), own registration (`injectRegister: null`, `:30`), precache globs `**/*.{js,css,html,png,webp,ogg,m4a,woff2}` (`:51`), 10 MiB per-file limit (`:54`), `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`, `inlineWorkboxRuntime` (`:55-58`).
- Registration: `src/pwa/registerServiceWorker.ts:5-11`: skipped when `import.meta.env.DEV` or no `serviceWorker` in navigator; registers `/sw.js` scope `/` on `window` `load`; a failed registration is swallowed (`.catch(() => undefined)`, `:11`). A failing registration therefore produces no page error; only the absence of a controller shows it.
- Boot order: `src/main.ts:27-30` creates the game, mounts the rotate overlay and the install hint, then calls `registerServiceWorker()`. All of `main.ts` is one module importing Phaser statically (`src/main.ts:1`); if either bundle is missing offline, nothing runs (no canvas, no `.overlay-rotate`).
- Built output at dc4ec0c (`npm run build`, ~7 s wall clock): `dist/sw.js` precache manifest has 10 entries: `index.html`, `favicon.png`, 4 icons, `_app/phaser-*.js` (1 375 913 bytes), `_app/index-*.css`, `_app/index-*.js`, `manifest.webmanifest`; it calls `skipWaiting()` and `clients.claim`, and registers a `NavigationRoute` bound to `index.html` (`createHandlerBoundToURL("index.html")`), so a reload of `/` offline is answered from precache.
- Build id: `__BUILD_ID__` is defined in `vite/config.shared.mjs:64-66` and drawn as canvas text in `src/scenes/BootScene.ts:66-74`. It is in the entry bundle as a string literal (the deploy smoke checks that, `scripts/check-deploy.ts:94`), but not in the DOM.

Playwright facts (Context7, `/microsoft/playwright` docs `service-workers-js-python.md` and `types.d.ts`; checked 2026-10-12):
- "Service workers are only supported on Chromium-based browsers."
- `serviceWorkers?: 'allow' | 'block'` is a context option; `'block'` must be set explicitly to disable them (release-notes example), so the default allows them. Setting `serviceWorkers: 'allow'` explicitly is harmless and documents intent.
- `BrowserContext 'serviceworker'` fires **before** the worker controls the page; the docs' activation wait is `getRegistration()` → `active.state === 'activated'` or a `controllerchange` listener.
- `Response.fromServiceWorker()` is `true` for page requests answered by the worker's fetch handler; `context.route` and context request events also see requests made by the worker itself.
- `context.setOffline(true)` / the CLI `network-state-set offline` make outgoing requests fail; the docs' own example is "go offline → reload → page shows its offline state".

Response intent, verified with one refinement: "load, cut the network, reload, the game boots" holds only if the first load waits for **control**, not registration. Because registration waits for `window.load` and then precaches ~1.4 MB, cutting the network right after `goto` races the install. Wait on `navigator.serviceWorker.ready` and then for `navigator.serviceWorker.controller !== null` (with `clientsClaim` the first page becomes controlled without a reload). After the offline reload, assert: (a) the navigation response and the 3 `_app/` responses have `fromServiceWorker() === true`, (b) `#game-container canvas` is attached, (c) no `pageerror`. Speculative: whether `setOffline` also cuts fetches the worker itself makes in current Chromium is not verified here; it does not change the verdict, because precached routes are served from cache and (a) is what proves the cache answered.

Proof marker: canvas + `fromServiceWorker()` is enough for "boots offline" today with no product change. Optional cheap marker for the plan: `document.documentElement.dataset.build = __BUILD_ID__` in `src/main.ts` (not `core/`, so lint allows DOM). Without it, the entry script's hashed `src` in `index.html` already differs between builds whose ids differ (the define changes the bundle content), which is usable for risk 3.

Cheapest layer: local e2e (Chromium). The deploy smoke (`scripts/check-deploy.ts`) already proves the server side (headers, precache list vs bundles); it cannot prove a browser boots from cache. Keep both.

### 2. "Obróć tablet" overlay

- Mounted unconditionally: `src/main.ts:28` → `src/ui/dom/rotateOverlay.ts:10-21` (`.overlay.overlay-rotate`, texts from `src/data/pl.ts:6-8`).
- Visibility is CSS only: `.overlay { display: none }` (`src/style.css:41-44`), `.overlay-rotate { z-index: 20 }` (`:99-101`), `@media (orientation: portrait) { .overlay-rotate { display: flex } }` (`:103-107`). Small doc drift: the comment in `src/ui/dom/rotateOverlay.ts:6` says `public/style.css`; the file is `src/style.css`.
- A media `orientation` is portrait when the viewport height ≥ width, so `page.setViewportSize({ width: 768, height: 1024 })` → visible, `{ width: 1024, height: 768 }` → hidden, in one test. Also assert the canvas is still attached in portrait (the game keeps running underneath, comment at `rotateOverlay.ts:4-8`).
- Cheaper layer? None with real signal: jsdom does not implement layout or media-query cascade for `getComputedStyle`; a unit test could only assert the CSS text contains the rule. The e2e test needs no service worker and adds about a second on the same server.
- Verdict: intent correct; cheapest real layer is local e2e. It runs against the same preview server as risk 1.

### 3. Update keeps state

- Today: silent update at the next launch (`vite/config.shared.mjs:26-28`, `src/pwa/registerServiceWorker.ts:1-3`). Old precache is deleted on activate (`cleanupOutdatedCaches`, `:57`), so an update that breaks precache would break the next offline start.
- No state exists to keep: `src/storage/` is empty (CLAUDE.md "Current state"), save and migrations are S-11 (`context/foundation/roadmap.md:261-271`); the profile records the same (`context/foundation/autonomous-run.md:43-44,73,78`).
- Testable now (no product change): build A with `GITHUB_SHA=<a>`, start preview, first launch until controlled; rebuild B with `GITHUB_SHA=<b>` into the same `dist/` (preview serves it without restart, `sirv` `dev: true`, inferred); reload once → the page still runs A (worker B installs and claims, the page is not reloaded); reload again → B runs; then offline reload → B boots from cache. Distinguish A and B by the entry script hash or the optional `data-build` marker. Flag: the exact number of reloads before B is served is an inference from `skipWaiting` + `clientsClaim` + the navigation route; the test should poll for B within a small bounded number of reloads instead of hard-coding one.
- After S-11: write state under A through the product (profile rule: never by writing IndexedDB, `context/foundation/autonomous-run.md:139`), update to B, assert the same stars/room/stage. Save-format compatibility itself stays unit (test-plan phase 4, fixture saves); e2e only proves the browser path (IndexedDB survives the worker swap, autosave on `visibilitychange`).
- Verdict: the maintainer's split (update mechanics now, full coverage after S-11) is correct. Cheapest layer: unit for migrations (phase 4), local e2e for the update path. Cost: two builds (~7 s each) in one test; this is the most expensive spec.

### 4. Round playable by touch (S-04, not built)

- Phaser input path: touch detected at boot from `'ontouchstart' in document.documentElement` or `navigator.maxTouchPoints >= 1` (`node_modules/phaser/src/device/Input.js:39-42`); touch listeners are attached to the canvas (`TouchManager.js:332-335`); page coordinates are transformed by the scale manager (`InputManager.js:1038-1039`), so taps at scene coordinates converted through the canvas bounding box hit the right object under `Scale.FIT` + `CENTER_BOTH` (`src/main.ts:17-22`). A Playwright context with `hasTouch: true` makes `maxTouchPoints` non-zero (inferred from Playwright's touch emulation; not run here) and `page.touchscreen.tap(x, y)` dispatches touch events.
- Options considered:
  - (a) Coordinates only, from `src/data/layout.ts`: exercises real input, but the test cannot know which tile is correct (tasks are random) and must hard-code layout. Rejected alone.
  - (b) DOM mirror (hidden element listing prompt/choices/stars) in the shipped build: readable, but a second rendering path that can drift from the canvas and ships answers in the DOM. Rejected.
  - (c) Test hook in an e2e-only build: `if (import.meta.env.VITE_E2E_HOOK === '1') window.__martynkaTest = {...}`, dead-code eliminated from the production build. Exposes read-only state from `core/` (round index, current task's choices and answer, star total, phase) and target rects in scene space. **Recommended.**
  - (d) Seeded rng via URL (`?seed=N`) in the e2e build: makes the round deterministic; useful together with (c) for reproducible traces, not instead of it.
- Requirement for the S-04 plan: the hook reads state, never sets it; taps go through the real touch path; the production `dist/` must not contain the hook (a grep of `dist/_app/*.js` for the hook name is a cheap check); the e2e build goes to its own `outDir` so the production artifact used for risks 1–3 is the real one. Scenarios to cover: 5 tasks, a star per correct task, a wrong answer → hint and second try (star still given, FR-007/FR-008), the +2 bonus for a clean round. Touch latency (< 100 ms NFR) is performance, recorded as open.
- Pitfall: an Android device preset (user agent) makes `detectPlatform` return `android` (`src/pwa/platform.ts:28-30`) and `shouldShowInstallHint` true in a tab (`:41-42`), and `.overlay-install` is `display: flex` at z-index 10 (`src/style.css:57,75-77`) over the canvas. Use desktop Chromium with `hasTouch: true` and a 1024×768 viewport, or dismiss the hint first.
- Cheapest layer: round logic (stars, second try, bonus) is unit in `core/` (TDD); e2e proves only that a child can play it by touch on the built page.

### Ports, gate wiring, cost

- Ports: gate 4398, visual 4399; protected `8080 4173 4321 5000 5433 7000 54321-54324 54327` (`context/foundation/autonomous-run.env` `GATE_PORT`, `VISUAL_PORT`, `PROTECTED_PORTS`). `npm run preview` with no port binds 4173 (Vite `DEFAULT_PREVIEW_PORT`, `node_modules/vite/dist/node/constants.js:142`; no `preview.port` in `vite/config.prod.mjs:1-20`). The Playwright `webServer` command must be `npx vite preview --config vite/config.prod.mjs --port 4398 --strictPort` with `reuseExistingServer: false` (never attach to a stray server). The profile's `DEV_CMD` uses the dev config (`autonomous-run.env` `DEV_CMD`), which has no service worker; e2e must not use it.
- Gate wiring: `baseline.sh` runs `GATE_E2E` only when `E2E=on`, without starting a server (`.claude/skills/10x-autonomous-run/scripts/baseline.sh:45-48`), unlike the smoke slot (`:36-43`). So the e2e command must own the server: Playwright `webServer` (build + preview on 4398). Candidate: `GATE_E2E="npx playwright test --project=chromium"` with `PARSE_E2E` matching Playwright's `[0-9]+ passed`; set `E2E=on` and add `test-stack.md` § E2E + `playwright.config.*`, which `preflight.sh:82` checks. That is `/10x-e2e-setup` and `/10x-autonomous-run --setup` work, outside this change (change.md).
- Cost of one run (estimate, nothing run): production build ~7 s (measured), preview start ~1 s, Chromium launch ~1–2 s, risk 1 + risk 2 ≈ 3–5 s, risk 3 adds a second build ≈ 8–10 s; total ≈ 15–30 s per gate run, comparable to the existing ~16 s local gate (`autonomous-run.md:35-38`). One-time cost: `@playwright/test` plus a Chromium download (~150 MB, not verified). The e2e build for S-04 adds another ~7 s once S-04 exists.
- Sandbox flag (speculative): launching Chromium inside the agent's Seatbelt sandbox and binding 4398 were not tried; `/10x-e2e-setup` should record whether the gate needs the sandbox disabled (profile § 8).

## Code References

- `vite/config.shared.mjs:11-23` - build id from `GITHUB_SHA` or git
- `vite/config.shared.mjs:25-60` - PWA options (autoUpdate, own registration, globs, skipWaiting, clientsClaim, cleanup)
- `vite/config.prod.mjs:1-20` - prod config, no `preview.port`
- `src/pwa/registerServiceWorker.ts:4-13` - production-only registration on `load`, errors swallowed
- `src/main.ts:12-30` - FIT/CENTER_BOTH config, boot order, overlays, registration
- `src/scenes/BootScene.ts:66-74` - build id drawn on canvas
- `src/ui/dom/rotateOverlay.ts:4-21` - rotate overlay (comment points to the wrong CSS path)
- `src/style.css:41-58,75-77,99-107` - overlay display rules, install hint, portrait media query
- `src/pwa/platform.ts:21-42` - platform detection and install-hint condition
- `node_modules/vite/dist/node/constants.js:142` - `DEFAULT_PREVIEW_PORT = 4173`
- `node_modules/vite/dist/node/chunks/dep-3O3b9SCF.js:48641-48643` - preview serves `dist/` with `sirv` `dev: true`
- `node_modules/phaser/src/device/Input.js:39-42`, `node_modules/phaser/src/input/touch/TouchManager.js:332-335`, `node_modules/phaser/src/input/InputManager.js:1038-1039` - touch detection, canvas listeners, scale transform
- `.claude/skills/10x-autonomous-run/scripts/baseline.sh:45-48` - `GATE_E2E` slot (local, gitignored)

## Architecture Insights

- The offline guarantee rests on "everything is loaded at start" plus `clientsClaim` (archived plan `context/archive/2026-10-11-installable-offline-pwa/plan.md:52`). A future lazy chunk would pass the deploy smoke's precache check only if it is precached, and would break an open page after an update; the offline e2e is the first automated test that would see a missing bundle from the browser side.
- DOM overlays are the only DOM text; everything else is canvas (`context/foundation/autonomous-run.md:141`). Browser tests therefore assert DOM overlays directly and the game through either `fromServiceWorker`/canvas presence (boot) or a test hook (S-04).
- `src/core/` has no Phaser or DOM (lint boundary), so the S-04 hook naturally reads `core` round state rather than Phaser game objects.

## Historical Context (from prior changes)

- `context/archive/2026-10-11-installable-offline-pwa/plan.md:117,279` - check 1.7 (SW controls the page, workbox cache with `_app/`, build SHA visible) done by the agent in Claude in Chrome on `npm run preview`: supported; this is what e2e risk 1 automates.
- `context/archive/2026-10-11-installable-offline-pwa/plan.md:166,292` - check 2.5 (portrait shows the overlay, landscape hides it) done manually: supported; e2e risk 2 automates it.
- `context/archive/2026-10-11-installable-offline-pwa/plan.md:305-306` - iPad and Android install/offline confirmed by the owner on devices: still the only WebKit evidence; stays manual.
- `context/archive/2026-10-11-installable-offline-pwa/research.md:29,47` - silent update semantics (no `virtual:pwa-register`, no reload during a round): supported by the current config.
- `context/foundation/test-plan.md` §7 "Browser e2e in CI" exclusion and its re-evaluate trigger: unchanged by decision 1.

## Related Research

- `context/archive/2026-10-11-installable-offline-pwa/research.md`
- `context/archive/2026-10-12-testing-deploy-smoke/` (phase 2: server-side PWA facts)

## Open Questions

- WebKit: Playwright supports service workers only on Chromium, so offline start on Safari/iPad cannot be automated with Playwright; WebKit could still cover the overlay and (after S-04) touch flow. Recorded as open per decision 3; iPad stays manual.
- Performance (offline start < 3 s, touch < 100 ms, PRD NFR): not chosen; a desktop Chromium timing would not represent a 3–4-year-old tablet anyway.
- Whether to add the `data-build` DOM marker (tiny `src/main.ts` change) or rely on the entry script hash: a plan decision for the e2e setup.
- Whether Chromium launches inside the agent sandbox, and whether `setOffline` reaches worker-originated fetches in the installed Playwright version: verify during `/10x-e2e-setup`.
- The exact reload count before build B is served (risk 3): verify empirically; tests should poll within a bound.
