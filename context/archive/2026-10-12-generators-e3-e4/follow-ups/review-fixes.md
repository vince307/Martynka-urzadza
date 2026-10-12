# Follow-ups z przeglądu implementacji (2026-10-12)

- **F11**: `parseAddSubParams` nie wykrywa kombinacji kształt + `bridge` + `max` bez rozwiązań (np. `DU+DU`, `'ten'`, 30); `tests/curriculum.test.ts` łapie to dla danych w repo. Przy S-03 rozważyć szacowanie wykonalności (próbne losowanie w parserze) albo listę dozwolonych kombinacji.
- **F12**: podpowiedź dla `DT−U` (70 − 9) jako „70 − 10 = 60, 60 + 1 = 61”; skośność rozkładu składników w trybie bez kształtów. Dopracować po testach z graczem (S-17) albo razem z danymi E5–E6 (S-03).
- **F14**: pierwsza podpowiedź MISSING zdradza wynik; przy S-04 (ekran zadań) pokazać działanie odwrotne bez wyniku jako pierwszy krok, z wynikiem dopiero w „rozwiązaniu krok po kroku”.
