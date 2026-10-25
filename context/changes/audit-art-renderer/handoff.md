# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the `/10x-e2e` phase 5 step of run 2026-10-25-audit-art-renderer: the Canvas e2e spec is committed (`374686e`); all automated phases are done, `change.md` is `implemented`. Rows 4.6-4.10 are human/visual/reviewer and are not mine to tick.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | p1 `a25aec2`, p2 `93e3452`, p3 `9ff2639`, p4 `8f2665e`, p5 `374686e`, plus handoff/docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 4.6-4.10, all [human]/[visual]/[reviewer] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/canvas-renderer.spec.ts` | new: `#12`, `#16`, `#14 canvas-renderer ...` under WebGL-off launch flags |
| `tests/e2e/salon-style.spec.ts` | `#12` gains the WebGL control `artFallbacks?.worn` undefined |
| `playwright.config.ts` | `canvas-renderer` added to `ROUND_SPEC` (webServer untouched) |
| `src/testing/e2eHook.ts` | welcome snapshot now carries `artFallbacks` (hook build only; the welcome backdrop records before any other screen exists) |
| `CLAUDE.md` | audit-art-renderer sentence names `tests/e2e/canvas-renderer.spec.ts` |
| `context/changes/audit-art-renderer/plan.md`, `change.md` | rows 2.5, 3.5, 4.5, 5.1-5.3 ticked with `374686e`; phase 4 row layout repaired (a sha had been glued to the next row) |

## 3. Verification

| command | result |
|---|---|
| canvas-renderer + salon-style specs | 7 passed |
| full e2e `--workers=3` | 157 passed, 10 load timeouts; `--last-failed --workers=1` 10 passed; total 167 = baseline 164 + 3; `--list` Total: 167 |
| lint / typecheck / unit / deploy scripts / sample E1-E6 / build | OK; unit 3948 passed (+0); `e2e hook: absent (2 chunks checked)` |
| validate-rule-files.sh | PASS (missing 0) |
| break A: delete both `recordFallback` calls in `applyWornGrade` | `#12` and `#16` red (`Expected "ungraded"`, Received undefined); restored |
| break B: `case 'worn'` returns `pl.settings.guideMissing` | `#14` red (sentence not visible); restored |
| break C: `console.info` in `BootScene.create` replaced by a no-op | `#12` red (renderer line count 0 vs 1); restored |
| break D: launch args removed | `#12` red (`renderer` "webgl" vs "canvas"); restored |
| break E: `applyWornGrade` records unconditionally | `salon-style` `#12` red (`worn` "ungraded"); restored |
| meta-check | each break removes the rule the spec protects (record, parent line, log, Canvas switch, WebGL control), not a copy or selector |

## 4. Next command

`/10x-impl-review audit-art-renderer`

## 5. Open

- Rows 4.6-4.10: human/visual/reviewer (parent sentence, pouf DESIGN-GAP 174, `drawRoomMiniature` boolean, hook-build visual pass, CI `check`).
- Follow-ups with triggers: `context/changes/audit-art-renderer/follow-ups/review-fixes.md`.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- D-1 Added `artFallbacks` to the welcome snapshot of `src/testing/e2eHook.ts` (hook build only): the spec's `#12` reads the record on the welcome, which the snapshot omitted. Rejected: waiting for the task screen (then it is not the welcome backdrop that records). Would change: if the hook gets a generic snapshot field list.
- D-2 Ticked 2.5/3.5/4.5 because the full gate and e2e 167 = 164 + 3 were observed here (no earlier phase added an e2e test).
- D-3 Full suite run at `--workers=3` with a serial re-run of the 10 load timeouts, as the step prompt said.
