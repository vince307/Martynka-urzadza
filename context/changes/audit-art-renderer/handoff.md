# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the `/10x-new` step of run 2026-10-25-audit-art-renderer: the change folder exists with `change.md` (identity,
claim table, triggered follow-ups, decisions). No code changed. The next agent must not forget that the backdrop reaches
`applyWornGrade` only through `drawRoomMiniature`, and that the Canvas-look value must not join the "gra rysuje" list.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | 1 on the branch: `docs(audit-art-renderer): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-art-renderer/change.md` | identity, pre-agreed scope (S1-S6), claim table re-verified at `c123331`, design sources bound, triggered follow-ups, autonomous decisions N1-N5 |
| `context/changes/audit-art-renderer/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-art-renderer` |
| `git show origin/docs/observability-audit-2026-10-24-salon-style:<report>` | read: M-1 (MEDIUM), L-1 (LOW), 0 CRITICAL/HIGH |
| `python3 -I -c "import PIL, numpy; print(...)"` | `12.1.0 2.4.3` (pins present locally) |
| `ls designs` | `martynka-salon-v2` present (byte-identical rebuild possible locally) |
| `grep SAVE_VERSION src/core/save.ts` | `4` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code touched (baseline on `main` at c123331 is inherited, unverified: unit 3936, e2e 164) |

## 4. Next command

`/10x-research audit-art-renderer`

## 5. Open

- Research questions (from `change.md` claim table): measured board-mask share of `architecture-before` and
  `architecture-after` (bounds with margin, scope item 2); test form for the Python refusals and its skip rule (no
  precedent test runs Python; CI has no pins); whether headless Chromium can run the game under `type: CANVAS` through a
  new `e2eArt` value read in `src/main.ts` (inside the existing `e2eArt` marker of `vite/e2eHookGuard.mjs`), else a unit
  test of the wiring; whether "once per scene" needs a guard beyond `noteFallback`'s game-wide idempotence; a frame of the
  empty after room showing the pouf, its contact shadow and `ROOM_LAYOUT.resume` (by the data the button covers the shadow
  and the bottom ~46 px of the pouf's visible box).
- New parent sentence for the Canvas look: DESIGN-GAP (row 169 amended or a new row), wording autonomous → `[human]` read row.
- Triggered follow-ups to re-record open in `follow-ups/review-fixes.md` (list with takes in `change.md`
  § Triggered follow-ups): salon-style F2/F4, final-art-salon F2 + F4, salon-extra-slots F2, L-R8/L-R11 (if `RoomScene`
  edited), audit-backdrop-fox F1 (if Canvas e2e) / F5 / F6, notebook-polish 16, salon-load-health L-6/L-8,
  audit-boot-hidden-tab G-3, final-art-salon VO2/F5/F7 (if `RoomView.render` edited).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- N1 next command `/10x-research` (fixed by the step prompt) over the skill's default `/10x-plan`; would change: nothing.
- N2 the Canvas-look value gets its own "Obrazki" line kind, not a `DrawnFallbackWhere` member (untrue "gra rysuje" claim);
  would change: research or the maintainer preferring one combined sentence.
- N3 the backdrop is covered through `drawRoomMiniature` (one fix, each caller records in its own scene); would change:
  research finding the recording scene differs from the caller.
- N4 pouf: expected DESIGN-GAP row (button covers part of the pouf by the pack layout), shadow-only tweak at most; would
  change: a frame showing the painted pouf clear of the button.
- N5 no follow-up folded beyond scope; fired ones re-recorded open; would change: research showing one is required for L-1.
- S1-S6 recorded in `change.md` as pre-agreed by the maintainer 2026-10-25.
