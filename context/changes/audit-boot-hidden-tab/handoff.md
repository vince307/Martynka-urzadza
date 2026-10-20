# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Written by the visual-gate step: rows 3.5, 5.4 and 6.5 were captured at 1440 and 1024 and verified, `VISUAL: PASS`. One focus defect (VG-1) was fixed in 9f1988d, and the full local gate is green after it. Next comes archive, then ship. At archive, rewrite the CLAUDE.md path to `follow-ups/review-fixes.md` (follow-up F5).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1–10 (p1 e6a0b43 … p10 c5b4db4), review fix 5295e8a, visual fix 9f1988d, plus docs commits (this one: `docs(audit-boot-hidden-tab): bramka wizualna`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 1: [human] 2.6 |
| Working tree | clean after the docs commit (the throwaway spec folder `tests/e2e/visual.local/` was moved out of the repo before the lint gate; `test-results/` is gitignored and was not committed) |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/dom/dialog.ts` | `openDialog` `close`: hands the focus to a card (`[role="alertdialog"]`) still on screen unless the opener is alive inside it (VG-1), 9f1988d |
| `tests/e2e/save-transfer-blocked.spec.ts` | `#2 Z-8`: taps "Zamknij" and expects the refusal card's "Zacznij od nowa" focused, 9f1988d |
| `context/changes/audit-boot-hidden-tab/reviews/visual-review.md` | the visual review, ends with `VISUAL: PASS — …` |
| `context/changes/audit-boot-hidden-tab/screenshots/` | 20 PNG (10 states × desktop 1440×900 / tablet 1024×768) + `README.md` (route, kit reference, frame table) |
| `context/changes/audit-boot-hidden-tab/plan.md` | rows 3.5, 5.4 and 6.5 ([visual]) ticked |
| `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` | F3 refusal-card focus closed; new entry: the "Obrazki" `Kod:` line is not muted (it predates this change); 16 `Trigger:` lines |

## 3. Verification

| command | result |
|---|---|
| visual capture (throwaway Playwright spec, hook build on 4399, 2 projects) | 12/12 passed; the states and focus values are recorded in `reviews/visual-review.md` |
| break: `dialog.ts` reverted to `previous?.focus()`, `-g "Z-8"` | RED: "Expected: focused, Received: inactive" on the card's restart button. Fix restored. Meta-check: the break removes exactly the hand-over, and the assertion reads the real `document.activeElement` |
| `npm run lint`, `npm run typecheck` (with the fix) | OK / OK |
| `npm test` + deploy scripts + `sample` E1–E6 | 3710 passed (baseline 3683, +27; the fix adds no unit test); all OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` (abs config, sandbox off) | 143 passed = 143 listed (baseline 141, +2), 12.4 min |
| hand-checked value | visible load time = `elapsedMs` − `hiddenMs` = 6792 − 3736 = 3056 ≥ 3000 (desktop), and 6687 − 3642 = 3045 (tablet) |

## 4. Next command

`/10x-archive audit-boot-hidden-tab then ship (no hosted db push — none exists)`

## 5. Open

- [human] 2.6: on a real tablet (iPad Safari or Android Chrome, production build), start on a slow link, switch to another app for over a minute during the loading screen, then come back. Loading continues, there are no stand-in pictures, and the "Obrazki" section shows no cut line.
- Follow-ups with triggers are in `follow-ups/review-fixes.md`:
  - F1, the `bootLimitReached` fold;
  - F5, the CLAUDE.md path to rewrite at `/10x-archive`, then run `validate-rule-files.sh`;
  - new: the `code` line of `createArtHealthView` is not muted.
- No new DESIGN-GAP rows. Rows 29, 51, 67, 117 and 153 cover these views.

## 6. Autonomous decisions

- D-16 **Playwright, not Claude in Chrome**:
  - Why: the settings panel opens only after a 2 s hold on the canvas gear (profile § 8: the extension cannot drive it). The hidden-tab state needs an init script before the page runs. The frames must be files.
  - Rejected: Chrome for the "Ups!" card alone. It would split the route and give no saved frames.
  - Would change: an extension that can drive canvas holds and save screenshots.
- D-17 **VG-1 fixed, not left as a follow-up**:
  - Why: D-13 named "focus lost after Zamknij" as the condition that changes the answer, and the gate saw exactly that (`<body>`).
  - The fix is 4 lines in `openDialog`, with a red-first e2e assertion.
  - Would change: a fix that needed changes outside `dialog.ts`.
- D-18 **The dialog sitting over the card is accepted**:
  - While the dialog is open, the card's button is covered. "Zamknij" is the dialog's one button and focus is in the dialog, so nothing is trapped.
  - Would change: a dialog step with no close button over the card.
- D-19 **The "Obrazki" `Kod:` style is left as a follow-up**: it predates this change (health-lines-and-smoke), and fixing it would need another full e2e run. Would change: a parent report, or the next edit of `artHealthView.ts`.
- Earlier steps: D-1..D-15 are in the git history of this file (46bbd42, fa37a67).
