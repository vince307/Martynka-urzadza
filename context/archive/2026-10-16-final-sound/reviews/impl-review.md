<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Dźwięki gry z paczki salon-v2 (S-16b `final-sound`)

- **Plan**: context/changes/final-sound/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Date**: 2026-10-16
- **Verdict**: APPROVED (after the review fixes below)
- **Findings**: 0 critical, 4 warnings (all fixed), 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F2 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS (F1 fixed) |
| Success Criteria | PASS (full e2e on the last sha pending the orchestrator) |

## Suites observed by the reviewer (not inherited)

| Gate | Result |
|---|---|
| lint, typecheck | OK |
| unit (`npm test`) on 5360ec1 | 3029 passed = main baseline 2970 + 59 (phases 1-5, 7) |
| unit after the review fixes | 3034 = 3029 + 5 (4 `soundMissing` cases, 1 music case) = main 2970 + 64 |
| deploy tests, ops tests, `sample` E1-E6 | OK (exit 0) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e full `--workers=4` on 5360ec1 (reviewer) | 108 passed, 1 failed: `save-transfer.spec.ts` "#2 reset asks first …" (`Execution context was destroyed`) |
| e2e full `--workers=4` on a15adf7 (reviewer) | 108 passed, 1 failed: the same test (F4) |
| reset test alone `--repeat-each` | branch before F4: 1 of 3 passed; main a1625be (temporary worktree): 6 of 6; branch after F4 (82860d2): 6 of 6 |
| e2e full on 82860d2 | NOT observed by the reviewer: Chromium stopped launching in this session after the F4 fix (every test 1 ms); the orchestrator re-runs it (expected 109 = 104 + 5) |

Arithmetic: e2e main a1625be 104 → p9 +3 (`final-sound.spec.ts`) = 107 → p10 +2 (`final-sound-failure.spec.ts`; the seed test gained assertions, no new test) = 109.

## Deliberate breaks re-executed by the reviewer

- Phase 3 RED re-executed: `src/core/errorSignal.ts` and `src/scenes/loaderCut.ts` restored to their `main` text with the branch tests → `tests/errorSignal.test.ts` "treats unhandled audio decode rejections as noise" red (`expected true to be false`) and `tests/loaderCut.test.ts` "late decode error does not finish the load twice" red (`expected "vi.fn()" to be called 1 times, but got 2 times`); restored, 11/11 green. Meta: the assertions fail on the old code, not on an import error, so the RED of phase 3 was real.
- F1 and F2 were driven test-first: both new tests were red on the branch code (quoted in the findings) and green after the fix.

## Phaser 4.2.1 source checks (node_modules/phaser, version 4.2.1)

- `AudioFile.getAudioURL`: returns the first URL whose extension `game.device.audio[type]` supports, never falls back after a fetch or decode error → `[m4a, ogg]` order in `src/data/sounds.ts` is what the plan decided (AAC on every iPad).
- `AudioFile.onProcess`: `decodeAudioData` with success/error callbacks, promise dropped → `EncodingError` rejection unhandled → `QUIET_REJECTIONS` covers it; the p10a browser break proves the card appears without it.
- `WebAudioSoundManager.unlock`: listeners on `document.body` (`touchstart/touchend/mousedown/mouseup/keydown`), `context.resume()` sets `unlocked`; `BaseSoundManager.update` clears `locked` and emits `'unlocked'` one step later → `soundService` waits on `once('unlocked')` for music and returns `locked` for effects (accepted in spec 9(a)).
- Trimming: `BaseCache.add` → `CacheMap.set` overwrites the entry; `trimOne` builds a shorter `AudioBuffer` via `context.createBuffer`/`copyToChannel` before `BootScene`'s `delayedCall(0)` hand-over; HTML5 fallback entries (no `getChannelData`) are left untouched.
- Lazy music: `LoaderPlugin.addFile` emits `'addfile'` synchronously, `XHRLoader` merges `file.xhrSettings` at send time, so setting `file.xhrSettings.timeout` in the `once('addfile')` listener applies the 30 s limit; an empty list (no supported URL) still emits `complete` → `music: 'missing'`.
- `cutLoad`: `File.onProcessError` calls `fileProcessComplete`; both callbacks of queued files are now no-ops before the cut (pin in `tests/phaserLoaderPin.test.ts`; p10b browser break red).

