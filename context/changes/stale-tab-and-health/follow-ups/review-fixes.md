# Follow-ups — stale-tab-and-health

Each item has a trigger line; later slices grep for it. Source ids are from the observability audit 2026-10-16_0915 unless noted.

- **Earlier stale signal (Web Locks or `BroadcastChannel`)**: v4 refuses at the first write of a stale window; a signal at once would show the card before the child plays on.
Trigger: a parent report of lost progress in a refused window, or the next save-format change
- **Worker build id**: the offline section says a newer version waits but not which one; the service worker could report its build id.
Trigger: a parent report of "newer version" that never arrives, or the next change to `src/pwa/registerServiceWorker.ts`
- **P-8 keep the first `backup-v3`**: a pre-#69 build rewriting v3 over a v4 save makes the next load migrate again and the second copy overwrites the first.
Trigger: a parent report of lost progress after an update, or the next save-format change (v5)
- **E2E on two real builds** (an old build meets a v4 save and shows `future`, a v4 page meets a newer one): needs a second server build.
Trigger: the next save-format change (v5)
- **Order of the `future` and `newer` cards**: both can apply to one start; today the load card wins and the refusal card comes at the first write.
Trigger: a parent report of two cards in a row, or a change to `onBlocked` in `src/main.ts`
- **Settings panel is unreachable while the refusal card holds the one input switch**: the parent cannot open "Zapis gry" to read the `otherTab` line until the card's "Zacznij od nowa" reload.
Trigger: a parent report of a refusal card with no way to read the reason, or a change to `saveRefusedCard`
- **Panel heading alignment** of the new sections ("Gra bez internetu", the third "Obrazki" line) against the older headings.
Trigger: the next visual pass over `settingsPanel.ts`
- **Reload race (plan review F4)**: a write of the previous document of the same tab that lands after the new document's read refuses the first write of the new one and shows the card on a legitimate reload (the restart loses nothing).
Trigger: a parent report of the card after a plain reload, or an e2e spec that reloads and fails on it
- **Stale-window replace (plan review F6)**: import or reset from a window not yet refused uses `replace` (no generation check) and shows that window's loaded save, not the newer stored one.
Trigger: a parent report of an import that replaced newer progress
- **S-2, S-4, S-5, S-7, S-9 (sound)**: the remaining sound findings of the audit, not touched by the sound-section change.
Trigger: the next change to `src/ui/sound.ts` or `src/core/sound.ts`
- **S-10 warn once per id in `SoundService.play`**.
Trigger: the next change to `SoundService.play`
- **G-2, G-3, B-4, B-5 (fallback choice, miniature, cut reason, `loaderror` label)**: the `loaderror` listener still labels every image "Task art failed to load".
Trigger: the next change to `BootScene.preload` or to `artHealth`
- **P-2..P-6 (smoke, `ADD` listener, e2e marker)** of the audit, area `scripts/` and `BootScene.preload`.
Trigger: the next change to `scripts/check-deploy.ts` or `BootScene.preload`
- **Isolation-only red of the `load-and-tab-guard` e2e (#2, P-5)** seen in phase 2: green in the full run, red when run alone.
Trigger: the next change to `tests/e2e/load-and-tab-guard.spec.ts`, or a flake of it in a gate
- **iPadOS home-screen storage may be separate from Safari** (unverified); it does not change the rule (one store, one record), but two "windows" may not share it.
Trigger: a parent report of two copies of the game with different progress, or a WebKit e2e project
- **No unit test for the `prefsKept` false path in `UIScene.applySettings`** (the pure store `write` is covered; the line is view glue).
Trigger: the next change to `applySettings`

## Closed by this change

- `mountInstallHint` tap-through: already holds the input switch (checked in the change, nothing to do).
