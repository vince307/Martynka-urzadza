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
