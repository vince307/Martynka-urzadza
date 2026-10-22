# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-implement` step of phase 8. Phase 8 is committed as `639a467`: beads with a pop, entrance stagger of tiles and keys. The next agent starts phase 9 (summary pops and the end-of-round burst).

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` |
| Commits | p1 `a659097`, p2 `b0a0c89`, p3 `626cf71`, p2 fix `35aba94`, p4 `26f5c23`, margin fix `89b265e`, p5 `ceaab1b`, hint-label fix `5d901ff`, p6 `edfbf29`, p7 `73e778f`, p8 `639a467`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` unchanged by this step |
| `## Progress` rows remaining | 34 (`grep -c '^- \[ \]' plan.md`); rows 8.1, 8.2 ticked with `639a467`; 8.3 (full gate green here, e2e by the orchestrator) and 8.4 [visual] left; rows 7.1-7.3 ticked with `73e778f`; 7.4 (e2e by the orchestrator) and 7.5 [visual] left; 4.4, 4.5, 5.4, 5.5, 6.4, 6.5 still left |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/chunky.ts` | `ChunkyFace`: static lip Graphics, outer centred Container (`face`) over an inner one at minus the centre; `add`, `place`, `press`, `release`, `reset`, `setDepth`, `setVisible`, `destroy`; tweens skipped under `prefersReducedMotion()` |
| `AnswerTiles.ts`, `Keypad.ts`, `ActionButton.ts` | each control owns a `ChunkyFace` (lips `LIPS.answer/key/action`, no lip literals left); zones stay outside, fire moments unchanged (`pointerdown`), release on `pointerup`/`pointerout` |
| `tests/layout.test.ts` | new case: tile, key and bar lips stay inside the notebook and clear of the next control, from the real `TASK_LAYOUT`, `LIPS`, `tileRow`, `keypadGrid` |
| `tests/reducedMotionWiring.test.ts` | new: files that tween (list: `chunky.ts`) reference `prefersReducedMotion()`, checked before `tweens.add` |
| `docs/design-gaps.md` | rows 156 (bar buttons lip) and 157 (press with Back overshoot) |
| `src/data/layout.ts` `CONTENT_LEFT` (314) | fix `89b265e`: one inset = frame left + border + `NOTEBOOK.margin.fromInnerLeft` (92) + width 2 + `margin.gap` 24; `NOTEBOOK` moved above `TASK_LAYOUT`; `promptBeside`/`expression` box now 314..1000; left-column picture, drag mat, wallet, digits, hint, tall rectangles start at it (right edges kept or tightened); tap zones untouched except the wallet (x 308 -> 314) and the drag mat (x 236 -> 314), which the e2e hook reads from the layout |
| `PageButton.ts`, `AgeButton.ts` | p5: `ChunkyFace` with `LIPS.page` / `LIPS.age`; press on `pointerdown`, release on `pointerup`/`pointerout`; fire stays on `pointerup` behind `pressed`; `ageButtonShadow` colour and `WELCOME_LAYOUT.ages.shadow` removed (tests use `LIPS.age.offset`); `docs/design-gaps.md` row 152 updated |
| `src/ui/widgets/hudPill.ts` | p6: `drawHudPill(g, rect, { pressed?, lip?, radius? })`: gradient (flat mid colour) face, 5 px border, optional static lip from `LIPS.hud`; used by all four HUD widgets |
| `SpeakerButton.ts`, `RoomSwitchButton.ts` | p6: `ChunkyFace` with `LIPS.hud`; press on `pointerdown`, release on `pointerup`/`pointerout`; the darker pressed face stays; fire moment unchanged (`pointerup`); zone outside the face |
| `StarCounter.ts`, `SettingsIcon.ts` | p6: counter is a `ChunkyFace` that never presses, public `face` container for the phase-7 pop, `setValue` still synchronous; counter 104 px high, top 44 (centre unchanged, 96); gear = pill + static lip, no tweens |
| `HUD_LAYOUT` | p6: unused `fill/pressed/borderColor/border` tokens removed from speaker, room switch and gear; `docs/design-gaps.md` row 158 added, row 25 updated; new case in `tests/layout.test.ts` |
| `fix 5d901ff` | `TASK_LAYOUT.keypad.left` 1040 -> 1120 (keys 156 x 104 unchanged, right end 1636, inside the notebook), hint picture and lines width up to x 1110 (796 px): 0..30 labels 12.1 CSS px on a 1024 tablet; `pictureLayout.test.ts` floor back to 12 |
| `fix 35aba94` | `fillPaper` is now one flat face (mid colour of the two kit tints) so no seam; stitch marks start `phase` 44 px into the kit strip (inner top - 20): 8 marks y 244..944, all inside the page; `NOTEBOOK.stitches.phase`; test with hand-computed oracle |
| `src/scenes/TaskScene.ts` | p7: `answerFace(value)` (tile face, keypad entry field, or the "OK" face; none for digits and dice), `bounce`, `wobble` (+ `stopWobble`, `wobbling` field), camera shake and both `scrollX` resets gone; `flyStar` `onComplete` emits `GAME_EVENTS.starLanded`; keypad `answerSpot` is the entry field centre |
| `Keypad.ts`, `AnswerTiles.ts`, `ActionButton.ts`, `SelectTiles/BlockMat/CoinWallet/ClockSet.ts` | p7: `entryFace()`/`entryTarget()` (field wrapped in a centre container), `faceOf(value)`, `faceObject()`, `okFace()` |
| `chunky.ts` | p7: `moveTo` stops only its own press tween (`pressTween`), so a bounce or wobble on the same face survives the release |
| `StarCounter.ts`, `UIScene.ts` | p7: `pop()` (scale yoyo, off under reduced motion); `UIScene` handles `starLanded`; `onStars` still calls `setValue` directly |
| `tests/motionWiring.test.ts` | p7 (7 cases, AST anchored on method bodies); `reducedMotionWiring.test.ts` list gained `TaskScene.ts`, `StarCounter.ts`; `ANIMATION.shake*` removed; `docs/design-gaps.md` rows 159, 160 |

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
| p5 | unit 3754 -> margin fix +3 (3757) -> p5 +2 (3759) = baseline 3736 + 23; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p5 deliberate break | `LIPS.page.offset` 8 -> 60: both new lip cases red; restored. Moving the `PageButton` press into `pointerup`: no unit red (as the plan predicts); the fire moment is proven only by e2e (`first-launch`, `task-round`, `adaptive`) at the orchestrator |
| margin fix break | `promptBeside` back to x 620 / maxWidth 800: the "right of the margin line" case red; restored. Meta: the case checks the layout tokens, not the Phaser wrap in the scene |
| p6 | unit 3759 -> hint fix +0 (3759) -> p6 +1 (3760) = baseline 3736 + 24; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p6 deliberate break | `HUD_PILL.height` 104 -> 140: the new HUD pill case red; restored. Meta: it went red on the `height === HUD_PILL.height` assertion (HUD_LAYOUT heights are literals, so no overlap appeared); the overlap part reads the real `TASK_LAYOUT.dots`, `BEADS`, `HUD_LAYOUT` rects and is not proven by this break |
| p6 grep | `grep -n tweens SettingsIcon.ts` empty; `dialogSessions.test.ts` green unchanged |
| p7 | unit 3760 -> 3769 = baseline 3736 + 33; lint, typecheck, deploy scripts, `sample` E1-E6, build OK; `grep shakeMs|shakeDistance|shakeSegments|cameras.main.scrollX src` empty |
| p7 deliberate break | (a) `setValue` moved from `onStars` into the `starLanded` handler: 2 cases red; (b) `starLanded` emitted before the flight: the `flyStar` case red; both restored. Meta: regexes slice the `onStars`/`onStarLanded`/`flyStar` bodies, so a stray occurrence elsewhere does not satisfy them; they prove source order, not the rendered motion or the `counterText` specs (orchestrator e2e) |
| p8 | unit 3769 -> 3772 = baseline 3736 + 36; lint, typecheck, deploy scripts, `sample` E1-E6, build OK |
| p8 deliberate break | (a) `prefersReducedMotion()` branch in `ProgressDots` replaced by `true`: 2 wiring cases red; (b) the `entering` settle in `press()` replaced by `false`: the stagger/press case red; both restored (`git checkout`), green. Meta: source-order regexes, they prove the branch and the settle exist, not the runtime; the tap-during-entrance proof is the orchestrator's e2e (round specs tap tiles at once) |
| Playwright | not run: Chromium cannot start in the sandbox; the orchestrator runs e2e (expected baseline + 0; `task-round`, `drawn-tasks`, `money-pay`, `clock-set` tap the same zones) |

## 4. Next command

`/10x-implement notebook-polish phase 9`

## 5. Open

- p8 not seen in a browser: bead row size (radius 28, pitch 74) against the HUD pills, pop feel, stagger look at 0/150/400 ms, reduced-motion rest. Rows 8.3 (e2e part) and 8.4 [visual] are not mine.

- p7 not seen in a browser: bounce/wobble feel, star start over the keypad entry field, counter pop on landing, wobble not cut by the release (chunky now stops only its press tween), reduced-motion path. Wobble target of a keypad answer is the (cleared) entry field showing `?`. A done-phase answer in `retype` is judged by the same `roundView(...).input` as `answerSpot`.
- Rows 4.4, 5.4, 6.4, 7.4 (e2e) and 4.5, 5.5, 6.5, 7.5 [visual] are not mine. Keypad moved 80 px right: check in a browser that the keypad column still looks balanced in the notebook and clear of the ribbon; e2e keypad specs read the hook rects from `TASK_LAYOUT`. Not seen in a browser for p6: pill gradient is flat (as the notebook), speaker/room button press, the gear hint bubble still pointing at the gear. Hint line labels are 12.1 CSS px again after `5d901ff` (keypad moved right); the written column is 330 px wide (was 400), the tall drawings 200-220 px (were 240-264). To confirm in a browser. Page buttons: not seen in a browser; label and graphics sit inside the face container. Not verified in a browser: that the container-wrapped Graphics/Text draw at the same place, press feel, the tile highlight appearing at once, ActionButton "Dalej" not flickering when it hides in the press handler.
- `SelectTiles` and `CoverBoard` still use their own lips (out of phase 4's list).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- Paper: chose a flat face of the mid colour over several narrow bands (simplest; the kit tints differ by a few RGB units), `fillPaper` keeps its signature. Rejected: a gradient (Phaser 4 WebGL path fill gives wrong corners).
- Stitches: modelled on the kit strip (`top:-20; bottom:-20` of the padding box, mark 44-54 of each 100 px period) with a new token `phase`; the old geometry started at the strip's top edge.
- `ActionButton` releases only if it was pressed and is still shown, so "Dalej" hiding inside its own press stays hidden.
- Reduced motion: the face moves at once to the lip (still shows the pressed state) instead of tweening.
- Row 4.4 left unticked (needs the orchestrator's e2e). Commit messages in Polish; stopped after the phase; no questions asked (contract rule 1).
- Margin fix: content starts at `CONTENT_LEFT` 314 (margin line 288-290 plus a 24 px gap), derived from the notebook tokens. Chose to keep the hint number line right of the margin and relax its legibility floor to 10.5 CSS px instead of letting it cross the line; would change if the maintainer prefers 12 px (then the keypad column would have to move). Follow-up candidate: fewer labels on the 0..30 hint line.
- p5: age button keeps its pressed fill colour change besides the sink; the room buttons and "Wróć" inherit the page lip through `PageButton`. Commit messages in Polish; no questions asked.

- Hint-label fix: moved the keypad column 80 px right (1040 -> 1120) instead of shrinking `margin.gap` (only ~16 px gain) or crossing the margin line; hint rectangles end at 1110, 10 px before the keypad. Written column and tall drawings untouched (their fit tests are green and unchanged; they sit left of the keypad with lots of room). Would change if the maintainer wants the keypad flush at its old place: then labels need fewer ticks labelled or a smaller `margin.gap`.
- p6: the counter uses a `ChunkyFace` (never pressed) so phase 7 has a ready `face` container; kept the 96 px gear (touch target) rather than 104; the pressed pill colour stays a face variant (`0xfff0cc`, the old speaker value) inside `hudPill.ts`. Commit messages in Polish; no questions asked.

- p7: bounce target for select/drag/coins/clock is the OK face (as the plan); kept `ANIMATION` tokens from phase 1 unchanged. Wobble runs as one `tweens.chain` and is stopped by the next wobble, a stage change or "Wróć". Pop is not played when the flight is skipped (reduced motion). Row 7.4 left unticked (e2e by the orchestrator). Commit message in Polish; no questions asked.

- p8: input during the stagger is never blocked: zones are not part of the face and stay live from the first frame; a tap calls `ChunkyFace.press()`, which first settles the face at rest (alpha 1, y at rest) and only then presses, so no tap lands on an invisible tile. The keypad entry field is not staggered. Beads: removed the unused `dots.radius/gap/ringWidth` tokens; layout tests read `BEADS`. Commit message in Polish; no questions asked. Row 8.3 left unticked (e2e by the orchestrator).
