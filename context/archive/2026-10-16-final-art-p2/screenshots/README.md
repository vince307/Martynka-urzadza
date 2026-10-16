# Screenshots — final-art-p2 (S-16c) visual gate

Captured 2026-10-16. Wallet, unlock, room-done and icon frames show `8b3f2d8` (the build id in the corner). The loading frames
`l01`-`l04` were shot again after the fix `076c213` (ivory outline on the loading texts). The first shots of those frames were
overwritten.

Route: Playwright only. A throwaway spec `tests/e2e/visual.local/final-art-wallet.spec.ts` (gitignored by `*.local`, deleted
afterwards) ran with its own config: no `webServer`, service workers blocked, `hasTouch`, `pl-PL`, Europe/Warsaw, projects
`desktop` 1440×900 and `tablet` 1024×768. It reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`.
Claude in Chrome was not used, because it cannot drag coins, hold a finger mid-drag, or hold or abort network routes.
A silent speech stub hides the speaker. Frames are JPEG at quality 85.

`desktop-*` = 1440×900 (scene at 0.75). `tablet-*` = 1024×768 (scene at 0.533).

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| w01 | MONEY_PAY E1, empty pack wallet, tray 1/2/5 zł | `w01-e1-empty` | parent path E1, `?e2eSkills=E1.11.money_pay_10&e2eVariant=off` |
| w02 | Right coins in the wallet (hand-checked total) | `w02-e1-right-coins` | `payCoins(answer)` |
| w03 | Task done after "OK" | `w03-e1-done` | tap OK |
| w04 | Feedback bar after a miss, over the wallet's lower edge | `w04-e1-feedback-after-miss` | `answerWrong` (the right coins + 1 zł) on the next task |
| w05 | Three coins | `w05-e1-three-coins` | 3 × 1 zł |
| w06 | Full wallet (6), tray dimmed | `w06-e1-full-tray-dimmed` | 3 more × 1 zł |
| w07 | Two equal coins (2 zł, 2 zł) | `w07-e1-two-equal-coins` | `payCoins([200, 200])` |
| w08 | FIRST of the two held mid-drag: its own cell (left) empty, the second stays | `w08-e1-first-coin-held` | `holdDrag` from cell 0, 150 px up, finger down |
| w09 | Drawn wallet fallback | `w09-e1-drawn-wallet` | route `**/assets/ui/wallet-open.webp` aborted |
| w10 | MONEY_PAY E2, empty, tray with the 10 zł note | `w10-e2-empty` | parent path E2, `?e2eSkills=E2.2.money_pay_20` |
| w11 | E2 full with the note: 10 + 5 + 2 + 1 + 1 + 1, tray dimmed | `w11-e2-full-with-note` | `payCoins` |
| l01 | Loading screen with background and emblem, bar | `l01-loading-art` | salon room pictures held by `page.route` |
| l02 | Same, with the slow line | `l02-loading-art-slow` | held until `loading.phase === 'slow'` (8 s) |
| l03 | Drawn loading screen (the loading pictures never arrive) | `l03-loading-drawn` | `?e2eArt=stallall` + `**/assets/ui/loading-*.webp` never answered |
| l04 | Drawn loading screen with the slow line | `l04-loading-drawn-slow` | same, `phase === 'slow'` |
| u01 | "Nowa umiejętność!" with the notebook | `u01-unlock-notebook` | parent path E4 in September (`?e2eMonth=8`), rounds right until `pendingUnlock`, "Kolejna runda" |
| d01 | "Pokój gotowy!" with the live miniature | `d01-done-live` | `?e2eStars=71`, whole salon bought (look 1 each) |
| d02 | "Pokój gotowy!" with the `salon-after` thumbnail | `d02-done-thumbnail` | same + `?e2eArt=room` |
| d03 | "Pokój gotowy!" with the drawn miniature | `d03-done-drawn` | same + `**/assets/ui/salon-after.webp` aborted |
| i01 | COUNT with the new icons: plate, box, sticker | `i01-count-{plate,box,sticker}` | `?e2eSkills=E1.4.count_7`, tasks played right until each icon came up |
| — | Maskable icon with the 80 % safe circle drawn in red | `icon-maskable-safe-circle.jpg` | `public/icons/icon-maskable-512.png` + a PIL overlay |

Kit reference (read-only, not copied): `designs/martynka-salon-v2/screenshots/{loading-screen,app-icons,counting-icons}.png`,
`assets/learning/wallet-open.png`.
