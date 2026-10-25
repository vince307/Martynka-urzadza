# Screenshots for the salon-style visual gate (plan row 5.10)

Captured on 2026-10-25 on `8c36703` (the build id in the corner of the notebook frames). JPEG (quality 80), viewport-sized: desktop 1440×900, tablet 1024×768. 17 frames per width, plus one comparison sheet.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. A throwaway spec and config in the session scratchpad (outside the repo, not committed) reused `tests/e2e/support/{welcome,hook,salon}.ts`: no `webServer`, `hasTouch`, service workers blocked, two projects (`desktop`, `tablet`), and every test in a fresh browser context (fresh IndexedDB). Claude in Chrome was tried first: its new tab on 4399 showed the slow-save card ("Zapis wczytuje się bardzo wolno", `Kod: timeout`) because another tab on the same origin holds the IndexedDB save, so the gate fell back to Playwright.

The room is reached the way a child gets there: the parent path on the welcome screen, `?e2eVariant=off`, the first task solved by the long way (two misses, the solution, the retype, which pays no star), then the HUD room switch. Stars come from the hook-only `?e2eStars=N`. The mid cross-fade frames use Playwright's fake clock (`page.clock.install()`, paused 200 ms after the tap, then `runFor`), so the 600 ms `ANIMATION.stageFadeMs` tween is frozen at known times. A real-time burst missed the tween (the first shot came 2.2 s after the tap) and was deleted.

## Frames

| State (row 5.10) | Desktop 1440 | Tablet 1024 | How reached |
|---|---|---|---|
| (g) Welcome backdrop, fresh device | `desktop-welcome-backdrop.jpg` | `tablet-welcome-backdrop.jpg` | `?e2eMonth=9`; hook `backdrop` `drawn`, `blurred`, `graded 10` |
| (f) Task screen, BEFORE salon behind the notebook | `desktop-task-backdrop-before.jpg` | `tablet-task-backdrop-before.jpg` | parent path, phase `first`; `graded 10` |
| (a) Room BEFORE (worn set graded over `architecture-before` + `shadows`) | `desktop-room-before.jpg` | `tablet-room-before.jpg` | `?e2eStars=40`; hook `worn.keys` = 10 pieces, `graded true`, `contactShadows []` |
| (b) Stage purchase, cross-fade at 0 / 150 / 300 / 450 / 700 ms | `desktop-xfade-{0,150,300,450,700}ms.jpg` | `tablet-xfade-{0,150,300,450,700}ms.jpg` | "Odnów ściany i podłogę" tapped under the fake clock |
| (b) Stage purchase under reduced motion, both ends | `desktop-rm-stage-before.jpg`, `desktop-rm-stage-after.jpg` | `tablet-rm-stage-before.jpg`, `tablet-rm-stage-after.jpg` | `page.emulateMedia({ reducedMotion: 'reduce' })`; the after frame 150 ms after the tap |
| (c) Empty AFTER room right after the stage, contact shadows | `desktop-room-after-stage.jpg` | `tablet-room-after-stage.jpg` | hook `worn.keys []`, `contactShadows` lamp-table, plant-left, pouf, plant-right |
| (d) Sofa panel, first look previewed | `desktop-sofa-panel.jpg` | `tablet-sofa-panel.jpg` | "Postaw sofę", first thumbnail |
| (d) After the first furniture purchase (sofa) | `desktop-room-sofa.jpg` | `tablet-room-sofa.jpg` | "Wybieram"; `shown.sofa 0`, contact shadows unchanged |
| (f) Task screen, AFTER salon behind the notebook | `desktop-task-backdrop-after.jpg` | `tablet-task-backdrop-after.jpg` | "Wróć do notesu" after the sofa; `graded 0`, `captures 2` |
| (e) "Pokój gotowy!" card | `desktop-room-done-card.jpg` | `tablet-room-done-card.jpg` | `finishSalon` (every task, first look) |
| (e) Finished room after "Dalej" | `desktop-room-done.jpg` | `tablet-room-done.jpg` | `cardNext`; `contactShadows []` (the whole `shadows` layer is back) |
| (h) Room with `?e2eArt=room` (no salon pictures) | `desktop-room-standin.jpg` | `tablet-room-standin.jpg` | hook `worn.keys []`, `graded false`, no page error |
| Side-by-side with the art review | `compare-art-review-vs-now.jpg` | — | top: `art-review/compare-screens.png` (old before, after, task); below: the desktop canvas of room-before, after-stage, sofa, done |

Kit frames: the kit (`designs/martynka-maths-A-v1/screenshots/`) has no room frame; its `welcome.png` was checked by eye against the welcome frames (same washed, blurred salon on a pale green board). The kit is local only and is not copied here.
