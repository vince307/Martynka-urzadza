# Follow-ups z przeglądu implementacji (2026-10-12)

- **F10**: generator ADD_SUB w S-02 dostaje parametr `shape` (ZADANIA §4: `DU+U`, `DT+DT`, `DU+DU`, …) i losuje składniki z kształtu zamiast `a` potem `b ∈ [1, max−a]` (skośność ku małym `b`); krok E3.8 „dwie dwucyfrowe” wymaga `shape`. Przy okazji rozważyć osobne umiejętności dla + i − w danych etapu, jeśli adaptacja (S-07) ma je liczyć osobno.
