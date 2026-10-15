---
change_id: final-sound
title: Game sounds from the salon-v2 pack, effects on and music off by default
status: implementing
created: 2026-10-16
updated: 2026-10-16
archived_at: null
---

## Notes

Roadmap slice **S-16b** (`### S-16b: Dźwięki`, author decisions 2026-10-15), second slice of autonomous run `2026-10-15-fix-s16bcd`. PRD refs: FR-017 (the "Wybieram" confirmation has a short animation and a sound), FR-026 (sounds after the first touch), NFR accessibility (fully playable without sound; no information carried by sound alone).

**Outcome:** the child hears the P1 sounds of `docs/designer-brief-s16.md` (answer right, gentle retry "hmm", star, no-mistake bonus, tap, variant panel open, variant preview, purchase, "Pokój gotowy!", "Nowa umiejętność!", coin/block put down, minigame done) after the first touch; the optional `music-loop` plays only when a parent switches music on. Effects are **on** by default, music **off** by default; the parent toggles both in the settings panel. The game stays fully playable without sound, and effects never cut the narrator (speech synthesis).

**Source:** the gitignored pack `designs/martynka-salon-v2` (`audio/ogg`, `audio/m4a`, `audio-manifest.json`; `audio-player.js` is a reference for the unlock, the format choice, trimming a decoded buffer to the manifest `duration` and the 40 ms crossfaded music loop — read and adapt, never copy). The copied files are committed under `public/assets/` (author consent 2026-10-13). The pack itself, `.gitignore` and `.claude/` are never staged.

**Save format:** stays **v3** (`SAVE_VERSION` 3 in `src/core/save.ts`). The sound setting lives **outside** the save under its own key, so it never enters `SaveState`, `validateSave`, the `MIGRATIONS` chain, export/import files or the frozen fixtures in `tests/fixtures/` (byte-identical). Nothing found on disk forces it into the save: `Settings` (`autoRead`) is the only saved setting and the sound choice is a per-device preference like the audio output itself. If the plan proved that the setting cannot live outside the save, the slice stops at an open PR (contract § "SAVE FORMAT STAYS v3").

**Design source (profile § 6):** the kit (`Martynka-urzadza.md`, `designs/martynka-maths-A-v1`) has no sound settings UI: the plan says only "sound starts after the first touch, fully playable without sound" (`Martynka-urzadza.md` section on accessibility) and lists the sound kinds (OGG + M4A). `designs/martynka-salon-v2/audio.html` is a listening page for the pack ("Muzyka" / "Zatrzymaj muzykę"), not a game screen, and the pack README says "the mute button and saving the preference must be wired in the game". → **DESIGN-GAP**: the "Dźwięki"/"Muzyka" section of the settings panel (heading, on/off buttons, copy) gets a gap row in `docs/design-gaps.md` and reuses the existing autoRead On/Off pattern of `src/ui/dom/settingsPanel.ts`; strings in `src/data/pl.ts`.

## Roadmap claims checked against the repo (main a1625be, branch feat/final-sound)

