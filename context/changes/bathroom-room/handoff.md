# Handoff — `bathroom-room` (slice S-31)

Phase 6 (`e2e`) is committed as 883a68b: `tests/e2e/bathroom-room.spec.ts` (2 tests) and the `bathroom-room` entry in `ROUND_SPEC`. All plan phases are done; `change.md` status is `implemented`.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, `7c742b8` p1, `32c2a5b` p2, `69694ce` p3, 8eab432 p4, a9a4ee5 p5, 883a68b p6, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | open: 5.6 visual, 5.7-5.11 human, 5.12 reviewer, earlier reviewer rows 2.5, 3.7, 3.8 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/bathroom-room.spec.ts` | `#16 S-31 FR-033 ...` (finish salon, kitchen, children, bathroom; exact balance 71; card with four done rooms; rendered border pixels at x 203 and 1717 prove the 1516 card; `houseButton` null under the card; "Dalej" then change mode and "Dom") and `#2 S-31 FR-038 ...` (house cells done/done/done/current, `upper-right` = bathroom, rendered pixel not the closed cream, tap returns, reload keeps `currentRoom` and `tasksDone 1`) |
| `playwright.config.ts` | `bathroom-room` added to the `ROUND_SPEC` alternation (project `chromium-hook`), nothing else |

## 3. Verification

| command | result |
|---|---|
| single spec, `--workers=1`, sandbox off | 2 passed (59 s and 56 s), green first time |
| `--list` | 2 tests under `chromium-hook`; whole suite `Total: 193 tests` = 191 + 2 |
| lint (spec, config) / typecheck | OK / OK |
| Break `{ room: 'bathroom', floor: 1, place: 1 }` -> `place: 0` | test 2 red: `expect(received).toEqual(expected)` on the cell states; restored |
| Break last bathroom cost 15 -> 14 | test 1 red: `expect((await snapshot(page)).stars).toBe(stars)`, Expected 0, Received 1; restored. (Cost 16 broke the boot with `state.room` null, a data validation, not the balance rule, so 14 was used) |
| Break `RoomDoneCard.show` fixed 388/1144 card | first spec version stayed GREEN: the room behind the card is cream (255,245,223), 2 per channel from the card face (255,247,222), so the face pixel proved nothing. The spec now reads the card's border (216,188,111) at x 203 and 1717 of the rendered frame; the same break turns it red on `CARD_LEFT_EDGE`/right-edge `expect.poll`; restored, green after |
| Break `const blocked = open || this.card` -> `open` | test 1 red: `expect(...houseButton).toBeNull()` Received `{x:1750,y:224}`; restored |
| After all breaks | `git status` shows only the new spec and config; ports 4397/4398 killed |

## 4. Next command

`/10x-impl-review bathroom-room`

## 5. Open

- `[reviewer]` rows: 2.5, 3.7, 3.8, 5.12. `[visual]` row 5.6. `[human]` rows 5.7-5.11.
- Follow-up 6 (houseButton while the card is up) is closed by test 1 of this spec.
- The orchestrator runs the full e2e suite once from a pinned worktree; expected total 193.
- Archive: rewrite the CLAUDE.md follow-ups path to the archive folder.

## 6. Autonomous decisions

- Phase 6: manual gate, next-phase and commit-message prompts decided in place (proposed message, only the planned set staged, stopped after phase 6). Would change: none.
- The four-tile width is proved by the card's rendered border at both outer edges, not by the card-face colour (see §3: the face is within 2 of the room's cream, the break stayed green). Card face and tile ivory are still asserted. Would change: a card border colour change (the constant `BORDER` follows `unlockBorder`).
- Floor point (1230, 810) measured on the WebP: before (200,139,80), after (254,234,189), flat in both; outside every slot rect. Would change: new bathroom art.
- The bathroom has no stage backgrounds, so the stage assertion is one before -> after step. Would change: none.
