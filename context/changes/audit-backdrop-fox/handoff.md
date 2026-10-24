# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the visual-gate step of run 2026-10-24-audit-backdrop-fox: row 4.9 captured and judged, `VISUAL: PASS`, no fixes needed. The next agent must not tick 4.7/4.8 (the maintainer's) or 4.10 (CI at ship).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | 80432e8..HEAD (20 commits incl. this `docs(audit-backdrop-fox): bramka wizualna`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | impl_reviewed (unchanged; `/10x-archive` stamps it) |
| `## Progress` rows open | 3 (`grep -c '^- \[ \]' plan.md`): 4.7 [human], 4.8 [human], 4.10 [reviewer] (CI at ship) |
| Working tree | clean after this commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-backdrop-fox/reviews/visual-review.md` | visual gate report, hand-checks, ends `VISUAL: PASS — …` |
| `context/changes/audit-backdrop-fox/screenshots/README.md` | route, setup and frame table (state · desktop · tablet · how reached) |
| `context/changes/audit-backdrop-fox/screenshots/{desktop,tablet}-*.jpg` | 24 frames: welcome/task/room-trip before and after lose + restore, "Obrazki" with fox-think and with wallet-open aborted, task without the fox at idle/miss/right |
| `context/changes/audit-backdrop-fox/plan.md` | row 4.9 ticked with the review as evidence |
| `context/changes/audit-backdrop-fox/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present (2 chunks checked)` (hook build, as intended) |
| throwaway Playwright capture spec (scratchpad, 2 projects 1440×900 / 1024×768, fresh context per test, port 4399) | 12/12 passed in 3.2 min |
| backdrop crop diff before vs after restore (6 pairs) | mean abs 0, max 0; crop mean (224,212,175) ≠ page `#FFF5DF` (255,245,223) |
| hook `backdropPixel` before/after | [156,153,113,255] in every pair; `redraws` 0 → 1, `captures` 1 → 2, `drawn/blurred true`, `renderer webgl` |
| "Obrazki" DOM text, fox case | contains `pl.settings.guideMissing` exactly, count line `uiArtMissing(1, 8, false)`, no "napis lub rysunek", no `artFallback` line; `artFallbacks { guide: 'none' }` |
| "Obrazki" DOM text, wallet case | count line keeps "napis lub rysunek", no fox sentence |
| hook `guide` with fox-think aborted | `visible false`, `pose null`, `requested` idle → think → cheer |
| local gate (lint, typecheck, unit, build, e2e) | not re-run: no source change in this step (inherited from the impl-review handoff: unit 3915 = 3891 + 24, e2e 160/160 serial) |
| deliberate break | none in this step (no code changed; the pixel break of p5 is in the impl-review handoff) |
| servers | the 4399 preview stopped; no other port used |

## 4. Next command

`/10x-archive audit-backdrop-fox` then ship (stop at open PR; no hosted db push — no DB)

## 5. Open

- [human] row 4.7: accept `pl.settings.guideMissing` wording ("…się nie pokazuje…"; "nie pokazuje się" is the reviewer's alternative) and the count line without "napis lub rysunek" for a fox-only miss (decision P-5).
- [human] row 4.8: accept the G-2 proof form (`page.route` abort, not a new `e2eArt` value; decision P-4).
- [reviewer] row 4.10 (CI at ship): job `check` of workflow `CI`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Follow-ups F1-F6 in `follow-ups/review-fixes.md` (unchanged by this step).
- Observed, not this slice: the "Wróć" age-back button overlaps the notebook's bottom-left frame before the first round ends (`TaskScene.backToAge`, playtest F-01..F-03 layout).

## 6. Autonomous decisions

- **VG-1 Playwright directly, no Claude in Chrome** (fixed by the step prompt): a Chrome tab got stuck on the slow-save card last run and the context loss needs `page.evaluate`. Would change: a clean Chrome profile on the origin.
- **VG-2 Before/after judged by a backdrop-only crop diff plus the eye** instead of a kit frame (the kit has none for these states). Would change: a kit frame for error or missing-art states.
- **VG-3 No fixes**: no frame showed a discrepancy. Would change: the maintainer rejecting the wording in row 4.7 (a `pl.ts` edit, then a re-capture of `settings-fox-missing`).
