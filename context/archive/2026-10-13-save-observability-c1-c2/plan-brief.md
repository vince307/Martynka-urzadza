# Zdrowie zapisu widoczne dla rodzica, przyczyna nieudanego odczytu i naprawa nieznanego pokoju — Plan Brief

> Full plan: `context/changes/save-observability-c1-c2/plan.md`
> Research: `context/changes/save-observability-c1-c2/research.md`

## What & Why

Audyt observability z 2026-10-13 (PR #34) znalazł trzy ciche ścieżki utraty postępu: odczyt zapisu, który rzuca, daje
`unavailable` bez nazwy i sesję bez zapisu, o której nikt nie wie (C-1); trwałe porażki zapisu zostają tylko w konsoli
(C-2); nieznany `currentRoom` w zapisie miesza dwa pokoje i pierwszy zakup nadpisuje salon (H-R3). Guardrail PRD
„Postęp nigdy nie ginie” wymaga, żeby rodzic przynajmniej widział, że zapis nie działa — lokalnie, bez telemetrii.

## Starting Point

S-11 dał autozapis z wstrzykniętym magazynem, statusem runtime czytanym tylko przez hak e2e, kartą nieczytelnego zapisu
(DESIGN-GAP 42) i decyzją „nic nie pokazujemy” (DESIGN-GAP 43). `loadSave` nie ma limitu czasu; `RoomScene` liczy pokój
i stan z dwóch różnych id.

## Desired End State

Niedostępny albo wiszący (5 s) odczyt kończy się spokojną kartą przed grą i grą bez zapisu. Rodzic w panelu ustawień
widzi „Zapis gry”: działa (z godziną), ostatnie próby się nie udały, albo wyłączony (z przyczyną). Zapis z nieznanym
pokojem wczytuje się do salonu, a stan innych pokojów zostaje nietknięty. Format zapisu dalej v1.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Gdzie żyje status | `AutosaveStatus` (runtime): `blockedBy`, `lastError` (nazwa), `lastWriteAt`, `consecutiveFailures` | Format v1 to drzwi jednokierunkowe; fixtury dowodzą niezmienionego `encodeSave` | Research / kontrakt |
| Powód blokady | Pierwszy wygrywa | Oryginalna przyczyna jest użyteczna dla rodzica | Plan (research OQ 1) |
| Sygnał dla rodzica | Sekcja „Zapis gry” w panelu (migawka przy otwarciu) + karta przed grą dla `unavailable` | Panel jest osiągalny dopiero po powitaniu; karta zamyka C-1 od razu | Research / Plan |
| Karta | Sparametryzowana karta nieczytelnego zapisu, bez eksportu | Jeden wygląd, brak duplikatu; nie ma czego eksportować | Research |
| Limit odczytu | 5000 ms w `balance.save.loadTimeoutMs`, w `loadSave` z wstrzykniętymi timerami; porzucony odczyt z `.catch` | Pusta strona bez końca wygląda jak awaria; spóźnione odrzucenie nie może dojść do granicy | Research |
| Nieznany pokój | Czysta `repairCurrentRoom` w `start` (znane id jako parametr); nie ostrzejszy `validateSave` | Ostrzejsza walidacja zrobiłaby z zapisu `corrupt` przy każdym starcie | Research |
| Szwy e2e | `?e2eSave=unavailable|hang|writefail` w buildzie hook; `hang` z limitem 300 ms tylko tam | Bez `page.clock`; istniejący znacznik `e2eSave` je obejmuje | Plan |
| M-R6 | Bez reakcji sceny; porażka widoczna w panelu | Cofanie zakupu zabrałoby dziecku mebel | change.md |

## Scope

**In scope:** C-1, C-2, M-R6, M-S5, M-S4, H-R3, M-R5 i L-R10 (testy danych po `ROOMS`), follow-up F3 z S-11 (szew
`unavailable` + spec), DESIGN-GAP 43 przepisany, nowy 45, follow-upy z `Trigger:`.

**Out of scope:** M-S1 (`deploy/`), M-S2 (`persist()`), M-S3/L-S1, M-R4, L-S2, L-S3, L-R8, L-R9, L-R11; eksport/import
w panelu (S-12); zmiana formatu zapisu; telemetria; cofanie zakupu; `page.clock`.

## Architecture / Approach

Czysty `core` (status, `saveHealthView`, `loadSave` z limitem, `repairCurrentRoom`) z wstrzykniętym zegarem, timerami i
listą pokojów; jedyne wiązanie z przeglądarką w `src/main.ts` `start`; DOM tylko renderuje (`saveFailedCard.ts`
sparametryzowany, nowy `saveHealthView.ts` wzorem `progressView.ts`); teksty w `pl.ts`. Szwy e2e w `src/testing/e2eHook.ts`
za `__E2E_HOOK__`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Status runtime (tdd) | Nowe pola statusu, `block(reason)`, `saveHealthView`, fixtury v1 w obie strony | Przypadkowa zmiana `SessionSave`/`encodeSave` |
| 2. Odczyt i limit (tdd) | Nazwa błędu w `unavailable`, limit 5 s, szwy `?e2eSave=` | Spóźnione odrzucenie → karta awarii |
| 3. Nieznany pokój (tdd) | `repairCurrentRoom`, jeden resolver w `RoomScene`, testy po `ROOMS` | Naprawa dotyka innych pokojów |
| 4. Karta (impl) | Karta „zapis niedostępny” przed grą | Karta jako rutyna w trybie prywatnym |
| 5. Panel + seam sweep (impl) | Sekcja „Zapis gry”, DESIGN-GAP 43/45, follow-upy, `CLAUDE.md` | Tekst niezrozumiały dla rodzica |
| 6. E2E #2 (e2e) | 4 testy: niedostępny, wiszący, porażka zapisu, zapis działa | Chromium niedostępny w sesji agenta |

**Prerequisites:** gałąź `feat/save-observability-c1-c2` z `main` @ `4698110`; baseline unit 1142, e2e 29.
**Estimated effort:** 6 faz, każda dla jednego świeżego agenta (~1 sesja każda).

## Open Risks & Assumptions

- `unavailable` nie jest rutyną w prywatnych oknach (wniosek, nie pomiar) → `[human]` sprawdzenie na iPadzie/Androidzie.
- 5 s może nie wystarczyć zimnemu otwarciu bazy na starym iPadzie (karta, ale bez utraty — saver zablokowany).
- `[human]`: forma sygnału (rewizja DESIGN-GAP 43) i akceptacja tekstów.

## Success Criteria (Summary)

- Rodzic dowiaduje się z panelu (albo z karty przed grą), że zapis nie działa i dlaczego — nic nie opuszcza urządzenia.
- Żaden nieznany pokój w zapisie nie nadpisuje salonu; format v1 bez zmian.
- E2E #2: +4 zielone, każdy dowiedziony przerwą w kodzie produkcyjnym.
