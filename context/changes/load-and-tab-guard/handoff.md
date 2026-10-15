# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

Written by the `/10x-research` step of run `2026-10-15-fix-s16bcd`. `research.md` answers every question `change.md` raised. The change is now `preparing`, and no product code was touched. The next agent must not end the boot load with `this.load.reset()` or by stopping the scene. Forced failure through `nextFile(f, false)` / `fileProcessComplete` is the only path that runs `create()` exactly once. P-5 protects the save only from this build onwards.

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | 2 on the branch: change identity + `docs(load-and-tab-guard): research` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/research.md` | source-backed answers: Phaser 4.2.1 loader abort semantics and the recommended forced-failure mechanism (font included), the slow-line rule/number/string/layout, the P-5 guard via idb-keyval `update` (atomic get+put) with a new runtime `BlockReason`, the SW decision (keep `skipWaiting`/`clientsClaim`), the e2e seams |
| `context/changes/load-and-tab-guard/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/load-and-tab-guard/handoff.md` | this handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| source reads (this step) | `BootScene.preload/create`, `LoadingScreen`, `src/core/autosave.ts` (`attempt`, `replace`, `replaceGate`, `withTimeLimit`), `src/storage/idb.ts`, `saveHealth.ts`, `saveFile.ts` `deviceSaveView`, `main.ts` `start`/`createGame`, `e2eHook.ts` seams, `vite/config.shared.mjs`; Phaser `LoaderPlugin.nextFile/fileProcessComplete/reset`, `FontFile.onProcess` re-read after a delegated read; idb-keyval 6.3.0 `update`; `grep "\.abort()"` over the Phaser loader: no hit |
| sizes | `public/assets` 1748 KB (64 WebP), `public/fonts` 120 KB, salon-v2 audio ogg 224 KB / m4a 884 KB (13 files) |
| lint / typecheck / unit / build / e2e | not run: this is a docs-only step and no code changed. The baseline on main 6f5644c is the one stated in the contract; it was inherited, not verified here. |

No deliberate break was made, because this step changed no test or code.

## 4. Next command

`/10x-plan load-and-tab-guard`

## 5. Open

- Choices for the plan (research.md "Open Questions"):
  - Numbers: `balance.loader.totalMs` (~45 s recommended) and `slowAfterMs` (~8 s).
  - Clock: the game loop (`this.time`, recommended) or wall time.
  - What the child sees when the save is `'newer'`: a line for the parent only, or also a calm card with a reload button.
  - Whether queued files (image decode, font) that the limit cuts also emit `loaderror`.
  - Copy for `pl.loading.slow` and `settings.saveOff.newer`. Both need DESIGN-GAP rows in `docs/design-gaps.md`.
- Risk: the forced-failure path relies on Phaser internals (`list`/`inflight`/`queue`, `nextFile`, `fileProcessComplete`, `File.resetXHR`), which are typed as public in 4.2.1. Pin them with the new e2e and a comment that names the version. This is a Phaser-upgrade trigger.
- Risk: a late `FontFace` settle after the file was destroyed leads to an unhandled rejection, which shows the fatal card. The forced path must replace `onProcessComplete` with a no-op before it fails the file (`BootScene`, research §2).
- Risk carried from `change.md`: a tab still running a build from before this change has no guard. Same-version two-tab ordering also stays a follow-up.
- Follow-ups for the plan or review step to write into `follow-ups/review-fixes.md`:
  - A-3..A-11, V-*, P-1..P-4, P-6..P-8 from audit 2026-10-15_2217. P-8 (`backup-v2` overwritten on re-migration) gets the trigger "a parent report of lost progress, or v4".
  - "font promise hand-over in `BootScene.create`": already closed.
- e2e seams to add, in the hook build only, each with a marker in `vite/e2eHookGuard.mjs`:
  - an `e2eArt` value for "many stalled files + font", with short e2e totals;
  - an `e2eSave` value for "a newer save appears after the first write";
  - a `screen: 'loading'` read in the hook `snapshot`.

## 6. Autonomous decisions

- **Forced failure (option b) recommended over `reset()` + a manual `create`, and over a timer that leaves Boot.**
  - Why: `reset()` keeps the scene's once-listener, so a late file runs `create()` twice. Stopping the scene skips `create()`, and with it art health and the handover.
  - What would change it: a Phaser release with a public abort that completes the loader.
- **Game-loop clock recommended for the total limit.**
  - Why: a backgrounded start starts no new downloads, so cutting it on wall time would fail files that never had a chance.
  - What would change it: the plan deciding that a wall-time bound matters more, for example if a hidden start should still end within the limit.
- **A distinct runtime `BlockReason 'newer'` instead of reusing `'future'`** (the audit suggests `future`).
  - Why: `future` is a load-time `loadReason` with its own start card and `replaceGate` branch. A reason that appears mid-session should stay separate.
  - What would change it: the plan showing that reuse is simpler and every consumer stays correct.
- **The guard goes in the store write via idb-keyval `update` (atomic), not as a separate `read()` before `write()`.**
  - Why: there is no window between the check and the put, and it adds no extra round trip outside the transaction.
  - What would change it: `update` misbehaving on iOS Safari's lost connection (the `run` retry path), checked in the plan or impl.
- **Keep `skipWaiting`/`clientsClaim`.**
  - Why: removing them delays updates for a resumed PWA, against FR-003, and does not close the old-tab window for builds already shipped.
  - What would change it: the maintainer preferring "no mixed builds" over prompt updates.
- **No AskUserQuestion was asked.** The scope came from `change.md` and the step prompt.
