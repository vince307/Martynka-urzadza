---
change_id: narrator-round-summary
title: Lektor poleceń i podsumowanie rundy z „Kolejna runda” i „Do pokoju”
status: impl_reviewed
created: 2026-10-12
updated: 2026-10-13
archived_at: null
---

## Notes

S-05 z roadmapy (zamyka etap M2): dziecko odsłuchuje polecenie polskim lektorem (przycisk głośnika; automatyczne
czytanie jako ustawienie z domyślną wartością zależną od etapu: włączone E1–E2, wyłączone od E3; bez polskiego głosu
przycisk ukryty, brak głosu nie blokuje żadnego przepływu), a po rundzie widzi podsumowanie z gwiazdkami i wybiera
„Kolejna runda” lub „Do pokoju” (wyróżnione, gdy stać na bieżące zadanie remontowe). „Do pokoju” prowadzi na razie do
pustej sceny pokoju (pokój wchodzi w M4). Lektor to Web Speech API (`speechSynthesis`, głos `pl-PL`) — globale
przeglądarki, więc mowa żyje poza `src/core/` (granica ESLint); w `core` tylko czyste reguły (tekst do odczytu,
domyślne `autoRead` dla etapu, wybór głosu z listy danych, widok podsumowania).

Źródła: `context/foundation/roadmap.md` (`### S-05`, Backlog Handoff S-05, Open Question 7),
`context/foundation/prd.md` (FR-009, FR-010, FR-011, NFR: „Lektor działa tam, gdzie urządzenie ma polski głos; brak
głosu nie blokuje żadnego przepływu”, „w pełni grywalna bez dźwięku; żadna informacja wyłącznie dźwiękiem”,
cele ≥ 96 px; Open Questions 7), `Martynka-urzadza.md` §1, §3 (Web Speech API), §6 (głośnik, `settings.autoRead`,
koniec rundy), §11 (M2); `context/foundation/test-plan.md` ryzyko #11 i „Narrator voice quality”;
archiwum S-04 `context/archive/2026-10-12-task-round-stars/` (plan, follow-ups, reviews), `docs/design-gaps.md`.
Wzorce: `context/archive/2026-10-12-task-round-stars/change.md`,
`context/archive/2026-10-12-generators-remaining-stages/`. Plik `lessons.md` w `context/foundation/` nie istnieje.

## Roadmap claims vs repo now

