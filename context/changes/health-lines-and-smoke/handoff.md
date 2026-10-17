# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 6 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-6 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts` (the builder returns line kinds, the renderer maps them), `registration.update()` runs once per launch only, an `xhrLoader.status` 0 is the `network` cause, never "not on the server", `vite/config.shared.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-5 with handoffs, phase 6 (`test(health-lines-and-smoke): ... (p6)`, sha in `git log`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 50 (53 minus rows 6.1-6.3, ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts` | `artHealthLines` now also builds `folder`, `skipped`, `labels`, `font`, `advice` lines; `restartHelps` (cut, network), `folderCounts`; input gained `font`, `labels`, `labelCap` |
| `src/ui/dom/artHealthView.ts` | maps the five new kinds to `pl`; a `font` line marks the section `missing` |
| `src/scenes/UIScene.ts` | passes `font` (REGISTRY_KEYS.fontHealth), `labels` (`missingRoomLabels` from `ROOM_ART`), `labelCap` |
| `src/data/pl.ts`, `src/data/balance.ts`, `docs/design-gaps.md` | `settings.artFolders/artSkipped/artNoRestart/artRestart/artLabels/fontFallback`, `balance.artHealth.labelCap` 3, gaps 142-146; the three "missing" texts lost their "Uruchom grę ponownie." |
| `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` | 8 + 3 new tests |

## 3. Verification

| command | result |
|---|---|
| first RED | `AssertionError: expected [] to deeply equal [ { kind: 'folder', …(2) }, …(1) ]` (6 of 8 new cases failed on the builder without the new lines) |
| break | `restartHelps` always true: `expected [ … ] to deep equally contain { kind: 'advice', restart: false }`; `labelCap` ignored: `expected [ { kind: 'labels', …(1) } ] to deep equally contain { kind: 'labels', …(1) }`; both restored, green. Meta: proves the builder rules; the rendering is the visual gate (6.5) |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3591 passed = 3580 + 11 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 132 passed (10.3m), 0 failed; `playwright --list` 132; no e2e text edited |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), none left after the run (`ps` grep empty) |

## 4. Next command

`/10x-implement health-lines-and-smoke phase 7`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4; [visual] 2.5, 5.5, 6.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Phase 7 adds a `fallbacks` input and one muted line to `artHealthLines`.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 6. Would change: nothing.
2. **Folder lines only for the task table**: salon and screen tables are one folder each, their table line is already the count, so `rooms`/`ui` folder names were not added. Would change: a reviewer wants them.
3. **Sixth string `artRestart`** ("Uruchom grę ponownie, gdy internet będzie lepszy.") because the "missing" lines lost their restart sentence and `network` still needs the advice; inside gap 144. The advice is left out when the cut line is the cause (it carries the advice). Would change: a teacher read prefers other words.
4. **`restartHelps` = cut, network** as planned, so `never` gets the "no restart" sentence. Would change: `never` proves common.
5. **Labels come from the caller** (`ROOM_ART` labels of missing keys), the builder only caps them. The existing `artMissing` tests keep passing (they check the start of the sentence).
6. **Mixed driver**: no inline scaffolding beyond the view/UIScene wiring and pl/gap rows, done after GREEN; driver stays `tdd`.
