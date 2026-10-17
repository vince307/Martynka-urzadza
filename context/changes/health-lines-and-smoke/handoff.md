# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-research` step of run `2026-10-16-audit-sweep` (slice 3 of 3). Research is complete; no plan yet.
Do not get wrong: the live server types **every** precached extension correctly (ttf/m4a/ogg included) and answers
404 for a missing file, but local `vite preview` answers a missing file with **200 `text/html`** — the per-entry smoke
must assert the content type, and must never assert `content-length` on HEAD (compressed HEAD reports 13).

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | 2 (`af4ddec` change identity, + this research commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (via `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (`dist/` rebuilt locally, gitignored) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/health-lines-and-smoke/research.md` | per-finding root cause / smallest fix / first failing test / risk for every in-scope id (smoke, SW, loader + art health, sound, save notes + room); live-server table (18 requests); Phaser 4.2.1 facts from installed source; open questions; recommended 10-phase grouping |
| `context/changes/health-lines-and-smoke/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/health-lines-and-smoke/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/health-lines-and-smoke` |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` 121 precache entries |
| live `curl` (GET `sw.js`, HEAD per extension, HEAD/GET with compression, `www`) — 18 read-only requests | all 200 with expected types; `/index.html` 200 (no redirect); missing → 404; `www` → 301 apex; table in research.md |
| `npx vite preview --config vite/config.prod.mjs --port 4398` + HEADs, server killed (`lsof -ti tcp:4398 -sTCP:LISTEN` empty) | same types; `no-cache` everywhere; missing file → 200 `text/html` |
| Phaser source spot-checks (`LoaderPlugin.nextFile`, `ImageFile.onProcess`, `FontFile.onProcess`, `AudioFile.onProcess`, `WebAudioSoundManager.unlock`) | worker claims confirmed |
| Gate (lint, typecheck, tests, e2e) | not run — research only, no code changed |

## 4. Next command

`/10x-plan health-lines-and-smoke`

## 5. Open

- Choice for the plan: O-3 `registration.update()` mid-session with `skipWaiting` + `clientsClaim` takes over the open
  page (vs plan § 9 "silent update at the next launch") — accept or call only at launch (research Open question 2).
- Local proof run of `check:deploy` against `vite preview` fails the existing immutable check (`check-deploy.ts` `main`
  `cacheControlCheck(…, 'immutable')`) — plan skips it for localhost or expects it (Open question 1).
- S-2 source catch needs the internal seam `file.config.context` (wrap `decodeAudioData`) pinned in
  `tests/phaserLoaderPin.test.ts`; if the plan rejects it, the quiet names stay and the part is deferred (decision 8).
- A-7 and S-2 rely on browser behaviour from spec (`document.fonts` status, unhandled decode rejection) — their e2e
  verifies it.
- B-6: no cold-start measurement exists (46.6 s is a byte count, unchanged at 2 329 739 B); `balance.loader.totalMs`
  stays; a throttled measurement is a [human]/optional row.
- [human] M-1 on a real iPad (never-unlocking audio context).
- DESIGN-GAP rows from 139 for every new `pl.ts` line; deferred LOWs from `change.md` § Deferred go to
  `follow-ups/review-fixes.md` in the plan.
- Known e2e load flakes: `money-pay` #11, `final-art-loading` #15, `child-flow-guards` #2.

## 6. Autonomous decisions

1. **Scope taken from `change.md`, no interview** (contract rule 1). Would change: nothing.
2. **Three parallel read-only workers** (smoke/SW, loader/art, sound/save); decisive Phaser claims re-checked in
   source by the main session. Would change: a contradiction between worker and source (none found).
3. **18 live requests** (limit ~30), read-only, one file per precached extension rather than all 121. Rejected: HEAD of
   every entry (that is the smoke's job, and `check:deploy` is forbidden here). Would change: a type mismatch on one
   sample (then sample the whole extension).
4. **Decision 5 of change.md superseded by evidence**: assert content type for all nine extensions (live server types
   ttf/m4a/ogg). Would change: a server MIME change (out of this run).
5. **Decision 3 (O-1 b deferred) confirmed**: `vite-plugin-pwa` 2.0.0 `registerSW` exposes only register/import errors
   and its autoUpdate reloads the page. Would change: a plugin hook for install errors.
6. **B-6: reorder only, no `totalMs` change** (decision 7): no measurement. Would change: a throttled run over the limit.
7. **Recommended 10 phases** (research.md end). Would change: plan-review over 14 phases → defer R-6, ASL-04, S-7.
