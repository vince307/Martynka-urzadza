# Zlecenie: paczka `bystrow-space-base-v2`, część 2: moduł „Hangar z rakietą”

## Kontekst

Gra „Bystrow” (dzieci 6–9 lat: zadania z matematyki dają gwiazdki, za gwiazdki dziecko remontuje pokoje, wybierając jeden z trzech wariantów każdego elementu). Przy pierwszym uruchomieniu dziecko wybiera Dom albo Bazę kosmiczną. Paczka `designs/bystrow-space-base-v1/` zawiera już pierwszy moduł bazy „Mostek” (`bridge`), przekrój bazy i karty wyboru. Ta paczka dodaje **drugi moduł**, który dziecko remontuje po Mostku, więc musi wyglądać jak z tego samego kompletu.

Zanim zaczniesz, przeczytaj i obejrzyj: `bystrow-space-base-v1/README.md`, `manifest.json`, `style-guide.md`, `plan.md`, `tools/`, `previews/`, `screenshots/` (to wzór techniki, kamery, kadru, palety i formatu) oraz `martynka-locations-v2/manifest.json` (schemat manifestu). Nie zmieniaj tych paczek.

Folder tej paczki: **`designs/bystrow-space-base-v2/`**.

## Styl (obowiązkowo, spójnie z Mostkiem)

Dokładnie jak w `bystrow-space-base-v1/style-guide.md`: gładkie, zaokrąglone bryły „z gliny i winylu”, miękki modelunek, bez czarnego konturu i ziarna; ta sama kamera aksonometryczna i światło z lewej góry; moduł to pudełko pokoju na jednolitym tle `#FFF5DF` z marginesem jak Mostek, żeby pomniejszony wszedł w komórkę 608×342 bez szwu. Ta sama paleta (turkus, listki, masło, kość słoniowa, terakota, dąb, ciemny teal, księżycowa biel i srebrnoszarość; granat tylko w oknach). Jasno, ciepło, zabawkowo: hangar to warsztat-plac zabaw, nie fabryka. Bez ludzi, kosmitów, zwierząt, broni, ognia, płomieni z silnika, ostrzeżeń, tekstu, cyfr, liter i logo.

Stan „przed”: zaniedbany, nie zniszczony: kurz, plandeka na rakiecie, rozsypane części, przygaszone lampy, kartony. Wesoło do posprzątania.

## Do wykonania (P1)

### Moduł 2 „Hangar” (id `hangar`)

Pliki i schemat jak Mostek w `bystrow-space-base-v1`:

- `assets/room/hangar-before.png`: pełna scena 1920×1080 przed remontem;
- `assets/room/hangar-after.png`: pusta architektura po remoncie (bez elementów ze slotów; duże wrota hangaru z widokiem na Księżyc i gwiazdy);
- `assets/room/hangar-shadows.png`: warstwa cieni jak w Mostku;
- sześć grup × trzy warianty, PNG z alfa w `assets/furniture/`, rodziny `natural`, `sunny`, `mint` (etykiety „Naturalny”, „Słoneczny”, „Miętowy”; warianty zmieniają materiały i kolory, bryła zostaje):
  1. `hangar-rocket`: mała, pękata rakieta na stojaku (główny element, największy slot);
  2. `hangar-rover`: łazik księżycowy na sześciu kołach;
  3. `hangar-workbench`: stół warsztatowy z narzędziami (klucze, śrubokręty, bez ostrych krawędzi);
  4. `hangar-crates`: stos skrzyń z częściami;
  5. `hangar-lamp`: lampa warsztatowa albo girlanda lampek;
  6. `hangar-mat`: mata podłogowa / pas startowy na podłodze.
- `manifest.json` w schemacie `bystrow-space-base-v1` (`rooms.hangar` z `label: "Hangar"`, `backgroundAfter`, `backgroundBefore`, `shadows`, `slots` z `x`, `y`, `width`, `height`, `z`, `targetRect`, `sourceSceneRect`, `visibleRect`, `anchor`, `variants`), `canvas`, `camera`, `families`.

### Kontrola i dokumenty

- `qa-report.json`: wymiary, margines `#FFF5DF` w rogach teł, alfa, obrys i kotwice mebli jak w narzędziach `bystrow-space-base-v1/tools`.
- `preview.html`: Hangar przed/po z przełącznikiem rodzin i pojedynczych grup; Hangar pomniejszony w komórce `ground-right` przekroju bazy z v1 obok Mostka w `ground-left`.
- `screenshots/`: Hangar przed, po (każda rodzina), przekrój bazy z dwoma modułami.
- `README.md`, `prompts.json`, `files.sha256.json`, `tools/`.

## Czego nie zmieniać

Żadnych istniejących paczek w `designs/`, w tym `bystrow-space-base-v1/`. Ta paczka jest samodzielna.

## Licencja

Oryginalne ilustracje; autor zgadza się na publikację w publicznym repozytorium gry.
