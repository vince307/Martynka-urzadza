# Follow-ups z S-14 art-tasks-all-stages

- **MONEY_PAY + `Wallet` + uogólniony `blockDrag`** (płacenie monetami przeciąganiem do portfela). `Trigger: S-14d`
- **Warianty tekstowe MASS i LENGTH** (porównania cięższe/lżejsze, gramy, tona, kwintal) oraz **PLACE_VALUE od 1000**. `Trigger: S-14c`
- **Oś liczbowa jako podpowiedź** (przeniesiony z S-14). `Trigger: S-14b`
- **E1.10 `place_read_12` i E5.5 `capacity_half_l_e5`** (wycięte w fazie 8: przestrzeń zadań za mała; patrz handoff § 6). `Trigger: S-14b`
- **Podświetlenie rysunku** podczas podpowiedzi (np. szalki, monety). `Trigger: S-16 or a teacher read asking for it`
- **Diagram O2** (wykres obok klawiatury w fazie rozwiązania). `Trigger: a teacher read or visual gate finding the chart unreadable beside the keypad`
- **Banknoty 200 i 500 zł** są w paczce i w `TASK_ART`, ale żadna umiejętność ich nie używa. `Trigger: S-14c or a money skill above 100 zł`
- **Atlas tekstur** zamiast osobnych plików WebP. `Trigger: S-16`
- **`check:deploy` dla assetów** (sprawdzenie, że obrazy zadań są w precache i odpowiadają 200). `Trigger: a production report of a missing task image`
- **Termometr bez znaków poniżej zera w E3-E5**: rama przycięta do 0…+30 (wiersz 64 w design-gaps). `Trigger: S-16`
- **Zamknięte w S-14**: „three Rect types”, diagram O2 dla termometru.

## Z przeglądu implementacji (2026-10-14)

- **ZAMKNIĘTE w bramce wizualnej S-14 (V1, `TASK_LAYOUT.picture.tall`, `answerSpans`)** — **Termometr przy kafelkach ma ok. 3 px na stopień** (`src/core/round/pictureLayout.ts` `pictureLayout`, `src/core/tasks/visual.ts` `visualShape`: „obok” tylko przy klawiaturze; E3.11 `temperature_read_30` i E6.1 `temperature_negative` dostają prostokąt kafelków 294 px wysokości, dystraktory ±2 °C co 6 px). Wysoki prostokąt dla `tall` także przy kafelkach albo większy krok/węższy zakres. `Trigger: visual gate S-14 (zrzut termometru z kafelkami nieczytelny) or a teacher read on the tablet`
- **Wspólny `ArtPool` i `fitRect`** zamiast powtórzonych `area`/`bounds`/`setVisible`/`shown`/`art` w `MoneyTable`, `BalanceScale`, `Jugs`, `IconGroups`, `Thermometer` i dopasowania proporcji w `ArtImage.show` oraz `artLayout` (`thermometerLayout`, `scaleLayout`, `jugsLayout`). `Trigger: S-14b or the next widget built on ArtImage`
- **`bounds()` nowych widżetów zwraca prostokąt także po ukryciu** (nikt go nie czyta; `TaskPicture.bounds` bramkuje przez `shown()`). Usunąć albo bramkować. `Trigger: the same as ArtPool`
- **`allowNegative` zdejmuje dolną granicę dla całego typu TEMPERATURE** (`src/core/tasks/validate.ts` `NEGATIVE_TYPES`, `src/core/tasks/bounds.ts` `validationBounds`): także E5.4 (tylko dodatnie), a −1000 przeszłoby. Przekazać `min` (`params.low`). `Trigger: a second type in NEGATIVE_TYPES or a temperature range wider than −30..30`
- **Linie podpowiedzi z jednostkami czytane surowo** (`src/core/narration/spoken.ts` `spokenText` nie rozwija „°C”, „zł”, „gr” w podpowiedziach; prompty mają `speak` i są poprawne; `src/core/text/measure.ts` `spokenCelsius` ma „minus” wpisane zamiast `pl.speech.minus`). `Trigger: S-16 or a narrator check on the tablet`
- **`BootScene.preload` `loaderror`**: słuchacz `on` dla całego loadera (komunikat „Task art failed” także dla fontu), jedyny sygnał to konsola. `Trigger: a production report of a missing task image`
- **Masy na wadze do odczytu nauczyciela**: `SCALE_ITEMS` (`src/data/measures.ts`) daje „filiżanka waży 50 dag”, „jabłko 30 dag”, „kłębek 40 dag”. `Trigger: [human] 9.8 text acceptance`

## Z bramki wizualnej (2026-10-14, `reviews/visual-review.md`)

- **O1: rysunek w fazie rozwiązania przy klawiaturze ma 190 px** (`TASK_LAYOUT.picture.keypadSolution`): odważniki na wadze znów nieczytelne, monety i dzbanki małe. Tak jak S-13 O2 (wykres). `Trigger: a teacher read or a tablet check finding the scale unreadable in the solution`
- **O2: termometr przy klawiaturze** (`TASK_LAYOUT.picture.tall.keypad`, 240 × 540 od y 420 pod dwu-/trzywierszowym poleceniem) daje ok. 3 px CSS na stopień na tablecie; polecenie obok kolumny zwolniłoby ok. 90 px wysokości. `Trigger: [human] 9.9 tablet check or a teacher read of E5.4 on the iPad`
- **O3: kafelki obok termometru stoją nisko**, nad nimi pusto (polecenie jednowierszowe). Kosmetyka. `Trigger: S-16 polish`
- **O4: `E1.2.count_5` losuje też 1 ikonę** (dwa razy w bramce); rozważyć min 2 dla obrazka. `Trigger: [human] 9.8 text acceptance or a teacher read of E1.2`
