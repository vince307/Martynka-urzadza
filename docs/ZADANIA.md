# ZADANIA.md — „Martynka urządza”: katalog zadań matematycznych

Zadania matematyczne zastępują planszę merge: to za nie dziecko dostaje gwiazdki, które wydaje na urządzanie pokoi.

Źródło: analiza 12 flipbooków Nowej Ery dla klas 1–3 („Nowy Elementarz Odkrywców” i „Elementarz Odkrywców”, podręczniki i ćwiczenia, ok. 1050 stron). W grze **nie kopiujemy zadań z książek**. Katalog opisuje typy zadań, zakresy liczb i kolejność wprowadzania materiału, a gra generuje własne, analogiczne zadania. Szczegółowe notatki z każdej książki (strony, częstość, przykłady) są w folderze `docs/zrodla/`.

---

## 1. Jak to działa w grze

### Wybór poziomu na starcie
1. Pierwsze uruchomienie: „Ile masz lat?” (duże przyciski 6, 7, 8, 9, 10).
2. Gra proponuje etap na podstawie wieku i bieżącego miesiąca (tabela niżej). Rodzic może go zmienić w ukrytych ustawieniach.
3. Krótka runda rozgrzewkowa (6 zadań z bieżącego i poprzedniego etapu) koryguje start: dużo błędów → etap niżej, komplet → zostajemy.

| Wiek | Wrzesień–styczeń | Luty–czerwiec | Lipiec–sierpień |
|---|---|---|---|
| 6 lat | E1 (tryb z obrazkami) | E1 | E1 |
| 7 lat | E1 | E2 | E2 |
| 8 lat | E3 | E4 | E4 |
| 9 lat | E5 | E6 | E6 |
| 10+ | E6 | E6 | E6 |

Wiek to tylko przybliżenie (dzieci idą do szkoły w roku, w którym kończą 7 lat), dlatego ustawienie rodzica ma pierwszeństwo.

### Etapy

| Etap | Odpowiada | Książki |
|---|---|---|
| E1 | klasa 1, I półrocze | podręcznik + ćwiczenia kl. 1 cz. 1 |
| E2 | klasa 1, II półrocze | podręcznik + ćwiczenia kl. 1 cz. 2 |
| E3 | klasa 2, I półrocze | podręcznik + ćwiczenia kl. 2 cz. 1 |
| E4 | klasa 2, II półrocze | podręcznik + ćwiczenia kl. 2 cz. 2 |
| E5 | klasa 3, I półrocze | podręcznik + ćwiczenia kl. 3 cz. 1 |
| E6 | klasa 3, II półrocze | podręcznik + ćwiczenia kl. 3 cz. 2 |

Każdy etap dzieli się na **kroki** (kolejność z podręcznika, sekcja 3). Gra losuje zadania z odblokowanych kroków, z wagą: ~60% bieżący krok, ~30% wcześniejsze kroki tego etapu, ~10% powtórka z poprzedniego etapu.

### Runda zadań (zamiast zamówień z planszy merge)
- Runda = 5 zadań. Po każdej poprawnej odpowiedzi animacja gwiazdki.
- Nagroda: 1 gwiazdka za każde poprawne zadanie, +2 za rundę bez błędu.
- Zła odpowiedź: delikatna podpowiedź (obrazek, oś liczbowa, rozbicie działania) i druga próba. Za drugą próbę 1 gwiazdka i tak, żeby dziecko nie zniechęcało się. Po drugiej pomyłce gra pokazuje rozwiązanie krok po kroku i przechodzi dalej.
- Nigdy nie odbieramy gwiazdek i nie ma limitu czasu (poza opcjonalną minigrą „na czas”).

### Adaptacja trudności
- Każda umiejętność (typ zadania × krok) ma licznik opanowania 0–5.
- 3 poprawne z rzędu → +1; błąd → −1.
- Opanowanie ≥ 4 we wszystkich umiejętnościach kroku → odblokowanie następnego kroku i krótka scenka „Nowa umiejętność!”.
- 2 rundy z rzędu poniżej 3/5 → gra na chwilę wraca do łatwiejszych wariantów (mniejszy zakres, tryb z obrazkami).

