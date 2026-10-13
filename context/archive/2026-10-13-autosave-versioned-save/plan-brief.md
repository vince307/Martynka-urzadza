# Autozapis i wersjonowany zapis (S-11) — Plan Brief

> Full plan: `context/changes/autosave-versioned-save/plan.md`
> Research: `context/changes/autosave-versioned-save/research.md`

## What & Why

Do dziś cały stan gry żyje w pamięci: każdy zimny start to powitanie, zero gwiazdek i pusty salon. S-11 sprawia, że po
zamknięciu gry, rozładowaniu tabletu albo cichej aktualizacji gwiazdki, salon, postęp nauki i ustawienia rodzica są
identyczne (FR-020, FR-021, US-04). Format zapisu trafia na tablety dzieci — to drzwi jednokierunkowe, więc jest
wersjonowany, ma mechanizm migracji i nigdy nie nadpisuje zapisu, którego nie umie przeczytać.

## Starting Point

Stan to pięć kluczy rejestru Phasera (`stars`, `rooms`, `currentRoom`, `learner`, `settings`) ustawianych w `main.ts`
`preBoot` i pisanych przez sceny. `SaveState` z planu §5 istnieje tylko jako nieużywany typ (z `rngSeed` bez odbiorcy);
`src/storage/` jest pusty, `idb-keyval` niezainstalowany; każde nieobsłużone odrzucenie IndexedDB podniosłoby kartę błędu.

## Desired End State

Gra wczytuje zapis przed startem i pomija powitanie, jeśli uczeń istnieje. Zapis dzieje się sam: 500 ms po zmianie, od
razu przy ukryciu karty, po zakupie mebla i po końcu rundy. Zapis uszkodzony albo z nowszej wersji zostaje nietknięty:
rodzic widzi kartę z eksportem surowej kopii (za bramką), dziecko może „Grać dalej” bez zapisu. Brak IndexedDB = gra bez
zapisu, bez karty.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Kształt v1 | To, co gra trzyma: `learner` nullable z `warmupPending` i `pendingUnlock: { stage, step }`, `profileId`; bez `rngSeed`/`savedAt`; klucze jawnie | Plan §5 gubi rozgrzewkę i odblokowanie, a pola bez odbiorcy to dług w formacie jednokierunkowym | Change / Research / Plan |
| Klucz i magazyn | `profile:default` w bazie `martynka`/`saves`, jeden obiekt | Jeden `put` = spójny stan; profile dojdą jako nowe klucze bez migracji | Research |
| Architektura | Czysty `core/save.ts` + `core/autosave.ts` (port `SaveStore`, zegary wstrzyknięte) + cienki `storage/idb.ts` | Logika testowalna bez przeglądarki; jeden importer `idb-keyval` pilnowany przez ESLint | Research |
| Kiedy zapis | Debounce 500 ms; natychmiast po zakupie i końcu rundy; `hidden` + `pagehide` | FR-020; iOS nie wysyła `pagehide` przy zabiciu aplikacji | Research |
| Nie pisz bez odczytu | `unreadable`/`unavailable` blokują autozapis na sesję; wyjątek fatalny też | Przejściowy błąd odczytu nie może nadpisać prawdziwego zapisu pustą grą | Plan |
| Nieczytelny zapis | Karta przed grą; eksport `martynka-zapis.txt` za bramką (share, potem pobranie); „Graj dalej” bez bramki | FR-021 bez blokowania dziecka; pobranie zawodne w aplikacji z ekranu iPada | Plan (wbrew rekomendacji researchu → `[human]`) |
| E2E dwóch buildów (#10) | Odroczone do pierwszej zmiany formatu | Przy jednym formacie to ta sama ścieżka co restart e2e | Research / Plan → `[human]` |
| Szew e2e | `?e2eSave=unreadable` z magazynem w pamięci, tylko build haka | Test nigdy nie pisze IndexedDB (profil § 9) | Plan |

## Scope

**In scope:** format v1 + migracje + fikstury, harmonogram zapisu, wczytanie z podłogą kalendarza, adapter IndexedDB,
`persist()`, granice lint, wpięcie w `main.ts`/sceny, przekazanie w `BootScene` poza obietnicą czcionki, karta
nieczytelnego zapisu z eksportem, status zapisu w haku e2e, spec `save-restart`.

**Out of scope:** eksport/import/reset w panelu rodzica (S-12), profile w UI, zapis rundy w toku, zmiana karty błędu,
e2e na dwóch buildach, wskaźnik zapisu dla dziecka.

## Architecture / Approach

`main.ts`: granica błędów → `loadSave(createIdbSaveStore())` → (karta, jeśli `unreadable`) → `new Game` ze stanem
startowym → `createAutosaver` nasłuchuje `changedata-*` pięciu kluczy rejestru; sceny wołają `flush('now')` z rejestru po
zakupie i końcu rundy; `visibilitychange`/`pagehide` wołają `flush('hidden')`. Zapis = migawka rejestru → `encodeSave`
→ `validateSave` → jeden `put`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Format v1 i migracje (tdd) | `core/save.ts`, typ v1, fikstury | Za luźna albo za ścisła walidacja |
| 2. Harmonogram, wczytanie, podłoga (tdd) | `core/autosave.ts`, `floorToCalendar`, `balance.save` | Nieobsłużone odrzucenie, zapis przy blokadzie |
| 3. Adapter i granica (tdd) | `idb-keyval`, `fake-indexeddb`, `storage/idb.ts`, ESLint | Blok flat config nadpisujący granice `core`/`data` |
| 4. Wpięcie w grę (impl) | Start asynchroniczny, autozapis, zapisy natychmiastowe, status w haku | Istniejące specy e2e z zapisem |
| 5. Karta nieczytelnego zapisu (impl) | Karta DOM, eksport, szew `?e2eSave` | Eksport na iPadzie (`[human]`) |
| 6. Seam sweep (impl) | Luki 42–44, follow-upy, `CLAUDE.md` | Nieaktualne „until S-11” |
| 7. E2E (e2e) | `save-restart.spec.ts` (3 testy, break'i A–D) | Chromium tylko u orkiestratora |

**Prerequisites:** S-10 scalony (jest); sieć do `registry.npmjs.org` w fazie 3.
**Estimated effort:** 7 faz, każda dla jednego świeżego agenta; fazy 4, 5 i 7 z e2e przez orkiestratora.

## Open Risks & Assumptions

- Format v1 jednokierunkowy i odchodzi od planu §5 — akceptacja maintainera przed pierwszym deployem (`[human]` 6.6).
- Trwałe `unavailable` (stary tryb prywatny) = gra bez zapisu bez sygnału; przejściowe na iOS = jedna sesja bez zapisu.
- Ostatnie ~0,5 s zmian może przepaść przy zabiciu aplikacji (nie zakup, nie koniec rundy).

## Success Criteria (Summary)

- Przeładowanie gry wraca do tego samego ucznia, salda i salonu (e2e test 1), zakup jest zapisany od razu (test 2).
- Zapis nieczytelny nigdy nie jest nadpisany, a rodzic może zachować jego kopię (unit + e2e test 3).
- Na iPadzie i Androidzie stan przeżywa zamknięcie, restart i cichą aktualizację (`[human]` 4.6).
