# Handoff — `final-sound` (slice S-16b)

Written by `/10x-tdd final-sound phase 1` of run 2026-10-15-fix-s16bcd. Phase 1 (pure core/data, no scene wiring) is done and committed (test-first); phases 2-10 pending. Do not get wrong: e2e request counting needs `serviceWorkers: 'block'`, and decode failure never fires `loaderror` (use `cache.audio.exists`), see plan-review.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + phase 1 commit a85eb75 + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 0 (1.4 is [reviewer]) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/sound.ts` | SoundId, SoundPrefs, DEFAULT_SOUND_PREFS (effects on, music off), parseSoundPrefs, soundOutcome, trimFrameCount, cueDelayMs |
| `src/data/sounds.ts` | SOUNDS table (13, keys `sounds/<id>`, urls [m4a, ogg], manifest durations, boot flag) |
| `src/data/balance.ts` | `sound` block |
| `tests/sound.test.ts` | 17 tests |
| `context/changes/final-sound/{plan,change,handoff}.md` | progress rows 1.1-1.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED | stubs returned wrong values; first assertion: `expected { effects: false, music: true } to deeply equal { effects: true, music: false }` (16 failed) |
| lint / typecheck | OK |
| npm test | 2987 passed (baseline 2970, +17) |
| deploy tests, sample E1-E6 | OK (sample unaffected: no generators changed; data is sound only) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not run: phase 1 adds pure core/data only, no scene wiring; orchestrator runs it after the first wiring phase |
| Break 1 | `locked` checked before `off` in soundOutcome: 2 tests red (off wins over missing and locked; missing wins over locked), restored. Meta: proves the rule order only, not Phaser playback |
| Break 2 | `boot: true` for music-loop: "loads 12 sounds at boot" red, restored |

## 4. Next command

`/10x-tdd final-sound phase 2`

## 5. Open

- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4 [reviewer], 9.7 and 10.6 [human].
- Follow-ups to write in phase 8; DESIGN-GAP 114 in phase 7, gap 35 closes in phase 6.

## 6. Autonomous decisions

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
