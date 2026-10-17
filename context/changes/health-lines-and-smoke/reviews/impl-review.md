<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Health lines and smoke

- **Plan**: context/changes/health-lines-and-smoke/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
- **Date**: 2026-10-17
- **Verdict**: APPROVED (after the fixes below; before them NEEDS ATTENTION with two production-safety defects)
- **Findings**: 2 critical (fixed), 5 warnings (4 fixed, 1 follow-up), 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (documented deviations only: p7 loading fallback written from `BootScene.create`, p10 `parseImport` without the note = follow-up 14, p12 break replaced, p13 A-9 round skip unit-proved, p14 +3) |
| Scope Discipline | PASS (nothing under `deploy/`, `.github/`, `vite/config.shared.mjs`, `tests/fixtures`; `SAVE_VERSION` 4) |
| Safety & Quality | PASS after fixes (F1, F2 were FAIL) |
| Architecture | PASS (pure rules in `src/core`, no DOM/Phaser there; one `isLocalHost`, one `tableOf`, one `recordFallback`) |
| Pattern Consistency | WARNING (dead helpers and a second name helper, follow-up 17) |
| Success Criteria | PASS (every suite re-run, see handoff § 3) |

## Production safety checks (step prompt a-e)

- (a) Smoke: live run against https://martynka-urzadza.pl without a SHA (rollback mode), read-only, before and after F1: `precache served: 121/121`, `all 17 checks ok`, 4.2 s. Per-entry HEAD: `AbortSignal.timeout(15000)`, one retry after 5 s on a network error or abort only, pool of 8 (`HEAD_POOL`), worst case about 9 min against a server that stalls every file. SHA run against `vite preview` of this branch's build (port 4399, fake SHA `abcdef1`): the four table lines ok (task 41/41, screen 5/5, room 38/38, boot sounds 24/24), `precache served: 121/121`, immutable skipped on localhost; only `build id` fails (expected for a fake SHA). `git diff main...HEAD -- deploy .github` empty.
- (b) `registration.update()` once in `register().then`, rejection warned; `skipWaiting`/`clientsClaim`/`registerType` unchanged; a found worker claims without a reload and every asset is loaded at start, so a started round goes on (comment corrected, F6).
- (c) Boot: timers cleared on `COMPLETE` and `shutdown`; queue order loading pictures, font, task, room, ui, sound; size check reports only; a cut or failed file ends on the stand-in path (e2e `load-and-tab-guard`, `art-stand-in`, `final-art-loading` green). F2 and F3 fixed.
- (d) `tests/phaserLoaderPin.test.ts` pins `FILE_LOAD`/`FILE_LOAD_ERROR` in `nextFile`, `ADD` from `addFile`, `AudioFile.onProcess` calling `decodeAudioData(` with three arguments and nulling the context.
- (e) `git diff main...HEAD -- src/core/save.ts`: `salonCarried` only on `DecodeResult`/`LoadOutcome` and `REGISTRY_KEYS.salonCarried` (not in `SAVE_KEYS`); `tests/fixtures` untouched; `LIFT_V2_SALON = (r) => carryV2Salon(r).value`.
- No database, no write endpoints, no external identifiers: the change touches a static PWA, its deploy smoke (read-only GET/HEAD) and local runtime state.
- Hooks: `.claude/settings.json` and `.claude/hooks/*` unchanged since 2026-10-10/12, no `--no-verify` in the run; no hook bypass.

## Findings

### F1 — Deploy smoke GETs had no time limit

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: scripts/check-deploy.ts `get`, the `www` fetch in `main`
- **Detail**: Only the new per-entry HEAD carried `AbortSignal.timeout`; `/`, `/index.html`, manifest, `sw.js`, the bundles and the `www` probe (and their body reads) could hold the Deploy job, which has no `timeout-minutes`, until the 6 h default. The step prompt asked for the per-request timeout of the smoke that this branch rewrote.
- **Fix**: `signal: AbortSignal.timeout(GET_TIMEOUT_MS)` (60 s, covers the body read) in `get` and the `www` fetch; an abort is a fetch error, so the first GET still retries (`RETRIES`) and `failLine` names the path.
- **Decision**: FIXED

### F2 — `document.fonts` read could stop the game from starting

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts `create` (font record)
- **Detail**: `[...document.fonts]` sat outside any `try` before the scene hand-off; a browser without an iterable `FontFaceSet` would throw in `create()` and never start the game, for a diagnostic line.
- **Fix**: read the faces in `try`, warn `Font set could not be read`, record `fallback`.
- **Decision**: FIXED

### F3 — A failed cut was swallowed and left the loading screen up

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts `preload` `arm`
- **Detail**: Moving the cut from `this.time.delayedCall` to a window timer wrapped it in a `try` that only warned; an exception in `cutLoad` used to reach the error boundary (restart card) and would now leave the bar forever.
- **Fix**: the catch warns and rethrows (the slow line keeps its own catch), so the error boundary shows the card as before.
- **Decision**: FIXED

