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

## Bieg 2026-10-12-s04-s08 (S-04 – S-08, PR #20 – #24, pełny ship)

Wysłane i wdrożone: S-04 runda zadań (#20, 8467431), S-05 lektor i podsumowanie (#21, 37a9a62), S-06 pierwsze uruchomienie (#22, fd68216), S-07 adaptacja (#23, bfbd18a), S-08 ustawienia rodzica (#24, cdeff4a). Main po biegu: 948 testów jednostkowych, 18 e2e.

### Do zrobienia

- [ ] P0 — Przejrzyj audyt obserwowalności, PR #25 (nie scalony przez bieg): 2 CRITICAL. C-1: wyjątek w `TaskScene.create` / `onWake` / `UIScene.update` zatrzymuje pętlę Phasera na zawsze (brak obsługi błędów w `src/main.ts`), dziecko widzi zamrożony ekran. C-2: dialog zamyka się przed callbackiem (`parentGate.ts` `submit`, `stagePanel.ts`, `settingsPanel` „Zatwierdź”, `UIScene.applySettings`, `WelcomeScene.start`), więc wyjątek w callbacku zostawia wyłączony dotyk. Zdecyduj, czy naprawić przed S-09 (rekomendacja: tak, mały slice `fix:`). Źródło: `context/audits/observability/2026-10-13_0659-…md` na gałęzi PR #25.
- [ ] P0 — Decyzja o wczesnym zapisie: do S-11 wszystko jest sesyjne. Każdy zimny start pyta o wiek, zeruje opanowanie, ustawienia rodzica i podgląd postępów. Rozważ minimalny zapis przed S-09 (przesunięcie części S-11). Źródło: S-06 7.8, S-07 8.5, S-08 9.6; follow-up `Trigger: S-11`.
- [ ] P0 — `/10x-test-plan --refresh`: przyjmij (lub odrzuć) ryzyka #12 (pierwsze uruchomienie), #13 (adaptacja), #14 (ustawienia rodzica). Specy e2e cytują je jako „proposed”. Źródło: `tests/e2e/first-launch.spec.ts`, `adaptive.spec.ts`, `parent-settings.spec.ts`.
- [ ] P1 — Projekt progu opanowania (audyt H-7): seria 3 = +1, błąd = −1, więc dziecko z trafnością w pierwszej próbie poniżej ok. 79% nigdy nie dojdzie do opanowania 4 i nie odblokuje kroku. Zdecyduj przed S-09 albo przy playteście S-17. Źródło: `src/core/mastery.ts` `recordRound`, audyt PR #25.
- [ ] P1 — iPad i Android (prawdziwe urządzenia), przed zależnym slice'em dotyku: dotyk < 100 ms i lot gwiazdki nie blokuje „Dalej” (S-04 8.5); głos polski, liczebniki, cyfry rzymskie, jedno odblokowanie na sesję (S-05 10.9); bramka i panel palcem bez przebicia (S-06 5.7); auto-czytanie po stuknięciu wieku E1/E2 (S-06 6.5); „Graj w przeglądarce” nie trafia w kafelek pod spodem (S-08 6.7); przytrzymanie 2 s wygodne dla rodzica, bez lupy i menu (S-08 9.7).
- [ ] P1 — Audyt H-6: panel pokazuje „Czytanie poleceń na głos: Włączone” także bez polskiego głosu. Źródło: `src/ui/dom/settingsPanel.ts`, audyt PR #25.
- [ ] P2 — Przekreślone zero w czcionce (S-04 V3): czcionka ma tylko taki glif, kit go akceptuje. Źródło: follow-up `Trigger: S-16`.
- [ ] P2 — Follow-upy S-08 F4–F7 (listener podpowiedzi instalacji, przytrzymanie nieresetowane przy innej nakładce, rzutowanie w `WelcomeScene`, tekst stanu pustego „Za mało odpowiedzi z błędami…”). Źródło: `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md`.
- [ ] P2 — Test e2e podglądu postępów (S-08 test b) może zawieść ok. 1 raz na 1000 (trzy rundy bez pomyłki na umiejętności E3). Źródło: `tests/e2e/parent-settings.spec.ts`.
- [ ] P2 — Agenci-podwykonawcy uruchamiają Chromium raz w sandboksie, raz bez (jeden agent wyłączył sandbox wbrew regule). Zdecyduj, czy subagent może uruchamiać `npx playwright test` bez sandboksa. Profil § 8 opisuje stan po tym biegu.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] S-06 7.5 (największa): dziecko startuje samo na etapie z wieku; bramka dla dorosłego chroni tylko zmianę etapu (FR-012 mówi o potwierdzeniu rodzica). Bez tego, przed zapisem z S-11, każda gra zaczynałaby się od rodzica.
- [ ] S-06 7.6, 7.7, 7.9: brak rozgrzewki po zmianie etapu przez rodzica; rozgrzewka 3 + 3 zadania, próg < 4 z 6 obniża etap po cichu, E1 bez rozgrzewki; bramka 13–19 × 13–19 na klawiaturze cyfr.
- [ ] S-07 8.6 – 8.10: podłoga kalendarza (E3 w październiku: kroki 1, 2, 6; cały etap od stycznia; rodzic schodzący na niższy etap otwiera go całego); „większość” = `≥ ceil(n/2)`; odblokowanie także w trakcie łagodzenia; łagodzenie = wagi 20/50/30 przez 2 rundy; brak automatycznego awansu etapu.
- [ ] S-08 9.8: przerwana runda nie liczy się do opanowania; „3 najsłabsze” tylko spośród umiejętności z błędami; nazwa umiejętności = tytuł kroku + przykłady; podgląd z bieżącego etapu; ikona ustawień w HUD, nie na powitaniu.
- [ ] S-04 10.5 – 10.8: „Dalej” zamiast automatycznego przejścia; samo „Spróbuj jeszcze raz”, gdy pierwsza linia podpowiedzi zdradza wynik; typ `select` poza losowaniem do S-13; przełącznik zadania/pokój do S-05/S-09.
- [ ] S-05 10.5 – 10.8: auto-czytanie domyślne od etapu; „Do pokoju” bez wyróżnienia do S-09; z pokoju powrót na ekran, z którego dziecko wyszło; pierwsze zadanie po zimnym starcie nie jest czytane automatycznie (wymóg gestu przeglądarki).
- [ ] Bramka e2e w biegu: testy e2e uruchamiał orkiestrator (Chromium nie startował w sesjach agentów), łamania zachowań przez patche `git apply`. Wynik każdego łamania jest w dzienniku biegu.
