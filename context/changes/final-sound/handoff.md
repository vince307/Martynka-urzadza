# Handoff — `final-sound` (slice S-16b)

Written by `/10x-implement final-sound phase 7` of run 2026-10-15-fix-s16bcd. Phases 1-7 are done and committed (the parent's "Dźwięki" section and the lazy music are in); phases 8-10 pending. Do not get wrong: the settings panel now has three On/Off groups with the same button labels, so an e2e spec must scope "Włączone" to a group by its name; decode failure never fires `loaderror` (use `cache.audio.exists`).

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + p4 723fef8 + p5 ee4336b + p6 d073e7c + p7 dc3e930 + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 7.1 (e2e part, orchestrator), 7.4 [visual], 7.5 [reviewer], 6.3 [reviewer]; 6.1 ticked from the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/sound.ts` (p7) | `SoundService.attachLoader(load)`, music in `setPrefs`/`attachLoader` (`startMusic`, `playMusic`, `stopMusic`), `status().music` from the cache; `trimOne` shared by `trimEffects` and the music |
| `src/ui/dom/settingsPanel.ts` | `sound?: { prefs; missing }` option, "Dźwięki" section (two groups + muted missing line), `onConfirm` result has `sound: SoundPrefs | null` |
| `src/scenes/UIScene.ts` | `create` calls `attachLoader(this.load)`; `applySettings(stage, autoRead, sound)` stores `REGISTRY_KEYS.soundPrefs`, `setPrefs`, `createSoundPrefStore(deviceStorage()).write` |
| `src/data/pl.ts` | `settings.soundHeading`, `effectsHeading`, `musicHeading`, `soundMissing(n)` |
| `docs/design-gaps.md` | row 114 |
| `tests/soundMusic.test.ts` | 6 tests of the music through the service with a fake game and loader |
| `tests/e2e/parent-settings.spec.ts` | "Włączone" scoped to the reading group (it would be ambiguous now) |
| `context/changes/final-sound/e2e-break-p9b.patch`, `e2e-break-p9c.patch` | `git apply` breaks (checked with `git apply --check`): `applySettings` without `setPrefs`; music in the `BootScene` queue |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| npm test | 3029 passed (baseline 3023, +6: `tests/soundMusic.test.ts`) |
| deploy tests, sample E1-E6 | OK (no content changed) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session (Chromium dies, `parent-settings.spec.ts` 1 plain try: kill EPERM / SIGTRAP) - orchestrator gate; row 7.1 e2e part unticked. Expected 104 passed (--workers=4), +0 (the edited line in `parent-settings.spec.ts` must still pass) |
| Break (unit) | removed `startMusic()` from the off-to-on branch of `setPrefs`: 2 of 6 red (`expected [] to deeply equal [ 'sounds/music-loop' ]`, `expected 'off' to be 'playing'`), restored, green. Meta-check: proves the service rule on a fake; that Phaser really decodes and plays is phase 9 |
| Break (e2e patches) | p9b and p9c prepared for phase 9; they have no red test of their own here |

## 4. Next command

`/10x-implement final-sound phase 8`

## 5. Open

- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4, 2.4, 3.4, 5.5, 6.3, 7.5 [reviewer]; 7.4 [visual]; 9.7 and 10.6 [human].
- Follow-ups to write in phase 8. Music status while the audio context is locked is reported as `loading` until the first gesture.
- Settings panel: the "Dźwięki" section sits after the reading line and the no-voice line, before "Zapis gry".

## 6. Autonomous decisions

- Phase 7: music is loaded by the service through the `UIScene` loader (`addfile` sets the 30 s file limit, `complete` + `cache.audio.exists` decide), trimmed with the same `trimOne`; a failed load or decode gives `missing` and a warning, the game goes on. `onConfirm` hands `sound: null` when the panel has no section. Existing e2e line scoped to a group rather than renaming the sound labels (plan says reuse the reading labels). Would change: author wanting distinct labels such as "Gra"/"Cisza".


- Phase 6: helpers `playCues`/`playBeforeSpeech`/`soundOf` live in `src/ui/sound.ts` so scenes hold no ids except `tap`/`skill-unlock`/`room-done`. "Zamknij" in the variant panel plays `tap` from `dispatch` (panelCue gives null for close). Unaffordable room task button plays `tap` (it navigates). Card speech is a scene-clock timer that checks the card is still shown. Would change: author wanting tap on the hint buttons.

- Phase 5: `loaderCut` needed no change (p3 already cuts audio files in `queue`/`inflight`; sounds share the one queue and the 45 s total, balance.loader comment already counts them). Service created in `preBoot`; `setMissing` lets BootScene hand the missing list over. Trim failure removes the key from the cache. Would change: none.

- Phase 3: no stubs needed (module exists), RED by assertion on the unchanged code. `signalOfRejection` reads `name` for a `DOMException` (guarded by `typeof DOMException`), `hasError` unchanged. Would change: none.

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
- Phase 2: `panelCue` returns `purchase` for a one-tap stage purchase (`bought` while the panel stays closed). `roundCues` yields `answer-right` only when entering `done` before `finished`; `star` only when that transition raised `starsEarned`. `dragCue` takes the `{carrying, mat}` shape (`DragShape`). Would change: author wanting a distinct stage sound.
