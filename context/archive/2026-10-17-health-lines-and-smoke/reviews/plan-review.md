<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Health lines and smoke (audit sweep slice 3)

- **Plan**: context/changes/health-lines-and-smoke/plan.md
- **Mode**: Deep (claims checked directly against the code and `node_modules/phaser` 4.2.1; no sub-agent)
- **Date**: 2026-10-17
- **Verdict**: SOUND after triage (REVISE before: 3 warnings, fixed in plan.md)
- **Findings**: 0 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F3; fixed) |
| Plan Completeness | WARNING (F2; fixed) |

## Grounding

Grounding: 8/8 paths ✓ (`scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts`, `src/pwa/registerServiceWorker.ts`,
`src/core/swStatus.ts`, `src/scenes/BootScene.ts`, `src/ui/sound.ts`, `tests/phaserLoaderPin.test.ts`,
`vite/config.shared.mjs`), symbols ✓ (`roomArtCheck`, `precacheFromSw`, `get`, `register().then` with only `active`/
`installing`, `emit` `catch {}`, `loaderror` ternary with the `font` branch, `AudioFile.onProcess`
`this.config.context.decodeAudioData(` + `this.config.context = null`, `LoaderPlugin.addFile` `emit(Events.ADD`,
`nextFile` `FILE_LOAD` before `onProcess`, `File.onProcessError` with no `loaderror`), brief↔plan ✓, Progress↔Phase ✓
(14/14 phases, rows match the criteria bullets; no checkboxes outside Progress).

## Production risks the step prompt named

- **(a) Deploy smoke against the live server.** Every new assertion matches research's live observations (types per
  extension, `index.html` 200 without redirect, 404 for a missing file, no length/cache assert). All 110 entries of
  `TASK_ART`, `UI_ART`, `ROOM_ART` and `SOUNDS` exist in `public/` (checked by a script over the tables), so
  `precacheCovers` cannot go red on today's build. Table checks sit under `if (sha7)`; the rollback step of
  `.github/workflows/deploy.yml` (`Smoke check (rollback)`) passes no SHA, and the per-entry list comes from the served
  `sw.js`, so a rollback passes on any release. 121 HEADs in a pool of 8 take seconds. Gap found: no per-request
  timeout, and the deploy job has no `timeout-minutes` → F1.
- **(b) `registration.update()` once per launch with `skipWaiting` + `clientsClaim`.** No break found: nothing in `src/`
  fetches a hashed `_app/` file after start (`grep` for `url(`, `new Image`, `.src =`, `fetch(` in `src/` is empty), the
  font and every sound use unhashed URLs (`assets/sounds/{m4a,ogg}/<id>.<ext>`, `fonts/…ttf`) that the new precache
  holds too, so the lazily loaded music after a takeover is served from the new cache (a renamed music file would
  fall to the network and end as the quiet "music missing" path). The launch-time takeover already exists through the
  browser's navigation update check; one more check at launch adds no new path. → F6.
- **(c) Phase 9 seam.** Real: `AudioFile` stores `config: { context: audioContext }` and `onProcess` calls
  `this.config.context.decodeAudioData(buf, ok, err)`, then nulls it; `LoaderPlugin.addFile` emits `Events.ADD` with the
  file before it is loaded, so an `addfile` listener can replace `file.config.context` per file. The pin
  (`tests/phaserLoaderPin.test.ts`) asserts `version === '4.2.1'` and reads Phaser's source text, so any upgrade fails
  it. Guard gap for `HTML5AudioFile` / non-promise returns → F3.
- **(d) Save format v4.** Untouched: the only decode change is the runtime `salonCarried` note; fixtures and
  `MIGRATIONS[2]` output are pinned in phase 10's criteria.

## Findings

### F1 — A hung HEAD can hold the Deploy job for hours

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (smoke); Phase 1 § 2, § 3
- **Detail**: `get` in `scripts/check-deploy.ts` uses `fetch` with no signal; undici waits up to 300 s for headers, and
  the `deploy` job in `.github/workflows/deploy.yml` sets no `timeout-minutes` (default 360 min). The plan multiplies
  the request count by ~10 and retries only on a network error, so a stalled connection is a real way for the smoke
  to "grow so slow it times out the job".
