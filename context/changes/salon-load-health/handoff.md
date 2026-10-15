# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by `/10x-implement salon-load-health phase 4`: docs-only closeout (rollback note, CLAUDE.md sentence, comment fixes, follow-ups), commit 27406ab. The one thing not to get wrong: phase 5 is `Driver: e2e` and only adds the spec; the v3 and loader code already exist.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | identity, research, plan, plan review, 826150c (p1), 6922792 + 5009efd (p2), 903c70a (p3), 27406ab (p4) + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 5 closes it) |
| `## Progress` rows remaining | 12 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `deploy/README.md` | one rollback note: below the v3 build the `future` card shows (only `deploy/` change vs main) |
| `CLAUDE.md` | `remapLegacySalon` sentence replaced; new "Save format v3 and loader limit" sentence; no path into `context/changes/` |
| `src/data/balance.ts`, `src/data/pl.ts`, `src/core/saveHealth.ts` | comments only: no hard-coded v1/v2 |
| `context/changes/salon-load-health/follow-ups/review-fixes.md` | 17 follow-ups, each with a `Trigger:` line |
| `plan.md` | rows 3.1, 3.3 (orchestrator note), 4.1-4.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | pass / pass |
| `npm test` | 2925 passed (p3 baseline 2925, +0: comments/docs only) |
| deploy + ops shell tests, `sample` E1-E6 | pass |
| `npm run build` | pass, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS; deliberate break (CLAUDE.md path to a missing file) FAIL; restored, PASS |
| `git diff --stat main -- deploy/` | only `deploy/README.md` (+1) |
| `grep remapLegacySalon\|LEGACY_SALON\b\|LegacyRoomLayout` in src, CLAUDE.md | empty |
| e2e | not run: no code change in this phase (orchestrator note covers p3: 98 passed, baseline stays 98) |

## 4. Next command

`/10x-e2e salon-load-health phase 5` (phase 5, `Driver: e2e`)

## 5. Open

- [reviewer] 4.4, 3.4, 2.5, 1.5; [human] 3.5, 1.6; [visual] 2.6; all of phase 5.
- The follow-up file lists audit ids M-4..L-8 by their short descriptions (source report is not committed).

## 6. Autonomous decisions

1. **CLAUDE.md names no follow-up path**: the change moves to `context/archive/` later and `validate-rule-files.sh` fails on a path that does not exist yet, so it says "in the salon-load-health change (archive folder)".
2. **Backup comments generalised** ("previous version") in CLAUDE.md, balance and pl comments rather than naming v2/v3.
3. **No e2e run**: no behaviour changed.
