# Handoff — `lab-module` (slice S-33)

Written by the `/10x-e2e` phase 5 step of run 2026-11-01-bathroom-polish-lab: phase 5 committed as `be81f83`. The one thing not to get wrong: phase 5 added only a spec and a ROUND_SPEC entry (no app code); the full e2e suite is the orchestrator's, expected `196 + 2`.

## 1. State

| | |
|---|---|
| branch | `feat/lab-module` |
| commits | plan-review head, `947e665` (p1), `e9e6ae2` (p2), `48e67df` (p3), `88004b6` (p4), `be81f83` (p5) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| Progress rows remaining | 10 of 35 (25 ticked: 1.1-1.6, 2.1-2.5, 3.1-3.6, 4.1-4.5, 5.1-5.3) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/lab-module.spec.ts` | 2 tests, `chromium-hook`: `#2 S-33 ...` (mint frame pixel at scene (244,407), cell states, reload) and `#16 S-33 ...` (three done tiles, no teaser, stars 0, "Dalej" stays in lab with mode button and "Baza") |
| `playwright.config.ts` | `lab-module` added to `ROUND_SPEC` |
| `context/changes/lab-module/plan.md` | rows 5.1-5.3 ticked with `be81f83` |

## 3. Verification

| command | result |
|---|---|
| `--list` | 2 tests, `chromium-hook` only |
| single spec, `--workers=1`, sandbox disabled | green twice (before breaks and after restore), 1.6 m |
| break: `HOUSE_GEOMETRY['base-1'].cellFrame` = `'house/cell-frame'` (`-g "#2"`) | RED at the rendered mint-pixel expect (`Expected: true  Received: false`) |
| break: lab row `place: 1` in `HOUSES['base-1']` (`-g "#2"`) | RED at the same pixel expect (frame lands in upper-right) |
| break: last lab task cost 21 to 22 (`-g "#16"`) | RED: card never appears (`expect(received).toBeTruthy()  Received: null`), 300 stars no longer cover 300 |
| break: `{ room: 'bathroom', floor: 1, place: 1 }` added to `HOUSES['base-1']` (`-g "#16"`) | RED at card items `toEqual` (extra `["room","bathroom",false]`) |
| all breaks restored (`git checkout`) | tree clean apart from this phase's files |
| lint / typecheck / build | green; `e2e hook: absent (2 chunks checked)`; unit not re-run (no src/tests change besides the spec) |

Meta-check: the pixel is read by `renderedPixel` (a screenshot clip of the rendered canvas), so a frame under the shell or a stand-in would also fail it; break 1 proves it tells the base frame from house 1's. Note: the "unknown room" break used the existing `bathroom` room (an unknown id would be rejected earlier); the test goes red on the card items, not on a teaser tile.

## 4. Next command

`/10x-impl-review lab-module`

## 5. Open

- Rows 1.7, 4.7, 4.12 [reviewer], 1.8, 3.7 [CI at ship], 4.6 [visual], 4.8-4.11 [human] remain.
- Full e2e once by the orchestrator (expected 196 + 2, equal to `npx playwright test --list | tail -1`). No `ARTIFACT GAP`.

## 6. Autonomous decisions

- Skill tool invoked (`10x-e2e`); gate, commit message and next-phase prompts decided in place (proposed message, stop after the phase). Would change: nothing.
- Test 1 asserts the frame colour with tolerance 30 per channel on mint and not butter, as the plan says; the poll waits on the rendered pixel, not time. Would change: a frame art change moving the pixel.
- The "unknown room" break used `bathroom` (valid id) so the save still loads; it proves the card lists exactly three items. Would change: nothing.