### Zasady prezentacji
- E1–E2: polecenia krótkie, z obrazkami. Przycisk głośnika czyta polecenie (Web Speech API, głos polski). Liczby jako kropki/obiekty obok cyfr.
- E3–E6: więcej tekstu, zadania tekstowe 1–3 zdania.
- Konteksty zadań tekstowych ze świata gry: pokoje, meble, ciastka w kawiarni, kwiaty, pieniądze na remont. Imiona z puli neutralnych imion.
- Odpowiedź zawsze dotykiem: wybór z 3–4 kafelków, klawiaturka liczbowa (0–9, kasuj, OK), przeciąganie, zaznaczanie.

---

## 2. Zakresy liczb i działań w etapach

| | E1 | E2 | E3 | E4 | E5 | E6 |
|---|---|---|---|---|---|---|
| Liczby | 0–12 | 0–20, dziesiątki do 100, liczby dwucyfrowe do 99 | do 30 (powtórka do 20) | do 100, setki do 1000, liczby trzycyfrowe | do 100 (pełne) | do 1000 pełne; odczyt i porównanie do 1 000 000 |
| + i − | wynik ≤ 10 | ≤ 20 z przekroczeniem dziesiątki; dziesiątki ± dziesiątki; 30 + 4; 76 − 6 | ≤ 30 z przekroczeniem; 14 + 13, 27 − 15 | ≤ 100 z przekroczeniem przy jedności (38 + 7, 45 − 7); dwie dwucyfrowe bez przekroczenia (35 + 34, 37 − 12); setki (530 + 400, 224 + 60) | ≤ 100 pełne (47 + 28, 63 − 48), także pisemnie | ≤ 1000 (382 + 9, 680 + 40, 468 + 216, 500 − 284), także pisemnie; pełne tysiące |
| · i : | — | — | ≤ 30; ·0, ·1; połowa | ≤ 50; ·5, ·10, :5, :10 do 100 | pełna tabliczka ≤ 100; kolejność działań; „ile razy więcej” | 6 · 12, 96 : 6; ·10; 4 · 70; 3 · 200; 800 : 4 |
| Pieniądze | 1, 2, 5 zł, 10 zł; ≤ 10 zł | ≤ 20 zł; banknoty do 100 zł; grosze do 1 zł | ≤ 30 zł | zł i gr; banknoty do 500 zł | zakupy, ilość · cena | zł i gr, paragony, obniżki |
| Czas | pełne godziny; dni tygodnia; miesiące | pełne godziny; godzina wcześniej/później; kartka kalendarza | zegar 24-godz. (pełne); kwartały; daty z rzymskim miesiącem | minuty, kwadrans, pół godziny; 24-godz. z minutami | upływ czasu przez północ, lekcja 45 min, miesiące 30/31 dni | sekundy, stoper; ile do pełnej godziny; dekada; 365 dni |
| Miary | cm do 10; kg (waga szalkowa) | cm do 20; m = 100 cm; litr; dag, kg = 100 dag | cm (odcinki); kg, dag; °C −30…+30 | mm, cm, m, km; pół litra; pół kg; obwód | mm–cm–m; skala; g; brutto/netto/tara; ¼ l, ¼ kg; obwód (też odwrotny) | wyrażenia dwumianowe (4 cm 7 mm); tona, kwintal; temperatury ujemne |
| Inne | figury, szlaczki, parzyste | diagram słupkowy | rzymskie I–XII; siatka kwadratowa (A1) | — | rzymskie I–XII | rzymskie do MM; zaokrąglanie do setek/tysięcy; tuzin, mendel |

---

## 3. Kroki w etapach (kolejność z podręczników)

Kroki są małe i idą w kolejności książek. W nawiasie: typy zadań z sekcji 4.

### E1 — klasa 1, I półrocze
1. Figury, szlaczki, porównywanie liczebności, orientacja, symetria (SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY).
2. Liczby 1–5: liczenie, „który z kolei”, znaki <, >, = (COUNT, ORDINAL, COMPARE_NUM).
3. + i − do 5 z obrazkami, brakujący składnik do 5 (ADD_SUB, MISSING, BONDS, CHOOSE_OP z obrazkiem).
4. Liczby 6–7, dni tygodnia, rozkłady 6 i 7 (COUNT, BONDS, CALENDAR).
5. Liczby 8–9, trzy składniki, odejmowanie dwóch liczb po kolei (ADD_SUB, CHAIN, WORD).
6. Zero, parzyste i nieparzyste (EVEN_ODD).
7. Liczba 10: rozkłady, dopełnianie do 10, porównywanie działań (BONDS, COMPLEMENT, COMPARE_EXPR).
8. Centymetr, linijka do 10 cm (LENGTH).
9. Działania do 10 mieszane, brakujący znak + / −, nierówności (ADD_SUB, MISSING_OP, INEQUALITY).
10. Liczby 11 i 12 (COUNT, PLACE_VALUE).
11. Zegar — pełne godziny; miesiące; kilogram; pieniądze do 10 zł (CLOCK, CALENDAR, MASS, MONEY_COUNT, MONEY_PAY, MONEY_CHANGE).

