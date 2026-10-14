# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-implement` phase 5 step of run `2026-10-14-fix-art-stand-in`. Phase 5 is committed (see §1); row 4.3 ticked from the orchestrator note (46 passed on 3484345).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + p1 `3be41c7` + p2 `b459bc8` + p3 `d3fa403` + p4 `00e90b6` + p5 `d36b952` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 1.5, 2.5, 3.5 `[reviewer]`, 4.4 `[reviewer]`, 4.5 `[visual]`, 5.4 e2e (orchestrator), 5.5 `[reviewer]`, 5.6 `[visual]`, phases 6-9 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/taskArt.ts` | `TaskArtEntry.label` (formatMoney, WEIGHTS/JUGS label, ICONS noun; '' for balance-scale and thermometer-frame) |
| `src/ui/widgets/ArtImage.ts` | stand-in draws `entry.label` (never the id), shrinks to the box; `state()` adds `label` |
| `src/data/layout.ts` | `ART_STAND_IN.padding` |
| `tests/taskArt.test.ts` | label table test |
| `docs/design-gaps.md` | row 66 revised |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| `npm test` | 1897 passed (branch baseline 1896, delta +1); deploy and ops shell tests, `sample` E1-E6 OK (no output change) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| Deliberate break | money label `formatMoney(grosze)` replaced by `id`: red `coin-01gr: expected 'coin-01gr' to be '1 gr'`; restored. Meta-check: test compares to `MONEY` values, not just non-empty |
| `npx playwright test ...` | e2e: not runnable in this session - orchestrator gate (MachPortRendezvous Permission denied); row 5.4 unticked |

## 4. Next command

`/10x-implement art-stand-in-and-load-signal phase 6`

## 5. Open

- 5.4 full e2e `baseline + 0` (46) for the orchestrator; 5.5 `[reviewer]` teacher read of the 38 labels; 5.6 `[visual]` screenshots with `?e2eArt=missing`.
- Text fit is not verified on canvas (no browser here).

## 6. Autonomous decisions

1. **`TASK_ART` money entries built from `MONEY`** (width 384 for ids starting `note`), same order and sizes as before. Would change: a new money id with another size.
2. **Empty-label stand-in** (scale, thermometer frame) draws the box only; `state()` still reports it as stand-in. Would change: a visual-gate finding.
3. **Phase driver unchanged** (`impl`); row 4.3 ticked from the orchestrator note.
