---
project: "Martynka urządza"
version: 1
status: draft
created: 2026-10-11
updated: 2026-10-14
prd_version: 1
main_goal: market-feedback
top_blocker: external
milestone_id: v1-pelna-petla-m0-m8
milestone_seq: 1
milestone_status: open
---

# Roadmap: Martynka urządza

> Derived from `context/foundation/prd.md` (v1) + `Martynka-urzadza.md` sekcja 11 (etapy M0–M8) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

Uwaga o nazewnictwie: `M-01` to kamień milowy tej roadmapy (pętla 10x). `M0`–`M8` to etapy z planu `Martynka-urzadza.md`; ich kolejność jest wiążąca. Każdy wycinek należy do dokładnie jednego etapu planu (kolumna „Etap” w tabeli), a pierwszy wycinek etapu ma w Prerequisites ostatni wycinek etapu poprzedniego. „Parallel with” liczone jest tylko w obrębie jednego etapu.

## Milestone

**M-01: Wersja 1, pełna pętla gry (etapy M0–M8)** — Status: open

- **Intent:** Córka gra sama na tablecie w pełną pętlę: runda zadań E3–E4 → gwiazdki → urządzanie salonu, z zapisem, docelową grafiką i balansem po testach z graczem. Kamień zamyka się, gdy wszystkie etapy planu M0–M8 są dostarczone.
- **Source materials:** `context/foundation/prd.md` (v1); kolejność etapów z `Martynka-urzadza.md` sekcja 11.
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001–FR-027 (wszystkie must-have), US-01–US-04, NFR z PRD.

## Vision recap

Dziecko w klasach 1–3 unika ćwiczenia matematyki poza szkołą, a rodzic musi pilnować kart pracy. Gra zamienia ćwiczenie w pętlę nagrody: runda zadań zgodnych z polskim programem daje gwiazdki, gwiazdki opłacają urządzanie pokoju, a wybór jednego z trzech wariantów mebla jest nagrodą. Zero presji (bez czasu, bez „źle”, bez utraty gwiazdek), wszystko lokalnie i offline, rodzic ustawia etap i widzi postępy bez kont.

## North star

**S-09: Córka kupuje pierwszy mebel za gwiazdki z rundy** — najmniejszy przepływ od początku do końca, który udowadnia główną hipotezę PRD („nagrodą musi być budowanie”); umieszczony najwcześniej, jak pozwalają etapy planu (M4), bo bez działającej pętli nagrody reszta nie ma znaczenia.

> Gwiazda przewodnia (north star) to tutaj: najmniejszy wycinek od ekranu do zapisu stanu, którego dostarczenie dowodzi, że produkt działa. Wszystko inne ma sens dopiero, gdy ten wycinek zadziała.

## At a glance

| ID    | Change ID                   | Etap | Outcome (user can …)                                                              | Prerequisites        | PRD refs                        | Status   |
| ----- | --------------------------- | ---- | --------------------------------------------------------------------------------- | -------------------- | ------------------------------- | -------- |
| F-01  | game-shell-scaling          | M0   | (foundation) szkielet gry na Phaser 4.2 w scenie 1920×1080, docelowy układ katalogów, bez telemetrii szablonu | —    | NFR (czytelność, prywatność)    | done        |
| F-02  | static-deploy-pipeline      | M0   | (foundation) build statyczny wdrażany z GitHub Actions na VPS za Caddy z rollbackiem | —                  | NFR (prywatność), tech-stack    | done        |
| S-01  | installable-offline-pwa     | M0   | dziecko otwiera grę z adresu na tablecie, instaluje ją i uruchamia offline        | F-01, F-02           | FR-001, FR-002, FR-003, NFR     | done |
| F-03  | generator-test-harness      | M1   | (foundation) vitest, seedowany rng i skrypt próbkujący z raportem naruszeń        | F-01                 | FR-005                          | done |
| S-02  | generators-e3-e4            | M1   | autor wypisuje poprawne zadania grupy 1 z każdego kroku E3–E4 z podpowiedziami    | F-03, S-01           | FR-004, FR-005                  | done |
| S-03  | generators-remaining-stages | M1   | autor wypisuje zadania grupy 1 dla E1–E2 i E5–E6 na wspólnych generatorach        | S-02                 | FR-004                          | done |
| S-04  | task-round-stars            | M2   | dziecko rozwiązuje rundę dotykiem, dostaje gwiazdki, po błędzie podpowiedź i drugą próbę | S-03            | FR-006, FR-007, FR-008, FR-011, US-01 | done |
| S-05  | narrator-round-summary      | M2   | dziecko odsłuchuje polecenie i po rundzie wybiera „Kolejna runda” lub „Do pokoju” | S-04                 | FR-009, FR-010                  | done |
| S-06  | first-launch-placement      | M3   | dziecko podaje wiek, rodzic potwierdza etap po bramce, rozgrzewka koryguje start  | S-05                 | FR-012                          | done |
| S-07  | adaptive-curriculum         | M3   | gra dobiera zadania wg wag i opanowania, odblokowuje kroki, łagodzi trudność      | S-05                 | FR-013, FR-014                  | done |
| S-08  | parent-settings-progress    | M3   | rodzic zmienia etap i widzi zwięzły podgląd postępów za bramką                   | S-06, S-07           | FR-015, US-03                   | done |
| S-09  | first-furniture-purchase    | M4   | dziecko wydaje gwiazdki na zadanie remontowe i wybiera jeden z 3 wariantów        | S-08                 | FR-016, FR-017, US-02           | done |
| S-10  | variant-change-room-done    | M4   | dziecko zmienia wariant za darmo, widzi „Pokój gotowy!” i robi poprawki           | S-09                 | FR-018, FR-019                  | done |
| S-11  | autosave-versioned-save     | M5   | po zamknięciu i otwarciu gry (także po aktualizacji) stan jest identyczny         | S-10                 | FR-020, FR-021, US-04           | done     |
| S-12  | save-export-import-reset    | M5   | rodzic eksportuje, importuje (z podsumowaniem) i resetuje zapis                   | S-11                 | FR-022                          | done     |
| S-13  | drawn-widget-tasks-e3-e4    | M6   | dziecko rozwiązuje zadania z zegarem, linijką, osią, klockami i słupkiem dla E3–E4 | S-12                | FR-023                          | done     |
| S-13b | drawn-grid-tasks-e3-e4      | M6   | dziecko rozwiązuje kwadrat magiczny, zadania na siatce i obwody oraz ustawia zegar przeciąganiem wskazówek (E3–E4) | S-13 | FR-023                    | done |
| S-14  | art-tasks-all-stages        | M6   | dziecko rozwiązuje zadania z monetami, wagą, naczyniami i termometrem; każdy etap ma pełny zestaw typów | S-13 | FR-023                    | done |
| S-14b | number-line-written-arrows  | M6   | dziecko liczy pisemnie w słupku (E5–E6), uzupełnia grafy i tabelki (E2) i widzi oś liczbową w podpowiedziach | S-14 | FR-023                    | proposed |
| S-14c | text-measure-time-types     | M6   | dziecko rozwiązuje tekstowe zadania o czasie, jednostkach, cenach, kolejności działań i nierównościach (E1, E5–E6) oraz rundę powtórkową | S-14 | FR-023 | proposed |
| S-14d | e1-shapes-picture-mode      | M6   | 6-latek rozwiązuje zadania z figurami, szlaczkami, „który z kolei”, parami i płaci monetami przeciąganiem do portfela | S-14 | FR-023                | proposed |
| S-15  | minigame-daily-puzzle       | M6   | co kilka rund dziecko dostaje minigrę lub zagadkę dnia za podwójne gwiazdki       | S-12                 | FR-024, FR-025                  | planning |
| S-16  | final-art-sound             | M7   | dziecko widzi docelową grafikę salonu i ekranów E3–E4, animacje, słyszy dźwięki   | S-14, S-15           | FR-026                          | blocked  |
| S-17  | playtest-balance            | M8   | autor dostraja balans i czytelność po obserwacji córki i miarach z historii       | S-16                 | FR-027                          | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks. Etapy planu nadal obowiązują: strumień nie uprawnia do wyprzedzenia etapu.

