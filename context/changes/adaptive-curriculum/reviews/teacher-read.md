# Odczyt nauczyciela — nazwy kroków dla dziecka i `pl.unlock` (S-07, impl-review)

- **Data**: 2026-10-13
- **Kto**: `/10x-impl-review adaptive-curriculum` (agent recenzujący, wiersze `[reviewer]` 6.5 i 7.5)
- **Źródło**: `StepDef.childName` w `src/data/curriculum/E1.ts` … `E6.ts` (48 grywalnych kroków, lista ze skryptu nad
  prawdziwymi `stages` z predykatem `playable`), `npm run sample -- E4 --count 6` po poprawce, `pl.unlock` w `src/data/pl.ts`.
- **Kryteria**: mianownik, krótko (≤ 28 znaków, jedna linia 48 px), naturalna polszczyzna dla dziecka 6–9 lat, zgodność z
  treścią i zakresem kroku (typy grywalnych umiejętności), nazwy w etapie różne.

## Wynik

47 z 48 nazw: OK. Jedna poprawiona w `src/data/curriculum/E4.ts`:

| Krok | Było | Jest | Dlaczego |
|---|---|---|---|
| E4.2 (`add_sub_100_units`: 36 + 2, 47 − 5, 50 − 3) | „Działania z małą liczbą” | „Działania do 100” | „z małą liczbą” jest nienaturalne i nic dziecku nie mówi; forma kitu („Dodawanie do 100”) to działanie + zakres. Różni się od E4.5 „Działania dwucyfrowe”. |

Rozważone i zostawione (lepszej nazwy w 28 znakach nie ma):

- E3.8 „Przekraczanie dziesiątki” (`add_sub_30_bridge`) — szkolny zwrot („przekraczanie progu dziesiątkowego”), dziecko
  klasy 2 zna go z lekcji; „Działania do 30 z przekroczeniem” ma 32 znaki.
- E5.2 „Dwucyfrowe i cyfry rzymskie” — przymiotnik bez rzeczownika jest lekko skrótowy, ale czytelny obok „Cyfry rzymskie”;
  alternatywy („Rzymskie i działania do 100”) nie są wyraźnie lepsze.
- E5.6 „Liczenie różnymi sposobami” — oddaje tytuł kroku (47 + 28 różnymi sposobami); ogólne, ale prawdziwe.
- E1.4 „Rozkłady liczb 6 i 7” — krok ma też dni tygodnia (`calendar_weekdays`); nazwa mówi o głównej treści.

Pozostałe (bez uwag): E1 „Porównywanie liczb do 5”, „Działania do 5”, „Działania do 9”, „Parzyste i nieparzyste”,
„Rozkład i dopełnianie do 10”, „Działania do 10”, „Miesiące roku”; E2 „Działania do 20”, „Dodawanie z przekroczeniem”,
„Przemienność dodawania”, „Odejmowanie z przekroczeniem”, „Sprawdzanie odejmowania”, „Dziesiątki do 100”, „Działania na
liczbach do 99”, „Dni tygodnia i miesiące”; E3 „Zadania tekstowe do 20”, „Działania do 20 z okienkiem”, „Działania do 30”,
„Parzyste i liczby słowami”, „Mnożenie do 30”, „Dzielenie do 30”, „Cyfry rzymskie i kwartały”; E4 „Porównywanie liczb do
100”, „Dopełnianie do dziesiątki”, „Działania dwucyfrowe”, „Mnożenie i dzielenie do 50”, „Liczby trzycyfrowe”; E5
„Powtórka do 100”, „Liczby słowami i kalendarz”, „Mnożenie przez 0, 1, 5, 10”, „O ile więcej, o ile mniej”, „Mnożenie
przez 6, 7, 8, 9”, „Dzielenie do 100”, „Zadania tekstowe do 100”, „Miesiące i kwartały”; E6 „Kalendarz i czas”,
„Mnożenie i dzielenie do 100”, „Dopełnianie do 100 i 1000”, „Działania do 1000”, „Sprawdzanie działań”, „Mnożenie i
dzielenie do 1000”, „Zaokrąglanie liczb”, „Duże liczby i rzymskie”.

Uwaga: nazwa kroku, od którego etap startuje (podłoga kalendarza, co najmniej 2. grywalny krok), nie pojawia się na
karcie — dziecko widzi tylko kroki odblokowane później. Nazwy pierwszych kroków pokaże rodzicowi S-08.

## `pl.unlock`

- `title: 'Nowa umiejętność!'` — dokładnie tekst kitu (`unlock.png`). OK.
- `next: 'Dalej'` — jak `pl.round.next`, krótko. OK.
- `spoken: (name) => 'Nowa umiejętność! ${name}.'` — lektor czyta tytuł i nazwę; nazwy są w mianowniku i bez kropki, więc
  zdanie kończy się jedną kropką; liczby z przecinkami („Mnożenie przez 0, 1, 5, 10.”) czytają się naturalnie. OK.
