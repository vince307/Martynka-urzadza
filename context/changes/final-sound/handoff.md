# Handoff — `final-sound` (slice S-16b)

Written by `/10x-implement final-sound phase 8` of run 2026-10-15-fix-s16bcd. Phases 1-8 are done and committed (docs and follow-ups are in); phases 9-10 (e2e) pending. Do not get wrong: the settings panel has three On/Off groups with the same button labels, so an e2e spec must scope "Włączone" to a group by its name; decode failure never fires `loaderror` (use `cache.audio.exists`).

## 1. State

| | |
|---|---|
| Branch | `feat/final-sound`, cut from `main` at `a1625be` |
| Commits | 4 docs + p1 a85eb75 + p2 f242c04 + p3 8cd9e81 + p4 723fef8 + p5 ee4336b + p6 d073e7c + p7 dc3e930 + p8 2d8ef9f + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 8.3 [reviewer], 7.4 [visual], 7.5 [reviewer], 6.3 [reviewer]; 7.1 ticked from the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `CLAUDE.md` | S-16b paragraph added to "Current state"; save format mentions corrected to v3 (v1/v2 kept only as history) |
| `context/changes/final-sound/follow-ups/review-fixes.md` | 8 follow-ups, each with `Trigger:` |
| `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` | the two `Trigger: S-16b` entries closed (audio rejections, purchase sound); VO3 re-triggered to "designer brief delivers a hold view, or S-17 polish" |
| `docs/human-checklist.md` | new section for S-16b with the `[human]` rows 9.7, 10.6 and the settings note |
| `context/changes/final-sound/e2e-break-p9{a,b,c}.patch` | break patches for phase 9 |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| npm test | 3029 passed (branch baseline 3029, +0: docs only) |
| deploy tests, sample E1-E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| validate-rule-files.sh | PASS; break (path to a missing file appended to `CLAUDE.md`) gave `missing: 1`, FAIL; restored, PASS |
| e2e | not rerun (docs only; orchestrator ran 104 passed after p7) |
| diff vs main in `vite/config.shared.mjs`, `deploy/` | empty |

## 4. Next command

`/10x-e2e final-sound phase 9`

## 5. Open

- Known risks in `plan.md` `## Known risks` unchanged. Manual rows: 1.4, 2.4, 3.4, 5.5, 6.3, 7.5, 8.3 [reviewer]; 7.4 [visual]; 9.7 and 10.6 [human].
- Phase 8 wrote the follow-ups in the change folder; `/10x-archive` moves them with the change (CLAUDE.md names no path into it).

## 6. Autonomous decisions

- Phase 8: CLAUDE.md names no follow-up path (the change folder moves at archive, validator forbids context/changes). Stale "v2" mentions were reworded (history kept, "stays v1" became "stays v3" or "unchanged"). Closed archive follow-ups were marked "Resolved" with `Trigger: none (closed)` rather than deleted. Would change: maintainer wanting the follow-ups listed elsewhere.
