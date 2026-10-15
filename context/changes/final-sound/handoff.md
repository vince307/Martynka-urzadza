# Handoff — `final-sound` (slice S-16b)

Written by `/10x-tdd final-sound phase 2` of run 2026-10-15-fix-s16bcd. Phases 1-2 (pure core/data, no scene wiring) are done and committed (test-first); phases 3-10 pending. Do not get wrong: e2e request counting needs `serviceWorkers: 'block'`, and decode failure never fires `loaderror` (use `cache.audio.exists`), see plan-review.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + handoffs |
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
| `tests/soundCues.test.ts` | 21 tests, states built by public reducers (`startRound`/`answer`/`nextSolutionStep`/`next`, `stepPanel`) |
| `context/changes/final-sound/{plan,change,handoff}.md` | progress rows 1.1-1.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED | stubs returned []/null; first assertion: `expected [] to deeply equal [ { id: 'answer-right', …(1) }, …(1) ]` (11 failed) |
| lint / typecheck | OK |
| npm test | 3008 passed (branch baseline 2987, +21) |
| deploy tests, sample E1-E6 | OK (no generators/content changed) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not run: pure core only, no scene wiring; orchestrator runs it after the first wiring phase (p5/p6) |
| Break 1 | `answer-retry` also on `second`→`solution`: "no cue for the solution…" red, restored |
| Break 2 | `panelCue` without `changed`: "a free change plays purchase" red, restored. Meta: states come from real reducers, so it guards the reducer shapes, not playback |

## 4. Next command

`/10x-tdd final-sound phase 3`

## 5. Open

- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4 [reviewer], 9.7 and 10.6 [human].
- Follow-ups to write in phase 8; DESIGN-GAP 114 in phase 7, gap 35 closes in phase 6.

## 6. Autonomous decisions

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
- Phase 2: `panelCue` returns `purchase` for a one-tap stage purchase (`bought` while the panel stays closed). `roundCues` yields `answer-right` only when entering `done` before `finished`; `star` only when that transition raised `starsEarned`. `dragCue` takes the `{carrying, mat}` shape (`DragShape`). Would change: author wanting a distinct stage sound.
