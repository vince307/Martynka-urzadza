---
change_id: health-lines-and-smoke
title: What the parent panel and the deploy smoke say about pictures, sound and offline (audit sweep slice 3)
status: preparing
created: 2026-10-17
updated: 2026-10-17
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** audit sweep 2026-10-16, slice 3 of 3 (pictures, sound, offline, deploy smoke — what the
panel and the smoke say), autonomous run `2026-10-16-audit-sweep`. Scope list:
`context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md` § Slice 3 (ids authoritative, labels not); per-finding
evidence: `triage-A.md`, `triage-B.md`, `triage-C.md` in the same folder; primary sources (audit reports under
`context/audits/observability/`):

- `2026-10-14_0445-eksport-import-reset-widzety-obrazki.md` (S14-05, S14-06, S14-08)
- `2026-10-14_1110-obrazki-zastepcze-import-reset-zablokowanego-zapisu.md` (ASL-02..08)
- `2026-10-15_2010-salon-grafika-remap-ladowanie.md` (M-4, M-5, L-3, L-8)
- `2026-10-15_2217-zapis-v3-ladowanie-grafiki.md` (A-3, A-4, A-5, A-7, A-9, A-11, and its P-4)
- `2026-10-16_0915-start-dzwieki-grafika-salon.md` (B-3..B-6, S-2, S-7, S-9, S-10, G-2, G-3, G-5..G-7, R-2, R-3, R-5,
  R-6, P-1..P-6)
- `2026-10-16_1419-stara-karta-offline-obrazki-dzwieki.md` (O-1..O-5, U-1..U-3, M-1, M-2)
- follow-ups of `context/archive/2026-10-16-stale-tab-and-health/` (FU-16; FU-10..FU-13 are the audit rows above)

No roadmap status edits (no matching row in `context/foundation/roadmap.md`).

