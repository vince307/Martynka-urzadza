# Lista kontrolna dla człowieka

Sekcje dopisuje `/10x-autonomous-run` po każdym biegu. Wcześniejszych sekcji bieg nie zmienia ani nie odhacza; należą do maintainera.
Priorytety: P0 przed następnym biegiem · P1 przed zależnym slice'em · P2 później.

## Bieg 2026-10-12-s03-remaining-stages (S-03, PR #15)

### Do zrobienia

- [ ] P0 — Przeczytaj wydruk `npm run sample -- E1 --count 6`, `-- E2`, `-- E5`, `-- E6` przed „merguj” do PR #15. Źródło: zarchiwizowany plan, wiersz 10.6; odczyt recenzenta w `reviews/teacher-read.md` archiwum.
- [ ] P0 — Merge PR #15 (merge = deploy). CI `check` zielone na 566cd2c (run 38289222510). Źródło: PR #15.
- [ ] P1 — Decyzja przed S-04: odpowiedzi liczbowe E1 przez klawiaturkę czy 3–4 kafelki (ZADANIA §4). Źródło: wiersz 10.7, follow-up `Trigger: S-04`.
- [ ] P1 — F14: pierwsza podpowiedź MISSING zdradza wynik. Źródło: follow-up `Trigger: S-04`.
- [ ] P2 — „kupił jeszcze 2 złote” w szablonie zadania tekstowego z S-02. Źródło: follow-up `Trigger: S-17`.
- [ ] P2 — Pozostałe ostrzeżenia z impl-review odłożone z `Trigger:`. Źródło: `follow-ups/review-fixes.md` w archiwum.
- [ ] P2 — Nowe nieśledzone paczki w `designs/` (`martynka-expansion-v1/`, `martynka-locations-v1/` + `.zip`) dają `DIRTY` w preflight następnego biegu. Zacommituj je, dodaj do `.gitignore` albo do `TREE_CLEAN_ALLOW` w profilu.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] `20 − 7`, `20 − 4` zostają w krokach bez przekraczania progu (E2.1, E2.9). Uzasadnienie: ZADANIA ma „50 − 3” w kroku bez przekraczania, a dzieci liczą przez analogię z 10 − 7. Podpowiedź: `10 − 7 = 3 | 10 + 3 = 13`.
- [ ] Podpowiedź `DT − U` rozbija jedną dziesiątkę dla każdego odjemnika (`80 − 7` → `10 − 7 = 3 | 70 + 3 = 73`).
- [ ] Parser ROUNDING wymaga `max ≥ 2 · to` i `max ≤ 10 000`; mnożenie przez 100 dostaje podpowiedź w jednej linii.
- [ ] Duże porównania COMPARE_NUM różnią się co najwyżej jedną cyfrą długości, bez porównań typu `612 449 □ 2`.
- [ ] Pytanie o dopełnienie brzmi „Ile trzeba dodać do 2, żeby było 10?”.