## Reviewer rows (performed)

- 1.4 PASS: `src/core/sound.ts` imports only types (`round`, `variantPanel`, `variants`), no Phaser or browser globals; `src/data/sounds.ts` imports only the `SoundId` type; volumes/delays/limits in `balance.sound` (durations are pack data in `data/sounds.ts`).
- 2.4 PASS: `answer-right`, `answer-retry`, `star`, `round-bonus`, `minigame-done` (`roundCues`); `panel-open`, `variant-pick`, `purchase` (`panelCue`); `coin` (`dragCue`); `tap`, `skill-unlock`, `room-done` named in scenes; `music-loop` in no cue rule.
- 3.4 PASS: only `EncodingError` and `NotSupportedError` added; the `error` event branch unchanged; loader internals (file callbacks, state) only in `loaderCut.ts` (`src/ui/sound.ts` uses the public `addfile` event and `xhrSettings`, as `BootScene` already does).
- 4.4 PASS: the 26 committed files are byte-identical to `designs/martynka-salon-v2/audio/{m4a,ogg}` (`cmp`), nothing under `designs/`, no `.wav`, `.gitignore` or `.claude/` in `git log main..HEAD`.
- 5.5 PASS: `soundOutcome` checks `cache.audio.exists` before any `play`; trimming in `BootScene.create` before `delayedCall(0)`; `localStorage` only in `src/storage/soundPrefs.ts` (one comment mention in `layout.ts`); `sound`, `soundPrefs`, `soundHealth` are not in `SAVE_KEYS`.
- 6.3 PASS: every scene `play` comes from `roundCues`/`panelCue`/`dragCue` or a named place (`tap`, `skill-unlock`, `room-done`); the diff adds no `narrator.cancel()` (the four existing calls are on main); gap 35 closed in `docs/design-gaps.md`.
- 7.5 PASS: panel strings from `pl.settings.*`; DESIGN-GAP 114 in `pl.ts`, `design-gaps.md` and the `settingsPanel.ts` doc comment; `localStorage` only through `soundPrefs.ts`.
- 8.3 PASS (after F3): names in `CLAUDE.md` exist (`validate-rule-files.sh` PASS, 412 paths); `git diff main -- vite deploy` empty.

## Product checks

- FR-017 purchase sound: `purchase` on every "Wybieram" (buy and free change); spec 9(b) green.
- FR-026: effects before the first touch are `locked` (not queued); music waits for `'unlocked'`.
- NFR playable without sound: no sound carries information alone; a missing/corrupt/hanging sound gives `missing`, no card (spec 10(a)/(b)); `NoAudioSoundManager` leaves every effect missing without an error.
- Effects never cut the narrator; skill-unlock and room-done speech waits `cueDelayMs`.
- Defaults effects on / music off (`DEFAULT_SOUND_PREFS`); setting in `localStorage` `martynka:sound`, outside the save; `SAVE_VERSION` 3; `git diff main -- tests/fixtures` empty; `docs/human-checklist.md` unchanged vs main.
- Precache: 26 sound entries in `dist/sw.js`, about 1.1 MB (both formats; follow-up with trigger exists). Boot queue adds 12 effects (132 KB M4A or 81 KB OGG); the 746 KB music only after the parent turns it on.
- Teacher read of new strings: "Dźwięki", "Efekty dźwiękowe", "Muzyka" fine; `soundMissing` had wrong verb agreement (F1, fixed). No hook bypass found (no `--no-verify` in the branch commits, hooks untouched).

## Findings

