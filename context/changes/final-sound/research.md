---
date: 2026-10-16T00:56:34+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s16bcd, research step)
git_commit: 4a95e2e380b4712141a1257ca98413a93a6fe4ab
branch: feat/final-sound
repository: Martynka-urzadza
topic: "Game sounds (S-16b): Phaser 4.2.1 audio load/unlock/decode, the boot cut, music loading, precache formats, the sound setting outside the save, narrator, error boundary, event sites, settings UI, e2e"
tags: [research, sound, WebAudioSoundManager, AudioFile, loaderCut, BootScene, errorSignal, settingsPanel, idb, precache, e2e-hook]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (research step)
---

# Research: game sounds from the salon-v2 pack (S-16b `final-sound`)

**Date**: 2026-10-16T00:56:34+02:00
**Git Commit**: 4a95e2e (branch `feat/final-sound`, main `a1625be` + the change-identity commit)
**Phaser**: 4.2.1 (`node_modules/phaser/src`)

## Research Question

From `change.md` and `handoff.md` §5: how to add the 12 P1 effects and the optional `music-loop` to the game with
Phaser 4.2.1 — loader format choice (OGG + M4A), unlock on the first touch, decode as a loader file type and what
`cutLoad` must do with a decoding audio file; whether music belongs in the boot queue (746 KB M4A vs
`balance.loader`); which formats to precache (iOS Ogg Vorbis support); where the sound setting lives (outside the
save, effects on / music off by default); narrator vs effects; the error boundary and audio rejections; which code
sites fire which effect; the settings panel section; how e2e asserts a sound.

## Summary

- **Loader**: `this.load.audio(key, [ogg, m4a])` picks ONE URL at queue time — the first whose
  `game.device.audio[type]` is truthy (`AudioFile.getAudioURL`, `node_modules/phaser/src/loader/filetypes/AudioFile.js:186-219`;
  `Audio.ogg = CanPlay('ogg; codecs="vorbis"')`, `Audio.m4a = CanPlay('x-m4a')`, `device/Audio.js:81,85`). There is
  **no fallback** to the second URL after a failed download or decode. With Web Audio available the file is an
  `AudioFile` (XHR `arraybuffer`, covered by BootScene's per-file xhr timeout copy, `BootScene.ts:48-55`), decoded in
  `AudioFile.onProcess` (`AudioFile.js:87-111`) through `decodeAudioData` **callbacks**; the returned promise is dropped.
  A decode failure → `console.error` + `onProcessError` → `FILE_ERRORED`, the loader continues; **no `loaderror`
  event** fires on that path (only download failures emit it). A key with no playable URL is skipped with
  `console.warn` (`AudioFile.js:147-153`), and `sound.add(key)` for a missing key **throws**
  (`WebAudioSound.js:54-59`) → every play must be guarded by `cache.audio.exists(key)`.
- **iOS Ogg Vorbis (checked, caniuse `ogg-vorbis`, 2026-10-16)**: Safari iOS 3.2–17.3 not supported; 17.4–18.3
  partial (no reason given); 18.4+ supported. So an iPad on iPadOS < 17.4 needs M4A, and on 17.4–18.3 `canPlayType`
  may say "maybe" for Vorbis while support is only partial. **Recommendation**: keep both formats in the repo and in
  the precache (a static precache manifest cannot differ per platform); because Phaser never falls back, the plan
  should either order `[m4a, ogg]` (AAC is decodable by Web Audio in Safari, Chrome and Android; costs bytes, not
  correctness) or add its own fallback (on a decode failure of key K, queue K again with the other URL). Choice for the
  plan; the first is simpler, the second keeps OGG's smaller downloads on Android.
- **Music outside the boot queue**: `music-loop.m4a` is 746 014 B (OGG 107 707 B). Music is off by default, so the
  boot queue should hold only the 12 effects (M4A 132 243 B, OGG 81 144 B in total) and the music should be loaded
  lazily by a scene's loader only when a parent switches music on (`LoaderPlugin.start` works outside `preload`,
  `LoaderPlugin.js:905-945`), with its own per-file xhr timeout (Phaser defaults each file to 0, `BootScene.ts:48`) and
  a `cache.audio.exists` guard before `sound.add`. HTML5 audio streaming is **not** an option: Phaser picks Web Audio
  or HTML5 globally (`AudioFile.js:159-166`), `stream` is commented out (`:156-157`). Optional: re-encode the M4A loop
  to a lower bitrate (`afconvert`/`ffmpeg` exist locally) — ~124 kbps mono today; a script decision for the plan.
