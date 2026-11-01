# Handoff — `kids-room` (slice S-25)

Written by the `/10x-plan kids-room` step of run 2026-11-01-kids-room. The plan has six phases (tdd, impl, impl, tdd,
impl, e2e) and no product code has changed. The next agent must not miss two things. First, D1's code stays inside the
bound of one pure rule: `sceneKey` and `stageFade` in `src/core/rooms.ts`. Second, the `HOUSES` row (phase 4) makes
every house-1 card three tiles, so the tile resize lands in that same phase.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 4: change identity, research, `docs(kids-room): plan` (be56408) and `docs(kids-room): handoff row count` (this fix) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`), all pending |
| Working tree | clean after the commit (only the five files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kids-room/plan.md` | the plan: 6 phases, each with `Driver:` / `Driver why:`, deliberate breaks, baseline + delta, `## Autonomous decisions` P1-P10, `## Progress` with 36 rows |
| `context/changes/kids-room/plan-brief.md` | two-page brief |
| `context/changes/kids-room/change.md` | status `preparing` → `planned`; a Notes paragraph "For the product owner" listing every non-data file the plan touches |
| `context/changes/kids-room/handoff.md` | this file |
| `context/foundation/roadmap.md` | S-25 `kids-room` status `ready` → `planning` (the At-a-glance row and the item body) |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/kids-room` |
| Python check of `plan.md`: Success Criteria bullets of each `## Phase N:` against its `### Phase N:` Progress rows | 1:4/4, 2:4/4, 3:8/8, 4:5/5, 5:12/12, 6:3/3, all identical; every phase body starts with `Driver:` |
| `gh run view 41293904884 --log --job 124811306663` (sandbox disabled), ANSI stripped | `ok   precache covers room pictures — 100 of 100 room pictures precached`. Quoted in row 3.8, which expects 123 of 123 after this slice |
| `gh run view 41293904884 --log --job 124810627941` | `Tests  4191 passed \| 3 skipped (4194)` and `e2e hook: absent (2 chunks checked)`. Quoted in row 5.12 |
| numpy on `designs/martynka-evolution-v1/assets/room/children-{stage-0,stage-1,stage-2,after}.png`, read-only | room point (1200, 410): every stage transition differs by ≥ 41 in one channel (11×11 mean). This is the e2e candidate, P10 |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash `ba07546…` → `c179228…`, status `planned` |
| lint / typecheck / tests / build / e2e | not run: this step only writes docs and changed no code. The baseline on main `bfdf193` (unit 4194, e2e 189) comes from the contract and was not verified here |

## 4. Next command

`/10x-plan-review kids-room`

## 5. Open

- **Phases and drivers** (see `plan.md`):
  1. `sceneKey`/`stageFade` (tdd).
  2. The four background sites and `roomArt` stage keys (impl).
  3. `CHILDREN` data, art and copy, unreachable (impl).
  4. The `HOUSES` row, tiles 320/40, `save-v6-kitchen-done.json`, the flipped unit and e2e tests (tdd).
  5. Docs, gaps 202-204, follow-ups, the seam sweep and a 13-frame visual pass (impl).
  6. `tests/e2e/kids-room.spec.ts` (e2e, risks #16 and #2).
- **Code outside room data, for the product owner** (`change.md` Notes, and the PR body at ship):
  - `src/core/types.ts`, `src/core/rooms.ts`, `src/core/backdrop.ts`;
  - `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`;
  - the logic in `src/data/roomArt.ts`;
  - `ROOM_DONE_LAYOUT.tiles` in `src/data/layout.ts`.
- **Manual rows, as a human checklist:**
  - 3.7 [reviewer]: teacher read of the children copy.
  - 3.8 [reviewer] (CI at ship): smoke shows 123 of 123 room pictures.
  - 5.6 [visual]: 13 frames at 1440 and 1024.
  - 5.7 [human]: D1 against "wyłącznie dane i grafika".
  - 5.8 [human]: card tiles 320/40 on every card.
  - 5.9 [human]: costs = 78.
  - 5.10 [human]: wording (gap 202).
  - 5.11 [human]: offline on a tablet.
  - 5.12 [reviewer] (CI at ship): `Tests` and `e2e hook: absent` lines.
- **Phase 4 must grep** `tests/` for every test that pins a two-room house 1. Known so far: `tests/roomsData.test.ts`,
  `tests/e2e/kitchen-room.spec.ts` #16 ("Dalej has no further room") and `tests/e2e/rooms-as-data.spec.ts` (`HOUSE`
  constant, card items). The agent lists each hit in its handoff.
