# Handoff — `task-round-stars` (slice S-04)

Written by the `/10x-plan` step of autonomous run 2026-10-12-s04-s08. `plan.md` (11 phases, 55 Progress rows) and
`plan-brief.md` exist; no product code yet. The next agent must not let the e2e hook build replace the production
build that seed #8 tests: the plan keeps the app `webServer` entry byte-identical (4398) and adds a second entry
(`dist-e2e/`, port 4397) plus a `chromium-hook` project (plan § Implementation Approach, Phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 3 after this step (`docs(task-round-stars): change identity (autonomous run)`, `docs(task-round-stars): research`, `docs(task-round-stars): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 55 (`grep -c '^- \[ \]' plan.md`) |
| Roadmap | S-04 `planning` (at-a-glance row and item body) |
| Working tree | clean after the commit (only the five files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/task-round-stars/plan.md` | Plan: 11 phases with `Driver:` lines, Success Criteria, `## Autonomous decisions` (13), `## Progress` |
| `context/changes/task-round-stars/plan-brief.md` | Two-page brief: decisions table, phases at a glance |
| `context/changes/task-round-stars/change.md` | Frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-04 status `proposed → planning` (table + body) |
| `context/changes/task-round-stars/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/task-round-stars` |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `{"changed":true}` → `status: planned` |
| Plan structure (`grep -c '^## Phase'`, `grep -c '^Driver:'`, `grep -c '^- \[ \]'`) | 11 / 11 / 55; Success Criteria ↔ Progress rows checked one to one per phase |
| `gh run view 38294537061 --log` (CI job `check`, job id 114962348864) | step `Run npm run build` shows `> vite build --config vite/config.prod.mjs` and no further output (prod `logLevel: 'warning'`) — basis for row 9.8 |
| lint / typecheck / unit / build / e2e | not run: docs-only step (no code touched); baseline on main `58244a5` per contract (lint OK, typecheck OK, unit 441 passed, build OK, e2e 1 passed) — inherited, unverified |

No deliberate break: nothing testable was written in this step.

## 4. Next command

`/10x-plan-review task-round-stars`

## 5. Open

- Drivers: 1–4 `tdd`, 5–10 `impl` (10 = seam sweep, profile § 2/§ 3 + env comments), 11 `e2e` (risk #11).
- Gate commands unchanged in this slice; Phase 9 adds a guard inside `npm run build` (prints `e2e hook: absent (N chunks checked)`) and a second Playwright `webServer` on port 4397 (`E2E_HOOK_PORT`), `dist-e2e/` in `.gitignore` and ESLint ignores. Phase 10 writes the port into `context/foundation/autonomous-run.md` § 3.
- Human checklist (manual Progress rows): 8.5 iPad touch < 100 ms; 10.5 „Dalej” vs auto-advance; 10.6 only „Spróbuj jeszcze raz” when `hint[0]` leaks (FR-008); 10.7 `'select'` excluded until S-13; 10.8 task/room switch not drawn (FR-011).
- `[reviewer]` teacher reads: 1.5 (E1 tiles), 2.5 (MISSING / F14), 5.5 (`pl.round` strings); 9.8 is `(CI at ship)`.
- `[visual]` rows: 5.6, 6.4, 7.4, 8.4 — states task-tiles, task-keypad, hint, second try, solution steps, retype, correct, round end with bonus at 1440×900 and 1024×768, plus 420×760 rotate overlay.
- DESIGN-GAPs and follow-ups are written by Phase 10 (`docs/design-gaps.md`, `follow-ups/review-fixes.md`); list in plan Phase 10 § 2.
- No `lessons.md` in `context/foundation/`.

## 6. Autonomous decisions

1. **E2E hook in a separate build (`dist-e2e/`, port 4397, project `chromium-hook`); seed #8 stays on the production build at 4398.** Rejected: research's `env: { E2E_HOOK: '1' }` on the app entry (seed would test the hook build — orchestrator constraint), `--mode e2e` (changes the app command), port 4399 (visual port; `reuseExistingServer` could hit a dev server). Why: keeps #8 on the shipped bundle and the app entry untouched. Would change: maintainer accepting one build, or 4397 being taken (then `E2E_HOOK_PORT`).
2. **Hook-absence proof = Vite plugin guard inside `npm run build` (fails on marker in prod, fails on missing marker in the hook build).** Rejected: separate grep step in CI/deploy/gate (command changes, easy to skip), live assertion in `scripts/check-deploy.ts` (follow-up). Why: runs in the local gate, CI `check` and Deploy `build` with no command change. Would change: a deploy that builds with another command.
3. **„Dalej” after a correct answer.** Rejected: auto-advance. Why: kit `correct.png`; no timers. Would change: maintainer (row 10.5).
4. **ROUNDING exempt from the first-hint rule by type list.** Rejected: accepting false blocks. Why: line 0 is the interval, a good hint. Would change: S-17 rewriting ROUNDING hints.
5. **Font: TTF now in `public/fonts/` + `ttf` in precache globs.** Rejected: `woff2` conversion, deferral to S-16. Why: NFR local Polish font offline in the first playable scene. Would change: a `woff2` in the art pack.
6. **4 E1 tiles from `balance.tiles.count`.** Rejected: 3. Why: kit shows 4; measured 0 throws. Would change: play observation.
7. **`'select'`/`'drag'` excluded until S-13; switch not drawn; round end = „+2 ★” bar + „Dalej” to the next round; default stage E3.** Why: research + change.md decisions; no kit views. Would change: rows 10.7/10.8, S-05/S-06.
8. **Decided without AskUserQuestion** (contract rule 1): complexity HIGH, 0 questions — research and change.md settled every product choice; phase-structure approval taken as recommended. Clipboard copy skipped (unattended run).
