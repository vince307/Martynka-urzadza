# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-plan` step of run `2026-10-14-fix-art-stand-in`. `plan.md` (8 phases, Progress all unchecked) and
`plan-brief.md` are written; no product code changed. The next agent must not accept a filter that strips the current
step below `ceil(unlockShare · n)` skills (decision 2: no unlock stall) and must keep `textures.exists` after load as the
one art-health signal.

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | 3 on the branch after this step (`a2baebb` change identity, `d79fe64` research, + `docs(art-stand-in-and-load-signal): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`, 2026-10-14) |
| `## Progress` rows remaining | 46 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (four change files staged by path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-stand-in-and-load-signal/plan.md` | Full plan: 8 phases with `Driver:` lines, Success Criteria, `## Autonomous decisions` (11), `## Progress` |
| `context/changes/art-stand-in-and-load-signal/plan-brief.md` | Two-page brief with the key decisions table |
| `context/changes/art-stand-in-and-load-signal/change.md` | Frontmatter only: `status: preparing → planned`, `updated` |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| awk check: Success Criteria bullets per phase vs `## Progress` rows | one-to-one for all 8 phases (Automated and Manual) |
| `grep -c '^Driver: ' plan.md` | 8 (one per phase body heading) |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md sha matched; `changed: true`, status `planned` |
| lint / typecheck / unit / build / e2e | not run: planning step, no product code changed; baseline per contract (`1812347`: unit 1865 incl. 1 flaky, e2e 46) inherited, unverified |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan-review art-stand-in-and-load-signal`

## 5. Open

- Phases: 1 tdd (core `artHealth`, `artFilter`, round/warm-up wiring, spoken timeouts), 2 tdd (`replace` refuses `unavailable`, `deviceSaveView`), 3 impl (`BootScene` record, `?e2eArt` seam + marker, `TaskScene` filter, "Obrazki" section `artHealthView`), 4 impl (`TASK_ART.label`, `ArtImage` fit), 5 impl (import/reset dialogs), 6 impl (seam sweep, follow-ups, `CLAUDE.md`), 7 e2e #11 (`art-stand-in.spec.ts`, +4), 8 e2e #2 (`save-transfer-blocked.spec.ts`, +2). E2E phases use the request-file protocol.
- Human checklist (manual rows): `[human]` 5.7 decision against PRD FR-022 (no import/reset under `unavailable`); `[human]` 6.7 decision on FR-013 (round composition changes when art is missing, with the current-step threshold rule). `[visual]` 3.7, 4.6, 5.6; `[reviewer]` teacher reads 3.6, 4.5, 5.5.
- DESIGN-GAPs planned: revise 66 (phase 4), new 67 "Obrazki" (phase 3), new 68 device save not read (phase 5) with a pointer from 48/49.
- Follow-ups to write in phase 6 (`follow-ups/review-fixes.md`): S14-05..S14-10, S12-02..S12-15 (S12-04 incl. export of the fresh session under `unreadable`), S13-*, raw copy in the dialog; close the archived "BootScene.preload loaderror" and "Import or reset over an unreadable save (impl-review F1)" by reference (archive not edited).
- Unverified: exact helper names for passing the stage in e2e (`passWelcome` variants in `tests/e2e/support/welcome.ts`) and how `save-restart.spec.ts` gets past the `unavailable` card — phase 8 reads them.

## 6. Autonomous decisions

1. **Unlock stall at E2.2/E5.5 resolved, not accepted**: the current-step bucket is filtered only when ≥ `ceil(unlockShare · n)` playable skills remain; otherwise stand-in tasks (solvable by the Polish label) stay. Rejected: research's "accept the stall" (contradicts FR-014 and no-fail-states) and an art-aware `unlockReady`. Would change: the maintainer preferring a stall over stand-ins in the current step (`minCurrent` → 1).
2. **Filter scope = answer-only-on-art kinds (MONEY_COUNT, MASS, CAPACITY `toLitres`)**. Rejected: all art kinds (COUNT, MULT_GROUPS, thermometer, MONEY_CHANGE, `howMany` solvable). Would change: a teacher read finding labelled boxes confusing in MONEY_CHANGE.
3. **S12-01 `unreadable`: warning line + pointer to the start card's "Zachowaj kopię", no raw-copy button**. Rejected: keeping `raw`/`reason` in runtime (new export path). Would change: a parent unable to reach the start card (follow-up trigger).
4. **S12-01 `unavailable`: refuse in `replace` and in the dialogs**, against FR-022's letter → `[human]` 5.7. Would change: an iPad N-7 measurement showing frequent `timeout` on a healthy store (then a time-limited re-read).
5. **Screenshot sizes**: canvas states 1920×1080 + 1024×768 (profile § 9); DOM dialogs 1920×1080 + a 400×300 landscape iframe (portrait shows "Obróć tablet"). Would change: profile § 9 naming another narrow width.
6. **No `AskUserQuestion`, complexity MEDIUM, no roadmap edit** (non-roadmap change; `roadmap.md` has no matching Change ID). Would change: none.
7. **`artMissing` uses `inflect` for the verb (1 "nie wczytał się" / 2–4 "nie wczytały się" / 5+ "nie wczytało się")**; final wording after the phase-3 teacher read. Would change: the teacher read.