- **Fix**: every per-entry HEAD gets `AbortSignal.timeout(HEAD_TIMEOUT_MS)` (15 000, constant in `scripts/`); an abort is
  a network error (one retry, then a failed verdict `timeout`); a unit case for the timed-out verdict.
- **Decision**: FIXED (Critical Implementation Details, Phase 1 Intent and Tests)

### F2 — The `fetch` cause tells the parent "not on the server" for a timeout

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 § 1, Phase 5 § 3, Phase 6 overview/tests, Phase 13 (a)
- **Detail**: Phase 3 classifies every `loaderror` as `fetch` (status 0 included: research says `xhrLoader.status` 0 =
  timeout or network), Phase 5 maps `fetch` to "Tych plików nie ma na serwerze.", and Phase 13 (a) expects the `fetch`
  (timeout) cause for a stalled file. The panel would state a false cause, which is what this slice removes.
- **Fix**: `ArtCause` gains `network` (status 0); copy "Tych plików nie udało się pobrać. Internet był zbyt wolny albo się
  rozłączył." inside gap 141; `restartHelps` = `cut`, `network`; Phase 13 (a) expects `network`.
- **Decision**: FIXED

### F3 — Decode seam has no guard for a file without a Web Audio context

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (S-2 seam); Phase 9 § 4
- **Detail**: Under an HTML5 sound manager Phaser queues `HTML5AudioFile` (type `audio`, no `config.context`), and a
  callback-only `decodeAudioData` returns `undefined`; an unguarded wrapper would throw inside the `addfile` listener at
  boot (the error boundary path) on exactly the devices S-9 is about.
- **Fix**: wrap only when `typeof file.config?.context?.decodeAudioData === 'function'`; `.catch` only on a thenable; two
  more `decodeSeam` cases.
- **Decision**: FIXED

### F4 — Wall-clock boot limits also run while the tab is hidden

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 (B-3)
- **Detail**: `this.time.delayedCall` paused with the loop on `Game.onHidden`; `window.setTimeout` does not, so a first
  start sent to the background can be cut. That is the audit's intent (the downloads keep running).
- **Fix**: recorded in `## Known risks`.
- **Decision**: ACCEPTED

### F5 — An offline launch warns that the update check failed

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 2
- **Detail**: `registration.update()` rejects with a `TypeError` when offline, so every offline launch logs one warn.
  Console only, truthful.
- **Fix**: recorded in `## Known risks`.
- **Decision**: ACCEPTED

### F6 — (b) checked: a launch-time takeover cannot break a started round

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 2; autonomous decision 2
- **Detail**: evidence under "Production risks (b)". Plan decision 2 and `[human]` row 2.6 stand.
- **Fix**: none.
- **Decision**: DISMISSED (no issue)

### F7 — (c) checked: the seam is real and the pin fails on an upgrade

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 9 § 3
- **Detail**: evidence under "Production risks (c)". Phase 13 (c) should also expect the font to be absent from
  `document.fonts` on a 404 (Phaser's `FontFile` adds the face only after `load()` resolves, and its failure calls
  `onProcessComplete`, so the start goes on) — consistent with the plan's `fontHealth` rule.
- **Fix**: none.
- **Decision**: DISMISSED (no issue)

## Other checks

- Drivers: 1–6, 8–10 `tdd` (every one starts from an absent pure function or a reversed pinned case), 7 and 11 `impl`
  (glue and docs), 12–14 `e2e` after the phase-11 seam sweep, each on a browser-level risk (#2, #16, #15, #14) whose
  feature exists before it. Correct.
- Follow-ups whose `Trigger:` names this area (change.md table): every fired one is in or deferred with a trigger;
  A-8 conditional on phase 13 is recorded.
- Product decisions vs `Martynka-urzadza.md` § 9 ("cicha aktualizacja przy następnym uruchomieniu"): launch-only
  `update()` follows the text; `[human]` rows 2.6 and 11.8 name the judgement calls.
- Phase sizing: 14 phases, each one code area and one green gate; no split or merge needed.

VERDICT: PROCEED — the approach holds against the code and the live server; three gaps (smoke request timeout, a false "not on the server" cause, the decode-seam guard) were fixed in plan.md.
