---
change_id: minigame-daily-puzzle
title: Minigry (Hasło z wyników, Zakrywanka) i zagadka dnia za podwójne gwiazdki
status: plan_reviewed
created: 2026-10-14
updated: 2026-10-14
archived_at: null
---

## Notes

Slice roadmapy **S-15** (etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`, gałąź
`feat/minigame-daily-puzzle` cięta z `main` @ `1441161` (po S-13b, PR #49).

- **Outcome (roadmapa):** co kilka rund dziecko zamiast zwykłej rundy dostaje minigrę albo zagadkę dnia z puli
  10–15 zagadek dla E3–E4 za podwójne gwiazdki (mnożnik w danych balansu).
- **PRD:** FR-024 (minigra co kilka rund, 1–2 w v1 z ZADANIA § 5), FR-025 (zagadka dnia z ręcznej puli LOGIC za
  podwójne gwiazdki, 10–15 dla E3–E4). Guardrails: zero kar (nigdy utrata gwiazdek, bez czerwonych krzyżyków, **bez
  limitu czasu**), postęp nigdy nie ginie, zadania poprawne i w zakresie etapu, offline. FR-020 (zapis natychmiast po
  zdarzeniu nieodwracalnym — koniec rundy), FR-021 (zapis wersjonowany, nieudana migracja zostawia stary zapis).
  Non-goals: brak timerów, wydarzeń czasowych, sklepu.
- **Plan `Martynka-urzadza.md`:** § 6 „Co kilka rund zamiast zwykłej rundy minigra lub zagadka dnia za podwójne
  gwiazdki (mnożnik ×2 w `balance.ts`). W v1: Hasło z wyników i Zakrywanka oraz pula 10–15 zagadek dla E3–E4”; § 8
  zapis (`version` + migracja w `core/save.ts`); § 11 M6 „Gotowe, gdy … minigra i zagadka dnia pojawiają się co kilka
  rund”; § 13 decyzje autora 2026-10-14.
- **Katalog (`docs/ZADANIA.md`):** § 5 „Hasło z wyników” (od E1: każdy wynik ma literę, słowo = np. nazwa mebla),
  „Zakrywanka” (od E1: dwie kostki, dodaj lub odejmij oczka, zakryj wynik na planszy 0–12); § 4 **LOGIC** („kto na
  którym piętrze”, „wagony liczone z dwóch stron”, „jaką jestem liczbą”, „ważenie na szalkach”, „przelewanie wody”;
  nie generator — dane w pliku; zagadka dnia za podwójne gwiazdki); § 1 „nigdy nie odbieramy gwiazdek i nie ma limitu
  czasu”. LOGIC dziś tylko jako typ kroku E6.11 bez umiejętności (`src/data/curriculum/E6.ts`).
- **Kontrakt runu § S-15** (wiążący) i § All slices: patrz „Decided inputs”. Plik lekcji w `context/foundation/`
  nie istnieje (sprawdzone).
- **Wzorce:** `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/` (tabela claims, triggered follow-ups, decyzje),
  `context/archive/2026-10-14-save-reason-and-recovery/` (model bezpieczeństwa zapisu: powód `future` z `decodeSave`
  dochodzi do statusu autosavera, `deviceSaveView`, panelu i dialogów; import/reset nie niszczą nowszego zapisu).

## Decided inputs (autor 2026-10-14, plan § 13, kontrakt § S-15) — nie są pytaniami otwartymi

| Pytanie roadmapy (Unknowns, Open Roadmap Question 2) | Rozstrzygnięcie |
|---|---|
| Które 1–2 minigry w v1? | **Hasło z wyników + Zakrywanka**; wzór ekranów w paczce expansion (`designs/martynka-expansion-v1`, „Ukryte słowo” i „Kostki”), obie rysowane kodem (PNG to tylko podglądy). |
| Jaki mnożnik za zagadkę dnia? | **×2**, liczba w `src/data/balance.ts`. |
| Kto napisze pulę 10–15 zagadek? | **Agent** — oryginalne zagadki typów LOGIC z ZADANIA § 4, nigdy z podręczników (`docs/zrodla/` nie czytamy); każda zagadka z teacher read w artefakcie i wierszem `[human]`, w którym autor czyta wszystkie przed wydaniem. |
| Format zapisu | **v2 zatwierdzony** przez opiekuna (Step 0, 2026-10-14), jeśli slice potrzebuje trwałego stanu: krok v1→v2 w `MIGRATIONS`, zamrożone fixtures v1 nadal się wczytują, nowy fixture v2 zamrożony, zachowanie SIR-01 (nowszy zapis nie jest nadpisywany) trzyma się dla v2, nieudana migracja zostawia stary zapis (FR-021). |
| Zasady | Bez stanów porażki, bez timerów z karą; błędna odpowiedź nigdy nie zabiera gwiazdek. |

## Roadmap claims vs repo now

Stan sprawdzony na `feat/minigame-daily-puzzle` @ `1441161` (blok S-15 pisany przy roadmapie, przed S-12…S-14,
S-13b i dwiema poprawkami po audytach).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-12; „zależy tylko od rundy i adaptacji” | S-12 done (#39), potem S-13, S-14, S-13b, art-stand-in (#44), save-reason-and-recovery (#48). Runda: `src/core/round.ts` (`startRound(tasks, rules)`, `RoundRules` = `length`, `starPerTask`, `cleanRoundBonus` — liczby jako argumenty), `TaskScene.freshRound` buduje rundę rozgrzewki (`buildWarmup`), wymuszoną e2e (`forcedSkills`) albo adaptacyjną (`buildAdaptiveRound`), `finishRound` → `endRound(…, 'warmup' \| 'round', …)` + `flush('now')`. Gwiazdki płyną w trakcie rundy (`syncStars` → `earn(delta)` po każdej odpowiedzi), nie na końcu. | Wariant rundy potrzebuje trzeciej gałęzi w `freshRound`/`finishRound` (rodzaj rundy: zwykła / minigra / zagadka) i decyzji, czy wynik wariantu idzie do `endRound` (opanowanie). Mnożnik ×2 da się wyrazić przez `RoundRules.starPerTask` rundy zagadki — bez zmiany `earn`. |
| „wariant rundy, nie nowa pętla” | Zgadza się z kitem: ekran minigry to ten sam notes, HUD „Do pokoju”, licznik, głośnik, faza błąd → podpowiedź → druga próba → rozwiązanie („Pokaż”), podsumowanie „Brawo!”, „Kolejna runda”, „Do pokoju” (expansion `style-guide.md` § Plansze kodowe). | Bez korekty co do pętli; **ale** maszyna stanów `round.ts` ma fazę `retype` po rozwiązaniu, a kit minigier „ponowny wybór odpowiedzi” — zgodne. Planszę (litery hasła, pola 0–12 zakryte) trzeba narysować obok niej. |
| Unknowns: „Które 1–2 minigry, jaki mnożnik” — Owner autor, rozstrzygnąć na starcie planu | Rozstrzygnięte 2026-10-14 (plan § 13, `docs/art-inventory.md` § 5 i nagłówek, kontrakt). | Zamknięte — decided inputs powyżej. Roadmap Open Question 2 do oznaczenia jako rozstrzygnięte przy archiwum. |
| Unknowns: „Kto i kiedy napisze pulę 10–15 zagadek (praca autorska poza kodem)” | Rozstrzygnięte: pisze agent w tym slice'u; autor czyta. | Pula to **dane** w `src/data/` (np. `src/data/puzzles.ts`), w zakresie tego slice'a, z teacher read i wierszem `[human]`. |
| „zagadka dnia z puli ok. 10–15 zagadek dla E3–E4” | Brak jakiegokolwiek kodu LOGIC/minigier/zagadek w `src/` (grep `logic\|minigam\|daily\|zagadk`); LOGIC występuje tylko jako typ kroku E6.11 bez umiejętności. Rejestr generatorów nie ma typu LOGIC (ZADANIA: „nie generator”). | Zagadka to nowy rodzaj treści (stała pula, nie `(skill, rng) => Task`); musi przejść ten sam `validateTask`/hint/plural co zadania albo własny test treści (`tests/contentInvariants.test.ts` ich nie obejmie sam). Uczeń E1–E2 i E5–E6: brak puli → nigdy nie dostaje zagadki (v1); decyzja 4. |
| „za podwójne gwiazdki” | `balance.round.starPerTask = 1`, `cleanRoundBonus = 2`; `earn` przyjmuje tylko dodatnie całkowite delty. | `balance` dostaje nowy blok (np. `variants: { everyRounds, dailyPuzzleMultiplier: 2, … }`); co mnożymy (gwiazdkę za zagadkę, także drugą próbę?) — decyzja 5. |
| „co kilka rund” (FR-024, M6 Gotowe) | Brak licznika rund w stanie (`SessionLearner` ma `weakStreak`, `easedRounds`, nic o wariantach); registry nie ma dnia (jest tylko `month`, ustawiany raz w `main.ts`; scenes „never call Date”). | Licznik rund od ostatniego wariantu i **dzień** ostatniej zagadki dnia to stan trwały → save v2 (sekcja „Migration expected?”). Dzień z `main.ts` jak `month` (e2e: nowy szew typu `?e2eDay=` w buildzie z hookiem, znacznik w `vite/e2eHookGuard.mjs`). |
| „Parallel with S-13, S-14” | Run idzie szeregowo; S-13/S-14/S-13b już done. S-16 (`blocked`) czeka na S-15. | Bez korekty; status w roadmapie zmieni orkiestrator / archiwum. |
| Kit: minigry rysowane kodem; plansze „Kostki” 0–12 i „Ukryte słowo” | `designs/martynka-expansion-v1/manifest.json` `miniGames.dice` (wyniki 0–12, `+` i `−`, `negativeResults: false`), `miniGames.hiddenWord.words` (SOFA, OKNO, LAMPA, FOTEL, PÓŁKA); zadania w demo są **stałe** (`preview.js` `diceTasks`, `wordTasks`), „To demonstracja, nie pełny silnik”. | Zadania trzeba generować (stała lista z kitu to tylko wzór); słowa hasła = dane w `src/data/` (zgodne z meblami salonu — `src/data/rooms.ts` nie ma slotów „fotel”, „okno”; decyzja 3). |
| ZADANIA § 5 Hasło: „po rozwiązaniu wszystkich i ułożeniu wyników rosnąco odsłania się słowo” | Kit (`style-guide.md`): „Jedno poprawne działanie odsłania jedną literę”, kafle liter 132×138, kolejne litery w kolejności zadań (`word-first-letter.png`). | Rozbieżność katalog ↔ kit; kit jest źródłem widoku (profil § 6) → litera po każdym poprawnym zadaniu (decyzja 2). |
| ZADANIA § 5 Zakrywanka: „rzut dwiema kostkami” | Kit pokazuje kostki już „rzucone”, bez przycisku rzutu; plansza 13 pól 0–12, „Wszystkie pola zakryte!” po 13 zadaniach (`dice-complete.png`); 0 = 3−3, 1 = 4−3, odejmowanie zawsze większa − mniejsza. | Długość minigry (13 rzutów vs runda 5) i dobór rzutów (czy każdy rzut trafia w niezakryte pole) — do research/plan; liczby w `balance.ts`. Zakres 0–12 to poziom E1 — dla E3–E4 łatwy (decyzja 6). |

## Scope (propozycja dla `/10x-research` i `/10x-plan`)

| Element | Co | Gdzie (przewidywane) |
|---|---|---|
| Planowanie wariantu | Czysta reguła w `core`: po ilu zwykłych rundach wariant, który (minigra A/B na zmianę, zagadka dnia raz dziennie dla etapu z pulą), stan trwały | nowy moduł w `src/core/` (np. `variants.ts`), liczby w `balance.ts` |
| Hasło z wyników | Runda N zadań z puli ucznia (odpowiedzi liczbowe, kafelki jak w kicie — 3 kafelki), litera po każdym poprawnym; słowo z danych | `core/round` + widżet planszy liter w `src/ui/widgets/`, słowa w `src/data/` |
| Zakrywanka | Rzuty dwiema kostkami (`+`/`−`, wynik 0–12 bez ujemnych), plansza 13 kafli, poprawny wynik zakrywa pole; kostki z oczkami rysowane kodem (kit: kwadrat 150 px, 6 układów oczek) | czysty generator rzutów w `core`, widżety `Dice`, `CoverBoard` |
| Zagadka dnia | Pula 10–15 oryginalnych zagadek LOGIC dla E3–E4 (5 rodzajów z ZADANIA § 4), odpowiedź kafelkami/klawiaturą, podpowiedź krok po kroku, ×2 gwiazdki | `src/data/puzzles.ts` (+ rzeczowniki w `nouns.ts`), test treści |
| Zapis v2 | Pola wariantów + migracja v1→v2, fixture v2, SIR-01 dla v2 | `src/core/save.ts`, `src/core/types.ts`, `tests/fixtures/save-v2*.json` |
| E2E | Wariant pojawia się po N rundach, zagadka raz dziennie, ×2 widoczne na liczniku; zapis przeżywa restart | `tests/e2e/` (protokół plików żądań), szew dnia w hook buildzie |

Poza zakresem: pozostałe 5 minigier z ZADANIA § 5 (Ścieżka, Łańcuch na czas, Ślimak, Kolorowanie, Sklepik), zagadki
dla E1–E2/E5–E6 i pula 30–50 na etap (PRD Non-goals: „po v1”), stoper w jakiejkolwiek formie, nowe pokoje.

## Design source and copy (profil § 6)

- **Widoki kitu, które slice wiąże** (`designs/martynka-expansion-v1/`, tylko do odczytu): `screenshots/dice-idle.png`
  („Zakryj wynik”, dwie kostki, `− =  ?`, 13 kafli 0–12 w dwóch rzędach, „Podpowiedź”), `dice-second-try.png`,
  `dice-solution.png`, `dice-correct.png`, `dice-complete.png` („Wszystkie pola zakryte!”), `tablet-dice-1024.png`;
  `word-idle.png`, `word-first-letter.png` („Oblicz”, kafle liter z kropką, odsłonięta litera na zielono, działanie,
  3 kafelki, pasek „Brawo! Jeszcze jedna gwiazdka.” + „Dalej”), `word-hint.png`, `word-second-try.png`,
  `word-complete.png`, `tablet-word-1024.png`; `style-guide.md` § Paleta i typografia, § Plansze kodowe (kafle: jasna
  zieleń, obrys 5 px, promień 28, cień 7; kostka 150 px; litery 132×138, 88 px; przyciski ≥ 96 px; „Bez hovera i
  zegara”); `manifest.json` `miniGames`; `preview.html`/`preview.js`/`expansion.css` (`?game-only=1&view=dice|word`).
  Wspólny ekran zadania: `designs/martynka-maths-A-v1/screenshots/task-tiles.png`, `task-keypad.png`.
- **Klucze tekstów (nowe, `src/data/pl.ts`)**: tytuły w HUD („Kostki · 0–12”, „Ukryte słowo” — kit), polecenia
  („Zakryj wynik”, „Oblicz”), podpowiedzi minigier (kit: „Policz razem oczka obu kostek.”, „Odejmij oczka drugiej
  kostki.”, „Zacznij od {a} i dodaj {b}.”), ukończenie („Wszystkie pola zakryte!”, odsłonięte słowo), „Brawo! Jeszcze
  jedna gwiazdka.”; dla zagadki dnia — tytuł, polecenia i podpowiedzi zagadek (dane w `src/data/puzzles.ts`).
  Istniejące klucze rundy (`pl.round.*`: „Dalej”, „Kolejna runda”, „Do pokoju”, „Spróbuj jeszcze raz”) — reużyć.
- **DESIGN-GAP (nowe wiersze `docs/design-gaps.md`, od 79):** kit nie ma ekranu **zagadki dnia** (ani tekstu
  „zagadka dnia”, ani oznaczenia ×2); nie ma **zapowiedzi wariantu** (jak dziecko dowiaduje się, że zamiast rundy
  przychodzi minigra/zagadka; czy może odmówić); nie ma **podsumowania z ×2** (podsumowanie rundy pokazuje gwiazdki na
  zadanie); nie ma widoku **minigry w etapie E3–E4** z innym zakresem niż 0–12 (jeśli plan go zmieni); hasło
  dłuższe/krótsze niż 5 liter i PÓŁKA z „Ó/Ł” w kaflu 132 px — sprawdzić w bramce wizualnej; brak rozróżnienia
  kropek postępu rundy na ekranie minigry (kit ich nie pokazuje — plansza je zastępuje).

## Migration expected?

**Tak — v2 jest spodziewany** (zatwierdzony przez opiekuna; decyzja 1). Powód: „co kilka rund” i „raz dziennie” to stan,
który musi przeżyć zamknięcie gry (FR-020, guardrail „postęp nigdy nie ginie”) — inaczej dziecko, które gra po 1–2
rundy na sesję, nigdy nie zobaczy minigry, a zagadkę dnia dostanie przy każdym starcie. Minimalny stan trwały
(propozycja, plan rozstrzyga kształt): liczba zwykłych rund od ostatniego wariantu, dzień (lokalna data `YYYY-MM-DD`)
ostatniej zagadki dnia, identyfikatory rozwiązanych zagadek (rotacja puli bez powtórek), ostatnia minigra (naprzemienność).
Wymogi: krok `1 → 2` w `MIGRATIONS` (v1 dostaje wartości startowe), `tests/fixtures/save-v1*.json` nietknięte i nadal
się wczytują, nowy `save-v2*.json` zamrożony, `saveProblem` dla v2, `encodeSave` pisze v2, import pliku v1 przechodzi
przez migrację (`parseImport` → `decodeSave`), `future` = wersja > 2 nadal blokuje nadpisanie (SIR-01 oparty na
`reason === 'future'`, nie na numerze), nieudana migracja zostawia stary zapis (FR-021). Rollback v2 → v1 (stary build
spotyka zapis v2): stary build zgłasza `future` i nie nadpisuje — zachowanie już wdrożone w save-reason-and-recovery.
Co zmieniłoby odpowiedź: research pokaże, że stan wariantów może żyć wyłącznie w sesji bez szkody dla FR-024/FR-025
(np. wariant co N rund liczonych w `history`, a dzień zagadki wyprowadzony z `history[].at`) — wtedy format zostaje v1,
a follow-upy „first save-format change (v2)” zostają nietknięte.

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| Krok `1 -> 2` w `MIGRATIONS`, `save-v1.json` zostaje, `save-v2.json` + test v1→v2; kopia `profile:default:backup-v1` przed pierwszym zapisem po migracji. `Trigger: first save-format change (v2)` | `2026-10-13-autosave-versioned-save` | **W zakresie** (rdzeń decyzji 1). Kopia zapasowa v1 — w zakresie (tania, chroni FR-021 przy błędzie migracji wykrytym po zapisie); `src/storage/idb.ts` jedynym importerem `idb-keyval`. |
| L-S1 obsługa kroku migracji w `decodeSave`. `Trigger: first migration step (v2)` | `2026-10-13-save-export-import-reset` | **W zakresie** — pierwszy prawdziwy krok; migracja rzucająca wyjątek → `unreadable`, stary zapis nietknięty, test. |
| Two-build e2e (ryzyko #10 test-planu: stary build pisze, nowy czyta). `Trigger: first save-format change (v2)` | `2026-10-13-autosave-versioned-save` | **Wyzwolony; research rozstrzyga koszt.** Jeden origin dla dwóch buildów wymaga nowego serwera; tańszy zamiennik: zamrożony v1 zapis wstrzyknięty przez szew e2e (`?e2eSave=v1`) i odczytany przez build v2. Bez tego co najmniej testy jednostkowe fixtures v1 → v2. |
| Dwie instancje jednego originu (ostatni zapis wygrywa) + S12-15 (`BroadcastChannel` po `replace`). `Trigger: first save-format change (v2) …` | `2026-10-13-autosave-versioned-save`, `2026-10-13-save-export-import-reset`, `2026-10-14-save-reason-and-recovery` | **Poza** — nie wynika z formatu v2 (licznik zapisu byłby osobną zmianą formatu); nowy trigger: „a parent reporting lost progress or a second format change”. |
| M-S1 reguła wdrożenia dla zapisu. `Trigger: first save-format change (v2) or the next change to deploy/` | `2026-10-13-save-observability-c1-c2` | **Częściowo** — run nie zmienia `deploy/` (kontrakt); reguła („build v1 po rollbacku widzi v2 jako `future`”) trafia do treści PR i runbooka tylko jako tekst w artefaktach, nie w `deploy/`. Reszta zostaje z triggerem „next change to deploy/”. |
| S13-06 podgląd pomyłek rodzica bez rysunku i odpowiedzi zegara (design-gaps 58). `Trigger: S-15 save format v2` | `2026-10-14-drawn-grid-tasks-e3-e4` (i `2026-10-13-drawn-widget-tasks-e3-e4` „select”) | **Poza zakresem S-15, decyzja planu** — inna funkcja (widok rodzica); dołożenie pól `example` to też zmiana formatu, więc plan może ją dołączyć do v2 tylko jeśli to tanie. Domyślnie nowy trigger „next save-format change or S-17”. |
| S12-02 (`replace` bez limitu czasu), S12-03 (`stateOf` nie czyta `status.replace`), S12-11 (porażki `replace` przy `off`). Triggery: „S-15's v2 migration touching replace”, „S-15 moving the import out of the dialog”, „S-15 … writing a migrated save through replace” | `2026-10-14-save-reason-and-recovery` | **Nie wyzwolone, o ile** migracja działa w `decodeSave` przy odczycie, a zmigrowany zapis pisze zwykły autosave (nie `replace`), a import zostaje w dialogu. Plan musi to potwierdzić; jeśli migracja przejdzie przez `replace` — S12-02/S12-11 w zakresie. |
| S12-07, S12-08, S12-09, S12-12, S12-13, S12-14, S12-15. `Trigger: S-15 save format v2` | `2026-10-14-save-reason-and-recovery` (opisy w raporcie audytu 2026-10-14_0445 na gałęzi audytu) | **S12-09 w zakresie** (data i build pliku w „Z pliku” + log przed `reload()` — import pliku v1 w buildzie v2 jest właśnie tym przypadkiem). **S12-14** (data/build w nazwie surowej kopii) tani — kandydat. S12-07, S12-08, S12-12, S12-13, S12-15 — **poza**: dotyczą udostępniania, odczytu pliku, `persist()` i sesji dialogów, nie formatu; nowe konkretne triggery przy archiwum (zamyka zarzut SIR-07). |
| Visual-gate O1: karta startowa dla zapisu `future` ma ogólny tytuł „Nie udało się wczytać zapisu”. `Trigger: S-15 save format v2 (…) or the next change to saveFailedCard.ts` | `2026-10-14-save-reason-and-recovery` | **W zakresie** — tanie, a build v2 jest pierwszym, który po kolejnym rollbacku (v3 → v2) pokaże tę kartę; ciało karty „zaktualizuj grę” zamiast „zrób kopię”. |
| M-1 (residuum: `applyParentStage` ustawia `this.stage` przed `freshRound`), M-2 (`advance` zatwierdza `finished` przed `finishRound`), M-13 (zmiana etapu w trakcie rundy). `Trigger: next change to TaskScene / narrator` | `2026-10-13-observability-c1-c2`, `2026-10-14-art-stand-in-and-load-signal` | **Wyzwolony** — slice zmienia `freshRound`/`finishRound`/`beginRound`. W zakresie: kolejność „zbuduj nowy stan, potem zatwierdź” dla nowej gałęzi wariantu i reguła, co dzieje się z minigrą/zagadką przy zmianie etapu przez rodzica (M-13 dla wariantu). H-3/H-4 (lektor) — nie dotykamy `narrator.ts` → poza. |
| `TaskScene` drag: F4/F5 (`pointerupoutside`, „OK” przy trzymanej wskazówce). `Trigger: next change to the drag wiring in TaskScene` | `2026-10-14-drawn-grid-tasks-e3-e4` | **Nie wyzwolony**, jeśli minigry nie używają `drag` (kit: tylko kafelki). |

## Autonomous decisions

1. **Save v2 jest spodziewany, z minimalnym blokiem stanu wariantów.** Odrzucone: stan tylko w sesji; wyprowadzanie
   licznika i dnia z `history`. Dlaczego: FR-024 „co kilka rund” i FR-025 „zagadka dnia” bez trwałego stanu albo nie
   działają przy krótkich sesjach, albo powtarzają się przy każdym starcie; `history` nie zapisuje rund wariantów i jest
   przycinane do 200; opiekun zatwierdził v2 właśnie na ten przypadek. Co zmieniłoby odpowiedź: research wykaże, że
   `history` + `at` wystarczą bez zmian kształtu (wtedy v1 zostaje).
2. **Hasło z wyników: litera po każdym poprawnym zadaniu (kit), nie „ułożenie wyników rosnąco” (ZADANIA).** Odrzucone:
   wariant z katalogu. Dlaczego: profil § 6 — widok i zachowanie z kitu; kit ma gotowe stany (`word-first-letter`,
   `word-complete`); sortowanie wyników to drugi krok dla dziecka bez widoku w kicie. Co zmieniłoby odpowiedź: autor
   w wierszu `[human]` poprosi o wariant „rosnąco” — to dane/reguła w `core`, nie nowy ekran.
3. **Słowa hasła z danych, wyłącznie meble/elementy salonu z polskimi literami w kaflach; lista kitu jako punkt wyjścia.**
   Odrzucone: dowolne słowa; dokładnie lista kitu (FOTEL, OKNO nie są slotami `src/data/rooms.ts`). Dlaczego: ZADANIA
   „słowo = np. nazwa nowego mebla” wiąże minigrę z pokojem; długość słowa = liczba zadań (4–5, blisko rundy 5). Co
   zmieniłoby odpowiedź: research uzna, że słowo „następnego mebla do kupienia” jest lepszą nagrodą (wtedy lista =
   sloty salonu, a słowa spoza nich odpadają) — rozstrzyga plan.
4. **Zagadka dnia tylko dla etapów E3–E4 (pula v1); E1–E2 i E5–E6 dostają wtedy minigrę.** Odrzucone: zagadki dla
   wszystkich etapów (PRD Non-goal), pomijanie wariantu w ogóle dla etapów bez puli. Dlaczego: FR-025 i kontrakt mówią
   E3–E4; minigry są „od E1”, więc każdy etap ma wariant. Co zmieniłoby odpowiedź: research pokaże, że zagadki E3 są
   w porządku także dla E5 (wtedy pula obejmuje E5 bez nowych zagadek) — decyzja planu.
5. **×2 dotyczy gwiazdek za zagadkę (także za drugą próbę), bez kary i bez limitu czasu; liczba w `balance.ts`.**
   Odrzucone: ×2 tylko za pierwszą próbę (to kara względem zwykłej rundy). Dlaczego: guardrail „druga próba też daje
   gwiazdkę”, `RoundRules.starPerTask` już jest argumentem. Co zmieniłoby odpowiedź: plan pokaże, że zagadka dnia to
   runda kilku zagadek z bonusem za bezbłędność — wtedy plan określa, czy bonus też ×2.
6. **Zakrywanka zostaje 0–12 z `+`/`−` jak w kicie dla wszystkich etapów w v1; zakres/operacje jako dane per etap
   (otwarte dla research).** Odrzucone: od razu nowy zakres dla E3–E4 (np. Ślimak — inna minigra, od E4). Dlaczego:
   kit i ZADANIA definiują Zakrywankę na 0–12; minigra to zabawowy wariant, nie test etapu; brak widoku innej planszy
   (DESIGN-GAP). Co zmieniłoby odpowiedź: teacher read uzna 0–12 za zbyt łatwe dla E3–E4 (np. trzy kostki albo większe
   liczby) — wtedy dane etapu, nowy wiersz design-gaps.
7. **Minigry i zagadka nie zmieniają opanowania (`endRound` tylko dla zwykłych rund) — wstępnie, do research.**
   Odrzucone: liczenie do mastery. Dlaczego: kostki 0–12 nie są umiejętnością etapu E3–E4, zagadki nie mają `skillId`;
   adaptacja (wagi, łagodzenie) opiera się na zwykłych rundach. Co zmieniłoby odpowiedź: Hasło z wyników losuje zadania
   z umiejętności ucznia (`buildAdaptiveRound`) — wtedy ich pierwsze próby mogą liczyć się do opanowania; plan decyduje.
8. **Następny krok `/10x-research minigame-daily-puzzle`, nie `/10x-plan`.** Odrzucone: `/10x-plan` (domyślne w
   skillu), `/10x-frame`. Dlaczego: polecenie kroku i kontrakt to ustalają; realne niewiadome: kształt v2, wpięcie
   trzeciego rodzaju rundy w `TaskScene`, widżety planszy, model zagadek i ich walidacja, szew dnia w e2e. Co
   zmieniłoby odpowiedź: nic w tym runie (polecenie kroku nadpisuje rekomendację skilla).
