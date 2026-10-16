# Child-flow guards for tasks, widgets and gestures — Plan Brief

> Full plan: `context/changes/child-flow-guards/plan.md`
> Research: `context/changes/child-flow-guards/research.md`

## What & Why

Slice 1 of the audit sweep 2026-10-16: close every place where a child gets stuck, loops, is paid twice, or meets a
task the round cannot show, and every silent failure in tasks, widgets and gestures (21 MEDIUM + 16 LOW audit ids,
plus the HALF first-hint bug research found). The game's promise is "zero frustration, progress never lost"; these are
the gaps in it.

## Starting Point

Rounds filter skills by missing art but never redraw a task whose picture is missing; the review step E6.11 draws ~14 %
E5; variant rounds are recorded only at "Dalej" while stars are saved at the answer; wallets/select answers leave no
mistake example; several generator loops are unbounded; the test oracle trusts tile/keypad answers; "OK" fires while a
coin or clock hand is carried; layout overflow is clamped silently. Save format v4.

## Desired End State

Rounds never need a missing picture; E6.11 draws 90/10; a daily puzzle closed before "Dalej" is not paid again; a
wallet with too many coins gets one calm reason line; COMPARE_QTY tiles keep a fixed order; every skill shows its first
hint; generator loops are bounded with named errors; validator and oracle refuse impossible modes; gestures cannot
submit or undo by a second pointer; drawn cells keep a floor and overflowing solution lines are signalled. Save stays v4.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Review-step shares | 90/10 (easing 70/30) | `docs/ZADANIA.md` says ~10 % previous stage; the 14 % pin made E5 the majority under easing | Research → Plan |
| Missing-art redraw | in `buildAdaptiveRound`'s `generate`, ≤ 8 retries, keep last | only place with both `missing` and the rng; never shortens a round | Research |
| Wallet reason | `Task.feedback` + `RoundState.note`, `check` stays boolean | five readers treat `check` as truthy | Research |
| Variant timing | count at the last answer with a once-flag | `afterRound` is not idempotent; stars and variants share one write | Research → Plan |
| Text overflow | measured signal (console + hook), no heuristic | `SolutionSteps.fits` already measures with Phaser | Plan |
| Cell fit | each task's real layout rect; failures listed, never `minCell` lowered | honest signal over a global worst case | Plan |
| Stricter oracle | in scope | plan-time probe: no current skill fails (20 × 50 draws) | Plan |
| Clock vs tray second pointer | stay different | clock would undo the pose; tray cancel leaves the mat unchanged | Plan |
| Two fingers | unit proof + `[human]` tablet row | Phaser 4.2.1 has one touch pointer; no e2e can go red first | Research |
| Mistake example of a list | formatted string in `given` | keeps save v4 | Research |
| Deferred | GRD-09, WNA-08, WNA-09, TXT-06 | format change / churn / no kit view / M-size plumbing | Research |

## Scope

**In scope:** PIC-01..06, TXT-01..05, TXT-07/08, GRD-01..08, WNA-01..07, WNA-10, SV2-10, G-4, S13-06, S13-11, S13-12,
S13-14, S14-09, S14-10, HALF hint; DESIGN-GAP rows 122-125; `CLAUDE.md` paragraph; follow-ups.

**Out of scope:** save format change, two-finger e2e, `activePointers`, helper dedups (placeValue/clockElapsed,
`ArtPool`, `grosze(id)`), wallet look, anything under `deploy/`.

## Architecture / Approach

Pure rule in `src/core` first, test red first, then the one widget/scene call site; phases grouped by the code they
touch so each is green alone. Content phases carry the teacher read; visible changes carry a gap row and a screenshot row.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Art-aware draw (tdd) | ORDINAL blocked, E1.11 threshold, redraw on missing art | seeded rounds with missing art change |
| 2. Review step (tdd) | 90/10, no instant unlock, named throw, previous stage in preview | rewrites S-14c's 14 % test |
| 3. List examples (tdd) | wallet/select mistake examples as text | none to format |
| 4. Variant timing (tdd) | puzzle/minigame counted at last answer | double `afterRound` |
| 5. Wallet line (tdd) | calm reason line, gap 124 | copy needs acceptance |
| 6. Order and hints (tdd) | fixed COMPARE_QTY tiles, first-hint test, HALF fix | later seeded tasks shift |
| 7. Bounded loops (tdd) | `drawUntil`, parser bounds, named throws | rng consumption must not change |
| 8. Oracle and validator (tdd) | strict tiles/keypad oracle, mode rules, skill ids | none found by probe |
| 9. Gestures (tdd) | `canSubmit`, clock second pointer, cancel ids | unit-only proof |
| 10. Drawing fit (tdd) | `drawingFit`, overflow signal | a real skill too small |
| 11. Widget guards (impl) | `assertPool`, total types, `lineTicks` | throws reach the error card |
| 12. Dial geometry (tdd) | one `dialGeometry`, set-clock union | CLOCK fixture churn |
| 13. Sweep and docs (impl) | `modeWidgets`, `forcedSkills` throw, `CLAUDE.md`, follow-ups | stale seams |
| 14. e2e (#2, #11) | puzzle reload before "Dalej", overflow flag | e2e load flakiness |

**Prerequisites:** branch `feat/child-flow-guards` from main `9b7fe37`; local gate and e2e per profile § 2.
**Estimated effort:** 14 phase sessions (one fresh agent each) plus review, visual gate and ship.

## Open Risks & Assumptions

- The 14 % review share may have been intended (reversal: revert `reviewWeights`).
- The wallet line wording awaits the author (`[human]` 5.7).
- Two-finger defects are proven only by unit tests and a `[human]` tablet row.

## Success Criteria (Summary)

- No round in any stage can strand, loop or double-pay a child; every first-try miss leaves a readable example.
- Every guard has a red-first unit test; e2e `+ 2` with the puzzle reload and overflow specs; save format still v4.
