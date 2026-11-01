# Handoff — `lab-module` (slice S-33)

Written by the `/10x-plan-review` step of run 2026-11-01-bathroom-polish-lab: verdict PROCEED, 0 critical, 2 warnings fixed in
`plan.md`, 2 observations recorded; `change.md` is `plan_reviewed`. The one thing not to get wrong: phase 1 lands the 21 lab WebP
files, `LAB`, `ROOM_SCENE_FILES.lab` and the copy in ONE commit with a temporary placement exemption (`id === 'lab' ? 0 : 1`) in
`tests/roomsData.test.ts` that phase 2 removes red-first; `src/data/houses.ts` is NOT touched in phase 1.

## 1. State

| | |
|---|---|
| branch | `feat/lab-module`, cut from `main` at `60472aa` (S-32 merge) |
| commits | 4 on top of `60472aa`: change identity, research, plan, `docs(lab-module): plan review` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| Progress rows remaining | 35 of 35 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit (files staged by explicit path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/lab-module/reviews/plan-review.md` | the review: grounding, claims checked against code, follow-up and driver checks, PRD check, F1-F4, `VERDICT: PROCEED` |
| `context/changes/lab-module/plan.md` | edited: phase 5 contract (`test.setTimeout(300_000)`, F1), phase 4 § Docs follow-ups (base-cross-section 13 re-recorded, audit-art-renderer 2 closed, F2), break wording in phase 2 / phase 5 blocks and Progress rows 2.2 / 5.1 (`place: 1` is `upper-right`, F3) |
| `context/changes/lab-module/change.md` | status `planned` → `plan_reviewed`; follow-up row base-cross-section 13 corrected (fires via a comment-only edit) |
| `context/changes/lab-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/lab-module` |
| `ls` of 14 planned/test paths, pack manifest v3, v5 frame PNG | all present |
| grep `houseCells`, `houseRoomList`, `HouseView.render` closed branch | a known unreached room is `closed` and drawn as the airlock → Hangar #2 and base-cross-section stay green; three base tiles come from `houseRoomList` |
| grep card-item pins (`'bridge', true]`) in `tests/e2e` | only `hangar-module.spec.ts` #16 (edited in phase 2) |
| grep `tests/houseCells.test.ts` | base frame pinned in "names its own pictures, shares the frame"; house-1 keys in `describe('houseArtKeys')` |
| grep `Trigger:` across `context/archive/*/follow-ups` | all firing triggers covered after F2 |
| grep `'-I'` in `scripts/make-task-art.mjs` | present (audit-art-renderer 2 already satisfied) |
| `playwright.config.ts` timeout / spec precedents | project 180 s; hangar 240 s (14 buys); bathroom 300 s → F1 |
| Progress ↔ success criteria | 8/5/7/12/3 = 35, identical after edits |
| lint / typecheck / unit / build / e2e | not run: docs-only step; baseline per contract `main` at `60472aa` (unit 4254, e2e 196) inherited, unverified |

## 4. Next command

`/10x-implement lab-module` (phase 1, `Driver: impl`)

## 5. Open

- `[human]` rows (plan Progress 4.8-4.11): costs 6/10/13/14/17/19/21 = 100, Laboratorium wording (gap 208), last module with no
  "Wkrótce" teaser (D3, against the roadmap S-33 Risk text, not the PRD), real-tablet offline check.
- `[reviewer] (CI at ship)` rows 1.8 (room pictures 167), 3.7 (house pictures 6, precache 261), 4.12 (Tests 4251 + N): proven only
  by the post-merge Deploy log, ticked by the orchestrator's docs PR. `[visual]` 4.6 (11 frames × 1440/1024), `[reviewer]` 1.7, 4.7.
- Phases 1 and 3 need `cwebp` and Pillow 12.1.0 + numpy 2.4.3 for `npm run art` (BLOCKED if missing; never hand-made WebP).
- E2E: phases run single specs only (phase 2: `hangar-module.spec.ts`; phase 5: `lab-module.spec.ts`); the orchestrator runs the
  full suite once after phase 5 (expected 196 + 2).
- DESIGN-GAPs planned: new 208, edit 196, close 199 (phase 4). Follow-ups to record in phase 4 in
  `context/changes/lab-module/follow-ups/review-fixes.md`, now including base-cross-section 13 and audit-art-renderer 2 (F2).
- Risks (plan `## Known risks`): mint frame legibility on the base shell; purchase-heavy e2e under load; a Hangar finished on an
  older build meets the Laboratorium without its card.
- No `ARTIFACT GAP`.

## 6. Autonomous decisions

- No `AskUserQuestion`; triage done in place (contract rule 1): both warnings had obvious fixes, applied to `plan.md`; the two
  observations recorded in the review. Would change: nothing.
- Deep mode without a sub-agent: the riskiest claims (Hangar/base e2e staying green, card tiles, frame key pins, exemption
  removal, fixture widening, frame pixel arithmetic) were each one or two greps. Would change: a claim spanning many modules.
- F1: `test.setTimeout(300_000)` (bathroom precedent) rather than splitting test 2 into two tests (rejected: the balance proof
  needs one continuous purchase run). Would change: the test still timing out under load at 300 s.
- F2: base-cross-section 13 re-recorded unchanged rather than "worked" (the `HouseScene` touch is a doc comment only). Would
  change: a phase changing `HouseScene` behaviour — then a phase-BLOCKED per the plan's overview anyway.
- No product decision overturned: costs (D1), no teaser on the last module (D3) and wording (gap 208) each have a `[human]` row
  and none contradicts FR-044/045/046. Would change: the maintainer's answer on rows 4.8-4.10.
