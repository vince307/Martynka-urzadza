# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-plan` step of run `2026-10-31-space-base`. `plan.md` and `plan-brief.md` are committed, `change.md` is `planned`, the roadmap row S-29 is `planning`; no product code was touched. The next agent must not get this wrong: the `HOUSE_ART` base rows and the per-geometry filter (`houseArtKeys`) belong in the SAME phase (2), and the stale-scene fix needs both the house-scene stop in `TaskScene.backToChoice` and the art-flag reset at the top of `HouseScene.create` (phase 3).

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | 5 on top of `9a44799`: `25761bd` identity, `2f8ccb0` handoff, `3fd2d02` research, `68d1488` handoff, `84f8a9a` plan, plus this handoff commit |
| pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 28 of 28 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/base-cross-section/plan.md` | 5 phases with drivers, success criteria, autonomous decisions P1-P9, Progress (28 rows) |
| `context/changes/base-cross-section/plan-brief.md` | two-page brief: key decisions, phases at a glance, risks |
| `context/changes/base-cross-section/change.md` | `status: planned` |
| `context/foundation/roadmap.md` | S-29 status `planning` (At a glance row and slice body) |
| `context/changes/base-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/base-cross-section` (observed) |
| python check: each phase's Success Criteria bullets equal its Progress rows | phases 1-5: 4/7/4/10/3 items, all equal (observed); 28 rows total |
| `metadata-guard.mjs inspect` then `mark-planned --expected-sha256 6df2b18…` | `{"changed":true}`; `change.md` reads `status: planned` (observed) |
| source spot-checks at `68d1488` | `HouseScene.shellReady` uses `HOUSE_ART.every`; `artQueued` not reset in `create`; `backToChoice` stops ui and room only; `HOUSE_LAYOUT.background`/`teaser` read only by `HouseView.render`; `pl.house.open` read only by `RoomScene.redraw`; `houseCells` keeps a done current room `current`; `playwright.config.ts` `ROUND_SPEC` alternation exists (observed) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed. Baseline per contract: unit 4171, e2e 184 on main `9a44799` (inherited, unverified here) |

## 4. Next command

`/10x-plan-review base-cross-section`

## 5. Open

- Phases and drivers: 1 tdd (look, label, art keys as data; follow-up 20), 2 impl (base WebP + filter + per-building caps), 3 tdd (base geometry + stale scene, follow-up 17), 4 impl (docs, gaps, follow-ups, seam sweep, visual pass), 5 e2e (`tests/e2e/base-cross-section.spec.ts`, 3 tests, `184 + 3`, rendered-frame pixel helper).
- Manual rows (human checklist): 4.6 `[visual]` 8 states × 1440/1024; 4.7 `[human]` Mostek celebration default (D4/P6, author-owned unknown); 4.8 `[human]` shared house frame in the base + "Wróć do pokoju"; 4.9 `[human]` tablet offline base pictures; 2.7 and 4.10 `[reviewer] (CI at ship)` Deploy smoke `5 of 5 house pictures precached` and build job `e2e hook: absent (`.
- Risks: phase 2 `npm run art` needs `cwebp` and pinned Pillow 12.1.0 + numpy 2.4.3; `tests/houseCells.test.ts` "HOUSE_GEOMETRY data" pin flips by design in phase 3; `tests/houseArt.test.ts` 80 000 B total becomes per building in phase 2; the base airlock file is `base-1-cell-closed` (pack name collides); phase-5 purchase run (7 buys) is load-sensitive.
- DESIGN-GAPs for phase 4: base frame reuses house `cell-frame`; base stand-in outline without roof; 195 closed; 196 narrowed.
- Follow-ups for phase 4 (`context/changes/base-cross-section/follow-ups/review-fixes.md`): first-building-choice 9 closed, 17 closed, 18/11/16/19 and gap 198 carried; house-cross-section 19 re-recorded, 20 closed (phase 1), 21 closed (phase 5), 2/4/5/9/11 carried.

## 6. Autonomous decisions

- Complexity MEDIUM and 0 product questions: research left none open; the skill's complexity/structure/phase confirmations were decided from the artifacts (contract rule 1). Would change: a plan review finding an undecided product choice.
- P1 style on `HouseGeometry` (R2), P2 flat `HOUSE_ART` filtered by `houseArtKeys` (R3), P3 per-building size caps 80 000 / 110 000 B, P4 follow-up 20 taken with `standInRoof`, P5 follow-up 19 re-recorded, P6 D4 celebration kept with a `[human]` row, P7 `houseLabel` added in phase 1 so the e2e phase writes no product code, P8 rendered-frame pixels via a test-only screenshot helper, P9 five phases. Each with rejected option and reversal condition in `plan.md` § Autonomous decisions.
- No PRD deviation; save format v6 unchanged.
- Roadmap status edit committed with the plan (step prompt overrides the skill's "leave uncommitted").