### E2 — klasa 1, II półrocze
1. Liczby 13–20, budowa 10 + n, + i − bez przekroczenia (PLACE_VALUE, ADD_SUB).
2. Pieniądze do 20 zł, litr (MONEY_COUNT, MONEY_PAY, MONEY_CHANGE, CAPACITY).
3. Dodawanie z przekroczeniem: 9 + n → 8 + n → 7 + n → 6 + n (metoda „dopełnij do 10”) (ADD_SUB z podpowiedzią rozbicia).
4. Przemienność dodawania (FACT_FAMILY).
5. Odejmowanie z przekroczeniem: od 11–12 → 13–14 → 15–17 → 18 (ADD_SUB).
6. Sprawdzanie odejmowania dodawaniem, grafy +n / −n (FACT_FAMILY, ARROW_TABLE).
7. Dziesiątki do 100: liczenie, porównywanie, + i − dziesiątek (SEQUENCE, COMPARE_NUM, ADD_SUB).
8. Grosze, dekagram, metr (MONEY_COUNT, MASS, LENGTH).
9. Liczby dwucyfrowe: D i J, 30 + 4, 76 − 6, porównywanie (PLACE_VALUE, ADD_SUB).
10. Diagram słupkowy, kalendarz miesiąca, zegar ± 1 godzina (DATA, CALENDAR, CLOCK).

### E3 — klasa 2, I półrocze
1. Powtórka do 20, budowa zadania tekstowego, „o ile więcej / mniej” (WORD, COMPARE_DIFF).
2. + i − do 20 z przekroczeniem (utrwalenie), działania z okienkiem (ADD_SUB, MISSING).
3. Zegar — pełne godziny, obliczenia zegarowe (CLOCK).
4. Waga: kg, dag; diagramy (MASS, DATA).
5. Kwadrat magiczny, odcinki w cm (PUZZLE_GRID, LENGTH).
6. Liczby 21–30, + i − do 30 bez przekroczenia (PLACE_VALUE, ADD_SUB).
7. Siatka kwadratowa i kodowanie, parzyste/nieparzyste, liczby słowami (GRID, EVEN_ODD, NUMBER_WORDS).
8. + i − do 30 z przekroczeniem (19 + 8, 22 − 6), dwie dwucyfrowe (14 + 13) (ADD_SUB).
9. Mnożenie jako „n razy po m”, mnożenie do 30, ·0 i ·1 (MULT_GROUPS, MULT).
10. Dzielenie: po równo i „po ile”, dzielenie do 30, połowa (DIV, HALF).
11. Zegar 24-godzinny, cyfry rzymskie I–XII, kwartały, termometr (CLOCK, ROMAN, CALENDAR, TEMPERATURE).

### E4 — klasa 2, II półrocze
1. Dziesiątki do 100, D i J, porównywanie do 100; złote i grosze; pół kilograma (PLACE_VALUE, COMPARE_NUM, MONEY_COUNT, MONEY_CHANGE, MASS).
2. 36 + 2, 47 − 5, 47 + 3, 50 − 3 (ADD_SUB).
3. Zegar z minutami, pół godziny, kwadrans (CLOCK).
4. Dopełnianie do pełnej dziesiątki, 80 − 7, 38 + 7, 45 − 7, najbliższa dziesiątka (COMPLEMENT, ADD_SUB, ROUNDING).
5. Pełne dziesiątki (52 + 20, 72 − 50), dwie dwucyfrowe bez przekroczenia (35 + 34, 37 − 12), km (ADD_SUB).
6. Mnożenie i dzielenie do 50, nazwy (czynnik, iloczyn, dzielna…), ·5, ·10 do 100 (MULT, DIV, MISSING).
7. Litry, pół litra; m i cm; mm; obwód kwadratu, prostokąta, trójkąta (CAPACITY, LENGTH, PERIMETER).
8. Setki do 1000, liczby trzycyfrowe, 530 + 400, 224 + 60, 553 − 50 (PLACE_VALUE, ADD_SUB).

