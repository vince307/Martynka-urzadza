# Board recolour guard, Canvas renderer named in "Obrazki", pouf under the return button — Plan Brief

> Full plan: `context/changes/audit-art-renderer/plan.md`
> Research: `context/changes/audit-art-renderer/research.md`

## What & Why

One small fix PR for the closing observability audit of run 2026-10-24-salon-style (PR #107: M-1, L-1) plus a visual-gate
note, asked for by the maintainer ("jedziemy", 2026-10-25). The board recolour script can write an all-black or a wrongly
recoloured background with exit 0 (M-1); under the Canvas renderer the worn salon look silently falls back to a wash and
nobody can tell (L-1); the pouf's contact shadow is hidden under "Wróć do notesu".

## Starting Point

`scripts/recolour-board.py` checks its library pins and arguments but not its output and prints nothing. `applyWornGrade`
returns `false` under Canvas and two callers use or drop that; the fallback record (`REGISTRY_KEYS.artFallbacks`) and the
"Obrazki" panel already carry a fox line kind (precedent). The pouf slot and the kit's button overlap by the pack's layout.

## Desired End State

`npm run art` prints the board-mask share (13.47 % / 13.45 %) and refuses, naming the file, a mask outside 5 %-30 % or a
non-finite result; `public/` unchanged byte for byte. In a browser without WebGL the console names the renderer, the hook
shows `artFallbacks.worn = 'ungraded'`, and the parent reads "Przeglądarka rysuje grę w prostszym trybie, więc meble przed
remontem nie wyglądają na stare." The pouf overlap is DESIGN-GAP 174 for the maintainer. Save format stays v4.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Share bounds | 5 %-30 % | 2.7x below / 2.2x above the measured shares; a leak into the floor passes 30 % | research R1 |
| Guard order | non-finite, then share | keeps both refusals reachable through the CLI | research R2 |
| Python test | spawned CLI, pin probe, titled skip + warn line | tests the real script; CI (no pins) skips loudly | research R3, plan P-2 |
| Where to record | inside `applyWornGrade` | one place covers room, ghosts, miniature, backdrop; no caller edits | research R4, plan P-3 ([human]) |
| Parent line | own kind `worn`, not "gra rysuje" | nothing is drawn instead of a picture | research R5, plan P-4 ([human]) |
| Canvas proof | e2e with Chromium launch flags | real `AUTO` → Canvas path, no seam, no marker change | research R6 |
| Renderer log | one `console.info` in `BootScene.create` | renderer exists there; Canvas is supported, not a fault | research R7, plan P-9 |
| Pouf | DESIGN-GAP 174, no code | the button covers the pouf itself; a shadow tweak would draw on its body | research R8, plan P-5 ([human]) |

## Phases

| # | Phase | Driver | What lands |
| --- | --- | --- | --- |
| 1 | Board recolour refuses a wrong image (M-1) | tdd | guard + share print, `tests/recolourBoard.test.ts`, `npm run art` byte identity |
| 2 | The `worn` record and its "Obrazki" line | tdd | `FallbackWhere` `worn`, line kind, `pl.settings.wornPlain`, view case |
| 3 | Record in one place and log the renderer | impl | `applyWornGrade` record, `BootScene` `console.info`, source guards, gap rows 173/174 |
| 4 | Docs, follow-ups, seam sweep, visual pass | impl | CLAUDE.md, follow-ups, sweep, 3 [human] + 1 [visual] + 1 [reviewer] rows |
| 5 | Canvas e2e (#12, #16, #14) | e2e | `tests/e2e/canvas-renderer.spec.ts` (+3), WebGL control in `salon-style.spec.ts` |

**Prerequisites:** local `designs/`, `cwebp`, `python3 -I` with Pillow 12.1.0 / numpy 2.4.3 (all present); E2E=on.
**Estimated effort:** small — five short phases; unit `+3 + N`, e2e `+3`.

## Out of scope

Recolour arithmetic, pins, `make-task-art.mjs`, any `public/` byte; a Canvas look change or pixel guard (FU-SS F2); N-7,
N-8; the author's worn pack; pouf/button geometry; `drawRoomMiniature`, `SalonBackdrop.render`, `RoomScene`; Python in CI.
