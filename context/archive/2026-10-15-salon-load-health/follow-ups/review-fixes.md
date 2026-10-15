# Follow-ups — salon-load-health

Each item has a trigger line; later slices grep for it. Source ids are from the observability audit 2026-10-15_2010 unless noted.

- **M-4: full `console.warn` of the salon migration and one sentence in "Zapis gry"** (`{from, to, dropped, gifted}`, "Pokój przeniesiony na nowy wygląd") beyond the existing "przeniesiono z wersji N" line.
  Trigger: a parent report of a changed room after an update
- **M-5: e2e of a purchase and of the stage under `?e2eSave=writefail|writehang`**, optionally an "unsaved purchase" runtime status.
  Trigger: a parent report of lost purchases, or a change to the purchase flow in `RoomScene`
- **M-6: `check:deploy` counts room art entries in the precache (= `ROOM_ART.length`) and fetches one salon file; `console.warn` on a service worker install error** (`registerServiceWorker` swallows it).
  Trigger: the next change to `scripts/check-deploy.ts` or to the room art set
- **L-3: `Task art failed to load` for room files** (label by `ROOM_ART` membership, add `file.url`).
  Trigger: a parent report of missing room pictures
- **L-4: `try/catch` around `getPixelAlpha` in `RoomScene` `alphaAt`** (null = rectangle fallback, one `console.warn`).
  Trigger: a change to the room hit test or a texture source other than WebP files
- **L-5: separate "Obrazki" sentence when the scene picture (`salon/after`) is missing; first missing label behind the gate.**
  Trigger: a parent report of a plain-block room
- **L-5r: an open variant panel that cannot be drawn (current task is a stage) closes and warns.**
  Trigger: a path that changes the rooms registry under an open panel
- **L-6: `data-state` of the art section is the worse of the task-art and room-art states, or documented.**
  Trigger: the next change to `artHealthView.ts`
- **L-7: `picture|standIn|hidden` per layer in the hook snapshot; a one-file seam.**
  Trigger: the next change to `salon-art.spec.ts` or `RoomLayer`
- **L-8: unit test of `createArtHealthView` with two lines; optional `?e2eArt=roomcorrupt`.**
  Trigger: the next change to `artHealthView.ts`
- **SV2-04 / option B: read `backup-v1` / `backup-v2` from inside the app** (restore without a file export).
  Trigger: a parent report of lost progress after an update
- **E2E on two real builds (old build meets a v3 save and shows `future`)**: needs a second server build.
  Trigger: the next save-format change (v4)
- **F7 / SRR-09 / SRR-01: `replaceGate` for `migration-failed`**: `MIGRATIONS[2]` cannot throw (proved by test), so the rule is unchanged.
  Trigger: a migration step that can throw
- **Mistake example shape in the history**: v3 does not change it.
  Trigger: a save that changes the shape of a mistake example, or S-17
- **Time limit of the second font load (`FontFace`)** in `BootScene`. Impl review: in Phaser 4.2.1 `FontFile` is `FILE_POPULATED` in its constructor, so `File.load` skips XHR entirely and `onProcess` awaits `new FontFace(...).load()` with no limit: the per-file timeout of f4415a5 does not cover the font, which is the one queued file H-2 leaves open (first launch before the service worker has cached it).
  Trigger: a parent report of a blank start, or the next change to `BootScene.preload`
- **WebKit e2e**: no WebKit project in Playwright; the iPad check is a `[human]` row.
  Trigger: a WebKit project in playwright.config.ts
- **Two tabs of one origin** (`BroadcastChannel`): a second tab can overwrite a newer save.
  Trigger: a parent report of lost progress with two tabs open, or the next save-format change (v4)

## From the implementation review (2026-10-15)

- **`isRecord` copied three times** (`src/core/save.ts`, `src/core/saveFile.ts`, `src/core/migrations/legacySalon.ts`); importing it from `save.ts` would make a cycle. A small `src/core/isRecord.ts` would remove the copies.
  Trigger: a fourth copy of `isRecord` in `src/core`
- **The per-file loader timeout in `BootScene` (f4415a5) is guarded only by e2e (c)** of `tests/e2e/salon-load-health.spec.ts`; no unit test or break patch removes the `Loader.Events.ADD` listener alone. It also becomes redundant if Phaser stops giving files an explicit timeout of 0.
  Trigger: a Phaser upgrade, or the next change to `BootScene.preload`
- **A failed copy at start leaves the v3 write waiting for the next change or flush** (`createAutosaver` does not re-arm after a failed `'migration'` attempt; plan-review F8, accepted). The narrower M-2 marker also means a v2 save that was corrupt only in an old-only slot now loads after the step drops that slot (harmless).
  Trigger: a parent report of a migration line that never appears, or the next save-format change (v4)

