# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

The `/10x-new` step of run 2026-10-20-playtest-boot wrote this handoff: the change folder exists with `change.md` (identity, audit claims re-verified against the repo now, bound copy and panel sections, triggered follow-ups, pre-agreed and agent decisions). No code was touched. The next agent must not widen the scope past H-1, I-1 (with the cheap skill-id part: C-3, I-3, C-2, C-1) and Z-8: every other finding of the audit stays a follow-up (scope.md § 2), and the save format stays v4.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | 1 (this step: `docs(audit-boot-hidden-tab): change identity (autonomous run)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-boot-hidden-tab/change.md` | change identity: Notes (source, save format v4 expected unchanged, lessons file absent, content rule), "audit claim / repo now / correction" table, design kit + copy keys + parent-panel sections bound, triggered follow-ups with scope take, Autonomous decisions PA-1..PA-5 (maintainer, pre-agreed 2026-10-20) and D-1..D-6 |
| `context/changes/audit-boot-hidden-tab/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-boot-hidden-tab` |
| symbol checks (grep/read) | `BootScene.preload` `arm`/`bootLimitSchedule`/`performance.now`; `src/core/bootLimits.ts`; `REGISTRY_KEYS.bootLoad` shape in `BootScene.create`; `pl.settings.artCut`/`artCause.cut`/`artRestart`; `mountErrorCard` and the `installErrorBoundary` callback in `src/main.ts`; `generateTask` (`numberChoices` outside `try`, `new Error` drops the name); `assertPool`/`lineTicks` in 5 widgets; `drawPrompt` `pictureLayout` without `skillId`; `failureText`; `Autosaver.replace` catch (`NEWER_SAVE` only); `refuseWrites` → `onBlocked` → `mountSaveRefusedCard` with `pl.saveFailed.detail` |
| lint, typecheck, tests, build, e2e | not run: docs-only step (step prompt: no builds, e2e or servers); nothing in `src/` changed |

## 4. Next command

`/10x-research audit-boot-hidden-tab`

## 5. Open

- Research must confirm in `node_modules/phaser` (4.2.1) that `LoaderPlugin` advances its queue only on the scene UPDATE and whether in-flight XHRs (per-file `balance.loader.timeoutMs`) time out while hidden (D-1's reversal condition).
- Research must check whether a generation-time pool/tick check consumes rng or changes seeded draws (D-4's reversal condition), and whether `onBlocked` from inside an open import/reset dialog collides with its input session (D-5).
- DESIGN-GAP expected: row 153 in `docs/design-gaps.md` for the "Obrazki" line about pictures cut while the game was in the background (no copy in the kit or `src/data/pl.ts`); row 154 only if no existing refusal text fits the import/reset dialogs.
- Follow-ups whose trigger fires (listed in `change.md` with takes): TXT-06 (in scope, closes with I-1); load-and-tab-guard A-3..A-11 and F3, stale-tab-and-health G-2/G-3/B-4/B-5/P-2..P-6, final-art-salon F3/F4, salon-load-health L-6/L-8, `FontFace` limit, ASL-02..09, S12-* replace items, save-truth § 24/§ 26 — deferred unless they are part of H-1/I-1/Z-8; research records which are already closed in code, and the plan restates the rest in this change's `follow-ups/review-fixes.md`.
- No `[human]` rows yet.

## 6. Autonomous decisions

- N-1 `/10x-new` "STOP and wait" / next-step choice: chosen `/10x-research` (fixed by the step prompt) over the skill's default `/10x-plan`. Why: the Phaser loader behaviour while hidden and the error path for the skill id need source-backed answers. Would change: nothing in this run (the prompt fixes it).
- N-2 Title written from the scope, not the bare id (the skill derives it from intent). Would change: the maintainer renaming the change.
- N-3 Clipboard copy of the next command skipped (unattended run). Would change: an interactive session.
- The product decisions are in `change.md` § Autonomous decisions: PA-1..PA-5 pre-agreed by the maintainer 2026-10-20; agent decisions D-1 (both limits count visible time only, `hiddenMs` in `bootLoad`, background-specific "Obrazki" line; rejected `disableVisibilityChange` and record-only), D-2 (no cap on hidden time), D-3 (card build line becomes `pl.saveFailed.detail`, reason `name` or `name/skillId`, no new copy), D-4 (cheap skill-id set: I-3 keep name + `skillId` property, C-3 tiles inside `try`, C-2 checks at generation without rng, C-1 one argument), D-5 (all three named refusals `NewerSave`/`OtherWriterSave`/`PreviousPageSave` get no site-data advice and go through `refuseWrites`/`onBlocked`), D-6 (next step) — each with its reversal condition there.
