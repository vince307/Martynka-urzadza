# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 4 step: the 26 salon pictures are converted to WebP (full source resolution, 1 233 242 B), described by the table `ROOM_ART`,
loaded in `BootScene`, counted in a runtime `roomArtHealth` and shown as a second line of "Obrazki" (commit b6b0b77). The next agent must not get wrong:
the e2e part of the phase 4 gate was NOT run (Chromium cannot start here), so row 4.5 stays open for the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993`, phase 2 `bab7ad7`, phase 3 `200d188`, phase 4 `b6b0b77`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-3 ticked except `[human]` 2.5 (3.4 ticked from the orchestrator note, 94 passed); phase 4: 4.1-4.4 and 4.6 ticked, 4.5 open (e2e part), 4.7 `[visual]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `scripts/make-task-art.mjs` | `npm run art` now also writes `public/assets/rooms/salon/*.webp` from `designs/martynka-expansion-v1` without `-resize`; exits 1 when either kit is missing |
| `public/assets/rooms/salon/` | 26 WebP files: `architecture-before/after`, `furnishings-before`, `shadows`, 4 decor, 18 variants |
| `src/data/roomArt.ts` | `ROOM_ART` (= `SALON_ART`), derived from `SALON`: key, url, width, height, Polish stand-in label (slot + variant name, decor caption, '' for scenes); `SCENE_FILES` maps scene roles to file names |
| `src/scenes/BootScene.ts` | queues `ROOM_ART` (skipped under `?e2eArt=room`), writes `REGISTRY_KEYS.roomArtHealth` |
| `src/data/layout.ts`, `src/data/pl.ts` | `roomArtHealth` registry key; `settings.roomArtOk` / `roomArtMissing(count, total)` |
| `src/ui/dom/{artHealthView,settingsPanel}.ts`, `src/scenes/UIScene.ts` | second `<p class="parent-room-art">` in the "Obrazki" section |
| `src/testing/e2eHook.ts` | `E2EArtSeam` += `'room'`; snapshot `roomArtHealth {total, missing}` |
| `tests/roomArt.test.ts` | 5 tests: 26 entries with WebP header sizes, no stray file, keys = SALON keys, labels, size <= 1 400 000 B |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | pass / pass |
| unit incl. deploy tests, sample E1-E6 | Tests 2930 passed (branch baseline 2925, +5); deploy and ops scripts OK; all six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` lists 26 `rooms/salon/` files |
| art | `shasum` of the 26 files identical after a second `npm run art`; `public/assets/tasks` unchanged; `git status --porcelain designs/` empty; size 1 233 242 B |
| e2e | not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer ... Permission denied`, plain `--workers=4` run: every test failed to launch). Branch baseline 94; this phase adds no spec |
| Deliberate break | `sofa-morska.webp` moved away: 3 tests red (header sizes, stray-file list, total size); restored. Meta: `slot.width + 1` in the table with files untouched: header-size test red, so the test reads the file header; restored |

## 4. Next command

`/10x-implement final-art-salon phase 5`

## 5. Open

- ORCHESTRATOR: run `npx playwright test --workers=4` (expect 94 passed); then tick row 4.5.
- Visual row 4.7: parent panel "Obrazki" with both lines, also with `?e2eArt=room` (hook build) at 1440 and 1024.
- Nothing draws the textures yet: `RoomScene` still shows stand-ins (phase 5 wires `ROOM_ART` textures with `scene.before/after`, decor, `z` depth, fallback to stand-in when `textures.exists` is false, and `alphaAt` from `textures.getPixelAlpha` for `slotAt`/`holdPoint`).
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough. Visual rows 4.7, 5.3, 5.4, 6.4, 7.4, 8.3.
- Phase 5 must re-check `room-change` `overThumb` on the rug with real alpha (see phase 3 note).
- Docs: design-gaps row for the stand-in room and for the room-art line (DESIGN-GAP, like gap 67) is still to be added in the phase 9 sweep.

## 6. Autonomous decisions

1. `ROOM_ART` is derived from `SALON` (keys, sizes) instead of a hand-written list, so the table and room data cannot drift; the test still proves it against the files. Would change: a room whose texture sizes differ from its slot box.
2. Scene file names keep the pack's `architecture-*` names while keys stay `salon/before|after`; `SCENE_FILES` is the one mapping.
3. The second "Obrazki" line is a `<p>` inside the existing section, hidden when `roomArtHealth` is absent; wording "obrazków pokoju" with the same verb agreement as the task line. Would change: the author wanting different copy (DESIGN-GAP row in phase 9).
4. Determinism of the untracked new files was proven by `shasum` before/after a second run (git cannot compare untracked files).
5. Row 3.4 ticked citing the orchestrator note (94 passed, `--workers=4`); 4.5 left open for the same reason.