### E5 — klasa 3, I półrocze
1. Powtórka do 100; 53 + 7, 84 + 8, 53 − 7 (ADD_SUB).
2. Rzymskie I–XII; 27 + 20; 23 + 42, 65 − 42; pisemne dodawanie i odejmowanie w słupku (ROMAN, ADD_SUB, WRITTEN).
3. Liczby słowami do 100; kalendarz; upływ czasu, lekcja 45 min (NUMBER_WORDS, CALENDAR, CLOCK_ELAPSED).
4. Termometr; mnożenie przez 0, 1, 5, 10; mnożenie i dzielenie do 50 (TEMPERATURE, MULT, DIV).
5. Litr, ½ l, ¼ l; kg, ½ kg, ¼ kg, dag (CAPACITY, MASS).
6. 47 + 28 i 63 − 48 różnymi sposobami (ADD_SUB z rozbiciem).
7. Gram, brutto/netto/tara; mm, cm; „o ile starszy”; sensowna jednostka (MASS, LENGTH, COMPARE_DIFF, UNIT_CHOICE).
8. Doba, rozkład jazdy; mnożenie przez 6, 7, 8, 9 (CLOCK_ELAPSED, MULT).
9. Dzielenie do 100, dzielna/dzielnik/iloraz (DIV, FACT_FAMILY).
10. Ilość · cena = wartość; „n razy więcej/mniej”; mnożenie kilku liczb (WORD, PRICE, TIMES_MORE).
11. Kolejność działań; miesiące 30/31 dni, kwartały (ORDER_OPS, CALENDAR).
12. Odcinki w mm/cm/m, skala; obwody, także odwrotne (bok z obwodu) (LENGTH, PERIMETER).

### E6 — klasa 3, II półrocze
1. Temperatury ujemne, różnice temperatur; dekada; sekundy (TEMPERATURE, CALENDAR, TIME_UNITS).
2. Ile minut do pełnej godziny, czas trwania programu (CLOCK_ELAPSED).
3. Brutto/netto/tara; mm i wyrażenia dwumianowe (4 cm 7 mm = 47 mm); obwody figur złożonych (MASS, LENGTH, PERIMETER).
4. Mnożenie dwucyfrowej przez jednocyfrową (6 · 12), dzielenie typu 96 : 6; tuzin i mendel (MULT, DIV).
5. Setki do 1000, km, tona; budowa liczby trzycyfrowej; dopełnianie do setki i do 1000 (PLACE_VALUE, COMPLEMENT, MASS).
6. 382 + 9, 697 + 9, 680 + 40, 764 − 8, 450 − 70 (ADD_SUB).
7. Pisemne dodawanie i odejmowanie trzycyfrowych z przekroczeniem (468 + 216, 365 − 156), sprawdzanie (WRITTEN, FACT_FAMILY).
8. 500 − 284; 3 · 200, 800 : 4; 13 · 10, 4 · 70, 360 : 4 (ADD_SUB, MULT, DIV).
9. Liczby do 10 000: tysiące, rozkład, porównywanie, zaokrąglanie do setek i tysięcy (PLACE_VALUE, ROUNDING).
10. Rzymskie do MM; liczby do 100 000 i 1 000 000 (odczyt, porównanie, pełne rzędy) (ROMAN, PLACE_VALUE, COMPARE_NUM).
11. Powtórka całego roku — „Test przed klasą 4” jako finałowe wyzwanie (MIX — runda losująca ze wszystkich typów etapu; LOGIC jako zadania z gwiazdką).

---

## 4. Typy zadań (generatory)

Oznaczenia: **Grafika** — czego potrzeba poza tekstem i kafelkami. **Od** — pierwszy etap.

### Liczby

**COUNT — policz przedmioty.** Obrazek z n obiektami (też w grupach po 10 od E2) → wybór z 3 kafelków. Zakres: E1 1–12, E2 do 20. Grafika: ikony przedmiotów. Od E1.
> 8 filiżanek na półce → „8”.

**ORDINAL — który z kolei.** Rząd obiektów; „dotknij czwartego od prawej” albo „który z kolei od lewej jest zielony?”. Zakres: E1 do 10, E2 do 20. Grafika: ikony. Od E1.

