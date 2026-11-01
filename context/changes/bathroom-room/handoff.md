# Handoff — `bathroom-room` (slice S-31)

Phase 5 (`impl`) is committed as a9a4ee5: CLAUDE.md S-31 sentence, gap rows 204 (closed) and 205, follow-ups, seam sweep. The [visual] row 5.6 is the visual gate's; phase 6 is the e2e spec.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, `7c742b8` p1, `32c2a5b` p2, `69694ce` p3, 8eab432 p4, a9a4ee5 p5, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 13 (5.1-5.5 ticked; open: 5.6 visual, 5.7-5.11 human, 5.12 reviewer, 6.x, plus earlier reviewer rows 2.5, 3.7, 3.8) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | S-31 sentence after the S-25 one; S-25 "three tiles on every card" and "kitchen was house 1's last room" reworded |
| `docs/design-gaps.md` | row 204 edited (card width by tile count, closed), row 205 new (bathroom wording) |
| `context/changes/bathroom-room/follow-ups/review-fixes.md` | 12 items, 13 `Trigger:` lines (new, closed, re-recorded) |

## 3. Verification

| command | result |
|---|---|
| 5.1 validate-rule-files | PASS (first run found the CLAUDE.md path to `context/archive/.../follow-ups` missing, so CLAUDE.md cites `context/changes/bathroom-room/follow-ups/review-fixes.md`; the archive step must rewrite that path to `context/archive/2026-11-01-bathroom-room/...`) |
| 5.2 | Trigger lines 13, rows 204/205 = 2 |
| 5.3 | the literal grep `tiles.left` hits only unrelated `TASK_LAYOUT.tiles.left` and `compareQty` code (no `ROOM_DONE_LAYOUT` use; the stale field is already gone); `do not fit at this width` and `come with later slices` empty; `npm run art` leaves `public/assets` clean |
| 5.4 | diff against 8eab432 empty |
| lint / typecheck / unit + deploy + ops tests + sample E1-E6 / build | OK / OK / `Tests 4233 passed (4233)` = phase-4 4233 + 0 (docs only), 0 violations / OK, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | none: docs-only phase, no testable criterion |
| Seam sweep | stale comments none found; gap numbers in `pl.ts` (205) and `layout.ts` (204) match; no placement exemption left; layout test builds the rect through `doneSpec` |

## 4. Next command

`/10x-e2e bathroom-room phase 6`

## 5. Open

- `[reviewer]` rows: 2.5, 3.7, 3.8, 5.12. `[visual]` row 5.6 (visual gate). `[human]` rows 5.7-5.11.
- Follow-up 6 (houseButton while the card is up) closes only when phase 6 is committed.
- Archive: rewrite the CLAUDE.md follow-ups path to the archive folder.
- The `kids-room` spec's second test relies on the bathroom cell staying closed; it passed.
- E2E: single specs only per phase; the orchestrator runs the full suite after phase 6.

## 6. Autonomous decisions

- Manual gate, "how to proceed", unrelated-dirty-paths and commit-message prompts: decided in place (only the planned set committed, proposed message used, stopped after phase 4). Would change: none.
- Driver stays `tdd` (the `HOUSES` row was absent; unit cases were observed red before it). Would change: none.
- The "no closed cell once all four are done" case asserts `not.toContain('closed')` and four cells, because the current room's own cell reports `current`. Would change: none.
- The fixture's stars (17) and chosen variants are invented but valid (`roomStateProblems` = []). Would change: none.
- Phase 5: all prompts decided in place (proposed message, only planned set staged, stopped after phase 5); CLAUDE.md cites the changes/ follow-ups path so the rule-file check passes before archive. Would change: none.
