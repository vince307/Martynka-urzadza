# Brief dla grafika: dom, ulica i mieszkańcy (kamień M-03, 2026-10-30)

Gra „Martynka urządza”: ćwiczenia z matematyki dla klas 1–3 na tablet w poziomie; za gwiazdki dziecko remontuje
pokoje. Po salonie gra rośnie w **dom z piętrami** (pokoje wybierane w przekroju jak w domku dla lalek), potem
w **ulicę z działkami**; gotowy dom zamieszkują **mieszkańcy** i zostawiają **naklejkę do albumu**. Pokoje już są:
salon (`martynka-expansion-v1` + `martynka-salon-v2`), kuchnia i pracownia (`martynka-locations-v2`), pokój
dziecięcy, biblioteka, taras i ogród zimowy (`martynka-evolution-v1`). Ten brief obejmuje wyłącznie to, czego
żadna paczka nie ma. Priorytety: **P1** blokuje najbliższe wycinki (przekrój domu, mieszkańcy), **P2** gra użyje
w następnych (ulica, drugi dom), **P3** dopracowanie.

## Układ domów (ustalony 2026-10-30)

| Dom | Parter | Piętro | Dodatek przy domu |
|---|---|---|---|
| Dom 1 | salon (lewa komórka), kuchnia (prawa) | pokój dziecięcy (lewa), łazienka (prawa; zmiana autora 2026-10-31, paczka `martynka-bathroom-v1`) | — |
| Dom 2 | pracownia (lewa), ogród zimowy jako oszklona przybudówka (prawa) | biblioteka na poddaszu (pod skosem dachu) | ogród zimowy |
| Dom 3 (później) | taras i ogródek + pokoje z przyszłych paczek | | taras |

Pokój w przekroju to **pomniejszona diorama z istniejącej paczki, wstawiona przez grę**; grafik rysuje tylko
skorupę domu z pustymi komórkami. Komórka zamknięta jest osobną warstwą, więc gra sama decyduje, które komórki są
otwarte.

## Zasady techniczne (wspólne)

- Nowe pliki do **nowego folderu** `designs/martynka-house-street-v1/` (istniejących paczek nie zmieniać), z
  `manifest.json` (`schemaVersion: 1`) w tym samym duchu co poprzednie: dla każdej warstwy `id`, `file`, `x`, `y`
  (lewy górny róg), `width`, `height`, `z`, `anchor`, `visibleRect`; `label` po polsku. Nowe sekcje: `houses`
  (skorupa, komórki, elewacje), `street` (tło, działki), `residents` (scenka, naklejka, warstwy życia).
- Sceny **1920×1080**; warstwy PNG z kanałem alfa, 16 px przezroczystego marginesu, nazwy kebab-case ASCII.
- Styl: ta sama ciepła, miękka ilustracja i paleta co w pokojach (turquoise `#54BEB4`, leafGreen `#90C36A`,
  butterYellow `#F1CE6B`, ivory `#FFF5DF`, terracotta `#C98460`, oak `#C99B66`, deepTeal `#245C59`), światło z
  lewej góry. Ciepło, bezpiecznie, bez grozy; stan „przed” to kurz i zużycie, nie ruina.
- **Bez tekstu na grafice** (napisy, w tym „Wkrótce”, rysuje gra po polsku): tabliczki i szyldy zostawić puste.
- Grafika trafia do publicznego repozytorium (zgoda autora z 2026-10-13); gra konwertuje PNG do WebP sama.
- Bez cieni wpieczonych w elementy, które gra kładzie na innych tłach (mieszkańcy, naklejki, ikony); cienie
  kontaktowe w elewacjach i skorupach mogą zostać.

## P1 — przekrój domu 1 (blokuje wycinek S-23)

