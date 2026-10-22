# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-implement` step of phase 4. Phase 4 is committed as `26f5c23`: the chunky helper (lip plus a face that sinks on press) on answer tiles, keypad keys and the bar buttons. Before it, a separate fix `35aba94` repaired two defects of phase 2 that the orchestrator saw in a browser. The next agent starts phase 5 (page and age buttons).

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` |
| Commits | p1 `a659097`, p2 `b0a0c89`, p3 `626cf71`, p2 fix `35aba94`, p4 `26f5c23`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` unchanged by this step |
| `## Progress` rows remaining | 45 (`grep -c '^- \[ \]' plan.md`); rows 4.1-4.3 ticked with `26f5c23`; 4.4 (e2e by the orchestrator) and 4.5 [visual] left |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/chunky.ts` | `ChunkyFace`: static lip Graphics, outer centred Container (`face`) over an inner one at minus the centre; `add`, `place`, `press`, `release`, `reset`, `setDepth`, `setVisible`, `destroy`; tweens skipped under `prefersReducedMotion()` |
| `AnswerTiles.ts`, `Keypad.ts`, `ActionButton.ts` | each control owns a `ChunkyFace` (lips `LIPS.answer/key/action`, no lip literals left); zones stay outside, fire moments unchanged (`pointerdown`), release on `pointerup`/`pointerout` |
| `tests/layout.test.ts` | new case: tile, key and bar lips stay inside the notebook and clear of the next control, from the real `TASK_LAYOUT`, `LIPS`, `tileRow`, `keypadGrid` |
| `tests/reducedMotionWiring.test.ts` | new: files that tween (list: `chunky.ts`) reference `prefersReducedMotion()`, checked before `tweens.add` |
| `docs/design-gaps.md` | rows 156 (bar buttons lip) and 157 (press with Back overshoot) |
| `fix 35aba94` | `fillPaper` is now one flat face (mid colour of the two kit tints) so no seam; stitch marks start `phase` 44 px into the kit strip (inner top - 20): 8 marks y 244..944, all inside the page; `NOTEBOOK.stitches.phase`; test with hand-computed oracle |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `typecheck` | OK |
| `npm test` | baseline 3736 + 11 (p1) + 0 (p2) + 4 (p3) + 0 (fix) + 3 (p4) = 3754 passed; deploy scripts OK; `sample` E1-E6 exit 0 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| fix check | `notebookGeometry` test now expects 8 marks `[244 ... 944]` and every mark inside `face`; `fillPaper` has no band (no seam by construction) |
| deliberate break 1 | `LIPS.answer.offset` 8 -> 40: lip-overlap case in `layout.test.ts` red; restored, green |
| deliberate break 2 | `prefersReducedMotion()` replaced by `false` in `chunky.ts`: "checks the preference before the tween" red; restored, green |
| meta-check | the overlap case reads the real `TASK_LAYOUT`/`LIPS`; the wiring case is a source regex, so it proves the check is present, not the runtime behaviour |
| Playwright | not run: Chromium cannot start in the sandbox; the orchestrator runs e2e (expected baseline + 0; `task-round`, `drawn-tasks`, `money-pay`, `clock-set` tap the same zones) |

## 4. Next command

`/10x-implement notebook-polish phase 5`

## 5. Open

- Rows 4.4 (e2e) and 4.5 [visual] are not mine. Not verified in a browser: that the container-wrapped Graphics/Text draw at the same place, press feel, the tile highlight appearing at once, ActionButton "Dalej" not flickering when it hides in the press handler.
- `SelectTiles` and `CoverBoard` still use their own lips (out of phase 4's list).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- Paper: chose a flat face of the mid colour over several narrow bands (simplest; the kit tints differ by a few RGB units), `fillPaper` keeps its signature. Rejected: a gradient (Phaser 4 WebGL path fill gives wrong corners).
- Stitches: modelled on the kit strip (`top:-20; bottom:-20` of the padding box, mark 44-54 of each 100 px period) with a new token `phase`; the old geometry started at the strip's top edge.
- `ActionButton` releases only if it was pressed and is still shown, so "Dalej" hiding inside its own press stays hidden.
- Reduced motion: the face moves at once to the lip (still shows the pressed state) instead of tweening.
- Row 4.4 left unticked (needs the orchestrator's e2e). Commit messages in Polish; stopped after the phase; no questions asked (contract rule 1).
