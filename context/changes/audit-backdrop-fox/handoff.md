# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-implement` step, phase 4, of run 2026-10-24-audit-backdrop-fox: the e2e locator fix, docs (C-1, gap 168), CLAUDE.md, follow-ups, seam sweep. Rows 4.6 (e2e part) and the [human]/[visual]/[reviewer] rows are not mine.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | 1ee0ef6 (locator fix), b46be2a (phase 4), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged |
| `## Progress` rows | 4.1-4.5 ticked with b46be2a; 4.6 left (e2e count is the orchestrator's); 4.7-4.10 left; 1.5, 2.4, 3.5 left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/health-lines.spec.ts` | notebook test aims at the fallback sentence and also asserts the fox line |
| `docs/art-inventory.md`, `docs/design-gaps.md` | C-1 font sentence and table row; row 168 amended |
| `CLAUDE.md` | Backdrop restore and fox health sentence group; fox sentence says any pose missing |
| `context/changes/audit-backdrop-fox/follow-ups/review-fixes.md` | 5 open entries with Trigger lines, 2 closed |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/health-lines.spec.ts --workers=1` | 6 passed (before: strict-mode violation on "zeszyt") |
| 4.1-4.5 greps, validate-rule-files | PASS; art-inventory MartynkaNext.ttf count 2; 168 mentions guideMissing; 6 Trigger lines; snapshotPixel only in SalonBackdrop.ts |
| lint, typecheck, npm test + deploy scripts + sample E1-E6, build | green; unit 3915 (delta +0 over p3, docs and an e2e locator only); `e2e hook: absent (2 chunks checked)` |
| seam sweep | clean: one snapshotPixel user, no per-pose textures.exists in GuideFox.show, one BackdropSnapshot shape, no restorewebgl literal, artPick/GuideFox/SalonBackdrop comments true, FALLBACK_ORDER users right, guideMissing used |
| deliberate break | none (docs phase, no testable content) |

## 4. Next command

`/10x-e2e audit-backdrop-fox phase 5`

## 5. Open

- Rows 4.7, 4.8 [human], 4.9 [visual], 4.10 [reviewer]; 1.5, 2.4, 3.5, 4.6 wait for the orchestrator's full e2e. `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **I-1 Locator fix**: filter the fallback sentence (lead from `pl.settings.artFallback`) by the notebook name and add an assertion on `guideMissing`. Rejected: exact full-sentence match (the list can hold more names under e2eArt=ui). Would change: if the list order becomes fixed.
- **I-2 CLAUDE.md**: appended the new group after the notebook-polish sentence and reworded the S-16c "no fox when its texture is missing" to "any pose". AGENTS.md does not repeat these facts, untouched.
- **I-3 Follow-ups F4/F5** recorded open without re-verifying the older code paths (plan allows "else open").