| Stream | Theme                        | Chain                                          | Note                                                                 |
| ------ | ---------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| A      | Szkielet i PWA (M0)          | `F-01` → `F-02` → `S-01`                       | Pierwsza rzecz, którą córka otworzy na tablecie; odblokowuje wszystko. |
| B      | Zadania i gwiazdki (M1–M2)   | `F-03` → `S-02` → `S-03` → `S-04` → `S-05`     | Joins Stream A at `S-01`. Inwestycja w `core/` (generatory, runda); E3–E4 najpierw (market-feedback). |
| C      | Etap i adaptacja (M3)        | `S-06` → `S-07` → `S-08`                       | Joins Stream B at `S-05`. `S-06` ∥ `S-07`; `S-08` je spina.           |
| D      | Pokój i zapis (M4–M5)        | `S-09` → `S-10` → `S-11` → `S-12`              | Joins Stream C at `S-08`. Zawiera gwiazdę przewodnią `S-09`.          |
| E      | Rysunki, grafika, testy (M6–M8) | `S-13` → `S-13b` → `S-14` → `S-14b` / `S-14c` / `S-14d` → `S-15` → `S-16` → `S-17`  | Joins Stream D at `S-12`. `S-13` ∥ `S-15`; `S-16` zablokowany grafiką mebli. |

## Baseline

What's already in place in the codebase as of `2026-10-11` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** partial — nietknięty szablon Phaser 4.0.0 + Vite 6 + TypeScript (`src/game/scenes/*.ts`, konfiguracja 1024×768); brak docelowego układu `core/`/`data/`/`scenes/`, brak skalowania 1920×1080, brak PWA (bez manifestu i service workera).
- **Backend / API:** n/a — per `tech-stack.md`: bez backendu, bez żądań sieciowych poza pobraniem gry.
- **Data:** absent — brak zapisu lokalnego (brak biblioteki IndexedDB, brak modułu zapisu).
- **Auth:** n/a — per PRD Access Control: bez kont; bramka rodzica to element UI (M3), nie warstwa auth.
- **Deploy / infra:** absent — brak workflowów GitHub Actions, katalogu `deploy/` ani konfiguracji Caddy; cel (self-host, auto-deploy po merge) zdecydowany w `tech-stack.md`.
- **Observability:** absent, celowo — NFR prywatności zabrania telemetrii; szablonowy `log.js` (ping gryzor.co przy `npm run dev`/`build`) do usunięcia w M0.

## Foundations

### F-01: Szkielet gry i skalowanie

- **Outcome:** (foundation) gra startuje na Phaser 4.2.x w scenie 1920×1080 dopasowanej do ekranu, z pustą sceną, docelowym układem katalogów (`core/` bez importów silnika, `data/`, `scenes/`, `storage/`, `tests/`), bez telemetrii szablonu; `npx tsc --noEmit` przechodzi.
- **Change ID:** game-shell-scaling
- **PRD refs:** NFR (cele dotykowe ≥ 96 px w scenie 1920×1080; prywatność: zero żądań sieciowych), FR-002 (nakładka „Obróć tablet” wchodzi w S-01)
- **Unlocks:** S-01 (ekran na tablecie), F-03 (testy czystej logiki wymagają układu `core/`), S-04 (sceny)
- **Prerequisites:** —
- **Parallel with:** F-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** pierwszy kontakt z Phaser 4.2 (renderer i filtry nowe względem v3); zrobiony najpierw, bo każdy wycinek widoczny dla dziecka zależy od poprawnego skalowania i układu.
- **Status:** done

### F-02: Statyczny deploy na VPS

