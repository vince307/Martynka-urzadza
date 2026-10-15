# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-tdd` phase 3 of run `2026-10-15-fix-s14c-s14d`. Phase 3 is committed and green except e2e (not runnable here). The new types exist only in core and the registry: no curriculum step uses them, `TaskPicture` throws for a `row` drawing and draws no arrow for `motion`; phase 4 builds both widgets. Do not let phase 4 forget the stand-in throw in `TaskPicture`.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phase 1 `a230f1a`, phase 2 `b9b16d5`, phase 3 code `670e988`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` unchanged by this phase (see plan Progress) |
| Progress | rows 3.1-3.3 ticked with `670e988`; 2.6 ticked citing the orchestrator note; 3.4 (e2e part, orchestrator) and 3.5 `[reviewer]` open; 1.5, 2.7, 2.8 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/visual.ts` | `row` drawing (3..10 distinct icons, `mark: 'left'`), `icons.motion?: 'come' \| 'go'` (exactly two plain groups); key, validate, describe |
| `src/data/measures.ts` | `ART_LIMITS.rowMinIcons` 3, `rowIcons` 10 |
| `src/core/tasks/generators/compareQty.ts`, `ordinal.ts` | new generators, registered with parsers in `registry.ts` (types still in `LATER` of `tests/curriculum.test.ts`) |
| `src/core/tasks/generators/chooseOp.ts` | `kinds` accepts `picture` (max 3..10): motion decides `+`/`−`, visual `icons` with motion |
| `src/data/wordTemplates.ts` | `WordTemplate.needsPrice`, `contextsFor(template, pool)`; `sum.bought` is flagged; `Context.price` doubles as the "can be bought" flag |
| `src/core/tasks/generators/{word,chooseOp,compareDiff}.ts` | pick contexts through `contextsFor` |
| `src/core/tasks/generators/shapes.ts` | `clash`: a rectangle target/odd figure never meets a square |
| `src/data/pl.ts` | `tasks.compareQty*`, `ordinal*`, `chooseOpPictureStory`, `words.was/were` |
| `src/ui/widgets/TaskPicture.ts` | `row` case throws on purpose until the widget exists |
| tests | `tests/{compareQty,ordinal,boughtContexts,shapesSquare}.test.ts`, additions in `chooseOp.test.ts`, `visual.test.ts` |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2740 passed (branch baseline 2720, +20); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` x6 (the new types are in no step yet, so they do not appear in sample output; read through a scratch script, see teacher read) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium MachPortRendezvous Permission denied, plain `--workers=4` run and a single-spec retry); expected 86 + 0. Phase 2's row 2.6 ticked from the orchestrator note: 86 passed on `b9b16d5` (5.9 min) |
| RED (first assertions) | shapesSquare: `expected [ 'circle', 'square', 'rectangle' ] to not include 'square'`; boughtContexts: `expected 'Zosia miała 8 złotych i kupiła jeszcz…' not to match /złot/`; visual: `expected [ Array(1) ] to deeply equal []`; compareQty/ordinal (stubs): `expected [ { …(3) } ] to deeply equal []`; picture CHOOSE_OP first test failed with the parser TypeError (`kinds must be … got ["picture"]`), its sibling "picture only fits…" with an assertion |
| Break 1: ORDINAL `answer: length + 1 - place` | `expected 1 to be 3` (ordinal x3); restored |
| Break 2: CHOOSE_OP answer always `a + b` | `x.chooseop … Zabrano 3 … expected [ { skillId … } ] to deeply equal []`; restored |
| Break 3: `contextsFor` returns the whole pool | `expected 'Zosia miała 8 złotych i kupiła jeszcz…' not to match /złot/` (WORD and CHOOSE_OP); restored |
| Break 4: COMPARE_QTY `>` flipped to `<` | `expected 'Po prawej' to be 'Po lewej'`; restored. Meta-check: every oracle reads the drawing (`visual.groups`, `visual.icons` index, `visual.motion`), not `task.answer` |
| Teacher read (scratch draws, seed 5, 6 each) | COMPARE_QTY: "Gdzie jest mniej gruszek?" / "więcej kluczy?", genitive plural right, hint 2 "Z lewej strony: 4 klucze, z prawej: 2 kluczy" style counts agree (checked "1 kredka", "5 kluczy", "3 klucze"), last hint names the tile only. ORDINAL: "Na którym miejscu od lewej jest kłębek?" needs no noun gender, first two hints do not give the place. CHOOSE_OP picture: "Na stole były 2 klucze. Dołożono 7. Które działanie pasuje?" ("było"/"były" agree), hints "Przybyło, więc dodajemy." then the equation. Złote: no more "kupiła jeszcze 5 złotych"; sum stories now only take priced things |
| Square vs rectangle defect from phase 2 | fixed, `tests/shapesSquare.test.ts` (name, all, odd-by-figure) |

## 4. Next command

`/10x-implement e1-shapes-picture-mode phase 4` (Phase 4, `Driver: impl`)

## 5. Open

- 3.4 e2e part: orchestrator runs `npx playwright test --workers=4` (expect 86 passed); 3.5, 1.5, 2.7 `[reviewer]`, 2.8 `[visual]`, `[human]` 9.6, 9.7 open.
- Phase 4 must draw `row` (mark on the left) and the `motion` arrow in `IconGroups`/`TaskPicture`, add the curriculum skills (E1.1 compare_qty, E1.2 ordinal_5, E1.3 choose_op_picture_5) and move COMPARE_QTY/ORDINAL out of `LATER` in `tests/curriculum.test.ts`. Remember the E1.1 `sample` run then shows the new types and needs its own teacher read.
- Phase 4: tiles for ORDINAL come from `generateTask` through `tileRange`; COMPARE_QTY and CHOOSE_OP tiles are strings supplied by the generator.
- Design: the "Z lewej / z prawej" wording relies on the two groups being drawn side by side, left group first; `motion` arrow direction toward/away from the second group.

## 6. Autonomous decisions

1. **Square-vs-rectangle fix**: a rectangle target (name, all) never shares tiles with a square, and an odd-by-figure task never holds both; a square target may still show rectangles (a non-square rectangle is not a square). Rejected: a flat ban of the pair. Would change: a teacher wanting squares called "prostokąt" too.
2. **`needsPrice` on the template** plus `contextsFor`, instead of a name check in each generator; COMPARE_DIFF goes through the helper too (it has no buying template, so its behaviour is unchanged and its test stays green from the start). Rejected: a new `Context` field (plan says the `price` flag).
3. **ORDINAL question "Na którym miejscu od lewej jest klucz?"** (nominative of the noun, no gender agreement) instead of "Który z kolei od lewej jest klucz?". Row up to 10 icons (`ART_LIMITS.rowIcons` 10) so a later step can reach 10. Would change: widget width limits in phase 4 (then lower the constant).
4. **Picture CHOOSE_OP** is a kind of the existing generator: `come` draws like `sum`, `go` like `left`; hints `[chooseOpHint, equation]`, so the existing two-line hint invariants hold. A `picture` kind with `max > 10` is rejected by the parser.
5. **COMPARE_QTY** has exactly three fixed tiles (shuffled), equal groups at `equalShare`; its hints: counting hint, both counts, the tile to choose (the last hint must contain a text answer, per contentInvariants).
6. **ORDINAL first hint wording** has no digits ("Pokazuj palcem kolejne obrazki i licz.") so no hint before the last can reveal the place for places 1-3.
7. **`TaskPicture` `row` stand-in throws**; reachable by no curriculum step. Would change: phase 4 widget.
8. Commit message and next-phase prompts decided in place; stopped after phase 3.
