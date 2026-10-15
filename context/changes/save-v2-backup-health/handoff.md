# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-plan` step of run `2026-10-15-fix-s14c-s14d`. The plan is written (`plan.md`, 6 phases, `##
Progress` all pending) with a brief; nothing is implemented. Do not get wrong: the save format stays v2 (every new state
is runtime `AutosaveStatus` or derived), and the plan deliberately goes beyond the PRD's literal text (v2 written without
the v1 copy after 3 failed copies) — that decision is a `[human]` row (2.5), not something a reviewer should silently undo.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | 3 on the branch after this step: change identity, research, `docs(save-v2-backup-health): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 39 (`grep -c '^- \[ \]' plan.md`), 0 done |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-v2-backup-health/plan.md` | Full plan: phases 1–3 `tdd` (time limit, backup policy, honest panel), 4–5 `impl` (slow-read card, dialogs + seam sweep), 6 `e2e` (risk #2); `## Autonomous decisions` 1–10; `## Progress` |
| `context/changes/save-v2-backup-health/plan-brief.md` | Two-page brief with the key-decision table |
| `context/changes/save-v2-backup-health/change.md` | Frontmatter `status: preparing` → `planned`, `updated` |
| `context/changes/save-v2-backup-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-v2-backup-health` |
| Success Criteria ↔ Progress mapping (script over `plan.md`) | phases 1–6: automated 4/4, 4/4, 3/3, 4/4, 5/5, 6/6; manual 2/2, 3/3, 2/2, 4/4, 2/2, 0/0 |
| Every phase body starts with `Driver:` + `Driver why:` | yes (grep `^Driver`) |
| `metadata-guard.mjs inspect` / `mark-planned` | `changed: true`, status `planned` |
| `context/foundation/roadmap.md` has the change id | no (0 matches) — roadmap untouched, as required for a non-roadmap change |
| Code facts used by the plan, read in this step | `src/core/autosave.ts` (`attempt`, `replace`, `loadSave`), `src/core/saveHealth.ts`, `src/ui/dom/saveHealthView.ts`, `src/main.ts` `start`, `src/testing/e2eHook.ts` `e2eSaveStore`, dialog `busy` flags, `playwright.config.ts` `ROUND_SPEC`, test names in `tests/autosave.test.ts`, e2e specs that key the `hang` card on `pl.saveUnavailable.title` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `16848c6`: unit 2445, e2e 77 — inherited from the run contract, unverified here) |

## 4. Next command

`/10x-plan-review save-v2-backup-health`

## 5. Open

- `[human]` rows: 2.5 (v2 written without the v1 copy after 3 failed copies or at `hidden` after one — beyond PRD
  FR-021), 2.6 (`replace` takes the pending copy once, non-blocking — reverses minigame-daily-puzzle "bypass by design"),
  4.7 (no `localStorage` start counter; way out of `timeout` = wait longer on the same read + conditional advice),
  4.8 (N-7 iPad measurement).
- `[reviewer]`/`[visual]` rows per phase (teacher read of every new `pl.ts` string; screenshots at 1440 and 1024 of each
  named seam state).
- DESIGN-GAP rows to add: 94 (failing detail), 95 (migration line), 96 (slow-read card), 97 (timeout advice).
- E2E: phases 4 (two changed specs) and 6 (new `tests/e2e/save-backup-health.spec.ts`, must be added to `ROUND_SPEC`)
  use the request-file protocol; phase 6 has four break patches p6a–p6d.
- Follow-ups to file in phase 5 (`follow-ups/review-fixes.md`): SV2-04/option B, SRR-08 + start counter, S12-07, S12-08,
  S12-13, S12-03, S12-11, F7/SRR-09/SRR-01, SRR-07/10/11/13, SV2-05..15, SV2-08 (deploy), L-S3, `abort` in `idb.ts`.
- Plan-review candidates to check: whether phase 4 (`impl` with a test-first core part) should split; the known risk of a
  late-landing timed-out `replace` write when the page closes before the covering session write.

## 6. Autonomous decisions

- **Planned without AskUserQuestion; complexity MEDIUM-HIGH, zero questions** — research and the run contract settle
  every product choice; the skill's interview, structure approval and clipboard steps were decided in place. Would change:
  a human in the loop.
- **SV2-01 option A, `backupAttempts = 3`, `hidden` exception, hung copy counts as failed** (plan decision 1–2). Rejected
  B, C, D. Why: v2 ⊇ v1 and validated; silent loss violates "Postęp nigdy nie ginie". Would change: a v1 field that
  `MIGRATIONS[1]`/`encodeSave` drops, or a throwing migration (v3).
- **SRR-04 included** (decision 3) — reverses "bypass by design"; flagged `[human]` 2.6. Would change: maintainer treats
  import/reset as a conscious abandonment of the old save.
- **SRR-02 without a cross-start counter** (decision 4): one longer wait on the same read (20 s) + static conditional
  advice in `saveOff.timeout`/`deviceTimeout`. Would change: N-7 showing permanent timeouts beyond 20 s.
- **`writeTimeoutMs = 5000`, one helper, no `abort`; dirty + arm only after a `replace` timeout; `failureText`
  unchanged** (decisions 5–7). Would change: evidence of hangs inside live iPadOS transactions / of committed rejected
  transactions / force offered in another read state.
- **Scope extras**: O2, S12-12, SRR-12 in; S12-03/07/08/11/13, SRR-08 out as follow-ups (decision 8). Would change: a
  review showing S12-13 breaks input release on the new `timeout` path.
- **Phase drivers** (decision 9): 1–3 `tdd` (pure core leads), 4 `impl` (DOM card dominates; its core part test-first
  inside), 5 `impl` (last impl phase, carries the seam sweep), 6 `e2e` (risk #2, features built by 1–5, `E2E=on`). Would
  change: plan-review splitting phase 4 into a `tdd` core phase and an `impl` card phase.
- **Plan written in Polish** like the archived save plans; anchors are symbols only.
