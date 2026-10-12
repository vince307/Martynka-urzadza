# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-implement task-round-stars phase 9` of autonomous run 2026-10-12-s04-s08. Phases 1-9 are committed (p9 `cbf1722`); phases 10-11 are untouched. Phase 9 added the e2e hook, its production guard and the second Playwright server. Do not touch the app `webServer` entry in `playwright.config.ts`; the seed stays on the production bundle.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1..p9 (p9 `cbf1722`) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `vite/e2eHookGuard.mjs` (+ `.d.mts`) | `checkE2EHook(chunks, expectHook)` pure check and plugin `e2eHookGuard()` (`generateBundle`), wired in `vite/config.prod.mjs`; prints `e2e hook: absent\|present (N chunks checked)` |
| `src/testing/e2eHook.ts` | `installE2EHook(game)`: defines non-enumerable, frozen `window.__martynkaE2E` with getters `snapshot` and `targets`; no module-level code |
| `src/main.ts`, `vite/config.shared.mjs`, `src/vite-env.d.ts` | `if (__E2E_HOOK__) installE2EHook(game)`; `define.__E2E_HOOK__ = E2E_HOOK === '1'` |
| `src/scenes/TaskScene.ts` | public read-only `snapshot()` (index, phase, input, answer, choices, outcomes, starsEarned, bonusEarned, starsTotal, counter = registry stars, finished) and `targets()` (tiles, keys, next, step; centres in 1920x1080) |
| `playwright.config.ts` | `webServer` is now an array: app entry unchanged first, second entry builds `dist-e2e` with `E2E_HOOK=1` and previews on 4397 (`E2E_HOOK_PORT`), `reuseExistingServer: false`; projects `chromium` (`testIgnore` round spec) and `chromium-hook` (`baseURL` 4397, `testMatch` `task-round.spec.ts`) |
| `.gitignore`, `eslint.config.mjs` | `dist-e2e`; ESLint ignores `dist-e2e/**` and gives `src/testing/**` browser globals |
| `tests/e2eHookGuard.test.ts` | 4 tests for the check and the plugin |
| `plan.md` | Progress rows 9.1-9.7 ticked with cbf1722 |

## 3. Verification

| Command | Result |
|---|---|
| Unit | Tests 588 passed (branch baseline 584, +4: `tests/e2eHookGuard.test.ts`) |
| `npm run build` | prints `e2e hook: absent (2 chunks checked)`; `grep -rl __martynkaE2E dist/` empty |
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | prints `e2e hook: present (2 chunks checked)`; marker found in `dist-e2e/_app/index-sxcjlFrU.js` |
| Break 1 (`__E2E_HOOK__` hard `true`) | `npm run build` failed: `[martynka-e2e-hook-guard] [plugin martynka-e2e-hook-guard] e2e hook leaked into the production bundle (__martynkaE2E in _app/index-sxcjlFrU.js)`. Restored |
| Break 2 (module-level `window.__martynkaE2E = …` in `e2eHook.ts`, import left conditional) | `npm run build` failed: `… e2e hook leaked into the production bundle (__martynkaE2E in _app/index-BvdqzMDz.js)`. Meta-check: the flag was still false and the build still failed, so it is the import side effect (module no longer tree-shakeable) that leaks, which only the bundle check catches. Restored |
| `npm run lint` / `typecheck` | OK / OK |
| deploy + ops tests, `sample` E1-E6 | OK; `Naruszenia: 0` each |
| `npx playwright test` | 1 passed (baseline 1, +0): seed on 4398 (production bundle, `chromium` project); both webServer entries started; `lsof -ti :4397` and `:4398` empty afterwards; run with `dangerouslyDisableSandbox` |
| Hook at runtime | NOT exercised in a browser yet (no spec until phase 11); the `chromium-hook` project has no test now, so only its server runs |

## 4. Next command

`/10x-implement task-round-stars phase 10`

## 5. Open

- Manual row 9.8 `[reviewer]` (CI at ship) NOT ticked; also carried 1.5, 2.5, 5.5 `[reviewer]`, 5.6, 6.4, 7.4, 8.4 `[visual]`, 7.5 `[reviewer]`, 8.5 `[human]`, human rows 10.5-10.8.
- Every `npx playwright test` now does two builds (about +7 s); a busy 4397 fails loudly, use `E2E_HOOK_PORT`.
- Phase 10 records port 4397 in profile § 2/§ 3 and `autonomous-run.env` (comments only), as the plan says.
- `pl.round.stars` still unused by scenes (carried from phase 8, for the seam sweep).

## 6. Autonomous decisions

1. **Hook is a getter pair (`snapshot`, `targets`) on a frozen, non-enumerable `window.__martynkaE2E`**, backed by public read-only `TaskScene` methods; the counter assertion reads the registry value the overlay renders (`counter`), not `StarCounter.value()`, because the overlay is another scene. Would change: phase 11 needing the drawn text itself (then expose it through `UIScene`).
2. **`snapshot()` includes `answer` and `choices`** so a spec can tap the right or a wrong tile without reading prompt text. Read-only, e2e build only is the only place it is reachable.
3. **`snapshot()`/`targets()` stay in the production `TaskScene`** (tiny, read-only); only the marker-bearing module and its call are stripped.
4. Type declaration `vite/e2eHookGuard.d.mts` added so the pure check is typed in tests.
5. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 9.
