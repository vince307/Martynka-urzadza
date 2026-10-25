# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the archive + ship step of run 2026-10-25-audit-art-renderer (final pre-merge state; the visual gate before it ended `VISUAL: PASS`). The change is archived and pushed; the PR stays open for the maintainer. Nobody ticks 4.6-4.8 ([human]); 4.10 (CI at ship) is ticked from the CI log after this handoff, in the commit `docs(audit-art-renderer): dowody z CI`.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | p1 `a25aec2`, p2 `93e3452`, p3 `9ff2639`, p4 `8f2665e`, p5 `374686e`, review fix `54ed721`, impl review `47da815`, plus this step's docs commit `docs(audit-art-renderer): bramka wizualna` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-25-audit-art-renderer/run-log.md (PR open, not merged, not deployed) |
| `change.md` status | `archived` (by `/10x-archive`, commit `chore(archive): close audit-art-renderer`) |
| `## Progress` rows remaining | 4 (`grep -c '^- \[ \]' plan.md`): 4.6-4.8 [human], 4.10 [reviewer] (CI at ship) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-art-renderer/reviews/visual-review.md` | visual review: states, hand-checked facts, decisions; ends with the `VISUAL: PASS` line |
| `context/changes/audit-art-renderer/screenshots/README.md` | capture route and frame table (state · desktop · tablet · how reached) |
| `context/changes/audit-art-renderer/screenshots/*.jpg` | 14 JPEG frames: `{desktop,tablet}-{canvas,webgl}-{settings-pictures,room-before,welcome-backdrop}` and `{desktop,tablet}-webgl-room-after-stage` |
| `context/changes/audit-art-renderer/plan.md` | row 4.9 ticked |
| `context/changes/audit-art-renderer/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | `e2e hook: present (2 chunks checked)` |
| `npm run preview -- --outDir dist-e2e --port 4399 --strictPort` | served for the capture, then killed (`lsof -ti tcp:4399 -sTCP:LISTEN` empty) |
| Playwright capture (scratchpad spec, 4 projects: desktop/tablet × webgl/canvas; Canvas flags `--disable-webgl --disable-webgl2 --disable-3d-apis`) | 14 passed, 2 skipped (the pouf state is WebGL only), no `pageerror` |
| hand-check Canvas line | `getByText(pl.settings.wornPlain, { exact: true })` count 1 (Canvas) and 0 (WebGL) at both widths |
| hand-check renderer | console `Renderer: Canvas (no filters: the worn salon look is off)` x1 (Canvas) and `Renderer: WebGL` x1 (WebGL); hook `backdrop.renderer` agrees; `artFallbacks.worn` is `'ungraded'` only under Canvas |
| hand-check room / backdrop | `worn.graded` false/true; backdrop `graded` 0/10, `blurred` false/true |
| hand-check pouf frame | stars 40 − 5 (stage `renovate` cost) = 35 shown; `contactShadows` lamp-table, plant-left, pouf, plant-right |
| control run with service workers allowed (desktop WebGL settings) | "Gra jest gotowa do działania bez internetu.": the `Kod: TypeError` line in the frames comes from the capture's SW block |
| unit / e2e / lint | not re-run: no source change in this step (last observed in the impl-review step, §3 of the previous handoff) |

## 4. Next command

none — PR open, waits for the maintainer's "zmerguj"

## 5. Open

- [human] 4.6 accept the `pl.settings.wornPlain` wording (DESIGN-GAP 173). 4.7 decide on the pouf under "Wróć do notesu" (DESIGN-GAP 174, seen again in `*-webgl-room-after-stage.jpg`). 4.8 accept that `drawRoomMiniature` still drops the boolean.
- [reviewer] (CI at ship) 4.10: workflow `CI`, job `check`. The log should show `Tests +[0-9]+ passed … | 3 skipped`, `e2e hook: absent (` and `recolourBoard: skipped: …`.
- Follow-ups with triggers: `context/archive/2026-10-25-audit-art-renderer/follow-ups/review-fixes.md` (8 entries, unchanged; restated here after the move).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- V-1 Playwright fallback for every state. Rejected: Claude in Chrome, because it cannot launch with WebGL off, and splitting the WebGL half onto it would mix two capture routes inside each pair. Why: the plan row names this fallback. Would change: a WebGL-only gate.
- V-2 Service workers blocked in the capture, as in the salon-style gate (fresh, uncached pages). The "Gra bez internetu … Kod: TypeError" line it causes was checked against a control run with SW allowed and is recorded as a capture artifact, not a defect. Would change: a gate about the offline section.
- V-3 No pixel measurement of the WebGL grade: this change does not touch `gradeMatrix`, and the salon-style gate measured it. The hook flags plus the frames are the evidence. Would change: a change to the grade or its filter path.
- V-4 The pouf state is captured under WebGL only, as row 4.9 names it.
- V-5 Unit, e2e and lint gate not re-run: this step changed only docs and screenshots. Would change: any fix commit (none was needed).
- A-1 Archived despite 4 open Progress rows (0 automated, 4 manual: 4.6-4.8 [human] are the post-run checklist for the maintainer, 4.10 is ticked from the CI log at ship) and one row without a SHA (4.9, a docs-only visual gate). Chosen: `Continue archiving` (the skill's Recommended label for manual-only pending). Rejected: resume implementation (nothing automated is open). Would change: an open automated row.
- A-2 Roadmap untouched: a non-roadmap fix change, `context/foundation/roadmap.md` has no item with Change ID `audit-art-renderer` (checked).

