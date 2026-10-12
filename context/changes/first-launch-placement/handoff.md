# Handoff — `first-launch-placement` (slice S-06)

Written by the `/10x-research` step: `research.md` answers every open question of `change.md` with source anchors;
`change.md` status is `preparing`. The next agent must not miss that a full-screen DOM overlay does NOT shield Phaser
objects underneath (Phaser forwards window touches and hit-tests them), so the scene under the adult gate needs its
input disabled; and must not pull S-11 forward (placement stays session-only, the regression is named in a `[human]` row).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | 2 on top of `37a9a62` (`docs(first-launch-placement): change identity (autonomous run)`, `docs(first-launch-placement): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by the skill's `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-launch-placement/research.md` | Research: age+month → stage table and month bands, warm-up composition/threshold recommendation, adult gate (DOM, Phaser touch pass-through, input method, accessibility), Boot → Welcome → Task seam, e2e helper + hook additions + proposed risk #12, "welcome every start" impact and options |
| `context/changes/first-launch-placement/change.md` | Frontmatter only: `status: new` → `preparing`, `updated` kept 2026-10-13 |
| `context/changes/first-launch-placement/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/first-launch-placement` |
| Phaser source read (`node_modules/phaser/src/input/touch/TouchManager.js` `onTouchStartWindow`, `InputManager.js` `onTouchStart`, `InputPlugin.js` `update`/`processDownEvents`, `core/Config.js` `inputWindowEvents`) | confirms window touches with target ≠ canvas are hit-tested and emit `GAMEOBJECT_DOWN` |
| One-off `node --import tsx` script over `src/data/curriculum` + `getGenerator` (deleted after use) | playable skills per step for E1–E6 (quoted in research §2) |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no product code changed (baseline in the contract: main at 37a9a62, unit 671, e2e 8) |

## 4. Next command

`/10x-plan first-launch-placement`

## 5. Open

- Product choices for the plan (research § Open Questions, each with a recommendation): gate problem size
  (2-digit × 2-digit vs non-round 2-digit × 6–9), DOM digit pad (recommended) vs `<input inputmode="numeric">`,
  warm-up 3 previous-stage + 3 from the first 2 playable current-stage steps with "first-try correct < 4 of 6 → −1",
  E1 without warm-up, auto-read of the first task after the welcome for E1/E2.
- `[human]` rows the plan must carry: PRD Open Question 1 answer (`change.md` decision 4); warm-up threshold and
  composition (gap in `docs/ZADANIA.md` §1); "until S-11 every cold start needs an adult — the child alone cannot start
  the game" (research §6, option 1); teacher read of every new Polish string; iPad manual check of the DOM gate.
- Follow-ups to record in `follow-ups/review-fixes.md` when the plan/impl writes them: test-plan risk #12 (wording in
  research §5, `Trigger: /10x-test-plan refresh`); maintainer choice between a versioned one-key placement save and an
  earlier learner-only save slice (research §6 options 2/3, `Trigger: roadmap / before daily production use`);
  `src/pwa/installHint.ts` `mountInstallHint` overlay lets taps through to the round underneath (same Phaser
  pass-through, `Trigger: next change to src/ui/dom or src/pwa`); "tryb z obrazkami" for age 6 (`Trigger: S-14`).
- In scope from archives: `pl.title` on the Welcome brand; bare numbers in `Keypad.paintButton`/`paintField`,
  `RoomSwitchButton.draw`, `TaskScene.shake` (seam sweep); e2e hook `targets.nextRound`/`toRoom` → `null` while the room is open.
- DESIGN-GAP rows (from 15 in `docs/design-gaps.md`): ask-a-parent screen, adult gate, stage panel, sixth warm-up dot,
  picture mode for age 6.

## 6. Autonomous decisions

1. Research question derived from `change.md` § Open questions + the step prompt; no AskUserQuestion. Would change
   if the orchestrator re-scoped the slice.
2. Local research instead of the skill's parallel sub-agents: the scope is ~15 small files plus Phaser input source;
   delegation would only duplicate reads. Would change if a gap remained after the local pass (none did).
3. Recommended against exposing the gate answer in the e2e hook (spec reads the DOM text) and for a month-independent
   e2e helper (age 10 → E6, parent picks E3 ⇒ no warm-up). Would change if the plan keeps decision 4 differently
   (e.g. warm-up always runs) — then the helper must also play 6 warm-up tasks.
4. Recommended keeping `change.md` decision 1 (session-only) and surfacing the regression instead of a `localStorage`
   key. Would change if the maintainer wants daily production use before S-11 — then option 2 or 3 of research §6.
5. Did not run any gate: no code changed. Would change if this step had touched `src/` or `tests/`.
