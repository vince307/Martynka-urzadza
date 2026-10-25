# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the `/10x-research` step of run 2026-10-25-audit-art-renderer: `research.md` answers (a)-(d) with measurements; no
product code changed. The next agent must not forget that the Canvas record lives in ONE place (`applyWornGrade`, decision R4)
and that the Canvas e2e uses Chromium launch flags, not a new `?e2eArt` value (R6) — `vite/e2eHookGuard.mjs` stays untouched.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | 2 on the branch: `docs(audit-art-renderer): change identity (autonomous run)`, `docs(audit-art-renderer): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (throwaway research specs moved to `$TMPDIR`, stray `scripts/__pycache__` removed) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-art-renderer/research.md` | findings (a)-(d), code references by symbol, autonomous decisions R1-R8 |
| `context/changes/audit-art-renderer/change.md` | status `new` → `preparing` only |
| `context/changes/audit-art-renderer/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-art-renderer` |
| mask share, `python3 -I` with pinned Pillow 12.1.0 / numpy 2.4.3 on `designs/martynka-salon-v2` | before 0.1347, after 0.1345 |
| guarded draft (in `$TMPDIR`) vs current `scripts/recolour-board.py`, both backgrounds | PNG SHA-256 identical; `cwebp` (args of `convert`) output `cmp`-identical to committed `public/assets/rooms/salon/architecture-{before,after}.webp`; `public/` not written |
| guarded draft on synthetic images | no-green exit 1 (non-finite, 0.0 %), all-green exit 1 (100.0 %), band exit 0 (`board mask 15.00%`); no output file on refusal |
| `npx playwright test --config=<abs throwaway config>` vs `dist-e2e/` on 4399 | 3 passed: Canvas (`--disable-webgl --disable-webgl2 --disable-3d-apis`) welcome backdrop `renderer canvas, graded 0`, room `worn.graded false`, `artFallbacks {}`, no pageerror; WebGL control `graded 10`; frames in `$TMPDIR/aar/frames/` |
| pouf | painted rows y 752-937 (texture alpha), button y 892-1008: bottom 46 px of the pouf and the whole shadow ellipse hidden (frame `after-empty-webgl.png`) |
| port 4399 after the run | free (preview server killed) |
| lint / typecheck / unit / build / e2e gate | not run: research only, no code touched (baseline on `main` at c123331 inherited, unverified: unit 3936, e2e 164) |

## 4. Next command

`/10x-plan audit-art-renderer`

## 5. Open

- Proposed phases (drivers): P1 `tdd` M-1 guard in `scripts/recolour-board.py` (`recolour`, `main`, `BoardError`, bounds 5-30 %)
  + `tests/recolourBoard.test.ts` (pin probe, titled skip) + `npm run art` byte-identity (`git status --porcelain public/` empty);
  P2 `tdd` core + copy: `FallbackWhere` `'worn'`, `DrawnFallbackWhere` excludes it, `artHealthLines` kind `worn`,
  `artHealthView.textOf`, `pl.settings.wornPlain`; P3 `impl` wiring: `applyWornGrade` records on false, `BootScene.create`
  `console.info` renderer, source-guard test, DESIGN-GAP rows; P4 `e2e` new hook spec (name added to `ROUND_SPEC`) with
  `test.use({ launchOptions })` + one WebGL-control assertion in `tests/e2e/salon-style.spec.ts`.
- DESIGN-GAPs to add: the parent sentence for the Canvas look (proposed row 173, wording autonomous → `[human]` read); the pouf's
  lower quarter and contact shadow under "Wróć do notesu" (proposed row 174, comment at `ROOM_LAYOUT.resume`, `[human]` choice:
  move pouf slot / move button / accept).
- Follow-ups to re-record open in `follow-ups/review-fixes.md` (fired under the chosen wiring): salon-style F2, final-art-salon
  F4, salon-load-health L-6/L-8, audit-backdrop-fox F5, audit-backdrop-fox F1 (Canvas e2e checks the record, not pixels).
  Not fired if the plan keeps R4/R8: salon-style F4, final-art-salon F2, salon-extra-slots F2, L-R8/L-R11, F6/notebook-polish 16,
  G-3, VO2/F5/F7.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- R1 bounds 5 %-30 % over the audit's 5-60 %; would change: a background measuring near a bound.
- R2 guard order non-finite → share (both refusals CLI-testable); would change: an import-based test.
- R3 CLI spawn test with pin probe and titled skip, no CI Python; would change: the maintainer adding pins to CI.
- R4 record inside `applyWornGrade` (one place, covers room, ghosts, miniature, backdrop), not per caller; would change: a reading
  that requires `drawRoomMiniature` to return the flag itself.
- R5 own `ArtHealthLine` kind `worn`, mode `ungraded`; would change: maintainer wanting one combined sentence.
- R6 Canvas e2e through Chromium launch flags, no `?e2eArt=canvas` seam; would change: Chromium flags no longer disabling WebGL.
- R7 renderer `console.info` in `BootScene.create`; would change: nothing known.
- R8 pouf: DESIGN-GAP row, no code; would change: the maintainer choosing to move the slot or the button.
- Throwaway Playwright specs ran from a gitignored `tests/e2e/research.local/` (profile § 8 practice), moved to `$TMPDIR` after;
  the preview server on 4399 needed an unsandboxed `kill` (the sandbox refused it).
