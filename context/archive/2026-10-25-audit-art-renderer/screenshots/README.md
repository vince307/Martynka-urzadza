# Screenshots for the audit-art-renderer visual gate (plan row 4.9)

Captured on 2026-10-25 on `47da815` (the build id in the corner of the notebook frames). JPEG (quality 80), viewport-sized: desktop 1440×900, tablet 1024×768. 7 frames per width (4 states, the pouf state under WebGL only).

## Route

Playwright fallback on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. Claude in Chrome cannot switch WebGL off, so it was not used. A throwaway spec and config in the session scratchpad (outside the repo, not committed) reused `tests/e2e/support/{welcome,hook}.ts` and ran four projects: `desktop-webgl`, `tablet-webgl`, `desktop-canvas` and `tablet-canvas`. The two Canvas projects launch Chromium with the same flags as `tests/e2e/canvas-renderer.spec.ts` (`--disable-webgl --disable-webgl2 --disable-3d-apis`). Every project used `hasTouch`, blocked service workers, and ran each test in a fresh browser context, which gives a fresh IndexedDB.

How each state was reached:
- Settings: the parent path on the welcome screen with `?e2eVariant=off`, then `openSettings`: a hold on the gear and the adult gate answered from the dialog text. The panel was scrolled to the "Obrazki" heading.
- Room: the same parent path. The first task is solved the long way (two misses, the solution, then the retype, which pays no star), and then the HUD room switch is tapped.
- Pouf: `?e2eStars=40`, then "Odnów ściany i podłogę" is tapped, and the frame is taken 1.5 s after `stageDone`.

The "Gra bez internetu … Kod: TypeError" line in the settings frames comes from the capture's `serviceWorkers: 'block'`. A control run with service workers allowed (desktop WebGL, same build, not committed) shows "Gra jest gotowa do działania bez internetu." and the same "Obrazki" section.

## Frames

| State (row 4.9) | Desktop 1440 | Tablet 1024 | How reached / hook facts |
|---|---|---|---|
| Settings "Obrazki" under Canvas, with the `wornPlain` line | `desktop-canvas-settings-pictures.jpg` | `tablet-canvas-settings-pictures.jpg` | `artFallbacks.worn 'ungraded'`; console `Renderer: Canvas (no filters: the worn salon look is off)` once |
| Settings "Obrazki" under WebGL, without it | `desktop-webgl-settings-pictures.jpg` | `tablet-webgl-settings-pictures.jpg` | `artFallbacks {}`; console `Renderer: WebGL` once |
| Room before the stage under Canvas (wash, full-colour furniture) | `desktop-canvas-room-before.jpg` | `tablet-canvas-room-before.jpg` | `worn.keys` 10 pieces, `graded false` |
| Room before the stage under WebGL (graded worn set) | `desktop-webgl-room-before.jpg` | `tablet-webgl-room-before.jpg` | `worn.keys` 10 pieces, `graded true` |
| Welcome backdrop under Canvas | `desktop-canvas-welcome-backdrop.jpg` | `tablet-canvas-welcome-backdrop.jpg` | `?e2eMonth=9`; `backdrop.renderer 'canvas'`, `blurred false`, `graded 0` |
| Welcome backdrop under WebGL | `desktop-webgl-welcome-backdrop.jpg` | `tablet-webgl-welcome-backdrop.jpg` | `backdrop.renderer 'webgl'`, `blurred true`, `graded 10` |
| Empty after room under WebGL, pouf under "Wróć do notesu" (gap 174) | `desktop-webgl-room-after-stage.jpg` | `tablet-webgl-room-after-stage.jpg` | `stageDone true`, stars 35, `contactShadows` lamp-table, plant-left, pouf, plant-right; `resume` target (480, 950) |

Kit frames: the kit (`designs/martynka-maths-A-v1/screenshots/`) has no settings-panel or room frame, so there is nothing to compare these against. The welcome frames match the kit's `welcome.png` layout.
