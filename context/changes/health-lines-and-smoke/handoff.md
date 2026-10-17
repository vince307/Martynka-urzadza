# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 5 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-5 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts` (the builder returns line kinds, the renderer maps them), `registration.update()` runs once per launch only, an `xhrLoader.status` 0 is the `network` cause, never "not on the server", `vite/config.shared.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-4 with handoffs, phase 5 (`test(health-lines-and-smoke): ... (p5)` f7cd01b) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 53 (56 minus rows 5.1-5.3, ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts` | `ArtHealthLine`, `ArtHealthLinesInput`, `artHealthLines` (table lines for every known record, cut line, main cause by count with ties in `fetch, network, decode, cut, never` order, `code` line; the cause line is left out when the cut is the cause) |
| `src/ui/dom/artHealthView.ts` | `createArtHealthView(lines)` maps each line to `pl`, no style of its own; classes `parent-room-art`, `parent-ui-art` and `data-state` kept |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | option `artLines` replaces `artHealth/roomArtHealth/uiArtHealth`; `openSettings` builds it from the three records, `bootLoad.cut.length` and `__BUILD_ID__`; section shown when any line exists |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.artCut`, `settings.artCause` (gaps 140-141; notes on 67 and 119) |
| `tests/artHealthLines.test.ts` | 7 tests |

## 3. Verification

| command | result |
|---|---|
| first RED | `AssertionError: expected [] to deeply equal [ { kind: 'ok', …(3) }, …(2) ]` (stub returning `[]`; 6 of 7 failed) |
| break | `if (!task) return []` in `artHealthLines`: F4 case red (`expected [] to deeply equal [ { kind: 'missing', …(3) } ]`); restored, green. Meta: proves the builder; the rendering is the visual gate (5.5) and phases 12-14 |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3580 passed = 3573 + 7; `sectionState` tests unchanged and green |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.5m), 0 failed; `playwright --list` 132; existing wording of the three lines unchanged, so no e2e text edited |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled) found none |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 6`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4; [visual] 2.5, 5.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Phase 6 extends this builder (folders, skipped sentence, labels, font, restart advice); the old `artMissing` text still ends "Uruchom grę ponownie." until then.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 5. Would change: nothing.
2. **Builder input** is the three `ArtHealth` records (causes live in them) plus `cut` as a count, not the plan's views; `ok` lines carry `count: 0`. Would change: phase 6 needs views instead.
3. **Cause line omitted when cause is `cut` and the cut line shows**, to avoid the same sentence twice; `pl.settings.artCause.cut` still holds the text for an inconsistent record. The `code` line is kept.
4. **Tie of causes** goes to the earlier in `fetch, network, decode, cut, never`.
5. **Mixed driver**: no inline scaffolding beyond the renderer/panel/UIScene wiring and pl/gap rows, done after GREEN; driver stays `tdd`.
