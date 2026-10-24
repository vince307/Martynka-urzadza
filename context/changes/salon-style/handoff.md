# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-implement salon-style phase 4` step: phase 4 is committed (05be316) plus the salon-art e2e fix (19e5a40). Both backgrounds now carry the muted listki board; do not run `npm run art` without Pillow 12.1.0 + numpy 2.4.3 or it exits with the pip line.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | p1 7d2e520, p2 90785fc, p3 6ff84fa (+ 93c4b0a), fix 19e5a40 (salon-art e2e count), p4 05be316, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 17 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/salon-art.spec.ts` | #16 stand-in case expects `ROOM_ART.length` (37) instead of the stale literal 38 |
| `scripts/recolour-board.py` | new: pinned recolour (edge flood-fill mask, normalised blur, spill-corrected rim), target from argv |
| `scripts/make-task-art.mjs` | `BOARD_COLOUR` `#BCD799`, `BOARD_JOBS`; the two backgrounds go through the script into a temp PNG before cwebp |
| `public/assets/rooms/salon/architecture-{before,after}.webp` | regenerated: before 93 778 to 95 834 B, after 71 648 to 71 922 B |
| `src/data/balance.ts` | loader comment totals: 2 092 396 B, still about 41.8 s |
| `context/changes/salon-style/plan.md` | rows 4.1-4.4 ticked |

## 3. Verification

| command | result |
|---|---|
| salon-art fix: `npx playwright test tests/e2e/salon-art.spec.ts -g "#16" --workers=1` | 3 passed (the stand-in case 12.7 s); other hard-coded 38 are synthetic fixtures in `artHealth*.test.ts`, left |
| `npm run art` run 1 and run 2, sha256 | after 452688d63d2d4d56741ba4a3729f510198c041755790cbf4e35540ed0c85b475, before c8a9536a2470ba8a19cd84603af8301c604805678fdb93ba6ffb7738bc01f166, identical both runs; `git status --porcelain public/` exactly the two files |
| by eye (dwebp to PNG, Read) | board is the muted listki green, window trees, room and diorama untouched, no halo at the diorama edge; `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/p4-after.png` and `p4-before.png` |
| deliberate break: `PINNED_PILLOW = '0.0.0'` | exit 1 with the pip line; restored. Meta-check: proves the version pin only, not the image (judged by eye above) |
| `roomArt`, `bootBudget` | green; webp total 1 839 024 B; boot payload about 2 092 396 B = 41.8 s at 50 KB/s, limit 48 s |
| lint, typecheck, `npm test` + deploy scripts + sample E1-E6, build | clean; 3936 passed (baseline p3 3936, +0, no unit test added); `e2e hook: absent` |
| full e2e | not run (orchestrator) |

## 4. Next command

`/10x-implement salon-style phase 5`

## 5. Open

- Rows 2.5, 3.5, 4.5 (full e2e `branch baseline + 0`) left for the orchestrator.
- Docs still naming `furnishings-before`: `docs/design-gaps.md` rows 32 and 107, `docs/art-inventory.md` (phase 5); phase 5 also adds gap 170 text (board colour) and a recolour mention in `CLAUDE.md`.
- Manual rows 5.6-5.10 [human]/[visual], 5.11 [reviewer] as in the plan.
- Unverified visually: nested per-image ColorMatrix filters in the backdrop under WebGL.
- Python run time of `npm run art`: about 50 s in all (flood fill in pure Python); fine for a local tool.

## 6. Autonomous decisions

- Salon-art e2e: derive the count from `ROOM_ART.length` (the table the game uses) instead of another literal. Would change: a wish for an independent literal.
- Script takes the kit PNG as input (the prototype used the committed WebP), so no double lossy encode. Would change: output looking different from the research montage.
- Flood fill kept as a pure-Python deque (no scipy, so only the two pinned libraries). Would change: runtime becoming a nuisance.
- Updated the `balance.ts` loader comment totals (+2 230 B) rather than leave stale numbers.
- No lessons file exists.
