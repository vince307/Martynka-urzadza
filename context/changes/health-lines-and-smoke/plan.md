# Health lines and smoke: what the parent panel and the deploy smoke say about pictures, sound and offline — Implementation Plan

## Overview

Slice 3 of the audit sweep 2026-10-16 (non-roadmap fix, autonomous run `2026-10-16-audit-sweep`): the deploy smoke asks
the server for every precached file and checks every art table, the "Gra bez internetu", "Obrazki", "Dźwięki" and
"Zapis gry" sections of the parent panel name the cause instead of a count or a false "ready", the boot loader logs
what failed with its table, URL and status and runs its limits on the wall clock, and the sound service stops hiding a
locked or missing audio device. Scope = `change.md` § Findings re-verified: 18 MEDIUM items (28 ids) and the in-scope
LOW ids; deferred LOW with triggers: O-1(b), the `deploy/` half of 2217 P-4, G-3 per-room thumbnail, G-6, ASL-05,
ASL-08 (written to `follow-ups/review-fixes.md` in phase 11).

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`, every frozen fixture `tests/fixtures/save-v*.json`
untouched). Everything new is runtime registry state (`REGISTRY_KEYS.*`, never in `SAVE_KEYS`), console output, panel
copy, a decode-result note, the deploy smoke or tests. **A phase that finds it must change what is saved or its
meaning stops with `STATUS: BLOCKED`.** Nothing under `deploy/` and not `.github/workflows/` changes.

## Current State Analysis

Grounded in `research.md` (Code References are the source, not re-searched) and re-checked on this branch at `58b6ea7`:

- **Smoke** (`scripts/check-deploy.ts` `main`): `/`, `/index.html` (cache-control only), manifest, `/sw.js` →
  `precacheFromSw`, `roomArtCheck(precache, ROOM_ART…)` and an unconditional `get('/assets/rooms/salon/architecture-after.webp')`
  (P-2: wrong on a rollback to a release with another salon), bundles + immutable, build id only with `sha7`, `www`
  redirect skipped for localhost. No request per precache entry (O-1/P-3); `TASK_ART`, `UI_ART`, `SOUNDS` never
  compared with the precache (S14-06/P-4 2217); `get` rethrows the bare error and the final handler prints
  `FAIL request error — <message>` without the path or "the release is already live" (P-4 0915). Last Deploy run
  38995649135 printed `all 20 checks ok`.
- **Service worker** (`src/pwa/registerServiceWorker.ts`, `src/core/swStatus.ts`): `register().then` handles `active`
  and `installing` only (O-4); no `registration.update()` (O-3); `emit` swallows a listener error with `catch {}` (O-5);
  `offlineView` maps `phase 'ready'` to line `ready` even when `error === INSTALL_FAILED` (O-2: a failed update behind
  an active worker reads "Gra jest gotowa" + `Kod: InstallFailed`). `vite/config.shared.mjs` has `registerType:
  'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`.
- **Boot loader** (`src/scenes/BootScene.ts` `preload`/`publish`/`create`): the `loaderror` listener labels every
  non-font, non-audio file "Task art failed to load: <key>" without URL or status and has a dead `file.type === 'font'`
  branch (A-3/L-3/B-5/U-3/S14-08, A-7); a decode failure (`ImageFile.onProcess` → `onProcessError`, no `loaderror`)
  leaves only a missing texture (A-4); health = `textures.exists`, no size check (ASL-07); the `Loader.Events.ADD`
  listener has no `try` (P-5); `armSlow`/cut timer run on `this.time.delayedCall` (Phaser's smoothed, pausable clock,
  B-3); `publish` writes `bootLoad = {cut, creates}` with no duration and no table (B-4/U-2/A-11); queue order is
  loading pictures, font, `TASK_ART`, boot sounds, `ROOM_ART`, other `UI_ART` (B-6); `E2E_BOOT_LIMITS` has no build
  marker (P-6). No font check exists (`grep document.fonts src/` empty).
- **"Obrazki"** (`src/ui/dom/artHealthView.ts` `createArtHealthView(view, roomView?, uiView?)`, `src/core/artHealth.ts`
  `artHealth`/`artHealthView`/`sectionState`, `src/ui/dom/settingsPanel.ts`): counts only (`pl.settings.artMissing`),
  "Uruchom grę ponownie" for every cause (ASL-02), no cause (A-5), no labels for room pieces (R-5), section hidden while
  task-art health is `unknown` (final-art-salon F4), DOM built directly so no test (L-8). Fallbacks chosen in
  `CoinWallet`, `UnlockCard`, `RoomDoneCard`, `LoadingScreen` reach only the e2e hook (U-1/G-2); `?e2eArt` has no
  value for `UI_ART` (G-7); `tests/uiArt.test.ts` checks table → file, not file → table (G-5).
- **Sound** (`src/ui/sound.ts` `createSoundService`, `src/core/sound.ts`, `src/storage/soundPrefs.ts`,
  `src/core/errorSignal.ts`, `src/ui/dom/errorBoundary.ts`): `musicLine` says `waitingUnlock` however many touches
  (M-1/S-4); `play` catch warns each call (S-10) and never grows the missing set; no-Web-Audio shows "12 not loaded"
  (S-9); `startMusic` ends every failure as `Music missing` (S-5); `parseSoundPrefs` falls back silently (S-7);
  `soundPrefsKept` is written only by `UIScene.applySettings` (M-2) and untested when false (FU-16);
  `installErrorBoundary` warns `signal.message` only for `QUIET_REJECTIONS` (S-2), and Phaser's
  `AudioFile.onProcess` drops the `decodeAudioData` promise.
- **Save notes and room** (`src/core/save.ts` `DecodeResult`, `src/core/migrations/legacySalon.ts` `LIFT_V2_SALON`,
  `src/main.ts` `start`, `src/scenes/RoomScene.ts` `slotTargets`): the salon carry logs only `Save migrated from vN`
  (M-4/R-3); a room whose task list grew past `tasksDone` is not logged (R-2); `slotTargets` skips an unreachable slot
  silently (R-6); `withoutArtBlocked` falls back silently (ASL-04/S14-05); a purchase under `?e2eSave=writefail` has no
  e2e (M-5); a single stalled task picture has no e2e (A-9).
- `docs/design-gaps.md` ends at row 138. `context/foundation/lessons.md` does not exist (nothing to apply).
- Baseline (contract, main `dfc49ae`, inherited, not re-measured): unit `Tests 3545 passed`, e2e `132 passed`. Every
  phase measures its own branch baseline and writes `baseline + delta`.

## Desired End State

- The Deploy smoke HEADs every precache entry of the served `sw.js` (status 200 and the media type for its extension),
  checks `TASK_ART`, `UI_ART`, `ROOM_ART` and boot `SOUNDS` against the precache only when a SHA is given, prints one
  `precache served: n/N` line with the first failures, names the path of a failed request and says the release is
  already live; a rollback run without a SHA passes on any release the server holds.
- "Gra bez internetu" says that an update failed while the current version still works offline; a waiting worker is
  tracked; the update check runs once per launch and its failure is logged; a listener error is logged.
- The boot log names the table (task, room, screen, sound), the URL and the HTTP status of a failed file; every missing
  texture has a cause (fetch, decode, cut, never started) and a wrong size is reported; the slow line and the total cut
  run on the wall clock; sounds are queued after every picture; `bootLoad` carries the duration and the cut per table.
- "Obrazki" shows each known line (task, room, screen pictures, font), the main cause with `Kod:`, per-folder counts,
  up to N labels, whether tasks are skipped, the build id, a cut line, and the screen fallback the child sees; advice
  to restart only when a restart can help.
- "Dźwięki" says when the device does not let the game play sounds (after N locked touches) and when there is no sound
  on this device; the music error names its cause; a failed effect warns once; invalid stored prefs warn; the prefs
  probe at start sets `soundPrefsKept`; a decode rejection is caught at its source with its key and name.
- "Zapis gry" says "Pokój przeniesiony na nowy wygląd" after the v2→v3 salon carry of this load; a grown room list
  and an art-filter fallback are logged; the e2e hook reports unreachable chosen slots.
- Verify: unit tests per phase (red first), the full local gate, e2e `+ 0` per code phase, `+ 2`, `+ 3`, `+ 2` in
  phases 12–14; the Deploy run after the merge prints `precache served: 121/121` (or the then-current count) and
  `all N checks ok`.

### Key Discoveries:

- Live server, 18 read-only requests 2026-10-17 (research § Live server observations): every precached extension
  answers `HEAD` 200 with the right type (`.ttf` → `font/ttf`, `.m4a` → `audio/mp4`, `.ogg` → `audio/ogg`,
  `.webp` → `image/webp`, `.png` → `image/png`, `.js` → `text/javascript; charset=utf-8`, `.css` → `text/css;
  charset=utf-8`, `/index.html` → `text/html; charset=utf-8` with no redirect, manifest → `application/manifest+json`);
  a missing file → 404; compressed `HEAD` of `index.html` reports `content-length: 13` (never assert length).
- Local `vite preview` answers a missing file with **200 `text/html`** and `no-cache` everywhere: the type assertion is
  the failure signal locally, and the existing immutable check fails on localhost (research Open Question 1).