### F4 — "Dźwięki" kept saying the device blocks sounds after it unlocked

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/sound.ts `createSoundService` `record`
- **Detail**: `lockedCount` only grew; three effects tapped before the first unlock left `soundBlocked` (gap 148) on for the session although sounds played. An untrue parent line.
- **Fix**: a `played` outcome resets the counter; test `forgets the swallowed effects once a sound plays` in `tests/soundMusic.test.ts`, red first (`expected 3 to be +0`).
- **Decision**: FIXED

### F5 — Gap rows 114/120 lacked their notes; CLAUDE.md called old seams new

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: docs/design-gaps.md rows 114, 120; CLAUDE.md health-lines paragraph
- **Detail**: Phase 8 § 3 asked for "gaps 114 and 120 get a note"; the paragraph listed `?e2eArt=stallall` and `?e2eSave=legacy-salon` as new seams (both exist on main).
- **Fix**: "see also 148-149" notes on both rows; the paragraph names `?e2eArt=ui` as the one new seam and `stallall` as the new marker. `validate-rule-files.sh` PASS.
- **Decision**: FIXED

### F6 — The `update()` comment promised no mid-round claim

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pwa/registerServiceWorker.ts `registerServiceWorker`
- **Detail**: With `skipWaiting` + `clientsClaim` a worker found by the launch check still claims the page a little after the start (as the browser's own check did before); the comment said it never does. Behaviour accepted (no reload, assets loaded at start); the text was wrong.
- **Fix**: comment reworded.
- **Decision**: FIXED

### F7 — The immediate flush after a purchase is not proven in the browser

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: tests/e2e/save-restart.spec.ts `#2 M-5 …`; src/scenes/RoomScene.ts `dispatch`
- **Detail**: The planned break p12a (no `flush('now')` after a purchase) stayed green because the 500 ms debounce writes before the spec reads the failure count; phase 12 replaced it by breaks that the test does catch (disclosed). The test proves the failing store reaches the panel, not the immediate flush.
- **Fix**: follow-up 15 (trigger: a change to `RoomScene.dispatch` or the debounce).
  - Strength: no flaky timing test now; the flush is unit-proved.
  - Tradeoff: a tab closed within 500 ms of a purchase is not browser-proved.
  - Confidence: MED — the debounce masks the break in any spec that waits.
  - Blind spot: a seam making the debounce inert in the hook build was not tried.
- **Decision**: ACCEPTED (follow-up 15)

### F8 — Seams left for later

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: scripts/deploy-check/parse.ts `roomArtCheck`; src/core/bootLoad.ts `bootLoadPhase`; src/core/artHealth.ts `sectionState`; src/core/sound.ts `parseSoundPrefs`; src/pwa/registerServiceWorker.ts `nameOf`; src/testing/e2eHook.ts `UI_MISSING_URL`; src/ui/sound.ts `startMusic`
- **Detail**: test-only exports, a second error-name helper, a hook-only string kept out of `dist/` by terser folding (0 hits checked in this branch's build) rather than by a marker, a pre-existing `once('addfile')` that can outlive a music start that queued nothing; A-9 round skip proved by unit only.
- **Fix**: follow-ups 16-19 with triggers.
- **Decision**: ACCEPTED (follow-ups 16-19)

### F9 — Phase 8 amended one commit

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: commit 7a86ab8 (handoff p8 § 6 decision 8)
- **Detail**: Against the contract's "never amend", disclosed; local, unpushed, before any sha was cited. Not a hook bypass.
- **Decision**: ACCEPTED

### F10 — Phase commit messages 3-14 in English

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `git log main..HEAD`
- **Detail**: Profile § 1 says commit messages in Polish; p1, p2 are Polish, later phases English. Not rewritten (contract forbids rewriting); the squash/PR title at ship can be Polish.
- **Decision**: ACCEPTED

## Parent-facing copy (gaps 139-150)

Read as a parent: calm, short, no blame, no harsh words. Numeral agreement checked by rendering: "pieniądze: brak 1 obrazka / 2 / 5 / 12 / 22 obrazków." (genitive after "brak" in every form). "Brakuje: sofa wariant 1, dywan." and "Zamiast obrazka gra rysuje: portfel, zeszyt." read well. The cause line and the cut line never repeat each other (`artHealthLines` `cutSaysIt`), the device line hides the repeated music line (`settingsPanel` `musicStatus.hidden`). The `Kod: http:404` music line (p8 extra) is technical but muted and follows the save lines' pattern. Wording accept stays the `[human]` row 11.8.

MERGE: CLEAR — both CRITICAL findings fixed in 06c6a63; unit 3545 + 109, e2e 132 + 7, live rollback smoke 17/17 all green after the fixes; only follow-ups and [visual]/[human] rows remain.
