# E2E request — phase 6 (orchestrator)

Phase 6 changed UI only (new reset dialog, shared summary helper, WelcomeScene guard); no e2e spec was added.

1. `npx playwright test` (one plain command, sandbox off). Expected: 33 passed (branch e2e baseline 33, +0).
2. Kill leftovers: `lsof -ti tcp:4397 -sTCP:LISTEN | xargs kill`, then `lsof -ti tcp:4398 -sTCP:LISTEN | xargs kill`.
3. If green, tick the e2e half of row 6.4 by appending ` (e2e 33 passed by the orchestrator on <sha>)`.
No break patch in this phase (reset e2e is phase 7).
