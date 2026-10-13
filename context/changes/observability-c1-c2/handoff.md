# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by the `plan` step (`/10x-plan observability-c1-c2`, autonomous run 2026-10-13-fix-observability). `plan.md` has
6 phases (3 tdd, 2 impl, 1 e2e) and 35 Progress rows. This is a NON-ROADMAP change: no roadmap row exists and none was
edited. The H-7 rule change is the MAINTAINER's decision (2026-10-13); phase 2 updates PRD FR-013 and `docs/ZADANIA.md` § 1
to it. Keep the build-guard success message literally `e2e hook: absent (N chunks checked)` (profile § 2 parses it).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2`, cut from `main` at `a34aeee` |
| Commits | 3 on the branch after this commit: change identity, research, plan |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/observability-c1-c2/plan.md` | Plan: 6 phases with `Driver:` lines, Critical Implementation Details (boundary order in `main.ts`, `openInputSession` contract, `?e2eFail=` sites), Known risks, 10 autonomous decisions, `## Progress` |
| `context/changes/observability-c1-c2/plan-brief.md` | Two-page brief with the key-decision table |
| `context/changes/observability-c1-c2/change.md` | frontmatter `status: preparing → planned`, `updated` (helper script only) |
| `context/changes/observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `metadata-guard.mjs inspect` / `mark-planned` | changed: true, status `planned` |
| `grep -c observability-c1-c2 context/foundation/roadmap.md` | 0 — no roadmap item, roadmap untouched |
| Progress rows vs Success Criteria | 3 + 6 + 4 + 8 + 9 + 5 = 35 rows, one per criterion bullet |
| Code anchors re-read for the plan | `createInputSuspender`, `main.ts` `preBoot`, `UIScene.openSettings`/`applySettings`/`closeSettings`, `WelcomeScene.openParent`/`start`, `SettingsPanelOptions`, `recordRound`, `checkE2EHook`, `ROUND_SPEC`, `pl.settings`, PRD FR-013, ZADANIA § 1 |
| gate suites | not run: docs-only step, no product code |

## 4. Next command

/10x-plan-review observability-c1-c2

## 5. Open

- Plan-review should check: phase 6 size (5 e2e tests + 3 break patches; split into 6/7 if too big, autonomous decision 9); the `welcome` trigger kept only for the screenshot; the benign list (decision 4).
- `[human]` rows: 2.6 (H-7 maintainer decision reflected, unlock at 60–70 % accuracy), 4.8 (restart loses the session before S-11, against the PRD's literal "niczego stracić"), 5.9 (reading switch stays active without a voice).
- `[visual]` rows: 4.7 (card over the task via `?e2eFail=step` and over the welcome via `?e2eFail=welcome`, server with `E2E_HOOK=1` on 4399), 5.8 (panel with and without a Polish voice), both at 1440×900 and 1024×768.
- Teacher reads: 2.5 (FR-013, ZADANIA § 1), 4.5 (`pl.errorCard`), 5.6 (`pl.settings.noVoice`).
- DESIGN-GAP 29 (error card) and 30 (no-voice line) get written in phases 4–5. Follow-ups file is written in phase 5.
- Risk: the boot carrier (`unhandledrejection`) is inferred, not traced; phase 6 break 6.2 settles it.

## 6. Autonomous decisions

1. Session helper `openInputSession` in `core` over `finally` per holder (research option b). Why: one place, provable in vitest without a DOM. Would change: plan-review finds a holder the helper cannot wrap.
2. `AbortError`/`NotAllowedError` rejections are benign. Why: autoplay-policy rejections would bring the card back after every reload. Would change: the app starts using those names for real failures.
3. No `audio.noAudio`; `game.loop.sleep()` on the card: yes. Would change: sound arrives (S-16), or `sleep` misbehaves on a dead loop.
4. H-6 via a `watchVoice` subscription, switch stays active (research recommendation). Would change: the kit gets an "unavailable" pattern.
5. Copy chosen: card "Ups! Gra się zatrzymała." / "Dotknij przycisku, a gra uruchomi się od nowa." / "Zacznij od nowa" / "Wersja …"; panel "Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi." Would change: the teacher read.
6. Six phases, e2e last after the seam sweep in phase 5; risk named "#15 (proposed)", H-6 added under "#14 (proposed)". Would change: plan-review splits phase 6.
7. H-7 recorded as the maintainer's decision, not mine; PRD FR-013 edited in phase 2 because the contract requires it. Would change: nothing in this run.
8. No roadmap status edit (non-roadmap change, step prompt). Would change: nothing.
