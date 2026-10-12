# Repository Guidelines

"Martynka urządza" is a Polish maths-practice and room-decorating game for grades 1–3: Phaser 4.2 + TypeScript + Vite, an offline-installable PWA for a landscape tablet, no backend. Plan: @Martynka-urzadza.md (authoritative, Polish). Tasks: @docs/ZADANIA.md. PRD: @context/foundation/prd.md. Rules: @CLAUDE.md.

## Hard rules

- Implement milestones M0–M8 (@Martynka-urzadza.md section 11) in order; never reorder.
- `src/core/` must not import Phaser. Write its logic with vitest tests first, then the scene.
- Scenes have no balance numbers or player-facing text; both live in `src/data/` (`balance.ts`, `pl.ts`, `wordTemplates.ts`, `rooms.ts`), which imports only `src/core/text/*` and types.
- Never copy textbook tasks; generate original ones per @docs/ZADANIA.md. Never reference `docs/zrodla/` (gitignored) from committed files.
- No energy, timers, ads, purchases, accounts or fail states; wrong answers never remove stars.
- Polish numerals must agree (1 jabłko, 2 jabłka, 5 jabłek). Identifiers and comments are English.
- Phaser 4 differs from v3 (renderer, filters); check the v4 docs first.
- `designs/` is read-only art; `.claude/` gitignored.

## Project structure

M0 shell: `src/main.ts` (game config, 1920×1080 `Scale.FIT`), `src/scenes/BootScene.ts` (placeholder), `src/data/{layout,pl}.ts`, `src/core/types.ts`, `src/pwa/` (service worker, install hint), `src/ui/dom/` (overlays); `src/ui/widgets/`, `src/storage/`, `tests/` are empty. `public/` is served at the root (loader paths `assets/...`); hashed bundles go to `_app/`. `context/` holds 10x workflow documents; never hand-write files there.

## Commands

- `npm install`
- `npm run dev` — Vite on http://localhost:8080 (`-- --host` for a tablet).
- `npm run build` — production build to `dist/`.
- `npm run typecheck` — `tsc --noEmit`; Vite does not type-check.
- `npm run preview` — the only local way to test `sw.js`.
- `npm test` — vitest (`npx vitest run tests/<name>.test.ts` for one file); `npm run sample -- E3` prints tasks per step with violations.

## Coding style

TypeScript strict with `noUnusedLocals`/`noUnusedParameters` (@tsconfig.json). Four-space indentation. Scene files are PascalCase (`TaskScene.ts`); one generator per task type in `src/core/tasks/generators/`, a pure `(skill, rng) => Task` on the seeded rng.

## Testing

Vitest in `tests/` (standalone `vitest.config.mts`). Each skill gets a 1000-draw test on seeded `createRng` (`tests/helpers.ts`): range, negatives, bridging, distractors, inflection via `validateTask` (nouns in `data/nouns.ts`). After every milestone verify build and offline behaviour.

## Commits and PRs

Polish commit messages with a conventional prefix (`feat:`, `chore:`, `docs:`). Branch, push, open a PR; `main` changes only by merging on GitHub, which deploys to https://martynka-urzadza.pl, so `main` must build. Server work: `ssh martynka-ops <cmd>` as one plain command (`sync`, then `bootstrap` after `deploy/` changes); never touch CoiledSpring or its users. Runbook: @deploy/README.md.
