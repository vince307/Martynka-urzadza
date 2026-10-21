# Screenshots for the post-run-polish visual gate (plan rows 3.5, 6.5)

Captured on 2026-10-21 on `f6c3fb4` (the build id in every frame).

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npx vite preview --config vite/config.prod.mjs --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in `tests/e2e/visual.local/` (gitignored), reusing `tests/e2e/support/{welcome,hook}.ts`, with its own config (no `webServer`, `hasTouch`, `pl-PL`, `Europe/Warsaw`, service workers blocked) and two projects: `desktop` 1440×900 and `tablet` 1024×768. After the run the folder was moved out of the repo and the server stopped.

Claude in Chrome was not used: the settings panel opens only after a 2 s hold on the canvas gear, which the extension cannot drive (profile § 8), and the frames must be saved as files in this folder. Every state was reached through the product: the parent path of the welcome screen (adult gate typed on its pad, age "10+", stage "Klasa 1, I półrocze"), real touch taps on the answer tiles and "Dalej", the gear hold and the gate for settings. Nothing writes to IndexedDB. The e2e switches used: `?e2eSkills=<id>` (forces the skill of the round), `?e2eVariant=off`, `?e2eArt=stallall` with the money pictures, the task font and the salon files held by the route (as `tests/e2e/load-and-tab-guard.spec.ts` does).

The speaker button is absent from the HUD in these frames because the capture silences speech (no voice offered).

Frames are PNG, viewport-sized.

## Kit reference

`designs/martynka-maths-A-v1/screenshots/task-tiles.png` (a question line at the top of the task card, tiles below) and `tablet-1024.png`. The kit has no "Wstaw znak"/"Uzupełnij"/"Oblicz" heading (DESIGN-GAP 154) and no settings panel (DESIGN-GAP 67, 140, 153).

## Frames

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| Sign task, two numbers: "Wstaw znak" over "a □ b", tiles < > = (3.5) | `desktop-heading-sign.png` | `tablet-heading-sign.png` | `?e2eSkills=E1.2.compare_num_5`, first task |
| Sign task, two expressions (COMPARE_EXPR) (3.5) | `desktop-heading-sign-expr.png` | `tablet-heading-sign-expr.png` | `?e2eSkills=E1.7.compare_expr_10`, first task |
| Sign task, missing operator (MISSING_OP), tiles − + (3.5) | `desktop-heading-sign-op.png` | `tablet-heading-sign-op.png` | `?e2eSkills=E1.9.missing_op_10`, first task |
| Box-filling task: "Uzupełnij" (3.5) | `desktop-heading-fill.png` | `tablet-heading-fill.png` | `?e2eSkills=E1.3.missing_5`; the first task whose heading was "Uzupełnij" (desktop: the second, the first was a trailing `= □` → "Oblicz") |
| Ordinary task: "Oblicz" (3.5) | `desktop-heading-calculate.png` | `tablet-heading-calculate.png` | `?e2eSkills=E1.3.add_sub_5`, first task |
| Word task: no heading (3.5) | `desktop-heading-word.png` | `tablet-heading-word.png` | `?e2eSkills=E1.5.word_9`, first task |
| Settings "Obrazki" after a cut start (6.5) | `desktop-art-cut.png` | `tablet-art-cut.png` | `?e2eArt=stallall&e2eVariant=off`, held money/font/salon files, parent path (stage E3); gear hold + gate; the section scrolled to the top of the panel |
