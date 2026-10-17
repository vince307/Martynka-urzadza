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
