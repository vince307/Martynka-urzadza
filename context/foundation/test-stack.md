# Test stack

## E2E
<!-- Written by /10x-e2e-setup. Re-run it to change this section; other skills only read it. -->
- runner: Playwright Test, @playwright/test 1.64.0
- config: playwright.config.ts
- single-spec command: npx playwright test tests/e2e/<name>.spec.ts
- full-suite command: npx playwright test
- base URL: http://localhost:4398
- port: 4398 (default in playwright.config.ts = the gate port from context/foundation/autonomous-run.md § 3; detected Vite preview default 4173 is a protected port on this machine and is never used; override with E2E_PORT)
- web server command: npm run build && npm run preview -- --port $E2E_PORT --strictPort; reuseExistingServer outside CI
- auth setup project: none (no accounts, no backend)
- storageState: none
- seed: tests/e2e/seed.spec.ts — protects #8: the game boots offline from the service worker cache (page and hashed bundles served by the worker, same build id)
- browser CLI: npx -y @playwright/cli (no global install), command skill at .claude/skills/playwright-cli/SKILL.md
- updated: 2026-10-12

Agent sandbox: headless Chromium cannot start inside the Claude Code sandbox on macOS (`MachPortRendezvousServer … Permission denied`); run Playwright commands outside the sandbox. Desktop Chromium with `hasTouch`, not an Android device profile (its "add to home screen" hint covers the canvas). Service workers are automatable only in Chromium; the iPad (WebKit) stays a manual check. One cold run of the seed: about 11 s (build ≈ 7 s included).
