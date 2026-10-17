# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 9 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-9 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, the real `AudioContext` is never mutated (the seam gives each file its own context object), sound prefs stay in `localStorage` `martynka:sound` outside the save (v4), `QUIET_REJECTIONS` is unchanged, phase 10 is `Driver: tdd`.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-8 with handoffs, phase 9 (`test(health-lines-and-smoke): Decode rejections named at source, prefs warn and probe (p9)`, sha in `git log`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (rows 9.1-9.3 ticked; 9.4 [reviewer] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/decodeSeam.ts` | `guardDecode(file, warn)`: gives an audio file its own `config.context` (new config object, marker against double wrap) only when `decodeAudioData` is a function; `.then(undefined, …)` only on a thenable; warns `Sound decode failed: <key> (<name>)` |
| `src/scenes/BootScene.ts`, `src/ui/sound.ts` | the ADD listener (type `audio`) and `startMusic`'s `addfile` call `guardDecode`, in try/catch |
| `src/core/errorSignal.ts`, `src/ui/dom/errorBoundary.ts` | `noiseLine(signal)` = `Quiet rejection: <name> — <message>`, used for quiet rejections only |
| `src/core/sound.ts` | `parseSoundPrefsWithProblem`; `parseSoundPrefs` is a wrapper |
| `src/core/soundPrefsApply.ts` | `applySoundPrefs(prefs, { service, store, setPrefs, setKept })` returns `kept` (the plan's single `set` became two callbacks); used by `UIScene.applySettings` |
| `src/storage/soundPrefs.ts`, `src/main.ts` | `read` warns on a stored but unusable value; `probe()` writes and removes `martynka:sound:probe`; `main.ts` sets `REGISTRY_KEYS.soundPrefsKept` from it at start |
| `tests/decodeSeam.test.ts`, `tests/soundPrefsApply.test.ts`, widened `errorSignal`, `sound`, `soundPrefsStore`, `phaserLoaderPin` | new cases (pin: `AudioFile.onProcess` three-argument call and `context = null`, `addFile` emits ADD, `AudioFile.create` passes `game.sound.context`) |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3628 passed = 3608 + 20; deploy scripts OK; samples exit 0 |
| first RED (stubs for the new functions, so assertions, not imports) | `AssertionError: expected 'Unable to decode audio data' to be 'Quiet rejection: EncodingError — Unab…'` (`tests/errorSignal.test.ts`); 14 new cases red |
| break 1 | the `.catch` removed from the wrapper: `expected "vi.fn()" to be called 1 times, but got 0 times` (2 cases); restored |
| break 2 | `applySoundPrefs` ignoring the refused write: `expected true to be false`; restored |
| meta-check | proves the seam over a fake context (the real browser rejection is spec behaviour; `final-sound-failure.spec.ts` stays green and the reviewer 9.4 checks it) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.3m), 0 failed; `playwright --list` 132; baseline 132 + 0; `final-sound-failure`, `error-boundary` green; no e2e text edited |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), after the run: empty |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 10`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4; [visual] 2.5, 5.5, 6.5, 7.5, 8.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- No new `pl.ts` strings in this phase (log lines only).
- `startMusic` guards the music file too; the music decode failure still also reaches `musicError = 'decode'` through the cache check.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 9. Would change: nothing.
2. **`applySoundPrefs` takes `setPrefs`/`setKept` callbacks** instead of one `set`. Would change: reviewer wants the plan's literal shape.
3. **The seam replaces `file.config` with a copy** (`{...config, context}`) rather than assigning into the possibly shared config object. Would change: Phaser sharing needs the same object.
4. **`noiseLine` is used for rejections only**; quiet `error` events keep `Ignored browser noise: <message>`. Would change: reviewer wants one format.
5. **`probe()` returns false when the storage has no `removeItem`** (a leftover probe key would not be cleaned). Would change: a device with write but no remove.
6. **No `errorBoundary` DOM test added** (the line is covered by `noiseLine` and the e2e `error-boundary` spec). Would change: reviewer asks.
