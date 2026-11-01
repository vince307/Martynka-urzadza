# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-tdd` phase 1 step of run `2026-10-31-space-base`. Phase 1 (per-building look, label, art keys as data) is implemented test-first and committed; phases 2-5 remain. The next agent must not get this wrong: the house look must stay as before (the only intended pixel change is the stand-in roof apex, 64 px above its base, follow-up 20) and `houseArtKeys` exists but nothing filters `HOUSE_ART` with it yet (phase 2).

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | plan-review handoff `3a8b5b7` + phase 1 commit (sha in plan rows 1.1-1.4) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` is NOT set by this step (left as `plan_reviewed`; orchestrator/next step may set it) |
| `## Progress` rows remaining | 24 of 28 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/types.ts` | `HouseGeometry` gains `background`, `teaser {color, shadow|null, weight}`, `standInRoof` |
| `src/data/houses.ts` | `house-1` values (0xe7f4f4, teaser #FFF5DF / #245C59 / 650, roof true) |
| `src/data/layout.ts` | `HOUSE_LAYOUT` drops `background` and teaser colour/shadow/weight; `standIn` gains `margin: 24`, `apexY: 148` |
| `src/core/houseCells.ts` | `houseArtKeys(g)` (de-duplicated, fresh array) |
| `src/ui/widgets/HouseView.ts` | reads the look from the geometry; roof only when `standInRoof` |
| `src/data/pl.ts` | `pl.house.open` is a `Record<string,string>` (`house-1` Dom, `base-1` Baza) |
| `src/scenes/RoomScene.ts` | button label by saved house id; `RoomSnapshot.houseLabel` |
| `tests/e2e/support/hook.ts` | hook type gains `houseLabel` |
| `tests/houseCells.test.ts`, `tests/houseSceneWiring.test.ts`, `tests/roomVisitWiring.test.ts` | 7 new cases |
| `context/changes/base-cross-section/plan.md` | rows 1.1-1.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `tests/houseCells.test.ts > houseArtKeys > lists the shell...`: `AssertionError: expected [] to deeply equal [ 'house/house-1-shell', …(2) ]` (stub returning `[]` so the red is an assertion, not a missing import); also `expected undefined to be 15201524` (house background), `house-1: expected undefined to be truthy` (label), wiring guards red |
| GREEN | the 4 named files: 76 passed |
| `npm run lint` / `typecheck` | clean (observed) |
| `npm test` | 227 files, Tests 4178 passed (baseline 4171, +7) |
| deploy tests, `sample` E1-E6 | OK (observed) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `git diff --stat 68d1488 -- save.ts rooms.ts balance.ts houseArt.ts public scripts` | empty |
| deliberate break 1 | `houseArtKeys` without `cellFrame` -> `houseArtKeys > lists the shell...` red; restored |
| deliberate break 2 | `'base-1': 'Baza'` removed -> `pl.house.open (FR-048)` red; restored |
| deliberate break 3 | `HOUSE_LAYOUT.background` read again in `HouseView` -> wiring guard red; restored |
| meta-check | the guards prove wiring and data only; the house still looking the same is the visual pass (phase 4), the base look the rendered-pixel e2e (phase 5) |
| e2e | `house-cross-section.spec.ts` + `kitchen-room.spec.ts` `--workers=1`: 8 passed (5.8m), sandbox off; full suite is the orchestrator's (`184 + 0`) |

## 4. Next command

`/10x-implement base-cross-section phase 2` (phase 2, `Driver: impl`)

## 5. Open

- Phases: 2 impl (base WebP via `ROOM_PACKS`-style art script row, `HOUSE_ART` rows, per-building filter with `houseArtKeys`, size caps per building), 3 tdd (base geometry; flip the `tests/houseCells.test.ts` pin "has a geometry for every house but the base"; stale house scene), 4 impl (docs, gaps incl. 195, follow-ups, visual), 5 e2e.
- `[human]`/`[visual]`/`[reviewer]` rows 2.7, 4.6-4.10 are not mine.
- Gap 195 stays open until phase 3 gives the base a geometry (comment in `pl.ts`).
- `pl.house.open` indexing is typed `string` (no `noUncheckedIndexedAccess`); `RoomScene` guards by `HOUSE_GEOMETRY` before reading.

## 6. Autonomous decisions

- Mixed-phase / manual-gate / commit-message prompts of the skill decided in place: commit the planned set only, stop after phase 1.
- `houseArtKeys` was stubbed to `[]` first so RED is an assertion failure. Would change: nothing.
- Wiring guard for `HouseView` asserts `{ teaser } = geometry` and no `teaserStyle.color|shadow|weight` (the layout's `teaser.size` and `shadowOffset` legitimately remain). Rejected: forbidding `HOUSE_LAYOUT.teaser` outright.
- `standIn.apexY` is the literal 148 (equals `shellTop`; the object cannot reference itself), comment says so.
- `houseLabel` in the snapshot is `null` when the house button has no target (hidden).