- **Outcome:** (foundation) build `dist/` jest publikowany z GitHub Actions na istniejący VPS za Caddy (HTTPS), z zachowaniem poprzedniego wydania do rollbacku; runbook w `deploy/README.md`.
- **Change ID:** static-deploy-pipeline
- **PRD refs:** NFR (prywatność: tylko pobranie gry i aktualizacji), US-04 (aktualizacja gry nie gubi stanu)
- **Unlocks:** S-01 (gra otwiera się z adresu URL na tablecie), weryfikacja offline po każdym etapie (plan, sekcja 14)
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** — (domena martynka-urzadza.pl kupiona i podpięta 2026-10-11)
- **Unknowns:** — (adres rozstrzygnięty: https://martynka-urzadza.pl)
- **Risk:** jedyna warstwa z infrastrukturą; minimalna (rsync przez restricted user) i wzorowana na CoiledSpring; zrobiona w M0, żeby każdy kolejny etap był sprawdzany na tablecie, nie tylko w przeglądarce.
- **Status:** done

### F-03: Harness testów generatorów

- **Outcome:** (foundation) vitest działa na `core/`, generatory dostają seedowany rng, a skrypt próbkujący wypisuje po 3 zadania z każdego kroku etapu i raportuje naruszenia (zakres, ujemne, odmiana).
- **Change ID:** generator-test-harness
- **PRD refs:** FR-005, guardrail „zadania matematycznie poprawne”
- **Unlocks:** S-02, S-03 (testy 1000 losowań per umiejętność), S-13/S-14 (ten sam harness dla typów z rysunkami)
- **Prerequisites:** F-01
- **Parallel with:** F-02, S-01 (harness nie dotyka PWA ani deployu; etap M1 i tak startuje dopiero po S-01, zob. S-02)
- **Blockers:** —
- **Unknowns:**
  - Z przeglądu F-01: włączyć `strictPropertyInitialization` i dodać `tests/` do `include` w tsconfig przy wprowadzaniu vitest. — Owner: autor. Block: no.
  - Dokładne kryterium „gotowe” dla M1 przy zawężeniu pełnej jakości treści do E3–E4 (PRD Open Question 3). — Owner: autor. Block: no (harness jest taki sam niezależnie od odpowiedzi; rozstrzygnąć przy planowaniu S-02).
- **Risk:** bez harnessu generatory będą sprawdzane ręcznie i błędy odpowiedzi wzorcowych dotrą do córki; minimalny zakres (vitest + rng + sample), nie „warstwa testowa”.
- **Status:** done

## Slices

### S-01: Instalowalna gra offline na tablecie

- **Outcome:** dziecko otwiera grę z adresu URL na tablecie, dodaje ją do ekranu początkowego (z instrukcją przy pierwszym uruchomieniu w przeglądarce) i uruchamia offline; w pionie widzi „Obróć tablet”; nowa wersja instaluje się sama przy następnym starcie.
- **Change ID:** installable-offline-pwa
- **PRD refs:** FR-001, FR-002, FR-003, NFR (start offline < 3 s, Android Chrome + iPad Safari + komputer)
- **Prerequisites:** F-01, F-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Z przeglądu F-02: hashowane bundle Vite przenieść do `build.assetsDir: '_app'` i matcher Caddy na `/_app/*`, żeby `immutable` nie objęło nienazwanej hashem grafiki z `public/assets/` (M7); ponowny bootstrap wykonuje agent (`ssh martynka-ops sync`, potem `bootstrap`; zmiana `agent-ops-access`). — Owner: autor. Block: no.
  - Czy iPad (Safari) faktycznie utrzymuje dane PWA bez dodania do ekranu początkowego? — Owner: autor. Block: no (sprawdzić na urządzeniu; FR-001 i tak pokazuje instrukcję).
- **Risk:** zamyka etap M0 („gra otwiera się na tablecie z URL, da się dodać do ekranu i uruchomić offline”); PWA na iPadzie bywa kapryśna, dlatego sprawdzana na obu tabletach zanim wejdzie treść.
- **Status:** done

### S-02: Generatory zadań dla E3–E4

- **Outcome:** autor wypisuje z każdego kroku etapów E3 i E4 oryginalne zadania wszystkich typów grupy 1 (ZADANIA.md, sekcja 7) z poprawną odpowiedzią, rozpraszaczami, podpowiedzią krok po kroku i poprawną odmianą liczebników; testy 1000 losowań przechodzą.
- **Change ID:** generators-e3-e4
- **PRD refs:** FR-004 (część E3–E4), FR-005, guardrail „zadania poprawne i zgodne z programem”
- **Prerequisites:** F-03, S-01 (koniec etapu M0)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jak liczyć i testować poprawność odmiany liczebników w szablonach tekstowych (reguła dla 1 / 2–4 / 5+ i wyjątków 12–14)? — Owner: autor. Block: no.
- **Risk:** największy odcinek bez efektu na ekranie (ryzyko zaakceptowane w shape-notes); E3–E4 najpierw, bo to etap córki (market-feedback), reszta etapów w S-03.
- **Status:** done

### S-03: Generatory dla pozostałych etapów

- **Outcome:** autor wypisuje zadania grupy 1 dla E1–E2 i E5–E6 na tych samych generatorach z danymi etapu; testy mechaniczne (zakres, ujemne, rozpraszacze) przechodzą dla wszystkich sześciu etapów; dopracowanie treści tych etapów pozostaje na później (PRD Non-Goals).
- **Change ID:** generators-remaining-stages
- **PRD refs:** FR-004 (część E1–E2, E5–E6)
- **Prerequisites:** S-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** zamyka etap M1 (`sample` dla każdego etapu); ryzyko, że dane etapów bez dopracowania treści ujawnią luki w parametrach generatorów, które łatwiej naprawić teraz niż po M2.
- **Status:** done

### S-04: Runda zadań i gwiazdki

- **Outcome:** dziecko rozwiązuje rundę zadań dotykiem (kafelki lub klawiaturka) z kropkami postępu, dostaje gwiazdkę za każde poprawne zadanie (także w drugiej próbie) i bonus za rundę bez błędu; po błędzie widzi potrząśnięcie i podpowiedź, po drugiej pomyłce rozwiązanie krok po kroku i przepisuje wynik; licznik gwiazdek jest zawsze widoczny, przełącznik ukryty w trakcie zadania.
- **Change ID:** task-round-stars
- **PRD refs:** FR-006, FR-007, FR-008, FR-011, US-01, NFR (reakcja na dotyk < 100 ms, cele ≥ 96 px)
- **Prerequisites:** S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Decisions:** 2026-10-12 (maintainer): w E1 odpowiedzi liczbowe przez 3–4 kafelki zgodnie z ZADANIA §4, nie przez klawiaturkę; S-04 zmienia `answerMode` umiejętności E1 i dobiera dystraktory. E2e rundy (ryzyko #11 planu testów) wymaga haka testowego tylko do odczytu w osobnym buildzie e2e (`context/foundation/test-plan.md`, etap 5).
- **Risk:** pierwsza rzecz, w którą córka zagra; placeholdery (kolorowe kształty z podpisem) muszą być już czytelne, bo to one dają pierwszy sygnał z gracza.
- **Status:** done

### S-05: Lektor i podsumowanie rundy

- **Outcome:** dziecko odsłuchuje polecenie polskim lektorem (automatyczne czytanie jako ustawienie z domyślną wartością zależną od etapu; bez polskiego głosu przycisk ukryty) i po rundzie widzi podsumowanie z gwiazdkami oraz przyciski „Kolejna runda” i „Do pokoju” (wyróżnione, gdy stać na mebel).
- **Change ID:** narrator-round-summary
- **PRD refs:** FR-009, FR-010, NFR (lektor tam, gdzie jest polski głos)
- **Prerequisites:** S-04
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jakość polskiego głosu systemowego na docelowych tabletach (PRD Open Question 7). — Owner: autor. Block: no (sprawdzić na urządzeniach; przepływ działa bez głosu).
- **Risk:** zamyka etap M2; „Do pokoju” prowadzi na razie do pustej sceny pokoju (pokój wchodzi w M4).
- **Status:** done

### S-06: Pierwsze uruchomienie i dobór etapu

- **Outcome:** przy pierwszym uruchomieniu dziecko podaje wiek (6–10), gra proponuje etap wg wieku i miesiąca, rodzic po bramce dla dorosłego potwierdza lub zmienia etap, a rozgrzewka 6 zadań koryguje start w dół.
- **Change ID:** first-launch-placement
- **PRD refs:** FR-012
- **Prerequisites:** S-05
- **Parallel with:** S-07
- **Blockers:** —
- **Unknowns:**
  - Czy rozgrzewka nadal koryguje etap w dół, gdy rodzic ustawił go świadomie, czy jest wtedy pomijana? (PRD Open Question 1) — Owner: autor. Block: no (rozstrzygnąć przy `/10x-plan` tego wycinka; obie wersje są małe).
- **Risk:** wprowadza bramkę dla dorosłego używaną potem w S-08 i S-12; zrobiona tu, bo bez etapu adaptacja z S-07 nie ma punktu startu.
- **Status:** done

### S-07: Adaptacja trudności

- **Outcome:** gra losuje zadania z odblokowanych kroków według wag (wartości w danych balansu), prowadzi licznik opanowania 0–5 każdej umiejętności licząc tylko pierwszą próbę, odblokowuje kolejny krok przy opanowaniu w większości umiejętności ze scenką „Nowa umiejętność!” i łagodzi trudność po dwóch słabych rundach.
- **Change ID:** adaptive-curriculum
- **PRD refs:** FR-013, FR-014, Business Logic (reguła domenowa)
- **Prerequisites:** S-05
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** to jest reguła domenowa produktu; czysta logika w `core/` z testami, niezależna od scen, więc może iść równolegle z S-06.
- **Status:** done

### S-08: Ustawienia rodzica i podgląd postępów

- **Outcome:** rodzic po długim przytrzymaniu ikony i bramce dla dorosłego zmienia etap, włącza lub wyłącza automatyczne czytanie i widzi zwięzły podgląd postępów (bieżący krok i 3 najsłabsze umiejętności z przykładami błędów).
- **Change ID:** parent-settings-progress
- **PRD refs:** FR-015, US-03, Access Control
- **Prerequisites:** S-06, S-07
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** zamyka etap M3; podgląd czyta historię z S-07, więc idzie po niej; eksport/import/reset dochodzą dopiero w S-12 (etap M5).
- **Status:** done

### S-09: Pierwszy mebel za gwiazdki

- **Outcome:** dziecko widzi salon (placeholdery) z bieżącym zadaniem remontowym i kosztem z danych pokoju, przy braku gwiazdek przycisk pokazuje „masz X/Y” i prowadzi do zadań, a przy wystarczającej liczbie otwiera panel 3 wariantów z podglądem i zatwierdza „Wybieram” (gwiazdki odejmowane dopiero wtedy) z animacją i dźwiękiem.
- **Change ID:** first-furniture-purchase
- **PRD refs:** FR-016, FR-017, US-02, Success Criteria (pierwszy pokój)
- **Prerequisites:** S-08
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** gwiazda przewodnia: pierwszy moment, w którym da się sprawdzić, czy urządzanie motywuje córkę bardziej niż same gwiazdki; etap M3 przed nim wynika z wiążącej kolejności planu, nie z zależności technicznej.
- **Status:** done

### S-10: Zmiana wariantu i ukończenie pokoju

- **Outcome:** dziecko zmienia wariant urządzonego elementu za darmo po przytrzymaniu (lub w trybie „zmień”), po ostatnim zadaniu widzi „Pokój gotowy!”, listę pokoi z jedną pozycją i zapowiedzią oraz może dalej robić „poprawki” i rundy.
- **Change ID:** variant-change-room-done
- **PRD refs:** FR-018, FR-019
- **Prerequisites:** S-09
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** zamyka etap M4 („cały pokój od zaniedbanego do urządzonego”); ryzyko motywacji po salonie (PRD Open Question 5) mierzy dopiero S-17.
- **Status:** done

### S-11: Autozapis i wersjonowany zapis

- **Outcome:** po zamknięciu gry (lub rozładowaniu tabletu) i ponownym otwarciu gwiazdki, salon i postęp nauki są dokładnie takie same; zapis następuje sam po każdej zmianie i przy ukryciu karty, natychmiast po zapłacie za mebel i końcu rundy; zapis ze starszej wersji gry jest przenoszony do nowej, a nieudane przeniesienie zostawia stary zapis i oferuje eksport.
- **Change ID:** autosave-versioned-save
- **PRD refs:** FR-020, FR-021, US-04, guardrail „postęp nigdy nie ginie”
- **Prerequisites:** S-10
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** do tej pory stan żył w pamięci; wprowadzenie zapisu po M4 (zgodnie z planem) oznacza, że format zapisu obejmuje od razu cały stan pętli, co zmniejsza liczbę migracji później.
- **Status:** done

### S-12: Eksport, import i reset zapisu

- **Outcome:** rodzic w ustawieniach eksportuje zapis do pliku, importuje go po walidacji i podsumowaniu (gwiazdki, etap, postęp pokoju) i resetuje grę z potwierdzeniem.
- **Change ID:** save-export-import-reset
- **PRD refs:** FR-022, US-03
- **Prerequisites:** S-11
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** zamyka etap M5 (test: zamknij i otwórz, stan identyczny); import to jedyne miejsce, gdzie da się nadpisać tygodnie postępu, stąd podsumowanie przed nadpisaniem.
- **Status:** done

### S-13: Zadania z widżetami rysowanymi w kodzie dla E3–E4

- **Outcome:** dziecko rozwiązuje w rundzie zadania typów grupy 2 dla E3–E4 z zegarem, linijką, osią liczbową, klockami dziesiątkowymi, słupkiem pisemnym, grafami i figurami rysowanymi w kodzie, z odpowiedzią dotykiem (w tym przeciąganiem i zaznaczaniem).
- **Change ID:** drawn-widget-tasks-e3-e4
- **PRD refs:** FR-023 (grupa 2, E3–E4)
- **Prerequisites:** S-12
- **Parallel with:** S-15
- **Blockers:** —
- **Unknowns:** —
- **Risk:** największy etap planu (M6); E3–E4 najpierw, żeby córka zobaczyła nowe typy zadań, zanim powstaną wszystkie; pierwsze tryby odpowiedzi „drag” i „select”.
- **Status:** done

### S-13b: Zadania na siatce i „ustaw zegar” dla E3–E4

- **Outcome:** dziecko rozwiązuje kwadrat magiczny (E3.5), zadania na siatce z kodowaniem pól (E3.7) i obwody figur na siatce (E4.7) oraz ustawia zegar przeciąganiem wskazówek (CLOCK, E3–E4).
- **Change ID:** drawn-grid-tasks-e3-e4
- **PRD refs:** FR-023 (grupa 2, E3–E4)
- **Prerequisites:** S-13
- **Parallel with:** S-15
- **Blockers:** —
- **Unknowns:** gest kątowy wskazówek na tablecie (przyciąganie do 5 minut).
- **Risk:** wydzielone z S-13 (plan `context/changes/drawn-widget-tasks-e3-e4/plan.md`, decyzja autonomiczna 1): PUZZLE_GRID, GRID i PERIMETER dzielą jeden widżet siatki (`square-grid.svg`), „ustaw zegar” to drugi typ `drag`; dołożenie umiejętności do E3.5/E4.7 zmienia próg odblokowania tych kroków. Plan S-14 (decyzja autonomiczna 1) dokłada PERIMETER w E5.12 (bok z obwodu) i E6.3 (figury złożone) — ten sam widżet siatki.
- **Status:** done

### S-14: Zadania z grafiką i pełny zestaw typów dla wszystkich etapów

- **Outcome:** dziecko rozwiązuje zadania z monetami i banknotami, wagą, naczyniami i termometrem (grafika z paczki A v1) oraz typy grup 2–3 dla E1–E2 i E5–E6; każdy etap ma pełny zestaw typów z ZADANIA.md.
- **Change ID:** art-tasks-all-stages
- **PRD refs:** FR-023 (grupa 3 i pozostałe etapy)
- **Prerequisites:** S-13
- **Parallel with:** S-15
- **Blockers:** —
- **Unknowns:** —
- **Risk:** zamyka kryterium M6 („każdy etap ma pełny zestaw typów”); monety, waga, naczynia i termometr są już w paczce A v1, więc nie zależy od nowej grafiki. Plan (`context/changes/art-tasks-all-stages/plan.md`, decyzje autonomiczne 1–2) zawęża S-14 do grafiki paczki A (MONEY_COUNT, MONEY_CHANGE, MASS w równowadze, CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS) i danych widżetów S-13 w E1/E2/E5/E6; reszta typów → S-14b, S-14c, S-14d, PERIMETER E5.12/E6.3 → S-13b; MONEY_PAY → S-14d.
- **Status:** done

### S-14b: Słupek pisemny, grafy i oś liczbowa

- **Outcome:** dziecko dodaje i odejmuje pisemnie w słupku z okienkami cyfr i przeniesieniem (WRITTEN, E5.2, E6.7), uzupełnia grafy i tabelki strzałkowe (ARROW_TABLE, E2.6) i widzi oś liczbową jako rysunek SEQUENCE/MULT_GROUPS i podpowiedź ADD_SUB.
- **Change ID:** number-line-written-arrows
- **PRD refs:** FR-023 (grupa 2, E2, E5–E6)
- **Prerequisites:** S-14
- **Parallel with:** S-14c, S-15
- **Blockers:** —
- **Unknowns:** nowy tryb wejścia „cyfra w okienku” (pierwszy od S-13) — helpery e2e przed `playable`.
- **Risk:** wydzielone z S-14 (plan S-14, decyzja autonomiczna 1); ref. kitu `reference/written-addition.svg`, `reference/number-line.svg`.
- **Status:** proposed

### S-14c: Typy tekstowe: czas, jednostki, ceny, kolejność działań, runda powtórkowa

- **Outcome:** dziecko rozwiązuje zadania tekstowe CLOCK_ELAPSED (E5.3, E5.8, E6.2), TIME_UNITS (E6.1), UNIT_CHOICE (E5.7), PRICE i TIMES_MORE (E5.10), ORDER_OPS (E5.11), INEQUALITY (E1.9), tekstowe warianty MASS (gramy, brutto/netto/tara, tona: E5.7, E6.3, E6.5) i LENGTH (skala E5.12, wyrażenia dwumianowe E6.3), PLACE_VALUE ≥ 1000 (E6.9, E6.10) oraz rundę powtórkową z całego roku (MIX, E6.11).
- **Change ID:** text-measure-time-types
- **PRD refs:** FR-023 (E1, E5–E6)
- **Prerequisites:** S-14
- **Parallel with:** S-14b, S-15
- **Blockers:** —
- **Unknowns:** MIX to funkcja programu (runda z całego roku), nie generator — kształt w planie slice'a.
- **Risk:** wydzielone z S-14 (plan S-14, decyzja autonomiczna 1); bez widżetów, więc tani w e2e; dużo treści do odczytu nauczyciela.
- **Status:** proposed

### S-14d: E1 z obrazkami: figury, szlaczki, „który z kolei”, pary i płacenie monetami

- **Outcome:** 6-latek rozwiązuje E1.1 (SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY), ORDINAL (E1.2), BONDS z parami i CHOOSE_OP z obrazkiem oraz MONEY_PAY (przeciąganie monet do portfela, „najmniej monet”, E1.11, E2.2); „tryb z obrazkami” dla 6-latków (design-gaps wiersz 21).
- **Change ID:** e1-shapes-picture-mode
- **PRD refs:** FR-023 (E1–E2)
- **Prerequisites:** S-14
- **Parallel with:** S-15
- **Blockers:** —
- **Unknowns:** uogólnienie `blockDrag` na nominały i układ portfela (follow-up S-14 `Trigger: S-14d`).
- **Risk:** MONEY_PAY to drugi wariant `drag` — dotyka helperów e2e używanych przez każdy spec (`answerRight`); E1.1 jest dziś pusty.
- **Status:** proposed

### S-15: Minigra i zagadka dnia

- **Outcome:** co kilka rund dziecko zamiast zwykłej rundy dostaje jedną z 1–2 minigier (np. hasło z wyników, sklepik) lub zagadkę dnia z puli ok. 10–15 zagadek dla E3–E4 za podwójne gwiazdki (mnożnik w danych balansu).
- **Change ID:** minigame-daily-puzzle
- **PRD refs:** FR-024, FR-025
- **Prerequisites:** S-12
- **Parallel with:** S-13, S-14
- **Blockers:** —
- **Unknowns:**
  - Które 1–2 minigry wchodzą do v1 i jaki mnożnik za zagadkę? (PRD Open Question 2) — Owner: autor. Block: no (rozstrzygnąć na starcie `/10x-plan` tego wycinka).
  - Kto i kiedy napisze pulę 10–15 zagadek (praca autorska poza kodem)? — Owner: autor. Block: no.
- **Risk:** wariant rundy, nie nowa pętla; osobny wycinek, żeby nie rozdymał S-13; zależy tylko od rundy i adaptacji, stąd równoległość w M6.
- **Status:** planning

### S-16: Docelowa grafika i dźwięk

- **Outcome:** dziecko widzi docelową grafikę paczki A v1 (salon z meblami w 3 wariantach, ikony, UI), animacje (tweeny, cząsteczki), ekran ładowania i słyszy dźwięki po pierwszym dotknięciu; na ekranach E3–E4 i w salonie nie ma placeholderów, a brakujące grafiki pozostałych etapów są spisane jako lista.
- **Change ID:** final-art-sound
- **PRD refs:** FR-026, NFR (dostępność: „ogranicz ruch”, grywalne bez dźwięku)
- **Prerequisites:** S-14, S-15
- **Parallel with:** —
- **Blockers:** meble salonu (10 slotów × 3 warianty) i brakujące ikony nie istnieją w paczce A v1; dźwięki nie istnieją
- **Unknowns:**
  - Kiedy będą gotowe meble salonu, brakujące ikony i dźwięki (praca graficzna autora poza kodem; PRD Open Question 6)? — Owner: autor. Block: yes.
- **Risk:** jedyny wycinek zależny od zasobu spoza kodu; główne ryzyko roadmapy (`external`). Prace nad S-13–S-15 dają czas na przygotowanie grafiki; bez niej M7 nie startuje.
- **Status:** blocked

### S-17: Balans po testach z graczem

- **Outcome:** autor po obserwacji gry córki i miarach z historii w zapisie (czas na pokój, odsetek drugich prób per umiejętność) dostraja wyłącznie w danych gry tempo gwiazdek, koszty mebli, progi opanowania i czytelność poleceń; przejście salonu zajmuje sensowny czas, zadania nie są ani za łatwe, ani frustrujące.
- **Change ID:** playtest-balance
- **PRD refs:** FR-027, Success Criteria (Primary), PRD Open Question 5 (motywacja po salonie)
- **Prerequisites:** S-16
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Ile tygodni obserwacji wystarczy, by ocenić kryterium „gra 3 razy w tygodniu przez 4 tygodnie”? — Owner: autor. Block: no.
- **Risk:** zamyka M8 i cały kamień; jedyny wycinek, którego „gotowe” zależy od zachowania gracza, nie od kodu.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                   | Suggested issue title                                   | Ready for `/10x-plan` | Notes |
| ---------- | --------------------------- | ------------------------------------------------------- | --------------------- | ----- |
| F-01       | game-shell-scaling          | M0: szkielet Phaser 4.2, scena 1920×1080, układ katalogów | yes                 | Run `/10x-plan game-shell-scaling` |
| F-02       | static-deploy-pipeline      | M0: deploy dist/ z GitHub Actions na VPS za Caddy       | yes                   | Równolegle z F-01 |
| S-01       | installable-offline-pwa     | M0: instalowalna PWA offline na tablecie                | no                    | Po F-01, F-02 |
| F-03       | generator-test-harness      | M1: vitest, seedowany rng, skrypt sample                | no                    | Po F-01; może iść równolegle z S-01 |
| S-02       | generators-e3-e4            | M1: generatory grupy 1 dla E3–E4                        | no                    | Po F-03 i S-01 |
| S-03       | generators-remaining-stages | M1: generatory dla E1–E2 i E5–E6                        | no                    | Done — zarchiwizowane 2026-10-12 (`context/archive/2026-10-12-generators-remaining-stages/`); PR otwarty, merge czeka na „merguj” |
| S-04       | task-round-stars            | M2: runda zadań, gwiazdki, podpowiedzi                  | no                    | Done — zarchiwizowane 2026-10-12 (`context/archive/2026-10-12-task-round-stars/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-12-s04-s08 |
| S-05       | narrator-round-summary      | M2: lektor i podsumowanie rundy                         | no                    | Done — zarchiwizowane 2026-10-12 (`context/archive/2026-10-12-narrator-round-summary/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-12-s04-s08. Follow-upy S-04 z `Trigger: S-05` zamknięte (przełącznik HUD, rysowany licznik w e2e) albo przeniesione (`pl.title` → S-06, kropki kroków → następna zmiana `SolutionSteps`) |
| S-06       | first-launch-placement      | M3: wiek, etap, bramka rodzica, rozgrzewka              | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-first-launch-placement/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-12-s04-s08. Odstępstwo od FR-012 (decyzja orkiestratora): dziecko startuje samo na etapie z tabeli wieku, bramka chroni tylko zmianę etapu (wiersz [human] 7.5). Proponowane ryzyko #12 (pierwsze uruchomienie dotykiem) czeka na `/10x-test-plan --refresh` (`context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`). Follow-up S-04/S-05 `Trigger: S-06` (`pl.title` — marka powitania, gołe liczby — tokeny) zamknięty w fazach 4 i 7 |
| S-07       | adaptive-curriculum         | M3: wagi, opanowanie, odblokowanie kroków               | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-adaptive-curriculum/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-12-s04-s08. Decyzja autonomiczna do przejrzenia (wiersz [human] 8.6): podłoga kalendarza — E3 w październiku tylko kroki 1, 2, 6, cały etap od stycznia; do S-11 każdy zimny start zeruje opanowanie i wraca do podłogi (wiersz [human] 8.5). Follow-upy S-04/S-05/S-06 `Trigger: S-07` zamknięte (brak powtórzeń polecenia w rundzie i rozgrzewce, `PlacementData` w core); `= ?` przeniesione do S-16. Proponowane ryzyka #12 i #13 czekają na `/10x-test-plan --refresh` (`context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md`) |
| S-08       | parent-settings-progress    | M3: ustawienia rodzica i podgląd postępów               | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-parent-settings-progress/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-12-s04-s08. Wszystkie follow-upy `Trigger: S-08` (auto-czytanie, zmiana etapu za bramką, wspólne helpery e2e, `pendingUnlock`, przykłady błędów w historii) zamknięte. Otwarte wiersze [human] 6.7, 9.6–9.8 (lista kontrolna po runie). Nowe follow-upy (`context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md`): ryzyko test-planu #14 (`/10x-test-plan refresh` lub przed S-11); zapis ustawień i postępów + wczesny zapis (`Trigger: S-11`); prywatność eksportu przykładów błędów (`Trigger: S-12`); kalibracja przytrzymania 2 s (`Trigger: S-17`); F4–F8 (src/pwa, nowa nakładka z `suspend()`, WelcomeScene/UIScene, `pl.settings.empty`/długa historia przy S-11) |
| S-09       | first-furniture-purchase    | M4: pierwszy mebel za gwiazdki (gwiazda przewodnia)     | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-first-furniture-purchase/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s09-s11. Saldo gwiazdek w rejestrze, salon 10 slotów (koszty 5–15, razem 96), panel 3 wariantów, „Wybieram” odejmuje gwiazdki; follow-upy S-05 `Trigger: S-09` (koszt w `summaryView`, lot gwiazdki) zamknięte; wspólny przycisk HUD nadal otwarty (następna zmiana przycisku HUD). Otwarte wiersze [human] 7.6–7.10 (lista slotów i koszty, brak dźwięku vs FR-017 do S-16, sesyjność do S-11, UX panelu bez kitu, test na iPadzie/Androidzie) — lista kontrolna po runie |
| S-10       | variant-change-room-done    | M4: zmiana wariantu, „Pokój gotowy!”                    | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-variant-change-room-done/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s09-s11. Darmowa zmiana wariantu po przytrzymaniu urządzonego slotu (600 ms / 40 px, `balance.roomHold`) i w trybie „Zmień wygląd” po ukończeniu pokoju, karta „Pokój gotowy!” po ostatnim zakupie, lista pokoi (salon + zapowiedź „Wkrótce”); follow-upy S-09 `Trigger: S-10` (przytrzymanie, F4 `pl.room.name`, F5 rzutowania, V1 podpisy) zamknięte; V2 „pop” dywanu nad kanapą i V3 znikające podpisy → S-16. Szew `?e2eStars` tylko w buildzie z hookiem (strażnik w `vite/e2eHookGuard.mjs`). Otwarte wiersze [human] 3.5, 6.6–6.9 (szew e2eStars, próg przytrzymania, UX trybu/karty/listy z V4/V5, kopia „Zmień wygląd” vs FR-019 „poprawki”, urządzenia) — lista kontrolna po runie |
| S-11       | autosave-versioned-save     | M5: autozapis i wersjonowany zapis                      | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-autosave-versioned-save/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s09-s11. Format zapisu v1 (jednokierunkowy na urządzeniach dzieci) w IndexedDB przez `idb-keyval` (`src/storage/idb.ts`), dekoder z łańcuchem migracji w `src/core/save.ts`, autozapis 500 ms + ukrycie karty, natychmiast po zakupie i końcu rundy; nieczytelny lub nowszy zapis nigdy nie jest nadpisywany (karta z eksportem kopii). Follow-upy S-06/S-07/S-08/S-09/S-10 `Trigger: S-11` zamknięte. Otwarte wiersze [human] 4.6, 5.7, 5.8, 6.6 (akceptacja kształtu v1 vs plan §5), 6.7, 6.8, 6.9 — lista kontrolna po runie. Nowe follow-upy (`context/archive/2026-10-13-autosave-versioned-save/follow-ups/review-fixes.md`): migracja v2 + e2e na dwóch buildach (ryzyko #10) + dwie instancje jednego originu (`Trigger: first save-format change (v2)`), F3–F5, odświeżenie test-planu (faza 4) i profilu runu |
| S-12       | save-export-import-reset    | M5: eksport, import, reset                              | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-save-export-import-reset/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s12-s14. Eksport kopii (`.txt` z kopertą JSON: aplikacja, build, powód) dopiero po potwierdzeniu, import po walidacji i podsumowaniu „Teraz / Z pliku” (gwiazdki, etap, pokój), reset z potwierdzeniem; format zapisu nadal v1 (bez migracji). Zamknięte: follow-upy S-11/S-08 `Trigger: S-12` oraz audyt 2026-10-13_1751 M-S3, L-S2, N-8, M-S2 (N-7 poza zakresem). Otwarte wiersze [human] 4.7, 5.6, 6.8 (`.txt` wbrew literze FR-022), 6.9, 6.10 — lista kontrolna po runie. Follow-upy (`context/archive/2026-10-13-save-export-import-reset/follow-ups/review-fixes.md`): import/reset nad nieczytelnym zapisem (F1, `Trigger: first save-format change (v2) or the first deploy rollback across a save version, or the next change to saveImportDialog.ts / saveResetDialog.ts`), dwie karty jednego originu i L-S1 (`Trigger: first save-format change (v2)`), N-7 (pomiar iPada), import z ekranu powitalnego. Do sprawdzenia: podgląd postępów pokazał „Krok 8 z 8” dla E3 po jednej rundzie (nie kod S-12) |
| S-13       | drawn-widget-tasks-e3-e4    | M6: widżety rysowane w kodzie dla E3–E4                 | no                    | Done — zarchiwizowane 2026-10-13 (`context/archive/2026-10-13-drawn-widget-tasks-e3-e4/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s12-s14. `Task.visual` + `Task.input`; CLOCK (tarcza), LENGTH (linijka), PLACE_VALUE odczyt i budowa (klocki, pierwszy tryb `drag` na macie), DATA (diagram słupkowy), tryb `select` (EVEN_ODD); nowe kroki grywalne E3.3–E3.6, E4.1, E4.3, E4.7, E4.8; format zapisu nadal v1. Zawężenie: siatka, obwód, kwadrat magiczny, „ustaw zegar” → S-13b; oś liczbowa, słupek pisemny, grafy → S-14. Otwarte wiersze [human] 4.6 („15.00” vs kit „3:30”), 6.9, 9.8 (tablet, małe klocki na macie O3), 10.6, 10.7 — lista kontrolna po runie. Follow-upy (`context/archive/2026-10-13-drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md`): O1 klocki jedności w dwóch rzędach, O2 diagram nieczytelny w fazie rozwiązania obok klawiatury, czas e2e (adaptive.spec blisko limitu 180 s, `Trigger: a timeout of adaptive.spec, or the next change adding drag skills to E4`) |
| S-13b      | drawn-grid-tasks-e3-e4      | M6: siatka, kwadrat magiczny, obwód, „ustaw zegar”      | no                    | Done — zarchiwizowane 2026-10-14 (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-14-save-s13b-s15-s14b. PUZZLE_GRID (kwadrat magiczny, piramida; E3.5), GRID z kodowaniem pól (E3.7), PERIMETER (E4.7; nowe kroki grywalne E5.12 bok z obwodu i E6.3 figury złożone), „ustaw zegar” przeciąganiem wskazówek (nowa gałąź `drag`, E3.3, E3.11, E4.3 tylko kwadranse); rozwiązywalność w trybie odpowiedzi (S13-01…04, S13-07); format zapisu nadal v1. Wyższe progi odblokowania na żywych zapisach dla E3.3, E3.5, E3.7, E3.11, E4.7 (wolniej, nic nie ginie). Otwarte wiersze [human] 8.7 (gest na tablecie), 10.6 (decyzje wbrew ZADANIA, trzy nowe sformułowania) — lista kontrolna po runie. Follow-upy (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`): BONDS z parami / CHOOSE_OP z obrazkiem `Trigger: S-14d`; „ustaw zegar” E5–E6 co minutę `Trigger: S-14c or a tablet test`; S13-06 `Trigger: S-15 save format v2`; O5 podpowiedź `E5.5.capacity_quarter_l` `Trigger: S-14b`; O1–O6, F4, F5 przy następnej zmianie widżetów |
| S-14       | art-tasks-all-stages        | M6: zadania z grafiką, pełny zestaw typów               | no                    | Done — zarchiwizowane 2026-10-14 (`context/archive/2026-10-14-art-tasks-all-stages/`); PR/CI/merge/deploy w autonomicznym runie 2026-10-13-s12-s14. Pierwsza grafika w grze: 38 plików WebP z paczki A v1 w `public/assets/tasks/` (precache); MONEY_COUNT, MONEY_CHANGE, MASS w równowadze, CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS oraz widżety S-13 w E1/E2/E5/E6; format zapisu nadal v1. Zawężenie: reszta typów → S-14b/S-14c/S-14d, PERIMETER E5.12/E6.3 → S-13b, MONEY_PAY → S-14d. Otwarte wiersze [human] 2.9 (WebP, luźne pliki), 8.9 (zawężenie), 9.7 (odstępstwa od ZADANIA, m.in. temperatury E3 ≥ 0), 9.8 (teksty, masy `SCALE_ITEMS`), 9.9 (tablet: ostrość, termometr) — lista kontrolna po runie. Follow-upy: `context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`. Wcześniej: S-13 done (Prerequisites spełnione). Z S-13 (`context/archive/2026-10-13-drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md`): oś liczbowa jako podpowiedź ADD_SUB `Trigger: S-14`; podświetlenie rysunku przy podpowiedzi, BONDS z parami / CHOOSE_OP z obrazkiem, wymiana 10 jedności na dziesiątkę i setki na macie `Trigger: S-14 or …`; O2 diagram w fazie rozwiązania obok klawiatury (gdy S-14 doda więcej rysunków przy klawiaturze). Z S-06 (`context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`): „tryb z obrazkami” dla 6-latków pominięty (design-gaps wiersz 21) |
| S-14b      | number-line-written-arrows  | M6: słupek pisemny, grafy, oś liczbowa                  | yes                   | S-14 done (Prerequisites spełnione). Z S-14 (`context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`): oś liczbowa jako podpowiedź `Trigger: S-14b`; E1.10 `place_read_12` i E5.5 `capacity_half_l_e5` (wycięte w fazie 8) `Trigger: S-14b`; wspólny `ArtPool`/`fitRect` i `bounds()` ukrytych widżetów `Trigger: S-14b or the next widget built on ArtImage` Z S-13b (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`): O5 pierwsza podpowiedź `E5.5.capacity_quarter_l` (75 znaków, jedyny wpis `LONG_KEYPAD_HINTS`) `Trigger: S-14b`. |
| S-14c      | text-measure-time-types     | M6: typy tekstowe, warianty miar, runda powtórkowa      | yes                   | S-14 done (Prerequisites spełnione). Z S-14 (`context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`): warianty tekstowe MASS i LENGTH (gramy, tona, kwintal) i PLACE_VALUE od 1000 `Trigger: S-14c`; banknoty 200 i 500 zł są w `TASK_ART`, ale nieużywane `Trigger: S-14c or a money skill above 100 zł` Z S-13b (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`): „ustaw zegar” w E5–E6 i odpowiedzi co minutę `Trigger: S-14c or a tablet test`. |
| S-14d      | e1-shapes-picture-mode      | M6: figury E1, pary, MONEY_PAY, tryb z obrazkami        | yes                   | S-14 done (Prerequisites spełnione). Z S-14 (`context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`): MONEY_PAY + `Wallet` + uogólniony `blockDrag` `Trigger: S-14d`; O4 `E1.2.count_5` losuje 1 ikonę (rozważyć min 2) `Trigger: [human] 9.8 or a teacher read of E1.2` Z S-13b (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`): BONDS z parami i CHOOSE_OP z obrazkiem `Trigger: S-14d`. |
| S-15       | minigame-daily-puzzle       | M6: minigra i zagadka dnia                              | yes                   | ∥ S-13. S-12 done (Prerequisites spełnione); S-14 done (bez follow-upów dla S-15); przed planem rozstrzygnąć Open Roadmap Question 2 (które minigry, mnożnik zagadki dnia) S-13b done. Z S-13b (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`): S13-06 (podgląd pomyłek rodzica bez rysunku/zegara, design-gaps 58) `Trigger: S-15 save format v2`. |
| S-16       | final-art-sound             | M7: docelowa grafika i dźwięk                           | no                    | Zablokowane grafiką mebli (S-14 done, S-15 jeszcze nie). Z S-14 (`context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`): atlas tekstur zamiast luźnych WebP, termometr E3–E5 z ramą 0…+30 (design-gaps 64), podświetlenie rysunku przy podpowiedzi, jednostki w podpowiedziach czytane przez lektora, O3 kafelki obok termometru `Trigger: S-16`. Z S-07 (`context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md`): książka na karcie „Nowa umiejętność!” to placeholder z kodu (DESIGN-GAP 22), ` = ?` po wyrażeniu w poleceniu |
| S-17       | playtest-balance            | M8: balans po testach z córką                           | no                    | Po S-16. Z S-06 (`context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md`): bonus czystej rundy (+2) w rozgrzewce 6 zadań, mowa na ścieżce rodzica przed pierwszym stuknięciem w canvas (iPad), bramka 13–19 × 13–19 na klawiaturze cyfr DOM; z S-07 (`context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md`): wagi 60/30/10, łagodzenie 20/50/30, `minStartSteps`, `unlockAt` 4 / `unlockShare` 0.5, formuła podłogi kalendarza (E3 w październiku ~1 miesiąc przed podręcznikiem), pierwsze stuknięcie po obrocie tabletu |

## Open Roadmap Questions

1. **Rozgrzewka po ustawieniu etapu przez rodzica** (FR-012): czy rozgrzewka 6 zadań nadal koryguje etap w dół, gdy rodzic ustawił go świadomie, czy jest pomijana? — Owner: autor. Block: S-06 (nie blokuje planowania; rozstrzygnąć w `/10x-plan`).
2. **Które 1–2 minigry wchodzą do v1** (FR-024) i jaki mnożnik gwiazdek za zagadkę dnia (FR-025, liczba w balansie). — Owner: autor. Block: S-15 (rozstrzygnąć na starcie M6).
3. **Zgodność M1 z planem**: plan wymaga testów 1000 losowań dla każdej umiejętności wszystkich etapów; FR-004 zawęża pełną jakość treści do E3–E4, zachowując testy mechaniczne dla wszystkich. Doprecyzować kryterium „gotowe” M1. — Owner: autor. Block: F-03, S-02, S-03 (nie blokuje planowania; propozycja roadmapy: S-02 = pełna jakość E3–E4, S-03 = testy mechaniczne reszty).
4. **Cicha aktualizacja (FR-003) zamiast strategii „prompt” z planu**: plan zaktualizowany 2026-10-11. — Owner: autor. Block: — (rozstrzygnięte; zostaje do potwierdzenia w S-01).
5. **Ryzyko: motywacja po salonie**: jeden pokój to ok. 10 zadań remontowych; salon może skończyć się szybciej niż zainteresowanie. — Owner: autor. Block: S-17 (mierzy M8); drugi pokój to pierwsza rzecz po v1.
6. **Ryzyko: grafika mebli**: paczka A v1 nie zawiera 10 slotów × 3 wariantów mebli salonu ani ikon do wszystkich typów; M7 zależy od pracy graficznej autora poza kodem. — Owner: autor. Block: S-16 (jedyny wycinek `blocked`).
7. **Ryzyko: lektor**: polski głos systemowy na tablecie może być słaby lub go brak. — Owner: autor. Block: S-05 (nie blokuje; sprawdzić na urządzeniach w M2).
8. **Adres gry do czasu zakupu domeny**: ROZSTRZYGNIĘTE 2026-10-11: gra działa pod https://martynka-urzadza.pl (DNS A → 179.198.222.94, `www` przekierowuje na apex, certyfikaty Let's Encrypt przez Caddy); etap z certyfikatem na adres IP trwał jeden dzień. — Owner: autor. Block: —.

## Parked

- **Fabuła, dialogi, postacie, wydarzenia czasowe** — Why parked: PRD Non-Goals; Martynka to nazwa gry, nie bohaterka.
- **Energia, timery, reklamy, zakupy, sklep, ranking** — Why parked: PRD Non-Goals; zero presji i zero monetyzacji.
- **Wiele profili, konta, chmura, synchronizacja** — Why parked: PRD Non-Goals i Access Control; jeden profil lokalny, format zapisu zostawia miejsce na profile.
- **Merge board** — Why parked: PRD Non-Goals; zadania matematyczne zastępują go całkowicie.
- **Drugi pokój z grafiką** — Why parked: PRD Non-Goals; pierwsza rzecz po v1, zależna od grafiki.
- **Pozostałe minigry (poza 1–2) i pełna pula zagadek dla wszystkich etapów** — Why parked: PRD Non-Goals; v1 sprawdza format na małej puli.
- **Dopracowanie treści E1–E2 i E5–E6** — Why parked: PRD Non-Goals; generatory działają, jakość poleceń gwarantowana w v1 dla E3–E4.
- **Osobny raport postępów poza grą** — Why parked: PRD Non-Goals; podgląd w ustawieniach i eksport zapisu wystarczą.
- **Układ pionowy, telefon, inne przeglądarki** — Why parked: PRD Non-Goals (niefunkcjonalne); tablet w poziomie, trzy nazwane przeglądarki.

## Milestone History

(Append-only. Empty on the very first milestone.)

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived.)

- **F-01: (foundation) gra startuje na Phaser 4.2.x w scenie 1920×1080 dopasowanej do ekranu, z pustą sceną, docelowym układem katalogów (`core/` bez importów silnika, `data/`, `scenes/`, `storage/`, `tests/`), bez telemetrii szablonu; `npx tsc --noEmit` przechodzi** — Archived 2026-10-11 → `context/archive/2026-10-11-game-shell-scaling/`. Lesson: —.
- **F-02: (foundation) build `dist/` jest publikowany z GitHub Actions na istniejący VPS za Caddy (HTTPS), z zachowaniem poprzedniego wydania do rollbacku; runbook w `deploy/README.md`** — Archived 2026-10-11 → `context/archive/2026-10-11-static-deploy-pipeline/`. Lesson: —.
- **S-01: dziecko otwiera grę z adresu URL na tablecie, dodaje ją do ekranu początkowego (z instrukcją przy pierwszym uruchomieniu w przeglądarce) i uruchamia offline; w pionie widzi „Obróć tablet”; nowa wersja instaluje się sama przy następnym starcie** — Archived 2026-10-12 → `context/archive/2026-10-11-installable-offline-pwa/`. Lesson: —.
- **F-03: (foundation) vitest działa na `core/`, generatory dostają seedowany rng, a skrypt próbkujący wypisuje po 3 zadania z każdego kroku etapu i raportuje naruszenia (zakres, ujemne, odmiana)** — Archived 2026-10-12 → `context/archive/2026-10-12-generator-test-harness/`. Lesson: —.
- **S-02: autor wypisuje z każdego kroku etapów E3 i E4 oryginalne zadania wszystkich typów grupy 1 (ZADANIA.md, sekcja 7) z poprawną odpowiedzią, rozpraszaczami, podpowiedzią krok po kroku i poprawną odmianą liczebników; testy 1000 losowań przechodzą** — Archived 2026-10-12 → `context/archive/2026-10-12-generators-e3-e4/`. Lesson: przegląd treści przez „nauczyciela” wyłapał biernik i podpowiedź IX, których walidator nie widzi; każdy nowy rzeczownik i przypadek musi trafić do danych z testem.
- **S-03: autor wypisuje zadania grupy 1 dla E1–E2 i E5–E6 na tych samych generatorach z danymi etapu; testy mechaniczne (zakres, ujemne, rozpraszacze) przechodzą dla wszystkich sześciu etapów; dopracowanie treści tych etapów pozostaje na później (PRD Non-Goals)** — Archived 2026-10-12 → `context/archive/2026-10-12-generators-remaining-stages/`. Lesson: —.
- **S-04: dziecko rozwiązuje rundę zadań dotykiem (kafelki lub klawiaturka) z kropkami postępu, dostaje gwiazdkę za każde poprawne zadanie (także w drugiej próbie) i bonus za rundę bez błędu; po błędzie widzi potrząśnięcie i podpowiedź, po drugiej pomyłce rozwiązanie krok po kroku i przepisuje wynik; licznik gwiazdek jest zawsze widoczny, przełącznik ukryty w trakcie zadania.** — Archived 2026-10-12 → `context/archive/2026-10-12-task-round-stars/`. Lesson: —.
- **S-05: dziecko odsłuchuje polecenie polskim lektorem (automatyczne czytanie jako ustawienie z domyślną wartością zależną od etapu; bez polskiego głosu przycisk ukryty) i po rundzie widzi podsumowanie z gwiazdkami oraz przyciski „Kolejna runda” i „Do pokoju” (wyróżnione, gdy stać na mebel).** — Archived 2026-10-12 → `context/archive/2026-10-12-narrator-round-summary/`. Lesson: —.
- **S-06: przy pierwszym uruchomieniu dziecko podaje wiek (6–10), gra proponuje etap wg wieku i miesiąca, rodzic po bramce dla dorosłego potwierdza lub zmienia etap, a rozgrzewka 6 zadań koryguje start w dół.** — Archived 2026-10-13 → `context/archive/2026-10-13-first-launch-placement/`. Lesson: —.
- **S-07: gra losuje zadania z odblokowanych kroków według wag (wartości w danych balansu), prowadzi licznik opanowania 0–5 każdej umiejętności licząc tylko pierwszą próbę, odblokowuje kolejny krok przy opanowaniu w większości umiejętności ze scenką „Nowa umiejętność!” i łagodzi trudność po dwóch słabych rundach.** — Archived 2026-10-13 → `context/archive/2026-10-13-adaptive-curriculum/`. Lesson: —.
- **S-08: rodzic po długim przytrzymaniu ikony i bramce dla dorosłego zmienia etap, włącza lub wyłącza automatyczne czytanie i widzi zwięzły podgląd postępów (bieżący krok i 3 najsłabsze umiejętności z przykładami błędów).** — Archived 2026-10-13 → `context/archive/2026-10-13-parent-settings-progress/`. Lesson: —.
- **S-09: dziecko widzi salon (placeholdery) z bieżącym zadaniem remontowym i kosztem z danych pokoju, przy braku gwiazdek przycisk pokazuje „masz X/Y” i prowadzi do zadań, a przy wystarczającej liczbie otwiera panel 3 wariantów z podglądem i zatwierdza „Wybieram” (gwiazdki odejmowane dopiero wtedy) z animacją i dźwiękiem.** — Archived 2026-10-13 → `context/archive/2026-10-13-first-furniture-purchase/`. Lesson: —.
- **S-10: dziecko zmienia wariant urządzonego elementu za darmo po przytrzymaniu (lub w trybie „zmień”), po ostatnim zadaniu widzi „Pokój gotowy!”, listę pokoi z jedną pozycją i zapowiedzią oraz może dalej robić „poprawki” i rundy.** — Archived 2026-10-13 → `context/archive/2026-10-13-variant-change-room-done/`. Lesson: —.
- **S-11: po zamknięciu gry (lub rozładowaniu tabletu) i ponownym otwarciu gwiazdki, salon i postęp nauki są dokładnie takie same; zapis następuje sam po każdej zmianie i przy ukryciu karty, natychmiast po zapłacie za mebel i końcu rundy; zapis ze starszej wersji gry jest przenoszony do nowej, a nieudane przeniesienie zostawia stary zapis i oferuje eksport.** — Archived 2026-10-13 → `context/archive/2026-10-13-autosave-versioned-save/`. Lesson: —.
- **S-12: rodzic w ustawieniach eksportuje zapis do pliku, importuje go po walidacji i podsumowaniu (gwiazdki, etap, postęp pokoju) i resetuje grę z potwierdzeniem.** — Archived 2026-10-13 → `context/archive/2026-10-13-save-export-import-reset/`. Lesson: —.
- **S-13: dziecko rozwiązuje w rundzie zadania typów grupy 2 dla E3–E4 z zegarem, linijką, osią liczbową, klockami dziesiątkowymi, słupkiem pisemnym, grafami i figurami rysowanymi w kodzie, z odpowiedzią dotykiem (w tym przeciąganiem i zaznaczaniem).** — Archived 2026-10-13 → `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/`. Lesson: —.
- **S-14: dziecko rozwiązuje zadania z monetami i banknotami, wagą, naczyniami i termometrem (grafika z paczki A v1) oraz typy grup 2–3 dla E1–E2 i E5–E6; każdy etap ma pełny zestaw typów z ZADANIA.md.** — Archived 2026-10-14 → `context/archive/2026-10-14-art-tasks-all-stages/`. Lesson: —.
- **S-13b: dziecko rozwiązuje kwadrat magiczny (E3.5), zadania na siatce z kodowaniem pól (E3.7) i obwody figur na siatce (E4.7) oraz ustawia zegar przeciąganiem wskazówek (CLOCK, E3–E4).** — Archived 2026-10-14 → `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/`. Lesson: —.