**SEQUENCE — ciągi i oś liczbowa.** Brakujące liczby w okienkach, sąsiedzi (±1), liczby między a i b, ciąg z regułą (+2, +5, −10, ·2). Zakres i kroki: E1 0–10 krok 1; E2 do 20, dziesiątki do 100; E3 do 30, krok 2/3/5; E4 do 100, krok 10, setki; E5 do 100, reguły dwuetapowe; E6 do 1000, co 1000/10 000. Od E1.
> 14, 16, _, 20 → 18.

**COMPARE_NUM — znaki <, >, =.** Dwie liczby, trzy przyciski ze znakami. Zakresy jak w sekcji 2. Wariant E6: liczby do miliona („więcej cyfr = większa”). Od E1.

**COMPARE_EXPR — porównaj wyniki działań.** 3 + 4 _ 9 − 1; od E3 z liczbami w zakresie etapu; E5 iloczyny/ilorazy. Od E1.

**INEQUALITY — wpisz liczbę, żeby było prawdziwe.** 5 + _ < 8 (sprawdzamy warunek, wiele poprawnych odpowiedzi). Od E1.

**COMPARE_QTY — gdzie więcej, mniej, tyle samo.** Dwie grupy obiektów, trzy przyciski. Tylko E1 (i tryb z obrazkami). Grafika: ikony.

**PLACE_VALUE — dziesiątki, jedności, setki.** Warianty: „ile dziesiątek i jedności ma 47?”, zbuduj liczbę z klocków (setki/dziesiątki/jedności przeciągane na tackę), rozkład 23 = 20 + 3, ułóż największą liczbę z cyfr. Zakres: E1 11–12; E2 do 99; E3 do 30; E4 do 999; E5 do 100; E6 do 10 000, odczyt do 1 000 000. Grafika: klocki 1/10/100. Od E1.

**NUMBER_WORDS — liczby słowami.** Dopasuj zapis cyfrowy do słownego (wybór z 3). E3 do 30, E4 dziesiątki i setki, E5 do 100, E6 do 1000 i pełne tysiące. Od E3.

**EVEN_ODD — parzyste i nieparzyste.** Zaznacz wszystkie parzyste; czy da się ustawić w pary. E1 0–10, E2 do 20, E3 do 30, E4 do 100. Od E1.

**ROUNDING — najbliższa dziesiątka / setka / tysiąc.** E4 dziesiątki, E5 dziesiątki, E6 setki i tysiące. Od E4.

**ROMAN — cyfry rzymskie.** Zamień w obie strony; piętro, godzina na zegarze, miesiąc w dacie. E3 i E5 I–XII; E6 do MM (I–XXXIX, L, C, D, M, lata). Od E3.

### Dodawanie i odejmowanie

**ADD_SUB — działanie z wynikiem.** Główny generator. Parametry: `max` (zakres), `ops` (+, −), `bridge` (bez/z przekroczeniem progu), `shape` (kształt liczb, np. `DU+U`, `DT+DT`, `DU+DU`, `H+H`, `HTU+U`). Zakresy i kształty wg sekcji 2 i kroków z sekcji 3. Odpowiedź: klawiaturka (od E2) lub 3–4 kafelki (E1). Podpowiedź po błędzie: E1 obrazki, E2–E3 rozbicie na „do 10 + reszta” (7 + 6 = 7 + 3 + 3), E4+ rozbicie na dziesiątki i jedności. Od E1.
> E2: 8 + 5 → podpowiedź 8 + 2 + 3. E4: 45 − 7 → podpowiedź 45 − 5 − 2. E6: 680 + 40.

**MISSING — okienko w dowolnym miejscu.** 3 + _ = 7; _ − 9 = 11; 4 · _ = 16; _ : 5 = 6. Te same zakresy co ADD_SUB/MULT/DIV. Od E1.

**BONDS — domki liczb (rozkład na dwa składniki).** Liczba na dachu, w oknach pary; jedno okienko puste. E1 do 10, E2 do 20. Wariant: „połącz pary dające 10”. Od E1.

**COMPLEMENT — dopełnianie.** Ile brakuje do 10, 20, 30, do pełnej dziesiątki (E4), do setki i do 1000 (E6). Od E1.

**CHAIN — kilka działań od lewej.** 2 + 3 + 4; 9 − 2 − 3; 5 + 4 − 3. Zakres jak ADD_SUB. Od E1.

