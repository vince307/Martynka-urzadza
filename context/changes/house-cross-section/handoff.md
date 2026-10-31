# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-plan` step of run 2026-10-31-house-cross-section. The plan (6 phases: 1 tdd, 4 impl, 1 e2e) and its
brief are committed; no product code changed. The next agent must check that FR-039 holds by construction: `visiting`
is set ONLY by `houseWakeVisit` from the house's switch data on the room's wake, and the notebook path passes no data.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | 3 on the branch after this step: change identity, research, `docs(house-cross-section): plan` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-cross-section/plan.md` | the plan: 6 phases with `Driver:` lines, autonomous decisions P1-P12, `## Progress` (36 rows) |
| `context/changes/house-cross-section/plan-brief.md` | two-page brief with the key-decisions table |
| `context/changes/house-cross-section/change.md` | status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-23 status `proposed` → `planning` (at-a-glance row and item body) |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| Progress mapping | 36 unchecked rows = 4 + 7 + 5 + 6 + 11 + 3 success criteria of phases 1-6, one-to-one |
| `Driver:` lines | one `Driver:` and one single-line `Driver why:` under each `## Phase N:` body heading |
| shell alpha bbox (python3 -I, PIL on `designs/martynka-house-street-v1/assets/house/house-1-shell.png`) | x 183-1734, y 47-1006; roof starts at x 605 (y 100) and x 267 (y 200): the top-left corner holds the back button |
| `gh run view 41161789323 --log` (Deploy) | seen `ok   precache covers room pictures — 58 of 58 room pictures precached`, `Tests  4054 passed | 3 skipped (4057)`, `e2e hook: absent (2 chunks checked)` — the formats the `(CI at ship)` rows cite |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main 112f158 inherited, unverified) |

## 4. Next command

`/10x-plan-review house-cross-section`

## 5. Open

- Manual rows (human checklist): 2.7 and 5.11 `[reviewer] (CI at ship)`; 5.6 `[visual]` (8 states × 1440/1024);
  5.7 `[human]` roller blind as FR-038 "sylwetki" + a not-reached room shown closed (decision P5, against the PRD's
  literal "sylwetki"); 5.8 `[human]` copy "Dom"/"Wróć do pokoju" and top-left back button; 5.9 `[human]` salon green board
  in a cream cell (gap 178); 5.10 `[human]` tablet offline house check.
- Known risks for review: Phaser `scene.switch(key, data)` wake data unproven in the repo (fallback recorded in plan
  "Known risks"); `DynamicTexture` capture of a Graphics and of worn-filtered images under Canvas unproven (phase 6 Canvas
  case + visual frame 7).
- DESIGN-GAP rows are planned from 183 in phase 5 (`docs/design-gaps.md`); row 180 closes.
- Follow-ups: kitchen 6 fixed in phase 2 (`trackStates` in `src/pwa/registerServiceWorker.ts`); kitchen 3/14/15/2/10/12/16/19,
  rooms-as-data 11 and audit-art-renderer 2 are re-recorded or closed in phase 5 (`follow-ups/review-fixes.md`).
- No test-plan risk id covers house navigation; the e2e phase cites #2 and #16 and titles FR-038/FR-039.

## 6. Autonomous decisions

- P1-P12 are recorded in `plan.md` "## Autonomous decisions" (chosen, rejected, why, what would change it). In short:
  P1 new `HouseScene` with switch data; P2 per-cell `DynamicTexture` capture; P3 house art on the house scene's own loader
  at first open (not boot, not `roomArtLoader`; kitchen follow-ups 3/14/15 stay unfired); P4 `artFallbacks.house` record,
  no "Obrazki" line; P5 cell states current/done/closed (a not-reached room is closed; `[human]` 5.7); P6 back returns to
  the room in renovation; P7 copy "Dom"/"Wróć do pokoju", back button top-left (`[human]` 5.8); P8 no transition, no
  narrator line; P9 flat sky token instead of the CSS gradient; P10 "Dom" hidden only while blocked (kitchen follow-up 16
  unfired); P11 SW `redundant` warning fixed here; P12 six small phases, hook moved with navigation to keep e2e green.
- Skill checkpoints decided in place (contract rule 1): complexity/question budget, approach and phase approval — no
  `AskUserQuestion`; answers taken from scope.md, change.md D1-D11 and research recommendations. Would change: the plan
  review finding a phase too large or a rule unprovable.
- Roadmap status edit committed with the plan (step prompt: clean tree wins over the skill's "leave it uncommitted").
- No scope.md decision overturned.