- **Precache**: `workbox.globPatterns` already takes `ogg` and `m4a` (`vite/config.shared.mjs:49-59`, 10 MiB per-file
  cap, no `globIgnores`); both formats = 1 067 108 B. `check:deploy` checks only the index bundles
  (`scripts/check-deploy.ts:77-82`); the offline seed spec asserts `TASK_ART` URLs came from the service worker
  (`tests/e2e/seed.spec.ts:49-52`) — the pattern to extend with one row per sound file. A lazy music load is offline-safe
  because the worker precaches it anyway.
- **Unlock**: with no `audio` key in the game config (`src/main.ts` `createGame`) Phaser builds a
  `WebAudioSoundManager` (`SoundManagerCreator.js:47-57`); `locked = context.state === 'suspended'`
  (`WebAudioSoundManager.js:89`); `unlock()` (`:348-389`) adds bubbling listeners on `document.body` for
  `touchstart/touchend/mousedown/mouseup/keydown` that call `context.resume()`; `locked` turns false and `'unlocked'`
  is emitted on the next `update` (`BaseSoundManager.js:671-676`). No `stopPropagation` exists anywhere in `src/`
  (grep) and `src/ui/dom/overlay.ts:2-3` keeps it so. **WebAudio has no locked-play queue**: `play()` while locked
  schedules on a suspended context and the sound plays late when it resumes. Recommendation: skip effects while
  `sound.locked` (the first touch's own cue may be lost; acceptable).
- **Loader cut**: `cutLoad` (`src/scenes/loaderCut.ts:10-47`) stubs `onProcessComplete` for every queue file but
  **not `onProcessError`**. An audio file cut mid-decode whose decode later fails calls `File.onProcessError` →
  `loader.fileProcessComplete` (`File.js:479-490`), which with empty sets runs **`loadComplete()` a second time**
  (`LoaderPlugin.js:1083-1123`, state forced to `LOADER_COMPLETE` even over shutdown). Fix: also set
  `file.onProcessError = () => undefined` for every decoding file; add pin tests (below).
- **Error boundary**: `QUIET_REJECTIONS = {AbortError, NotAllowedError}` (`src/core/errorSignal.ts:10`),
  `isFatalSignal` (`:17-25`). Per the Web Audio spec `decodeAudioData` also rejects its promise; Phaser drops it, so a
  corrupt file can raise an unhandled `EncodingError` → **fatal → restart card** (`signalOfRejection`,
  `src/ui/dom/errorBoundary.ts:11-21`). `NotSupportedError` is also fatal; `NotAllowedError` (resume) is quiet.
  Recommendation: add `EncodingError` (and arguably `NotSupportedError`) to the quiet list with a test, and prove it
  with an e2e seam that points one sound at a non-audio file. Closes follow-up `audio.noAudio` (archive
  `2026-10-13-observability-c1-c2/follow-ups/review-fixes.md:10`).
- **Sound setting outside the save**: feasible, nothing forces it into the save. `Settings` is `{autoRead}` only
  (`src/core/types.ts:105-107`) and `validateSave`/encode copy only that (`save.ts:104-106,179,191`), so a field would
  change the format — rejected. `src/storage/idb.ts` stores `profile:default` in database `martynka`, store `saves`
  (`:8,62-64`) and exposes only `read/write/backup` (no `clear`), and `Autosaver.replace` writes only the profile key
  (`autosave.ts:313-345`) → a second key (e.g. `pref:sound`) through a new small store in `src/storage/idb.ts`
  **survives reset and import**. Read it in `main.ts` `start()` after the save outcome and before `createGame`
  (~`main.ts:209`), under its own short time limit with default `{effects: true, music: false}` on any failure, put it
  in a new runtime registry key outside `SAVE_KEYS`. `localStorage` is allowed outside `src/core` by ESLint
  (`eslint.config.mjs:46`) and unused in `src/`; the IndexedDB key keeps one storage and the existing ESLint boundary,
  `localStorage` would be synchronous and simpler — plan choice, both are outside the save.
- **Narrator**: Web Audio effects do not touch `speechSynthesis`; nothing cancels speech on taps (`cancel()` callers:
  `TaskScene` `toRoom`, `applyParentStage`, summary render; `UIScene.openSettings`; `main.ts` hidden). Overlap
  points: `skill-unlock` (1.4 s) with `autoReadUnlock` (`TaskScene.ts:~790-795`) and `room-done` (2.3 s) with the
  speak in `RoomScene.showCard` (`:246-258`). `Narrator` exposes no "speaking" state (`src/ui/narrator.ts:43-51`), so
  real ducking needs an extension (utterance `onend` exists, `:110`). Recommendation: start those readings after the
  cue's manifest `duration`, and keep music quiet (pack gain 0.14). iOS mixing of speech with Web Audio is unverified
  → human checklist on the tablet.
- **Event sites**: table below; the pure classification can live in `src/core` (`roundCue(before, after)`,
  `panelCue(step)`), scenes only call `play(key)`.
- **Settings UI**: reuse the autoRead On/Off group of `openSettingsPanel` (`src/ui/dom/settingsPanel.ts:54-79`) twice
  ("Efekty dźwiękowe", "Muzyka"; `pl.settings.autoReadOn/Off` labels reusable), applied in `UIScene.applySettings`
  (`UIScene.ts:221-233`) plus an explicit pref-store write; DESIGN-GAP row 114 (last gap is 113).
- **e2e**: count cues, not audio — a sound service keeps a log of requested keys with outcome
  (`played | off | locked | missing`), exposed read-only by `window.__martynkaE2E` like `save()`; new seam e.g.
  `?e2eSound=corrupt` with marker `e2eSound` in `vite/e2eHookGuard.mjs:6`.

## Detailed Findings

### Phaser 4.2.1 audio (verified in source)

- Manager choice: `config.audio = {}` by default (`core/Config.js:311`); `NoAudioSoundManager` if `noAudio` or no
  audio support, otherwise `WebAudioSoundManager`, else HTML5 (`sound/SoundManagerCreator.js:47-57`).
- `AudioFile.create` (`AudioFile.js:140-166`): `getAudioURL` → `null` → `console.warn('No audio URLs for "%s" can play
  on this device')`, file skipped silently. With `noAudio`, the `audio` loader factory returns before queueing
  (`:285-289`).
- `onProcess` (`AudioFile.js:87-111`): `decodeAudioData(response, ok, err)`; `ok` sets `data` and calls
  `onProcessComplete`; `err` logs and calls `onProcessError`. Decoding has no timeout.
- Loop: `WebAudioSound` loops by scheduling a new source at the end (`createAndStartLoopBufferSource`,
  `WebAudioSound.js:393-408, 640-655`), not `AudioBufferSourceNode.loop`; markers (`BaseSound.addMarker`,
  `BaseSound.js:196-225`) give a start/duration window. Cache entries are plain `AudioBuffer`s, so trimming to the
  manifest `duration` (README: AAC priming/padding) can be done by replacing the cache entry with a
  `createBuffer`+`copyToChannel` copy before any `sound.add`, or by a marker. The pack's 40 ms crossfade is not
  available through Phaser's loop; whether the marker loop clicks is a listening check (human checklist).
- Volume: global `sound.mute/volume` (`WebAudioSoundManager.js:530-592`), per-sound `mute/volume`; no buses → keep a
  reference to the music sound for its on/off.
- Blur: `pauseOnBlur` true (`BaseSoundManager.js:108`); window blur suspends the context, focus resumes
  (`WebAudioSoundManager.js:399-405, 476-482`); `VISIBLE` does an iOS suspend/resume after 100 ms (`:103-131`).

### Boot load and `cutLoad`

- `balance.loader = { timeoutMs: 12000, maxRetries: 1, slowAfterMs: 8000, totalMs: 45000 }` (`src/data/balance.ts:17`),
  comment "largest file 289 KB … S-16b adds about 13 sounds". With music out of the boot queue the largest added file
  is `room-done.m4a` 34 285 B, so the per-file assumption holds; the comment needs the sound bytes.
- Pin tests to add beside `tests/phaserLoaderPin.test.ts` (source-text pins): `AudioFile.prototype.onProcess` still
  calls `onProcessComplete`/`onProcessError` from callbacks; `File.prototype.onProcessError` still calls
  `loader.fileProcessComplete`; plus a unit test with a fake loader: after `cutLoad`, calling a decoding file's
  `onProcessError`/`onProcessComplete` does not reach `fileProcessComplete`.

### Event → effect sites (anchors ±2 lines in `render`/`advance`)

| Effect | Site | Condition |
|---|---|---|
| answer-right | `TaskScene.submit` `:725-741` | phase before `first`/`second`/`retype` → `done` (`round.ts` `answer` `:72-87`, `settle` `:60-64`) |
| answer-retry | same | `first` → `second` (gentle "hmm"); `second` → `solution`: plan decides (same cue or none) |
| star | `TaskScene.syncStars` `:967-974` | `starsEarned` grew; independent of `flyStar` (skipped under reduced motion, `:1043-1061`) |
| round-bonus | `TaskScene.advance` `:744-755` | `!wasFinished && finished && bonusEarned > 0` |
| skill-unlock | `TaskScene.startNextRound` `:761-776` beside `autoReadUnlock` | not in `render()` (re-runs on wake, `:296`) |
| minigame-done | `advance` finish transition with `kind !== 'round'` | not in `render()` `doneCard.show` (`:393-399`) |
| coin | `TaskScene.feedDrag` `:1151-1177` | `carrying` non-null → null on `up` (blocks, coins, clock reducers) |
| tap | `ActionButton` (`src/ui/widgets/ActionButton.ts:23`, pointerdown), `PageButton` (`PageButton.ts:35`, pointerup) | answer tiles/keys/OK buttons already get answer cues — plan decides precedence |
| panel-open | `RoomScene.dispatch` `:201-244` | `panel.kind` closed → open (`variantPanel.ts` `stepPanel`, open or hold `change`) |
| variant-pick | same | `pick` event (`VariantPanel` `onPick`) |
| purchase | `RoomScene.playPurchaseSound` `:379-381` (called `:316`, `:339`) | only on `step.bought`: `celebrate` also runs for a free change (`:240-243`) |
| room-done | `RoomScene.showCard` `:246-258` | once (`cardDrawn` guard) |
| music-loop | room scene / global, when setting `music` is on | lazy load, see Summary |

### Error boundary, settings, e2e

- `signalOfRejection` takes `name` only when `reason instanceof Error` (`errorBoundary.ts:11-21`); a nameless
  rejection is fatal. DOMException `instanceof Error` on old iPad WebKit is unverified.
- `openSettingsPanel` options `:13-36`, elements order in `openDialog` `:126`, Confirm/Cancel `:83-89`;
  `tests/dialogSessions.test.ts` pins dialog callbacks (`DIALOG_CALLBACKS`).
- e2e: `installE2EHook` (`src/testing/e2eHook.ts:214-293`) pulls from scene methods and registry keys; build flag
  `__E2E_HOOK__` (`vite/config.shared.mjs:66`); seams read in `main.ts` behind `__E2E_HOOK__`. The e2e in-memory save
  store (`e2eSaveStore`, `e2eHook.ts:147-187`) implements only `SaveStore`; under a save seam the sound-pref store
  should also be in memory (or explicitly real IndexedDB) — plan decides.

## Code References

- `node_modules/phaser/src/loader/filetypes/AudioFile.js:87-111,140-219,285-289` — decode, create, URL choice
- `node_modules/phaser/src/device/Audio.js:81,85` — `ogg`/`m4a` detection
- `node_modules/phaser/src/sound/webaudio/WebAudioSoundManager.js:89,348-389,399-405` — locked, unlock, blur
- `node_modules/phaser/src/sound/webaudio/WebAudioSound.js:54-59` — missing-key throw
- `node_modules/phaser/src/loader/LoaderPlugin.js:1083-1123,905-945` — fileProcessComplete/loadComplete, start
- `src/scenes/loaderCut.ts:10-47` — `cutLoad` (missing `onProcessError` stub)
- `src/scenes/BootScene.ts:48-55,62-74` — per-file timeout copy, slow/total timers
- `src/core/errorSignal.ts:10,17-25`; `src/ui/dom/errorBoundary.ts:11-21,52-53`
- `src/storage/idb.ts:8,28,62-91`; `src/core/autosave.ts:5-10,313-345`; `src/main.ts:109-124,130-237`
- `src/ui/dom/settingsPanel.ts:13-36,54-89,126`; `src/scenes/UIScene.ts:146-168,221-233`; `src/data/pl.ts:31-37`
- `src/scenes/TaskScene.ts`, `src/scenes/RoomScene.ts` — table above
- `vite/config.shared.mjs:49-59,66`; `vite/e2eHookGuard.mjs:6`; `tests/e2e/seed.spec.ts:49-52`

## Architecture Insights

- Fits the existing split: a pure `src/core/sound.ts` (cue rules: `roundCue`, `panelCue`, `dragCue`; `shouldPlay(pref,
  locked, exists)`; pref default and validation), data in `src/data/sounds.ts` (ids, file paths, durations from the
  manifest, gains) and `balance.sound` (music gain 0.14, effect gain, pref read limit), a `src/ui/sound.ts` service over
  `game.sound` kept in the registry (like `REGISTRY_KEYS.narrator`), scenes call `sound.play('star')`.
- Copy step: `npm run art` (`scripts/make-task-art.mjs`) has no audio; a `npm run sounds` (or an `art` extension)
  copies `designs/martynka-salon-v2/audio/{ogg,m4a}` to `public/assets/sounds/` (optionally re-encoding the M4A loop).

## Historical Context (from prior changes)

- `context/archive/2026-10-13-observability-c1-c2/follow-ups/review-fixes.md:10` — "`audio.noAudio` and audio
  rejections are not covered by the boundary. Trigger: S-16 or the first sound": supported, still open; resolved by
  the quiet-list + handled decode recommendation above.
- `context/archive/2026-10-11-installable-offline-pwa/research.md:58` — overlays must not stop the first touch:
  still true (no `stopPropagation` in `src/`).
- `context/archive/2026-10-15-load-and-tab-guard/research.md` — `cutLoad` design; its sound estimate (~55 s with M4A
  at 50 KB/s) assumed music in the boot queue — partially superseded by the lazy-music recommendation.
- `docs/design-gaps.md:42` gap 35 (purchase sound) closes with `purchase`.

## Related Research

- `context/archive/2026-10-15-load-and-tab-guard/research.md`

## Open Questions (for `/10x-plan`)

1. Format order `[m4a, ogg]` vs `[ogg, m4a]` + own decode fallback (iPadOS 17.4–18.3 "partial" Vorbis).
2. Re-encode the M4A loop smaller or ship the pack's bytes.
3. Pref storage: IndexedDB key via `src/storage/idb.ts` vs `localStorage`; in-memory under e2e save seams.
4. Tap precedence on answer tiles/keys; `second → solution` cue.
5. Music scope: room only or everywhere; loop by marker vs trimmed buffer (click check on device).
6. Human checklist: iPad first-touch unlock, loudness, speech + effects mixing on iOS, loop clicks.
