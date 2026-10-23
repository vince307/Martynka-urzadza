# Handoff — `fox-guide` (slice fix:fox-guide)

Written by the visual-gate step of run 2026-10-23-fox-guide: `VISUAL: PASS`, no fixes needed, rows 3.5 and 4.5 ticked; change.md stays `impl_reviewed`. The next agent must not tick 4.6/4.7 [human] or 4.8 [reviewer] — 4.8 is proved at ship by the PR's CI log.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phases 1-5 `e392442`, `2d99dcf`, `953ed88`, `4d590fd`, `d228146`, handoff and review commits up to `b84b2cf`, plus this commit `docs(fox-guide): bramka wizualna` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows open | 3 (`grep -c '^- \[ \]' plan.md`): 4.6, 4.7 [human]; 4.8 [reviewer] (CI at ship) |
| Working tree | clean after this commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/reviews/visual-review.md` | visual gate verdict per row, hand-check of `guide.rect` against `GUIDE`, designer's read; ends `VISUAL: PASS — …` |
| `context/changes/fox-guide/screenshots/*.jpg` | 32 frames per width (`desktop-*`, `tablet-*`) + `kit-fox-poses.jpg` |
| `context/changes/fox-guide/screenshots/README.md` | route, switches, table state · frame · how reached |
| `context/changes/fox-guide/plan.md` | rows 3.5 and 4.5 ticked with the evidence |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` |
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present (2 chunks checked)` (hook build, as intended) |
| throwaway Playwright capture (gitignored `tests/e2e/visual.local/`, moved out after) on 4399, projects desktop 1440×900 and tablet 1024×768 | 30 / 30 passed (7.0 min); its assertions: pose idle/cheer/think per state, `guide.visible` false on unlock and with `?e2eArt=ui`, `warmup` true |
| hand-check `guide.rect` | hook `{1714.5, 180, 188.125, 220}` = `GUIDE` arithmetic (s 0.3125: 1792 − 77.5; 1792 + 110.625; 400 − 220); page rect logged at both widths matches the canvas scale; magenta outline in `*-rect-check-zoom.jpg` touches ears, paws and tail |
| lint / typecheck / unit / build / e2e | not re-run: this step changed only docs and screenshots under `context/` (no source, test or config change); last observed by impl-review on `8bf3af3` (inherited, unverified here) |
| servers | 4399 stopped (`lsof -ti tcp:4399 -sTCP:LISTEN` empty); no background shells left |

## 4. Next command

`/10x-archive fox-guide` then ship (stop at open PR; no hosted db push — no DB)

## 5. Open

- [human] 4.6 accept the fox's place and size (`GUIDE` in `src/data/layout.ts`; fallback anchor x 1802, follow-up F5 in `follow-ups/review-fixes.md`). The gate notes row 3.5's "feet at the frame line" is met as "paw on the notebook's right frame line, feet at y 400", the P-2 reading.
- [human] 4.7 real tablet: sharpness at 384² art, the pop's feel, and the cheer on a 0-star summary (not reachable in the gate).
- [reviewer] (CI at ship) 4.8: workflow `CI`, job `check`; proof lines `Tests  <N> passed` and `e2e hook: absent (`.
- Observations F1-F4 in `reviews/impl-review.md`; follow-ups F1-F7 in `follow-ups/review-fixes.md`, unchanged.
- DESIGN-GAP 165-168 in `docs/design-gaps.md`, unchanged.

## 6. Autonomous decisions

- Capture route: Claude in Chrome first (own tab, closed); it stopped at the slow-save card because another tab of the same origin held IndexedDB, so the Playwright fallback with fresh contexts was used. Rejected: closing the other tab (not mine). Would change: a Chrome profile without another tab on `localhost:4399`.
- Portrait check by resizing the Playwright page to 420×760, not the same-origin iframe of profile § 9 (the iframe trick exists only because Chrome ignores resize). Would change: an overlay rule that differs inside an iframe.
- No fix: placement and size are the maintainer's 4.6 decision, not a discrepancy; nothing was covered. Would change: any frame showing an overlap or a wrong pose.
- Full local gate not re-run: only `context/` docs and JPEGs changed. Would change: any edit under `src/`, `tests/`, `scripts/` or config.
