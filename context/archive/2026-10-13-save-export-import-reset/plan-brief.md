# Eksport, import i reset zapisu w panelu rodzica — Plan Brief

> Full plan: `context/changes/save-export-import-reset/plan.md`
> Research: `context/changes/save-export-import-reset/research.md`

## What & Why

Slice S-12 (FR-022, US-03) zamyka etap M5: rodzic w ustawieniach (za bramką dorosłego) eksportuje zapis do pliku,
importuje go po walidacji i podsumowaniu oraz resetuje grę z potwierdzeniem. Import i reset to jedyne miejsca, gdzie da
się nadpisać tygodnie postępu, więc nic nie nadpisuje bez podsumowania i drugiego stuknięcia, a zły plik nigdy nie dotyka
zapisu (ryzyko #7). Kontrakt runu dokłada cztery ustalenia audytu zapisu: M-S3, L-S2, N-8, M-S2.

## Starting Point

S-11 i save-observability dały autozapis v1 z wstrzykniętym magazynem, status runtime, sekcję „Zapis gry” i kartę
nieczytelnego zapisu z eksportem surowej kopii (pobranie zaraz po bramce). Brak eksportu bieżącego stanu, wyboru pliku,
podsumowania, resetu i jakiejkolwiek ścieżki, która bezpiecznie zastępuje zapis działającej gry (`block()` jest
jednokierunkowe, a `pagehide` przeładowania zapisałby stary stan).

## Desired End State

Panel ma „Zapisz kopię”, „Wczytaj z pliku”, „Zacznij od nowa”. Eksport po „Zapisz plik” daje `.txt` z kopertą JSON (build,
data). Import pokazuje „Teraz / Z pliku” (gwiazdki, etap, salon N z 10) i po „Wczytaj” przeładowuje grę ze stanem z pliku;
zły plik daje spokojny komunikat. Reset kończy się ekranem powitalnym. Karta nieczytelnego zapisu pokazuje kod i wersję;
„Zapis gry” mówi „jeszcze nie zapisano”, o wcześniejszych porażkach i o trwałości (`persist()`). Format zapisu dalej v1.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zastosowanie importu/resetu | `Autosaver.replace` (osobna flaga, czeka na zapis w toku, po sukcesie wyłącza zapisy) + przeładowanie | Ścieżka startu jest przetestowana; `block()` jest jednokierunkowe, a `pagehide` nadpisałby bezpośredni zapis | Research (opcja C) |
| Format pliku | `.txt` / `text/plain`, treść JSON w kopercie `{app, kind, build, exportedAt, save\|raw}` — wbrew literze FR-022 (`[human]` 6.8) | Share sheet Androida odrzuca `.json` | Research |
| Walidacja importu | Rozmiar → `JSON.parse` → koperta → zawsze `decodeSave`; `saveProblem` = pierwszy zły klucz do konsoli | Anty-wzorzec #7 „JSON.parse = poprawny plik” | Research / Plan |
| Miejsce akcji | Rząd przycisków pod „Zapis gry”; krok zastępuje panel w tej samej sesji wejścia; „Anuluj” wraca do gry | Bez drugiego `suspend()` (F5), callbacki w `session.run` (F2) | Research / Plan |
| Podsumowanie | „Teraz” obok „Z pliku”; reset pokazuje, co zniknie, i radzi najpierw zapisać kopię | Rodzic musi widzieć, co traci | change.md / Plan |
| Nazwa pliku | Bieżący: `martynka-zapis-RRRR-MM-DD.txt`; surowy: `martynka-zapis.txt` | Kilka kopii w Plikach się nie nadpisuje | Plan |
| Zdrowie zapisu | `notYet` po `failing`; `earlierFailures` z licznika życia; `persistence` w statusie runtime | N-8, M-S2; `data-state` bez zmian dla istniejących e2e | Plan |
| Import z powitania | Nie (follow-up) | FR-022/US-03 mówią o ustawieniach | Plan |

## Scope

**In scope:** eksport bieżącego zapisu z potwierdzeniem; import z walidacją, podsumowaniem i przeładowaniem; reset z
potwierdzeniem; M-S3 (kod + build na karcie i w pliku), L-S2 (potwierdzenie przed pobraniem, także kopii surowej), N-8,
M-S2; notka prywatności; DESIGN-GAP 46–51; follow-upy; `CLAUDE.md`; e2e #7/#2/#10.

**Out of scope:** zmiana formatu zapisu (v1 zostaje), N-7, L-S1, F7, import z ekranu powitalnego, kopia poprzedniego
zapisu w IndexedDB, ostrzeżenie drugiej karty, File System Access API, `deploy/`.

## Architecture / Approach

Czysta logika w `src/core` (test-first): `Autosaver.replace/current`, `freshSession`, `src/core/saveFile.ts`
(`exportFileText`, `parseImport`, `saveSummary`), `saveProblem`, rozszerzony `saveHealthView`. DOM w `src/ui/dom/`: po
jednym dialogu na akcję (eksport, import, reset) z własną obsługą asynchroniczności (`share`, `file.text()`, `replace`) i
wstrzykniętym `reload`. `UIScene.openSettings` przekazuje `onExport/onImport/onReset` w `session.run`. Teksty w
`pl.saveTransfer`, limit w `balance.save.importMaxBytes`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. `replace` + `freshSession` (tdd) | Bezpieczne zastąpienie zapisu w `core` | Wyścig z zapisem w toku / `pagehide` |
| 2. Plik zapisu (tdd) | Koperta, `parseImport`, podsumowanie, `saveProblem` | Plik parsowalny, ale zły |
| 3. Zdrowie zapisu (tdd) | `notYet`, wcześniejsze porażki, `persist()` | Kolejność stanów łamie istniejące e2e |
| 4. Eksport (impl) | Dialog potwierdzenia, M-S3 na karcie, test FR-021 zaktualizowany | Aktywacja `share()` na iPadzie |
| 5. Import (impl) | Wybór pliku, podsumowanie, `replace` + przeładowanie | Nadpisanie bez podsumowania |
| 6. Reset + seam sweep (impl) | Dialog resetu, luki 46–51, follow-upy, `CLAUDE.md` | Duplikaty z faz 4–5 |
| 7. E2E (e2e) | `save-transfer.spec.ts`: 4 testy + 5 przerw | Chromium tylko u orkiestratora |

**Prerequisites:** S-11 i save-observability-c1-c2 na `main` (są); baseline unit 1176, e2e 33 @ `f3088d4`.
**Estimated effort:** 7 faz, każda jednym świeżym agentem; e2e faz 4–7 przez protokół request-file.

## Open Risks & Assumptions

- Zachowanie share sheet, wyboru pliku i `persist()` na iPadzie/Androidzie potwierdzi tylko człowiek (`[human]` 4.7, 5.6, 6.10).
- Druga karta tego samego originu nadpisze zaimportowany zapis (ryzyko przeniesione).
- Przeładowanie może uruchomić nowszy build z SW — jak każdy start; nowy build musi czytać v1.

## Success Criteria (Summary)

- Rodzic eksportuje, importuje i resetuje zapis z panelu, bez sieci, zawsze po wyraźnym potwierdzeniu.
- Zły, za duży, obcy albo nowszy plik daje jasny komunikat, a zapis po przeładowaniu jest identyczny (e2e #7).
- Dobry plik i reset dają po przeładowaniu dokładnie stan z pliku / ekran powitalny (e2e #2/#10); fixtury v1 nietknięte.
