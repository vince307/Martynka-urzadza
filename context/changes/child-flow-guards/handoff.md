# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 1 of run 2026-10-16-audit-sweep. Phase 1 (art-aware round draw) is committed
`d3ba8bb`; phases 2-14 are open. Keep the save format v4 and the rng use of a successful draw unchanged; in phase 4 the
`variantCounted` reset belongs in `TaskScene.applyRound` (review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 4 docs + `d3ba8bb` `feat(child-flow-guards): Art-aware round draw (p1)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is NOT set by this step (left `plan_reviewed`) |
| `## Progress` rows remaining | phase 1: only `[reviewer]` 1.5 left; phases 2-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/visual.ts` | new `visualArtIds` (switch with `never` guard) |
| `src/core/round/artFilter.ts` | `case 'ORDINAL'` in `artBlocked` |
| `src/core/curriculum.ts` | picture threshold from `buckets.current`; `generate` closure redraws up to `balance.round.artRetries` |
| `src/data/balance.ts` | `round.artRetries: 8` |
| `tests/artFilter.test.ts`, `tests/visual.test.ts`, `tests/round.test.ts` | 5 new tests (4 + 1), balance pin updated |

## 3. Verification

| command | result |
|---|---|
| RED (first run, stub `visualArtIds` returning []) | `AssertionError: expected false to be true` (ORDINAL blocked), `expected 2 to be greater than or equal to 3` (E1.11 distinct skills), `expected [] to deeply equal [ 'key' ]` (visualArtIds) |
| GREEN | tests/artFilter.test.ts + tests/visual.test.ts 94 passed |
| Break 1: threshold back to `afterArt.current.length` | red: `expected 2 to be greater than or equal to 3` (E1.11 test); restored |
| Break 2: redraw guard removed | red: `seed 2 E1.2.ordinal_5: expected [ 'pear', 'flower', 'yarn', ... ] to not include 'key'`; restored |
| Meta-check | both breaks hit the draw rule over seeds, not the loader that fills `missingIds` |
| lint / typecheck | OK / OK |
| unit | Tests 3144 passed = baseline 3139 + 5; deploy scripts OK; `sample` E1-E6 OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed = baseline 125 + 0 |

## 4. Next command

`/10x-tdd child-flow-guards phase 2`

## 5. Open


- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768.
- DESIGN-GAP rows to add during implementation: 122 (progress preview previous stage), 123 (list answers as text),
  124 (wallet line), 125 (COMPARE_QTY order).
- Teacher read rows: 5.3 (E1.11, E2.2), 6.3 (COMPARE_QTY, E3.10 HALF), 7.3 (every stage with a changed generator type).
- Follow-ups to write in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrites the S-14c "about 14 % E5" test in `tests/review.test.ts` on purpose.

## 6. Autonomous decisions

- Earlier decisions of the plan review stand (see plan `## Autonomous decisions`).
- **Test-first scope**: all of phase 1 is pure `core` logic; no inline scaffolding. The one extra edit is the pin in
  `tests/round.test.ts` (`balance.round` toEqual) for the new `artRetries` key. Would change: nothing.
- **`change.md` status left `plan_reviewed`**: not touched by this step (frontmatter is the orchestrator's). Would change: the contract asking for `implementing`.
- **Redraw closure placement**: inside `buildAdaptiveRound`'s `generate` argument of `distinctTasks`; `pick.ts` and `unique.ts` untouched. Rng use is unchanged when `missing` is empty or no drawn task names a missing id.
- The `key` test was green against the stub (trivially); it turned red only with the real `visualArtIds` plus the redraw removed, which is Break 2.
- Note: the e2e log of an unsandboxed command lands in a different `$TMPDIR` than the sandbox's.
