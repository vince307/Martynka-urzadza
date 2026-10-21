# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by the visual gate of run 2026-10-21-post-run-polish: `VISUAL: PASS`, rows 3.5 and 6.5 ticked, no fix commit. The next step archives the change and ships; row 2.6 [human] stays open and the save format stays v4.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + p1 `11f0c69`, p2 `3be7518`, p3 `8a0f76d`, p4 `ccf03af`, p5 `bb295b4`, p6 `91a1be1`, p7 `7004a50`, p8 `d7685b4`, p9 `7b5bd55`, handoff `de5a308`, impl-review `f6c3fb4` + this visual-gate commit (`docs(post-run-polish): bramka wizualna`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; the archive step stamps it) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): 2.6 [human] |
| Working tree | clean after this commit (`tests/e2e/visual.local/` moved out of the repo, no `test-results/`) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/reviews/visual-review.md` | visual gate verdict per state, hand-checked counts, focus, ends `VISUAL: PASS — …` |
| `context/changes/post-run-polish/screenshots/README.md` | route, kit reference, frame table (state · desktop · tablet · how reached) |
| `context/changes/post-run-polish/screenshots/{desktop,tablet}-heading-{sign,sign-expr,sign-op,fill,calculate,word}.png` | task-screen headings, 12 frames |
| `context/changes/post-run-polish/screenshots/{desktop,tablet}-art-cut.png` | settings "Obrazki" after a cut start, 2 frames |
| `context/changes/post-run-polish/plan.md` | rows 3.5 and 6.5 ticked |
| `context/changes/post-run-polish/follow-ups/review-fixes.md` | new follow-up: a number left at the end of a wrapped word prompt |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present (2 chunks checked)` (hook build, as intended) |
| throwaway Playwright spec (`tests/e2e/visual.local/`, own config, 4399, desktop 1440×900 + tablet 1024×768) | 10 + 4 passed; 14 frames written |
| hook `heading` per frame | sign ×3 "Wstaw znak", fill "Uzupełnij", calculate "Oblicz", word `null`, both widths |
| hook `bootLoad.cutByTable` after `?e2eArt=stallall` | task 15 + room 38 + ui 3 = 56 pictures (sound 12, font 1; `cut.length` 69); panel lines 15/41, 38/38, 3/5 match |
| `getByText('w tle')` in the settings panel | 0 at both widths |
| initial focus in the settings panel | stage button "Klasa 1, I półrocze" (applied only by "Zatwierdź"), not destructive |
| local gate (lint, typecheck, unit, build, e2e) | not re-run: no product or test code changed in this step (docs and PNG only); the impl-review step's gate and the orchestrator's full e2e 144 on `de5a308` stand |
| port 4399 after the run | not listening (server stopped) |

## 4. Next command

`/10x-archive post-run-polish then ship (no hosted db push — none exists)`

## 5. Open

- [human] 2.6: tablet with a Polish voice, speaker on a comparison task, "Wstaw znak" pronounced clearly (`narrationOf` in `src/core/narration/spoken.ts`).
- Follow-up (new): number at the end of a wrapped word prompt, "Tomkowi 1 / klocek" (`wrapBlankLines`, `TaskScene.drawPrompt`), in `follow-ups/review-fixes.md`.
- Observations O1–O5 in `reviews/impl-review.md` (accepted; O1 and O3 have follow-ups).
- DESIGN-GAP 153 and 154 in `docs/design-gaps.md` (no new gap from this step).
- Not captured: the fill skill `E2.4.fact_swap_20` (the E1 MISSING frame covers "Uzupełnij"; rule in `tests/heading.test.ts`).

## 6. Autonomous decisions

- V-1 Playwright instead of Claude in Chrome: the settings panel needs the 2 s gear hold the extension cannot drive (profile § 8) and the frames must land as files in the change folder; one tool for all states keeps them comparable. Would change: a Chrome path that can hold on the canvas and save frames.
- V-2 Extra sign frames (COMPARE_EXPR, MISSING_OP) beyond the plan's single comparison task, because the step prompt named them and the expression prompt is the widest. Would change: nothing; additive.
- V-3 Kit frames referenced by path, not copied, as in the 2026-10-20 worked example. Would change: a gate rule requiring `kit-*` copies.
- V-4 The "Tomkowi 1 / klocek" wrap recorded as a follow-up, not fixed: it predates this slice and touches the shared prompt wrap. Would change: the maintainer calling it in scope.
- V-5 Local gate not re-run: no source, test or config change in this step. Would change: any fix commit.
