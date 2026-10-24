# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-implement salon-style phase 3` step: phase 3 is committed (6ff84fa, plus the one-line comment fix 93c4b0a). The miniature and the task/welcome backdrop now carry the graded worn set; `furnishingsBefore` and its picture are gone from type, data, art table, script and disk.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | p1 7d2e520, p2 90785fc, p3 `feat(salon-style): miniature and backdrop follow, the old worn picture is gone (p3)` 6ff84fa, fix 93c4b0a (balance.ts comment still named the removed file, grep 3.3 needed it empty), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 21 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/RoomView.ts` | `MiniaturePiece.worn`; `miniaturePieces` before the stage = scene, `shadows`, the ten `wornPieces` (all `alpha: 0`); `drawRoomMiniature` grades them through `applyWornGrade` |
| `src/ui/widgets/SalonBackdrop.ts` | `BackdropSnapshot.graded` (images with an internal filter in the last capture), `plainBackdropSnapshot` 0 |
| `tests/e2e/support/hook.ts` | `Snapshot.backdrop.graded` (hook build only) |
| `src/core/types.ts`, `src/data/rooms.ts`, `src/data/roomArt.ts`, `scripts/make-task-art.mjs` | `furnishingsBefore` removed; `git rm public/assets/rooms/salon/furnishings-before.webp` (288 634 B) |
| `src/data/balance.ts` | loader comment re-measured: 2 090 166 B, about 41.8 s at 50 KB/s, largest file the font 114 640 B (limit 50 s unchanged) |
| tests | `roomMiniature` (literal key list, `worn` flags), `roomArt` (37), `roomShown`, `roomFixtures`, `salonStyleWiring` +1, `salon-load-health.spec.ts` #15 stalls `shadows.webp` |
| `context/changes/salon-style/plan.md` | rows 2.3, 3.1-3.4 ticked |

## 3. Verification

| command | result |
|---|---|
| 4 target suites | green (`roomMiniature`, `roomArt`, `roomShown`, `bootBudget`) |
| deliberate break: worn miniature pieces `alpha: 1` | `roomMiniature` red; restored |
| deliberate break: `furnishingsBefore` back in `SCENE_FILES` and `SALON.scene` without the file | `roomArt` red (3 cases); restored. A first attempt on `make-task-art.mjs` alone stayed green because `roomArt` never reads the script; the data-level break is the one that proves the file-set guard |
| meta-check | the expected key lists in `roomMiniature` are literals written from `SALON` data (z order hand-read), not built by `miniaturePieces`; the `neededMiniatureKeys` case is unchanged (alpha 0 keeps it) and stayed green |
| `npm run lint`, `typecheck` | clean |
| `npm test` + deploy scripts + `sample` E1-E6 | 3936 passed, 207 files (after p2 3935, +1 wiring case; the roomMiniature case was rewritten in place) |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| Playwright `salon-load-health.spec.ts -g "#15 H-2" --workers=1` | 1 passed (27.7s) on `shadows.webp` |
| boot budget | 2 090 166 B = 41.8 s at 50 KB/s, limit 48 s (50 s - 2 s headroom); was 2 378 800 B, 47.6 s |
| grep 3.3 | `src scripts tests` empty, file absent; 3.4 diff empty |
| screenshot | not taken |

## 4. Next command

`/10x-implement salon-style phase 4`

## 5. Open

- Rows 2.5, 3.5 (full e2e `branch baseline + 0`, `notebook-polish` and `backdrop-restore` backdrop cases with the grown record) are left for the orchestrator.
- Docs still naming `furnishings-before`: `docs/design-gaps.md` rows 32 and 107 and `docs/art-inventory.md` (phase 5 rows 5.2, 5.4).
- Manual rows 5.6-5.10 [human]/[visual], 5.11 [reviewer] as in the plan.
- Unverified visually: nested per-image ColorMatrix filters inside the backdrop holder under WebGL (the `graded` count is the e2e handle, phase 6).
- `roomArt` test title said 38 entries; fixed to 37. The 1 550 000 B total-weight cap in that test is untouched.

## 6. Autonomous decisions

- Made a second commit 93c4b0a instead of amending: the first commit left the removed file's name in a `balance.ts` comment, which the row 3.3 grep forbids. Would change: nothing.
- Worn pieces in the miniature are placed top-left from `x, y, width, height` (equal to the anchor-origin placement of `buildWorn`). Would change: the visual gate showing an offset.
- `graded` counts images with a non-empty internal filter list rather than reading `applyWornGrade` results, so it stays correct if `drawRoomMiniature` grows more filters. Would change: a wanted split between grade and other filters.
- `neededMiniatureKeys` / "Pokój gotowy!" unchanged by keeping the worn entries at `alpha: 0`.
- No lessons file exists.
