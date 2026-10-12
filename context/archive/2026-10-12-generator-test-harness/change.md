---
change_id: generator-test-harness
title: Harness testów generatorów (vitest, seedowany rng, skrypt sample z raportem naruszeń)
status: archived
created: 2026-10-12
updated: 2026-10-12
archived_at: 2026-10-12T11:43:51Z
---

## Notes

F-03 z roadmapy (etap M1, fundament): vitest działa na `src/core/` (tsconfig: `tests/` w `include`, `strictPropertyInitialization` włączone), generatory dostają seedowany rng (`core/rng.ts`), a skrypt `npm run sample -- E3` wypisuje po 3 zadania z każdego kroku etapu i raportuje naruszenia (zakres, ujemne, odmiana). Minimalny zakres: harness, nie warstwa testowa; pierwszy generator jako dowód działania harnessu, pełne generatory w S-02.
