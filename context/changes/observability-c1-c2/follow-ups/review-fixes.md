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
