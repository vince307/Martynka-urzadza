# Follow-ups — audit-backdrop-fox

Each entry has a `Trigger:` line; later slices grep for them.

## Open

- F1 `SalonBackdrop.pixel()` returns `null` under the Canvas renderer, so the e2e pixel proof exists for WebGL only.
  Trigger: a Canvas-renderer report or an e2e project that runs on Canvas.
- F2 A real device losing its WebGL context (tablet asleep, app switch) is unproven; the e2e forces `WEBGL_lose_context`.
  Trigger: a playtest note of a plain page after the tablet slept or switched apps.
- F3 FU-NP 16 remainder from notebook-polish: `Keypad`, `starBurst` and `barSpan` parts stay open (the filter-camera part is closed by the Phaser pin).
  Trigger: the next change to `starBurst`, `Keypad` or the bar layout.
- F4 WelcomeScene carried follow-ups (autosave F4 and observability F4 `openParent` guard; parent-settings F6 suspender cast) were not touched by this change.
  Trigger: a non-final error path in WelcomeScene or the next change to `WelcomeScene.openParent`.
- F5 Generic triggers on `artHealth.ts` / `artHealthView.ts` stay open as recorded (load-and-tab-guard A-5, A-11; salon-load-health; audit-boot-hidden-tab; post-run-polish; save-reason-and-recovery ASL-02..09; stale-tab-and-health G-2, G-3, B-4, B-5).
  Trigger: unchanged, as cited in those changes.

## Closed

- narrator-round-summary hook follow-up ("`null` targets while the room is open"): already handled in `src/testing/e2eHook.ts` `targets`.
- fox-guide F6 (a missing fox not named in "Obrazki"): closed by this change (audit finding G-1, PR #104).
