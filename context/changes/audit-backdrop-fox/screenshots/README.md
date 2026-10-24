# Screenshots for the audit-backdrop-fox visual gate (plan row 4.9)

Captured on 2026-10-24 on `e8c1181` (the build id in the corner of every frame). Frames are JPEG (quality 82), viewport-sized: desktop 1440×900, tablet 1024×768. 12 frames per width, 24 in all. No kit frame: the kit has no context-loss state and no parent text for a missing fox (DESIGN-GAP 168); the before frames are the reference for the after frames.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec and config in the session scratchpad (outside the repo, not committed), reusing `tests/e2e/support/{welcome,hook}.ts`: no `webServer`, `hasTouch`, service workers blocked, one worker, two projects (`desktop`, `tablet`). Every test ran in a fresh browser context (no shared IndexedDB). Claude in Chrome was not used (step prompt: a Chrome tab got stuck on the slow-save card in the last run, and the context loss needs `page.evaluate`).

Context loss: `canvas.getContext('webgl').getExtension('WEBGL_lose_context')`, `loseContext()`, wait for `isContextLost()`, then `restoreContext()` (the helper of `tests/e2e/backdrop-restore.spec.ts`). A missing picture: `page.route('**/assets/ui/<file>', abort)`. Settings: the gear hold and the adult gate (`openSettings`), then the "Obrazki" heading scrolled to the top of the panel.

## Frames

| State | Desktop 1440 | Tablet 1024 | How reached |
|---|---|---|---|
| Welcome, before a loss | `desktop-welcome-before.jpg` | `tablet-welcome-before.jpg` | `?e2eMonth=9`, backdrop `drawn` |
| Welcome, after lose + restore | `desktop-welcome-after-restore.jpg` | `tablet-welcome-after-restore.jpg` | same page, `redraws` 0 → 1 |
| Task, before a loss | `desktop-task-before.jpg` | `tablet-task-before.jpg` | parent path, `?e2eVariant=off`, phase `first` |
| Task, after lose + restore | `desktop-task-after-restore.jpg` | `tablet-task-after-restore.jpg` | same page, `redraws` 0 → 1 |
| Task before the room trip | `desktop-room-task-before.jpg` | `tablet-room-task-before.jpg` | right answer, phase `done` |
| Room, after lose + restore | `desktop-room-after-restore.jpg` | `tablet-room-after-restore.jpg` | `roomSwitch`, then lose + restore in the room |
| Task, back from the room | `desktop-room-task-after-restore.jpg` | `tablet-room-task-after-restore.jpg` | `resume`; phase still `done` |
| "Obrazki", `fox-think.webp` aborted | `desktop-settings-fox-missing.jpg` | `tablet-settings-fox-missing.jpg` | child path, `?e2eSkills=E1.1.compare_qty_10` |
| "Obrazki", `wallet-open.webp` aborted | `desktop-settings-wallet-missing.jpg` | `tablet-settings-wallet-missing.jpg` | parent path, `?e2eMonth=10` |
| Task, fox pose missing, idle | `desktop-nofox-idle.jpg` | `tablet-nofox-idle.jpg` | `fox-think.webp` aborted, phase `first` |
| Task, fox pose missing, after a miss | `desktop-nofox-miss.jpg` | `tablet-nofox-miss.jpg` | wrong tile, phase `second`, `requested: think` |
| Task, fox pose missing, after a right answer | `desktop-nofox-right.jpg` | `tablet-nofox-right.jpg` | right tile, phase `done`, `requested: cheer` |
