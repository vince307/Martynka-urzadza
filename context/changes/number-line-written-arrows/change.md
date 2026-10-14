---
change_id: number-line-written-arrows
title: Słupek pisemny z okienkami cyfr, grafy strzałkowe i oś liczbowa (rysunek i podpowiedź)
status: implemented
created: 2026-10-14
updated: 2026-10-15
archived_at: null
---

## Notes

Slice roadmapy **S-14b** (etap M6), autonomiczny run `2026-10-14-save-s13b-s15-s14b`, gałąź
`feat/number-line-written-arrows` cięta z `main` @ `882cd93` (po S-15, PR #50).

- **Outcome (roadmapa):** dziecko dodaje i odejmuje pisemnie w słupku z okienkami cyfr i przeniesieniem (WRITTEN,
  E5.2, E6.7), uzupełnia grafy i tabelki strzałkowe (ARROW_TABLE, E2.6) i widzi oś liczbową jako rysunek
  SEQUENCE/MULT_GROUPS i podpowiedź ADD_SUB.
- **PRD:** FR-023 (typy grup 2–3 z widżetami rysowanymi w kodzie, w tym „oś” i „słupek”; „każdy etap ma pełny
  zestaw typów” to kryterium końca M6, nie tego slice'a).
- **Katalog (`docs/ZADANIA.md`):** § 1 (podpowiedź po błędzie: „obrazek, oś liczbowa, rozbicie działania”); § 3 kroki
  E2.6 (FACT_FAMILY, ARROW_TABLE: „grafy +n / −n”), E5.2 (ROMAN, ADD_SUB, WRITTEN: „pisemne dodawanie i odejmowanie
  w słupku”), E6.7 (WRITTEN, FACT_FAMILY: „trzycyfrowe z przekroczeniem, sprawdzanie”); § 4 **ARROW_TABLE** (wejście →
  strzałka „+5” / „−8” / „·3” → wynik; tabelka z wierszem wejść i reguły; łańcuch kilku strzałek; od E2),
  **WRITTEN** (słupek z okienkami cyfr, przeniesienie małą cyfrą; E5 do 100, E6 trzycyfrowe z przekroczeniem; wariant
  „brakujące cyfry w słupku” E6), **SEQUENCE** („ciągi i oś liczbowa”), **MULT_GROUPS** („skoki na osi”); § 7 pkt 2
  (ARROW_TABLE, WRITTEN wśród „prostych rysunków w kodzie”).
- **Kontrakt runu** § S-14b: blok roadmapy + follow-upy S-14 z `Trigger: S-14b`; nowy tryb wejścia „cyfra w okienku”:
  helpery e2e **zanim** `playable` go wpuści. § All slices: `src/core` czyste, testy najpierw, teksty w `src/data/pl.ts`,
  liczby w `balance.ts`, teacher read, bez `docs/zrodla/`, szwy e2e tylko w buildzie z hookiem (znacznik w
  `vite/e2eHookGuard.mjs`), bez zmian w `deploy/`, `designs/`, `.gitignore`, `.claude/`.
- **Wzorce:** `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/` (S-13b: nowe rodzaje `TaskVisual` `cells`/`grid`/
  `figure`, nowa gałąź trybu `drag` przez `dragMode`, `canonicalInput` + `tests/solvableInMode.test.ts`, helper e2e
  `setClock` przed wpuszczeniem trybu), `context/archive/2026-10-14-minigame-daily-puzzle/` (S-15: harmonogram
  wariantów rundy, zapis v2, filtr zadań minigry „Hasło z wyników”).
- Plik lekcji w `context/foundation/` nie istnieje (sprawdzone).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/number-line-written-arrows` @ `882cd93` (blok S-14b pisany przy planie S-14, przed S-13b
i S-15, które dziś weszły).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-14 | Done (PR #41), potem art-stand-in (#44), save-reason-and-recovery (#48), S-13b (#49), S-15 (#50). Rejestr (`src/core/tasks/registry.ts`): 35 typów, brak `WRITTEN` i `ARROW_TABLE` (oba tylko w `types:` kroków i w liście `LATER` w `tests/curriculum.test.ts`). `TaskVisual` (`src/core/tasks/visual.ts`) ma 12 rodzajów (`clock`, `ruler`, `blocks`, `bars`, `money`, `scale`, `jugs`, `thermometer`, `icons`, `cells`, `grid`, `figure`), żadnego dla słupka, grafu ani osi. W `src/` i `tests/` nie ma śladu osi liczbowej (`numberLine`). | Bez korekty zależności. Trzy nowe rodzaje rysunku (słupek, graf/tabelka, oś) i dwa nowe generatory. |
| „Parallel with S-14c, S-15” | S-15 już done (dziś); S-14c `proposed`. | S-15 nie jest już równoległy. Kolizja z S-15: minigra „Hasło z wyników” (`src/core/minigames/word.ts` `wordSkill`/`wordTask`) bierze typy z `WORD_TYPES` z odpowiedzią `tiles`/`keypad` i odrzuca zadania z rysunkiem — nowy tryb i nowe rysunki same wypadają z minigry; oś jako **podpowiedź** ADD_SUB nie może zmienić `task.visual` ADD_SUB, bo zadanie wypadłoby z minigry (decyzja 4). |
| WRITTEN w E5.2 i E6.7 | E5.2 ma 2 umiejętności (`E5.2.roman_12` tiles, `E5.2.add_sub_100_two_digit` keypad), próg `ceil(0.5·2)` = 1. E6.7 ma 1 (`E6.7.fact_check_1000`), próg 1, `childName` „Sprawdzanie działań”. | +1 WRITTEN w E5.2 → 3 umiejętności, próg **2**; +2 → 4, próg 2. +1 w E6.7 → 2, próg 1; +2 → 3, próg **2**. Plan podaje liczby; `childName` E5.2 („Dwucyfrowe i cyfry rzymskie”) i E6.7 do rozszerzenia o słupek (tekst w danych). |
| ARROW_TABLE w E2.6 | E2.6 ma 1 umiejętność (`E2.6.fact_check_sub_20`), próg 1, `childName` „Sprawdzanie odejmowania”. ARROW_TABLE nie występuje w żadnym innym kroku (ZADANIA: „od E2”). | +1 → próg 1; +2 → próg **2**. `childName` do rozszerzenia o grafy. Zakres liczb E2 (do 20 z przekroczeniem). |
| „oś liczbowa jako rysunek SEQUENCE” | SEQUENCE ma **jedną** umiejętność w całym programie: `E2.7.sequence_tens_100` (keypad, kroki co 10 do 100; `src/core/tasks/generators/sequence.ts`: polecenie tekstowe `pl.tasks.sequence` + liczby, podpowiedź `sequenceHint` + linia). | Oś dotyczy tylko E2.7 (dziesiątki 0–100 → 11 kresek, czytelne). Nowych umiejętności SEQUENCE ten slice nie dodaje (decyzja 6). |
| „oś liczbowa jako rysunek MULT_GROUPS” | MULT_GROUPS ma 2 umiejętności w E3.9 (`mult_groups_result`, `mult_groups_expr`, tiles, rysunek `icons` z ikonami w grupach). ZADANIA § 4: „skoki na osi” jako osobna forma. | Oś to **nowy wariant** MULT_GROUPS (skoki po k na osi zamiast ikon), nie zamiana rysunku dwóch istniejących umiejętności. +1 umiejętność w E3.9 → 3, próg **2** (dziś 1). |
| „oś liczbowa jako podpowiedź ADD_SUB” | Podpowiedź to wyłącznie tekst: `Task.hint: string[]` (`src/core/tasks/types.ts`), `firstHint`/`solutionSteps` (`src/core/round/hints.ts`), `addSubHint` w `addSub.ts`. Rysunek istnieje tylko jako `Task.visual`, widoczny od początku zadania (`src/core/round/pictureLayout.ts`). ADD_SUB to ok. 18 umiejętności od E1 do E6 (do 1000). | **Nowe pojęcie: rysunek podpowiedzi** (pokazywany dopiero w fazie podpowiedzi/rozwiązania) — model w `core`, faza w `round/view.ts`, miejsce w `pictureLayout`. Zakres ograniczony do ADD_SUB w małym zakresie liczb (decyzja 4). |
| Unknowns: „nowy tryb wejścia «cyfra w okienku» (pierwszy od S-13)” | Tryby: `AnswerMode = SkillDef['answer']` = `'tiles' \| 'keypad' \| 'drag' \| 'select'` (`src/core/types.ts`). S-13b nie dodał trybu, tylko gałąź `drag` (`src/core/tasks/dragMode.ts`: `'blocks' \| 'clock'`, rzut dla innego rysunku). `playable` (`src/core/round/pick.ts`) wpuszcza 4 tryby; od S-13b `canonicalInput` (`src/core/round/canonicalInput.ts`) + `tests/solvableInMode.test.ts` sprawdzają każdą umiejętność w jej trybie przez maszynę stanów rundy. Helpery e2e (`tests/e2e/support/hook.ts`): `answerRight`/`answerWrong`/`buildOnMat`/`setClock`. | Nowy tryb musi przejść ten sam łańcuch: `AnswerMode` → `canonicalInput` → `solvableInMode` → hook e2e (`targets`) + helper w `hook.ts` + `answerRight`/`answerWrong` → dopiero potem `playable`. Komentarz w `pick.ts` już to nakazuje. |
| Risk: „ref. kitu `reference/written-addition.svg`, `reference/number-line.svg`” | Oba istnieją w `designs/martynka-maths-A-v1/reference/` (+ `helper-metadata.json` `writtenAddition` {38, 27, 65, carryTens 1}, `numberLine` {0–10, skoki 4→7}). Słupek w kicie jest **gotowy** (cyfry wpisane, przeniesienie jako złote kółko), bez okienek i bez stanu „aktywne okienko”. Kit nie ma żadnego widoku grafu/tabelki strzałkowej. | DESIGN-GAP dla okienek cyfr, ARROW_TABLE i osi w podpowiedzi (sekcja niżej). |
| Status `proposed` | — | Status zmieni orkiestrator / archiwum. |

## Scope (propozycja dla `/10x-research` i `/10x-plan`)

| Typ | Kroki | Rysunek | Tryb odpowiedzi (do potwierdzenia w research) |
|---|---|---|---|
| WRITTEN | E5.2 (dodawanie i odejmowanie dwucyfrowych w słupku, do 100), E6.7 (trzycyfrowe z przekroczeniem) | słupek w kodzie wg `written-addition.svg` (cyfry w kolumnach, znak, kreska, przeniesienie małą cyfrą w kółku) + okienka wyniku | nowy tryb „cyfra w okienku” (klawiatura wpisuje cyfry do okienek wyniku) |
| ARROW_TABLE | E2.6 (graf: liczba → „+n”/„−n” → okienko; tabelka z wierszem wejść i regułą; do 20) | strzałki i okienka w kodzie (DESIGN-GAP) | keypad (jedno okienko na zadanie) — research potwierdza, czy tabelka z kilkoma okienkami potrzebuje trybu „cyfra w okienku” |
| SEQUENCE (oś) | E2.7 (`sequence_tens_100`) | oś wg `number-line.svg`, kreski co 10, puste okienko nad szukaną liczbą | keypad (bez zmian) |
| MULT_GROUPS (skoki) | E3.9 (nowa umiejętność „skoki na osi”) | oś + łuki skoków po k (`number-line.svg`) | tiles (jak dwie istniejące) |
| ADD_SUB (podpowiedź) | umiejętności ADD_SUB o małym zakresie (E1–E2, ew. E3 do 30) | oś ze skokami od a o b, w fazie podpowiedzi | bez zmian (rysunek podpowiedzi, nie zadania) |

Poza zakresem: wariant WRITTEN „brakujące cyfry w słupku” (E6) → follow-up (decyzja 5); minigra „Łańcuch strzałek”
(ZADANIA § 5, po v1); ARROW_TABLE z „·3” (mnożenie zaczyna się w E3, a ARROW_TABLE jest tylko w E2.6); nowe
umiejętności SEQUENCE poza E2.7; oś dla ADD_SUB powyżej 30.

## Design source and copy (profile § 6)

- **Kit, który slice wiąże:** `designs/martynka-maths-A-v1/style-guide.md` § „Code-drawn helpers” (kontury 4 px,
  drobne kreski 2 px, kość słoniowa / teal `#245C59` / złoto `#F1CE6B`, akcent skoków `#54BEB4`; „the supplied SVG
  reference is mathematical source”: oś 0–10 i `38 + 27 = 65` z przeniesieniem) i § „Font and spacing” (cele dotyku
  ≥ 96 px, prawdziwe `−`, obliczenia 112 px); `reference/written-addition.svg` (tytuł „Dodawanie pisemne”, cyfry 72 px
  w kolumnach co 82 px, `+` 64 px, kreska 4 px, przeniesienie jako złote kółko r 26 nad kolumną dziesiątek) i
  `helper-metadata.json` `writtenAddition`; `reference/number-line.svg` (tytuł „Oś liczbowa”, oś z grotem, kreski co
  58 px z liczbami 28 px, skoki jako łuki ze strzałką, start i koniec jako złote kropki) i `helper-metadata.json`
  `numberLine`; ekrany `screenshots/task-keypad.png`, `hint-keypad.png`, `solution-step-1.png`, `solution-step-2.png`
  (układ zadania, podpowiedzi i rozwiązania przy klawiaturze).
- **DESIGN-GAP (nowe wiersze `docs/design-gaps.md`, od 88):** okienka cyfr wyniku w słupku, stan aktywnego okienka i
  kolejność wpisywania (kit pokazuje słupek gotowy); przeniesienie wpisywane przez dziecko vs rysowane w rozwiązaniu;
  odejmowanie pisemne z pożyczką (kit ma tylko dodawanie); graf i tabelka strzałkowa ARROW_TABLE (brak widoku);
  oś jako rysunek **podpowiedzi** (kit pokazuje oś samodzielnie, bez miejsca w fazie podpowiedzi przy klawiaturze /
  kafelkach); oś co 10 do 100 i okienko na osi (kit: 0–10 co 1, bez okienka); skoki MULT_GROUPS o k > 1.
- **Klucze tekstów (`src/data/pl.ts`, `pl.tasks.*`):** istniejące, które slice dotyka: `sequence`, `sequenceHint`,
  `multGroupsResultHint`, `multGroupsExprHint`, `multGroupsCountsHint`, `multGroupsExprAnswerHint` (podpowiedź
  ADD_SUB to linie arytmetyczne z `addSubHint`, nie klucz). Nowe: polecenia, podpowiedzi i kroki rozwiązania WRITTEN
  (kolumnami: jedności, dziesiątki, przeniesienie „1 dalej”) i ARROW_TABLE, polecenie wariantu MULT_GROUPS ze skokami;
  `childName` E2.6, E5.2, E6.7 (rozszerzone). Teksty kitu „Dodawanie pisemne” / „Oś liczbowa” to tytuły arkusza
  referencyjnego, nie teksty gry. Teacher read `npm run sample -- E2|E3|E5|E6 --count 6`.

## Migration expected?

**Nie.** Format zapisu zostaje **v2** (`src/core/save.ts` `SAVE_VERSION = 2`, fixtures v1 i v2 nietknięte). Nowe
umiejętności nie mają wpisów w `mastery`/`streak` (= 0); `validateSave` sprawdza kształt, nie listę ID. Skutki bez
migracji: wyższe progi odblokowania E2.6, E3.9, E5.2, E6.7 dla dziecka zapisanego na tych krokach (wolniej, nic nie
ginie). Stan okienek cyfr jest stanem sesji zadania. Co zmieniłoby odpowiedź: potrzeba zapisania przykładu pomyłki
w trybie „cyfra w okienku” w innym kształcie niż liczba (np. tablica cyfr) w widoku postępów rodzica — wtedy v3 z
migracją i zachowaniem SIR-01 (nowszy zapis nie jest nadpisywany).

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| **Oś liczbowa jako podpowiedź** (przeniesiony z S-14). `Trigger: S-14b` | `2026-10-14-art-tasks-all-stages` | **W zakresie** — to część outcome (podpowiedź ADD_SUB); zakres liczb wg decyzji 4. |
| **E1.10 `place_read_12` i E5.5 `capacity_half_l_e5`** (wycięte w S-14 fazie 8: przestrzeń zadań za mała dla inwariantów). `Trigger: S-14b` | `2026-10-14-art-tasks-all-stages` | **Poza zakresem, trigger przenieść przy archiwum**: przyczyną jest przestrzeń zadań (11–12 to dwie liczby; „ile ½ l” do 5), nie brak widżetu z tego slice'a. `place_read_12` → `Trigger: S-14d` (E1, tryb obrazkowy); `capacity_half_l_e5` → `Trigger: S-14c` (miary tekstowo). Co zmieniłoby: research znajduje dla nich sens w osi (np. 11 i 12 na osi) — wtedy jedna umiejętność wchodzi tutaj. |
| O5: `E5.5.capacity_quarter_l` pierwsza podpowiedź klawiatury ma 75 znaków (jedyny wpis `LONG_KEYPAD_HINTS` w `tests/contentInvariants.test.ts`). `Trigger: S-14b or the next content change to CAPACITY` | `2026-10-14-drawn-grid-tasks-e3-e4` | **W zakresie (tanie)** — skrócić tekst podpowiedzi w danych do ≤ 64 znaków i usunąć wpis z `LONG_KEYPAD_HINTS` (test chroni). Slice i tak dotyka E5 i inwariantów podpowiedzi; teacher read E5. |
| **Wspólny `ArtPool`/`fitRect`**; S14-09/S14-10 (klucz spoza `TASK_ART` ma proporcje 1:1, `images[i]?.show` gubi elementy ponad pulę). `Trigger: S-14b or the next widget built on ArtImage` | `2026-10-14-art-tasks-all-stages`, `2026-10-14-art-stand-in-and-load-signal` | **Nie wyzwolony co do treści** — słupek, graf i oś są rysowane w kodzie, bez `ArtImage`; trigger formalnie nazywa S-14b, więc przy archiwum przenieść na „the next widget built on ArtImage” (S-14d `Wallet`). Co zmieniłoby: MULT_GROUPS ze skokami rysuje ikony na osi przez `ArtImage`. |
| O6 / O2 (rysunek w pasku rozwiązania 190 px przy klawiaturze, `TASK_LAYOUT.picture.keypadSolution`). `Trigger: next change to pictureLayout / the solution layout beside the keypad` | `2026-10-14-drawn-grid-tasks-e3-e4`, `2026-10-14-art-tasks-all-stages` | **Wyzwolony warunkowo** — słupek WRITTEN i oś w podpowiedzi to rysunki przy klawiaturze w fazie podpowiedzi/rozwiązania; plan rozstrzyga, czy mieszczą się w 190 px (cyfry słupka ≥ czytelne), inaczej zmiana `keypadSolution`. |

Inne follow-upy z `Trigger` nazywającym `TaskScene`/`pictureLayout`/nowy tryb (np. S-13b „`pointerupoutside` jako
`cancel`”, `adaptive.spec` blisko limitu 180 s) research sprawdza po kodzie; nie nazywają S-14b.

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Odrzucone: `/10x-plan` (domyślne w skillu), `/10x-frame`.
   Dlaczego: polecenie kroku ustala `/10x-research number-line-written-arrows`; są realne niewiadome (kształt trybu
   „cyfra w okienku”, rysunek podpowiedzi jako nowe pojęcie, miejsce przy klawiaturze 190 px). Co zmieniłoby
   odpowiedź: nic w tym runie (polecenie kroku nadpisuje rekomendację skilla).
2. **„Cyfra w okienku” jako nowa wartość `AnswerMode`, nie gałąź `keypad`.** Odrzucone: klawiatura wpisująca cały
   wynik obok statycznego słupka (gubi „okienka cyfr” z ZADANIA § 4 i nie uczy kolumn); gałąź `drag`. Dlaczego:
   roadmapa i kontrakt nazywają to nowym trybem; osobna wartość trzyma `canonicalInput`/`solvableInMode`/hook e2e
   jawnie (lekcja S-13b: tryb rozgałęziony po cichu dał klockom zadanie zegara, S13-04). Odpowiedź zadania pozostaje
   liczbą (wynik), więc maszyna stanów `round.ts` porównuje jak dziś. Co zmieniłoby odpowiedź: research pokaże, że
   klawiatura z fokusem okienka mieści się w `keypad` bez nowego stanu w `round/view.ts`.
3. **Kolejność okienek: od jedności w lewo, przeniesienie rysowane w podpowiedzi/rozwiązaniu, nie wpisywane.**
   Odrzucone: wpisywanie przeniesienia przez dziecko jako osobne okienko. Dlaczego: kit rysuje przeniesienie jako
   gotowe kółko; osobne okienko podwaja dotknięcia i zmienia odpowiedź w tablicę (presja na zapis). Co zmieniłoby
   odpowiedź: teacher read mówi, że bez wpisania przeniesienia zadanie nie uczy metody — wtedy okienko przeniesienia
   jako część trybu, odpowiedź nadal liczbą.
4. **Oś jako podpowiedź tylko dla ADD_SUB o wyniku ≤ 30 (E1–E3), jako osobny rysunek podpowiedzi, `task.visual`
   ADD_SUB bez zmian.** Odrzucone: oś dla wszystkich ADD_SUB (do 1000 — kreski nieczytelne na 1024 px); oś jako
   `task.visual` od początku zadania (zadanie wypadłoby z minigry „Hasło z wyników”, a rysunek podpowiadałby przed
   pierwszą próbą). Dlaczego: ZADANIA § 1 stawia oś jako podpowiedź po błędzie; kit ma oś 0–10. Co zmieniłoby
   odpowiedź: research pokaże czytelną oś z przerwą/wycinkiem (np. 30–50) dla E4–E5 albo teacher read odrzuci oś
   w E3.
5. **WRITTEN bez wariantu „brakujące cyfry w słupku” (E6).** Odrzucone: oba warianty teraz. Dlaczego: brakujące cyfry
   w wierszach składników to inne pozycje okienek i inna logika sprawdzania; slice ma już trzy nowe rysunki, nowy tryb
   i nowe pojęcie rysunku podpowiedzi. Follow-up przy archiwum z `Trigger: S-14c or the next change to WRITTEN`. Co
   zmieniłoby odpowiedź: research pokaże, że tryb „cyfra w okienku” obsługuje dowolny zbiór okienek bez dodatkowego
   kodu — wtedy wariant wchodzi do E6.7.
6. **Oś dla SEQUENCE tylko w istniejącym `E2.7.sequence_tens_100`; MULT_GROUPS dostaje nową umiejętność „skoki na
   osi” w E3.9.** Odrzucone: nowe umiejętności SEQUENCE w E1/E3–E6 (ZADANIA opisuje zakresy, ale kroki z sekcji 3 nie
   mają SEQUENCE poza E2.7 — to sprawa pełnego zestawu typów, S-14c/S-14d); zamiana rysunku `icons` w dwóch
   istniejących MULT_GROUPS (gubi grupy ikon, które już działają). Dlaczego: outcome mówi „rysunek SEQUENCE/MULT_GROUPS”,
   a ZADANIA § 4 MULT_GROUPS wymienia „skoki na osi” jako formę obok obrazka. Co zmieniłoby odpowiedź: teacher read
   uzna oś przy E2.7 za zbędną (kroki co 10 już w poleceniu) — wtedy oś tylko w MULT_GROUPS i podpowiedzi.
7. **ARROW_TABLE: graf (jedno wejście, jedna strzałka, jedno okienko) i tabelka (wiersz wejść, jedna reguła, jedno
   puste pole) na `keypad`; łańcuch dwóch strzałek jako trzeci wariant, jeśli mieści się w polu rysunku.** Odrzucone:
   tabelka z kilkoma pustymi polami naraz (wymagałaby trybu „cyfra w okienku” dla wielu liczb). Dlaczego: jedno okienko
   = jedna odpowiedź liczbowa, istniejąca maszyna stanów i helpery e2e. Co zmieniłoby odpowiedź: research pokaże, że
   tryb z decyzji 2 obsługuje kilka okienek liczbowych tanio — wtedy tabelka z 2–3 pustymi polami.