**Id note (ids collide across audits; the audit named per id below is the one meant).**
- `P-1`, `P-2`, `P-3`, `P-5`, `P-6` = the **2026-10-16_0915** ids (service worker umbrella, rollback room check, HEAD
  per precache entry, `ADD` listener `try`, `E2E_BOOT_LIMITS` marker). The 2217 P-1 was slice 2 (#80).
- `P-4` in "S14-06/P-4 (task + UI art in check:deploy)" = the **2026-10-15_2217** P-4 (its deploy/ half — a
  `SAVE_VERSION` rollback guard in `deploy/martynka-deploy` — is out, see Deferred). The 0915 P-4 (smoke error
  without the path) is in the same file and is taken too (S, `scripts/` only).
- `M-1`, `M-2` = the **2026-10-16_1419** ids (locked audio line; probe that `localStorage` keeps the sound choice). The
  2010 M-1/M-2 are FIXED (#65).
- `M-4`, `M-5`, `L-8`, `L-3` = the **2026-10-15_2010** ids. `L-3` is the same item as 2217 A-3, 0915 B-5, 1419 U-3 and
  0445 S14-08 (one `loaderror` line labelled by table, with URL and status).
- `A-*` = **2026-10-15_2217**. `S-*`, `G-*`, `R-*`, `B-*` = **2026-10-16_0915**. `O-*`, `U-*` = **2026-10-16_1419**.
- `VG-1` = 1419 O-3 (= stale-tab-and-health follow-up FU-7), not save-truth's visual VG-1.

**Save format.** Stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`). No finding here touches the stored shape:
- M-4 / R-3 add a runtime *note* to the decode result (what the v2→v3 salon step did), never to the saved record —
  the same kind of change as slice 2's `migratedFrom`/`problem` fields. `MIGRATIONS[2]` and its frozen tables stay
  byte-identical (the note is computed beside them).
- R-2 compares a loaded room with the catalogue and logs; nothing is repaired.
- Every other item is runtime registry state (`REGISTRY_KEYS.*`, outside `SAVE_KEYS`), console output, panel copy,
  the deploy smoke or tests.

**Deploy boundary.** Only `scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts` and their test
(`tests/deployCheck.test.ts`) change on the smoke side. Nothing under `deploy/` (scripts, `Caddyfile`, `bootstrap.sh`)
and not `.github/workflows/deploy.yml` (deferred with a trigger below). `vite/config.shared.mjs` is not `deploy/`; it is
touched only if the plan emits a build manifest (see decision 4 — not planned).

**Can the live server satisfy the new smoke checks?** Read from `deploy/Caddyfile` (the template `bootstrap.sh`
installs) and the build config:
- Caddy's `file_server` serves every file under `current` (= `dist/`), and the precache list in `sw.js` is generated
  from that same `dist/` (`workbox.globPatterns` `**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}`), so every entry
  exists on the server of the same release → status 200. `file_server` answers `HEAD` like `GET` (no body); research
  confirms in Caddy's docs/source and the plan falls back to `GET` if not.
- Content types: `.webp` is already checked live today (`architecture-after.webp` → `image/webp`, passing on every
  Deploy run since #72); Go's built-in MIME table also covers `.js`, `.css`, `.html`, `.png`. `.ttf`, `.woff2`, `.m4a`,
  `.ogg` depend on the server's system MIME table, so they get a **status-only** check (type reported, not asserted).
  The `.webmanifest` type is set by hand in the Caddyfile and already checked.
- `index.html` is in the precache: Caddy may answer a canonical redirect for it. Research checks Caddy's
  `file_server` canonical-URI rule; the check accepts 200, or a 301/308 whose `Location` is `/` or `./` for an
  `index.html` entry only.
- Rollback: the per-entry check reads the list from the **served** `sw.js`, so it is right for any release; the
  table checks against HEAD's `TASK_ART`/`UI_ART`/`ROOM_ART` run only when a SHA is given (deploy, not rollback; P-2).
- Proof before merge: unit tests of the pure helpers on a real `dist/sw.js` text, plus a local run of
  `npm run check:deploy -- http://localhost:<run port> ` against `npm run preview` on a run port (not Caddy — the
  difference is the MIME/redirect rules above). The Deploy run's `Smoke check (deploy)` step after the merge is the
  live proof; a FAIL there means the release is already live (P-4 prints that), never a broken site.

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

## Findings re-verified against the repo (branch `feat/health-lines-and-smoke` at `dfc49ae`)

