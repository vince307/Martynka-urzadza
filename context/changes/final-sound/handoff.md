# Handoff — `final-sound` (slice S-16b)

Written by `/10x-implement final-sound phase 6` of run 2026-10-15-fix-s16bcd. Phases 1-6 (… plus cues wired into the scenes) are done and committed; phases 7-10 pending. Do not get wrong: e2e request counting needs `serviceWorkers: 'block'`, and decode failure never fires `loaderror` (use `cache.audio.exists`), see plan-review.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + p4 723fef8 + p5 ee4336b + p6 (see git log) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 6.1 (e2e part, orchestrator), 6.3 [reviewer]; 5.3 ticked from the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/sound.ts` (p6) | + `soundOf(registry)`, `playCues(scene, service, cues)` (delay on the scene clock), `playBeforeSpeech(service, id)` (plays, returns wait ms via `cueDelayMs`) |
| `src/scenes/TaskScene.ts` | `playRoundCues` after `answer` and `next`; `playDragCue` in `feedDrag` (blocks, coins); `tap()` on "Dalej", "Kolejna runda", "Do pokoju" (summary + minigame card), unlock "Dalej"; `skill-unlock` in `startNextRound`, `autoReadUnlock(waitMs)` speaks after it |
| `src/scenes/RoomScene.ts` | `dispatch` plays `panelCue` (purchase/free change/panel-open/variant-pick) and `tap` on "Zamknij"; `tap` on mode button, done-card "Dalej", "Wróć do notesu", unaffordable task button; `showCard` plays `room-done`, mowa after it; `playPurchaseSound` removed |
| `src/scenes/UIScene.ts` | `tap` on the HUD "Do pokoju" |
| `docs/design-gaps.md` | row 35 closed |
| `context/changes/final-sound/e2e-break-p9a.patch` | `git apply` break: no round cues in `TaskScene.submit` (applies cleanly) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| npm test | 3023 passed (baseline 3023, +0: no new unit tests, scenes only) |
| deploy tests, sample E1-E6 | OK (no content changed) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session (Chromium MachPortRendezvous Permission denied, 2 plain tries) - orchestrator gate; row 6.1 e2e part unticked. Expected 104 passed (--workers=4), +0 |
| Break | patch `e2e-break-p9a.patch` prepared (checked with `git apply --check`). Meta-check: this phase has no red test of its own; the proof that the cue is requested at the right event is the phase 9 e2e reading `snapshot.sound.log` |

## 4. Next command

`/10x-implement final-sound phase 7`

## 5. Open

- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4, 2.4, 3.4, 5.5, 6.3 [reviewer]; 9.7 and 10.6 [human].
- Follow-ups to write in phase 8; DESIGN-GAP 114 in phase 7.
- `step()` ("Następny krok"/"Już wiem") and the speaker have no tap by design; `Do pokoju` emits `toRoom` from two places (summary and HUD), each with its own single tap.

## 6. Autonomous decisions

- Phase 6: helpers `playCues`/`playBeforeSpeech`/`soundOf` live in `src/ui/sound.ts` so scenes hold no ids except `tap`/`skill-unlock`/`room-done`. "Zamknij" in the variant panel plays `tap` from `dispatch` (panelCue gives null for close). Unaffordable room task button plays `tap` (it navigates). Card speech is a scene-clock timer that checks the card is still shown. Would change: author wanting tap on the hint buttons.

- Phase 5: `loaderCut` needed no change (p3 already cuts audio files in `queue`/`inflight`; sounds share the one queue and the 45 s total, balance.loader comment already counts them). Service created in `preBoot`; `setMissing` lets BootScene hand the missing list over. Trim failure removes the key from the cache. Would change: none.

- Phase 3: no stubs needed (module exists), RED by assertion on the unchanged code. `signalOfRejection` reads `name` for a `DOMException` (guarded by `typeof DOMException`), `hasError` unchanged. Would change: none.

- Stubs written first so RED is an assertion failure; stub defaults deliberately wrong. Would change: none.
- `balance.sound` added in this phase with the plan's numbers; comment explains each. Would change: author tuning after listening.
- Phase 2: `panelCue` returns `purchase` for a one-tap stage purchase (`bought` while the panel stays closed). `roundCues` yields `answer-right` only when entering `done` before `finished`; `star` only when that transition raised `starsEarned`. `dragCue` takes the `{carrying, mat}` shape (`DragShape`). Would change: author wanting a distinct stage sound.
