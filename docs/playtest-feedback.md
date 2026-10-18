# Feedback z testów gry

Zbieramy tu uwagi z grania: rodzica i dziecka. Na razie tylko zapisujemy, niczego nie poprawiamy. Gdy
uzbiera się materiał, zrobimy z tego slice naprawczy (`/10x-autonomous-run fix:<id> "docs/playtest-feedback.md: F-01 …"`)
albo wsad do S-17 (playtest-balance).

Repozytorium jest publiczne: bez imion, zdjęć twarzy i innych danych dziecka. Wystarczy „córka (8 lat)”.

## Jak dopisać wpis

Kopiuj szablon na koniec sekcji „Wpisy”, numeruj kolejno (F-01, F-02, …). Wystarczy kilka słów — szczegóły
można dopisać później. Zrzuty ekranu wrzucaj do `docs/playtest-feedback/` i linkuj po nazwie pliku.

```markdown
### F-NN — <krótki tytuł>

- **Data:** 2026-10-__
- **Kto:** rodzic | córka (słowa dziecka w cudzysłowie, dosłownie)
- **Urządzenie:** iPad / Android / komputer, przeglądarka lub ikona na ekranie głównym
- **Wersja:** kod z rogu ekranu zadań (np. `d235d0d`)
- **Gdzie:** etap (E1–E6), ekran (zadania / pokój / minigra / zagadka / ustawienia)
- **Co się stało:**
- **Czego się spodziewałyśmy/spodziewaliśmy:**
- **Jak bardzo przeszkadza:** blokuje grę | denerwuje | drobiazg | pomysł
- **Zrzut / nagranie:** (opcjonalnie)
- **Status:** nowe
```

Statusy: `nowe` → `w slice <id>` → `naprawione (#PR)` albo `odrzucone (powód)`.

## Wpisy

<!-- Najnowsze na dole. -->

### F-01 — Lektor czyta każde zadanie sam, bez naciśnięcia głośnika

- **Data:** 2026-10-17
- **Kto:** rodzic (obserwacja gry córki)
- **Urządzenie:** —
- **Wersja:** —
- **Gdzie:** pierwsze uruchomienie, wybrany wiek 7 lat; ekran zadań
- **Co się stało:** każde zadanie lektor czytał od razu po pokazaniu.
- **Czego się spodziewaliśmy:** lektor czyta treść zadania dopiero po naciśnięciu głośnika.
- **Jak bardzo przeszkadza:** denerwuje
- **Uwagi techniczne:** to dzisiejsze zachowanie domyślne, nie błąd w kodzie: `balance.narrator.autoReadStages` = `['E1', 'E2']` (`src/data/balance.ts`), więc dla etapów E1–E2 (wiek 6–7 lat) automatyczne czytanie jest włączone, dopóki rodzic nie wyłączy go w ustawieniach (`Settings.autoRead`, `effectiveAutoRead` w `src/core/narration/voice.ts`). Poprawka to zmiana domyślnej wartości (np. pusta lista etapów) — decyzja projektowa sprzeczna z planem S-05 (auto-czytanie dla młodszych), do zapisania w slice'ie.
- **Status:** nowe

### F-02 — W trakcie gry nie da się zmienić wieku ani poziomu; zębatka „wygląda na nieaktywną”

- **Data:** 2026-10-17
- **Kto:** rodzic (obserwacja gry córki)
- **Urządzenie:** —
- **Wersja:** —
- **Gdzie:** ekran zadań, ikona zębatki w rogu
- **Co się stało:** córka przy pierwszym uruchomieniu wybrała wiek 9 lat, po chwili chciała zmienić na 8 i nie znalazła jak. Zębatka jest cały czas szara, wygląda na wyłączoną; zwykłe stuknięcie nic nie robi.
- **Czego się spodziewaliśmy:** da się zmienić wiek/poziom w trakcie gry; zębatka wygląda na klikalną.
- **Jak bardzo przeszkadza:** blokuje (nie wiadomo, jak cofnąć zły wybór wieku)
- **Uwagi techniczne:** zachowanie zgodne z obecnym projektem, nie błąd w kodzie: zębatka jest celowo wyciszona (S-08, `src/ui/widgets/SettingsIcon.ts`) i otwiera panel dopiero po przytrzymaniu 2 s (`balance.parentSettings.holdMs`) i rozwiązaniu bramki dla dorosłych (13–19 × 13–19, `src/core/parentGate.ts`); zmiana etapu jest w panelu rodzica (`changeStageByParent`). Wybór wieku jest tylko przy pierwszym uruchomieniu (`WelcomeScene`). Do decyzji w slice'ie: (a) podpowiedź, że zębatkę trzeba przytrzymać (wizualna lub tekstowa), (b) czy dziecko może samo poprawić wiek tuż po wyborze (np. „Wróć” na rozgrzewce), czy zmiana zostaje tylko dla dorosłego.
- **Status:** nowe

### F-03 — Ten sam typ zadania 3–4 razy z rzędu w jednej rundzie

- **Data:** 2026-10-18
- **Kto:** rodzic (obserwacja gry córki)
- **Urządzenie:** —
- **Wersja:** —
- **Gdzie:** ekran zadań, jedna runda (5 zadań); etap około 8–9 lat (E3–E4)
- **Co się stało:** w jednej rundzie córka dostała 3 albo 4 razy z rzędu zadanie tego samego typu, choć typów jest dużo.
- **Czego się spodziewaliśmy:** w rundzie różne typy zadań, przemieszane.
- **Jak bardzo przeszkadza:** denerwuje (nuży, wygląda jak powtórka)
- **Uwagi techniczne:** dziś runda losuje umiejętności z wagami 60/30/10 (bieżący krok / wcześniejsze kroki / poprzedni etap, `balance.curriculum.weights`, `buildAdaptiveRound` i `skillBuckets` w `src/core/curriculum.ts`), a `distinctTasks` (`src/core/round/unique.ts`) pilnuje tylko, żeby nie powtórzyło się to samo polecenie — nie typ. Bieżący krok ma często jedną–dwie umiejętności jednego typu, więc 60 % rundy to ten sam typ. Do decyzji w slice'ie: reguła różnorodności (np. najwyżej 2 zadania tego samego typu w rundzie, nie dwa takie same typy pod rząd), z zachowaniem udziałów z `docs/ZADANIA.md` i progu odblokowania kroku.
- **Status:** nowe
