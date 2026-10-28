# Repository Guidelines

"Martynka urządza" is a Polish maths-practice and room-decorating game for grades 1–3: Phaser 4.2 + TypeScript + Vite, an offline PWA for a landscape tablet, no backend. Plan: @Martynka-urzadza.md (authoritative, Polish). Tasks: @docs/ZADANIA.md. PRD: @context/foundation/prd.md. Rules: @CLAUDE.md.

## Hard rules

- Implement milestones M0–M8 (@Martynka-urzadza.md section 11) in order.
- `src/core/` must not import Phaser or browser globals (lint-enforced). Write its logic with vitest tests first, then the scene.
- Scenes have no balance numbers or player-facing text; both live in `src/data/` (`balance.ts`, `pl.ts`, `wordTemplates.ts`, `rooms.ts`), which imports only `src/core/text/*` and types (lint-enforced).
- Never copy textbook tasks; generate original ones per @docs/ZADANIA.md. Never reference `docs/zrodla/` (gitignored) in committed files.
- No energy, timers, ads, purchases, accounts or fail states; wrong answers never cost stars.
- Polish numerals must agree (1 jabłko, 2 jabłka, 5 jabłek). Code, comments: English.
- Phaser 4 differs from v3; check its docs.
- `designs/` is read-only art; `.claude/` is local.

## Project structure

`src/main.ts` (game config, 1920×1080 `Scale.FIT`), `src/scenes/` (Boot, Welcome, Task, Room, UI), `src/ui/` (round widgets, `narrator.ts`), `src/data/` (strings, balance, layout, curriculum, templates), `src/core/` (rng, text, tasks, round, narration, `curriculum.ts` and `mastery.ts` for adaptive difficulty, `longPress.ts`, `inputSuspend.ts` and `progress.ts` for parent settings), `src/testing/` (e2e-build hook), `src/pwa/`, `src/ui/dom/` (dialogs). `public/` is served at the root (loader paths `assets/...`); hashed bundles go to `_app/`. `context/` holds 10x documents; never hand-write files there.

## Commands

- `npm run dev` — Vite on http://localhost:8080/graj/ (`-- --host` for tablets).
- `npm run build` — production build to `dist/`.
- `npm run typecheck` — `tsc --noEmit`; Vite does not.
- `npm run preview` — the only local way to test `sw.js`.
- `npm run lint` — ESLint (boundary rules); `npm test` — vitest (`npx vitest run tests/<name>.test.ts` for one file); `npm run sample -- E3` — tasks per step with violations. CI runs sample for every stage.

## Coding style

TypeScript strict with `noUnusedLocals`/`noUnusedParameters` (@tsconfig.json). Four-space indent. Scene files are PascalCase (`TaskScene.ts`); one generator per task type in `src/core/tasks/generators/`: `(skill, rng) => Task`.

## Testing

Vitest in `tests/` (`vitest.config.mts`). Each skill gets a 1000-draw test (`tests/helpers.ts`) plus `tests/contentInvariants.test.ts`; content PRs need the teacher read from CLAUDE.md. Quality plan: @context/foundation/test-plan.md.

## Commits and PRs

Polish commit messages with a conventional prefix (`feat:`, `chore:`). Branch, push, PR; `main` changes only by a GitHub merge, which deploys to https://martynka-urzadza.pl (target: https://bystrow.ariom.cloud/graj/ with a landing page at `/`; until the move is applied the old address is the live one). Server work: `ssh martynka-ops <cmd>` as one plain command; never touch CoiledSpring. Runbook: @deploy/README.md.