**MISSING_OP — wstaw znak.** 8 _ 2 = 6 (+ / −); od E3 także · i :. Od E1.

**FACT_FAMILY — rodziny działań i sprawdzanie.** Trzy liczby → dopasuj cztery działania; „sprawdź odejmowanie dodawaniem”, „sprawdź dzielenie mnożeniem”; przemienność (4 + 7 = 7 + 4). Od E1.

**ARROW_TABLE — grafy i tabelki.** Liczba na wejściu → strzałka „+5” / „−8” / „·3” → wynik; tabelka z wierszem wejść i reguły. Łańcuch kilku strzałek. Od E2.

**WRITTEN — działanie pisemne w słupku.** Słupek z okienkami cyfr, przeniesienie zaznaczane małą cyfrą. E5 do 100, E6 trzycyfrowe z przekroczeniem. Wariant: brakujące cyfry w słupku (E6). Od E5.

### Mnożenie i dzielenie

**MULT_GROUPS — mnożenie jako grupy.** Obrazek „3 talerze po 4 ciastka” → wybierz działanie lub wynik; skoki na osi. E3–E4. Grafika: ikony w grupach.

**MULT — mnożenie.** E3 iloczyny ≤ 30 (·0, ·1); E4 ≤ 50, ·5 i ·10 ≤ 100; E5 pełna tabliczka ≤ 100; E6 6 · 12, ·10, 4 · 70, 3 · 200. Podpowiedź po błędzie: rozbicie (7 · 8 = 5 · 8 + 2 · 8). Od E3.

**DIV — dzielenie.** Odwrotność MULT w tych samych zakresach; E6 96 : 6 przez rozbicie (60 : 6 + 36 : 6), 800 : 4. Od E3.

**HALF — połowa.** Połowa liczby, kwoty, litra, kilograma. E3, E5. Od E3.

**TIMES_MORE — „ile razy więcej / mniej” i „n razy więcej”.** E5+. Dla porównania różnicowego „o ile” zob. COMPARE_DIFF.

**ORDER_OPS — kolejność działań.** 6 + 6 · 8; 20 − 12 : 4. W książkach kl. 3 tylko bez nawiasów. E5+.

### Zadania tekstowe

**WORD — zadanie tekstowe z szablonu.** Szablony (każdy z parametrami i losowaniem kontekstu):
- razem (dodawanie), zostało (odejmowanie), ile było na początku (odwrotne),
- porównanie „o ile więcej/mniej” (COMPARE_DIFF), „o tyle więcej” (wynik),
- dwa kroki (zjadł 4, potem 2; trzy kategorie),
- wiek („za ile lat będzie miała 8 lat”),
- mnożenie: n pudełek po m; podział po równo; „po ile” (E3+),
- ilość · cena = wartość, reszta z zakupów (E5+),
- „n razy więcej” (E5+),
- dzielenie z resztą w sytuacji (27 dzieci przy stolikach 4-osobowych — ile przy ostatnim?) — rzadko, E5+.
Liczby w zakresie etapu. E1–E2 z obrazkiem i lektorem. Od E1.
> „W kawiarni Martynki było 9 rogalików. Rano sprzedano 4, a po południu 3. Ile rogalików zostało?”

**CHOOSE_OP — wybierz działanie lub pytanie do treści.** Treść lub obrazek (ptaki przylatują / odlatują) + 3 działania; albo treść bez pytania + 3 pytania do wyboru. Od E1.

**COMPARE_DIFF — o ile więcej / mniej / starszy.** Od E3 (wstęp w E2: „o ile się różnią”).

### Pieniądze

**MONEY_COUNT — ile pieniędzy.** Monety i banknoty na stole → suma. Zakresy: E1 1, 2, 5 zł + 10 zł ≤ 10; E2 ≤ 20 zł, banknoty 10–100 zł, grosze do 1 zł; E3 ≤ 30 zł; E4 zł + gr, banknoty do 500 zł; E5–E6 zł i gr. Grafika: polskie monety i banknoty (rysowane, nie zdjęcia). Od E1.

**MONEY_PAY — zapłać dokładnie.** Przeciągnij monety do portfela, aż będzie n zł; wariant „najmniej monet”. Od E1.

