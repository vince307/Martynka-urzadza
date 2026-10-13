---
change_id: autosave-versioned-save
title: Autozapis w IndexedDB i wersjonowany zapis z migracjami (stan po restarcie i aktualizacji identyczny)
status: plan_reviewed
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-11 z roadmapy (etap M5, pierwszy slice zapisu): po zamknięciu gry (albo rozładowaniu tabletu) i ponownym otwarciu,
także po cichej aktualizacji (FR-003), **gwiazdki, salon i postęp nauki są dokładnie takie same**. Zapis dzieje się
sam: po każdej zmianie stanu z opóźnieniem ok. 500 ms (liczba w `src/data/balance.ts`), przy `visibilitychange`
(ukrycie karty), a **natychmiast** po zdarzeniach nieodwracalnych: zapłata za mebel i koniec rundy (FR-020). Zapis jest
**wersjonowany** (`SaveState.version`), migracje to czysty kod w `src/core/save.ts` z testami najpierw; **nieudana
migracja zostawia stary zapis nietknięty** i nie daje dziecku pustej gry (FR-021). Jedyny moduł przeglądarkowego
magazynu to `src/storage/idb.ts` na `idb-keyval`. Nic nie opuszcza urządzenia.

To drzwi jednokierunkowe: format v1 trafia na tablety dzieci i każdy następny build musi go wczytać. Eksport, import z
podsumowaniem i reset w panelu rodzica to S-12 (wyjątek — patrz decyzja 4).

