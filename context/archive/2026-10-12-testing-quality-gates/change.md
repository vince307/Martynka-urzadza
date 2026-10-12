---
change_id: testing-quality-gates
title: Bramki jakości i granice modułów (ESLint, hooki, lint i sample w CI)
status: archived
created: 2026-10-12
updated: 2026-10-12
archived_at: 2026-10-12T13:32:19Z
---

## Notes

Open a change folder for rollout Phase 1 of context/foundation/test-plan.md: "Quality gates and module boundaries".
Risks covered: #6 (scena z tekstem/balansem lub `core/` z Phaserem), #5 (dane etapu dające generator bez rozwiązań lub pusty krok). Test types planned: lint, gates, content smoke.
Risk response intent: #6 — lint ma upaść, gdy `src/core` importuje Phasera lub używa `window`/`document`/`navigator`, albo gdy `src/data` importuje z `core` coś poza `core/text/*` i typami; nie pisać własnego skryptu zamiast reguł ESLint. #5 — `npm run sample -- E3` i `-- E4` w CI na każdym PR jako smoke treści (kod 1 przy naruszeniu lub wyczerpaniu prób); test wykonalności parametrów zostaje dla etapu 3.
Hooki lokalne (`.claude/hooks/`) już wołają ESLint, gdy jest zainstalowany; `/10x-configure-hook` audytuje i dowodzi ich po instalacji ESLint.
