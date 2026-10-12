---
change_id: testing-content-invariants
title: Niezmienniki treści: wykonalność parametrów, brak zdegenerowanych zadań, różnorodność, lista „odczytu nauczyciela” (plan testów, etap 3)
status: implementing
created: 2026-10-12
updated: 2026-10-12
archived_at: null
---

## Notes

Open a change folder for rollout Phase 3 of context/foundation/test-plan.md: "Content invariants".
Risks covered: #1 (dziecko dostaje zadanie z błędną odpowiedzią, podpowiedzią lub błędem językowym niewidocznym dla walidatora), #5 (zmiana danych etapu daje generator bez rozwiązań, pusty krok lub zdegenerowane zadania). Test types planned: unit/property, checklist.
Risk response intent: #1 — każde zadanie ma odpowiedź odtwarzalną z własnego polecenia, podpowiedzi z poprawną arytmetyką w każdym kroku i odmianę zgodną z liczbą; nie ufać „walidator nie zgłosił naruszeń”; lista kontrolna odczytu nauczyciela dla każdego nowego szablonu. #5 — każda umiejętność w każdym etapie produkuje zadania bez naruszeń, parametry niewykonalne są odrzucane przy parsowaniu, żaden krok z typem grupy 1 nie jest pusty; nie ufać „parser przyjął dane”.