| Roadmap claim (plan time) | Repo now | Correction |
|---|---|---|
| Sounds from `designs/martynka-salon-v2`: 12 effects + `music-loop`, OGG and M4A | `audio-manifest.json` lists 13 tracks (12 effects + `music-loop`, `loop: true`, `recommendedMixGain` 0.14, `crossfadeMs` 40); `audio/ogg/` and `audio/m4a/` hold 13 files each; `audio/wav/` (~5 MB) is the lossless source | none; WAV is never shipped |
| P1 list = `docs/designer-brief-s16.md` (answer right, star, purchase, "Pokój gotowy!" …) | the brief's P1 table names the same 13 ids with timing ranges; the pack measures each one (`audio/qa/report.json`) | none |
| Risk: precache weight ~1.1 MB for both formats | OGG 188 851 B + M4A 878 257 B = 1 067 108 B; `music-loop.m4a` alone is 746 014 B, `music-loop.ogg` 107 707 B | none on the total; new finding: `music-loop.m4a` (746 KB) is far above the "largest file 289 KB" the `balance.loader` comment assumes, about 15 s at 50 KB/s against the 12 s per-file limit (`balance.loader.timeoutMs`) — a cold first start on iPad on a slow link would fail the music file. Research must decide (one format per platform, music outside the boot queue, or a larger limit for it) |
| Risk: Web Audio unlock on iPad after the first touch | `createGame` in `src/main.ts` sets no `audio` key, so Phaser uses its Web Audio sound manager and unlocks on the first touch; `src/ui/dom/overlay.ts` already keeps DOM overlays from stopping the event that unlocks it; no sound is loaded or played anywhere | none; the unlock path is untested on iPad (human checklist row for the tablet) |
| Precache: the globs already include `ogg` and `m4a` | `vite/config.shared.mjs` `workbox.globPatterns` = `**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}`, `maximumFileSizeToCacheInBytes` 10 MiB | none; precaching both formats is the default unless the plan narrows it ("precache only what the game uses") |
| Effects on, music off by default; parent toggles in the settings panel | `Settings` in `src/core/types.ts` has only `autoRead`; `src/ui/dom/settingsPanel.ts` has the autoRead On/Off group and the stage, progress, save and art sections; no sound section | none; new section, DESIGN-GAP above |
| Sound setting outside the save (own key), save format stays v3 | `SAVE_VERSION` = 3; `src/storage/idb.ts` is the only `idb-keyval` importer, key `profile:<id>` (`SAVE_KEY_PREFIX`) plus `:backup-v<n>`; no other preference key exists; no `localStorage` use in `src/` | none; the key name and the store (a second IndexedDB key through `src/storage/idb.ts` vs `localStorage`) are a research/plan decision. Note: `CLAUDE.md` still says "v2 since S-15" — stale (v3 since the `salon-load-health` change, commit 826150c); not edited by this step |
| Prerequisite S-16a | S-16a `final-art-salon` archived 2026-10-15 (`context/archive/2026-10-15-final-art-salon/`), and `load-and-tab-guard` merged (#69, a1625be) | none |
| Total boot limit covers the ~13 sound files (load-and-tab-guard A-1) | `balance.loader.totalMs` 45 000 with a comment that S-16b adds ~13 sounds; `src/scenes/loaderCut.ts` `cutLoad` neutralises a decoding image (`HTMLImageElement`) or a pending font, not an audio file in `decodeAudioData` | partial: a cut while an audio file is decoding is not handled yet; research must check `AudioFile.onProcess` (Phaser 4.2.1) and the cut, and `tests/phaserLoaderPin.test.ts` |
| Purchase sound hook | `RoomScene.playPurchaseSound` is empty and called on a purchase and on a variant change (DESIGN-GAP 35) | none; becomes `purchase` (and research decides `variant-pick` vs nothing for a free change) |

## Open follow-ups whose trigger names S-16b

| Follow-up (source) | Trigger | Take on scope |
|---|---|---|
| `audio.noAudio` and audio rejections are outside the error boundary (`2026-10-15-final-art-salon`) | S-16b (the first sound) | **in scope**: `isFatalSignal` (`src/core/errorSignal.ts`) treats every rejection except `AbortError`/`NotAllowedError` as fatal; Phaser's `AudioFile.onProcess` calls `decodeAudioData` with callbacks, whose returned promise can still reject (`EncodingError`) unhandled → the restart card for a broken sound file. A sound must never stop the game: research proves the path and the fix (quiet audio rejections or a handled decode), with a test |
| Purchase sound and variant-change sound: `RoomScene.playPurchaseSound` is an empty hook (design-gaps 35) (`2026-10-15-final-art-salon`) | S-16b | **in scope**: wire `purchase`; close design-gap 35 |
| VO3: the hold outline is the slot's `visibleRect` (design-gaps 37) (`2026-10-15-final-art-salon`) | designer brief delivers a hold view, or S-16b | **out of scope**: an art/outline problem, sound brings nothing to it; carried forward to this change's follow-ups with `Trigger: designer brief delivers a hold view, or S-17 polish` |

No follow-up in `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md` names S-16b; its A-1 total limit already budgets for the sounds (row above).

## Autonomous decisions

- **Next step `/10x-research`, not `/10x-plan`**: the step prompt fixes it, and the change crosses Phaser's sound manager and loader (format choice, decode, the loader cut), the error boundary, the narrator and the settings panel; that needs code reading before a plan. Would change: nothing, the run fixes the order.
- **Sound setting outside the save, own key**: the author decision and the contract; nothing on disk requires the save. Would change: research proving that a per-device key cannot be read before the game starts or would be lost in a way the save is not (then the slice stops at an open PR with v4 — not expected).
- **"Respects muting" read as**: the parent's in-game toggles (effects, music) plus whatever the device mute does to Web Audio; the game does not try to detect the iPad ring/silent switch. Would change: the maintainer asking for sound that plays despite the silent switch, or for it to obey it explicitly (`navigator.audioSession`).
- **Reset and import do not touch the sound setting** (a per-device preference, like the installed app): "Zacznij od nowa" resets the child's progress, not the parent's device choice. Would change: research or the maintainer showing that a reset is expected to restore all defaults.
- **`audio.noAudio`/rejection follow-up taken into scope**, VO3 left out: the first is exactly the risk the first sound creates, the second is unrelated to sound. Would change: research showing no rejection reaches the window (then the follow-up closes with the evidence).
- **DESIGN-GAP for the sound section** rather than inventing a design: profile § 6. Would change: the author delivering a settings design.
- **Title in English**: context artifacts in this repo are English (archived changes); commit messages in Polish per the profile. Would change: a maintainer rule for Polish change titles.
