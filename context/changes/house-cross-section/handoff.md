# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-plan-review` step of run 2026-10-31-house-cross-section. Verdict PROCEED; findings F1-F9 fixed in
plan.md in place (phases, drivers and the 36 Progress rows unchanged). The next agent must not get wrong: in `RoomScene`
`refresh(data)` REPLACES its own `this.visiting = null` with `houseWakeVisit(...)` (setting it before the resets would be
wiped), and the hook's house snapshot is `houseView`, never `house` (that field is the saved `HouseState`).

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | 4 on the branch after this step: change identity, research, plan, `docs(house-cross-section): plan review` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-cross-section/reviews/plan-review.md` | the review report (2 critical, 4 warnings, 3 observations, all FIXED; `VERDICT: PROCEED`) |
| `context/changes/house-cross-section/plan.md` | fixes F1-F9 in phases 3, 4, 5, 6, Critical Implementation Details, Known risks; decision R1 |
| `context/changes/house-cross-section/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| read `node_modules/phaser` 4.2.1 `ScenePlugin.switch`, `SceneManager.processQueue`/`switch`/`wake`, `Systems.wake` | data reaches the target's `'wake'` listener as `(sys, data)`; a not-yet-started target gets `start(to, data)` → `create(data)` |
| read `DynamicTexture` constructor and `_renderCanvas` (`DRAW`) | Canvas DT has its own 2D canvas + `context`; `DRAW` calls `object.renderCanvas` on the holder (Container → Graphics/images): capture works; `SalonBackdrop.pixel` returns `null` under Canvas → F3 |
| `grep` `src/testing/e2eHook.ts`, `tests/e2e/rooms-as-data.spec.ts` | snapshot field `house` already exists and is asserted → F2 |
| `playwright.config.ts` `ROUND_SPEC` | spec routing by name; `house-cross-section` absent → F1 |
| `grep -n "Trigger:" context/archive/*/follow-ups/review-fixes.md` filtered by files this slice changes | generic fired follow-ups found → F6 |
| `grep -c '^- \[ \]' plan.md` | 36 before and after the edits |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main 112f158 inherited, unverified) |

## 4. Next command

`/10x-tdd house-cross-section phase 1`

## 5. Open

- Manual rows (human checklist): 2.7 and 5.11 `[reviewer] (CI at ship)`; 5.6 `[visual]` (8 states × 1440/1024);
  5.7 `[human]` roller blind as FR-038 "sylwetki" + a not-reached room shown closed (decision P5); 5.8 `[human]` copy
  "Dom"/"Wróć do pokoju" and top-left back button; 5.9 `[human]` salon green board in a cream cell (gap 178); 5.10 `[human]`
  tablet offline house check.
- Known risks (plan "Known risks"): switch data and Canvas capture hold in the Phaser source, browser proof is phase 6; the
  Canvas pixel read must use the DT's 2D `context` (`pixel` in `HouseScene`, F3).
- Phase 6 must add `house-cross-section` to `ROUND_SPEC` in `playwright.config.ts` (F1).
- DESIGN-GAP rows planned from 183 in phase 5 (`docs/design-gaps.md`); row 180 closes.
- Follow-ups: phase 5 now also sweeps the generic triggers this slice fires (F6 list in plan phase 5 §1).

## 6. Autonomous decisions

- All nine findings fixed in place rather than triaged with a human (contract rule 1: no `AskUserQuestion`; each fix was
  a single obvious edit). Would change: a finding needing a product choice — none did.
- F1: extended `ROUND_SPEC` in phase 6 although the contract gives `playwright.config.ts` fields to `/10x-e2e-setup`:
  `ROUND_SPEC` is a per-spec routing list every slice has extended (`kitchen-room`, `canvas-renderer`), not a setup field.
  Would change: `context/foundation/test-stack.md` naming `ROUND_SPEC` as setup-owned.
- F2: hook field named `houseView` (rejected: renaming the existing `house` field, which would break
  `tests/e2e/rooms-as-data.spec.ts`). Would change: nothing foreseeable.
- F3: Canvas pixel via `DynamicTexture.context.getImageData` and oracle "non-null, alpha 255" (rejected: keeping
  `SalonBackdrop.pixel`'s `null` under Canvas, which makes the assert vacuous). Would change: the DT under Canvas not
  exposing `context` at runtime (then poll `snapshotPixel`'s callback).
- Product decisions P5-P7 kept: defensible against FR-033/FR-038/FR-039 and already carried by `[human]` rows 5.7 and 5.8.
  Would change: the maintainer rejecting either row.
- Drivers kept (1 tdd, 2-5 impl, 6 e2e after the seam sweep, `E2E=on`); no phase split or merged — each is sized for one
  fresh agent. Would change: phase 3 (scene + view + capture + art load) overrunning one agent's context.