Stan sprawdzony na `feat/narrator-round-summary` @ `8467431` (= `main`, po merge'u S-04, PR #20).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-04 | S-04 `done` (archiwum `2026-10-12-task-round-stars`, PR #20). Jest `src/core/round.ts` (`startRound`, `answer`, `nextSolutionStep`, `next`; `RoundState.finished`, `bonusEarned`), `src/core/round/view.ts` (`roundView`, `bar.kind === 'roundEnd'`, `switchVisible: false`), `src/scenes/TaskScene.ts`, `src/scenes/UIScene.ts` (tylko `StarCounter`, `input.enabled = false`), `src/data/balance.ts` (`round`, `defaultStage: 'E3'`, `keypad`, `tiles`). | Brak korekty. |
| „po rundzie widzi podsumowanie z gwiazdkami” | Dziś koniec rundy to zielony pasek `FeedbackBar` z `pl.round.bonus` („Runda bez błędu! +2 ★”) i „Dalej”, które w `TaskScene.advance` od razu losuje nową rundę (`freshRound`). DESIGN-GAP wiersz 5 w `docs/design-gaps.md` mówi wprost, że to tymczasowe do S-05. | Podsumowanie zastępuje pasek `roundEnd` i wiersz 5 (usunąć wiersz albo przepisać na lukę kitu „bonus w podsumowaniu”, patrz niżej). Hak e2e i spec ryzyka #11 (`tests/e2e/task-round.spec.ts`, „Dalej” po bonusie) trzeba przestawić na przycisk podsumowania. |
| „Kolejna runda” i „Do pokoju” | Brak tych kluczy w `src/data/pl.ts` (jest `round.correct` = „Brawo!”). Brak sceny pokoju: `SCENE_KEYS` w `src/data/layout.ts` = `boot`, `task`, `ui`; `src/main.ts` rejestruje `BootScene`, `TaskScene`, `UIScene`. | Slice dodaje klucze z kitu do `pl.ts` i pustą scenę pokoju (placeholder rysowany w kodzie) z powrotem do zadań. |
| „Do pokoju” „wyróżnione, gdy stać na mebel” | Brak cen: `RoomDef`/`RoomTaskDef.cost` istnieją tylko jako typy w `src/core/types.ts`; brak `src/data/rooms*`; `balance.ts` nie ma kosztów; plan §6 podaje tylko zakres 5–15 gwiazdek. Gwiazdki żyją w pamięci sesji (`TaskScene.sessionStars`, rejestr `REGISTRY_KEYS.stars`), zapis to S-11. | Patrz Autonomous decisions 2: czysta reguła w `core` (`costOfNextRoomTask: number \| null` → wyróżnienie, gdy `stars ≥ cost`), dziś `null` (brak pokoju) ⇒ „Do pokoju” zwykłe; dane kosztów i podpięcie w S-09. |
| „automatyczne czytanie jako ustawienie z domyślną wartością zależną od etapu” | `Settings.autoRead` jest tylko typem w `src/core/types.ts` (`SaveState.settings`); nie ma zapisu ani ekranu rodzica (S-08, S-11). Etap jest stały: `balance.defaultStage = 'E3'` (placement to S-06) ⇒ domyślnie wyłączone. | Domyślna wartość jako czysta funkcja etapu w `core` (progi E1–E2 jako dane), trzymana w pamięci sesji; przełącznik dla rodzica w S-08, trwałość w S-11. Bez S-06 na produkcji zawsze E3 ⇒ auto-czytanie wyłączone, widoczny tylko przycisk głośnika. |
| „odsłuchuje polecenie polskim lektorem” | Brak jakiegokolwiek kodu mowy. `Task.speak?` istnieje w `src/core/tasks/types.ts` (ZADANIA §7), ustawia go tylko `generateMissing` (`src/core/tasks/generators/missing.ts`); `validateTask` sprawdza `speak` jak `prompt`. Polecenia „gołe” to działania z symbolami `−` (U+2212), `·`, `:`, `□`, liczby grupowane twardą spacją (`formatNumber`, NBSP) — syntezator może je czytać źle albo wcale. ESLint: `src/core/**` ma `no-restricted-globals` (`window`, `document`, `navigator`, `localStorage`); globale przeglądarki dozwolone tylko w `src/scenes/**`, `src/pwa/**`, `src/ui/**`, `src/testing/**`, `src/main.ts`. | Mowa w `src/ui/` (np. moduł lektora; nowy katalog poza tą listą wymagałby zmiany `eslint.config.mjs` i `tests/lint-boundaries.test.ts`). W `core`: tekst do odczytu (`task.speak ?? prompt` z zamianą symboli na słowa: „minus”, „razy”, „podzielić przez”, „ile”) — słowa w `pl.ts`, więc czytanie nauczycielskie. |
| „bez polskiego głosu przycisk ukryty” | Kit (`preview.js` `speak`) robi inaczej: bez polskiego głosu pokazuje w pasku „Poproś dorosłego o przeczytanie zadania.”. | PRD FR-009 i plan §6 wygrywają (przycisk ukryty); rozbieżność do `docs/design-gaps.md`. Wykrycie głosu jest asynchroniczne (`getVoices()` bywa puste do `voiceschanged`) — pytanie do research. |
| Unknown: jakość polskiego głosu na tabletach (PRD OQ 7) | Nie da się sprawdzić w repo ani w headless Chromium (brak głosów systemowych). | Zostaje `[human]` wierszem: odsłuch na iPadzie (Safari) i tablecie z Androidem (Chrome); przepływ musi działać bez głosu (testowalne: przycisk ukryty, runda grywalna). |
| „zamyka etap M2” (Risk) | M2 w planie §11 obejmuje też „przełącznik ukryty w trakcie zadania” w `UIScene`; dziś nie jest rysowany (DESIGN-GAP wiersz 4, `roundView.switchVisible` zawsze `false`). | Patrz follow-upy niżej i Autonomous decisions 3. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §6 (wiąże przy konflikcie), `designs/martynka-maths-A-v1/style-guide.md`
(„Five progress dots… Summary uses „Brawo!”, earned stars, „Kolejna runda” and „Do pokoju””; „The speaker reads the
task or hint with the same calm pace”), `preview.html`/`preview.js`/`screen.css`/`maths.css`.

- **Widoki kitu wiązane przez ten slice:** `screenshots/summary.png` (notes, „Brawo!”, rząd 5 gwiazdek, „★ +5”,
  przyciski „Kolejna runda” — główny turkusowy, „Do pokoju” — drugorzędny kremowy; CSS `.page-title`,
  `.summary-star-row`, `.earned`, `.page-buttons`, `.page-button`, `.page-button.secondary`, 450×128 px, 46 px);
  przycisk głośnika w pasku HUD na `task-keypad.png`/`task-tiles.png` (prawy górny róg, przed licznikiem gwiazdek,
  `.speaker` 104 px szer., ikona `speakerSVG` w `preview.js`); widok pokoju z `preview.js` (`room-view`:
  `.return-note` z gwiazdkami, `.resume` „Wróć do notesu”, 480×116 px) — bez tła pokoju (sztuka w S-09/S-16).
  Opcjonalnie (decyzja 3): przycisk HUD „Do pokoju” z ikoną domu (`.room-button` 316 px, lewy górny róg).
- **Nie w tym slice:** `welcome.png` (S-06), `unlock.png` (S-07), `contact-*.png`, `overview.png`.
- **Klucze tekstów z kitu do `src/data/pl.ts`:** „Brawo!” (jest `round.correct`), „Kolejna runda”, „Do pokoju”,
  „Wróć do notesu”, etykieta głośnika „Przeczytaj zadanie” (aria w kicie; w canvasie niewidoczna — do rozważenia
  w research, czy w ogóle potrzebna). Nowe słowa lektora (symbole działań czytane słownie) nie są z kitu → teacher read.
- **Kandydaci na DESIGN-GAP** (komentarz `DESIGN-GAP` w kodzie + wiersz `docs/design-gaps.md`):
  (a) wyróżniony stan „Do pokoju” — kit pokazuje tylko wariant drugorzędny; (b) bonus za czystą rundę w podsumowaniu —
  kit ma tylko „★ +N” (czy +N to suma z bonusem, czy osobna linia); (c) znaczenie rzędu 5 gwiazdek przy zadaniach
  bez gwiazdki (przepisanie wyniku) — kit pokazuje zawsze 5 pełnych; (d) brak polskiego głosu — kit prosi dorosłego,
  plan ukrywa przycisk; (e) pusta scena pokoju bez sztuki pokoju; (f) wiersz 5 (pasek końca rundy) zamknięty przez
  podsumowanie, wiersz 4 (przełącznik w HUD) zależny od decyzji 3.

## Migration

Nie przewiduję migracji. Profil §4: brak bazy danych; format zapisu i migracje (`src/core/save.ts`) wchodzą z S-11.
`autoRead` i gwiazdki to stan w pamięci sesji; `Settings.autoRead` w zapisie pojawi się dopiero z S-11 (S-08 doda
przełącznik rodzica).

## Triggered follow-ups (Trigger: S-05)

Z `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` (inne archiwa nie mają `Trigger: S-05`):

| Follow-up | Trigger | Moje zdanie o zakresie |
|---|---|---|
| Przełącznik zadania/pokój między zadaniami (FR-011): `roundView.switchVisible` gotowe, nic nie rysowane (design-gaps wiersz 4) | S-05 or S-09, whichever draws the first room entry | **W zakresie, ale jako ostatnia, odcinalna faza** (decyzja 3). S-05 rysuje pierwsze wejście do pokoju (podsumowanie), a scena pokoju i tak powstaje; przycisk HUD „Do pokoju” widoczny tylko między zadaniami, powrót wznawia rundę (scena zadań uśpiona, nie restartowana). |
| `tests/e2e/task-round.spec.ts`: `counter` czyta wartość z rejestru, nie rysowaną liczbę (`StarCounter.value`, nieużywane) | S-05 (round summary touches the counter) | **W zakresie.** Podsumowanie i tak zmienia koniec specu #11; wystawić rysowaną wartość licznika (i liczbę z podsumowania) przez hak tylko do odczytu i asercja na niej; albo usunąć `value`. |
| `pl.title` i gołe liczby animacji/obrysu w widżetach (`lineStyle(3/4)`, `shakeMs / 6`) | S-05 (Welcome/summary screens use the title) | **Poza zakresem, przenieść na S-06.** Podsumowanie w kicie nie używa tytułu gry („Brawo!” to `round.correct`); Welcome (S-06) go używa. Nowe widżety S-05 nie dokładają gołych liczb (tokeny w `src/data/layout.ts`). |
| Kropki kroków rozwiązania (`roundView` `bar.kind === 'solution'` + widżet w `src/ui/widgets/SolutionSteps.ts`) | S-05 or the next change to `SolutionSteps` | **Poza zakresem, odłożone.** Nie należy do wyniku S-05 (FR-009/FR-010) ani nie dotyka podsumowania; S-05 ma już trzy nowe elementy UI (głośnik, podsumowanie, scena pokoju). Wyzwalacz zostaje „next change to `SolutionSteps`” + S-17. Zmieniłoby to: plan S-05 zmieni `SolutionSteps` (np. lektor czyta kroki rozwiązania) — wtedy kropki w tej samej fazie. |

Pozostałe wpisy `Trigger:` (S-13, S-17, S-16, `/10x-test-plan refresh`, iPad check, następna zmiana `flyStar`/
`hints.test.ts`) — poza zakresem.

## Autonomous decisions

1. **Lektor: Web Speech API w module w `src/ui/` (np. `src/ui/narrator.ts`), czyste reguły w `core`.**
   - Wybrane: `core` daje tekst do odczytu (z `Task.speak ?? prompt`, z symbolami zamienionymi na słowa z `pl.ts`;
     w fazie podpowiedzi/rozwiązania — linia z paska, zgodnie z kitem „reads the task or hint”), domyślne `autoRead`
     dla etapu (próg w danych) i wybór głosu z listy `{ lang, name }` (czysta funkcja). Moduł UI owija
     `speechSynthesis` (wykrycie głosu, `cancel` przed nowym poleceniem, tempo z danych), scena tylko pokazuje/ukrywa
     przycisk i przekazuje stuknięcie. Auto-czytanie po pokazaniu nowego zadania, gdy `autoRead` i głos jest.
   - Odrzucone: (a) nagrania audio (plan §3 wybiera syntezę; kit nie ma nagrań); (b) logika mowy w scenie (scena nie
     decyduje); (c) nowy katalog `src/audio/` (wymaga zmiany granic ESLint i testu granic bez zysku).
   - Dlaczego: granica ESLint `src/core/**` bez globali przeglądarki; reguły testowalne w vitest; PRD NFR: brak głosu
     nie blokuje przepływu, więc moduł musi łagodnie zwracać „brak głosu”.
   - Co zmieniłoby odpowiedź: research pokaże, że iOS Safari blokuje `speak()` bez gestu użytkownika tak, że
     auto-czytanie pierwszego zadania nie działa — wtedy auto-czytanie startuje od pierwszego stuknięcia
     (np. „Kolejna runda”) i jest to zapisane jako znane ograniczenie; albo że jakość głosu wymaga nagrań (S-16).
2. **„Do pokoju” wyróżnione, gdy stać na mebel: reguła w `core` teraz, dane kosztów w S-09.**
   - Wybrane: widok podsumowania w `core` przyjmuje `nextRoomTaskCost: number | null` i zwraca `roomHighlighted =
     cost !== null && stars >= cost`; dziś scena podaje `null` (brak pokoju) ⇒ „Do pokoju” w wariancie drugorzędnym
     z kitu. Wariant wyróżniony (tokeny) narysowany i pokazany w teście/zrzucie przez widok (DESIGN-GAP a), ale
     w produkcji nieosiągalny do S-09. Follow-up `Trigger: S-09`: podpiąć koszt bieżącego zadania remontowego.
   - Odrzucone: (a) tymczasowy koszt w `balance.ts` (wymyślona liczba balansu, której właściwe miejsce to dane pokoju
     w S-09; wyróżnienie bez celu w pustym pokoju myliłoby dziecko); (b) całkowite odłożenie wyróżnienia do S-09
     (FR-010 jest w PRD refs S-05; reguła jest tania i testowalna teraz).
   - Dlaczego: FR-010 mówi o „bieżącym zadaniu remontowym”, którego jeszcze nie ma; reguła + wiersz `[human]` w planie
     nazywający odłożenie danych spełnia slice bez wymyślania balansu.
   - Co zmieniłoby odpowiedź: opiekun chce widzieć wyróżnienie już w S-05 — wtedy `balance.room.firstTaskCost`
     (np. 10, środek zakresu 5–15 z planu §6) jako jawnie tymczasowe dane, usuwane w S-09.
3. **„Do pokoju” prowadzi do pustej sceny pokoju (`RoomScene`, placeholder rysowany w kodzie: tło, licznik gwiazdek,
   „Wróć do notesu”); z podsumowania powrót startuje nową rundę. Przycisk HUD „Do pokoju” między zadaniami (FR-011,
   follow-up) jako ostatnia faza kodu, z powrotem wznawiającym tę samą rundę.**
   - Odrzucone: (a) „Do pokoju” bez celu albo ukryte do S-09 (FR-010 wymaga wyboru); (b) restart `TaskScene` przy
     powrocie z HUD (gubi rundę w trakcie).
   - Dlaczego: roadmap Risk wprost: „Do pokoju” prowadzi na razie do pustej sceny pokoju; kit ma widok powrotu
     („Wróć do notesu”). Przełącznik HUD zamyka follow-up i wiersz 4 design-gaps tanio, skoro scena istnieje.
   - Co zmieniłoby odpowiedź: plan przekroczy rozsądny rozmiar (więcej niż ~6 faz kodu) — wtedy przycisk HUD wraca do
     S-09 z nowym follow-upem; albo research pokaże, że sleep/wake sceny z równoległą `UIScene` w Phaser 4 psuje stan.
4. **Podsumowanie zastępuje pasek `roundEnd`: „Brawo!”, gwiazdki rundy (bonus wliczony w „+N”), dwa przyciski.**
   - Wybrane: liczba „+N” = `starsEarned` (z bonusem), bonus pokazany osobno tylko wtedy, gdy research/plan uzna, że
     kit tego potrzebuje (DESIGN-GAP b); rząd gwiazdek odzwierciedla wynik zadań (pełna = gwiazdka zdobyta) —
     do potwierdzenia w planie (DESIGN-GAP c).
   - Odrzucone: zostawienie paska z bonusem przed podsumowaniem (dwa ekrany końca rundy).
   - Dlaczego: kit `summary.png` jest jedynym ekranem końca rundy; FR-010 „podsumowanie z liczbą gwiazdek”.
   - Co zmieniłoby odpowiedź: teacher/visual read uzna, że dziecko nie zauważy bonusu bez osobnej linii — wtedy linia
     `pl.round.bonus` zostaje w podsumowaniu.
5. **`autoRead` w pamięci sesji z domyślną wartością od etapu; bez przełącznika rodzica w S-05.**
   - Odrzucone: przełącznik w S-05 (bramka rodzica i ustawienia to S-06/S-08).
   - Dlaczego: PRD FR-009 robi z tego ustawienie rodzica; FR-015 (S-08) jest jego ekranem. Etap E3 ⇒ wyłączone,
     więc na produkcji działa przycisk; auto-czytanie sprawdzalne testem jednostkowym i w buildzie e2e.
   - Co zmieniłoby odpowiedź: research pokaże, że bez sposobu włączenia auto-czytania nie da się go zweryfikować
     poza testami — wtedy wyłącznie hak e2e (tylko odczyt) albo parametr w buildzie e2e, nigdy w produkcji.
6. **Następny krok to `/10x-research narrator-round-summary`, nie `/10x-plan`** (skill domyślnie proponuje plan).
   - Dlaczego: prompt kroku tak narzuca; poza tym są otwarte pytania wymagające eksploracji (niżej).
   - Co zmieniłoby odpowiedź: nic w tym kroku — kolejność łańcucha ustala orkiestrator.
7. **Schowek pominięty** (`pbcopy` w sesji bez interakcji nie ma odbiorcy); polecenie jest w `handoff.md` §4.

## Open questions for /10x-research

- Web Speech API na docelowych przeglądarkach: asynchroniczne `getVoices()`/`voiceschanged` (Chrome), wymóg gestu
  użytkownika przed pierwszym `speak()` (iOS Safari), `cancel()` przy zmianie zadania/sceny, `lang: 'pl-PL'` vs
  `pl_PL`, zachowanie offline (głosy sieciowe Google w Chrome), tempo (kit `rate .85`). Jak to testować w vitest
  (atrapa `speechSynthesis` w module UI wstrzykiwana do testu) i w Playwright (headless Chromium bez głosów ⇒ przycisk
  ukryty; czy da się podstawić atrapę głosu tylko w buildzie e2e).
- Co czyta lektor: polecenie słowne vs „gołe” działanie (kit: „Oblicz. 38 plus 27”), `Task.speak`, zamiana `−`,
  `·`, `:`, `□`, `<`/`>`/`=`, NBSP w liczbach, rzymskie liczby (`ROMAN` — czytać litery?), podpowiedź/krok
  rozwiązania; które typy potrzebują własnego `speak` w generatorze (zmiana generatorów ⇒ teacher read).
- Gdzie przycisk głośnika: `UIScene` (HUD, jak kit) czy `TaskScene`; `UIScene` ma dziś `input.enabled = false`.
- Podsumowanie: osobna scena czy warstwa w `TaskScene`; przejścia Phaser 4 (`scene.start`/`sleep`/`wake`) między
  zadaniami, podsumowaniem i pokojem; co dzieje się z `UIScene` (licznik zawsze widoczny, FR-011).
- Hak e2e (tylko odczyt): stan podsumowania, cele przycisków, rysowana wartość licznika (follow-up), widoczność
  głośnika; aktualizacja specu ryzyka #11 i ewentualny nowy spec (koniec rundy → pokój → powrót).
- Tokeny i układ podsumowania/pokoju/głośnika z `maths.css`/`screen.css` do `src/data/layout.ts`; ikona głośnika
  i domu rysowana w kodzie (placeholder).
