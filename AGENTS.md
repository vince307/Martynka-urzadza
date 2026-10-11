# Repository Guidelines

"Martynka urządza" is a Polish maths-practice and room-decorating game for grades 1–3: Phaser 4.2 + TypeScript + Vite, an offline-installable PWA for a landscape tablet, no backend. Plan: @Martynka-urzadza.md (authoritative, Polish). Task catalogue: @docs/ZADANIA.md. PRD: @context/foundation/prd.md. Working rules: @CLAUDE.md.

## Hard rules

- Implement milestones M0–M8 from @Martynka-urzadza.md section 11 in order, one milestone per commit or PR. Never reorder them.
- `src/core/` must not import Phaser. Write its logic with vitest tests first, then the scene.
- Scenes contain no balance numbers and no player-facing text; both live in `src/data/` (`balance.ts`, `pl.ts`, `rooms.ts`, `curriculum/`).
- Never copy textbook tasks; generate original ones per @docs/ZADANIA.md. Never reference `docs/zrodla/` from committed files (gitignored, local only).
- No energy, timers, ads, purchases, accounts, or fail states. Wrong answers never remove stars.
- Polish numerals must agree (1 jabłko, 2 jabłka, 5 jabłek). Code identifiers and comments are English.
- Phaser 4 differs from v3 in renderer and filters; check the v4 docs first.
- `designs/` is read-only art; `.claude/` is gitignored.

## Project structure

M0 shell: `src/main.ts` (game config, 1920×1080 `Scale.FIT`), `src/scenes/BootScene.ts` (placeholder), `src/data/{layout,pl}.ts`, `src/core/types.ts`; `src/ui/widgets/`, `src/storage/`, `tests/` are empty. Files in `public/` are served at the root, so loader paths look like `assets/...`. `context/` holds 10x workflow documents and the roadmap; never hand-write files there.

## Commands

- `npm install`
- `npm run dev` — Vite on http://localhost:8080 (`-- --host` for a tablet).
- `npm run build` — production build to `dist/`.
- `npm run typecheck` — `tsc --noEmit`; Vite does not type-check.
- `npx vitest run tests/<name>.test.ts` — once vitest lands in F-03 (M1). No lint or test script exists yet.

## Coding style

TypeScript strict with `noUnusedLocals` and `noUnusedParameters` (@tsconfig.json). Four-space indentation. Scene files are PascalCase (`TaskScene.ts`); one generator file per task type in `src/core/tasks/generators/` (`addSub.ts`), each a pure function `(params, rng) => Task` using the seeded rng.

## Testing

Vitest in `tests/`, planned from M1. Each skill gets a 1000-draw property test: results in range, no negatives, bridging matches params, distractors differ from the answer, correct Polish inflection. After every milestone verify the production build and offline behaviour.

## Commits and PRs

Commit messages are Polish with a conventional prefix (`chore:`, `docs:`, `feat:`). Branch, push, open a PR; `main` changes only by merging on GitHub, never locally. The merge deploys to https://martynka-urzadza.pl via `.github/workflows/deploy.yml`, so `main` must build. Never touch the `deploy`/`ops` users or CoiledSpring on the box. Runbook: @deploy/README.md.
