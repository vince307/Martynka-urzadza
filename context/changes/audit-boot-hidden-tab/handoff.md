# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

The `/10x-plan` step of run 2026-10-20-playtest-boot wrote `plan.md` (10 phases: 7 code/docs, 3 e2e) and `plan-brief.md`; no product code was touched. The next agent must check that every phase keeps the save format at v4 and that Z-8 stays narrowed to `NewerSave`, because only `NewerSave` can reach `Autosaver.replace` (`writeVerdict` refuses other writers only in `mode 'normal'`).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | 3 (`docs(audit-boot-hidden-tab): change identity (autonomous run)`, `docs(audit-boot-hidden-tab): research`, `docs(audit-boot-hidden-tab): plan`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 44 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-boot-hidden-tab/plan.md` | The implementation plan: overview with a table showing why the save format stays v4, current state, 10 phases each with `Driver:`/`Driver why:`, autonomous decisions A-1..A-9, and `## Progress` |
| `context/changes/audit-boot-hidden-tab/plan-brief.md` | A two-page brief with the key decisions table and the phases at a glance |
| `context/changes/audit-boot-hidden-tab/change.md` | Status changed from `preparing` to `planned` (only the metadata guard touched it) |
| `context/changes/audit-boot-hidden-tab/handoff.md` | This file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-boot-hidden-tab` |
| Success Criteria vs Progress (awk count per phase) | one-to-one, 44 rows: p1 4, p2 6, p3 5, p4 5, p5 4, p6 5, p7 5, p8 3, p9 3, p10 4 |
| `grep -c '^Driver: ' plan.md` | 10 (one per phase body) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| roadmap sync | `context/foundation/roadmap.md` has no `audit-boot-hidden-tab` item (non-roadmap change), so it was left untouched |
| repo greps for the plan | `bootLimitDue`/`bootLimitWait` in `src/core/bootLimits.ts` and `BootScene.preload`; `failureText` forced branch returns `siteDataAdvice`; the `replace` catch sets `blockedBy ??= 'newer'` without `refuseWrites`; `pl.settings.artCut` is a plain string; `docs/design-gaps.md` ends at row 152; e2e specs `load-and-tab-guard.spec.ts`, `error-boundary.spec.ts`, `save-transfer-blocked.spec.ts` exist |
| lint, typecheck, tests, build, e2e | Not run. This is a docs-only step and the step prompt bans builds, e2e and servers |

## 4. Next command

`/10x-plan-review audit-boot-hidden-tab`

## 5. Open

- **Phases and drivers:**
  - 1 tdd: `src/core/bootLimits.ts` hidden span. It rewrites the `tests/bootLimits.test.ts` wall-clock case on purpose.
  - 2 impl: the `BootScene.preload` listener and `hiddenMs` in `REGISTRY_KEYS.bootLoad`.
  - 3 tdd: the `artHealthLines` background flag, `pl.settings.artCutBackground` and DESIGN-GAP 153.
  - 4 tdd: `errorCode` in `src/core/save.ts`, the skill-carrying errors from `generateTask`, and `assertDrawable` in `src/core/tasks/visual.ts`.
  - 5 impl: `mountErrorCard` takes the code, wired from `main.ts`; `TaskScene.drawPrompt` gets `skillId`.
  - 6 tdd: `Autosaver.replace` calls `refuseWrites` and `failureText` maps `NewerSave` to `deviceNewer`.
  - 7 impl: docs, follow-ups and the seam sweep.
  - 8 e2e #15: hidden tab.
  - 9 e2e #15: the `Kod:` line.
  - 10 e2e #2: Z-8. It may need the seam `newer-replace` inside the existing marker `e2eSave`.
- **Manual-only rows:**
  - [human] 2.6: real-tablet check of a hidden tab during loading.
  - [visual] 3.5: "Obrazki" with and without a hidden span.
  - [visual] 5.4: the "Ups!" card with `Kod:`.
  - [visual] 6.5: the import/reset dialog after `NewerSave`, then the refusal card after it closes.
  - [reviewer] 2.5, 3.4 (teacher read of the new string) and 7.5.
- **DESIGN-GAP:** row 153 is planned in phase 3. Row 154 is not needed, because `pl.saveTransfer.deviceNewer` is reused.
- **Follow-ups:** phase 7 writes `follow-ups/review-fixes.md` with ≥ 10 `Trigger:` lines covering:
  - audit H-6 and the other MEDIUM/LOW rows;
  - A-6, A-10, B-6, L-8, ASL-05/08/09, G-3, S12-03/11/13 and the FontFace limit;
  - refusal-card focus, and the real-device measurement;
  - TXT-06, recorded as closed.
- **Risk:** the e2e proves the visible-time rule with a faked visibility state, not the real Phaser stall, which research inferred from the source.

## 6. Autonomous decisions

- P-1 **Complexity MEDIUM, 0 questions asked.** Contract rule 1: change.md (PA-1..PA-5, D-1..D-5) and research settle every solution choice. Rejected: an interview (contract bans `AskUserQuestion`). Would change: the plan review finding an unresolved product choice.
- P-2 **Split into 10 small phases.** Each pure rule gets its own tdd phase, each piece of glue its own impl phase, and the three e2e phases come after the seam sweep (contract). Rejected: one phase per finding (H-1 would mix tdd and scene glue). Would change: the plan review asking to merge phases 1 and 2.
- P-3 **`NewerSave` maps to `deviceNewer` even when the replace was not forced** (plan A-5). This goes beyond the scope's literal "forced replace" but does not contradict it. Would change: the maintainer wanting the plain line for an unforced refusal.
- P-4 **Background line whenever `hiddenMs > 0`** (plan A-3). Would change: the maintainer preferring the internet line when the visible time alone ran out.
- P-5 **No `[human]` row for a PRD conflict** (plan A-9). The PRD has no text on the boot limit, the card code or the site-data advice. The only `[human]` row is the device check 2.6. Would change: a PRD line found by the plan review.
- P-6 **No `plan-brief.md` deviation.** Written per the template; the change has no roadmap item, so the roadmap was not synced.