Widok domu otwartego z boku, jak domek dla lalek, scena 1920×1080. Przekrój jest **nowym widokiem** między
zeszytem a pokojem; dziecko dotyka komórki, żeby wejść do pokoju. Dioramy pokoi są malowane „z góry pod
kątem” (kamera aksonometryczna), więc skorupa powinna to przyjąć: każda komórka jako **pudełko** z widocznym
stropem i tylną ścianą, w które pomniejszona diorama wpasuje się jak makieta na półce, a nie jako płaski rzut.

Pliki:

1. `house-1-shell.png` — skorupa: fundament, stropy, ściany działowe, dach, schody między piętrami, drzwi
   wejściowe; **wnętrza komórek wypełnione dokładnie kolorem tła eksportów pokoi** (kremowe otoczenie dioram,
   `#FFF5DF` lub ten sam kolor co w `kitchen-after.png`), żeby pomniejszona diorama łączyła się bez szwu.
2. `cell-closed.png` — zamknięta komórka na płótnie komórki: przygaszone pudełko z zamkniętymi drzwiami albo
   zasłoniętym wejściem, bez napisu (gra dopisze „Wkrótce”); jedna wersja wystarczy dla wszystkich domów, jeśli
   komórki mają wspólną wielkość.
3. `cell-frame.png` (opcjonalnie) — delikatna ramka/podświetlenie komórki, gdy dziecko jej dotyka.
4. `house-1-roof-overlay.png` (opcjonalnie) — fragmenty, które mają leżeć **nad** dioramami (np. belka stropu,
   poręcz schodów), jeśli coś takiego wynika z rysunku.

Siatka komórek (obowiązująca, pełne zlecenie w `docs/designer-orders/2026-10-30-house-1-shell.md`): wszystkie
komórki domu mają **tę samą wielkość 608×342 (16:9)**, bo gra skaluje całą dioramę 1920×1080 jednolicie:

| Komórka | x | y | szerokość | wysokość |
|---|---:|---:|---:|---:|
| parter lewa (salon) | 252 | 636 | 608 | 342 |
| parter prawa (kuchnia) | 1060 | 636 | 608 | 342 |
| piętro lewa (pokój dziecięcy) | 252 | 236 | 608 | 342 |
| piętro prawa (zamknięta) | 1060 | 236 | 608 | 342 |

Między kolumnami jest klatka schodowa (x 860–1060), między piętrami strop (y 578–636), nad piętrem dach
(y 40–236); prawy górny róg i dolny pas (y > 1010) należą do HUD gry. Dioramy mają w paczkach kremowy margines wokół pokoju (`composition.destination`
w manifestach lokacji); gra może go przyciąć do obrysu architektury, więc komórka powinna wyglądać dobrze zarówno
z marginesem, jak i bez.

## P1 — mieszkańcy domu 1 i naklejka (blokuje wycinek S-24)

Gdy wszystkie pokoje domu są gotowe, gra pokazuje jedną scenkę: obrazek mieszkańców i jedno zdanie, które czyta
lektor; bez dialogów i wyborów. Mieszkańcy nie opowiadają historii; potem „ożywiają” dom z zewnątrz.

1. `residents-house-1.png` — ok. 1200×800, alfa: rodzina pasująca do domu 1 (np. mama, tata, dziecko 7–8 lat i
   kot) w stylu gry, radosna, zwrócona do widza, z drobnym gestem podziękowania (machanie, bukiet); **bez
   podobieństwa do konkretnych osób**, bez tekstu.
2. `sticker-house-1.png` — 512×512, alfa: naklejka do albumu (motyw domu 1 lub jego mieszkańców) z białym
   „papierowym” obrysem jak prawdziwa naklejka; jedna na dom.
3. `album-page.png` (P2) — 1600×900, tło strony albumu z miejscem na kilka naklejek (bez ramek „pustych
   miejsc”, które naciskałyby dziecko); gra dokłada naklejki i napisy.

## P2 — ulica z działkami i elewacje (wycinek S-26)

