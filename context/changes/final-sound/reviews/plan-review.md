<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Dźwięki gry z paczki salon-v2 (S-16b `final-sound`)

- **Plan**: context/changes/final-sound/plan.md
- **Mode**: Deep (claims checked directly against the code and `node_modules/phaser` 4.2.1; no sub-agent)
- **Date**: 2026-10-16
- **Verdict**: SOUND after fixes (was REVISE)
- **Findings**: 0 critical, 6 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F3, F4, F6 — fixed in plan) |
| Plan Completeness | WARNING (F2, F5 — fixed in plan) |

## Grounding

Grounding: 8/8 paths ✓ (`src/scenes/BootScene.ts`, `UIScene.ts`, `src/ui/dom/settingsPanel.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `tests/errorSignal.test.ts`, `src/core/variantPanel.ts`, `docs/human-checklist.md`), symbols ✓ (`cutLoad`, `QUIET_REJECTIONS`, `signalOfRejection`, `artHealth`, `stepPanel`/`PanelEvent`/`PanelState`, `TrayDragState.carrying`, `RoundState.bonusEarned`, `stallall`, `ROUND_SPEC`, design-gaps last row 113), one wrong symbol (F5: `advance` is not in `src/core/round.ts`), brief↔plan ✓.

Phaser 4.2.1 claims verified in source:
- `AudioFile.getAudioURL` returns the first URL whose `game.device.audio[ext]` is true and never falls back (`loader/filetypes/AudioFile.js`); `device/Audio.js` sets `m4a = canPlayType('audio/x-m4a')`, `ogg = canPlayType('audio/ogg; codecs="vorbis"')` → `[m4a, ogg]` order is correct.
- `AudioFile.onProcess` calls `decodeAudioData(response, ok, err)` and drops the returned promise; `err` → `File.onProcessError` → `loader.fileProcessComplete` (`loader/File.js`) → the `cutLoad` gap the plan names is real.
- `LoaderPlugin.fileProcessComplete` does NOT emit `FILE_LOAD_ERROR`; only `nextFile` does (download failure) → F3.
- `WebAudioSoundManager.unlock` listens on `document.body` (touchstart/touchend/mousedown/mouseup/keydown), sets `unlocked` after `resume()`; `BaseSoundManager.update` clears `locked` and emits `UNLOCKED` on the next step.
- `BaseCache.add` is a plain `Map.set` (overwriting a key works); `WebAudioSound` reads `cache.audio.get(key)` at creation → trimming before the first `play` is effective.
- `Loader.FILE_ERRORED` = 16 (`loader/const.js`).

## Planner's open questions — answers

1. **Bonus field in `RoundState`**: `bonusEarned` (set by `next` when the round finishes clean; variants have `cleanRoundBonus` 0). `next` also adds the bonus to `starsEarned`, so the `star` rule must be bound to the transition into `done` — written into Phase 2 (F5).
2. **`vi.mock('phaser')` for `loaderCut` tests in node**: enough — `loaderCut.ts` imports only `Loader` from `phaser`, the factory replaces the module so Phaser never loads; but vitest runs in `node` and `cutLoad` evaluates `file.data instanceof HTMLImageElement` for every `queue` file → `ReferenceError`. Add `vi.stubGlobal('HTMLImageElement', class {})` (F2, written into Phase 3).
3. **`UIScene` lifetime for the music loader**: launched once in `TaskScene.create` (`scene.launch(SCENE_KEYS.ui)`), never stopped or restarted; `scene.switch` to the room sleeps only `TaskScene`; the settings panel is reachable only through `UIScene`. So `UIScene`'s loader is a valid owner for the whole session. Gap: music on from `localStorage` after a reload must start without the panel → `attachLoader` starts it (F6, Phase 7 + 9(c)).

## Follow-ups with `Trigger: S-16b`

| Follow-up (`context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md`) | In plan? |
|---|---|
| `audio.noAudio` and audio rejections outside the error boundary | included — Phase 3 (`QUIET_REJECTIONS`, `cutLoad` `onProcessError`), proven in Phase 10(a) |
| Purchase sound / variant-change sound, empty `RoomScene.playPurchaseSound` (gap 35) | included — Phase 2 `panelCue`, Phase 6 (gap 35 closed) |
| VO3 hold outline (`Trigger: designer brief delivers a hold view, or S-16b`) | deferred, justified (art/outline problem, sound brings nothing), re-triggered in Phase 8 follow-ups |

## PRD check

FR-017 (sound on "Wybieram"): `purchase` on every confirm ✓; the parent's effects toggle can silence it — an author decision (roadmap S-16b), not a contradiction. FR-026 (sounds after the first touch): Phaser unlock + `locked` outcome ✓. NFR (playable without sound, no information by sound alone): no state depends on a sound; missing/broken files are `missing`, never the error card ✓. Effects never cut the narrator: no `narrator.cancel()` from effects; card speech delayed by `cueDelayMs` — speech is unlocked session-wide on the first tap (`main.ts` `unlockSpeech`), so the delayed `speak` outside the gesture still works ✓. Product decisions needing the author's ear (free change plays `purchase`, single `answer-retry`, `tap`+`round-bonus` together) were added to `[human]` row 9.7 (F8).

## Drivers

Phases 1–3 `tdd` (pure core + a mocked loader), 4–8 `impl`, 9–10 `e2e` after every feature they prove (5–7 and 3–5). Correct; no driver change.

## Findings

### F1 — Service worker precache breaks the request-count assertions

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 9 (c), Phase 10 (b) and seed
- **Detail**: The hook build is a production build, so the service worker registers and its install fetches every precache entry, including both `music-loop` files. 9(c) asserts "zero `music-loop` requests before Zatwierdź" and the seed "exactly 12 sound requests"; counted at context level they would be false reds. `page.route` also does not intercept fetches handled by the SW, so 10(b) (no `serviceWorkers: 'block'`) could not hang the sounds.
- **Fix**: `serviceWorkers: 'block'` in `final-sound.spec.ts` and 10(b) (as `load-and-tab-guard.spec.ts`); count with `page.on('request')` (page level) in 9(c) and the seed.
- **Decision**: FIXED (plan Phase 9 (c), Phase 10 (b), seed)

### F2 — `loaderCut` unit test would throw `ReferenceError` in node

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §2
- **Detail**: `vitest.config.mts` has no environment (node); `cutLoad` evaluates `file.data instanceof HTMLImageElement` for queue files. The "red by assertion" criterion cannot hold without a stub.
- **Fix**: `vi.stubGlobal('HTMLImageElement', class {})`; `FILE_ERRORED: 16` in the mock factory.
- **Decision**: FIXED

### F3 — A decode failure never fires `loaderror`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 §3 (music), Phase 5 §1
- **Detail**: Phaser emits `FILE_LOAD_ERROR` only from `nextFile`; a broken file goes `onProcessError` → `fileProcessComplete` silently. A music status driven by `loaderror` would stay `loading` forever on a corrupt file.
- **Fix**: decide `music` on the loader `complete` event via `cache.audio.exists`; boot health already uses the cache.
- **Decision**: FIXED

### F4 — `coin` would play on a cancelled drag

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2 `dragCue`
- **Detail**: `idle` in `src/core/trayDrag.ts` sets `carrying: null` on cancel and on a drop back to the tray too, so "carrying → null" alone is not "put down".
- **Fix**: require the `mat` total to grow; `dragCue` takes the `TrayDragState` shape.
- **Decision**: FIXED

### F5 — Wrong reducer name and an unnamed bonus field

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 §1 `roundCues`
- **Detail**: `src/core/round.ts` exports `startRound`, `answer`, `nextSolutionStep`, `next` (no `advance`); the bonus is `bonusEarned`, and `next` adds it to `starsEarned`, which the star rule would misread as a star.
- **Fix**: named the reducers and `bonusEarned > 0`; `star` only on entering `done`; added test "the bonus at the round end plays round-bonus, not star".
- **Decision**: FIXED

### F6 — Music on after a reload had no start path

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 §3, Phase 9 (c)
- **Detail**: Music loads in `setPrefs` "when there is a loader"; at boot the prefs come from `localStorage` before `UIScene` exists, so a saved `music: true` would never start. 9(c) only checked `prefs` after the reload.
- **Fix**: `attachLoader` starts the load when `prefs.music`; 9(c) asserts the `music-loop` request after the reload without the panel; `shutdown` of `UIScene` detaches (Known risks).
- **Decision**: FIXED

### F7 — Trimming on the HTML5 Audio fallback

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §1
- **Detail**: Without Web Audio, Phaser uses `HTML5AudioFile`; cache entries are not `AudioBuffer`, so the per-key `try` would mark every effect missing instead of playing untrimmed.
- **Fix**: skip non-`AudioBuffer` entries (recorded in Known risks).
- **Decision**: RECORDED (Known risks)

### F8 — Product decisions not on the author's listening list

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 9 Manual, Progress 9.7
- **Detail**: Decisions 6 and 7 (single `answer-retry`, `purchase` on a free change — FR-018 rather than FR-017) and the `tap` + `round-bonus` overlap name the author's listening as the reversal, but row 9.7 did not list them.
- **Fix**: added to 9.7.
- **Decision**: FIXED

### F9 — Handoff row count arithmetic

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: previous `handoff.md` §1/§3
- **Detail**: the plan step reported 49 Progress rows; per phase 4+4+4+4+5+3+5+3+7+6 = 45, and `grep -c '^- \[ \]'` prints 45. Progress ↔ Success Criteria stays 1:1; only the sum was wrong.
- **Fix**: new handoff states 45.
- **Decision**: FIXED

VERDICT: PROCEED — no critical findings; six warnings fixed in plan.md (SW-aware request counting, node stub for the loaderCut test, decode failures without loaderror, cancelled drag, round reducer/bonus names, music start after reload), Phaser 4.2.1 claims hold in source, drivers correct.
