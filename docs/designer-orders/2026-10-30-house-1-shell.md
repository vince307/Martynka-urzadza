# Zlecenie: paczka `martynka-house-street-v1`, część 1 — skorupa domu 1 do przekroju

## Kontekst

„Martynka urządza” to gra dla dzieci 6–9 lat: dziecko rozwiązuje zadania z matematyki, zbiera gwiazdki i remontuje pokoje. Do tej pory był jeden pokój (salon). Teraz pokoje składają się w **dom**, który dziecko ogląda w **przekroju, jak domek dla lalek**: widok z boku, piętra, w każdej komórce jeden pokój. Dotknięcie komórki otwiera pokój w pełnym widoku. Komórki jeszcze nieotwarte są zamknięte (gra dopisze „Wkrótce”).

Pokoje już istnieją jako gotowe **dioramy 1920×1080** w paczkach `martynka-locations-v2` (kuchnia, pracownia) i `martynka-evolution-v1` (pokój dziecięcy, biblioteka, taras, ogród zimowy): aksonometryczne pudełko pokoju namalowane na jednolitym tle kości słoniowej **`#FFF5DF` (255, 245, 223)**, z marginesem tego tła wokół pokoju. Salon (`martynka-salon-v2`) to ciaśniejszy kadr na zielonej planszy; gra przemalowuje ją sama. **Gra wstawia pomniejszone dioramy do komórek skorupy sama**; w tej paczce nie ma pokoi ani mebli. Grafik rysuje dom bez pokoi: ramę, stropy, ściany zewnętrzne, dach, klatkę schodową, drzwi.

## Cel

Jedna scena 1920×1080: dom 1 otwarty z boku, dwa piętra po dwie komórki, w środku klatka schodowa. Komórki to puste pudełka wypełnione **dokładnie** kolorem `#FFF5DF`, żeby pomniejszona diorama (ta sama barwa marginesu) połączyła się z komórką bez szwu, jak makieta pokoju wstawiona na półkę. Test: w `preview.html` wstaw do komórek pomniejszone `previews/kitchen-after-natural.png` i `previews/children-after-natural.png` z sąsiednich paczek; na granicy komórki i dioramy nie może być widać żadnej krawędzi ani zmiany koloru.

## Układ domu 1 (obowiązkowo, w pikselach sceny 1920×1080)

Każda komórka ma **dokładnie 608×342** (proporcja 16:9; gra skaluje cały eksport pokoju 1920×1080 jednolicie do 608×342).

| Komórka | id | x | y | szerokość | wysokość | Stan w grze |
|---|---|---:|---:|---:|---:|---|
| parter, lewa | `ground-left` | 252 | 636 | 608 | 342 | salon |
| parter, prawa | `ground-right` | 1060 | 636 | 608 | 342 | kuchnia |
| piętro, lewa | `upper-left` | 252 | 236 | 608 | 342 | pokój dziecięcy |
| piętro, prawa | `upper-right` | 1060 | 236 | 608 | 342 | zamknięta („Wkrótce”) |

Z tego wynika reszta konstrukcji:

- **klatka schodowa**: kolumna x 860–1060 (200 px), od fundamentu po dach; w niej schody łączące parter z piętrem, na parterze drzwi wejściowe (widziane od środka albo jako wejście z boku, do decyzji), podest na piętrze;
- **strop między piętrami**: pas y 578–636 (58 px) na całej szerokości domu, z widoczną grubością (belka/deska);
- **fundament/podłoga parteru**: y 978–1010 (ok. 32 px), pod spodem ziemia lub trawnik może wyjść poza obrys domu, ale tylko do y 1040 (niżej jest pasek przycisków gry);
- **dach**: y 40–236, z okapem wystającym poza ściany (do ok. x 200 i x 1720), kominem i ewentualnie małym okienkiem strychu; strych jest **zamknięty** (bez komórki), to tylko rysunek;
- **ściany zewnętrzne**: po lewej x 200–252, po prawej 1668–1720, w przekroju (widać grubość muru, nie elewację);
- **poza domem**: alfa 0 (gra sama kładzie tło: niebo, zieleń); brak nieba w tym pliku;
- **strefy gry**: prawy górny róg (x > 1560, y < 120) zajmuje licznik gwiazdek, a dolny pas (y > 1010) przyciski; nic ważnego nie może tam leżeć (okap dachu i komin mogą wejść w strefę licznika tylko tłem, bez detalu).

## Styl — obowiązkowo

