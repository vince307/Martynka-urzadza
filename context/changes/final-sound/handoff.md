# Handoff — `final-sound` (slice S-16b)

Written by the `/10x-new` step of autonomous run `2026-10-15-fix-s16bcd`. The change folder exists with `change.md` (identity, roadmap claims checked against the repo, follow-ups with `Trigger: S-16b`, autonomous decisions); no code changed. The next agent must not get wrong: the sound setting lives OUTSIDE the save (own key, `SAVE_VERSION` stays 3, fixtures byte-identical), and `music-loop.m4a` (746 KB) breaks the per-file loader limit's size assumption.

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 1 on top of `a1625be`: `docs(final-sound): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only `context/changes/final-sound/` written) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/change.md` | identity, outcome, save-format statement (stays v3, setting outside the save), DESIGN-GAP for the sound settings section, roadmap claims table, follow-ups in/out of scope, autonomous decisions |
| `context/changes/final-sound/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-sound` |
| `grep -n "SAVE_VERSION =" src/core/save.ts` | `SAVE_VERSION = 3` |
| byte counts of `designs/martynka-salon-v2/audio/{ogg,m4a}` | OGG 188 851 B, M4A 878 257 B (13 files each) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source changed (baseline on main a1625be: lint OK; typecheck OK; unit 2970 passed; build OK; e2e 104 passed — inherited, unverified) |

## 4. Next command

`/10x-research final-sound`

## 5. Open

Research questions for the next step (from `change.md`):
- Format per platform: Phaser's `this.load.audio(key, [ogg, m4a])` loads one supported format; does Safari/iPadOS of the target take OGG Vorbis? Precache both or one (the globs in `vite/config.shared.mjs` `workbox.globPatterns` take both today).
- `music-loop.m4a` 746 KB vs `balance.loader.timeoutMs` 12 s per file and `balance.loader.totalMs` 45 s: keep music in the boot queue, load it after boot (it is off by default), or a separate limit.
- Loader cut: `cutLoad` in `src/scenes/loaderCut.ts` handles a decoding image and a pending font, not a Phaser `AudioFile` in `decodeAudioData`; `tests/phaserLoaderPin.test.ts` pins the internals.
- Error boundary: `isFatalSignal` in `src/core/errorSignal.ts` makes an `EncodingError` rejection from `decodeAudioData` fatal (follow-up `audio.noAudio`, `Trigger: S-16b`).
- Where the setting lives: a second key through `src/storage/idb.ts` (async, before `createGame` in `src/main.ts`) vs `localStorage`; not in `SaveState`, not in export/import, untouched by reset.
- Narrator: effects must not cut `createNarrator` speech (`src/ui/narrator.ts`); mixing levels (pack: music gain 0.14).
- Hook points: `RoomScene.playPurchaseSound` (purchase + variant change), `TaskScene` answer/star/bonus/unlock/minigame paths, `VariantPanel` open/preview, `RoomDoneCard`, drag drop (`coin`), tap.
- Loop: the pack trims decoded buffers to the manifest `duration` and crossfades music by 40 ms (`audio-player.js`); decide whether Phaser's `loop: true` is click-free enough.

DESIGN-GAP to add in the implementation: sound settings section (no kit design) — row in `docs/design-gaps.md`; design-gap 35 (purchase sound) closes.
Follow-ups: VO3 hold outline carried forward (`Trigger: designer brief delivers a hold view, or S-17 polish`) into this change's `follow-ups/review-fixes.md` when it is written.
Human checklist candidate: iPad first-touch unlock and loudness on the tablet (pack README: measured automatically, judge on the device).

## 6. Autonomous decisions

- Next step `/10x-research` (fixed by the step prompt; the change crosses Phaser sound/loader internals, the error boundary and the settings panel). Would change: nothing, the run fixes the order.
- Sound setting outside the save under its own key; format stays v3. Rejected: a field in `Settings`/`SaveState` (needs v4, forbidden in this run). Would change: research proving a per-device key cannot work → slice stops at an open PR.
- "Respects muting" = the parent's in-game toggles plus whatever device mute does to Web Audio; no ring/silent-switch detection. Would change: a maintainer request about the silent switch.
- Reset/import leave the sound setting alone (per-device preference). Would change: the maintainer expecting reset to restore all defaults.
- Follow-up `audio.noAudio`/audio rejections in scope; purchase sound hook in scope; VO3 out of scope (not a sound problem). Would change: research finding no rejection reaches the window (follow-up closes with evidence).
- DESIGN-GAP for the sound settings section (profile § 6: kit has none; `audio.html` is only a listening page). Would change: the author delivering a settings design.
- `CLAUDE.md` says the save is v2 since S-15; it is v3 since `salon-load-health` (826150c). Recorded in `change.md`, not edited (not this step's scope). Would change: a docs step of this slice updating `CLAUDE.md` Current state.