Ulica to trzeci poziom zbliżenia (ulica → dom → pokój); dziecko wchodzi do domu dotknięciem. Scena 1920×1080.

1. `street-background.png` — spokojna uliczka w stylu gry (chodnik, zieleń, niebo), **bez domów**: 4 miejsca na
   działki w rzędzie (gra ustawia domy i działki z manifestu `street.plots` jako `x`, `y`, `width`, `height`
   na poziomie gruntu, wspólna wielkość, np. 4 × 380×520 z odstępami); pozostaje margines na HUD.
2. `plot-closed.png` — zamknięta działka: ogrodzenie lub żywopłot i pusta tabliczka (gra dopisze „Wkrótce”).
3. `plot-open.png` — działka otwarta, jeszcze bez domu (trawa, ścieżka, wbity kołek z pustą tabliczką).
4. `house-1-exterior.png` — elewacja domu 1 **w stanie remontu** (ciepła, nie ruina), wielkości działki.
5. `house-1-exterior-done.png` — elewacja domu 1 gotowa (albo zestaw warstw „życia” nakładanych na elewację:
   `house-1-life-window-light.png`, `house-1-life-cat.png`, `house-1-life-curtains.png`, `house-1-life-smoke.png`);
   warstwy są lepsze, bo gra może je włączać po kolei.
6. `house-2-shell.png` + elewacje domu 2: skorupa z komórkami parter lewa (pracownia), parter prawa (oszklona
   przybudówka na ogród zimowy), poddasze (biblioteka, komórka pod skosem dachu, ta sama proporcja 16:9, może
   być mniejsza, jeśli wszystkie komórki tego domu są mniejsze); elewacja z widoczną przybudówką.
7. `residents-house-2.png` + `sticker-house-2.png` — inna rodzina lub zwierzaki (np. dziadkowie z psem), jak dla
   domu 1.

## P2 — ikony przycisków

`icon-house.png`, `icon-street.png`, `icon-album.png`, `icon-notebook.png` — 256×256, alfa, w stylu ikon z paczek
(`assets/icons`): dom, uliczka, album z naklejką, zeszyt. Gra rysuje przyciski sama, ikona siedzi w środku.

## P3 — dopracowanie

1. **Etapy pośrednie kuchni** (jak `children-stage-1/2` w evolution): `kitchen-stage-1.png` (po sprzątaniu),
   `kitchen-stage-2.png` (odnowione ściany); `kitchen-before.png` zostaje stanem 0, `kitchen-after.png` etapem
   podłogi. To wyrównuje liczbę czynności kuchni (7) z salonem (12). To samo opcjonalnie dla pracowni.
2. **Salon jako diorama na kremowym tle**: re-eksport `architecture-after.png` i worn `architecture-before.png`
   (z `martynka-salon-worn-v2`) z kremowym otoczeniem zamiast zielonej planszy, w tym samym obrysie, żeby w
   przekroju domu salon wyglądał jak pozostałe pokoje; sloty mebli bez zmian.
3. **Wersje dzielnic** (dom 3 i dalej, PRD FR-036): tylko koncept 1–2 szkiców otoczenia (nad morzem, w górach)
   do decyzji autora; produkcja później.

## Kontrola przed oddaniem

- Każdy plik z alfą sprawdzony na kremowym i turkusowym tle; brak obciętych krawędzi; 16 px marginesu.
- Komórki domu 1 w jednej wielkości i proporcji 16:9; w `manifest.json` wpisane prostokąty komórek, działek i
  pozycje warstw życia; `preview.html` składający skorupę z pomniejszonymi dioramami z `martynka-locations-v2`
  i `martynka-evolution-v1` (można podlinkować pliki sąsiednich paczek) i ulicę z elewacjami.
- Żadnego tekstu na grafice; żadnego podobieństwa do prawdziwych osób; mieszkańcy bez wyrazu zawodu czy złości.
