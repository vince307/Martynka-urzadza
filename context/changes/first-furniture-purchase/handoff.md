# Handoff — `first-furniture-purchase` (slice S-09)

Written by the `plan` step (`/10x-plan first-furniture-purchase`, autonomous run 2026-10-13-s09-s11). `plan.md` has 8
phases (3 tdd, 4 impl, 1 e2e) with `## Progress` (42 rows); status `planned`. The one thing the next agent must not get
wrong: the star balance lives ONLY in the registry (`REGISTRY_KEYS.stars`, initialised in `main.ts` `preBoot`), `TaskScene`
adds the delta in `syncStars` only, and the room spends only through `core` `stepPanel`/`purchase` — never a scene-side
comparison or a second counter.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | 3: `77c94d4` change identity, `1acc0b2` research, then this `docs(first-furniture-purchase): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-furniture-purchase/plan.md` | full plan: 8 phases with `Driver:` lines, Known risks, Autonomous decisions (14), Progress |
| `context/changes/first-furniture-purchase/plan-brief.md` | two-page brief |
| `context/changes/first-furniture-purchase/change.md` | frontmatter status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-09 status `proposed` → `planning` (At a glance row + `### S-09` body) |
| `context/changes/first-furniture-purchase/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/first-furniture-purchase` |
| `grep -nE '^Driver:' plan.md` | 8 lines: tdd, tdd, tdd, impl, impl, impl, impl, e2e (e2e after the seam-sweep phase 7) |
| `grep -c '^- \[ \]' plan.md` | 42 = sum of every phase's Success Criteria (3+5+3+6+5+6+10+4) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| `grep -n "paid" src/core/round.ts` | retype pays 0 stars — basis for the e2e "short" path in phase 8 |
| gates | not run — docs-only step, no product code changed |

## 4. Next command

`/10x-plan-review first-furniture-purchase`

## 5. Open

- `[human]` rows (plan phase 7): 7.6 slot list + cost curve 5–15 (`src/data/rooms.ts` `SALON`); 7.7 no sound, deviation from literal FR-017; 7.8 balance and room session-only until S-11; 7.9 panel/button UX choices without kit source; 7.10 iPad/Android device check.
- `[visual]` rows 4.6, 5.5, 6.5, 6.6; `[reviewer]` teacher reads 2.5, 6.4; seam sweep 7.5.
- DESIGN-GAP rows 31–36 to add, rows 10 and 12 to update (phase 7 `docs/design-gaps.md`).
- Follow-up "shared HUD button" stays open (no HUD button changes); new follow-ups listed in phase 7 §2.
- Plan-review should check: phase 2 as `tdd` (data invariants lead content) vs `impl`; phase 4 deliberate break depends on e2e (orchestrator gate if Chromium is unavailable); room geometry in phase 2 (`ROOM_LAYOUT.area/tray/taskButton`) before the UI phases.

## 6. Autonomous decisions

- No AskUserQuestion (contract rule 1): complexity, question budget and phase approval decided in place — research + change.md already settled every product question; remaining choices recorded in plan.md `## Autonomous decisions` 1–14. Would change: a plan-review finding.
- No sub-agents: research mapped every file; a few targeted reads (`TaskScene` star flow, `layout.ts`, `e2eHook.ts`, `round.ts` `paid`) filled the gaps. Rejected: Explore fan-out (duplicate reading). Would change: a larger unmapped area.
- Placeholder looks in a separate `SALON_PLACEHOLDERS` table instead of extending `SlotDef` (keeps the plan §5 type for S-16 art). Would change: S-16 needing slot size in `SlotDef`.
- Preview starts empty and "Wybieram" stays inactive until a thumbnail is picked (FR-017 "wybiera"); rejected preselecting variant 0. Would change: playtest.
- Roadmap status set to `planning` per the skill and committed with the plan (run rule).
