# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-research` step of run `2026-10-14-fix-art-stand-in`. Research is complete (`research.md`, status
`complete`); no product code changed. The next agent must not put an art-aware check into `playable` (it would shift step
numbering and unlock) and must keep `textures.exists` after load as the one art-health signal (decode failures emit no
`loaderror`).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | 2 on the branch after this step (`a2baebb` change identity, + `docs(art-stand-in-and-load-signal): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`, 2026-10-14) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three change files staged by path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-stand-in-and-load-signal/research.md` | Answers (a)–(g): Phaser decode path, art-dependent skills per step and round-building plug-in, stand-in labels from data + fit pattern, parent art-health line, S12-01 behaviour per `blockedBy`, `?e2eArt` seam, spoken test timeouts |
| `context/changes/art-stand-in-and-load-signal/change.md` | Frontmatter only: `status: new → preparing`, `updated` (metadata guard) |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `npx vitest run tests/spoken.test.ts --reporter=verbose` | passed alone; `forEachTask` tests 461 ms / 285 ms / 416 ms (no timeout arg) and 1436 ms (the `30_000` one). Baseline (contract): first one 5.3 s under full-suite load |
| Phaser source read (`File.onProcessError`, `Config.loaderImageLoadType`) | confirmed in this step: decode failure logs `console.error` and calls `fileProcessComplete` without `FILE_LOAD_ERROR`; image load type defaults to `'XHR'`; `src/main.ts` sets no `loader` config |
| lint / typecheck / full unit / build / e2e | not run: research step, no product code changed |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan art-stand-in-and-load-signal`

## 5. Open

- Plan choices left open (research.md "Open Questions"): (1) art-skill filter scope (answer-only-on-art kinds MONEY_COUNT, MASS, CAPACITY toLitres vs all art kinds) and accepting that `unlockReady` cannot pass E2.2/E5.5 while art is missing; (2) `unreadable`: raw-copy button in the import/reset dialogs (needs `raw`/`reason` kept at runtime, today only in the `mountSaveFailedCard` closure in `src/main.ts`) or a warning line only; (5) label size in the 84 px weight box and the 190 px solution area (visual gate with `?e2eArt=missing`).
- Steps entirely made of art skills: E1.10, E2.2, E5.5 (`src/data/curriculum/E1.ts`, `E2.ts`, `E5.ts`); a filter must fall back to the unfiltered pool (`pickRoundSkills` and `pickSkills` in `src/core/round/pick.ts` throw `RangeError` on empty pools).
- DESIGN-GAPs to write (plan/implement): revise row 66 (`docs/design-gaps.md`), new row for the "Obrazki" line in the parent panel, new row or revision of 48/49 for the "Teraz" replacement text.
- Follow-ups to close in this change: `BootScene.preload` `loaderror` (archive `2026-10-14-art-tasks-all-stages`), "Import or reset over an unreadable save (impl-review F1)" (archive `2026-10-13-save-export-import-reset`). New follow-up candidate: `UIScene.openExport` exports `saver.current()` (fresh session) while `blockedBy === 'unreadable'` (S12-04 neighbour, out of scope).
- Unverified: whether `vite preview` answers a missing `.webp` with an HTML 200 fallback; the recommended seam (`missing` = skip `load.image`, `corrupt` = a non-image URL that exists) does not depend on it.

## 6. Autonomous decisions

1. **Research questions taken from the step prompt (a)–(g) and change.md decisions 2–7; no question asked.** Rejected: re-scoping. Why: contract rule 1 and the step prompt fix the scope. Would change: none in this step.
2. **Delegated two read-only sub-agents (Phaser loader path; art-dependent skills and round building), spot-checked their key claims in the main context** (`File.onProcessError`, `RangeError` sites, `buildWarmup` location, generator prompts). Rejected: a single local sweep. Why: skill step 2 defaults to parallel delegation for multi-area scope. Would change: a sub-agent claim failing the spot check.
3. **Recommended `textures.exists` per `TASK_ART` key in `BootScene.create` as the one art-health source** (confirms change.md decision 4). Rejected: `load.totalFailed` / `complete` event args (blind to decode failures on the XHR path). Why: the Phaser source shows no texture is registered on either failure and no event fires on decode failure. Would change: the game switching to `loader.imageLoadType: 'HTMLImageElement'` (then `loaderror` would also catch decode failures, but `exists` stays correct).
4. **Recommended a round-level art filter with a fallback to the unfiltered pool, not a change to `playable`.** Rejected: art-aware `playable` (shifts `playableSteps`/`currentStep`/`unlockReady`). Why: three all-art steps would be skipped in progression. Would change: the plan choosing to drop layer 2 entirely (the Polish label already makes the task solvable; the audit says S14-01 falls to high with it).
5. **S12-01 recommendation: refuse `replace` and the dialogs' actions on `unavailable` (incl. `timeout`); warn and allow on `unreadable`; no store re-read.** Rejected: re-reading the store in the dialog (new async I/O without a limit, S12-02). Why: a `timeout` may hide a healthy save; "postęp nigdy nie ginie". Would change: an iPad N-7 measurement showing frequent `timeout` on a healthy store.
6. **Spoken tests: recommend `30_000` on all three `forEachTask` tests without a timeout**, measured 285–461 ms alone vs 5.3 s under load for one of them. Rejected: global `testTimeout`. Would change: a full-suite measurement showing only one near 5 s.
7. **E2E seam `?e2eArt=missing|corrupt` in the hook build, not `page.route`.** Why: no `serviceWorkers: 'block'` in `playwright.config.ts`; the service worker precaches all `.webp`. Would change: the plan adding `serviceWorkers: 'block'` for one spec.
