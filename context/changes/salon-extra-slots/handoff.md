# Handoff — `salon-extra-slots` (slice S-16d)

Written by the phase 6 `/10x-e2e` finish step (after the phase 5 `/10x-implement` step) of autonomous run `2026-10-15-fix-s16bcd`: phases 1-6 done (phase 6 = e2e for the old look and the five new purchases). The next agent must not get this wrong: phases 6-8 are `Driver: e2e` and must use the `?e2eSkills=`/`e2eVariant=off` seams, copy button labels exactly from `pl.ts`, and never touch `SALON_V3_TARGET`, `LEGACY_SALON_V2` or `tests/fixtures/`.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` |
| Commits | p1 4ac1460, p2 12202f6, p3 0bc3fec, p4 57d34c6, p5 15716ab, p6 d3ce24a, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows | phase 6: 6.1-6.3 ticked (6.1 full-suite count open); 6.4 [human] open; 3.6, 3.7, 4.4, 5.3, 1.5, 2.4 open (reviewer/visual); phases 7-8 not started |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/salon-extra-slots.spec.ts` | 2 tests (#16 old look until »Wymień«; five new tasks cost once) |
| `playwright.config.ts` | `salon-extra-slots` added to `ROUND_SPEC` (hook project) |
| `context/changes/salon-extra-slots/e2e-break-p6a.patch`, `e2e-break-p6b.patch` | deliberate breaks of production code |
| `context/changes/salon-extra-slots/e2e-request-p6.md` | request file from the sandboxed attempt (orchestrator ran it) |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | clean |
| Unit | 3076 passed (170 files) = baseline, no code change |
| sample E1-E6, build | clean; `e2e hook: absent (2 chunks checked)` |
| e2e (orchestrator) | spec: 2 passed (`--workers=2`); full-suite 117 + 2 to be observed by the orchestrator after phase 8 |
| Break p6a | 1 failed: "#16 S-16d the lamp, plant and pouf show their old look until »Wymień« buys a new one"; reverted |
| Break p6b | 1 failed: "#16 S-16d each of the five new tasks costs its price once, after »Wybieram«"; reverted |

## 4. Next command

`/10x-e2e salon-extra-slots phase 7` (phase 7, `Driver: e2e`)

## 5. Open

- Rows 3.6, 3.7, 4.4, 5.3, 1.5, 2.4 ([reviewer]/[visual]) open; 6.4 [human] later.
- 6.1 full-suite count (117 + 2) open until the orchestrator's run after phase 8.

## 6. Autonomous decisions

1. Phase 6 was run by the orchestrator (Chromium cannot start in the agent sandbox); this step only ran the non-browser gate and committed. Would change: the full-suite count differing from 119.
2. Earlier decisions of p1-p5 unchanged.