Źródła: `context/foundation/roadmap.md` (`## At a glance`, `### S-11`), `context/foundation/prd.md` (FR-003, FR-020,
FR-021, US-04 i jego AC, guardrail „Postęp nigdy nie ginie”), `Martynka-urzadza.md` (§1 jeden profil — „format zapisu
zostawia miejsce na profile”, §3 `idb-keyval`, §4 `core/save.ts` i `storage/idb.ts`, §5 `LearnerState`/`RoomState`/
`Settings`/`SaveState`, §8 Zapis postępu, §9 cicha aktualizacja „zapis chronią migracje”, §11 M5),
`context/foundation/test-plan.md` (ryzyka #2, #10, #16 „kiedy zapis jest pisany”, rollout faza 4, §6.5 „TBD”),
`context/foundation/test-stack.md`, `context/foundation/autonomous-run.md` (§4, §9 „stany tylko przez produkt, nigdy
zapis do IndexedDB”), archiwa `2026-10-13-variant-change-room-done/` i `2026-10-13-first-furniture-purchase/` (wzorzec +
follow-upy), kod: `src/main.ts` (`preBoot`), `src/data/layout.ts` (`REGISTRY_KEYS`), `src/core/types.ts` (`SaveState`),
`src/core/placement.ts` (`SessionLearner`, `PlacedLearner`, `needsPlacement`, `initialSettings`),
`src/core/curriculum.ts`, `src/core/mastery.ts`, `src/core/rng.ts`, `src/core/errorSignal.ts` (`QUIET_REJECTIONS`),
`src/scenes/{BootScene,TaskScene,RoomScene,UIScene,WelcomeScene}.ts`, `src/ui/dom/{errorBoundary,errorCard}.ts`,
`src/testing/e2eHook.ts`. Plik `lessons.md` w `context/foundation/` nie istnieje (nie ma czego zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/autosave-versioned-save` @ `f67b9f4` (= `main` po S-10, PR #32).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-10 | `done` (#32). Cały stan pętli żyje w rejestrze Phasera, ustawiany w `main.ts` `preBoot`: `stars` (0, w buildzie e2e `?e2eStars`), `rooms` (`{ salon: emptyRoomState() }`), `currentRoom`, `settings` (`initialSettings()` → `{ autoRead: null }`); `learner` (`SessionLearner`) pojawia się dopiero po powitaniu (`WelcomeScene`). | Bez korekty. |
| „stan … przechowywany” — plan §5 `SaveState { version, stars, learner: LearnerState, rooms, currentRoom, settings, rngSeed }` | `SaveState` jest w `src/core/types.ts`, ale **nikt go nie używa**. Gra trzyma `SessionLearner` = `PlacedLearner` (`age`, `stage`, `stageOverriddenByParent`, **`warmupPending`**) & `Adaptation` (`unlockedStep`, `mastery`, `streak`, `history` z polem `example`, `weakStreak`, `easedRounds`) & **`pendingUnlock: number \| null`** — czyli więcej niż `LearnerState`; przed powitaniem uczeń **nie istnieje** (`needsPlacement(null)`). `rngSeed` nie ma odbiorcy: sceny losują ziarno z `Date.now()`/`Math.random()`. `Settings.autoRead` to `boolean \| null`. | Format v1 **odchodzi od planu §5**: `learner` może być `null` (gra przed powitaniem) i niesie `warmupPending` + `pendingUnlock` (ten jako `{ stage, step }`, follow-up S-08); los `rngSeed` rozstrzyga research (decyzja 3). Odstępstwo zapisane w planie, typ w `core/types.ts` dopasowany do tego, co gra naprawdę trzyma. |
| „zapis następuje sam po każdej zmianie” | Wszystkie zapisy stanu idą przez `registry.set` (`TaskScene.syncStars` po każdym zadaniu, `TaskScene` przy końcu rundy/rozgrzewki/karcie, `RoomScene.dispatch` zakup i zmiana wariantu, `UIScene` ustawienia i zmiana etapu, `WelcomeScene` powitanie). Brak jednego punktu nasłuchu i brak jakiegokolwiek zapisu. | Jeden autozapis nasłuchujący zmian kluczy zapisu w rejestrze (debounce z `balance`), plus jawne „zapisz teraz” w gałęzi zakupu `RoomScene` i w `TaskScene.finishRound`; kształt (zdarzenie rejestru vs jawne wywołania) ustala research. |
| „przy ukryciu karty” | `main.ts` ma już słuchacza `visibilitychange` (tylko `narrator.cancel()`). | Ten sam moment dostaje natychmiastowy zapis (flush debounce); także `pagehide` jeśli research uzna (iPad PWA). |
| „natychmiast po zapłacie za mebel i końcu rundy” | `RoomScene.dispatch` gałąź `bought` i `TaskScene.finishRound` istnieją; zapisu brak. | W zakresie (follow-upy S-09/S-10). Zmiana wariantu: zwykły autozapis wystarcza (darmowa, odwracalna) — research potwierdza. |
| „gwiazdki, salon i postęp nauki są dokładnie takie same” | Runda w toku nie jest stanem zapisu (żyje w `TaskScene`); gwiazdki za zadania trafiają do salda po każdym zadaniu. Karta „Pokój gotowy!” pokazuje się tylko przy zdarzeniu (S-10, gap 39) — **nie potrzebuje flagi „widziana”**. Placement przy zimnym starcie: dziś zawsze powitanie. | „Identyczny” = saldo, pokoje, `currentRoom`, uczeń (z adaptacją), ustawienia. Runda w toku **nie** jest zapisywana: zimny start w trakcie rundy zaczyna nową rundę (gwiazdki już zdobyte zostają). `BootScene` po wczytaniu pomija powitanie (`needsPlacement` na wczytanym stanie). Podłoga kalendarza `max(zapisany, calendarStart)` na starcie sesji (follow-up S-07). |
| „zapis ze starszej wersji gry jest przenoszony do nowej” | **Starszej wersji zapisu nie ma** — żaden build nie zapisywał. | v1 to pierwszy format; nie ma realnej migracji do napisania. Powstaje **mechanizm** (rozpoznanie wersji, łańcuch migracji, v1 = tożsamość, zapis „z przyszłości” po rollbacku deployu, uszkodzony zapis) + fikstury per wersja (`tests/fixtures/`), żeby v2 miało gdzie się dopiąć. Patrz `## Migration`. |
| „nieudane przeniesienie zostawia stary zapis i oferuje eksport” | Eksport jest w S-12 (FR-022); `src/ui/dom/` ma karty i dialogi (`errorCard`, `dialog`, bramka rodzica). Kit nie ma żadnego widoku zapisu. | **Korekta zakresu**: S-11 zostawia stary zapis nietknięty (autozapis zablokowany na tym kluczu) i pokazuje rodzicowi kartę DOM z eksportem **surowego** zapisu do pliku (decyzja 4); walidowany import, podsumowanie i reset zostają w S-12. DESIGN-GAP. |
| Prerequisite stack: `idb-keyval` (plan §3, tech-stack) | **Brak w `package.json`**; `src/storage/` pusty (profil §10 trzyma `src/storage/idb.ts` jako ścieżkę planowaną). | Instalacja `idb-keyval` w pierwszej fazie kodu (sieć: `npm install` poza piaskownicą agenta, jeśli zablokuje). Reguła ESLint: tylko `src/storage/` dotyka `idb-keyval`/`indexedDB`. |
| Unknowns: — | Faktycznie są: kształt v1 vs plan §5 (wyżej), los `rngSeed`, miejsce na profile (plan §1), zachowanie przy zapisie z nowszej wersji (rollback deployu), uszkodzony/niepełny zapis, błąd zapisu (quota, `AbortError` — dziś `QUIET_REJECTIONS` w `errorSignal.ts` ją ucisza), kolejność startu (asynchroniczne wczytanie przed `BootScene`, wyścig z obietnicą czcionki), jak e2e udowadnia przeżycie restartu bez pisania do IndexedDB, czy Safari/iPad czyści IndexedDB (eviction, `navigator.storage.persist()`). | Rozstrzygnięte kierunkowo niżej (decyzje 1–8); szczegóły dla research. |
| Risk: „cały stan pętli w jednym formacie od razu zmniejsza liczbę migracji” | Prawda — dziś stan obejmuje pokój (S-09/S-10), ucznia (S-06/S-07) i ustawienia (S-08). | Bez korekty; dochodzi ryzyko odwrotne: nadmiarowe pola (`rngSeed`) też są jednokierunkowe. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §8 (zapis), §1 (miejsce na profile), PRD FR-020/FR-021/US-04,
kit `designs/martynka-maths-A-v1/` (sprawdzony: `screenshots/` i `preview.js` **nie mają żadnego widoku zapisu,
błędu wczytania ani eksportu**).

- **Widoki kitu wiązane przez ten slice:** żaden ekran dziecka się nie zmienia — zapis jest niewidoczny. Karta błędu
  (`src/ui/dom/errorCard.ts`, z obserwowalności, sama już poza kitem) jest **wzorcem** dla karty nieudanego wczytania.
- **Brak w kicie → DESIGN-GAP** (nowe wiersze `docs/design-gaps.md` od 42): (a) karta „zapisu nie udało się wczytać”
  dla rodzica z eksportem surowego pliku (decyzja 4); (b) ewentualna linia o stanie zapisu w panelu ustawień (tylko jeśli
  research uzna ją za potrzebną — domyślnie nie).
- **Kopia (klucze do `src/data/pl.ts`):** ze specyfikacji nie ma żadnej. Nowe, bez źródła w kicie → DESIGN-GAP +
  teacher read: tekst karty nieudanego wczytania i jej przycisku eksportu; **zmiana `pl.errorCard.body`** („Dotknij
  przycisku, a gra uruchomi się od nowa.”) tak, by obiecywała powrót do zapisanego postępu (follow-up obserwowalności) —
  tylko jeśli research potwierdzi, że restart wraca do zapisu sprzed błędu.
- **Nie w tym slice:** eksport/import z podsumowaniem i reset w panelu rodzica (S-12), wiele profili w UI (poza v1),
  miary z historii (S-17).

## Migration

**Migracja w sensie profilu §4 (baza danych): nie.** Nie ma bazy ani hostowanej, ani lokalnej usługi; nie ma katalogu
migracji, `db push` ani resetu. Krok ship nie ma nic do wypchnięcia.

**Migracje formatu zapisu (kod w aplikacji): tak, jako mechanizm — bez realnej migracji danych.** S-11 tworzy format v1
(`SaveState.version = 1`) i `src/core/save.ts` z: rozpoznaniem wersji, łańcuchem `migrate` (v1 = tożsamość), walidacją
kształtu po migracji, odrzuceniem zapisu „z przyszłości” (wersja > bieżąca, np. po rollbacku deployu: wczytanie
**bez nadpisywania**) i uszkodzonego JSON-u — w każdym z tych przypadków stary zapis zostaje bajt w bajt (FR-021,
profil §4 „a save written by version N loads in N+1, a failed migration keeps the old save”). Testy najpierw:
round-trip, fikstury per wersja w `tests/` (dziś tylko v1 + celowo zepsute), „nieudana migracja nie pisze”. Pierwsza
prawdziwa migracja przyjdzie z pierwszą zmianą kształtu (np. S-12 albo S-15) i dopisze fiksturę v1 → v2. Test-plan §6.5
(„Adding a save migration test — TBD”) dostaje treść przy archiwizacji / odświeżeniu planu testów.

## Triggered follow-ups (Trigger: S-11)

| Follow-up (archiwum) | Moje zdanie o zakresie |
|---|---|
| Zapis `stars`, `rooms`, `currentRoom` z rejestru, natychmiast po zakupie w `RoomScene` (gałąź `bought`). (first-furniture-purchase) | **Rdzeń** — w zakresie. |
| Zapis po zmianie wariantu (gałąź `changed` w `RoomScene.dispatch`) i po zakupie; flaga „Pokój gotowy!” widziana? (variant-change-room-done) | **W zakresie**; zmiana wariantu przez zwykły autozapis. **Flaga niepotrzebna**: karta pokazuje się tylko przy zdarzeniu ukończenia (S-10, gap 39), po zimnym starcie gotowy pokój ma przycisk „Poprawki” — nie dodaję pola do formatu v1. |
| „Wcześniejszy zapis przed codzienną grą” obejmuje pokój / ucznia / ustawienia (first-furniture-purchase, adaptive-curriculum, parent-settings-progress, first-launch-placement; `Trigger: before S-11, or any deploy used for daily play`) | **Zamykane przez ten slice** (S-11 jest tym zapisem). |
| Zapis pełnego `SessionLearner` + podłoga `max(zapisany, calendarStart)` na starcie sesji (adaptive-curriculum) | **W zakresie** — podłoga to czysta funkcja w `core/curriculum.ts`, testy najpierw. |
| `endRound`/`recordRound` zwracają `Adaptation` z polami placementu — przy zapisie wybrać klucze jawnie (adaptive-curriculum) | **W zakresie** — serializacja w `core/save.ts` wybiera klucze jawnie (nie `...spread` całego obiektu sesji). |
| `pendingUnlock` jako `{ stage, step }` albo czyszczenie przy zmianie etapu (adaptive-curriculum; parent-settings-progress) | **W zakresie** — v1 zapisuje `{ stage, step }`; liczba bez etapu po wczytaniu może wskazać inny krok (jednokierunkowe — lepiej teraz niż migracją). |
| Persist `SessionLearner` z `warmupPending`, `needsPlacement` na wczytanym stanie — powitanie tylko przy pierwszym uruchomieniu (first-launch-placement) | **W zakresie** — `BootScene` decyduje na wczytanym uczniu. |
| Ustawienie `autoRead` z zapisaną wartością (narrator-round-summary; parent-settings-progress) | **W zakresie** — `Settings` w v1. |
| Historia z polem `example` (przykłady błędów) w zapisie (parent-settings-progress) | **W zakresie** — część `history`, przycięta do `balance.mastery.historyLength` (200). |
| Karta błędu ma obiecywać powrót do zapisanego postępu (observability-c1-c2) | **W zakresie**, warunkowo: zmiana `pl.errorCard.body` + teacher read, gdy research potwierdzi, że ostatni zapis przed błędem jest kompletny. |
| Lista szumu `AbortError`/`NotAllowedError`: przerwana transakcja IndexedDB to `AbortError`, więc prawdziwy błąd zapisu byłby tylko `console.warn` (observability-c1-c2) | **W zakresie** — błędy zapisu łapie i raportuje sam moduł zapisu (nie przez globalną granicę błędów); research ustala, czy błąd zapisu ma być fatalny (moja intuicja: nie — gra działa dalej, zapis ponawia przy następnej zmianie). |
| Przekazanie w `BootScene.create` poza obietnicą czcionki (`.catch` połyka wyjątek startu) (observability-c1-c2) | **W zakresie** — S-11 i tak zmienia start (asynchroniczne wczytanie przed wyborem sceny). |
| F4: `WelcomeScene.openParent` strzeże `this.session` zamiast `this.session?.active()` (observability-c1-c2; `Trigger: S-11 (a non-final error path) …`) | **Poza zakresem**, chyba że plan doda niefinalną ścieżkę błędu w powitaniu; karta nieudanego wczytania nie wchodzi przez `WelcomeScene`. Przenoszę z tym samym triggerem. |
| F7: `pl.settings.empty` także dla dziecka bez błędów (parent-settings-progress; `Trigger: S-11, or a parent's feedback`) | **Poza zakresem** — kopia podglądu rodzica, nie format zapisu; przenoszę na S-12 (ten sam panel) albo opinię rodzica. |
| Test-plan: ryzyka #13/#14 do planu testów (`Trigger: /10x-test-plan refresh, or before S-11`) | **Już zamknięte** odświeżeniem planu testów 2026-10-13 (ryzyka #12–#17 są w `test-plan.md` §2). |

## Autonomous decisions

1. **Format v1 = to, co gra naprawdę trzyma, nie dosłownie plan §5.**
   - `SaveState` v1: `version: 1`, `stars`, `learner: SavedLearner | null` (placement + `warmupPending` + adaptacja +
     `pendingUnlock: { stage, step } | null`), `rooms`, `currentRoom`, `settings` (`autoRead: boolean | null`). Typ w
     `core/types.ts` zostaje zaktualizowany; odstępstwo od planu §5 opisane w planie.
   - Odrzucone: dosłowny `LearnerState` z planu (gubi `warmupPending`/`pendingUnlock`, wymusza ucznia przed powitaniem);
     zapis całego obiektu sesji przez spread (do formatu przeciekają pola, których nikt nie wersjonował).
   - Co zmieniłoby odpowiedź: research pokaże pole sesji, które da się odtworzyć bez zapisu — wtedy wypada z v1.
2. **Jeden klucz IndexedDB na zapis, opakowany pod profile.** Np. klucz `save` z obiektem v1; miejsce na profile
   (plan §1) przez `profileId` w kluczu albo w kopercie — kształt ustala research, ale **musi** istnieć w v1, bo
   dodanie go później to migracja na urządzeniach. Odrzucone: kilka kluczy (stars/rooms/learner osobno — niespójny stan
   przy przerwanym zapisie). Co zmieniłoby odpowiedź: research znajdzie, że `idb-keyval` `setMany`/`update` daje
   atomowość dla wielu kluczy — nadal jeden klucz jest prostszy.
3. **`rngSeed` — research rozstrzyga, kierunek: nie zapisywać.** Dziś nie ma odbiorcy; pole w formacie jednokierunkowym
   bez znaczenia to dług. Odrzucone: zapis „na zapas”. Co zmieniłoby odpowiedź: research wskaże powód odtwarzalności
   losowania po restarcie (np. ta sama runda po zimnym starcie) — wtedy pole z odbiorcą.
4. **Nieudane wczytanie: stary zapis nietknięty + karta DOM dla rodzica z eksportem surowego pliku; reszta S-12.**
   - FR-021 każe „pokazać rodzicowi możliwość eksportu zamiast pustej gry”, a eksport jest w S-12 — biorę do S-11
     tylko minimalny eksport surowych bajtów zapisu (pobranie pliku JSON, bez walidacji), bo to jedyne wyjście, które nie
     traci danych. Autozapis na tym kluczu jest zablokowany do decyzji rodzica; czy dziecko może grać dalej „bez zapisu”
     i co mówi karta — research + plan (DESIGN-GAP, teacher read).
   - Odrzucone: pusta gra (zakazane przez FR-021); karta bez eksportu do S-12 (FR-021 dosłownie wymaga eksportu, a S-11
     ląduje na urządzeniach wcześniej); cicha naprawa „najlepszym wysiłkiem” (może nadpisać dane).
   - Co zmieniłoby odpowiedź: S-11 i S-12 lądują w jednym deployu — wtedy karta może odesłać do eksportu z S-12.
5. **Zapis z nowszej wersji (rollback deployu) traktowany jak nieudane wczytanie, nigdy nadpisywany.** Profil §5:
   rollback robi człowiek; po nim build v1 może zobaczyć zapis v2. Co zmieniłoby odpowiedź: nic w v1 — to warunek
   „jednokierunkowych drzwi”.
6. **Błąd zapisu (quota, `AbortError`, brak IndexedDB w trybie prywatnym) nie jest fatalny.** Gra działa, moduł zapisu
   loguje `console.error` i ponawia przy następnej zmianie; nie przez globalną kartę błędu. Research sprawdza
   `navigator.storage.persist()` (eviction w Safari). Co zmieniłoby odpowiedź: research pokaże, że ciche gubienie
   zapisu przez wiele sesji jest realne — wtedy sygnał dla rodzica w panelu ustawień.
7. **E2E przez produkt i przeładowanie strony, odczyt przez hak e2e.** Spec gra (zdobywa gwiazdki, kupuje mebel,
   przechodzi powitanie), przeładowuje stronę i czyta stan przez read-only hak; nigdy nie pisze do IndexedDB (profil
   §9). Ryzyko #10 (dwa buildy, aktualizacja zachowuje stan) — research ustala, czy da się je zrobić lokalnie w tym
   slice (dwa buildy z różnym `__BUILD_ID__`), czy to wiersz `[human]`/osobna faza testplanu 4. `?e2eStars` zostaje
   ziarnem tylko dla świeżego startu (nie nadpisuje wczytanego zapisu) — do potwierdzenia w research.
8. **Krok następny: `/10x-research`, nie `/10x-plan`** (skill domyślnie proponuje plan) — prompt kroku runu ustala
   research, a niewiadomych jest dużo (kształt v1, profile, start asynchroniczny, eviction na iPadzie, ścieżka e2e).
