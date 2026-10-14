# E2E request, phase 8 (#11 missing art), art-stand-in-and-load-signal

Chromium cannot launch in the agent session (MachPortRendezvous Permission denied, 3 plain tries). Nothing is committed.
Uncommitted in the tree: `tests/e2e/art-stand-in.spec.ts` (4 tests), `tests/e2e/support/hook.ts` (Snapshot: `art[].label`, `artHealth`),
`playwright.config.ts` (`art-stand-in` added to `ROUND_SPEC`). Verified without a browser: `tsc --noEmit` and ESLint clean; each patch passes `git apply --check`.

## Green runs (outside the agent sandbox)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts art-stand-in` : expect 4 passed.
2. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` : expect 50 passed (46 + 4).
3. `npm run build` prints `e2e hook: absent (`.

## Breaks (apply, run command 1 with the port 4397 and 4398 free, expect red, then `git apply -R`)
| Patch | Change | Expect red |
|---|---|---|
| `e2e-break-p8a.patch` | `ArtImage` label from the texture key (`key.split('/').pop()`) | (a) and (b) on the `label` regex (value like `coin-5zl`, `weight-5dag`). Proves the label source, not the box visibility |
| `e2e-break-p8b.patch` | `BootScene` health from `loaderror` only (no `textures.exists`) | (d) on `artHealth.missing > 0`. NOTE (c) also goes red (`missing` is 0 with `?e2eArt=missing`, nothing is queued so no loaderror). Meta-check: (d) only proves S14-04 if `corrupt` emits NO `loaderror`; this seam is unverified in a browser. If (d) stays green under p8b, the corrupt file does fire `loaderror` and the seam must change (decode a real non-image served as a texture) before the test counts |
| `e2e-break-p8c.patch` | `UIScene.openSettings` passes `artHealth: undefined` | (c) on the DOM text (`Obrazki` heading not visible) |

## Open risks of the unrun spec
- `?e2eArt=corrupt`: (d) asserts `artHealth.missing > 0` as the orchestrator asked; if Phaser 4 rejects the ttf as an image with a `loaderror` the p8b break will not turn (d) red.
- Money labels regex `/^\d+ (zł|gr)$/` and the weight label `^\d+ dag$` are taken from the plan; if a label has another format (e.g. `1 zł 50 gr`), fix the regex, not the code.
- After green plus breaks: commit the spec (`test(art-stand-in-and-load-signal): ... (p8)`), tick rows 8.1-8.5, write the handoff.