### F1 — `soundMissing` verb and pronoun do not agree with the count

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/pl.ts (`settings.soundMissing`)
- **Detail**: "Nie wczytało się 1 dźwięk. … bez nich." and "Nie wczytało się 2 dźwięki" are wrong Polish (1 → "wczytał się … bez niego", 2-4 → "wczytały się"); the neighbouring `artMissing`/`roomArtMissing` already inflect the verb (DESIGN-GAP 67). Test-first: the new cases in `tests/artHealthText.test.ts` were red for 1 and 2 on the branch code.
- **Fix**: inflect the verb and the pronoun with `inflect`; gap row 114 notes the agreement.
- **Decision**: FIXED (a15adf7)

### F2 — Music turned off while waiting for the unlock stays "loading" and never starts again

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/sound.ts (`stopMusic`)
- **Detail**: `playMusic` sets `music: 'loading'` while the context is locked; `stopMusic` kept `'loading'` (meant for a download in flight), so the next "on" returned early in `startMusic` and the music never played again in that session. Rare on a tablet (the parent's taps unlock the context first) but reachable when `resume()` fails. Test-first: the new case in `tests/soundMusic.test.ts` was red (`expected 'loading' to be 'off'`).
- **Fix**: a sound that already exists (waiting for the unlock) ends as `off`; a download in flight still stays `loading`.
- **Decision**: FIXED (a15adf7)

### F3 — Stale `CLAUDE.md` note "`playPurchaseSound` is still empty"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: CLAUDE.md (S-16a sentence)
- **Detail**: Phase 6 removed `playPurchaseSound`, but the S-16a sentence still described it as an empty hook.
- **Fix**: point it at `panelCue` and the Final sound sentence. The leftover `e2e-request-p10.md` (its own text said to drop it; it still claimed p10b/p10c "NOT RUN") is removed too.
- **Decision**: FIXED (a15adf7)

### F4 — `save-transfer` reset test races the reload on this branch

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/save-transfer.spec.ts ("#2 reset asks first and ends on the welcome screen")
- **Detail**: Red in both reviewer full runs and 2 of 3 alone on the branch, 6 of 6 on main: `screenIs` polls the hook while "Zacznij od nowa" reloads the page, and a read in flight during the navigation throws `Execution context was destroyed`. The product path works (the page reloads onto the welcome screen); the latent race in the spec is exposed by the branch timing (the likely cause is the larger service-worker install with the 26 sound files competing with the reload; not proven). The import tests already wait with `reloadedBy`.
- **Fix**: wrap the confirm tap in `reloadedBy` (waits for `load` and the hook) like the import tests; 6 of 6 green after it. Meta: the test is stronger, a reset that no longer reloads now fails at `reloadedBy`.
- **Decision**: FIXED (82860d2)

### F5 — `NotSupportedError` is quiet for every rejection, not only audio

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/errorSignal.ts (`QUIET_REJECTIONS`)
- **Detail**: No other game code rejects with this name today (plan decision 13 records the trigger). Recorded.
- **Decision**: RECORDED

### F6 — Chromium's codec may differ from the iPad's

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/final-sound*.spec.ts
- **Detail**: Playwright's Chromium may decode OGG instead of M4A; the M4A path and audibility rest on the [human] rows 9.7 and 10.6 (Known risks). Recorded.
- **Decision**: RECORDED

### F7 — `purchase` and `room-done` both play at the last purchase

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/RoomScene.ts (`dispatch`, `showCard`)
- **Detail**: As planned; part of the author's listening list (row 9.7). Recorded.
- **Decision**: RECORDED

### F8 — Precache grows by about 1.1 MB (both formats)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: vite/config.shared.mjs (unchanged globs)
- **Detail**: Sane for the target; the follow-up "Both formats … precached" has a trigger. Recorded.
- **Decision**: RECORDED

MERGE: CLEAR — no critical findings; four warnings fixed (a15adf7, 82860d2), all reviewer rows pass, save stays v3 with fixtures and the human checklist unchanged; condition: the orchestrator's full e2e on 82860d2 must show 109 passed (Chromium stopped launching in the reviewer session after the last fix).
