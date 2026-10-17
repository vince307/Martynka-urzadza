# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 3 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-3 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, `registration.update()` runs once per launch only (no visibility or timer trigger), an `xhrLoader.status` 0 is the `network` cause, never "not on the server", `vite/config.shared.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phase 1, handoff p1, phase 2 (bb650cc), handoff p2, phase 3 (`feat(health-lines-and-smoke): ... (p3)` a7be75b) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 60 (63 minus rows 3.1-3.3, ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts` | `ArtTable`, `ArtCause`, `LoadSeen`, `tableOf`, `loadErrorLine`, `artCauses` (cut > failed > loaded > never), `wrongSizes`; `ArtHealth` gains optional `causes`, `wrongSize` |
| `src/scenes/BootScene.ts` | `FILE_LOAD`/`loaderror` listeners record loaded keys and failed status; `loaderror` prints `loadErrorLine` (font keeps its own line); `withCauses` adds causes and size check per table, one warn each; no player text |
| `tests/artHealth.test.ts`, `tests/phaserLoaderPin.test.ts` | 5 new rule tests; pin case for `nextFile` FILE_LOAD / FILE_LOAD_ERROR and `ImageFile.onProcess` onProcessError |

## 3. Verification

| command | result |
|---|---|
| first RED (stubs returning ''/{}/[]) | `AssertionError: expected '' to be 'Task file failed to load: tasks/money…'`; `expected {} to deeply equal { 'decoded-bad': 'decode', …(5) }`; `expected [] to deeply equal [ 'b' ]` (5 failed, 8 passed) |
| `npx vitest run tests/artHealth.test.ts` | 13 passed |
| break: `artCauses` checks `failed` before `cut` | 1 failed (`expected { 'decoded-bad': 'decode', …(5) } to deeply equal …`); restored, 13 passed. Meta: proves the classifier over recorded events; the browser decode path is phase 13 (`?e2eArt=corrupt`) |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3562 passed = 3556 + 6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.6m), 0 failed; `playwright --list` 132 |
| stray processes | `ps` grep (sandbox disabled) printed nothing |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 4`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4; [visual] 2.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- The phase 2 note about 125 e2e tests is moot: this run executed 132.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 3, message as proposed. Would change: nothing.
2. **Cut wins over failed** in `artCauses`: a file the cut ended (a flying file errors with status 0 on the cut) is a `cut`, not `network`. Would change: a review wanting the first event to win.
3. **`causes` and `wrongSize` are optional** on `ArtHealth` so no other record builder changes; `BootScene.withCauses` adds them. No new pl.ts string, so no DESIGN-GAP row.
4. **Source of status**: `file.xhrLoader?.status ?? 0` in the `loaderror` listener; no `tableOf` match means the font line.
