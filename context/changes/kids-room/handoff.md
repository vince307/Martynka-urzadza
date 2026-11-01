# Handoff — `kids-room` (slice S-25)

Written by the `/10x-e2e kids-room phase 6` step of run 2026-11-01-kids-room. All six phases are committed and `change.md` is `implemented`; the spec `tests/e2e/kids-room.spec.ts` is in. Do not tick 6.2 or the other open rows without the orchestrator's full e2e run (`189 + 2`).

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | phases 1-5 with handoffs, phase 6 `9ca69f1` (`test(kids-room): ... (p6)`), then this closeout |
| Pushed / PR / merged | no / no / no |
| `change.md` status | implemented |
| `## Progress` rows remaining | 2.4, 3.6-3.8, 4.5, 5.5-5.12 and 6.2 (orchestrator e2e / [visual] / [human] / [reviewer]) |
| Working tree | clean after the closeout commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/kids-room.spec.ts` | 2 tests, hook build: `#16` three stage backgrounds in the rendered frame, exact balance (literal costs 5,6,7,7,9,10,12,13,15 = 84), card with three done rooms and no teaser, "Dalej" stays (`houseLabel 'Dom'`, mode button); `#2` house cells `done, done, current, closed`, `upper-left` is `children`, its rendered pixel differs from the closed cell and the cream, tap returns to the room, reload keeps `currentRoom 'children'`, `tasksDone 1` |
| `tests/e2e/support/hook.ts` | the room snapshot type gained `stagesDone: number` (the hook already sent it) |
| `playwright.config.ts` | `kids-room` added to the `ROUND_SPEC` alternation only |
| `context/changes/kids-room/plan.md`, `change.md` | rows 4.3, 6.1, 6.3 ticked with `9ca69f1`; status implemented |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/kids-room.spec.ts --workers=1` | 2 passed (about 1.9 min); `--list` shows 2 tests under `chromium-hook` only |
| kids-room + kitchen-room + rooms-as-data + room-change + house-cross-section, `--workers=2`, once | 15 passed (6.8 min); ports 4397/4398 free afterwards |
| Pixel oracle | rendered frame at scene point (1200, 410), RGB per stage 0..3 = (207,138,90), (236,199,154), (248,230,200), (244,207,155), tolerance 12 (the plan's candidates were within 5); the cross-fade is waited out by `expect.poll` |
| Break 1: `sceneKey` always `room.scene.after` | `#16` RED at the stage-pixel poll (stage 1); restored |
| Break 2: children row `place: 1` in `HOUSES['house-1']` | `#2` RED, cell states `[done,done,closed,current]` instead of `[done,done,current,closed]`; restored |
| Break 3: last children cost 15 -> 16 | `#16` RED (stars 84 are one short, so the purchase never lands and `room(page)` is null at the next read); restored. Meta-check: red through the cost rule, but not on the balance assertion itself |
| Break 4: unknown room `attic` added to `HOUSES['house-1']` | `#16` RED, the card item list gains a `teaser`; restored |
| Meta-check of the pixel | it is read by screenshotting the canvas (`renderedPixel`), so a layer covering the background would also fail it |
| `npm run lint`, `typecheck`, `npm test` (4215 passed, baseline 4194 + 21 from earlier phases, this phase 0), `sample` E1-E6, deploy tests, `npm run build` (`e2e hook: absent (2 chunks checked)`) | all green |
| Full e2e | NOT run (orchestrator) |

## 4. Next command

`/10x-impl-review kids-room`

## 5. Open

- Orchestrator: full e2e `189 + 2` (rows 2.4, 3.6, 4.5, 5.5, 6.2); total equals `npx playwright test --list | tail -1`.
- [visual] row 5.6 and the [human]/[reviewer] rows 3.7, 3.8, 5.7-5.12 are untouched.
- The `#16` test's pixel check at stage 0 shares the point with later stages, so a room whose stage pictures are re-exported needs the table `WALL_BY_STAGE` re-measured (comment in the spec).
- Follow-ups with triggers: `context/changes/kids-room/follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **Skill gates decided in place**: browser-level only (no mixed phase), commit message taken as proposed, stopped after phase 6; the epilogue ran (`change.md` implemented) with [reviewer]/[visual]/[human] rows open.
- **Probe first, then fix the oracle**: the first run printed the rendered pixels; the table is the measured one, not the plan's candidate. A change in the stage art or the shadows layer would move it; re-measure then.
- **Break 3 kept** despite landing on the purchase instead of the balance line: it does go red through the protected cost rule. What would change the answer: a regression that raises a cost while leaving enough stars would only be caught by `expect(stars)` after each purchase, which the test also asserts.
- **Row 4.3** ticked because the three phase-4-edited specs (and room-change) ran green once in this step.
