# E2E request, phase 5 (import dialog) — for the orchestrator

Phase 5 adds no e2e spec (the import flow is proven by phase 7). Run once, outside the sandbox, as plain commands:

1. `npx playwright test` — expect `33 passed` (baseline + 0). The import button only adds a row to the settings panel;
   the existing settings and save-restart specs must stay green.
2. `npm run build` — expect `e2e hook: absent (`.

No break patch for this phase (the unit breaks are in handoff §3). Tick row 5.3 with the sha after it is green.