- Ta sama technika co pokoje i meble „po”: gładkie, zaokrąglone bryły „z gliny/winylu”, miękki modelunek, delikatny połysk, bez czarnego konturu, bez ziarna i faktury papieru. Dom ma wyglądać jak zabawka, w którą wstawia się pokoje-makiety.
- Kamera: prosty widok z boku (przekrój), ale ze **stropami i ścianami o widocznej grubości**, żeby komórka czytała się jako pudełko, do którego pasuje aksonometryczna diorama; bez perspektywy zbieżnej, bez zniekształceń.
- Światło ciepłe z lewej góry. Paleta pokoi: turkus `#54BEB4`, listki `#90C36A`, masło `#F1CE6B`, kość słoniowa `#FFF5DF`, terakota `#C98460`, dąb `#C99B66`, ciemny teal `#245C59`. Propozycja: ściany i stropy w dębie i kości słoniowej, dach w terakocie, drzwi i poręcz schodów w turkusie, drobne listki przy fundamencie.
- Przyjaźnie i spokojnie: dom nowy i czysty (to nie stan „przed remontem”; remont dzieje się wewnątrz pokoi). Bez ludzi, zwierząt, mebli, roślin w komórkach, bez tekstu, cyfr, liter, logo, bez mroku i „strasznych” kątów.

## Do wykonania (P1)

### 1. `assets/house/house-1-shell.png`: 1920×1080, RGBA

Skorupa opisana wyżej. **Wnętrza czterech komórek: jednolite, kryjące `#FFF5DF` (alfa 255) co do piksela**, bez winiet, cieni i gradientów (cienie i głębię maluje sama diorama). Poza obrysem domu alfa 0. Konstrukcja (stropy, ściany, schody, dach) kryjąca.

### 2. `assets/house/cell-closed.png`: 608×342, RGBA

Zamknięta komórka na płótnie komórki: przygaszone pudełko w tym samym `#FFF5DF` z nałożonym elementem zamknięcia (np. zasłonięte wejście, drewniana przegroda albo roleta w dębie i turkusie), bez napisu (gra dopisze „Wkrótce” pośrodku, więc środek ma być spokojny). Jedna wersja dla wszystkich komórek.

### 3. `assets/house/cell-frame.png`: 640×374, RGBA (opcjonalnie)

Delikatna ramka podświetlenia komórki (16 px wokół 608×342) w maśle `#F1CE6B`, pokazywana, gdy dziecko dotyka komórki.

### 4. `assets/house/house-1-front.png`: 1920×1080, RGBA (opcjonalnie)

Elementy, które mają leżeć **nad** wstawionymi dioramami (np. poręcz schodów wchodząca przed komórkę, belka okapu). Jeśli nic takiego nie wynika z rysunku, pominąć.

### 5. Manifest i kontrola

- `manifest.json` (`schemaVersion: 1`, `package: house-street-v1`, `canvas`): sekcja `houses` z `house-1`: `shell`, opcjonalnie `front`, `cellClosed`, `cellFrame`, `cellFill: "#FFF5DF"`, `cells` (lista: `id`, `floor` 0/1, `col` 0/1, `x`, `y`, `width`, `height` jak w tabeli), `stairwell` (prostokąt), `safeZones` (prostokąty licznika i paska przycisków). Do tego `README.md`, `prompts.json` (każde zlecenie ImageGen z referencjami), `files.sha256.json`.
- `qa-report.json`: wymiary plików; dla każdej komórki odsetek pikseli dokładnie równych `#FFF5DF` z alfą 255 (cel: 100 %); alfa 0 w czterech rogach sceny i w strefach gry; dla `cell-closed.png` wymiary 608×342.
- `preview.html`: skorupa z pomniejszonymi dioramami wstawionymi w komórki (`previews/kitchen-after-natural.png` z `martynka-locations-v2`, `previews/children-after-natural.png` z `martynka-evolution-v1`, salon jako `screenshots`/`previews` z `martynka-salon-v2`, prawa górna komórka zamknięta), przełącznik „bez dioram” (same komórki) i podświetlenie ramką po najechaniu. Pliki sąsiednich paczek można linkować ścieżką względną.
- `screenshots/`: widok z dioramami i widok pusty, 1920×1080.

## Na później (nie w tym zleceniu, ale rysuj tak, żeby dało się dołożyć)

Dom 2 będzie miał inny układ komórek (parter: pracownia i oszklona przybudówka; poddasze: biblioteka pod skosem dachu), potem ulica z elewacjami i mieszkańcy. Elementy konstrukcji (strop, ściana, dach, schody) warto malować tak, żeby dało się je złożyć w inną skorupę.

## Czego nie zmieniać

Żadnych istniejących paczek. Ta paczka jest samodzielna i leży obok nich w `designs/martynka-house-street-v1/`.

## Licencja

Oryginalne ilustracje, autor zgadza się na publikację w publicznym repozytorium gry.
