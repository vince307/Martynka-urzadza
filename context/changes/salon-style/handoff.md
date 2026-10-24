# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-implement salon-style phase 2` step: phase 2 is committed (90785fc). The room now draws the graded worn set, the shadows before the stage and contact shadows after it; the old `furnishings-before` picture is no longer drawn but still loaded and still used by the miniature (phase 3).

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | p1 7d2e520, p2 `feat(salon-style): room draws worn set, floor shadows and contact shadows (p2)` 90785fc, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 26 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/wornGrade.ts` | `applyWornGrade(scene, image, soft)`: soft matrix first, then worn (WebGL), false under Canvas |
| `src/ui/widgets/RoomView.ts` | `buildWorn` (export), `RoomView.drawWorn/drawContactShadows/wornState/contactShadowIds`; `furnishings` layer gone from `render`; shadows layer before the stage and when done |
| `src/scenes/RoomScene.ts` | `fadeStage` ghosts before, shadows and the worn set (from `emptyRoomState()`); `ghosts`/`ghostTweens`, `clearGhosts` on sleep and shutdown; `RoomSnapshot.worn`, `.contactShadows` |
| `src/data/layout.ts` | `ROOM_LAYOUT.depth`: `furnishingsBefore` replaced by `worn` 3 and `wornGhost` 99 |
| `tests/salonStyleWiring.test.ts` | 4 source guards; `tests/phaserLoaderPin.test.ts` +3 pins; `tests/layout.test.ts` depth case; `tests/e2e/support/hook.ts` Snapshot.room fields |
| `context/changes/salon-style/plan.md` | rows 2.1, 2.2, 2.4 ticked |

## 3. Verification

| command | result |
|---|---|
| new guards + pins | `salonStyleWiring` 4, `phaserLoaderPin` +3: green (these are source guards; no RED stage, the code and guards were written together) |
| deliberate break: `furnishings` layer back in `render` + `clearGhosts` removed from `onSleep` (together) | 2 red: `RoomView draws no furnishings picture…`, `the ghosts are cleared on sleep and on shutdown`; restored |
| deliberate break: worn matrix added before the soft one | red `applyWornGrade adds the soft matrix before the worn one` (expected 1129 < 1082); restored |
| meta-check | the first attempt at the sleep break stayed green: the `body()` slice for the nested `onSleep` ran to the shutdown block that also clears ghosts. The test was fixed to slice to the closing `};`, and the break then went red. These guards prove wiring only, the drawn result is for phase 6 and the visual gate |
| `npm run lint`, `typecheck` | clean |
| `npm test` | 3935 passed, 207 files (baseline after p1 3928, +7) |
| deploy scripts, `sample` E1-E6 | OK |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| `grep -rn furnishingsBefore src/ui src/scenes` | one hit left: `miniaturePieces` in `RoomView.ts` (phase 3 removes it); row 2.3 left unticked |
| Playwright, screenshot | not run (orchestrator); no screenshot taken |

## 4. Next command

`/10x-implement salon-style phase 3`

## 5. Open

- Rows 2.3 (miniature still names the old file until phase 3) and 2.5 (e2e count `branch baseline + 0`) are left for phase 3 / the orchestrator.
- Manual rows (phase 5): 5.6-5.10 [human]/[visual], 5.11 [reviewer] as in the plan.
- Known risk carried: nested per-image ColorMatrix filters in `SalonBackdrop.render` (phase 3 checks the `graded` count); worn pieces under WebGL are unproven visually.
- The stage ghost of the worn set is built with `emptyRoomState()`, so it shows the original worn set whatever the saved room was.
- DESIGN-GAPs 169-172 are cited in code comments but not yet in `docs/design-gaps.md` (phase 5).

## 6. Autonomous decisions

- Driver impl, so source guards and pins were written with the code, not red-first. Would change: nothing.
- Row 2.3 not ticked: the plan's grep cannot be empty before phase 3 retargets the miniature; I kept the miniature on the old picture so `roomMiniature` tests and `#15 H-2` stay green. Would change: the orchestrator ruling the grep scope excludes `miniaturePieces`.
- `buildWorn` returns `{ images, keys, graded }` and takes the anchor from the slot or decor definition (`WornPiece` carries no anchor). Would change: adding `anchor` to `WornPiece`.
- Canvas wash is one `Rectangle` at `depth.worn + 0.5`, drawn only when worn images exist but are ungraded. Would change: the visual gate on a Canvas device.
- Contact shadows: `rings` concentric `fillEllipse` at alpha `alpha / rings` each in one Graphics at `depth.shadows`. Would change: the visual gate showing banding.
- No screenshot (optional). No lessons file exists.
