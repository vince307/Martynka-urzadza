# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-implement task-round-stars phase 7` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306), 2 (d77b9c8), 3 (7d99976), 4 (6593472), 5 (4471d8c), 6 (6396fcb) and 7 (6ab3f66) are committed; phases 8–11 are untouched. Phase 7 added the feedback bar, the solution steps, "Dalej" and the shake; the round now plays through all 5 tasks.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1..p7 (p7 `6ab3f66`) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 31 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/ActionButton.ts` | Shared bar button (>=96 high, >=220 wide), fires in `pointerdown`; `show`/`showCentered`/`hide`/`target`/`bounds` |
| `src/ui/widgets/FeedbackBar.ts` | Bottom strip from `view.bar`: yellow hint ("Spróbuj jeszcze raz" + line) and retype (result line), pale green "Brawo! +1 ★"/"Brawo!" + "Dalej" (turquoise), round end text (bonus) without a button; `update(bar, input)`, `nextTarget()` |
| `src/ui/widgets/SolutionSteps.ts` | Lines revealed so far (scaled to fit, min 0.6) under the prompt + "Następny krok" / "Już wiem" in the bar zone; `show`, `hide`, `stepTarget()` |
| `src/ui/widgets/AnswerTiles.ts` | + `markHint(value)`: thicker butter outline on the answer tile during retype |
| `src/scenes/TaskScene.ts` | `advance()` (next), `step()` (nextSolutionStep), `shake()` (camera scrollX tween, killed before the next; never blocks input), bar/steps redrawn in `render()` |
| `src/data/layout.ts` | `bar` (+ bottom 972, radius, padding, border), `barSpan` (tiles / keypad), `solution`, `FONT_SIZES.bar/barButton/solutionLine` |
| `plan.md` | Progress rows 7.1-7.3 ticked with 6ab3f66 |

## 3. Verification

| Command | Result |
|---|---|
| Unit | Tests 584 passed (branch baseline 584, +0; no new logic, as planned) |
| Deliberate break | `roundView` `retype` bar -> `{ kind: 'none' }`: `tests/roundView.test.ts` "retype shows the last solution step and keeps input active" red (1 failed, 9 passed). Restored. Meta-check: it proves the view model, not the drawing |
| `npm run lint` / `typecheck` | OK / OK |
| deploy + ops tests, `sample` E1-E6 | OK; `Naruszenia: 0` each |
| `npm run build` | exit 0 |
| `npx playwright test` | 1 passed (baseline 1, +0); needed `dangerouslyDisableSandbox` (the in-sandbox run fails on Chromium mach ports) |
| Browser look | NOT done: Chromium cannot start in the sandbox and an unsandboxed ad-hoc capture script was denied; the dev server on 4399 was killed. Layout of bar, steps and button is unverified by eye (visual gate, row 7.4) |

## 4. Next command

`/10x-implement task-round-stars phase 8`

## 5. Open

- Manual rows 7.4 `[visual]` and 7.5 `[reviewer]` NOT ticked. The visual gate must check first: solution lines vs the prompt/expression (they start under `promptBottom()`), button in the bar zone (y 876-972) vs the keypad column, bar text fit for long hints.
- Round end: bar shows "Brawo!" or `pl.round.bonus(n)` with no button; phase 8 adds the restart ("Dalej" -> new round) and the star counter. After `next` on the last task the state is `finished` and nothing else is tappable until then.
- Not drawn (not in plan, no copy in kit): "Pokaż kroki" button of the kit hint screens; a "przepisz wynik" instruction in retype (the bar shows only "Wynik: N"). Candidates for DESIGN-GAP rows in phase 10 (docs/design-gaps.md).
- Carried items: manual rows 1.5, 2.5, 5.5 `[reviewer]`, `[visual]` 5.6, 6.4, 7.4, 8.4, human rows 8.5, 10.5-10.8, DESIGN-GAPs and follow-ups in Phase 10; single-line-hint gap (human 10.6).

## 6. Autonomous decisions

1. **"Dalej" button inside the bar, solution button in the bar zone** (kit puts "Już wiem" above the bar); needed because the notebook has no room above it under the tiles. Would change: visual gate preferring the kit position.
2. **Retype tile outline uses `butter` (thicker), not the pale `hint` fill**, which is invisible on ivory. Would change: a palette entry for it in the kit.
3. **Shake = short camera `scrollX` wobble** (`ANIMATION.shakeMs/Distance`), so it covers tiles, field and bar together; the UI overlay of phase 8 will use its own camera and stay still. Would change: the visual gate wanting only the input to move.
4. **No new Polish strings** (all in `pl.round` from phase 5), so no teacher read needed beyond confirming the mapping: hint = "Spróbuj jeszcze raz" + line; bonus text `pl.round.bonus`.
5. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 7.
