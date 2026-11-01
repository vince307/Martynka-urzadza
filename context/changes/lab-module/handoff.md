# Handoff — `lab-module` (slice S-33)

Written by the `/10x-research` step of autonomous run `2026-11-01-bathroom-polish-lab`. Research is complete
(`research.md`): the module and the base frame are data + art with a short, named list of non-data touches (art script,
tests, one comment). The one thing the next agent must not get wrong: **only `HOUSE_GEOMETRY['base-1'].cellFrame` changes
— house 1 keeps `house/cell-frame`**, and the art script's `BASE_FILES` needs a per-row pack (the frame comes from v5, the
shell/airlock stay on v1).

## 1. State

| item | value |
|---|---|
| branch | `feat/lab-module`, cut from `main` at `60472aa` (S-32 merge) |
| commits | 2 on top of `60472aa`: `docs(lab-module): change identity (autonomous run)`, `docs(lab-module): research` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit (three files staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/lab-module/research.md` | findings: v3 slot literals, frame geometry/alpha/colour oracle, boot budget measurement, smoke counts, full pin list (unit + e2e), v7 fixture path |
| `context/changes/lab-module/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/lab-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/lab-module` (observed) |
| python read of v3 `manifest.json` `rooms.lab` | 6 slots, x/y/size/z/anchor/visibleRect as in research §1; z distinct (observed) |
| Pillow on v5 `base-1-cell-frame.png` | 640×374 RGBA, interior alpha max 0, border mint (85,204,181) vs house frame butter (248,210,106) (observed) |
| cwebp (`-q 85 -alpha_q 100 -m 6`, the script's flags) of 21 lab PNGs + frame into the scratchpad | lab 656 332 B vs hangar 606 452 B (≈ +1.0 s → ~30.9 s of 48 s); frame 3 498 B; base house-art weight 97 776 B ≤ cap 110 000 (observed) |
| `node --import tsx` scratch: `unreachableSlots` on a manifest-built lab with all slots bought | `[]` (observed) |
| lint / typecheck / unit / build / e2e | not run: research only, no product code changed; baseline in the agent contract inherited, unverified |

## 4. Next command

`/10x-plan lab-module`

## 5. Open

- Pins the plan must change (research §5): `tests/roomsData.test.ts` (base `houseRoomList`, describe "hangar flow (FR-047)",
  new "lab data"), `tests/houseCells.test.ts` ("names its own pictures, shares the frame"), `tests/houseArt.test.ts`
  (`expected` map), `tests/roomArt.test.ts` (snapshot `room-art-lab.json`, counts), `tests/fixtureLoadPath.test.ts`
  (bridge-done merged rooms → three, `FIXTURES` + `save-v7-hangar-done`), `tests/e2e/hangar-module.spec.ts` #16 (card gains
  the lab tile, "Dalej" opens `lab`). `base-cross-section.spec.ts` and hangar #2 stay green (lab cell `closed`).
- Non-data touches to name in change.md / PR body: `scripts/make-task-art.mjs` (`SPACE_BASE_V3`, `SPACE_BASE_V5`, per-row
  `pack` in `BASE_FILES`, existence-loop dir list), comment in `HouseScene.art`.
- Fixture `tests/fixtures/save-v7-hangar-done.json`: hand-written in the shape of `save-v7.json` + base content of
  `save-v6-bridge-done.json` (no generator script exists; `encodeSave` + `guardedPut` is the real writer, the FIXTURES
  round-trip proves it).
- DESIGN-GAPs (from change.md): new Laboratorium wording row; edit 196; close 199 (200 stays).
- Follow-ups firing: hangar-module 1 (in scope), base-cross-section 6 frame half (in scope), SW-install warning (re-record),
  house-1-polish 2 recolour retirement (carry, out of scope). Atlas trigger does NOT fire (lab ≈ 30.9 s, salon 41.4 s stays worst).
- `[human]` none raised at this step.

## 6. Autonomous decisions

- **R1. No AskUserQuestion; scope taken from change.md + step prompt.** Rejected: widening into S-35 v5 crew/life layers.
  Would change: a maintainer instruction to integrate v5 beyond the frame.
- **R2. Recommend a hand-written v7 fixture** over adding a fixture-generator script. Why: every done-room fixture so far is
  hand-written and frozen (bathroom-room plan, house-1-polish `save-v7.json`), and the FIXTURES round-trip runs the real
  `loadSave`/`encodeSave`. Would change: a reviewer requiring byte-identity with a `guardedPut` record (then generate it
  once in a test with fake IndexedDB and freeze the output).
- **R3. Measured art sizes in the scratchpad, not with `npm run art`** (which writes into `public/` — product files, a
  plan-phase job). Would change: nothing; the plan's art phase re-measures on the committed files.
- Inherited D1–D8 from change.md stand; research confirmed D3 (no teaser: `houseRoomList` source), D4 (frame geometry
  identical, per-geometry draw), D6 (no per-room field missing in v7).
