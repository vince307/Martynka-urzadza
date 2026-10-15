# Handoff — `final-sound` (slice S-16b)

Written by the `/10x-research` step of autonomous run `2026-10-15-fix-s16bcd`. Research is complete (`research.md`), no product code changed. The next agent must not get wrong: Phaser's `load.audio` picks ONE URL and never falls back on a decode failure (iPadOS < 17.4 has no Ogg Vorbis), a corrupt sound today raises a fatal `EncodingError` rejection (restart card), and the sound setting stays OUTSIDE the save (`SAVE_VERSION` 3, fixtures byte-identical).

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 2 on top of `a1625be`: `docs(final-sound): change identity (autonomous run)`, `docs(final-sound): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only `context/changes/final-sound/` written) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-sound/research.md` | source-backed answers: Phaser 4.2.1 audio load/decode/unlock, `cutLoad` gap, music lazy load, precache formats + iOS Vorbis support, pref storage outside the save, narrator overlap, error boundary, event→effect site table, settings UI, e2e cue log; open questions for the plan |
| `context/changes/final-sound/change.md` | status `new` → `preparing`, `updated` 2026-10-16 (metadata only) |
| `context/changes/final-sound/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-sound` |
| byte counts of `designs/martynka-salon-v2/audio/{ogg,m4a}` (`ls -l`) | effects M4A 132 243 B, OGG 81 144 B; `music-loop` M4A 746 014 B, OGG 107 707 B |
| caniuse `ogg-vorbis` (fetched 2026-10-16) | Safari iOS 3.2–17.3 no, 17.4–18.3 partial, 18.4+ yes |
| `grep stopPropagation src/` | no hits |
| lint / typecheck / unit / build / e2e | not run: research only, no source changed (baseline on main a1625be inherited, unverified) |

## 4. Next command

`/10x-plan final-sound`

## 5. Open

Decisions for the plan (`research.md` § Open Questions):
- Format order in `this.load.audio` (`[m4a, ogg]` vs `[ogg, m4a]` + own decode fallback); re-encode the M4A loop or not (`afconvert`/`ffmpeg` present locally).
- Music: out of the boot queue, lazy-loaded by a scene loader when `music` is on, own xhr timeout (Phaser default 0, see `BootScene` ADD hook), `cache.audio.exists` guard before `sound.add` (it throws on a missing key, `WebAudioSound`).
- `cutLoad` (`src/scenes/loaderCut.ts`) must also stub `onProcessError` for decoding files (late decode failure re-runs `LoaderPlugin.loadComplete`); pin tests beside `tests/phaserLoaderPin.test.ts`.
- Error boundary: `QUIET_REJECTIONS` in `src/core/errorSignal.ts` (`isFatalSignal`) gets `EncodingError` (and plan decides `NotSupportedError`); e2e seam `?e2eSound=corrupt` (marker in `vite/e2eHookGuard.mjs`). Closes follow-up `audio.noAudio` (`2026-10-13-observability-c1-c2`).
- Pref store: new key (e.g. `pref:sound`) in `src/storage/idb.ts` vs `localStorage`; read in `src/main.ts` `start` before `createGame` with a short limit, default effects on / music off; runtime registry key outside `SAVE_KEYS`; in-memory under e2e save seams or not.
- Effects skipped while `game.sound.locked` (WebAudio has no locked-play queue).
- Narrator overlap: `skill-unlock` with `TaskScene.autoReadUnlock`, `room-done` with `RoomScene.showCard` speech; `Narrator` has no speaking state.
- Tap precedence on answer tiles/keys (`ActionButton`, `PageButton`); `purchase` only on `step.bought` in `RoomScene.dispatch` (a free change also calls `celebrate`).
DESIGN-GAP to add in the implementation: sound settings section (gap 114; kit has none); gap 35 (purchase sound) closes.
Follow-ups: VO3 hold outline carried forward (`Trigger: designer brief delivers a hold view, or S-17 polish`) into this change's `follow-ups/review-fixes.md` when written.
Human checklist candidates: iPad first-touch unlock; loudness on the tablet; speech + effects mixing on iOS; music loop click (Phaser loop has no 40 ms crossfade).

## 6. Autonomous decisions

- No questions asked; scope from `change.md` + handoff §5 + the step prompt. Would change: nothing, the run fixes it.
- Recommended music OUT of the boot queue (lazy). Rejected: music in boot (746 KB M4A dominates the 45 s total on a slow link for a default-off feature). Would change: the maintainer wanting music on by default.
- Recommended precaching BOTH formats. Rejected: one format per platform (a static precache manifest cannot differ per device). Would change: a build-time per-platform manifest or dropping OGG entirely in the plan.
- iOS Vorbis support taken from caniuse (not from memory) per the step prompt. Would change: a device test on the daughter's iPad showing different `canPlayType`/decode results.
- Recommended quieting `EncodingError` in the boundary rather than patching Phaser's `AudioFile.onProcess`. Would change: the plan finding a handled-decode path that does not touch Phaser internals.
- Kept the pref storage choice (IndexedDB key vs `localStorage`) open for the plan; both stay outside the save. Would change: nothing for the format; only the plan's simplicity/consistency trade-off.
