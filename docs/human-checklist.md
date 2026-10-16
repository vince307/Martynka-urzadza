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

## Bieg 2026-10-13-fix-observability (poprawka po audycie, PR #27)

Wysłane i wdrożone: `observability-c1-c2` (#27, merge 298c74d, Deploy 38361972416). C-1: zamiast zamrożonego ekranu karta „Ups! Gra się zatrzymała.” z przyciskiem „Zacznij od nowa”. C-2: okna dialogowe zawsze oddają dotyk, nawet po wyjątku. H-6: panel mówi, gdy nie ma polskiego głosu. H-7: błąd w pierwszej próbie zeruje serię, opanowanie nie spada. Main po biegu: 974 testy jednostkowe, 23 e2e.

### Do zrobienia

- [ ] P0 — Przejrzyj audyt kontrolny, PR #28 (nie scalony przez bieg): 0 CRITICAL; C-1, C-2, H-6 zamknięte, H-7 częściowo (rodzic nie widzi postępu do odblokowania), H-3/H-4 (lektor gubi błędy mowy) otwarte. Nowe: N-1 — granica błędów instaluje się po importach i po `createNarrator` w `src/main.ts`, więc wyjątek tam nadal daje pusty ekran bez karty; N-4 — karta pokazuje tylko wersję, bez kodu błędu. Źródło: `context/audits/observability/2026-10-13_0924-…md` na gałęzi PR #28.
- [ ] P0 — `/10x-test-plan --refresh` (interaktywne): przyjmij ryzyka #12–#15 (#15 = karta zamiast zamrożonego ekranu, nowy spec `tests/e2e/error-boundary.spec.ts`).
- [ ] P1 — Kalibracja progu opanowania po H-7 przy playteście: model badania daje ok. 19 / 14 / 11 rund do odblokowania kroku przy 60 / 70 / 80 % trafności (wcześniej 335 / 61 / 20). Źródło: zarchiwizowany plan, wiersz 2.6; `Trigger: S-17`.
- [ ] P1 — Na iPadzie i Androidzie: karta błędu czytelna palcem, „Zacznij od nowa” przeładowuje grę; linia o braku głosu na urządzeniu bez polskiego głosu.
- [ ] P2 — Follow-upy z impl-review (F3–F6) i audytu kontrolnego (N-2, N-3, N-5, N-6, L-12). Źródło: `context/archive/2026-10-13-observability-c1-c2/follow-ups/review-fixes.md`, PR #28.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] Do S-11 restart z karty kończy sesję (wiek, etap, opanowanie od nowa), wbrew dosłownemu PRD „niczego stracić”; karta pokazuje się na każdą awarię uznaną za krytyczną (wiersz 4.8).
- [ ] Przełącznik czytania na głos zostaje aktywny bez polskiego głosu; panel tylko o tym mówi (wiersz 5.9).
- [ ] Odrzucenia `AbortError` / `NotAllowedError` traktowane jako szum (mowa, audio); od S-11 trzeba to sprawdzić dla IndexedDB (follow-up `Trigger: S-11`).

## Bieg 2026-10-13-s09-s11 (S-09 – S-11, PR #31 – #33, pełny ship)

Wysłane i wdrożone: S-09 `first-furniture-purchase` (#31, merge 36ead3c, Deploy 38378666969), S-10 `variant-change-room-done` (#32, merge f67b9f4, Deploy 38390574032), S-11 `autosave-versioned-save` (#33, merge 6617da3, Deploy 38402662110). Main po biegu: 1142 testy jednostkowe, 29 e2e. Od S-11 postęp zapisuje się na urządzeniu (IndexedDB, format v1 — jednokierunkowy).

### Do zrobienia

- [ ] P0 — Przejrzyj audyt po biegu, PR #34 (nie scalony przez bieg): 2 CRITICAL, oba w S-11. C-1: gdy IndexedDB nie da się odczytać (`loadSave` → `unavailable`), błąd ginie bez śladu, dziecko widzi „pierwsze uruchomienie”, a sesja nic nie zapisuje (`src/core/autosave.ts` `loadSave`, `src/main.ts` `start`). C-2: trwałe błędy zapisu zostawiają tylko `console.error`; dziecko widzi kupiony mebel, który znika po zimnym starcie (`createAutosaver` → `attempt`). H-R3: `currentRoom` z nieznanym pokojem (np. po rollbacku) nadpisuje postęp salonu bez śladu (`src/scenes/RoomScene.ts` `room`). Źródło: `context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md` na gałęzi PR #34.
- [ ] P0 — Akceptacja formatu zapisu v1, zanim urządzenia zbiorą dużo zapisów (S-11 wiersz 6.6): bez `rngSeed`, `learner` może być `null`, `warmupPending`, `pendingUnlock: { stage, step }`, `profileId`. Każda zmiana po tym = migracja v2. Źródło: `context/archive/2026-10-13-autosave-versioned-save/plan.md`.
- [ ] P1 — iPad i Android (S-11 4.6, 5.7; S-10 6.9; S-09 7.10): stan po zamknięciu z przełącznika aplikacji, po restarcie tabletu i po cichej aktualizacji; eksport kopii w aplikacji z ekranu początkowego; przytrzymanie mebla palcem (600 ms / 40 px, S-10 6.6), tryb „Zmień wygląd”, karta „Pokój gotowy!”; zakup palcem i podwójne „Wybieram”; „ogranicz ruch”.
- [ ] P1 — `/10x-test-plan --refresh`: faza 4 ma status `implementing` (import czeka na S-12, test na dwóch buildach — ryzyko #10 — odroczony do v2, S-11 6.8); ryzyko #16 rozszerzone o „zmiana wariantu nic nie kosztuje”.
- [ ] P2 — Follow-upy z przeglądów i bramek wizualnych: S-09 V1/V2 (podpisy, „pop” dywanu nad kanapą), S-10 V2–V5 (pop dywanu, blade podpisy na tym samym kolorze — S-16; brak widocznego trybu zmiany i brak oznaczenia obecnego wyglądu — wiersz 6.7), S-11 F3–F5 (brak dowodu w przeglądarce, że `unavailable` blokuje zapis; eksport po nieudanym udostępnieniu spada do pobrania). Źródła: `context/archive/2026-10-13-{first-furniture-purchase,variant-change-room-done,autosave-versioned-save}/follow-ups/review-fixes.md`.
- [ ] P2 — Wpisy wyżej mówiące „sesyjne do S-11” (np. S-06 7.5, „restart z karty kończy sesję”, S-09 7.8) są nieaktualne: od S-11 stan przetrwa restart, a karta błędu blokuje autozapis tej sesji.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] S-09 7.6, 7.9: salon z 10 slotów, koszty 5–15 (razem 96 gwiazdek, ok. 14 czystych rund); panel 3 wariantów i przycisk „masz X/Y” bez wzoru w kicie (DESIGN-GAP 31–36).
- [ ] S-09 7.7: zakup bez dźwięku do S-16 — wbrew dosłownemu FR-017 (animacja + dźwięk).
- [ ] S-10 6.8: „Zmień wygląd” / „Gotowe” zamiast dosłownego „poprawki” z FR-019; zapowiedź następnego pokoju bez nazwy („Wkrótce”); kafelek „Wkrótce” bez kłódki (raport fazy 5 ją wspominał, zrzut jej nie pokazuje).
- [ ] S-10 3.5 i S-11 5.8: szwy tylko w buildzie e2e — `?e2eStars=N` (tylko świeży start) i `?e2eSave=unreadable`; strażnik buildu sprawdza, że nie trafiają do `dist/`.
- [ ] S-11 6.7: na karcie nieczytelnego zapisu „Graj dalej” bez bramki dorosłego (dziecko samo nie utknie), eksport za bramką; po nieudanym odczycie gra w tej sesji nic nie zapisuje.
- [ ] S-11 6.9: tekst karty błędu („Ups! Gra się zatrzymała.”) bez obietnicy zapisanego postępu; wyjątek fatalny blokuje autozapis tej sesji.
- [ ] Bramka e2e w biegu: Chromium nie startował w 16 z 18 sesji agentów; testy i łamania (patche `git apply`) uruchamiał orkiestrator, wyniki w dzienniku biegu. Faza 7 S-10 znalazła błąd punktu docelowego haka (`holdPoint` na krawędzi slotu, poprawka 96f7514 — dziecka nie dotyczy).

## Bieg 2026-10-13-fix-save-observability (poprawka po audycie, PR #36)

Wysłane i wdrożone: `save-observability-c1-c2` (#36, merge d13d9a3, Deploy 38424548530). C-1: gdy przeglądarka nie udostępnia zapisu albo odczyt nie kończy się w 5 s, przed grą pokazuje się karta „Gra nie może teraz zapisywać postępów”, a nazwa błędu trafia do konsoli. C-2: panel rodzica ma sekcję „Zapis gry” (działa / nieudane próby / wyłączony, z godziną ostatniego zapisu). H-R3: nieznany pokój w zapisie jest naprawiany przy wczytaniu, bez ruszania innych pokojów. Format zapisu bez zmian (v1). Main po biegu: 1176 testów jednostkowych, 33 e2e.

### Do zrobienia

- [ ] P0 — Przejrzyj audyt kontrolny, PR #37 (nie scalony przez bieg): 0 CRITICAL (było 2). Zamknięte C-1, M-S4, M-S5, M-R6, H-R3, L-R10; częściowo C-2 (teraz C-2r, medium: `InvalidSave` nie wskazuje pola, rodzic widzi porażki tylko po otwarciu panelu) i M-R5. Nowe: N-7 (medium) — odczyt przerwany po limicie i odczyt odrzucony dają ten sam tekst, karta nie ma ponowienia, a limit 5000 ms nie był mierzony na tablecie (`src/core/autosave.ts` `loadSave`); N-8 (low) — panel mówi „działa” przed pierwszym zapisem. Źródło: `context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md` na gałęzi PR #37.
- [ ] P1 — iPad i Android (wiersz 4.5): tryb prywatny / zablokowane dane witryn → karta pojawia się tylko wtedy, gdy magazyn naprawdę jest niedostępny; zmierz czas zimnego odczytu zapisu na iPadzie (czy 5 s wystarcza — N-7).
- [ ] P2 — Follow-upy: `context/archive/2026-10-13-save-observability-c1-c2/follow-ups/review-fixes.md` (M-S1 zasada rollbacku vs wersja zapisu, M-S2 wynik `persist()`, M-S3 powód na karcie, M-R4 kolejność zadań, L-*).

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] 5.9 — DESIGN-GAP 43 zmieniony: zamiast „nic nie pokazujemy” jest linia „Zapis gry” w panelu rodzica (za bramką) i karta przed grą dla niedostępnego zapisu (DESIGN-GAP 45, bez eksportu, „Graj dalej” bez bramki).
- [ ] 5.10 — Teksty: `pl.saveUnavailable`, `pl.settings.save*`; O1: „Ostatnie próby zapisu się nie udały” także po jednej nieudanej próbie.
- [ ] Limit odczytu 5000 ms (`balance.save.loadTimeoutMs`); pierwszy powód blokady zapisu wygrywa; panel pokazuje stan z chwili otwarcia.
- [ ] Nowe szwy tylko w buildzie e2e: `?e2eSave=unavailable|hang|writefail` (strażnik buildu sprawdza każdy).

## Bieg 2026-10-13-s12-s14 (S-12, S-13, S-14)

Wysłane i wdrożone: S-12 `save-export-import-reset` (#39, merge b57433c, Deploy 38462360681), S-13 `drawn-widget-tasks-e3-e4` (#40, merge bb00d7f, Deploy 38484353431), S-14 `art-tasks-all-stages` (#41, merge 1812347, Deploy 38502129327). Rodzic eksportuje, importuje i resetuje zapis; dziecko rozwiązuje zadania z zegarem, linijką, klockami, wykresem (zaznaczanie i przeciąganie), z pieniędzmi, wagą, dzbankami, termometrem i ikonami. Pierwsza grafika w grze: 38 plików WebP z paczki A v1. Format zapisu bez zmian (v1). Main po biegu: 1865 testów jednostkowych, 46 e2e (było 1176 / 33).

### Do zrobienia

- [ ] P0 — Przejrzyj audyt po biegu, PR #42 (nie scalony): 1 CRITICAL — S14-01: gdy obrazek się nie wczyta, zastępcza ramka pokazuje angielski identyfikator pliku (`coin-05gr`), a kwota jest tylko na obrazku, więc zadania nie da się rozwiązać, nikt się nie dowie, a pomyłki liczą się jako słabość dziecka (`src/ui/widgets/ArtImage.ts` `show`). Dalej HIGH: nieudane / niezdekodowane obrazki tylko `console.warn` albo nic (`BootScene.preload`); import/reset po `unavailable` pokazuje „Teraz: 0 gwiazdek” i nadpisuje niewidziany zapis (`autosave.ts` `replace`, `UIScene.openImport`); odpowiedź-tablica bez `check` zostawia dziecko w `retype` (`round.ts` `isCorrect`, ukryte). Źródło: `context/audits/observability/2026-10-14_0445-eksport-import-reset-widzety-obrazki.md` na gałęzi PR #42.
- [ ] P0 — Sprawdź na tablecie: podgląd postępów w panelu rodzica pokazał „Krok 8 z 8” dla E3 po jednej rundzie (bramka wizualna S-12; nie kod S-12) — czy to błąd widoku, czy startu z kalendarza.
- [ ] P1 — iPad i Android, S-12: eksport przez udostępnianie / pobranie (4.7), import z wyborem pliku (5.6), wynik `persist()` w „Zapis gry” (6.10).
- [ ] P1 — iPad i Android, S-13: przeciąganie i zaznaczanie palcem (9.8); klocki na macie są małe (~10 px kostka na 1024 px — O3); wykres trudny do odczytu w fazie rozwiązania obok klawiatury (O2).
- [ ] P1 — iPad i Android, S-14: ostrość WebP i działanie w Safari (9.9); liczby na podziałce termometru wyglądają na drobne na 1024 px.
- [ ] P2 — Follow-upy: `context/archive/2026-10-13-save-export-import-reset/follow-ups/review-fixes.md` (F1 import/reset nad nieczytelnym zapisem, N-7), `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md` (O1–O3, czas `adaptive.spec` blisko limitu 180 s), `context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`.
- [ ] P2 — Grafika i roadmapa: przeczytaj `docs/art-inventory.md` (ten PR) i zdecyduj: sloty salonu (10 czy 6), model kosztów, formy mebli, minigry do S-15; potem podział S-16 (salon + ikony vs dźwięki) i krok przygotowania grafiki.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] S-12 6.8 — eksport to plik `.txt` z kopertą JSON (aplikacja, build, powód), nie „plik JSON” z FR-022: udostępnianie w Chrome na Androidzie odrzuca `.json`.
- [ ] S-12 6.9 — teksty eksportu/importu/resetu (m.in. „Anulowano. Kopia nie powstała.”); import tylko z panelu rodzica, nie z ekranu powitalnego; podmiana zapisu = `replace` + przeładowanie strony.
- [ ] S-13 4.6 — godziny zapisywane „15.00” (katalog zadań), nie „3:30” (kit).
- [ ] S-13 6.9 / 10.6 — zakres: bez osi liczbowej, słupka pisemnego i grafów (→ S-14b); kratka, kwadrat magiczny, obwód, „ustaw zegar” → S-13b; zegar 1–12, budowanie liczby do 99.
- [ ] S-13 10.7 — teksty i nazwy kroków dla dziecka (`childName`).
- [ ] S-14 2.9 — WebP (połowa rozdzielczości) w `public/assets/tasks/`, nie PNG z planu § 10.
- [ ] S-14 8.9 — S-14 zawężony; S-14b (oś, słupek, strzałki), S-14c (miary i czas tekstowo), S-14d (figury E1, tryb obrazkowy, płacenie przeciąganiem) jako nowe pozycje roadmapy.
- [ ] S-14 9.7 — płacenie przeciąganiem monet odłożone (S-14d); waga tylko w równowadze; ujemne °C i „zł + gr” jako kafelki; temperatury co 5 °C (E3) i 2 °C (E5–E6); w E3–E5 bez temperatur ujemnych (odstępstwo od ZADANIA −30..+30, luka 64).
- [ ] S-14 9.8 — teksty i masy przedmiotów (`SCALE_ITEMS`, np. „filiżanka 50 dag”), polecenie `mass_convert` bez nazwy przedmiotu.

## Bieg 2026-10-14-fix-art-stand-in (poprawka po audycie #42)

Wysłane i wdrożone: `art-stand-in-and-load-signal` (#44, merge 8dc174a, Deploy 38539423195). Zamyka ustalenia audytu #42: S14-01 (CRITICAL), S14-02, S14-03, S14-04, S14-11, S12-01, oraz niestabilny limit czasu w `tests/spoken.test.ts`. Gdy obrazek się nie wczyta albo nie zdekoduje, ramka pokazuje polską wartość („5 gr”, „20 zł”, „10 dag”, „½ l”, „jabłko”). Zadania, w których wynik jest tylko na obrazku, są pomijane przy losowaniu rundy, z progiem, który nie blokuje odblokowania kroku. Panel rodzica ma linię „Obrazki: N z 38 obrazków nie wczytało się”. Import i reset przy nieodczytanym zapisie nie pokazują już „Teraz: 0 gwiazdek”. Format zapisu bez zmian (v1). Main po biegu: 1905 testów jednostkowych, 52 e2e (było 1865 / 46).

### Do zrobienia

- [ ] P0 — Przejrzyj audyt po biegu, PR #45 (nie scalony): 0 CRITICAL (wszystkie 6 celowanych ustaleń zamknięte). Najważniejsze HIGH: SIR-01 — poprawny zapis z nowszej wersji gry (`future`) jest traktowany jak nieczytelny, więc import lub reset mógłby go nadpisać (ukryte do formatu v2; `src/core/saveFile.ts` `deviceSaveView`); SIR-02 — gdy zapisu nie da się odczytać nigdy, rada „uruchom ponownie” się powtarza i rodzic nie ma wyjścia w grze (`autosave.ts` `replace`, `saveImportDialog.ts` `blockedStep`); SIR-03 — panel nie pokazuje `lastError` ani przyczyny limitu czasu (N-7). MEDIUM ASL-01: żaden test nie sprawdza, że `TaskScene.freshRound` przekazuje listę brakujących obrazków do budowy rundy. Źródło: raport `context/audits/observability/2026-10-14_1110-obrazki-zastepcze-import-reset-zablokowanego-zapisu.md` na gałęzi PR #45.
- [ ] P1 — iPad i Android: czy WebKit dekoduje WebP (jeśli nie, linia „Obrazki” w panelu to pokaże); czytelność ramek zastępczych (napisy ok. 12 px na 1024 px; odważniki w fazie rozwiązania poniżej 12 px — follow-up O1). Ramki zobaczysz w buildzie e2e z `?e2eArt=missing`, na produkcji tylko przy realnej awarii.
- [ ] P2 — Follow-upy: `context/archive/2026-10-14-art-stand-in-and-load-signal/follow-ups/review-fixes.md` (S14-05..S14-10, S12-02..S12-15, S13-*, O1, kopia surowego zapisu w dialogu).

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] 6.7 — wbrew literze PRD FR-022: gdy zapis na urządzeniu jest `unavailable` (nie dało się go odczytać, także limit czasu), import i reset są niedostępne do ponownego uruchomienia gry; dialog pokazuje tylko wyjaśnienie i „Zamknij”. Przy `unreadable` import i reset działają, z ostrzeżeniem zamiast „Teraz” i wskazaniem „Zachowaj kopię” na karcie startowej.
- [ ] 7.7 — FR-013: gdy brakuje obrazka, umiejętności z wynikiem tylko na obrazku (MONEY_COUNT, MASS, CAPACITY w litrach) wypadają z rundy; krok bieżący jest filtrowany tylko, gdy zostaje co najmniej tyle umiejętności, ile trzeba do odblokowania (E5.5: przy braku samego dzbanka ½ l wypada umiejętność z dzbankiem, zostaje waga). Zadania z polską etykietą (reszta pieniędzy, ikony, termometr) zostają w rundzie.
- [ ] Napisy zastępcze mają ok. 12–13 px na tablecie 1024 px nawet w dużych ramkach monet (mogłyby rosnąć do rozmiaru ramki) — zostawione, bo to tylko awaryjny widok.
- [ ] Przy `unreadable` „Zapisz kopię” w panelu nadal eksportuje bieżącą (świeżą) grę; tekst w dialogach to wyjaśnia, pełna poprawka to follow-up S12-04.
- [ ] Nowy szew tylko w buildzie e2e: `?e2eArt=missing|corrupt` (strażnik buildu sprawdza znacznik `e2eArt`).

## Bieg 2026-10-14-save-s13b-s15-s14b (poprawka zapisu, S-13b, S-15, S-14b)

Wysłane: #48 (poprawka zapisu po audycie #45), #49 (S-13b), #50 (S-15, **zapis v2 na urządzeniach**), #51 (S-14b). `main` 16848c6: 2445 testów jednostkowych, 77 e2e.

### P0 — przed kolejnym biegiem

- [ ] Audyt po biegu, PR #52 (nie scalać w biegu): **1 CRITICAL** SV2-01 — gdy zapis kopii `backup-v1` się nie uda, gra już nigdy nie zapisze postępów (blokada przy każdym starcie, w panelu tylko ogólne „nie zapisuje”). Stary zapis v1 zostaje cały. Następny bieg (uzgodniony 2026-10-15) zaczyna od poprawki SV2-01 i HIGH SV2-02/SV2-03/SRR-02.
- [ ] S-15 1.6 — format zapisu v2 to droga jednokierunkowa: wycofanie wdrożenia do buildu sprzed #50 pokaże kartę „zapis z nowszej wersji” (nic nie nadpisze, ale gra nie wczyta postępów). Zaakceptuj.
- [ ] S-15 5.6 — przeczytaj wszystkie 15 zagadek LOGIC (`npm run sample -- E4 --variants`). Orkiestrator i przegląd nie znaleźli błędów; to pierwsza treść pisana w całości przez agenta.

### P1 — na tablecie

- [ ] S-13b 8.7 — gest wskazówek zegara palcem dziecka (przyciąganie co 5 min, chwyt wskazówki).
- [ ] S-15 9.5 — stukanie w pola Zakrywanki 160 × 136 na tablecie 1024.
- [ ] Poprawka zapisu 4.8 — rada „wyczyść dane strony” sprawdzona na iPadzie (Safari i ikona na ekranie) i Androidzie (Chrome).
- [ ] Poprawka zapisu 5.8 — pomiar N-7: czy zimny odczyt IndexedDB na iPadzie po długiej przerwie przekracza 5 s.
- [ ] S-14b 8.8 — notacja przeniesienia i pożyczki w słupku (mała „1” nad kolumną, podniesiona „¹” przy pożyczce) — z wiedzy ogólnej; potwierdź albo podaj szkolny zapis.

### P2 — później

- [ ] Follow-upy z wyzwalaczami: `context/archive/2026-10-14-save-reason-and-recovery/follow-ups/review-fixes.md`, `…-drawn-grid-tasks-e3-e4/…`, `…-minigame-daily-puzzle/…` (m.in. kopia v1 nieczytelna w aplikacji, import/reset bez kopii v1), `…-number-line-written-arrows/…`.
- [ ] e2e: przy 6 przeglądarkach 4 różne testy padały pod obciążeniem (adaptive #13, parent-settings #14, openWelcome); bramki biegu używały `--workers=4`. Rozważ `workers: 4` w `playwright.config.ts`.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] Poprawka zapisu 3.7 — zapisu z nowszej wersji gry nie da się nadpisać importem ani resetem (PRD milczy).
- [ ] Poprawka zapisu 4.7 — przy trwałym `unavailable` rodzic może nadpisać zapis po drugim potwierdzeniu („Zastąp mimo to”); odwraca część decyzji 6.7 z biegu art-stand-in (FR-022).
- [ ] S-13b 10.6 — „ustaw zegar” w E4.3 tylko kwadranse, w E3 rusza się tylko krótka wskazówka; siatka 5 × 4; zakresy tam, gdzie ZADANIA milczy; wyższe progi odblokowania E3.3/E3.5/E3.7/E3.11/E4.7 na żywych zapisach.
- [ ] S-15 8.5 — Hasło odsłania literę po każdym rozwiązanym zadaniu (wzór z kitu) zamiast „ułożenia wyników rosnąco” (ZADANIA § 5); słowa z mebli salonu (KANAPA, DYWAN…), nie z listy kitu.
- [ ] S-15 10.6 — wariant co 4. rundę; zagadka dnia bez karty wyboru; zagadki z puli E3–E4 trafiają też do E5–E6 (przegląd F1); Zakrywanka 0–12 na każdym etapie; ×2 także za drugą próbę; warianty nie zmieniają opanowania.
- [ ] S-14b 9.6 — ARROW_TABLE bez „·3” i łańcuchów; WRITTEN bez „brakujących cyfr”; przeniesienie rysuje gra; oś-podpowiedź tylko E2–E3 do 30 (bez E1) i zastępuje rozkład „20 − 7” z S-03 (przegląd F4); oś SEQUENCE tylko w E2.7; wyższe progi E2.6/E3.9/E5.2/E6.7.

## Bieg 2026-10-15-fix-s14c-s14d (poprawka SV2-01, S-14c, S-14d)

Bieg uzgodniony 2026-10-15 („S-14c + S-14d + fix po audycie, pełna wysyłka”). Wysłane: #54 (poprawka CRITICAL SV2-01 z audytu #52 i HIGH SV2-02/SV2-03/SRR-02), #55 (S-14c), #56 (S-14d). `main` eaeec52: 2839 testów jednostkowych, 93 e2e.

### P0 — przed kolejnym biegiem

- [ ] Audyt po biegu, PR #57 (nie scalać w biegu): 0 CRITICAL, 0 HIGH, 14 MEDIUM. Najważniejsze: SVB-02 (po „Poczekaj dłużej” prawdziwy błąd odczytu wygląda jak `timeout`), SVB-04 (import/reset po limicie czasu mówi „bez zmian”, a zapis może jeszcze dojść), PIC-02 (drugi palec na OK płaci, gdy moneta jest jeszcze niesiona), PIC-03 (bez grafiki monet/odważników E1.11 może się nie odblokować w trybie z obrazkami).
- [ ] Poprawka zapisu 2.5 — po 3 nieudanych kopiach v1 w sesji (albo przy zamknięciu strony po pierwszej) gra zapisuje v2 bez kopii surowego v1. Zaakceptuj albo odwróć (PRD tego nie rozstrzyga; v2 zawiera wszystko z v1).

### P1 — na tablecie

- [ ] S-14d 9.6 — test z palcem 6-latka: przeciąganie monety do portfela, zdejmowanie stuknięciem, kafelki z figurami, „Po lewej / Po prawej / Tyle samo”.
- [ ] S-14c 4.8 — czy głos tabletu czyta „8 15” jako godzinę.
- [ ] Poprawka zapisu 4.8 — pomiar N-7 na iPadzie: czy 20 s „Poczekaj dłużej” wystarcza przy zimnym IndexedDB.

### P2 — później

- [ ] Follow-upy z wyzwalaczami w `context/archive/2026-10-15-save-v2-backup-health/`, `…-text-measure-time-types/`, `…-e1-shapes-picture-mode/` (`follow-ups/review-fixes.md`): m.in. SPATIAL, SYMMETRY, BONDS „połącz pary”, „ustaw zegar” w E5–E6, grafika portfela, mowa nierówności w E1.

### Decyzje biegu: zaakceptuj albo odwróć

- [ ] Poprawka zapisu 2.6 — import/reset w zmigrowanej sesji próbują zaległej kopii v1 raz i nie czekają na nią (SRR-04).
- [ ] Poprawka zapisu 4.7 — bez licznika startów; wyjście z trwałego `timeout` to „Poczekaj dłużej” na ten sam odczyt i warunkowa rada o danych strony.
- [ ] S-14c 9.6 — INEQUALITY na kafelkach (2 dobre, 2 złe) z jednym przykładem w rozwiązaniu; runda powtórkowa E6.11 losuje krok, potem umiejętność, ~14 % z E5 (w łagodzeniu więcej — audyt TXT-01); E6.11 nigdy nie jest startem ani rozgrzewką; bez LOGIC w E6.11; rozkład jazdy tekstem; ceny w pełnych złotych; bez „ustaw zegar” w E5–E6; wyższe progi odblokowania 10 kroków E1–E6; start E6 przesunięty przez grywalny E6.2.
- [ ] S-14d 9.7 — SPATIAL, SYMMETRY i BONDS „połącz pary” poza slice'em; ORDINAL tylko liczby do 5; E1.11 bez banknotu 10 zł (jest w E2.2); tryb z obrazkami jako filtr tylko w E1 (6 lat wrzesień–styczeń albo łagodzenie); wyższe progi E1.2 i E1.3; start E1 we wrześniu na E1.1; po złej zapłacie portfel się opróżnia.

## Bieg 2026-10-15-fix-s16bcd — S-16b (dźwięki)

- [ ] S-16b 9.7 — iPad, odsłuch: kontekst audio odblokowuje się na pierwszym dotyku, efekty grają z czytaniem poleceń bez ucinania mowy, głośność efektów i muzyki, pętla muzyki bez trzasku, przełącznik ciszy (zanotuj, co robi). Decyzje: `purchase` także przy darmowej zmianie wyglądu, jedno `answer-retry`, `tap` + `round-bonus`.
- [ ] S-16b 10.6 — iPad offline (tryb samolotowy po pierwszym uruchomieniu): dźwięki grają z cache.
- [ ] S-16b — efekty domyślnie włączone, muzyka domyślnie wyłączona; ustawienie leży poza zapisem (`localStorage`), więc import/reset zapisu go nie zmienia.
