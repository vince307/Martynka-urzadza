# Smoke wdrożenia i PWA — Plan Brief

> Full plan: `context/changes/testing-deploy-smoke/plan.md`
> Research: `context/changes/testing-deploy-smoke/research.md`

## What & Why

Etap 2 planu testów: po każdym `switch` job deploy dowodzi, że produkcja serwuje nowy build z właściwymi nagłówkami i spójnym precache; testy dyspozytorów w CI; procedura drillu rollbacku i listy kontrolnej CoiledSpring. Ryzyka #3, #4 (PR #6 w S-01 był dokładnie taką poprawką po deployu).

## Starting Point

Health check tylko „tytuł + nazwa manifestu + 200 sw.js”; job deploy bez checkoutu; CoiledSpring nieosiągalny z CI; `deploy/test-*.sh` poza CI.

## Desired End State

`npm run check:deploy -- <url> [sha7]` z listą sprawdzeń (kody 0/1/2) używany przez workflow i agenta; CI z testami dyspozytorów; runbook z drillem rollbacku; cookbook §6.4; etap 2 `complete`.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Implementacja | TS skrypt z czystymi parserami + `npm ci` w jobie deploy | Jedna implementacja dla CI i agenta, testy parserów | Research |
| SHA przy rollbacku | Pomijany (spójność bez porównania) | Poprzednie wydanie ma inny SHA | Research |
| CoiledSpring | Lista kontrolna agenta/właściciela przy bootstrapie, nie CI | ACL `tag:ci` i klucz CI nie sięgają | Research |
| Rollback | Ręczny drill udokumentowany, bez harmonogramu | Harmonogram przełączałby produkcję | Research |

## Scope

**In scope:** `scripts/deploy-check/parse.ts`, `scripts/check-deploy.ts`, testy, `deploy.yml`, `ci.yml`, runbook, test-plan §3/§5/§6, CLAUDE.md.

**Out of scope:** e2e, instalacja PWA, monitoring, zmiany w bootstrapie/dyspozytorach/Caddy.

## Architecture / Approach

`check-deploy.ts` → `fetch` → parsery → lista `CheckResult` → kod wyjścia; workflow po `switch` i agent z sesji wołają to samo.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Skrypt | parsery + CLI + testy, uruchomiony na produkcji | TLS/retry przy pierwszym żądaniu |
| 2. Workflowy | smoke w deployu, testy dyspozytorów w CI | `npm ci` w jobie deploy |
| 3. Docs i weryfikacja | runbook, cookbook, smoke po merge | — |

**Prerequisites:** PR #10 zmergowany (tak).
**Estimated effort:** jedna sesja.

## Open Risks & Assumptions

- Przy pierwszym wydaniu na nowej domenie Caddy wystawia certyfikat z opóźnieniem; retry w skrypcie.

## Success Criteria (Summary)

- Smoke zielony na produkcji i w jobie deploy; złe SHA → czerwony; CI z testami dyspozytorów; runbook z drillem.
