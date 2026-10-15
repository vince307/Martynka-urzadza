# Handoff — `final-sound` (slice S-16b)

Written by `/10x-tdd final-sound phase 3` of run 2026-10-15-fix-s16bcd. Phases 1-3 (pure core/data, quiet rejections, `cutLoad` onProcessError) are done and committed (test-first); phases 4-10 pending. Do not get wrong: e2e request counting needs `serviceWorkers: 'block'`, and decode failure never fires `loaderror` (use `cache.audio.exists`), see plan-review.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + handoffs |
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
| `tests/soundCues.test.ts` | 21 tests, states built by public reducers (`startRound`/`answer`/`nextSolutionStep`/`next`, `stepPanel`) |
| `context/changes/final-sound/{plan,change,handoff}.md` | progress rows 1.1-1.3, 3.1-3.2 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED | `expected true to be false` (EncodingError rejection fatal) and `expected "vi.fn()" to be called 1 times, but got 2 times` (late decode error) |
| lint / typecheck | OK |
| npm test | 3014 passed (branch baseline 3008, +6) |
| deploy tests, sample E1-E6 | OK (no generators/content changed) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (MachPortRendezvous Permission denied); row 3.3 left unticked. Run the full suite: this phase touches `loaderCut.ts` and the boundary |
| Break | `EncodingError` removed from `QUIET_REJECTIONS` and `cutLoad` without `onProcessError` no-op: both new tests red, restored. Meta: the fake file's callbacks call `loader.fileProcessComplete` like Phaser's, so it proves `cutLoad` cuts both callbacks; that Phaser really calls them is pinned by the source-text test; the real browser proof is phase 10 |

## 4. Next command

`/10x-implement final-sound phase 4`

## 5. Open


- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4 [reviewer], 9.7 and 10.6 [human].
- Follow-ups to write in phase 8; DESIGN-GAP 114 in phase 7, gap 35 closes in phase 6.

## 6. Autonomous decisions

- Phase 3: no stubs needed (module exists), RED by assertion on the unchanged code. `signalOfRejection` reads `name` for a `DOMException` (guarded by `typeof DOMException`), `hasError` unchanged. Would change: none.

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
- Phase 2: `panelCue` returns `purchase` for a one-tap stage purchase (`bought` while the panel stays closed). `roundCues` yields `answer-right` only when entering `done` before `finished`; `star` only when that transition raised `starsEarned`. `dragCue` takes the `{carrying, mat}` shape (`DragShape`). Would change: author wanting a distinct stage sound.