- **DESIGN-GAP rows to add in phase 5:**
  - 202: the kids-room wording.
  - 203: the staged miniature/cell rule.
  - 204: the room-done card with 3 tiles.
  - The existing fade gap row (brief P3.6) is narrowed.
- **Follow-ups** go to `context/changes/kids-room/follow-ups/review-fixes.md` (phase 5):
  - kitchen-room 5 (atlas) fired: measured, not needed.
  - house-cross-section 13 / rooms-as-data 11 close.
  - hangar 5 is satisfied.
  - New: a four-tile card (Trigger S-31).
  - New: `wornPieces`/`contactShadowPieces` "until the first stage" (Trigger S-32).
- **Risk:** the purchase-heavy e2e (28 purchases) is load-sensitive. A timeout is judged with `--last-failed --workers=1`.

## 6. Autonomous decisions

These were decided at this step without `AskUserQuestion`. The skill's complexity and structure confirmations were
decided from the artifacts: MEDIUM complexity, 0 open product questions after research, 6 phases, no new UI component.
Full text is in `plan.md` `## Autonomous decisions`.

- **P1 `sceneKey`**
  - Chosen: the `scene` of the last done stage task, else `after` once staged, else `before`. The last stage omits
    `scene`.
  - Rejected: an explicit `after` key, which would duplicate the art entry. Rejected: option B.
  - Would change it: S-32 needing a stage that goes back to an earlier picture.
- **P2 `stageFade` as a pure helper**
  - Chosen: a pure helper, so the fade rule is unit-tested.
  - Would change it: nothing foreseen.
- **P3 costs: 3/4/5 + 7/9/10/12/13/15 = 78** (D3 kept). `[human]` row 5.9.
  - Would change it: S-17 or the maintainer.
- **P4 wording**
  - Chosen: "Posprzątaj pokój", "Pomaluj ściany", "Odnów podłogę", "Urządź kącik czytelniczy", and variant forms that
    agree with each caption. Gap 202, `[human]` row 5.10.
  - Would change it: the teacher read or a designer list.
- **P5 tiles 320/40 on every card**
  - Chosen: a layout-data change, not count-dependent widths in `RoomDoneCard`. `[human]` row 5.8.
  - Would change it: a clipped caption in the visual gate, which would lead to `labelScale` captions.
- **P6 D1 kept against the roadmap's "wyłącznie dane i grafika"** (`[human]` row 5.7).
  - FR-033 itself allows walls and floor as separate steps, so there is no PRD deviation.
  - Would change it: the maintainer preferring data only. The fallback is one `renovate` stage,
    `children-before` → `children-after`.
- **P7 frozen fixture plus a load-order mirror test, not an e2e save seam**
  - Would change it: a `main.ts` order bug that the mirror cannot see.
- **P8 `stagesDone` in the room snapshot**
  - In the hook build only, outside data, named for the product owner.
  - Would change it: nothing foreseen.
- **P9 phase-4 e2e edits flip existing tests, not delete them**
  - Would change it: nothing foreseen.
- **P10 rendered-pixel candidate (1200, 410)**
  - Re-measured on the WebP in phase 6.
  - Would change it: a weaker difference after conversion, which would mean one point per transition.
- **Commit includes the roadmap status edit** (step prompt), unlike the skill's default of leaving it uncommitted.
