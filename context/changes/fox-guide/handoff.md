# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-plan fox-guide` of run 2026-10-23-fox-guide: `plan.md` (5 phases, 24 Progress rows) and
`plan-brief.md` are written, `change.md` is `planned`. The next agent must not let the guide update sit at the end of
`TaskScene.render` (two branches return early) and must keep `balance.loader` values unchanged (comment only; the new
`tests/bootBudget.test.ts` is the guard).

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | 3 on the branch after this step: identity, research, `docs(fox-guide): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/plan.md` | the plan: phases 1 art + table + boot budget (`impl`), 2 pose + geometry (`tdd`), 3 `GuideFox` + `TaskScene` wiring + hook + gaps 165–168 (`impl`), 4 docs + follow-ups + seam sweep + full visual pass (`impl`), 5 e2e spec #11 (`e2e`); `## Autonomous decisions` P-1..P-11; `## Progress` |
| `context/changes/fox-guide/plan-brief.md` | two-page brief with the key decisions table |
| `context/changes/fox-guide/change.md` | frontmatter `status: planned`, `updated: 2026-10-23` (body untouched) |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| boot payload from disk (`stat` over `public/assets/{tasks,rooms,ui}` WebP, `public/fonts/MartynkaNext.ttf`, 12 boot M4A) | 473 968 + 1 489 688 + 119 288 + 114 640 + 132 243 = 2 329 827 B → 46.6 s at 50 000 B/s (the `balance.loader` comment says 2 329 739 B, 88 B drift); + fox 42 384 B (research's cwebp measurement) → 2 372 211 B → 47.4 s vs `totalMs` 50 000 |
| `metadata-guard.mjs inspect` / `mark-planned` | changed: true, status preparing → planned |
| roadmap sync | `context/foundation/roadmap.md` has no `fox-guide` Change ID — untouched (non-roadmap change) |
| Progress rows ↔ Success Criteria | 24 rows, one per criterion bullet, phases 1–5; every phase body starts with `Driver:` / `Driver why:` |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-plan-review fox-guide`

## 5. Open

- Manual rows (human checklist): 3.5 `[visual]` idle/cheer/think on a tiles task; 4.5 `[visual]` full state matrix
  desktop 1440 + tablet 1024 + 420 × 760 rotate overlay; 4.6 `[human]` accept the fox's place and size (P-1, P-2,
  departs from FR-037's literal "w rogu zeszytu"); 4.7 `[human]` real tablet sharpness / pop / 0-star cheer; 4.8
  `[reviewer] (CI at ship)` PR job `check` log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- DESIGN-GAP rows 165–168 are planned for phase 3 (`docs/design-gaps.md`), not yet written.
- Follow-ups planned for phase 4 in `context/changes/fox-guide/follow-ups/review-fixes.md` (breathing, unlock card,
  512² art, boot budget headroom, fallback anchor x 1802, `modeWidgets` left open).
- Risk: `npm run art` reconverts every picture; phase 1 restores any byte-changed existing file (`git checkout --`).
- Risk: the unlock-card e2e road (as `tests/e2e/health-lines.spec.ts` `#14 U-1`) is slow and flaked under load before.
- BootScene follow-ups (F3, G-2.., `UI_MISSING_URL`) stay open: the plan does not edit `BootScene`.

## 6. Autonomous decisions

- P-1 "180–240 px" = silhouette height (image 320, silhouette ≈ 188 × 220). Rejected: canvas reading. Why: think's paw
  unreadable at 240 canvas. Would change: the maintainer saying canvas → `GUIDE.displaySize` 240. `[human]` row 4.6.
- P-2 placement right margin astride the top-right corner kept (orchestrator note; research rect table shows ≥ 14 px
  clearance). Departs from FR-037's literal "w rogu zeszytu" → `[human]` row 4.6. Would change: visual gate or
  maintainer rejecting it (fallback anchor x 1802).
- P-3 boot budget: `totalMs` stays 50 000; new `tests/bootBudget.test.ts` sums the boot tables' file sizes at a
  test-local 50 000 B/s and requires ≥ 2 s headroom (47.4 s ≤ 48 s). Rejected: 55 s (longer stalled cold start for an
  unmeasured need), 320² art, a new balance field (scope item 8). Would change: a measured cold start > 40 s on the
  maintainer's tablet, or the test red on the next art slice.
- P-4 384² WebP; P-5 screens (no fox on unlock); P-6 pure pose rule; P-7 pop 1.06 / 240 ms, no breathing; P-8 missing →
  no fox — all from research R-3..R-7, reversal conditions in `plan.md` `## Autonomous decisions`.
- P-9 five phases (research proposed four): docs split from the widget phase so each UI phase has one new component and
  the last impl phase carries the seam sweep. Would change: per-phase overhead dominating.
- P-10 e2e cites test-plan risk #11 only. Would change: a mascot risk added to `context/foundation/test-plan.md`.
- Hook field `pops` (a counter) instead of research's `animating`: a counter cannot race the 240 ms tween in e2e.
  Would change: none expected.
- `/10x-plan` questions (complexity, approach, phase approval) were not asked (no human); the step prompt, scope.md and
  research fixed every answer.
