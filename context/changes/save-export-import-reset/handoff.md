# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-e2e phase 7` step of run `2026-10-13-s12-s14`. All phases (1-7) are committed and `change.md` is `implemented`; the e2e spec is green with every planned break observed. The next agent (impl-review) must not get wrong: break p7c stayed GREEN in the browser (see §3), the proof of "writes off after replace" lives only in the phase 1 unit tests.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phases 1-6 `2e435cf`, `5debed5`, `df18f2f`, `2042dc8`, `8c5bb41`, `cc58e16`; phase 7 `c85022f` (+ this handoff commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` = 15, all `[reviewer]`/`[visual]`/`[human]` rows |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/save-transfer.spec.ts` | 4 tests (chromium-hook): `#7` rejected files leave the save, `#7 #2` valid file replaces only after the summary and survives the reload, `#2 #10` export round-trips to another device (new context), `#2` reset asks first and ends on the welcome screen |
| `playwright.config.ts` | `save-transfer` added to `ROUND_SPEC` (app webServer entries untouched) |
| `context/changes/save-export-import-reset/e2e-break-p7{a..e}.patch` | the five deliberate breaks, production code only (`git apply`) |
| `plan.md`, `change.md` | Progress ticks with shas, status `implemented` |

## 3. Verification

| Command | Result |
|---|---|
| `npx playwright test save-transfer` (observed) | 4 passed |
| full `npx playwright test` (observed, outside the sandbox) | 37 passed (branch e2e baseline 33 + 4) |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; nothing listening on 4397/4398 afterwards |
| eslint on the spec, `tsc --noEmit` | clean. Unit/sample not re-run in this step (only the spec and `ROUND_SPEC` changed after phase 6) |
| Break p7a (`parseImport` returns ok for a numeric `version` without `decodeSave`) | RED: test (a) on `rejected.corrupt` text; (b), (c), (d) green; restored |
| Break p7b (`openImport` `apply` returns ok without `saver.replace`) | RED: (b) and (c) on `stars` 7 expected, 0 received after the reload; (a), (d) green; restored. Meta-check: proves the seam from "Wczytaj" to the saver, not `replace` itself (unit) |
| Break p7c (`replaced = false` after a successful `replace`, writes stay on) | GREEN, all 4 pass. Row 7.4 allows this ("zapis w handoff §3"): after an import/reset the page reloads at once, and nothing is dirty at `pagehide`, so a late overwrite cannot be provoked from the browser without a seam; the rule "writes off after replace" stays proven by the phase 1 unit tests |
| Break p7d (reset dialog does not call `reload()`) | RED: (d) `screenIs(welcome)` expected welcome, received task (first version waited on the `load` event and failed by timeout only; the spec now asserts the screen); restored |
| Break p7e (import calls `apply` straight after `parseImport` ok) | RED: (b) on the "Teraz" heading, (c) on the "7 gwiazdek" summary; restored |
| Meta-check on (a) | the envelope is the game's own with `stars: -1`, so only strict validation (not JSON shape, not the `app` tag) can reject it |

## 4. Next command

`/10x-impl-review save-export-import-reset`

## 5. Open

- Rows 6.5, 6.6 `[reviewer]`, 6.7 `[visual]`, 6.8-6.10 `[human]` and the earlier `[reviewer]`/`[visual]`/`[human]` rows are not ticked (not mine).
- Possible gap for the reviewer: p7c is not provable in the browser (see §3); if wanted, a hook-only seam that dirties the state before the replace would make it visible (not built).
- Follow-ups: `follow-ups/review-fixes.md`. DESIGN-GAP rows 46-51 in `docs/design-gaps.md`.
- Environment note: in this session `npx playwright test` launches Chromium only as a plain command (a pipe or `cd &&` made it run sandboxed and fail with `MachPortRendezvousServer ... Permission denied`); cwd was not the repo, so `--config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` was passed.

## 6. Autonomous decisions

- Chromium launched, so no request file was written; the spec was committed after the breaks (contract rule).
- The round is followed by "Kolejna runda" before the panel is opened, because the HUD gear is read on the task screen. Would change if the hook ever exposes the gear on the summary.
- Reset test asserts `screenIs('welcome')` and `learner === null` instead of waiting for the `load` event, so a missing reload fails on an assertion, not a timeout.
- The import file is a bare v1 value built in the spec (stage E4, `pendingUnlock: null`, empty mastery); the frozen fixture is not used because `repairCurrentRoom` and the unlock card would change the course. Would change if the fixture is made playable.
- p7c row ticked with the green result recorded, per the row's own alternative.
