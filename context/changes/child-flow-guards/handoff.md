# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-research` step of run 2026-10-16-audit-sweep (slice 1 of 3). Research is complete for every
in-scope finding; nothing is implemented. The next agent must not plan a two-finger e2e spec: Phaser 4.2.1 has one
touch pointer by default (`input.activePointers` 1, `src/main.ts` `createGame` sets none), so PIC-02/GRD-02/GRD-03 are
proven by unit tests only.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 2 on the branch: `docs(child-flow-guards): change identity (autonomous run)`, `docs(child-flow-guards): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/research.md` | per-finding root cause (file + symbol), smallest fix, first failing test, risk; answers to open unknowns (a)-(f); two-finger verdict; recommended 10-phase grouping |
| `context/changes/child-flow-guards/change.md` | frontmatter only: `status: new` → `preparing` |
| `context/changes/child-flow-guards/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/child-flow-guards` |
| grep `node_modules/phaser/src/core/Config.js` `inputActivePointers`, `InputManager.js` constructor loop, `src/` for `activePointers\|addPointer` | default 1; loop `i <= pointersTotal` (mouse + 1 touch); no hit in `src/` |
| read `src/core/tasks/generators/half.ts` hint, `src/data/curriculum/E3.ts` `E3.10.half_30` | first hint line states the result (confirms the TXT-02 measurement) |
| read `tests/review.test.ts` "about 14 % E5", `docs/ZADANIA.md` weights line | contradiction recorded (TXT-01) |
| lint / typecheck / tests / build / e2e | not run — research-only step, no code changed (baseline on main 9b7fe37: unit 3139 passed, e2e 125 passed, inherited, unverified) |
| first-hint suppression probe (worker B, throwaway tsx in scratchpad) | 6922 multi-line tasks, 62 suppressed (half_30 50/50) — observed by the worker, not re-run here |

## 4. Next command

`/10x-plan child-flow-guards`

## 5. Open

- Plan decisions recorded as open in `research.md` § Open Questions: TXT-01 90/10 vs the pinned 14 % (research recommends
  90/10 per `docs/ZADANIA.md`); GRD-04/WNA-04 heuristic `linesFit` vs a measured overflow flag; whether the stricter
  `canonicalInput` (TXT-03) exposes a current skill; whether `stepClockSet` and `stepTrayDrag` should agree on a second
  finger's `down` (GRD-02).
- New content bug in scope via TXT-02: `src/core/tasks/generators/half.ts` hint order (`E3.10.half_30`), teacher read.
- DESIGN-GAP rows expected: 122 (PIC-05 wallet line in `src/data/pl.ts`), optional 123 (COMPARE_QTY fixed tile order).
- Teacher read for every changed generator (`change.md` § Generators touched, plus `half.ts`).
- E2E: only the SV2-10 puzzle-reload spec (`?e2eVariant=puzzle`, answer, reload) is a feasible browser risk.
- Follow-ups to write at archive: F4 note (second finger dropped by `input.activePointers` default 1; re-open a
  multi-point CDP e2e if raised); letterbox-thumb risk (`TouchManager.onTouchStartWindow` forwards letterbox touches to
  the only touch pointer), trigger [human] tablet test; deferred GRD-09, WNA-08, WNA-09, TXT-06 (`change.md` § Deferred).

## 6. Autonomous decisions

- **Two-finger proof by unit, not e2e.** Chosen because a second simultaneous touch never reaches a scene in Phaser's
  default config, so a CDP multi-point spec cannot go red first; rejected: a mouse + touch e2e (not the child's case,
  unverified in Chromium with `hasTouch`). Would change: raising `input.activePointers` or a device report of the bug.
- **TXT-01 recommendation 90/10 (fold `earlier` into `current` on a review step).** Chosen from `docs/ZADANIA.md` ~10 %
  previous stage; rejected: keeping the S-14c 14 % pin (E5 majority while easing). Would change: the maintainer
  confirming the 14 % was intended.
- **HALF hint added to scope** (found by TXT-02's test, which would go red on it). Would change: plan review moving it to
  a separate content change.
- **G-4 redraw in `buildAdaptiveRound` with a bound of 8, keep the last task when exhausted.** Rejected: redraw in
  `pick.ts`/`unique.ts`. Would change: a missing-art case where 8 redraws measurably fail.
- **Research only, four parallel workers** (curriculum, generators, widgets, gestures); decisive claims re-checked in
  the main context. Would change: nothing.
