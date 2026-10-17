# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-implement` phase 7 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-7 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, the fallback record is runtime only (`REGISTRY_KEYS.artFallbacks`, not in `SAVE_KEYS`), `vite/config.shared.mjs` stays unchanged, phase 8 is `Driver: tdd`.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-6 with handoffs, phase 7 (`feat(health-lines-and-smoke): The screen fallback ... (p7)`, sha in `git log`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (rows 7.1-7.3 ticked, 7.4 [reviewer] and 7.5 [visual] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artPick.ts` | `FallbackWhere`, `FALLBACK_ORDER`, `FallbackRecord`, pure `noteFallback` (first mode noted for a screen stays, idempotent) |
| `src/ui/artFallbacks.ts` | `recordFallback(scene, where, mode)`: the one registry writer |
| `src/ui/widgets/{CoinWallet,UnlockCard,RoomDoneCard}.ts`, `src/scenes/BootScene.ts` | call `recordFallback` only when a fallback is chosen (wallet drawn, notebook icon/box, miniature thumbnail/drawn, loading pictures missing) |
| `src/data/layout.ts` | `REGISTRY_KEYS.artFallbacks` (runtime only) |
| `src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`, `src/scenes/UIScene.ts` | `fallbacks` input, one `fallback` line kind, rendering, wiring |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.artFallback`, `settings.artFallbackNames`; gap row 147 |
| `src/testing/e2eHook.ts` | seam `?e2eArt=ui` (`UI_MISSING_URL`, wallet/notebook/thumbnail get a 404 URL), hook exposes `artFallbacks`; marker `e2eArt` unchanged |
| `tests/{artPick,artHealthLines,uiArt,e2eSave}.test.ts` | 3 + 2 + 1 new cases, seam value list widened |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3597 passed = 3591 + 6; deploy scripts OK; samples exit 0 |
| first RED | not observed: the code was written before the tests (driver `impl`); reds come from the breaks below |
| break 1 | `noteFallback` without the keep-first guard: `expected { miniature: 'drawn' } to be { miniature: 'thumbnail' }`; restored (`git checkout` of the staged file), green |
| break 2 | extra file `public/assets/ui/orphan.webp`: `expected [ 'orphan.webp' ] to deeply equal []`; removed, green |
| meta-check | proves the record rule and the folder rule; the widgets' calls and the rendered line are proven by the phase 14 e2e and the visual gate (7.5) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.7m), 0 failed; `playwright --list` 132; no e2e text edited |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled): empty |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 8`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4; [visual] 2.5, 5.5, 6.5, 7.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- DESIGN-GAP 147 added (`artFallback` line and screen names, to be read by a teacher).
- No e2e spec reads `artFallbacks` yet; the plan puts the wiring proof in phase 14.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 7. Would change: nothing.
2. **First mode wins in `noteFallback`** (so the record says what the child saw first). Rejected: last wins. Would change: a reviewer wants the worst mode shown.
3. **The loading fallback is recorded in `BootScene.create`** (after loading, when either loading picture texture is missing), not inside `LoadingScreen`, because the widget has no end-of-load moment; it uses the same helper. Would change: reviewer wants it in the widget.
4. **`?e2eArt=ui` uses a nonexistent file URL** (`UI_MISSING_URL`, a 404) so the real loader-error path and causes are exercised. Would change: a spec needs a decode failure.
5. **Wording**: "Zamiast obrazka gra rysuje: <list>." with the four names from the plan. Would change: teacher read.
