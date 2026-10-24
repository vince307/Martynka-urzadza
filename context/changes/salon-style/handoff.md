# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-plan-review` step of run 2026-10-24-salon-style: verdict PROCEED (SOUND after in-plan fixes), `change.md`
status `plan_reviewed`, plan unchanged in shape (six phases, 33 Progress rows). The next agent must not reintroduce a dust overlay
or a turquoise nudge, must keep the worn pieces outside `chosen` / `shownVariants`, and must not read the soft-furnishing extra
grade (P-2) or the grade departing from scope's numbers (P-1) as drift: both have `[human]` rows.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | four: change identity, research, plan, `docs(salon-style): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| Progress rows remaining | 33 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/salon-style/reviews/plan-review.md` | review report: 0 critical, 1 warning (F1), 3 observations (F2–F4), verdict line at the end |
| `context/changes/salon-style/plan.md` | three targeted edits: phase 5 §4 follow-up list (F1), phase 1 §3 `canvasWash` colour = `PLACEHOLDER_COLORS.ivory` (F2), phase 2 §2 Canvas wash only when a worn image was drawn (F3) |
| `context/changes/salon-style/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/salon-style/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/salon-style` |
| hand recomputation of `gradeMatrix` grade E (Phaser `saturate` + `ColorMatrix.SEPIA`) | row R `[0.5794, 0.1842, 0.0941]`, offset 16.8 — matches the phase 1 oracle |
| hand recomputation of `contactShadowPieces` from `src/data/rooms.ts` `SALON` | lamp (897, 487, 155.25, 49.68), plant-left (223, 653, 141.9), pouf (605, 932, 233.7), plant-right (1778, 737, 127.2) — match |
| Phaser 4.2.1 source (`FilterList#addColorMatrix`, `filters/ColorMatrix.js` `colorMatrix`, `display/ColorMatrix.js` `getData` /255, `Filters#enableFilters` no-op without `gl`, `renderNodes/Camera.js` internal filters from index 0) | all as the plan states |
| `grep -rn "gradeMatrix\|wornPieces\|contactShadowPieces\|applyWornGrade" src tests` | empty — phase 1 `tdd` driver valid |
| `python3 -c "import PIL,numpy"` versions | 12.1.0, 2.4.3 (pins available) |
| `grep -c '^- \[ \]' plan.md` | 33 (unchanged) |
| local gate | not run: docs-only step (baseline in the contract: unit 3915, e2e 160) |

## 4. Next command

`/10x-tdd salon-style phase 1`

## 5. Open

- Manual rows (phase 5): 5.6 [human] accept the worn before state or ask for an author before picture; 5.7 [human] grade stronger
  than scope's −25 % and no dust overlay; 5.8 [human] turquoise not nudged; 5.9 [human] board `#BCD799` and the Python step;
  5.10 [visual] full frame list at 1440 and 1024; 5.11 [reviewer] CI at ship.
- Known risk carried: nested per-image ColorMatrix filters inside `SalonBackdrop.render`'s blurred holder (DynamicTexture draw) —
  proven only by the `graded` count and the welcome frame; fallback in plan "Known risks".
- Follow-ups (phase 5 writes `context/changes/salon-style/follow-ups/review-fixes.md`): now including audit-backdrop-fox F6 and
  notebook-polish 16 as **fired** by the `SalonBackdrop.render` / `BackdropSnapshot` edit, plus save-observability L-R9 and
  salon-load-health M-5 (fired by the `RoomScene` edit), all re-recorded open with reasons.
- DESIGN-GAPs to add in phase 5: 169–172; 107 and 109 amended.

## 6. Autonomous decisions

- Review mode Deep without a sub-agent: the risky claims (matrix oracle, coordinates, Phaser filter API, follow-up triggers) were
  few and checkable directly. Would change: a plan with claims across many modules.
- Skill's AskUserQuestion triage replaced by in-place triage per the step prompt: F1 fixed (obvious), F2/F3 fixed (one clause each),
  F4 accepted (gate 4.3 covers it). Would change: nothing (prompt-fixed).
- Product decisions P-1, P-2, P-4, P-5 not overturned: backed by research montages, scope item 2 lets research pick, each has a
  `[human]` row. Would change: the maintainer rejecting them at 5.6–5.9.
- F3 (wash only with a drawn worn image) is a reviewer addition to phase 2. Rejected: wash always under Canvas in the before state.
  Would change: the visual gate on Canvas wanting the background toned too.
- Drivers unchanged (P1 tdd, P2–P5 impl, P6 e2e after the seam sweep). Would change: phase 1 finding the rules already present.
