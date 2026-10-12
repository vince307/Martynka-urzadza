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

## Visual findings from the orchestrator's browser look after phase 8 (for impl-review to judge)

- V1: feedback-bar text and solution-step text look small for a grade-1 child (`FONT_SIZES.bar` 36, `solutionLine` 40).
  Trigger: impl-review of task-round-stars
- V2: the "Już wiem" and "Dalej" buttons hug the notebook's bottom border (`TASK_LAYOUT.bar.bottom` 972 vs notebook bottom 992).
  Trigger: impl-review of task-round-stars
- V3: the font draws a slashed zero on the keypad, answer tiles and star counter; Polish school writing uses a plain 0. Check the OpenType features of Atkinson Hyperlegible Next (a stylistic set or an alternate font file in the kit).
  Trigger: impl-review of task-round-stars, or S-16 (art pack)
- V4: the flying star briefly covers the answer tile it starts from.
  Trigger: impl-review of task-round-stars