**MONEY_CHANGE — reszta i zakupy.** Miał X, kupił za Y, ile zostało; co da się kupić za X zł; zgubiona moneta (ile najwięcej/najmniej). Od E1.

**PRICE — cena jednostkowa, ilość · cena.** E4 (proporcja „4 pudełka = 16 zł, ile 1?”), E5+. Od E4.

### Czas i kalendarz

**CLOCK — odczytaj / ustaw zegar.** Tarcza analogowa: odczyt (wybór z 3) lub przeciąganie wskazówek. E1–E3 pełne godziny (E3 także 24-godz.: „15.00 to która na tarczy?”), E4 minuty co 5, kwadrans, pół godziny, E5–E6 dowolne minuty. Grafika: zegar rysowany w kodzie. Od E1.

**CLOCK_ELAPSED — upływ czasu.** Ile godzin minęło; godzinę wcześniej/później (E1–E2); minuty (E4); przez północ, 45-minutowa lekcja (E5); ile minut do pełnej godziny, czas trwania z rozkładu (E6). Od E1.

**CALENDAR — dni, miesiące, daty.** Kolejność dni tygodnia i miesięcy (przeciąganie kafelków), „za 3 miesiące”, kartka kalendarza (za tydzień), kwartały (E3), daty z rzymskim miesiącem (E3), 30/31 dni (E5), dekada i 365 dni (E6). Od E1.

**TIME_UNITS — jednostki czasu.** 1 h = 60 min, doba = 24 h, 1 min = 60 s, kwadrans = 15 min. E4+.

### Miary

**LENGTH — długość.** Odczyt z narysowanej linijki (E1 do 10 cm, E2 do 20 cm), porównanie pasków, cm ↔ m (E2), mm (E4), km (E4), skala (E5), wyrażenia dwumianowe (E6). Grafika: linijka i paski. Od E1.

**MASS — masa.** Waga szalkowa: cięższe / lżejsze / równowaga, odważniki do sumy (E1 kg; E2 dag, 1 kg = 100 dag; E4 pół kg; E5 g, brutto/netto/tara, ¼ kg; E6 tona, kwintal). Grafika: waga i odważniki. Od E1.

**CAPACITY — pojemność.** Litry, dolewanie do pełna, ½ l (E4), ¼ l (E5), półtora litra (E6). Grafika: naczynia z poziomem. Od E2.

**TEMPERATURE — termometr.** Odczyt, różnica temperatur. E3 −30…+30 °C, E5 0–30 °C, E6 ujemne i różnice. Grafika: termometr. Od E3.

**PERIMETER — obwód.** Kwadrat, prostokąt, trójkąt z podanymi bokami (E4), bok z obwodu (E5), figury złożone na kratkach (E6). Grafika: figury na siatce. Od E4.

**UNIT_CHOICE — sensowna jednostka.** „Długopis ma 14 …” → cm / m / km. E5+.

### Geometria, dane, logika

**SHAPES — figury.** Nazwij figurę, dotknij wszystkich trójkątów, wskaż intruza (inny kolor/kształt/wielkość). E1–E2. Grafika: figury w kodzie.

**PATTERN — co dalej w szlaczku.** Ciągi figur i kolorów (E1–E2), ciągi okresowe. Od E1.

**SPATIAL — położenie.** Przed/za/między/obok, lewa/prawa, rogi ramki, która półka. E1. Grafika: scena (może to być pokój z gry!).

**GRID — droga po kratkach i współrzędne.** Postać idzie wg strzałek (E1–E2); pole A1… (E3, E5). Od E1.

**SYMMETRY — dokończ symetrycznie.** Dorysuj (dotykaj kratek) drugą połowę obrazka. Od E1. Grafika: siatka.

**DATA — diagramy i tabele.** Odczyt z diagramu słupkowego/piktogramu/tabeli; najwięcej, najmniej, o ile więcej. Od E2.

**PUZZLE_GRID — kwadraty magiczne, piramidy, trójkąty liczb.** Uzupełnij pole tak, żeby sumy się zgadzały. Od E3 (piramidy już w E1–E2 w wersji do 10/20).

**LOGIC — zagadki z gwiazdką.** Ręcznie przygotowana pula ~30–50 zagadek na etap (kto na którym piętrze, wagony liczone z dwóch stron, „jaką jestem liczbą”, ważenie na szalkach, przelewanie wody). Nie generator — dane w pliku. Jako „zagadka dnia” za podwójne gwiazdki. Od E1.

