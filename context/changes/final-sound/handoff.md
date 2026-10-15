# Handoff — `final-sound` (slice S-16b)

Written by `/10x-implement final-sound phase 5` of run 2026-10-15-fix-s16bcd. Phases 1-5 (pure core/data, quiet rejections, `cutLoad` onProcessError, sound files + table test, boot loading + SoundService + pref store + hook field) are done and committed; phases 6-10 pending. Do not get wrong: e2e request counting needs `serviceWorkers: 'block'`, and decode failure never fires `loaderror` (use `cache.audio.exists`), see plan-review.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + p4 723fef8 + p5 ee4336b + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 0 (1.4, 2.4 are [reviewer]) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/sound.ts` | SoundId, SoundPrefs, DEFAULT_SOUND_PREFS (effects on, music off), parseSoundPrefs, soundOutcome, trimFrameCount, cueDelayMs |
| `src/data/sounds.ts` | SOUNDS table (13, keys `sounds/<id>`, urls [m4a, ogg], manifest durations, boot flag) |
| `src/data/balance.ts` | `sound` block |
| `src/core/sound.ts` (p2) | + `Cue`, `DragShape`, `roundCues`, `panelCue`, `dragCue` |
| `tests/sound.test.ts` | 17 tests |
| `src/core/errorSignal.ts`, `src/ui/dom/errorBoundary.ts`, `src/scenes/loaderCut.ts` (p3) | EncodingError/NotSupportedError quiet rejections; DOMException name read; `cutLoad` no-ops `onProcessError` |
| `tests/loaderCut.test.ts`, `tests/errorSignal.test.ts`, `tests/phaserLoaderPin.test.ts` (p3) | +3 +2 +1 tests |
| `scripts/copy-sounds.mjs`, `npm run sounds`, `public/assets/sounds/{m4a,ogg}/*` (26 files, byte-identical to the pack), `tests/soundFiles.test.ts` (p4) | copy script (exit 1 when pack or file missing), 3 tests table <-> disk |
| `src/ui/sound.ts` (p5) | `createSoundService` (play/setPrefs/prefs/status/setMissing, log of 50), `trimEffects` (copies each AudioBuffer to trimmed length; failure removes it from cache, counted missing) |
| `src/storage/soundPrefs.ts` (p5) | `SOUND_PREFS_KEY='martynka:sound'`, `createSoundPrefStore`, `deviceStorage`; `tests/soundPrefsStore.test.ts` 6 tests |
| `src/scenes/BootScene.ts` (p5) | `queueSounds` (12 boot effects, [m4a, ogg], same queue and total 45 s cut), trim + `soundHealth` in `create` before `delayedCall(0)` |
| `REGISTRY_KEYS.sound/soundPrefs/soundHealth`, e2e hook `snapshot.sound` (all three snapshots) | set in `main.ts` `preBoot` (game.sound exists only after preBoot, service reads it lazily) |
| `tests/soundCues.test.ts` | 21 tests, states built by public reducers (`startRound`/`answer`/`nextSolutionStep`/`next`, `stepPanel`) |
| `context/changes/final-sound/{plan,change,handoff}.md` | progress rows 1.1-1.3, 3.1-3.2 ticked |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| npm test | 3023 passed (branch baseline 3017, +6 in `tests/soundPrefsStore.test.ts`) |
| deploy tests, sample E1-E6 | OK (no generators/content changed) |
| build | OK, `e2e hook: absent (2 chunks checked)`; sw.js lists `star.ogg` |
| e2e | not runnable in this session (Chromium MachPortRendezvous Permission denied, 2 plain tries) - orchestrator gate; row 5.3 left unticked. Expected 104 passed (--workers=4), +0 |
| Break | `read` without try/catch: "getItem throws gives the defaults" red, restored (6 green). Meta: proves only the store, not decoding (phase 9 `missing` empty) |

## 4. Next command

`/10x-implement final-sound phase 6`

## 5. Open


- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4 [reviewer], 9.7 and 10.6 [human].
- Follow-ups to write in phase 8; DESIGN-GAP 114 in phase 7, gap 35 closes in phase 6.

## 6. Autonomous decisions

- Phase 5: `loaderCut` needed no change (p3 already cuts audio files in `queue`/`inflight`; sounds share the one queue and the 45 s total, balance.loader comment already counts them). Service created in `preBoot`; `setMissing` lets BootScene hand the missing list over. Trim failure removes the key from the cache. Would change: none.

- Phase 3: no stubs needed (module exists), RED by assertion on the unchanged code. `signalOfRejection` reads `name` for a `DOMException` (guarded by `typeof DOMException`), `hasError` unchanged. Would change: none.

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
- Phase 2: `panelCue` returns `purchase` for a one-tap stage purchase (`bought` while the panel stays closed). `roundCues` yields `answer-right` only when entering `done` before `finished`; `star` only when that transition raised `starsEarned`. `dragCue` takes the `{carrying, mat}` shape (`DragShape`). Would change: author wanting a distinct stage sound.