- Phaser 4.2.1 (installed source): `loaderror` only in `LoaderPlugin.nextFile(file, false)`; `FILE_LOAD` in
  `nextFile(file, true)` before processing; an image or audio decode failure goes to `onProcessError` with no
  `loaderror`; a font never fires `loaderror`; `AudioFile.onProcess` calls `this.config.context.decodeAudioData(buf,
  ok, err)` and then sets `this.config.context = null` (the per-file seam for S-2).
- `registerServiceWorker` + `skipWaiting` + `clientsClaim`: a worker found at launch already claims the open page
  today without a reload (the browser's navigation update check). An `update()` on return from the background would add
  a new mid-session takeover path.

## What We're NOT Doing

- No save-format change (v4 stays), no new field in the save record, `MIGRATIONS[2]` output byte-identical.
- Nothing under `deploy/` (Caddyfile, scripts, bootstrap) and not `.github/workflows/`; no MIME or header change on the
  server; no build manifest emitted by `vite/`.
- No `registration.update()` on return from the background or on a timer, no change of `registerType`/`skipWaiting`/
  `clientsClaim`, no reload (autonomous decision 2).
- No `balance.loader.totalMs` change (no measured cold start; B-6 reorders only).
- No new view, card or style: every new line goes into the existing section components (`src/ui/dom/overlay.ts`
  `createText`, `artHealthView.ts`, `offlineView.ts`, the sound section of `settingsPanel.ts`, `saveHealthView.ts`).
  No child-facing text.
- No mastery change for art-filter fallbacks (ASL-04 logs only); no rule change in `withoutArtBlocked` (ASL-03 docs).
- Deferred LOW, each with a trigger in `follow-ups/review-fixes.md`: O-1(b) install error name from the worker, the
  `deploy/` half of 2217 P-4, G-3 per-room thumbnail, G-6 full-wallet nudge, ASL-05 stand-in label size, ASL-08 unlock
  card for an art-blocked step. Carried, not fired: A-6 per-file limit by size, A-8 retry count (unless phase 13 needs
  it), L-7 per-layer hook state, `FontFace` load limit, VO3 drawn wallet look.

## Implementation Approach

Pure rule in `src/core` (or `scripts/deploy-check/parse.ts` for the smoke) first with a failing unit test, then the
one call site (`check-deploy.ts`, `registerServiceWorker.ts`, `BootScene`, `sound.ts`, `main.ts`, a section renderer),
phase by phase, grouped by the code each phase touches so every phase is green alone. Panel sections follow the
existing pattern: a pure view/lines builder in `core` with exact `toEqual` oracles, a thin DOM renderer (no DOM test
environment, change.md decision 6). Phaser internals are touched only through seams pinned in
`tests/phaserLoaderPin.test.ts`. Each new `pl.ts` string gets a DESIGN-GAP row (139 onward, in phase order) and a
`[visual]` row. Phase 11 is the last `impl`/`tdd` phase (seam sweep, `CLAUDE.md`, follow-ups); phases 12–14 prove the
browser-level risks.

## Critical Implementation Details

- **The smoke must pass against the live server as observed.** Expected media type per extension (match before `;`):
  `js` → `text/javascript`, `css` → `text/css`, `html` → `text/html`, `png` → `image/png`, `webp` → `image/webp`,
  `webmanifest` → `application/manifest+json`, `ttf` → `font/ttf`, `m4a` → `audio/mp4`, `ogg` → `audio/ogg`; any other
  extension (e.g. `woff2`, none today) is status-only. Never assert `content-length`, `Cache-Control` or
  `Content-Encoding` per entry. `index.html`: 200 expected (observed); a 301/308 to `/` or `./` is tolerated for that
  entry only. HEAD with `redirect: 'manual'`, a fixed pool (8, a constant in `scripts/`), one retry per entry after
  `RETRY_DELAY_MS` on a network error only. Every per-entry HEAD carries `signal: AbortSignal.timeout(HEAD_TIMEOUT_MS)`
  (15 000, a constant in `scripts/`); an abort counts as a network error (one retry, then a failed verdict with reason
  `timeout`), so a hung request can never hold the Deploy job (the job has no `timeout-minutes`; plan-review F1).
- **Rollback safety.** The per-entry check reads the list from the served `sw.js`, so it is right for any release;
  every check that reads HEAD's tables (`TASK_ART`, `UI_ART`, `ROOM_ART`, `SOUNDS`) runs only under `if (sha7)`. The
  Deploy workflow passes the SHA on deploy and omits it on rollback (no workflow change).
- **Localhost.** One pure `isLocalHost(url)` decides both existing skips (`www`) and a new skip of the immutable check
  (`ok`, detail `skipped on localhost`), so the local proof run against `vite preview` is green; production hostnames
  are never local.
- **Decode note, not a save field.** M-4's `salonCarried` lives on `DecodeResult` `ok` and in a runtime registry key;
  it is gone after the next launch. `carryV2Salon(raw).value` must equal today's `LIFT_V2_SALON(raw)` byte for byte
  (pinned by the existing `tests/legacySalonMigration.test.ts` cases).
- **Timers outlive the scene unless cleared.** Phase 4's `window.setTimeout` handles are cleared on loader `COMPLETE`
  and on scene `shutdown`; callbacks run in `try` with a warn.
- **S-2 seam.** In an `addfile` listener for `audio` files, `file.config.context` is replaced by a per-file object
  whose `decodeAudioData(buf, ok, err)` calls the real context and attaches `.catch` (named warn `Sound decode failed:
  <key> (<name>)`) to a returned promise; the real context is never mutated. The listener wraps only when
  `typeof file.config?.context?.decodeAudioData === 'function'` (an `HTML5AudioFile`, chosen when Web Audio is missing,
  has no context; a no-audio game queues no audio file) and attaches `.catch` only when the call returned a thenable
  (old callback-only implementations return `undefined`); a test covers both guards (plan-review F3). Pinned: `AudioFile.onProcess` still calls
  `this.config.context.decodeAudioData(` with three arguments and nulls `this.config.context` after.

## Phase 1: Deploy smoke asks for every precached file (O-1a/P-3, P-2, S14-06/P-4 2217, P-4 0915)

Driver: tdd
Driver why: the per-entry verdict, the table coverage and the failure line are absent pure helpers in `parse.ts` with exact oracles — failing tests lead.

### Overview

The smoke HEADs every precache entry, checks all art tables only with a SHA, drops the hard-coded salon GET, names the
path of a failed request and says the release is already live; the immutable check is skipped on localhost.

### Changes Required:

#### 1. Pure helpers

**File**: `scripts/deploy-check/parse.ts`

**Intent**: `EXPECTED_TYPES` (extension → media type, the nine above); `entryVerdict(url, status, contentType,
location) → { ok; reason }` (200 + matching type before `;`; status-only for unknown extensions; `index.html` redirect
tolerance); `precacheServed(verdicts) → CheckResult` (`precache served: n/N`, detail lists up to 5 failures as
`<url> <status> <type>`); `precacheCovers(name, precache, urls) → CheckResult` generalising `roomArtCheck` (kept as a
thin wrapper so its test keeps passing); `isLocalHost(url)`; `failLine(error) → string` (`FAIL request error —
<path>: <message> (the release is already live; roll back from Actions → Deploy if needed)`).

**Contract**: all pure, no network; `CheckResult` unchanged.

#### 2. Script

**File**: `scripts/check-deploy.ts` (`main`, `get`, final rejection handler)

**Intent**: after `/sw.js`, HEAD every entry through a pool of 8 (each HEAD with `AbortSignal.timeout(HEAD_TIMEOUT_MS)`, an abort
treated as a network error) and record `precacheServed`; under `if (sha7)` record
`precacheCovers` for `TASK_ART` (`url`), `UI_ART` (`url`), `ROOM_ART` (`url`) and boot `SOUNDS` (flattened `urls` of
`boot` entries); remove the hard-coded `architecture-after.webp` GET (the per-entry check covers it); `get` wraps an
error as `new Error(\`${path}: ${msg}\`, { cause })`; the final handler prints `failLine`; the immutable check and the
`www` check use `isLocalHost`.

**Contract**: usage, exit codes 0/1/2 and the final `all N checks ok` / `n of N checks failed` lines unchanged.

#### 3. Tests

**File**: `tests/deployCheck.test.ts`

**Contract**: recorded responses as constants (no network): a real `dist/sw.js`-shaped fragment; verdicts 200 +
`image/webp` ok; 404 fails; `text/html` for a `.webp` fails (the local SPA-fallback case); `text/css; charset=utf-8`
ok; `.woff2` status-only; `index.html` 301 → `/` ok, 301 → `/x` fails; a timed-out entry (status 0, reason `timeout`)
fails and is listed; `precacheServed` line text; `precacheCovers`
for each table; `isLocalHost`; `failLine` names the path and "already live".

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `entryVerdict` accepting any 200 → the `text/html`-for-`.webp` case red; `precacheCovers` ignoring one URL → its case red; each restored; meta-check: proves the verdict over recorded responses, not that Caddy still answers that way (the Deploy run proves that)
- Local proof: `npm run build`, `npx vite preview --config vite/config.prod.mjs --port 4398 --strictPort`, `NODE_USE_ENV_PROXY=1 npm run check:deploy -- http://localhost:4398` (no SHA, as on rollback) prints `precache served: 121/121` (or the build's count) and `all N checks ok`; with a SHA it adds the four table lines; server killed (`lsof -ti tcp:4398 -sTCP:LISTEN | xargs kill`)
- `git diff --stat main -- deploy .github` empty
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] Every new assertion is satisfied by the live observations quoted in research (types per extension, 404, `index.html` 200, no length assert); every table check sits under `if (sha7)`
- [reviewer] (CI at ship) workflow `Deploy` job `deploy` step `Smoke check (deploy)` log matches `all [0-9]+ checks ok` (seen in Deploy run 38995649135: `all 20 checks ok`) and contains `precache served: ` with n = N

---

## Phase 2: "Gra bez internetu" names a failed update (O-2, O-4, O-3, O-5)

Driver: tdd
Driver why: `offlineView` and `stepSw` are pure with exact outcomes — the pinned "failed update reads ready" case reverses first.

### Overview

A failed update behind an active worker gets its own line; a waiting worker is tracked; `update()` runs once per
launch; listener errors are logged.

### Changes Required:

#### 1. View and reducer

**File**: `src/core/swStatus.ts` (`OfflineLine` gains `'updateFailed'`; `offlineView`: `phase 'ready' && error !== null`
→ `updateFailed`; `SwEvent` gains `{ type: 'waiting', id }` handled like `state: 'installed'`)

#### 2. Registration

**File**: `src/pwa/registerServiceWorker.ts` (`register().then`: `if (registration.waiting) track(registration.waiting)`
before `installing`, emitting `waiting`; one `registration.update()` after registration resolves, its rejection warned
as `Service worker update check failed (<name>)`; `emit` catch warns `Service worker status listener failed (<name>)`)

**Contract**: no visibility or timer trigger; comment cites autonomous decision 2.

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.offline.updateFailed`: "Nowej wersji gry nie udało się pobrać. Ta wersja działa
dalej bez internetu." — DESIGN-GAP 139 comment); `docs/design-gaps.md` row 139

#### 4. Tests (deliberate reversal)

**File**: `tests/swStatus.test.ts` ("keeps a failed update behind an active worker as ready with a code" → the view
gives `updateFailed` with the code; reversed because the line "Gra jest gotowa" hid the failure); new: `waiting` event
→ `ready` path like `installed`.

### Success Criteria:

#### Automated Verification:

- Reversed and new tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `offlineView` without the `error` branch → reversed case red; `waiting` ignored by `stepSw` → its case red; each restored; meta-check: proves the view and reducer, the registration wiring is reviewed (nothing imports `src/pwa` in unit tests)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `seed.spec.ts` and `health-lines.spec.ts` "#8 P-1 …" green

#### Manual Verification:

- [reviewer] DESIGN-GAP 139 row and comment present; `update()` called once per page load and nowhere else; `vite/config.shared.mjs` unchanged
- [visual] "Gra bez internetu" with the `updateFailed` line (a unit-built status rendered through the hook build, or a throwaway local patch of `offlineView` input in a `*.local` folder, never committed), at 1440 (1920×1080 fit) and 1024×768
- [human] Accept that the update check runs only at launch (the audit asked for "przy powrocie z tła" too; rejected so no new worker claims an open page mid-round)

---

## Phase 3: Boot log names the table, URL and status; every missing texture has a cause (A-3/L-3/B-5/U-3/S14-08, A-4, ASL-07)

Driver: tdd
Driver why: `loadErrorLine` and the cause classifier are absent pure functions over the tables and the loader's public events — failing tests lead.

### Overview

One `loaderror` line labelled by table with URL and status; a missing texture classified as fetch, decode, cut or
never started; a texture whose size differs from its table is reported, never dropped.

### Changes Required:

#### 1. Rules

**File**: `src/core/artHealth.ts` (new `ArtTable = 'task' | 'room' | 'ui' | 'sound'`; `tableOf(key, tables)`;
`loadErrorLine(table, key, src, status) → string` (`<Table> file failed to load: <key> <src> (HTTP <status> | timeout
or network)`); `ArtCause = 'fetch' | 'network' | 'decode' | 'cut' | 'never'` (`fetch` = an HTTP status ≥ 400, `network` = status 0:
timeout or no connection — never told to the parent as "not on the server", plan-review F2); `artCauses(missingKeys, seen: { loaded: Set; failed:
Map<key,status> ; cut: Set }) → Record<key, ArtCause>`; `ArtHealth` gains additive `causes` and `wrongSize: string[]`)

#### 2. Wiring

**File**: `src/scenes/BootScene.ts` (`preload`: `loaderror` listener uses `loadErrorLine` (dead `font` branch removed,
font errors keep their own line), a `Loader.Events.FILE_LOAD` listener records loaded keys; `create`: `artHealth` gets
`causes` and a size check `textures.get(key).source[0].width/height` against the table's `width/height` where the table
has them; one `console.warn` per table with the causes)

#### 3. Pin

**File**: `tests/phaserLoaderPin.test.ts` (new case: `LoaderPlugin.nextFile` emits `Events.FILE_LOAD` on success and
`Events.FILE_LOAD_ERROR` only on failure; `ImageFile.onProcess` failure calls `onProcessError`)

#### 4. Tests

**File**: `tests/artHealth.test.ts` (`loadErrorLine` per table, status 0 → "timeout or network"; `artCauses`: loaded
but no texture → `decode`, failed with 404 → `fetch`, failed with status 0 → `network`, in cut → `cut`, none →
`never`; `wrongSize`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`; `artFilter` tests green unchanged (it reads `missingIds` only)
- Deliberate break: `artCauses` checking `failed` before `cut` reversed for a cut key → its case red; restored; meta-check: proves the classifier over recorded events, the browser decode path is phase 13 (`?e2eArt=corrupt`)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `art-stand-in.spec.ts`, `salon-load-health.spec.ts` and `health-lines.spec.ts` green

#### Manual Verification:

- [reviewer] No texture is dropped for a wrong size; the new pin case names `FILE_LOAD`; no player text in the scene

---

## Phase 4: Boot limits on the wall clock, the boot record and the queue order (B-3, B-4 record, B-6, A-7 record, P-5, P-6)

Driver: tdd
Driver why: the limit scheduler with an injected clock, `bootQueue` order and the font check are absent pure rules — failing tests lead.

### Overview

The slow line and the total cut use `performance.now()` and `window.setTimeout`; `bootLoad` carries the duration and
the cut per table; sounds are queued after every picture; a font check result is recorded; the `ADD` listener cannot
throw; `stallall` is a build marker.

### Changes Required:

#### 1. Rules

**File**: new `src/core/bootLimits.ts` (`bootLimitSchedule(limits, now) → { slowAt; cutAt }` and `bootLimitDue(schedule,
now) → 'none' | 'slow' | 'cut'`, injected clock); `src/core/artHealth.ts` (`bootQueue(groups) → order`: loading
pictures, font, `TASK_ART`, `ROOM_ART`, other `UI_ART`, boot `SOUNDS`; `fontHealth(faces: {family; status}[], family)
→ 'loaded' | 'fallback'`)

#### 2. Wiring

**File**: `src/scenes/BootScene.ts` (`startedAt = performance.now()`; slow and cut timers on `window.setTimeout`, cleared
on loader `COMPLETE` and scene `shutdown`, callbacks in `try` with a warn; queue via `bootQueue`; `ADD` listener body in
`try` with a warn-once; `publish` writes `bootLoad = { cut, cutByTable, creates, elapsedMs }`; `create` writes
`REGISTRY_KEYS.fontHealth` from `[...document.fonts]`); `src/data/layout.ts` (`REGISTRY_KEYS.fontHealth`, comment
"runtime only, not in SAVE_KEYS"; `bootLoad` comment updated); `src/testing/e2eHook.ts` (`bootLoadSnapshot` gains
`cutByTable`, `elapsedMs`; snapshot `fontHealth`); `vite/e2eHookGuard.mjs` (`'stallall'` added to `E2E_HOOK_MARKERS`)

#### 3. Tests

**File**: new `tests/bootLimits.test.ts`; `tests/artHealth.test.ts` (`bootQueue` puts sounds last, `fontHealth`);
`tests/e2eHookGuard.test.ts` (marker list); `tests/saveKeys.test.ts` green unchanged; `tests/phaserLoaderPin.test.ts`
"copies the per-file limit in an ADD listener registered before BootScene queues its first file" green (the listener
stays before the first `this.load.<type>()`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `bootQueue` with sounds before `ROOM_ART` → its case red; `bootLimitDue` reading a paused clock (schedule from the start minus a pause) → its case red; `stallall` removed from the markers → `tests/e2eHookGuard.test.ts` red; each restored; meta-check: proves the rules, the timers under a real load are proven by `load-and-tab-guard.spec.ts` #15 stallall
- `npm run build` prints `e2e hook: absent (` with `stallall` in the marker list; `grep -c stallall dist/_app/*.js` is 0
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `load-and-tab-guard.spec.ts` and `final-art-loading.spec.ts` green

#### Manual Verification:

- [reviewer] Both timers cleared on `COMPLETE` and `shutdown`; `fontHealth` and the new `bootLoad` fields absent from `SAVE_KEYS`; `balance.loader.totalMs` unchanged
- [human] Optional: a throttled cold start (50 KB/s, worker installing) on a real Android tablet to decide whether `balance.loader.totalMs` 50 s holds (B-6 measurement)

---

## Phase 5: "Obrazki" lines builder: each known line, cause and cut (L-8, F4, A-5, B-4 line)

Driver: tdd
Driver why: the lines builder is an absent pure function with exact `toEqual` lines — failing tests lead.

### Overview

A pure `artHealthLines` in `core` returns the lines of "Obrazki"; the DOM renderer only draws them; each known line is
shown while another is `unknown`; the main cause with `Kod:` and the cut line are added.

### Changes Required:

#### 1. Builder

**File**: `src/core/artHealth.ts` (`ArtHealthLine` = a tagged union of line keys with their numbers: `{ kind:
'ok'|'missing'; table; count; total }`, `{ kind: 'cut'; count }`, `{ kind: 'cause'; cause: ArtCause }`, `{ kind:
'code'; code; build }`; `artHealthLines({ task, room, ui, cut, build }) → ArtHealthLine[]`: every view not `unknown`
gives its line; a cut gives the cut line; the most frequent cause of the missing keys gives a cause line and a code
line)

**Contract**: no text in `src/core` (no module there imports `src/data/pl.ts`, as with `saveHealthView` and
`offlineView`); the renderer maps each line to `pl`; the code line uses the existing `pl.saveFailed.detail(code, build)`.

#### 2. Renderer and panel

**File**: `src/ui/dom/artHealthView.ts` (`createArtHealthView(lines)` draws `createText` per line); `src/ui/dom/settingsPanel.ts`
("Obrazki" shown when any line exists, not hidden while task art is `unknown`); `src/scenes/UIScene.ts` (`openSettings`
passes the registry records and `__BUILD_ID__`)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.artCut`: "Część obrazków nie zdążyła się wczytać. Przy lepszym internecie
uruchom grę ponownie." — gap 140; `settings.artCause`: record `fetch` "Tych plików nie ma na serwerze.", `network` "Tych plików nie udało się pobrać. Internet był zbyt wolny albo się rozłączył.", `decode`
"Tych plików nie da się otworzyć.", `cut` → `artCut`, `never` "Tych plików gra nie zaczęła wczytywać." — gap 141);
`docs/design-gaps.md` rows 140–141; gaps 67 and 119 get a "see 140–141" note

#### 4. Tests

**File**: new `tests/artHealthLines.test.ts` (task `unknown` + room `missing` → room line shown (F4); cut line; cause
line by majority; code line with build; all ok → one ok line per known table)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`; `sectionState` tests green unchanged
- Deliberate break: `artHealthLines` dropping lines while task art is `unknown` → the F4 case red; restored; meta-check: proves the builder, the rendering is the visual gate and phases 12–14
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `health-lines.spec.ts` "#14 G-1 …", `art-stand-in.spec.ts` and `salon-load-health.spec.ts` green (texts asserted there updated only where the wording of an existing line changed, each named in the commit)

#### Manual Verification:

- [reviewer] DESIGN-GAP 140–141 rows and comments present; no DOM in `src/core`; the renderer adds no style
- [visual] "Obrazki" under `?e2eArt=missing` (cause line + `Kod:`) and under `?e2eArt=stallall` (cut line), at 1440 and 1024×768

---

## Phase 6: "Obrazki": folders, skipped tasks, labels, font, restart advice (ASL-02, R-5, A-7 line)

Driver: tdd
Driver why: extends the phase-5 builder with exact new lines — failing cases lead.

### Overview

Per-folder counts instead of one count, a sentence that the tasks with these pictures are skipped, up to N labels of
missing room pieces, a line for the fallback font, and the restart advice only when the cause can change on a restart
(`cut`, `network`).

### Changes Required:

#### 1. Builder

**File**: `src/core/artHealth.ts` (`artHealthLines` input gains `font` and `labels`; `folderCounts(missingIds)` from the
asset path folder; labels capped by `balance.artHealth.labelCap`; `restartHelps(causes)`)

#### 2. Data

**File**: `src/data/balance.ts` (`artHealth.labelCap: 3` with a comment); `src/data/pl.ts` (`settings.artFolders(folder,
count)` "<folder>: brak <n> <plural>" — gap 142; `settings.artSkipped` "Zadania z tymi obrazkami gra na razie pomija."
— gap 143; `settings.artNoRestart` "Ponowne uruchomienie tego nie zmieni. Gra działa dalej bez tych obrazków." — gap
144; `settings.artLabels(list)` "Brakuje: <list>." — gap 145; `settings.fontFallback` "Litery w zadaniach są w
zastępczym kroju pisma." — gap 146); folder names from `pl` (`settings.artFolderNames`: `money` "pieniądze",
`measuring` "miary", `icons` "obrazki do liczenia", `rooms` "salon", `ui` "ekrany") inside gap 142; plural forms via
`src/core/text/plural.ts`; `docs/design-gaps.md` rows 142–146

#### 3. Tests

**File**: `tests/artHealthLines.test.ts` (folders, skipped sentence only for task art, cap of labels, font line,
`artNoRestart` for `fetch` (a 404) and `decode` vs restart advice for `cut` and `network`); `tests/plural.test.ts` unchanged and green

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `restartHelps` true for every cause → the 404 case red; `labelCap` ignored → its case red; each restored; meta-check: proves the builder's rules
- Full local gate green (the `sample` run covers the `src/data/` touch); build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] DESIGN-GAP 142–146 rows and comments present; copy read of the five lines (numeral agreement "brak 1 obrazka / 2 obrazków / 5 obrazków", short sentences)
- [visual] "Obrazki" under `?e2eArt=missing` (folders, skipped, no-restart) and under `?e2eArt=room` (labels), at 1440 and 1024×768

---

## Phase 7: The screen fallback the child sees reaches "Obrazki" (U-1/G-2, G-3 record, G-7, G-5)

Driver: impl
Driver why: a registry record written from four widgets plus a hook-build seam — glue around one small pure setter, proven by unit tests and the e2e of phase 14.

### Overview

`REGISTRY_KEYS.artFallbacks` records which fallback the child sees (wallet, notebook, miniature, loading), one muted
line in "Obrazki" names them, `?e2eArt=ui` skips the non-loading `UI_ART`, and `tests/uiArt.test.ts` catches an orphan
file.

### Changes Required:

#### 1. Record

**File**: `src/core/artPick.ts` (`noteFallback(record, where, mode) → record`, pure, idempotent); `src/data/layout.ts`
(`REGISTRY_KEYS.artFallbacks`, runtime only); `src/ui/widgets/{CoinWallet,UnlockCard,RoomDoneCard,LoadingScreen}.ts`
(each writes through one registry helper only when a fallback is chosen)

#### 2. Line

**File**: `src/core/artHealth.ts` (`artHealthLines` input gains `fallbacks`; one muted line); `src/data/pl.ts`
(`settings.artFallback(list)` "Zamiast obrazka gra rysuje: <list>." with names `wallet` "portfel", `notebook`
"zeszyt", `miniature` "miniatura pokoju", `loading` "ekran ładowania" — gap 147); `docs/design-gaps.md` row 147

#### 3. Seam

**File**: `src/testing/e2eHook.ts` (`E2EArtSeam` gains `'ui'`: every `UI_ART` key except the two loading pictures
gets the missing-file URL; marker `e2eArt` already covers it; the hook exposes `artFallbacks`); `tests/e2eArt.test.ts`
or the existing seam test (value list)

#### 4. Tests

**File**: `tests/artPick.test.ts` (`noteFallback`); `tests/artHealthLines.test.ts` (fallback line); `tests/uiArt.test.ts`
(readdir `public/assets/ui` → every file in `UI_ART`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: an extra file in a temp copy of the folder list (or a `UI_ART` entry removed) → the orphan case red; `noteFallback` overwriting an earlier mode → its case red; each restored; meta-check: proves the record and the folder rule, the widgets' calls are proven by phase 14
- Build prints `e2e hook: absent (` (the existing `e2eArt` marker covers the new value); full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-art-wallet.spec.ts`, `final-art-room-done.spec.ts`, `final-art-loading.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 147 row and comment present; widgets write only through the one helper; `artFallbacks` absent from `SAVE_KEYS`; the child-facing look is unchanged
- [visual] "Obrazki" under `?e2eArt=ui` after the unlock card and a wallet task, at 1440 and 1024×768

---

## Phase 8: "Dźwięki" says when the device will not play (M-1/S-4, S-9, S-10, S-5)

Driver: tdd
Driver why: `musicLine`/`soundLine` and the service's counters are pure or tested through the existing fake loader — failing tests lead.

### Overview

After `balance.sound.lockedTouches` locked plays the section says the device does not let the game play sounds; with
no audio device it says so instead of "12 not loaded"; a failing effect warns once and joins the missing set; the music
error names its cause.

### Changes Required:

#### 1. Rules

**File**: `src/core/sound.ts` (`musicLine(prefs, music, lockedCount = 0, threshold = Infinity)` → `'blocked'` at the
threshold; new `effectsLine({ lockedCount, threshold, device }) → 'blocked' | 'noDevice' | null`; `MusicLine` gains
`'blocked'`)

#### 2. Service

**File**: `src/ui/sound.ts` (`createSoundService`: count `locked` outcomes; `status()` gains `lockedCount`, `device:
'webaudio' | 'html5' | 'none'`, `musicError: 'http:<n>' | 'timeout' | 'decode' | 'trim' | null`; `play` catch adds the
key to the missing set (dedup) and warns once per id; `startMusic` adds keyed `loaderror`/`load` listeners on the HUD
loader filtered by `file.key`, removed in `done`); `src/data/balance.ts` (`sound.lockedTouches: 3`); `src/ui/dom/settingsPanel.ts`
sound section (the two lines); `src/scenes/UIScene.ts` (`openSettings` passes the new status fields)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.soundBlocked`: "To urządzenie nie pozwala grze odtwarzać dźwięków." — gap 148;
`settings.soundNoDevice`: "Na tym urządzeniu gra nie ma dźwięku." — gap 149; music `blocked` reuses `soundBlocked`);
`docs/design-gaps.md` rows 148–149; gaps 114 and 120 get a note

#### 4. Tests

**File**: `tests/sound.test.ts` (`musicLine` threshold, `effectsLine`); `tests/soundMusic.test.ts` (fake loader gains
`on`/`off`: 404 → `http:404`, decode → `decode`; a throwing fake `play` → one warn for two calls, key in missing);
`tests/soundCues.test.ts` green unchanged

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `musicLine` ignoring `lockedCount` → threshold case red; warn-once map removed → two-warns case red; each restored; meta-check: proves the rules and the service over fakes, WebKit's never-unlocking context is the [human] row
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound.spec.ts`, `final-sound-failure.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 148–149 rows and comments present; the listeners on the HUD loader are removed in every `done` path; an effect is still played before the narrator speaks
- [visual] "Dźwięki" with the `soundNoDevice` line (e2e build with Web Audio disabled in a throwaway local spec in a `*.local` folder) and with the music `http:404` cause, at 1440 and 1024×768
- [human] Real iPad: with the context never unlocking (silent switch, Low Power), after 3 touches "Dźwięki" shows the `soundBlocked` line (M-1)

---

## Phase 9: Decode rejections named at source, prefs warn and probe (S-2, S-7, M-2, FU-16)

Driver: tdd
Driver why: `noiseLine`, `parseSoundPrefs` problems, the store probe and `applySoundPrefs` are pure or run over fakes — failing tests lead; the Phaser seam is pinned.

### Overview

A quiet rejection is warned with its name and reason; a sound decode failure is caught at its source with the key; an
invalid stored choice warns; a probe at start tells whether the device keeps the choice; the apply step is testable.

### Changes Required:

#### 1. Rules

**File**: `src/core/errorSignal.ts` (`noiseLine(signal) → string` "Quiet rejection: <name> — <message>");
`src/core/sound.ts` (`parseSoundPrefsWithProblem(raw) → { prefs; problem: string | null }`, `parseSoundPrefs` kept as a
wrapper); new `src/core/soundPrefsApply.ts` (`applySoundPrefs(prefs, { service, store, set })` extracted from
`UIScene.applySettings`, returns `kept`)

#### 2. Wiring

**File**: `src/ui/dom/errorBoundary.ts` (quiet branch warns `noiseLine`); `src/storage/soundPrefs.ts`
(`createSoundPrefStore.read` warns when `raw !== null && problem`; `probe()` sets and removes `martynka:sound:probe`, try/catch → false);
`src/main.ts` (calls `probe()` beside the prefs read, sets `REGISTRY_KEYS.soundPrefsKept`); `src/scenes/UIScene.ts`
(`applySettings` calls `applySoundPrefs`); `src/scenes/BootScene.ts` + `src/ui/sound.ts` `startMusic` (an `addfile`
listener for `audio` files wraps `file.config.context` per the Critical Implementation Details); `QUIET_REJECTIONS`
unchanged

#### 3. Pin

**File**: `tests/phaserLoaderPin.test.ts` (new case: `AudioFile.onProcess` calls `this.config.context.decodeAudioData(`
with three arguments and sets `this.config.context = null` after; `LoaderPlugin` emits `ADD`/`addfile` from `addFile`)

#### 4. Tests

**File**: `tests/errorSignal.test.ts` (`noiseLine`); `tests/soundPrefsStore.test.ts` (warn on `"{bad"`, no warn on null;
`probe` with a throwing storage → false); new `tests/soundPrefsApply.test.ts` (refused write → `kept: false` and the
registry set; FU-16); new `tests/decodeSeam.test.ts` (the wrapper over a fake context whose promise rejects: one named
warn, no unhandled rejection; callback form still called; a file without a context left untouched; a context whose
`decodeAudioData` returns `undefined` → no throw)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: the wrapper without `.catch` → `decodeSeam` case red (unhandled rejection reported by vitest); `applySoundPrefs` ignoring a refused write → FU-16 case red; each restored; meta-check: proves the seam over a fake context, the browser's real rejection is spec behaviour checked by `final-sound-failure.spec.ts` staying green and the reviewer
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound-failure.spec.ts`, `error-boundary.spec.ts` green

#### Manual Verification:

- [reviewer] The real `AudioContext` is never mutated; the pin names the seam; `martynka:sound:probe` is not a registry or save key; `QUIET_REJECTIONS` unchanged

---

## Phase 10: Salon carry note, grown room list, art-filter fallback count (M-4/R-3, R-2, ASL-04/S14-05, ASL-03)

Driver: tdd
Driver why: `carryV2Salon`, `decodeSave`'s note, `roomGrowth` and the filter's fallback kind are pure with exact oracles — failing tests lead.

### Overview

"Zapis gry" says the room was moved to the new look after this load's v2→v3 carry; a room list that grew past
`tasksDone` and an art-filter fallback are logged; ASL-03 gets a docs note.

### Changes Required:

#### 1. Save note

**File**: `src/core/migrations/legacySalon.ts` (`carryV2Salon(raw) → { value; carried: { from: number; to: number } | null }`,
`LIFT_V2_SALON = (r) => carryV2Salon(r).value`); `src/core/save.ts` (`DecodeResult` ok gains `salonCarried: { from;
to } | null`, set at the v2 step; every `kind:'ok'` literal incl. `saveFile.parseImport` gets the field);
`src/main.ts` (runtime key `REGISTRY_KEYS.salonCarried`, the info log names the prefix lengths); `src/core/saveHealth.ts`
+ `src/ui/dom/saveHealthView.ts` (one line, the `roomProblems` path)

#### 2. Room growth and filter

**File**: `src/core/rooms.ts` (`roomGrowth(rooms, catalogue) → { room; from; to }[]` with `RoomDef.formerTaskCounts`
as data in `src/data/rooms.ts` (`[7]` for the salon); `console.info` in `main.ts` beside the R-4 warn; not a
`RoomProblemKind`); `src/core/round/artFilter.ts` (`withoutArtBlocked` result gains additive `fallback: 'none' |
'current' | 'all'`); `src/scenes/TaskScene.ts` `freshRound` (session counter, one `console.info` summary per 10
fallbacks); `docs/design-gaps.md` row 66 (ASL-03 note: `minCurrent` keeps exactly `ceil(share·n)` by design)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.salonCarried`: "Pokój przeniesiony na nowy wygląd. Kupione rzeczy zostały." — gap
150); `docs/design-gaps.md` row 150

#### 4. Tests

**File**: `tests/legacySalonMigration.test.ts` (`carryV2Salon` note; `LIFT_V2_SALON` output unchanged for every fixture),
`tests/save.test.ts` (exact `toEqual` cases gain `salonCarried`; expected red first), `tests/saveHealth.test.ts` (line),
`tests/rooms.test.ts` (`roomGrowth` for `tasksDone` 7 under 12 tasks), `tests/artFilter.test.ts` (`fallback` kinds),
`tests/freshRoundWiring.test.ts` green

### Success Criteria:

#### Automated Verification:

- New and widened tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `decodeSave` dropping the note → `save.test.ts` case red; `withoutArtBlocked` reporting `none` on the all-empty fallback → its case red; each restored; meta-check: proves the note and the rules, the line in the panel is the visual gate (`?e2eSave=legacy-salon`)
- `SAVE_VERSION` still 4; `git diff --stat main -- tests/fixtures` empty; every v1–v4 fixture test green; `REGISTRY_KEYS.salonCarried` absent from `SAVE_KEYS`
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-migration.spec.ts`, `salon-extra-slots.spec.ts`, `art-stand-in.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 150 row and comment present, row 66 note present; `MIGRATIONS[2]` output byte-identical; no mastery change for fallbacks
- [visual] "Zapis gry" with the `salonCarried` line under `?e2eSave=legacy-salon`, at 1440 and 1024×768

---

## Phase 11: Unreachable slots in the hook, docs and seam sweep (R-6)

Driver: impl
Driver why: one hook field, rule-file text, the follow-ups file and a sweep of phases 1–10 — glue and docs, proven by unit tests and the e2e gate.

### Overview

The e2e hook reports chosen slots that have no hold point; `CLAUDE.md` and follow-ups record the slice; seams left by
phases 1–10 are removed. This is the last `impl`/`tdd` phase.

### Changes Required:

#### 1. Hook field

**File**: `src/scenes/RoomScene.ts` (`slotTargets` also returns `unreachable: string[]` — chosen slots whose `holdPoint`
is null — or a sibling `unreachableSlots()`); `src/testing/e2eHook.ts` (room snapshot gains `unreachable`)

#### 2. Docs and follow-ups

**File**: `CLAUDE.md` ("Current state": one paragraph in the neighbouring style — smoke `precache served` per entry +
`precacheCovers` for all tables with a SHA + `failLine` + `isLocalHost`; `offlineView` `updateFailed`, `waiting`,
launch-only `update()`; `loadErrorLine`/`artCauses`/`wrongSize`, `src/core/bootLimits.ts` wall-clock limits,
`bootQueue` (sounds last), `bootLoad.cutByTable/elapsedMs`, `REGISTRY_KEYS.fontHealth`/`artFallbacks`/`salonCarried`,
`artHealthLines` + `balance.artHealth.labelCap`, `?e2eArt=ui`, `effectsLine`/`musicLine` `blocked` +
`balance.sound.lockedTouches`, `noiseLine`, the decode seam pinned in `tests/phaserLoaderPin.test.ts`, prefs probe and
`applySoundPrefs`, `carryV2Salon`/`salonCarried`, `roomGrowth`, `withoutArtBlocked.fallback`, hook `unreachable`,
`stallall` marker, design gaps 139–150; save format stays v4); new
`context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` (each with `Trigger:`: O-1(b), 2217 P-4 deploy/
half, G-3, G-6, ASL-05, ASL-08, A-6, A-8 (if not taken), L-7, `FontFace` load limit, VO3, O-3 on return from the
background, B-6 measurement)

#### 3. Seam sweep

**Contract**: no duplicated helper (one `isLocalHost`, one table lookup `tableOf`, one fallback setter, one `errorName`
per module family); no stale comment naming "Task art failed to load", `this.time.delayedCall` for the boot limits, or
"Music missing" as the only cause; `docs/design-gaps.md` rows 139–150 match the DESIGN-GAP comments; every new registry
key commented "runtime only, not in SAVE_KEYS".

### Success Criteria:

#### Automated Verification:

- Hook field test (`tests/e2eHook*.test.ts` or a source test of `slotTargets`) red before, green after; unit `<branch baseline> + N`
- Deliberate break: `unreachable` always empty → its case red; restored; meta-check: proves the field, the assertion over the real salon is phase 12
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; a deliberate broken path in `CLAUDE.md` → FAIL; restored
- Every follow-up entry has a `Trigger:` line (`grep -c '^Trigger:'` equals the entry count)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/` or `scripts/`; no duplicated helper; gap rows 139–150 match the code comments; `SAVE_VERSION` 4 and `git diff --stat main -- tests/fixtures deploy .github` empty
- [reviewer] (CI at ship) workflow `CI` job `check` log matches `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (seen in CI run 38966095199, job 117192831932: `Tests  3416 passed (3416)`, `e2e hook: absent (2 chunks checked)`)
- [human] Accept the wording of gaps 139–150 as one read of the parent's panel lines

---

## Phase 12: A purchase that cannot be saved, and every chosen slot reachable — e2e (#2, #16)

Driver: e2e
Driver why: risk #2 (progress lost) for a room purchase under a failing store and #16 (purchase) exist only across the room scene, the autosaver and the panel — built (writefail seam) before this change and the hook field in phase 11, contract `E2E=on`.

### Overview

New tests in `tests/e2e/save-restart.spec.ts` and an assertion in `tests/e2e/room-change.spec.ts` (hook build).

### Changes Required:

#### 1. Specs

**File**: `tests/e2e/save-restart.spec.ts`, `tests/e2e/room-change.spec.ts`

**Intent**:
(a) "#2 M-5 a stage and a sofa bought while the store refuses keep the stars and say so": `passWelcome(page, { e2eSave:
'writefail', e2eStars: '12', e2eVariant: 'off' })`, buy the stage and the sofa through the product, hook
`save.consecutiveFailures` grows, stars equal 12 minus both costs, "Zapis gry" `section.parent-save[data-state=failing]`,
no fatal card.
(b) "#16 R-6 every chosen slot has a hold point": after the purchases of the existing room-change flow, hook
`room.unreachable` is empty.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only; never open IndexedDB from the
test; request-file protocol if Chromium will not start in the agent session (profile § 8): `e2e-request-p12.md` +
`e2e-break-p12a.patch` (`RoomScene.dispatch` without the `flush('now')` after a stage → (a) red on the failure count) +
`e2e-break-p12b.patch` (`holdPoint` returning null for `sofa` → (b) red); each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- The two specs green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p12a → (a) red; p12b → (b) red; each restored; meta-check: (a) proves the purchase path reaches the failing store and the panel, not Safari's IndexedDB errors
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

---

## Phase 13: A stalled or broken picture and a missing font in the browser — e2e (#15, #14)

Driver: e2e
Driver why: risk #15 (a load must end, never freeze) and #14 (the panel tells the truth) for one stalled task picture, a decode failure and a missing font exist only in a real loader and `document.fonts` — built in phases 3–6, contract `E2E=on`.

### Overview

New tests in `tests/e2e/load-and-tab-guard.spec.ts` and `tests/e2e/health-lines.spec.ts` (hook build).

### Changes Required:

#### 1. Specs

**File**: `tests/e2e/load-and-tab-guard.spec.ts`, `tests/e2e/health-lines.spec.ts`

**Intent**:
(a) "#15 A-9 one stalled money picture ends by its own limit and its skill is skipped": `?e2eArt=stall`, `page.route`
hangs one `assets/tasks/money/*` file, `?e2eSkills=` forcing one money skill and one plain skill; the game starts, the
round has no task of the stalled skill, "Obrazki" shows the money folder line with the `network` (timeout) cause and the
restart advice.
(b) "#14 B-4 a cut start says some pictures did not finish": `?e2eArt=stallall` (existing hang routing), "Obrazki"
shows `pl.settings.artCut`; hook `bootLoad.elapsedMs` ≥ the e2e total limit.
(c) "#14 A-7 a font that did not load is named": route `**/fonts/*.ttf` to 404; "Obrazki" shows
`pl.settings.fontFallback`; hook `fontHealth` is `fallback`.

**Contract**: as phase 12; break patches `e2e-break-p13a.patch` (`artCauses` giving `never` for every key → (a) red on
the cause line), `e2e-break-p13b.patch` (cut line removed from `artHealthLines` → (b) red), `e2e-break-p13c.patch`
(`fontHealth` always `loaded` → (c) red). If (a) needs the retry count visible, A-8 is taken here (record in the plan).

### Success Criteria:

#### Automated Verification:

- The three tests green; full `--workers=4`: `<branch e2e baseline> + 3`
- Deliberate breaks p13a, p13b, p13c → each its test red; each restored; meta-check: (c) proves Chromium's `document.fonts` status, not WebKit's
- Build prints `e2e hook: absent (` (and `stallall` absent from `dist/`); full local gate green; servers 4397/4398 killed

---

## Phase 14: The screen fallback reaches the panel — e2e (#14)

Driver: e2e
Driver why: risk #14 (the panel tells the truth) for the wallet, notebook and miniature fallbacks exists only in rendered widgets — built in phase 7 (`?e2eArt=ui`, `artFallbacks`), contract `E2E=on`.

### Overview

New tests in `tests/e2e/health-lines.spec.ts` (hook build).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/health-lines.spec.ts`

**Intent**:
(a) "#14 U-1 a missing wallet and notebook are named in the pictures section": `?e2eArt=ui`, `?e2eSkills=` forcing
`E1.11.money_pay_10`; open the wallet task (hook wallet mode `drawn`), reach the unlock card (hook book fallback), open
the panel → `pl.settings.artFallback` with "portfel" and "zeszyt"; hook `artFallbacks` holds both.
(b) "#14 G-7 a drawn room miniature is named": `?e2eArt=ui`, `?e2eStars=` enough for the salon, finish the room →
"Pokój gotowy!" (hook miniature `drawn`), panel line names "miniatura pokoju".

**Contract**: as phase 12; break patches `e2e-break-p14a.patch` (`CoinWallet` not writing the record → (a) red) and
`e2e-break-p14b.patch` (`RoomDoneCard` not writing the record → (b) red).

### Success Criteria:

#### Automated Verification:

- The two tests green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate breaks p14a, p14b → each its test red; each restored; meta-check: proves the widgets write the record and the panel reads it, not the look of the drawn fallback
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

---

## Testing Strategy

### Unit Tests:

- Smoke: `entryVerdict`, `precacheServed`, `precacheCovers`, `isLocalHost`, `failLine` over recorded responses.
- `offlineView` `updateFailed`, `stepSw` `waiting`; `loadErrorLine`, `artCauses`, `wrongSize`, `bootLimitSchedule`/
  `bootLimitDue`, `bootQueue`, `fontHealth`; `artHealthLines` (each known line, cut, cause, folders, labels, font,
  fallbacks, restart advice); `noteFallback`; orphan UI files.
- `musicLine`/`effectsLine`, the sound service over fakes (counts, warn once, music cause); `noiseLine`, prefs problem
  and probe, `applySoundPrefs`, the decode seam; `carryV2Salon`, `decodeSave` note, `roomGrowth`,
  `withoutArtBlocked.fallback`; the hook's `unreachable`; pin cases for `FILE_LOAD` and the audio decode seam.

### Integration Tests:

- Phases 12–14 e2e; existing specs (`seed`, `health-lines`, `load-and-tab-guard`, `art-stand-in`, `salon-load-health`,
  `final-sound*`, `final-art-*`, `save-migration`) as the regression net at every gate; the local `check:deploy` run
  against `vite preview` in phase 1; the Deploy run's smoke after the merge.

### Manual Testing Steps:

1. Real iPad with sound blocked: after 3 touches "Dźwięki" names it.
2. Optional throttled Android cold start against `balance.loader.totalMs`.
3. One read of the panel wording, gaps 139–150.

## Performance Considerations

About 121 extra HEAD requests per deploy smoke (pool of 8, a few seconds). At boot: one `FILE_LOAD` listener, two
`window.setTimeout` handles, one `document.fonts` scan, a size read per loaded texture in `create()`, one storage probe
at start. Nothing on a frame path; sounds queued last can be cut first on a slow link (quiet by design).

## Migration Notes

None for the save: format v4 unchanged, no fixture edited, `MIGRATIONS[2]` output unchanged. The smoke change applies
to the next Deploy run; a rollback run (no SHA) skips the table checks and keeps the per-entry check.

## Known risks

- **A server MIME change fails the smoke after the switch** (release already live): `failLine` says so; the type map
  matches today's live answers only.
- **Sounds queued last** are cut first on a slow first start; effects then stay missing until the next launch (quiet,
  now named in "Dźwięki").
- **The S-2 seam depends on Phaser internals** (`file.config.context`): pinned; a Phaser upgrade fails the pin first.
- **`document.fonts` status differs in WebKit**: phase 13 (c) proves Chromium only.
- **Reversed test** in phase 2 (`swStatus`); e2e text assertions in phase 5 updated only where an existing line's
  wording changed — any other red test is a regression.
- **Boot limits now run while the tab is hidden** (phase 4, B-3): on the wall clock a first start sent to the background
  can be cut while the browser keeps downloading; before, `Game.onHidden` paused the cut with the loop. Accepted: the
  limit exists so a start never freezes, and the stand-in path is the designed outcome (plan-review F4).
- **An offline launch warns `Service worker update check failed (TypeError)`** once (phase 2): console only, no panel
  line, no status change; accepted as truthful noise (plan-review F5).
- **e2e load sensitivity** (profile § 8): full suite ~10–12 min at 4 workers; known flakes `money-pay` #11,
  `final-art-loading` #15, `child-flow-guards` #2 — re-run alone before they count.

## References

- Research `context/changes/health-lines-and-smoke/research.md`; change `context/changes/health-lines-and-smoke/change.md`
- Scope and triage: `context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md` § Slice 3, `triage-A.md`, `triage-B.md`, `triage-C.md`
- Audits under `context/audits/observability/`: `2026-10-14_0445`, `2026-10-14_1110`, `2026-10-15_2010`, `2026-10-15_2217`, `2026-10-16_0915`, `2026-10-16_1419`
- Contract `context/runs/2026-10-16-audit-sweep/agent-contract.md`; profile `context/foundation/autonomous-run.md` § 2, § 3, § 5, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #2, #3, #8, #10, #14, #15, #16, § 6.4 (smoke), § 6.6 (e2e); `context/foundation/test-stack.md` § E2E
- Format example `context/archive/2026-10-16-save-truth/plan.md`
- Design: `Martynka-urzadza.md` § 9 (PWA, silent update at the next launch), § 10 (art), § 8 (save); PRD FR-003; `docs/design-gaps.md`
- Earlier Deploy log: run 38995649135, step `Smoke check (deploy)`: `ok   GET /sw.js — 200, 121 precache entries`, `all 20 checks ok`

## Autonomous decisions

1. **Smoke type map covers all nine precached extensions** (research superseded change.md decision 5 by live
   evidence); unknown extensions status-only; no length/cache/encoding assert per entry. Would change: a server MIME
   change (out of this run) or a new precached extension.
2. **O-3: `registration.update()` once per launch only**, never on return from the background or a timer. Chosen
   because the step prompt forbids a new worker taking over an open page mid-round and `Martynka-urzadza.md` § 9 says
   "silent update at the next launch"; the launch-time claim that exists today (browser navigation check +
   `skipWaiting`/`clientsClaim`) is unchanged, no reload is added. Rejected: `update()` on `visibilitychange` (the
   audit's "przy powrocie z tła": a found worker would claim the open page during a round); changing `skipWaiting`
   (risk #10 behaviour change, `vite/` config). This follows the design docs' text; it rejects part of the audit's
   direction, hence `[human]` row 2.6. Would change: a device report of an old build kept for days without a relaunch,
   or a switch to a prompt-style update.
3. **Localhost skips the immutable check** through one `isLocalHost` shared with the `www` skip (research Open Question
   1), so the local proof run is green. Rejected: expecting a red line locally (a noisy proof). Would change: none —
   production hostnames are never local.
4. **S-2 source catch taken, behind the pin** (`file.config.context` per-file wrapper, never mutating the real
   context; `tests/phaserLoaderPin.test.ts` pins `AudioFile.onProcess`). `QUIET_REJECTIONS` stays as the safety net.
   Rejected: deferring the source catch (step prompt fixes it in). Would change: a Phaser upgrade (the pin fails first).
5. **B-6: reorder only** (sounds last), `balance.loader.totalMs` unchanged; measurement is an optional `[human]` row
   4.6. Would change: a throttled run over the limit.
6. **Cause rule from public events** (`FILE_LOAD` seen + no texture = decode; `loaderror` = fetch with status; cut set;
   none = never), with `FILE_LOAD` added to the pin. Would change: a Phaser event for process errors.
7. **Panel lines through pure builders** (`artHealthLines`, `effectsLine`), thin DOM renderers, no DOM test environment
   (change.md decision 6). Would change: the maintainer adding a DOM test environment.
8. **M-4 as a runtime decode note** (`salonCarried`), shown only on the load that carried (change.md decision 9).
   Would change: a requirement to show it on later launches.
9. **R-2 log-only `roomGrowth`** with `formerTaskCounts` as data, not a `RoomProblemKind` (would show `roomMismatch`).
   Would change: a second room or a parent-visible requirement.
10. **M-1 threshold `balance.sound.lockedTouches` 3**, WebKit truth a `[human]` row. Would change: an iPad showing the
    line too early or never.
11. **A-9 uses `?e2eArt=stall` + `page.route`**; A-8 (retry count) only if the test needs it. Would change: the test
    needing the retry visible (then A-8 joins phase 13 and the plan records it).
12. **Design gaps numbered in phase order 139–150**: 139 update failed, 140 cut, 141 causes, 142 folders, 143 skipped,
    144 no restart, 145 labels, 146 font, 147 screen fallback, 148 sound blocked, 149 no sound device, 150 salon carried.
    One `[human]` wording row (11.8).
13. **Phases**: 1–6, 8–10 `tdd`; 7, 11 `impl`; 12–14 `e2e` (risks #2, #16, #15, #14). ≤ 2 new UI lines-sets per phase
    (each a section re-render, no new component); phase 11 is the last impl/tdd phase with the seam sweep, `CLAUDE.md`
    and the follow-ups file. 14 phases: at the limit change.md decision 2 named; nothing more deferred.
14. **No decision against the design docs' literal text**: O-3 follows § 9; every new line is a DESIGN-GAP in an
    existing section. The only `[human]` rows for decisions are 2.6 (O-3 scope vs the audit) and 11.6 (wording).
15. **Plan in English** like `change.md` and `research.md`; commit messages in Polish (profile § 1). No lessons file;
    no roadmap row (non-roadmap change).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Deploy smoke asks for every precached file (O-1a/P-3, P-2, S14-06/P-4 2217, P-4 0915)

#### Automated

- [ ] 1.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 1.2 Deliberate break: `entryVerdict` accepting any 200 / `precacheCovers` ignoring one URL → red; restored; meta-check (recorded responses, not Caddy)
- [ ] 1.3 Local proof: `check:deploy` against `vite preview` on 4398 without a SHA prints `precache served: n/n` and `all N checks ok`; with a SHA adds the four table lines; server killed
- [ ] 1.4 `git diff --stat main -- deploy .github` empty
- [ ] 1.5 Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 1.6 [reviewer] Every new assertion satisfied by the live observations quoted in research; every table check under `if (sha7)`
- [ ] 1.7 [reviewer] (CI at ship) workflow `Deploy` job `deploy` step `Smoke check (deploy)` log matches `all [0-9]+ checks ok` (seen in Deploy run 38995649135: `all 20 checks ok`) and contains `precache served: ` with n = N

### Phase 2: "Gra bez internetu" names a failed update (O-2, O-4, O-3, O-5)

#### Automated

- [ ] 2.1 Reversed and new tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 2.2 Deliberate break: `offlineView` without the `error` branch / `waiting` ignored → red; restored; meta-check (view and reducer)
- [ ] 2.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `seed.spec.ts` and `health-lines.spec.ts` "#8 P-1 …" green

#### Manual

- [ ] 2.4 [reviewer] DESIGN-GAP 139 row and comment present; `update()` once per page load only; `vite/config.shared.mjs` unchanged
- [ ] 2.5 [visual] "Gra bez internetu" with the `updateFailed` line, at 1440 and 1024×768
- [ ] 2.6 [human] Accept that the update check runs only at launch (audit asked also "przy powrocie z tła"; rejected so no new worker claims an open page mid-round)

### Phase 3: Boot log names the table, URL and status; every missing texture has a cause (A-3/L-3/B-5/U-3/S14-08, A-4, ASL-07)

#### Automated

- [ ] 3.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`; `artFilter` tests green unchanged
- [ ] 3.2 Deliberate break: `artCauses` order reversed for a cut key → red; restored; meta-check (classifier over recorded events)
- [ ] 3.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `art-stand-in`, `salon-load-health`, `health-lines` specs green

#### Manual

- [ ] 3.4 [reviewer] No texture dropped for a wrong size; the pin names `FILE_LOAD`; no player text in the scene

### Phase 4: Boot limits on the wall clock, the boot record and the queue order (B-3, B-4 record, B-6, A-7 record, P-5, P-6)

#### Automated

- [ ] 4.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 4.2 Deliberate break: sounds before `ROOM_ART` / paused-clock schedule / `stallall` marker removed → each red; restored; meta-check (rules; timers under load = `load-and-tab-guard` #15)
- [ ] 4.3 `npm run build` prints `e2e hook: absent (` with `stallall` in the markers; `stallall` absent from `dist/`
- [ ] 4.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `load-and-tab-guard` and `final-art-loading` specs green

#### Manual

- [ ] 4.5 [reviewer] Both timers cleared on `COMPLETE` and `shutdown`; `fontHealth` and new `bootLoad` fields absent from `SAVE_KEYS`; `balance.loader.totalMs` unchanged
- [ ] 4.6 [human] Optional: throttled cold start (50 KB/s, worker installing) on a real Android tablet against `balance.loader.totalMs`

### Phase 5: "Obrazki" lines builder: each known line, cause and cut (L-8, F4, A-5, B-4 line)

#### Automated

- [ ] 5.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`; `sectionState` tests green unchanged
- [ ] 5.2 Deliberate break: lines dropped while task art is `unknown` → F4 case red; restored; meta-check (builder)
- [ ] 5.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `health-lines` "#14 G-1 …", `art-stand-in`, `salon-load-health` green (changed wording named in the commit)

#### Manual

- [ ] 5.4 [reviewer] DESIGN-GAP 140–141 rows and comments present; no DOM in `src/core`; the renderer adds no style
- [ ] 5.5 [visual] "Obrazki" under `?e2eArt=missing` (cause + `Kod:`) and `?e2eArt=stallall` (cut line), at 1440 and 1024×768

### Phase 6: "Obrazki": folders, skipped tasks, labels, font, restart advice (ASL-02, R-5, A-7 line)

#### Automated

- [ ] 6.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 6.2 Deliberate break: `restartHelps` true for every cause / `labelCap` ignored → red; restored; meta-check (builder rules)
- [ ] 6.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 6.4 [reviewer] DESIGN-GAP 142–146 rows and comments present; copy read of the five lines (numeral agreement, short sentences)
- [ ] 6.5 [visual] "Obrazki" under `?e2eArt=missing` (folders, skipped, no-restart) and `?e2eArt=room` (labels), at 1440 and 1024×768

### Phase 7: The screen fallback the child sees reaches "Obrazki" (U-1/G-2, G-3 record, G-7, G-5)

#### Automated

- [ ] 7.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 7.2 Deliberate break: orphan file / `noteFallback` overwriting → red; restored; meta-check (record and folder rule)
- [ ] 7.3 Build prints `e2e hook: absent (` (marker `e2eArt` check passes); full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-art-wallet`, `final-art-room-done`, `final-art-loading` green

#### Manual

- [ ] 7.4 [reviewer] DESIGN-GAP 147 row and comment present; widgets write only through the one helper; `artFallbacks` absent from `SAVE_KEYS`; child-facing look unchanged
- [ ] 7.5 [visual] "Obrazki" under `?e2eArt=ui` after the unlock card and a wallet task, at 1440 and 1024×768

### Phase 8: "Dźwięki" says when the device will not play (M-1/S-4, S-9, S-10, S-5)

#### Automated

- [ ] 8.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 8.2 Deliberate break: `musicLine` ignoring `lockedCount` / warn-once removed → red; restored; meta-check (rules and service over fakes)
- [ ] 8.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound`, `final-sound-failure` green

#### Manual

- [ ] 8.4 [reviewer] DESIGN-GAP 148–149 rows and comments present; HUD loader listeners removed in every `done` path; effect still before the narrator
- [ ] 8.5 [visual] "Dźwięki" with `soundNoDevice` and with the music `http:404` cause, at 1440 and 1024×768
- [ ] 8.6 [human] Real iPad, context never unlocking: after 3 touches "Dźwięki" shows `soundBlocked` (M-1)

### Phase 9: Decode rejections named at source, prefs warn and probe (S-2, S-7, M-2, FU-16)

#### Automated

- [ ] 9.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 9.2 Deliberate break: wrapper without `.catch` / `applySoundPrefs` ignoring a refused write → red; restored; meta-check (seam over a fake context)
- [ ] 9.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound-failure`, `error-boundary` green

#### Manual

- [ ] 9.4 [reviewer] The real `AudioContext` never mutated; the pin names the seam; `martynka:sound:probe` not a registry or save key; `QUIET_REJECTIONS` unchanged

### Phase 10: Salon carry note, grown room list, art-filter fallback count (M-4/R-3, R-2, ASL-04/S14-05, ASL-03)

#### Automated

- [ ] 10.1 New and widened tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 10.2 Deliberate break: note dropped / `fallback` `none` on the all-empty fallback → red; restored; meta-check (note and rules)
- [ ] 10.3 `SAVE_VERSION` still 4; `git diff --stat main -- tests/fixtures` empty; v1–v4 fixture tests green; `salonCarried` absent from `SAVE_KEYS`
- [ ] 10.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-migration`, `salon-extra-slots`, `art-stand-in` green

#### Manual

- [ ] 10.5 [reviewer] DESIGN-GAP 150 row and row 66 note present; `MIGRATIONS[2]` output byte-identical; no mastery change for fallbacks
- [ ] 10.6 [visual] "Zapis gry" with the `salonCarried` line under `?e2eSave=legacy-salon`, at 1440 and 1024×768

### Phase 11: Unreachable slots in the hook, docs and seam sweep (R-6)

#### Automated

- [ ] 11.1 Hook field test red before, green after; unit `<branch baseline> + N`
- [ ] 11.2 Deliberate break: `unreachable` always empty → red; restored; meta-check (field; real salon = phase 12)
- [ ] 11.3 `validate-rule-files.sh` PASS; deliberate broken path in `CLAUDE.md` → FAIL; restored
- [ ] 11.4 Every follow-up entry has a `Trigger:` line
- [ ] 11.5 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 11.6 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists; no duplicated helper; gap rows 139–150 match the code comments; `SAVE_VERSION` 4 and `git diff --stat main -- tests/fixtures deploy .github` empty
- [ ] 11.7 [reviewer] (CI at ship) workflow `CI` job `check` log matches `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (seen in CI run 38966095199, job 117192831932: `Tests  3416 passed (3416)`, `e2e hook: absent (2 chunks checked)`)
- [ ] 11.8 [human] Accept the wording of gaps 139–150 as one read of the parent's panel lines

### Phase 12: A purchase that cannot be saved, and every chosen slot reachable — e2e (#2, #16)

#### Automated

- [ ] 12.1 The two specs green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 12.2 Deliberate break p12a → (a) red; p12b → (b) red; each restored; meta-check
- [ ] 12.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

### Phase 13: A stalled or broken picture and a missing font in the browser — e2e (#15, #14)

#### Automated

- [ ] 13.1 The three tests green; full `--workers=4`: `<branch e2e baseline> + 3`
- [ ] 13.2 Deliberate breaks p13a, p13b, p13c → each its test red; each restored; meta-check
- [ ] 13.3 Build prints `e2e hook: absent (` (and `stallall` absent from `dist/`); full local gate green; servers 4397/4398 killed

### Phase 14: The screen fallback reaches the panel — e2e (#14)

#### Automated

- [ ] 14.1 The two tests green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 14.2 Deliberate breaks p14a, p14b → each its test red; each restored; meta-check
- [ ] 14.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed
