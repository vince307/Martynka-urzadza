# Follow-ups — observability-c1-c2

Each item has a `Trigger:` line; later slices grep for it.

- Add risk #15 (a thrown exception leaves a frozen screen or dead touch) to the test plan. Trigger: /10x-test-plan refresh
- Calibrate the step unlock after H-7 (no penalty for a miss; unlock at 60-70 % accuracy, about 25-35 rounds). Trigger: S-17
- The error card must promise a return to saved progress once saving exists (today a restart ends the session). Trigger: S-11
- Show "mastered k / ceil(n/2)" to a parent. Trigger: S-17 or a parent's feedback
- F5: the hold state with an overlay after which the game continues. Trigger: any non-terminal overlay that suspends input
- `audio.noAudio` and audio rejections are not covered by the boundary. Trigger: S-16 or the first sound
- Audit findings M-1, M-2, M-13, H-3, H-4 stay open. Trigger: next change to TaskScene / narrator
- Review the noise list (`AbortError`, `NotAllowedError`): IndexedDB rejects an aborted transaction as `AbortError`, so a real save failure would only be a `console.warn`. Trigger: S-11 or the first promise the app itself awaits
- Take the hand-over in `BootScene.create` out of Phaser's font promise: its `.catch` swallows the original start exception as "Font failed to load" and the card is raised by a secondary `TypeError`. Trigger: S-11 or the next change to BootScene
- Closed: S-06 "`mountInstallHint` lets a tap through", S-05 hook targets in the room (evidence in research.md).

## From impl-review (2026-10-13)

- F2 (fixed in a2472cf): no suite caught the C-2 wiring regression (a dialog callback outside `session.run`); `tests/dialogSessions.test.ts` now pins it. Extend `DIALOG_CALLBACKS` and the expected counts when a scene gains a new parent dialog. Trigger: any new dialog callback in `src/scenes/`
- F3: `installErrorBoundary` `signalOfRejection` calls `String(reason)` outside the handler's try; a rejection whose reason cannot be stringified (e.g. `Object.create(null)`) throws in the listener. The resulting `error` event still raises the card (bounded, no loop), but the original reason is not logged. Wrap the mapping in the try. Trigger: next change to `src/ui/dom/errorBoundary.ts`
- F4: `WelcomeScene.openParent` guards on `this.session` while `UIScene.openSettings` guards on `this.session?.active()`; after a callback throw the welcome scene can never reopen the parent path (harmless today: the error card is final). Align on `active()`. Trigger: S-11 (a non-final error path) or the next change to WelcomeScene
- F5: `pl.settings.noVoice` tells the parent that reading starts "when a voice appears" but not how to get one (system settings, Polish voice pack). Trigger: a parent's feedback or the first Android test (row 5.9)
