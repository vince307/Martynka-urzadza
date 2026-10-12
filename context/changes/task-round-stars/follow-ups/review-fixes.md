# Follow-ups — task-round-stars (S-04)

Each item has a `Trigger:` line; later slices and reviews grep for it.

## Content and scope

- Hint classes b/c rewritten so the first line teaches the school method without stating the result (10 types keep a one-line hint that leaks the result, so the child sees only "Spróbuj jeszcze raz" after the first mistake; see plan Known risks, FR-008).
  Trigger: S-17
- UI for the `'select'` answer mode (E1.6, E3.7) and `'drag'`; they are excluded from the draw until then (docs/design-gaps.md row 7).
  Trigger: S-13
- Task/room switch between tasks (FR-011): `roundView.switchVisible` is ready, nothing is drawn (docs/design-gaps.md row 4).
  Trigger: S-05 or S-09, whichever draws the first room entry

## Test plan and tooling (owner: `/10x-test-plan refresh`)

- test-plan section 3: the row for phase 5 (font, tokens, task scene) is stale after S-04.
  Trigger: /10x-test-plan refresh
- test-stack.md tool table and test-plan section 6.6: add the second e2e server (hook build, `dist-e2e`, port 4397, project `chromium-hook`) and the production-bundle guard in `npm run build`.
  Trigger: /10x-test-plan refresh
- Spec for risk #9 in the test plan.
  Trigger: /10x-test-plan refresh
- `scripts/check-deploy.ts`: assert that the live bundle has no `__martynkaE2E` marker. Today the build guard (`vite/e2eHookGuard.mjs`) already covers it; add this only if the hook ever moves outside the `if (__E2E_HOOK__)` branch or deploy builds with another command.
  Trigger: hook moved outside the `if (__E2E_HOOK__)` branch in `src/main.ts`, or deploy stops using `npm run build`

## From impl-review (2026-10-12)

- Word template "kupił jeszcze 2 złote" (E1.3.choose_op_5, `src/data/wordTemplates.ts` `contexts` entry `złoty` with the "bought" kind): buying złote makes no sense; money needs its own verbs (dostał, odłożył) or must be excluded from the buy template. Pre-existing S-03 content, outside this slice's steps.
  Trigger: S-17 or the next change to `src/data/wordTemplates.ts`
- V3 slashed zero: the TTF has no plain-zero alternate (GSUB features aalt, case, ccmp, frac, locl, ordn, pnum, sups, tnum; glyphs `zero`, `zero.tf` only) and canvas text cannot set font features; the kit style guide approves the slashed zero. Changing it needs another numeral font or a renamed modified font (OFL Reserved Font Name) — a maintainer decision.
  Trigger: S-16 (art pack) or the maintainer asks for a plain 0
- V1 bar text stays 36 px (kit 34 px, `.feedback`); a larger bar text is a design change to the kit, not a token fix. Solution lines now 44 px (kit maximum).
  Trigger: visual gate or iPad check (row 8.5) finds the bar unreadable
- `src/core/round/view.ts` `roundView`: the input mode comes from `task.choices`, not `skill.answer`; a future 'tiles' skill with a non-number answer and no choices would show the keypad. Carry the mode on `Task` or assert it in `buildRound`.
  Trigger: S-13 (select/drag) or any generator with a string answer on a 'tiles' skill
- `src/core/round/hints.ts` `firstHint`: the ROUNDING exemption matches the skill id prefix `rounding_`; put the task type on `Task` instead.
  Trigger: a ROUNDING skill whose id does not start with `rounding_`
- `tests/e2e/task-round.spec.ts`: `counter` reads the registry value TaskScene writes; the drawn number (`StarCounter` `value`, unused today) is never asserted. Expose it through the hook and assert it, or delete `value`.
  Trigger: S-05 (round summary touches the counter)
- `src/scenes/TaskScene.ts` `snapshot`: `answer` is returned by reference; copy it before array answers (select) are drawn.
  Trigger: S-13
- `tests/hints.test.ts`: the `try/catch { continue }` around `draw` would hide a generator that always throws; count the skips.
  Trigger: next change to `tests/hints.test.ts`
- `pl.title` and bare animation/stroke numbers in widgets (`lineStyle(3/4)`, `shakeMs / 6`): left as is.
  Trigger: S-05 (Welcome/summary screens use the title)

## Visual findings from the orchestrator's browser look after phase 8 (judged in impl-review: V1 partly fixed, V2 and V4 fixed in 0c0baf4, V3 recorded above)

- V1: feedback-bar text and solution-step text look small for a grade-1 child (`FONT_SIZES.bar` 36, `solutionLine` 40).
  Trigger: impl-review of task-round-stars
- V2: the "Już wiem" and "Dalej" buttons hug the notebook's bottom border (`TASK_LAYOUT.bar.bottom` 972 vs notebook bottom 992).
  Trigger: impl-review of task-round-stars
- V3: the font draws a slashed zero on the keypad, answer tiles and star counter; Polish school writing uses a plain 0. Check the OpenType features of Atkinson Hyperlegible Next (a stylistic set or an alternate font file in the kit).
  Trigger: impl-review of task-round-stars, or S-16 (art pack)
- V4: the flying star briefly covers the answer tile it starts from.
  Trigger: impl-review of task-round-stars
