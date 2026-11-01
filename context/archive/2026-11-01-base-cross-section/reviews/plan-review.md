<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Base cross-section, the child stays in the base after Mostek, the "Baza" button

- **Plan**: context/changes/base-cross-section/plan.md
- **Mode**: Deep (claims checked inline against the code; no sub-agent: the risky claims were few and file-local)
- **Date**: 2026-11-01
- **Verdict**: SOUND (after triage)
- **Findings**: 0 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS |
| Plan Completeness | WARNING (F1, F2, fixed in plan) |

## Grounding

Grounding: 12/12 paths ✓ (`HouseScene.ts`, `HouseView.ts`, `RoomScene.ts`, `TaskScene.ts`, `houses.ts`, `houseArt.ts`, `layout.ts`, `pl.ts`, `make-task-art.mjs`, `check-deploy.ts`, `tests/houseArt.test.ts`, `tests/houseCells.test.ts` and the five other named tests), 9/9 symbols ✓, brief↔plan ✓, Progress↔phases ✓ (4/7/4/10/3 rows equal the Success Criteria bullets, checked by script after the edits).

Claims verified against the code at `b7bde74`:
- `HouseScene.shellReady` = `HOUSE_ART.every(...)`; `loadArt` builds `missing` from all of `HOUSE_ART`; `artQueued`/`artSettled` are instance fields never reset in `create`; `show()` (run by `create` and wake) calls `loadArt`, so a sleeping or restarted instance skips the other building's pictures: both the stop and the reset are needed (plan phase 3 is right).
- `TaskScene.backToChoice` stops `SCENE_KEYS.ui` and `SCENE_KEYS.room` only.
- `RoomScene.redraw` hides `houseButton` on `blocked` or no geometry and shows the string `pl.house.open`; `pl.house` = `{ open: 'Dom', back: 'Wróć do pokoju' }`.
- `HouseView.render` reads `HOUSE_LAYOUT.background` and `HOUSE_LAYOUT.teaser` (size 32, weight 650, shadow); `standInShell` has inline `margin = 24` and apex `HOUSE_LAYOUT.shellTop + 40` (148 + 40).
- Manifest `bases.base-1`: four cells and `liftShaft` (860, 236, 200×742) as stated; both shell PNGs are transparent at the e2e stage point (120, 600); base airlock vs house blind at cell (304, 100): (253, 246, 223) vs (77, 180, 175), well over 40 per channel.
- Size maths: base 81 970 + 12 308 + 8 600 = 102 878 B (> 90 000 break, < 110 000 cap); house 59 118 B.
- `BRIDGE.tasks` = 7, costs sum 100 (`e2eStars: '100'` buys all). `dist/sw.js` today holds 3 `assets/house/` entries (row 2.4 expects 5).
- `HouseGeometry` users: `HouseView`, `houseCells`, `houses.ts`, `tests/houseCells.test.ts` only (blast radius as planned). `'base-1'` today only in `src/data/houses.ts` (row 4.3 satisfiable).

CI rows checked against a real log (`gh run view 41261590741 --log`, S-28 Deploy):
- job `deploy` 124716473458, step `Smoke check (deploy)`: `ok   precache covers house pictures — 3 of 3 house pictures precached` — the format of row 2.7 matches; expected after this slice `5 of 5`.
- job `build` 124715797789: `e2e hook: absent (2 chunks checked)` ✓; the test line is `Tests  4168 passed | 3 skipped (4171)` with ANSI colour codes between `Tests` and the number in the raw log (row 4.10 corrected, F2).

## Findings

### F1 — Base "Wkrótce" offset misreads the preview's canvas baseline

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §1/§3 (`teaser.offsetY`), Phase 3 §1 (`offsetY: 11`)
- **Detail**: The base preview draws `ctx.fillText('Wkrótce', cell.x+304, cell.y+182)` with the default `textBaseline` (alphabetic): y+182 is the baseline of 32 px text, so the glyphs centre at about y+171, the cell centre, exactly like the house. Phaser draws the teaser with `setOrigin(0.5)` at the cell centre; an `offsetY` of 11 would put the base text about 11 px lower than the pack. The field then has the value 0 for both buildings and is dead weight.
- **Fix**: Drop `offsetY` from the `teaser` contract; both buildings centre the text in the cell (plan §1, §3, phase 3 base literal and P1 edited).
- **Decision**: FIXED (Fix in plan)

### F2 — CI-at-ship rows cite an older run and a regex the raw log does not match

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Rows 2.7 and 4.10 (and Current State "Counts")
- **Detail**: Row 4.10's `Tests +[0-9]+ passed` does not match `gh run view --log` output, which keeps ANSI colour codes between `Tests` and the number (`[2m      Tests [22m [1m[32m4168 passed`). Both rows cited run 41232755289 instead of the latest S-28 Deploy run 41261590741. Row 2.7's line format matches the real log verbatim.
- **Fix**: Rows now cite run 41261590741 (jobs `deploy` 124716473458 and `build` 124715797789) with the lines seen there, say to strip ANSI codes first, and give the expected values after the slice (`5 of 5`; `Tests  <4168 + N> passed | 3 skipped`).
- **Decision**: FIXED (Fix in plan)

### F3 — Follow-up 19 (house-cross-section) fires and is re-recorded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: P5, Known risks
- **Detail**: Its trigger "a change to `HouseScene.loadArt`" fires (phase 2 filters `loadArt`). The deferral holds: a decode failure still leads to the stand-in shell and `artFallbacks.house = 'drawn'`, nothing is lost, and the house pictures have no "Obrazki" line to feed (item 5 carried). The other triggered follow-ups are handled: first-building-choice 9 (D5, closed), 17 (phase 3), 18 (not reached: the base never hits a `FIRST_ROOM` fallback, research § 5), house-cross-section 20 (phase 1), 21 (phase 5 test 2). Audit-art-renderer 2 (`make-task-art.mjs` `-I`) is already closed in code (`execFileSync('python3', ['-I', ...])`).
- **Fix**: none; the phase-4 follow-ups file records it with its trigger.
- **Decision**: ACCEPTED

### F4 — Stand-in colours stay shared by both buildings

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 1 §3
- **Detail**: `HOUSE_LAYOUT.standIn.closed/frame/outline` remain building-neutral placeholder colours; reached only when a picture is missing. Judged in visual frames (3) and (8).
- **Fix**: recorded in `## Known risks` with its reversal condition.
- **Decision**: ACCEPTED

### F5 — Drivers, phase sizing and product decisions hold

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: all phases
- **Detail**: Phase 1 tdd (style fields, `houseArtKeys`, label record, `houseLabel` absent; literal oracles lead), phase 2 impl (art pipeline and glue), phase 3 tdd (geometry literal from the manifest, flipped pin, guards on absent reset/stop), phase 4 impl (docs, seam sweep, visual), phase 5 e2e after the seam sweep on features phases 1-3 build: all right. Each phase is green on its own (the art rows and the filter share phase 2, so the house never waits for base files). Product: FR-045/046/048 are covered; the D4 celebration default (author-owned roadmap unknown) has `[human]` row 4.7, the shared frame and "Wróć do pokoju" have row 4.8; no PRD deviation. Phase 5 test 3 also goes red if only the house-scene stop is dropped (wake skips `loadArt`), so one break per mechanism is not needed for the stop.
- **Fix**: none.
- **Decision**: ACCEPTED

VERDICT: PROCEED — claims hold against the code, drivers and phases are right; two wording/oracle fixes (teaser offset, CI-row log lines) applied in plan.md.
