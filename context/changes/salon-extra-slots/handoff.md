# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-plan` step of autonomous run `2026-10-15-fix-s16bcd`: `plan.md` (8 phases, 34 Progress rows) and `plan-brief.md` are written, `change.md` is `planned`, roadmap S-16d is `planning`; nothing is implemented. The next agent must not get this wrong: phase order is load-bearing (the `holdPoint` clip of phase 1 and the render wiring of phase 2 must land before phase 3 adds the curtains and moves the decor), and phase 3 changes pinned tests ON PURPOSE (`[human]` row 4) while `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay untouched.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots`, cut from `main` at `a06795b` |
| Commits | 3 on top of main: change identity, research, `docs(salon-extra-slots): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| Progress rows remaining | 34 of 34 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/plan.md` | full plan: 8 phases with `Driver:` lines, `## Autonomous decisions` (4 `[human]` rows), `## Progress` |
| `context/changes/salon-extra-slots/plan-brief.md` | two-page brief |
| `context/changes/salon-extra-slots/change.md` | frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-16d status `proposed → planning` (At a glance row and the `### S-16d` block) |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-extra-slots` (observed) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `changed: true` (observed) |
| Pack manifest geometry of the 5 slots (`node -e` over `designs/martynka-salon-v2/manifest.json`) | values copied into plan phase 3 (observed) |
| Plan structure | 8 `## Phase` blocks, each `Driver:` + `Driver why:`; success criteria map 1:1 to 34 Progress rows (counted) |
| Code gates (lint, typecheck, unit, build, e2e) | not run: planning step, no product code changed. Baseline on main at a06795b (contract, inherited, unverified): unit 3063, e2e 117 |

## 4. Next command

`/10x-plan-review salon-extra-slots`

## 5. Open

- `[human]` decisions to confirm (plan § Autonomous decisions 1–4): costs 8, 10, 12, 13, 15 (total 129); boot `totalMs` 45 → 50 s; finished salons reopen (no shadows / mode button / teaser until task 12); tests changed on purpose in `tests/roomsData.test.ts` ("… never fall", "draws every piece inside the scene", legacy-id test) plus count pins.
- Manual-only rows (human checklist): 6.4 iPad "Wymień lampę"; 8.4 iPad hold on the curtains near the top edge; visual 3.7.
- E2E phases 6–8 use the request-file protocol (Chromium not available to phase agents); break patch `e2e-break-p6a.patch` is written in phase 2.
- Follow-ups to write in phase 5 (`follow-ups/review-fixes.md`): atlas, "Wymień" variant 0, VO1, VO3, L-7, F2, L-4, L-R8, L-R11, F1, M-6 second half / P-6, reopened salon look, `MINIGAME_WORDS`, costs (S-17).
- No DESIGN-GAP row added in this step (phase 3 reuses the room copy gap comment, rows 31-36).
- No `ARTIFACT GAP`.

## 6. Autonomous decisions

1. **No AskUserQuestion; skill's complexity and structure confirmations decided in place** (HIGH-ish scope, research settled every open question). Would change: a human in the loop.
2. **Costs 8, 10, 12, 13, 15** (step prompt + research recommendation). Would change: author / S-17.
3. **`totalMs` raised to 50 s** rather than kept (cold start ≈ 46.6 s > 45 s). Would change: plan review preferring stand-ins on cold start.
4. **No new e2e save seam**: phase 7 buys 7 tasks and reloads (same bytes as a salon finished under S-16c). Would change: the save gaining a build-specific field.
5. **Hook `shown` comes from `RoomView`'s drawn layer record**, so a render break changes what e2e reads (run lesson). Would change: nothing likely.
6. **M-6 first half included as its own tdd phase 4** (cheap, `scripts/`). Would change: plan review moving it out.
7. **Phase split**: core rule (1) and wiring (2) before data (3) so every phase stays green; data + art + tables in one phase because `SALON_ART` derives from the data and its test checks files. Would change: a reviewer finding a smaller cut that stays green.
8. **Clipboard step of the skill skipped** (unattended run).