Slices 1 (#79) and 2 (#80) touched in this area only: `src/core/round/artFilter.ts` (ORDINAL rule, G-4 redraw),
`src/ui/widgets/CoinWallet.ts` (OK guard), `src/testing/e2eHook.ts` (save seams, `forcedSkills`), `src/core/rooms.ts`
(`roomStateProblems`, R-4), `src/main.ts` (R-4 warn, `onOlderWriter`), `UIScene`/`settingsPanel` (save lines). None of
them fixed a slice-3 id; every row below was re-read in the current code.

| finding | audit says | repo now (symbols) | in scope? |
|---|---|---|---|
| O-1 / P-3 (med) | `InstallFailed` is a constant; the smoke never asks the server for each precache file | `src/core/swStatus.ts` `INSTALL_FAILED`; `scripts/check-deploy.ts` `main` checks `roomArtCheck` (lists) + one GET of `architecture-after.webp`; no per-entry request | **yes** — (a) smoke HEAD of every precache entry (status, type where the server's table is known). (b) SW `postMessage` of the install error: **deferred** (LOW part, needs a custom SW snippet) |
| P-2 (0915, low) | rollback smoke compares HEAD's `ROOM_ART` and a hard-coded file with an older release | `check-deploy.ts` imports `ROOM_ART`, `get('/assets/rooms/salon/architecture-after.webp')` unconditional; `deploy.yml` runs the smoke on rollback without SHA | **yes** — table checks only with a SHA (no workflow change needed: rollback already omits it) |
| S14-06 / P-4 (2217, med) | task and UI art are never checked in the precache or on the server | only `roomArtCheck(precache, ROOM_ART…)` | **yes** — generalise `roomArtCheck` to `TASK_ART`, `UI_ART`, boot `SOUNDS` urls (SHA only); the per-entry HEAD covers "served". The deploy/ half (rollback version guard) **out** |
| P-4 (0915, low) | a request error loses the path; FAIL line does not say the release is live | `get` rethrows the bare error; final `catch` prints `error.message` | **yes** (S, same file) |
| O-2 (med) | a failed update behind an active worker shows "Gra jest gotowa" + `Kod: InstallFailed` | `stepSw` `state` `redundant` with `status.active` → `phase 'ready'`, `error: INSTALL_FAILED`; `LINES.ready`; `offlineView.ts` prints the code | **yes** (pl: `pl.settings.offline.updateFailed`) |
| O-3 = VG-1 = FU-7 (low) | no `registration.update()` | `registerServiceWorker` never calls it | **yes** (S, same file; throttle from `balance`) |
| O-4 (low) | a `registration.waiting` worker is ignored | `register().then` handles `active`, `installing` only | **yes** |
| O-5 (low) | empty `catch {}` around `onStatus` | `emit` `catch { // the signal is advisory only }` | **yes** |
| B-4 = U-2 = A-11 (med) | files cut by the boot limit never reach "Obrazki"; no load duration | `BootScene.publish` writes `{cut, creates}`; `artHealthView.ts` `createArtHealthView` takes three `ArtHealthView`s only | **yes** (pl; `bootLoad` gains `elapsedMs`) |
| A-5 (med) | "Obrazki" shows counts, never why | `artHealth()` = `{total, missing, missingIds}`; no cause per key | **yes** (pl: main cause + `Kod:`) |
| ASL-02 (med) | count only, "Uruchom grę ponownie" loops, no folder/build, says "napis" though most tasks are skipped | `pl.settings.artMissing(count,total)`; `artHealthView` kinds `ok/missing/unknown` | **yes** (pl: per-folder counts, `__BUILD_ID__` muted line, skipped sentence, no restart advice on a cause that repeats) |
| R-5 (low) | missing room pieces only counted | `createArtHealthView` room line = count | **yes** — folded into A-5 (up to N labels, `balance` number) |
| L-8 (2010, low→listed med) | no test of the 2–3 line view | `tests/artHealth.test.ts` tests `artHealthView`/`sectionState` only; vitest has no DOM environment | **yes** — via a pure lines builder (no new dev dependency, decision 6) |
| A-3 = L-3 = B-5 = U-3 = S14-08 (med/low) | `loaderror` labels room/UI pictures "Task art", no URL/status/kind | `BootScene.preload` `loaderror` listener: font/audio split, else `Task art failed to load: <key>` | **yes** |
| A-4 (med) | a decode failure leaves no app line with a cause | `create()` `artHealth(…, textures.exists)`; no diff between "had loaderror" and "loaded but no texture" | **yes** |
| ASL-07 (low) | health = `textures.exists`, no dimension check | same | **yes** (with A-4, same loop) |
| A-7 = ASL-06 (med/low) | dead `file.type === 'font'` branch, no `document.fonts.check`, no parent line for a fallback font | `loaderror` ternary still has the `font` branch; `grep document.fonts src/` empty | **yes** (pl: one "Obrazki" line) |
| B-3 (med) | the slow line and the total cut run on Phaser's smoothed clock | `armSlow`/`cutTimer` = `this.time.delayedCall`; `elapsed = this.time.now - startedAt` | **yes** |
| B-6 (med) | `totalMs` 50 s vs a 46.6 s cold start; salon queued after sounds | `balance.loader.totalMs` 50000; `preload` order TASK_ART, `queueSounds()`, ROOM_ART, UI_ART | **yes** — reorder (sounds last) + a throttled measurement in research; `totalMs` changes only on that evidence (balance) |
| P-5 (0915, low) | `Loader.Events.ADD` listener without `try` | unchanged | **yes** |
| P-6 (0915, low) | `E2E_BOOT_LIMITS` has no marker string | `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` has no boot-limit marker | **yes** |
| A-9 (med→low) | no e2e with a per-file retry and a stalled task picture through `artFilter` | `load-and-tab-guard.spec.ts` covers `stallall` only; final-art-p2 follow-up "per-file timeout test" | **yes** (e2e) |
| U-1 = G-2 (med) | the fallback chosen (wallet, notebook, miniature, loading) reaches only the e2e hook | `CoinWallet` `walletArt`, `UnlockCard` `firstLoaded(…) ?? icon`, `RoomDoneCard` `miniatureMode`, `LoadingScreen.showArt` — no registry record | **yes** (pl, `layout.ts` key `artFallbacks`) |
| G-3 (med→low) | the miniature of every room is the salon thumbnail | `RoomDoneCard` `UI_ART_KEYS.salonAfter` hard-coded | **partly** — the miniature fallback is recorded by U-1; a per-room thumbnail (`RoomDef.thumbnailKey`) **deferred** (one room today) |
| G-7 (low) | no `?e2eArt=` value for `UI_ART` | `E2EArtSeam` = `missing/corrupt/room/stall/stallall` | **yes** (with U-1's e2e) |
| G-5 (low) | orphan file in `public/assets/ui/` not caught | `tests/uiArt.test.ts` table → file only | **yes** |
| G-6 (low) | a full wallet silently refuses a coin | `stepTrayDrag` `maxTotal` returns `mat` | **deferred** (a new nudge cue with no kit view; same call as WNA-09 in slice 1) |
| M-1 = S-4 (med) | "Muzyka ruszy po pierwszym dotknięciu" however many touches; effects locked never shown | `musicLine` `waiting-unlock` → `waitingUnlock`; `SoundService.play` records `locked` in `log` only; `status()` has `locked` but no touch count | **yes** (pl + `balance.sound.lockedTouches`); WebKit behaviour → [human] tablet row |
| S-2 (med) | quiet rejections drop the name; decode failure caught by name for the whole game | `QUIET_REJECTIONS` has `EncodingError`, `NotSupportedError`; `installErrorBoundary` warns `signal.message` only | **yes** — name + reason in the warn (S); catching the decode at its source is a research question (Phaser drops the `decodeAudioData` promise); if it needs patching Phaser, the names stay quiet and that part is recorded as deferred |
| S-5 (low; fired follow-up FU-10) | music 404/timeout/decode all end as `Music missing` | `startMusic` has no `loaderror` listener | **yes** (S, same file; trigger "next change to `src/ui/sound.ts`" fired) |
| S-7 (low) | invalid stored prefs fall back silently | `parseSoundPrefs` returns defaults; `createSoundPrefStore.read` no warn | **yes** |
| S-9 (low) | a failure during play does not change the count; no-Web-Audio says "12 not loaded" | `setMissing` only from `BootScene.create`; `play` catch → `record(id,'missing')` | **yes** (pl: "no sound on this device" line) |
| S-10 (low) | warn on every failed play | `play` catch warns each time | **yes** |
| M-2 (1419, low) | after a restart nothing says the choice is not kept | `REGISTRY_KEYS.soundPrefsKept` written only by `UIScene.applySettings` | **yes** (probe at start) |
| FU-16 (low) | no unit test for `prefsKept` false | none | **yes** (pure `applySoundPrefs`) |
| M-4 = R-3 (2010 med; 0915 low) | the salon migration logs only `Save migrated from vN`; nothing in "Zapis gry" | `main.ts` `start` `console.warn(\`Save migrated from v…\`)`; `DecodeResult` ok = `{session, migratedFrom}`; `legacySalon.ts` returns the value only | **yes** (pl: "Pokój przeniesiony na nowy wygląd"; runtime note, format v4) |
| R-2 (low) | a room whose task list grew past `tasksDone` is not logged | `main.ts` logs migration + `repairCurrentRoom` + R-4 problems only | **yes** (S, beside R-4's warn) |
| M-5 (2010, med) | no e2e of a purchase/stage under `?e2eSave=writefail` | `writefail` only in `save-restart.spec.ts`; `RoomScene` `void saver.flush('now')` | **yes** (e2e only) |
| R-6 (low) | `slotTargets` skips an unreachable slot silently | `RoomScene.slotTargets` `if (at)` | **yes** (hook field + assert) |
| ASL-03 (low) | `minCurrent` keeps exactly `ceil(share·n)` | `withoutArtBlocked` `minCurrent` | **yes** — docs only: a note on design-gaps row 66 (no rule change) |
| ASL-04 = S14-05 (low) | fallback rounds give stand-in results to mastery with no marker | `withoutArtBlocked` returns full buckets; no counter | **yes** — a session counter + console summary only (no mastery change) |
| ASL-05 (low) | no minimum stand-in label size; scale 0 shown at 1 | `ArtImage` `setScale(fit.scale > 0 ? fit.scale : 1)` | **deferred** (child-facing look, needs a tablet check; trigger below) |
| ASL-08 (low, "accept" in triage) | the unlock card may name a step whose art-blocked skills are skipped | unchanged | **deferred** (accept; trigger below) |

Totals: the scope's MEDIUM line = **18 items** (28 ids), all in scope: O-1/P-3 + P-2, S14-06/P-4(2217), O-2,
B-4/U-2/A-11, M-1/S-4, U-1/G-2/G-3 (G-3 partly: its record via U-1), S-2, ASL-02, A-3/L-3, A-4, A-5, A-7, A-9, B-3, B-6,
M-4, M-5, L-8. **LOW:** in
scope O-3/VG-1, O-4, O-5, B-5/U-3/S14-08 (with A-3), M-2, P-4(0915), P-5, P-6, S-5 (fired follow-up), S-7, S-9,
S-10, G-5, G-7, R-2, R-3 (with M-4), R-5 (with A-5), R-6, ASL-03 (docs), ASL-04/S14-05, ASL-06 (with A-7), ASL-07,
FU-16. **Deferred** (LOW only): O-1(b) SW error `postMessage`, G-3 per-room thumbnail, G-6, ASL-05, ASL-08, plus the
deploy/ half of 2217 P-4. **Dropped as fixed/obsolete: none** — every slice-3 id is still open at `dfc49ae`.

### New `src/data/pl.ts` strings and `src/data/balance.ts` numbers

Every new line is ours → a DESIGN-GAP row from **139** (next free number in `docs/design-gaps.md`) and the copy read.
- `pl.ts`: O-2 `offline.updateFailed`; B-4 cut line; A-5 cause lines + reuse of `pl.saveFailed.detail` for `Kod:`;
  ASL-02 per-folder count wording, the "tasks skipped" sentence and a non-looping advice variant; R-5 label list
  lead; A-7 fallback-font line; U-1 one muted fallback line (wallet / notebook / miniature / loading); M-1 effects and
  music "urządzenie nie pozwala grać dźwięków" line; S-9 "no sound on this device"; S-5 none (code line reuses
  `detail`); M-4 "Pokój przeniesiony na nowy wygląd" in "Zapis gry"; M-2 reuses the existing `soundPrefsKept` line.
  No new child-facing text (G-6 and ASL-05, the only child-facing items, are deferred).
- `balance.ts`: M-1 `sound.lockedTouches`; O-3 update throttle (`pwa.updateEveryMs` or similar); R-5 label cap;
  P-3 smoke concurrency stays in `scripts/` (not `balance`); B-6 `loader.totalMs` only if the measurement says so.
- `layout.ts`: `REGISTRY_KEYS.artFallbacks` (U-1), possibly `fontHealth` (A-7); runtime only, never in `SAVE_KEYS`.
- No curriculum, word-template or generator content → no teacher read of tasks beyond the gate's `sample` run; the
  copy read of the new `pl.ts` lines still applies (`src/data/` is touched).

### Design-kit binding (profile § 6)

- `Martynka-urzadza.md` § 9 (PWA: offline after the first launch, silent update at the next launch), § 10 (art
  naming and placeholders drawn in code), § 8 (save — for M-4's line) and PRD FR-003 bind the offline and art items.
- `designs/martynka-maths-A-v1/screenshots/` has **no** parent-panel view: every new line in "Obrazki", "Dźwięki",
  "Gra bez internetu" and "Zapis gry" is a **DESIGN-GAP** inside the existing components (`src/ui/dom/overlay.ts`
  `createText`, `artHealthView.ts`, `offlineView.ts`, `settingsPanel.ts` sound section, `saveHealthView.ts`), never a
  new view or style. Existing gap rows revisited: 66–68 (stand-in, "Obrazki"), 114 (sound), 118 (offline), 119
  (screen pictures), 120–121 (music line, prefs kept). The loading screen (`LoadingScreen`) gets no new text.
- Copy source: `src/data/pl.ts` sections `settings` (`artHeading`, `artOk`, `artMissing`, `roomArt*`, `uiArt*`,
  `offline.*`, sound lines), `saveFailed.detail`.

### E2E candidates (E2E=on)

M-5 (purchase + stage under `?e2eSave=writefail`, failing line in "Zapis gry"), A-9 (one stalled task picture with
one retry → skipped skill / stand-in, cause line in "Obrazki"), U-1 + G-7 (`?e2eArt=ui` → fallback line, wallet
`drawn`, book fallback, drawn miniature), B-4 (`stallall` → cut line), R-6 (empty `unreachable`). The smoke, the
service-worker reducer, the sound rules and the lines builders are pure → unit tests.

## Open follow-ups whose `Trigger:` names this area

| follow-up (archive) | trigger | take |
|---|---|---|
| G-2, G-3, B-4, B-5 (stale-tab-and-health) | next change to `BootScene.preload` or `artHealth` (fired) | **in** — U-1, B-4, A-3; G-3 per-room thumbnail deferred |
| S-2, S-4, S-5, S-7, S-9 (stale-tab-and-health) | next change to `src/ui/sound.ts` / `src/core/sound.ts` (fired) | **in** — all five (S-4 via M-1) |
| S-10 warn once (stale-tab-and-health) | next change to `SoundService.play` (fired) | **in** |
| P-2..P-6 (stale-tab-and-health FU-13) | — | **in** (0915 P-2..P-6) |
| M-6 second half / P-6 (salon-extra-slots) | next change to the deploy smoke (fired) | **in** — per-entry HEAD (P-3) and the boot-limit marker (P-6) |
| M-6 (salon-load-health) check:deploy counts room art | next change to `check-deploy.ts` (fired) | **in** — generalised to all art tables (S14-06) |
| A-3, A-4, A-5, A-7, A-8, A-11 (load-and-tab-guard) | next change to the `loaderror` listener / `BootScene.preload` / `artHealthView.ts` / `artHealth.ts` (fired) | A-3, A-4, A-5, A-7, A-11 **in**; **A-8** (silent retry count) **in if** A-9's e2e needs the retry visible, else carry (trigger "next change to the loader retry settings" not fired) |
| A-6 per-file limit by size (load-and-tab-guard) | [human] throttled Android measurement | out — not fired; B-6's measurement may feed it |
| impl-review F3 slow-line timer constant (load-and-tab-guard) | next change to `BootScene.preload` timers | **obsolete** — `armSlow` already decides from elapsed time; B-3 rewrites the timers anyway |
| L-3, L-6, L-7, L-8, M-4 (salon-load-health) | parent report / next change to `artHealthView.ts` (fired) / `salon-art.spec.ts` | L-3, L-8, M-4 **in**; L-6 **fixed** (#75 `sectionState`); L-7 (per-layer state in the hook) out — `RoomLayer`/`salon-art.spec.ts` not changed, carry |
| F4 "Obrazki" hides the salon line while task-art health is unknown (final-art-salon) | next change to the "Obrazki" section (fired) | **in** — the lines builder shows each known line |
| Art-health set: UI art not counted (final-art-p2) | — | **obsolete** — #75 G-1 added the third line |
| ASL-02..09 (save-reason-and-recovery; final-art-p2) | next change to `artHealth.ts`, `artFilter.ts`, `ArtImage` stand-in text (fired for `artHealth.ts`) | ASL-02, -03 (docs), -04, -06, -07 **in**; ASL-05, ASL-08 deferred (below); ASL-09 accepted by design (scope) |
| S14-05 (art-stand-in-and-load-signal) | parent report of money/mass/capacity among the weakest while "Obrazki" shows missing | **in** as the ASL-04 counter (no mastery change); the mastery exclusion stays with that trigger |
| Per-file timeout test (final-art-p2; salon-extra-slots) | next change to `balance.loader` or the boot queue (fired by B-6 reorder) | **in** — = A-9 |
| `FontFace` load limit (final-art-p2) | field report of a stuck start / next change to `BootScene` font loading | **in if** A-7 touches the font load itself; the check in `create()` does not, so carry |
| Stand-in coin labels under 12 px (e1-shapes-picture-mode) | next change to `ArtImage` or a stand-in seen on a device | out — `ArtImage` not changed (ASL-05 deferred with it) |
| VO3 drawn wallet fallback look (child-flow-guards; final-art-p2) | next change to `CoinWallet` | **fired** by U-1 (the record only) — the look itself needs a kit view; carry |
| Music not ducked; both formats precached; silent switch (final-sound) | parent report / precache weight / maintainer | out — not fired |
| Music `loading` while locked (final-sound) | parent report | **obsolete** — S-3 (#75) `waiting-unlock` |
| Texture atlas; app icon PNG size (final-art-salon, final-art-p2) | precache over budget / second room | out — not fired (the smoke now reports the precache size as a detail, which may fire it later) |
| Wallet / loading / book art from the author (final-art-salon, e1-shapes) | author delivers art | out — delivered or not fired |
| T-1 prevention by a SW `activate` reload (save-truth #21) | parent report / a decision to change the write rule | out — not fired; O-3/O-4 do not reload pages |
| SV2-08 / M-S1 deploy-side rollback guard (save-truth #18) | a human change to `deploy/` | out — never shipped by a run (= the deploy/ half of 2217 P-4) |
| `audio.noAudio` and audio rejections (observability-c1-c2) | S-16 / first sound | **fired** — S-2 is its continuation (name in the log, source catch researched) |

## Deferred, each with a trigger

- **O-1 (b) install error name from the service worker** (`importScripts` snippet `postMessage`-ing the Workbox
  install error). Trigger: an "InstallFailed" report from a device while the smoke's per-entry check passes.
- **2217 P-4 deploy/ half: refuse or warn on a rollback to a lower `SAVE_VERSION`** in `deploy/martynka-deploy`.
  Trigger: a human change to `deploy/` (profile § 5; same as save-truth follow-up #18).
- **G-3 per-room thumbnail** (`RoomDef.thumbnailKey`, the child's own pieces with stand-ins). Trigger: a second room
  in `src/data/rooms.ts`.
- **G-6 nudge when a full wallet refuses a coin.** Trigger: a kit view or author note for a refused drop, or the
  [human] tablet row 10.4 showing children confused by the dimmed tray.
- **ASL-05 minimum stand-in label size.** Trigger: the next change to `ArtImage` stand-in text, or a stand-in seen on
  a real device under 12 CSS px.
- **ASL-08 unlock card for a step whose skills are art-blocked.** Trigger: a parent report of an announced skill
  that never appears while "Obrazki" shows missing pictures.

## Autonomous decisions

1. **Next step `/10x-research health-lines-and-smoke`** (step prompt), not `/10x-plan`. Why: ~20 MEDIUMs across the
   smoke, the service-worker lifecycle, the Phaser loader, Web Audio and three panel sections, with four open
   questions only the code/docs answer (Caddy `HEAD`/`index.html` behaviour, Phaser's decode path for images and
   audio, whether a font failure fires `loaderror`, a throttled cold-start time). Would change: nothing — fixed by the
   orchestrator.
2. **Six LOW items deferred** (list above), every MEDIUM kept. Rejected: all LOWs in. Why: the in-scope set already
   maps to ~12–13 phases (smoke; SW status; loader log + decode/dims; boot record + wall clock + order; font check;
   "Obrazki" lines; fallback record + `?e2eArt=ui`; sound lines; S-2 + prefs probe; salon note + room growth;
   e2e M-5/A-9; small LOWs). The deferred ones are child-facing looks without a kit view (G-6, ASL-05), dormant
   with one room (G-3), accepted by triage (ASL-08), or need a custom service-worker or `deploy/` change. Would
   change: plan-review finding the plan over 14 phases → next to defer: R-6, ASL-04, S-7 (in that order).
3. **O-1 split: smoke now, SW-side error name deferred.** The audit calls the smoke the only way to catch a 404 before
   devices do; the SW snippet is marked optional. Would change: research finding `vite-plugin-pwa` offers the
   install-error message without a custom snippet (then it joins the SW phase).
4. **Expected art from HEAD's tables only with a SHA; per-entry status from the served `sw.js` always.** Rejected:
   emitting `dist/expected-assets.json` at build (needs a `vite/` change and a new served file the old releases lack).
   Why: covers P-2 with no build change and stays right on rollback. Would change: the Deploy workflow starting to
   pass the rolled-back SHA (then the table checks would have to read the served release's list).
5. **Content-type asserted only for extensions Go's built-in MIME table knows** (js, css, html, png, webp; the
   manifest is set by hand); fonts and audio get status only. Why: the smoke must pass against the current server
   without a Caddyfile change. Would change: research confirming the VPS's system MIME table (or a future Caddyfile
   change, out of this run) covers ttf/woff2/m4a/ogg.
6. **L-8 through a pure lines builder** (`core`), the DOM function a thin renderer — no `happy-dom`/`jsdom` dev
   dependency. Why: the repo tests panel views this way (`saveHealthView`, `offlineView`, `progressView`); a new test
   environment is a separate decision. Would change: the maintainer adding a DOM test environment.
7. **B-6: reorder first (sounds after the salon and UI pictures), `totalMs` only on measured evidence.** Why: the
   triage sketch says "measure first"; the reorder is free and puts the child-visible pictures ahead of effects.
   Would change: research's throttled run showing the reordered cold start still over `totalMs` → raise it in
   `balance.ts` with the measurement in the plan.
8. **S-2 kept in although the full fix may need Phaser internals.** The S part (log the name and reason) is certain;
   catching the decode rejection at source is researched and, if it needs a Phaser patch, recorded as a deferred
   item instead. Would change: research finding a public Phaser 4.2.1 hook for the decode failure.
9. **M-4/R-3 as a runtime decode note, not a save field** (save stays v4). Why: the note describes what this load did;
   it is gone after the next write, which is exactly when it stops being true. Would change: a requirement to show
   the line on a later launch (then it would need state outside the save, like slice 2's backup-status record).
10. **M-1 counter in the sound service, threshold in `balance`**; WebKit truth is a [human] tablet row. Why: Chromium
   e2e cannot reproduce a never-unlocking context; the rule is pure and unit-testable. Would change: research finding
   Phaser exposes the unlock failure directly.