---

## 5. Minigry z zeszytów ćwiczeń (warianty rundy)

Zeszyty ćwiczeń mają formaty, które dobrze nadają się na zabawowe warianty rundy (zamiast 5 zwykłych zadań):

- **Hasło z wyników** — każdy wynik ma literę; po rozwiązaniu wszystkich i ułożeniu wyników rosnąco odsłania się słowo (np. nazwa nowego mebla). Od E1.
- **Ścieżka po wynikach** — plansza z kafelkami; idź tylko po polach, gdzie wynik spełnia warunek (np. = 12, parzysty). Od E2.
- **Łańcuch strzałek na czas** — start 7 → +5 → −3 → ·2 … (opcjonalny stoper, bez kary). Od E2.
- **Zakrywanka** — rzut dwiema kostkami, dodaj lub odejmij oczka, zakryj wynik na planszy 0–12. Od E1.
- **Ślimak** — iloczyn oczek dwóch kostek, zakryj pole z wynikiem. Od E4.
- **Kolorowanie wg wyników** — obrazek z polami z działaniami; wynik → kolor (to może odsłaniać np. wzór tapety do pokoju). Od E1.
- **Sklepik** — kupowanie dekoracji za złotówki z resztą. Od E1.

---

## 6. Czego z książek nie przenosimy

- „Ułóż treść zadania”, „opowiedz, co widzisz”, poprawianie źle sformułowanych zadań (wymagają mowy lub pisania).
- Mierzenie przedmiotów w klasie i w domu, praca w parach, lepienie i wyklejanie cyfr.
- Rysowanie odcinków i figur od zera w zeszycie (zastępujemy to kratkami do zaznaczania).
- Gry planszowe dla 2–4 osób (część przerabiamy na jednoosobowe minigry, sekcja 5).

---

## 7. Kolejność wdrażania w kodzie

1. **Bez grafiki** (tylko tekst, kafelki, klawiaturka): ADD_SUB, MISSING, BONDS, COMPLEMENT, CHAIN, MISSING_OP, COMPARE_NUM, COMPARE_EXPR, SEQUENCE, EVEN_ODD, MULT, DIV, FACT_FAMILY, WORD, CHOOSE_OP, NUMBER_WORDS, ROMAN, CALENDAR (tekstowo). To wystarczy, żeby gra działała na wszystkich etapach.
2. **Proste rysunki w kodzie**: COUNT, ORDINAL, PLACE_VALUE (klocki), CLOCK, LENGTH (linijka), ARROW_TABLE, PUZZLE_GRID, SHAPES, PATTERN, WRITTEN.
3. **Grafiki od designera**: MONEY_* (monety i banknoty), MASS (waga), CAPACITY, TEMPERATURE, SPATIAL, MULT_GROUPS.
4. **Minigry** z sekcji 5 i pula zagadek LOGIC.

Model danych generatora (do `src/core/tasks/`):

```ts
type StageId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

interface TaskParams {            // przykład dla ADD_SUB
  max: number;                    // górna granica wyniku i składników
  ops: ('+' | '-')[];
  bridge: 'none' | 'ten' | 'any'; // przekroczenie progu dziesiątkowego
  shape?: string;                 // np. 'DU+U', 'DT+DT', 'H+H'
}

interface Skill {
  id: string;                     // np. 'E2.3.add_bridge_9'
  stage: StageId;
  step: number;                   // krok z sekcji 3
  type: string;                   // typ z sekcji 4, np. 'ADD_SUB'
  params: Record<string, unknown>;
  answer: 'tiles' | 'keypad' | 'drag' | 'select';
}

interface Task {
  skillId: string;
  prompt: string;                 // tekst polecenia (PL)
  speak?: string;                 // tekst dla lektora
  visual?: unknown;               // opis rysunku (zegar, monety, obiekty)
  answer: number | string | number[];
  choices?: (number | string)[];  // dla odpowiedzi kafelkami
  hint: string[];                 // kolejne kroki podpowiedzi
  check?: (input: unknown) => boolean; // dla zadań z wieloma poprawnymi odpowiedziami
}
```

Każdy generator to czysta funkcja `(params, rng) => Task`, testowana w vitest (np. 1000 losowań: wynik w zakresie, brak ujemnych, przekroczenie progu zgodne z `bridge`, rozpraszacze różne od odpowiedzi).
