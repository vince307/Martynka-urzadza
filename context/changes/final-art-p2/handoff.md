# Handoff — `final-art-p2` (slice S-16c)

The `/10x-implement final-art-p2 phase 6` step of autonomous run `2026-10-15-fix-s16bcd` wrote this. Phase 6 (notebook on the unlock card, room-done miniature fallback) is committed (64932d6). Next is phase 7 (`Driver: impl`); rows 6.3 [visual] and 6.4 [reviewer] stay open.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | phases 1-5 `afac8e1`, `1dd8fb1`, `59ebc25`, `d56c3b2`, `3df2b56`, phase 6 `64932d6`, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` (6.3 [visual], 6.4 [reviewer], 5.4, 5.5, 4.4, 4.5 and earlier manual rows open) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/UnlockCard.ts` | draws `firstLoaded([notebook, icon book]) ?? icon book` through `ArtImage`; DESIGN-GAP 22 comment removed |
| `src/ui/widgets/RoomDoneCard.ts` | `drawRoomTile` picks `miniatureMode(...)`: `live`/`drawn` call `drawRoomMiniature` as before, `thumbnail` draws one `salon-after` image in the same rect; `miniature()` getter (null while hidden) |
| `src/scenes/RoomScene.ts`, `tests/e2e/support/hook.ts` | room snapshot gains `doneMiniature` |
| `docs/design-gaps.md` | rows 22 (CLOSED) and 108 updated |
| `e2e-break-p11a.patch` | break for phase 11: tile always `live` (applies to the committed tree) |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 3054 passed (branch baseline 3054, +0); both deploy scripts OK |
| `npm run sample -- E1..E6` | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e | `npx playwright test --workers=4`: 109 passed (baseline 109, +0); row 5.2 ticked from the orchestrator note |
| Break | patch written, `git apply --check` OK; no unit/e2e test covers the tile mode yet (proof is phase 11). Meta-check: it changes only production code, so the suite stays green by design |
| Teacher read | not needed: no content or generator change |

## 4. Next command

`/10x-implement final-art-p2 phase 7` (phase 7: App icons from the pack, `Driver: impl`)

## 5. Open

- 6.3 [visual], 6.4 [reviewer], 5.4, 5.5, 4.4, 4.5 and earlier manual rows.
- Phase 11 must add the `?e2eArt=room` spec reading `room.doneMiniature` (`live` normally, `thumbnail` with the seam) and apply the p11a break.

## 6. Autonomous decisions

- The thumbnail is sized `scene.width x scene.height` times `thumbScale` (250x140), the same rect as the live miniature.
- The mode is computed per tile draw and stored on the card; the hook reports it only while the card is drawn.
- Mixed phase: none.
