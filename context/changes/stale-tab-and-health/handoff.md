# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 10 (documentation, follow-ups, seam sweep) written by `/10x-implement` in run `2026-10-16-fix-stale-tab-health`; commit `aa68062`. The next agent must not get wrong: phase 11 is an e2e phase (spec `tests/e2e/stale-tab.spec.ts`, Driver e2e); the e2e hook build and `?e2eSave` seams are the only way to reach the refusal card.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `d8336f1` (p9 docs), `aa68062` (p10), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 10.4 (e2e by the orchestrator), 10.5 [reviewer], 10.7 [reviewer, CI at ship], earlier [reviewer] rows, 6.4, 5.5, 3.5, 2.5, phases 11-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `CLAUDE.md` | one paragraph "Stale tab and health lines" (v4, `guardedPut`/`writeVerdict`, `otherTab`, `saveRefusedCard`, `swStatus`, `uiArtHealth`, `musicLine`, `soundPrefsKept`, gaps 116-121); earlier "v3 now" sentences updated |
| `deploy/README.md` | one docs-only rollback note for v4 (only file changed under `deploy/`) |
| `context/changes/stale-tab-and-health/follow-ups/review-fixes.md` | 16 entries, each with `Trigger:` |
| `src/main.ts`, `src/storage/idb.ts` | seam: duplicate `pageWriterId` removed, the store's own `randomWriter` is the one writer-id helper |
| `src/data/balance.ts` | comment now names v3 before v4 backups |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build | OK; unit 3138 = branch baseline 3138 + 0; build `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS; deliberate missing path in `CLAUDE.md` → FAIL (`MISSING: ...nonexistent-xyz/plan.md`); restored → PASS |
| e2e | not run by me; the removed `pageWriterId` is behaviour-neutral (the store default stamped the same kind of id), orchestrator gate to confirm `121 passed` |
| `git diff --stat main -- deploy/` | `deploy/README.md` only |

## 4. Next command

`/10x-e2e stale-tab-and-health phase 11`

## 5. Open

- Rows: 10.4 e2e (orchestrator gate, expect baseline + 0), 10.5 and 10.7 [reviewer].
- Seam sweep findings: duplicate writer-id helper fixed; one stale comment in `main.ts` and `balance.ts` fixed; no second "card once" flag (only `refusedCardUp`); `storedVersionNewer` still has callers (`writeVerdict`, e2e hook); gap rows 116-121 match the `pl.ts` DESIGN-GAP comments (116 in two places, 117, 118, 119, 120, 121); `backup-v3` is built from `backup-v${from}` in `idb.ts`, so CLAUDE.md names it by key, not by a literal in src.
- Carried: [human] 11.4; [visual] 12.4.

## 6. Autonomous decisions

- Skill prompts (exec mode, commit message, next phase) decided in place: implemented in this context, message as proposed, stop after the phase.
- Row 9.2 ticked with the orchestrator's gate (d8336f1, 121 passed). Row 10.6 [human] ticked on the orchestrator's instruction: the maintainer accepted save format v4 in the run session on 2026-10-16 ("akceptuję v4, kontynuuj").
- Row 10.4 left open: the e2e part is the orchestrator's.
- Writer-id helper: kept the one in `idb.ts` (default of `createIdbSaveStore`), dropped the `main.ts` copy; rejected exporting it, since nothing else needs the id.
- Archived follow-ups were not edited (the plan names none to close).
