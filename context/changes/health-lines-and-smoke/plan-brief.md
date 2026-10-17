# Health lines and smoke — Plan Brief

> Full plan: `context/changes/health-lines-and-smoke/plan.md` · research: `research.md` · scope: `change.md`

## What & Why

Slice 3 of the audit sweep 2026-10-16. The deploy smoke never asks the server for each precached file, and the parent
panel's "Gra bez internetu", "Obrazki", "Dźwięki" and "Zapis gry" sections show counts or a false "ready" instead of
the cause. The boot loader mislabels failures and runs its limits on Phaser's smoothed clock. This change makes the
smoke and the panel tell the truth, with no save-format change (v4 stays) and nothing under `deploy/`.

## Starting Point

- `scripts/check-deploy.ts`: 20 checks (last Deploy run 38995649135 `all 20 checks ok`). It checks room art only and
  does one hard-coded salon GET, which is wrong on a rollback.
- `offlineView` maps a failed update behind an active worker to "Gra jest gotowa". There is no `update()` and a waiting
  worker is ignored.
- `BootScene`: one "Task art failed to load" label for every failure. A decode failure goes unnoticed, the timers run on
  `this.time`, sounds are queued before the salon, and there is no font check.
- "Obrazki" shows counts only and is hidden while task art is `unknown`. Its DOM is built directly, so it has no tests.
  The fallbacks the child sees are visible only to the e2e hook.
- Sound: "music after the first touch" however many touches; "12 not loaded" with no audio device; every music failure
  ends as `Music missing`; the prefs are untested when refused.

## Desired End State

The smoke HEADs every precache entry (status and media type, as the live server answers today) and checks all four art
tables, but only with a SHA. A failure line names the path and says the release is already live. The panel names a
failed update, the cause of missing pictures (fetch, decode, cut, never), per-folder counts, labels, the font, the
screen fallback, a device that will not play sound, and the salon carried to the new look. The boot log names the
table, URL and status, and the boot limits run on the wall clock.

## Key Decisions Made

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Type check per entry | all nine precached extensions, unknown = status only | status only for fonts/audio | live server types all nine (research, 18 requests) |
| Rollback | tables only with a SHA, per-entry list from served `sw.js` | build manifest in `vite/` | right for any release, no build change |
| Localhost | `isLocalHost` skips the immutable check (like `www`) | red line in the local proof | `vite preview` sends `no-cache` |
| O-3 update | `update()` once per launch | on return from background | no new worker claiming an open page mid-round; § 9 "silent update at the next launch" ([human] 2.6) |
| S-2 | source catch through a per-file `config.context` wrapper, pinned | defer | the step prompt asks for it; pin fails first on a Phaser upgrade |
| B-6 | reorder only (sounds last) | raise `totalMs` | no measured cold start ([human] 4.6 optional) |
| Panel views | pure builders in `core` returning keys, thin renderers | DOM test env | repo pattern, `core` has no text |
| M-4 | runtime decode note `salonCarried` | save field | v4 stays |
| Design gaps | 139–150 in phase order | — | one per new `pl.ts` string |

## Scope

In: 18 MEDIUM items (28 ids) and the in-scope LOWs from `change.md`. Deferred with triggers (written in phase 11):
O-1(b), the `deploy/` half of 2217 P-4, G-3, G-6, ASL-05, ASL-08, and carried A-6, A-8, L-7, `FontFace` limit, VO3.
Out: `deploy/`, `.github/workflows/`, `vite/config.shared.mjs`, save format, child-facing text.

## Architecture / Approach

Each phase writes a pure rule in `src/core` (or in `scripts/deploy-check/parse.ts`) with a failing test first, then
wires its one call site. Runtime records live in the registry and never in `SAVE_KEYS`. Phaser internals are reached
only through seams pinned in `tests/phaserLoaderPin.test.ts`. New lines go into the existing section components.

## Phases at a Glance

| # | Phase | Driver | Key output |
|---|---|---|---|
| 1 | Smoke asks for every precached file | tdd | `entryVerdict`, `precacheServed`, `precacheCovers`, `failLine`, `isLocalHost` |
| 2 | "Gra bez internetu" names a failed update | tdd | `updateFailed` line, `waiting`, launch `update()`; gap 139 |
| 3 | Boot log + cause per texture | tdd | `loadErrorLine`, `artCauses`, `wrongSize`, `FILE_LOAD` pin |
| 4 | Wall-clock limits, boot record, order | tdd | `bootLimits.ts`, `bootQueue`, `fontHealth`, `stallall` marker |
| 5 | "Obrazki" builder: lines, cause, cut | tdd | `artHealthLines`; gaps 140–141 |
| 6 | "Obrazki": folders, skipped, labels, font | tdd | `labelCap`; gaps 142–146 |
| 7 | Screen fallback record | impl | `artFallbacks`, `?e2eArt=ui`, orphan test; gap 147 |
| 8 | "Dźwięki" blocked / no device | tdd | `effectsLine`, music cause, warn once; gaps 148–149 |
| 9 | Decode at source, prefs warn + probe | tdd | `noiseLine`, decode seam, `applySoundPrefs` |
| 10 | Salon note, room growth, filter count | tdd | `carryV2Salon`, `roomGrowth`, `fallback`; gap 150 |
| 11 | Hook `unreachable`, docs, seam sweep | impl | `CLAUDE.md`, `follow-ups/review-fixes.md` |
| 12 | e2e #2/#16 purchase under writefail, slots | e2e | +2 |
| 13 | e2e #15/#14 stalled picture, cut, font | e2e | +3 |
| 14 | e2e #14 screen fallback in the panel | e2e | +2 |

Prerequisites: branch `feat/health-lines-and-smoke` at `58b6ea7`, contract baseline (unit 3545, e2e 132, inherited).
Estimated effort: 14 fresh-agent phases; e2e gates run by the orchestrator (~10–12 min each).

## Open Risks & Assumptions

- A server MIME change fails the smoke after the switch (the release is already live, and the line says so).
- Sounds queued last are cut first on a slow first start.
- The S-2 seam relies on `file.config.context`; WebKit's `document.fonts` and a context that never unlocks are
  `[human]` checks only.
- Known e2e load flakes: `money-pay` #11, `final-art-loading` #15, `child-flow-guards` #2.

## Success Criteria (Summary)

- Each phase: red-first unit tests, a deliberate break with a meta-check, the full local gate, and e2e `+0` (phases
  12–14: `+2`, `+3`, `+2`).
- Local `check:deploy` against `vite preview` is green with and without a SHA. After the merge the Deploy smoke prints
  `precache served: n/N` and `all N checks ok`.
- Progress: 71 rows = 48 automated + 13 `[reviewer]` + 6 `[visual]` + 4 `[human]`.
