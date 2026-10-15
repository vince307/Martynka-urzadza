# Brief dla grafika: brakujące elementy po S-16a (2026-10-15)

Gra „Martynka urządza”: ćwiczenia z matematyki dla klas 1–3 na tablet w poziomie, za gwiazdki dziecko remontuje
salon. Salon v1 jest zbudowany z paczki `martynka-expansion-v1`: tło przed/po, 6 grup mebli po 3 warianty (sofa,
dywan, stolik, komoda, fotel, obrazki), a lampa, dwie rośliny i pufa to stała dekoracja. Poniżej jest wszystko,
czego gra jeszcze nie ma. Priorytety: **P1** blokuje wydanie (S-16b), **P2** gra użyje od razu, **P3** rozbudowa
salonu po v1.

## Zasady techniczne (wspólne)

- Nowe pliki do **nowego folderu** `designs/martynka-salon-v2/` (paczek v1 nie zmieniać), z `manifest.json` w tym
  samym schemacie co `martynka-expansion-v1` (`slots`: `x`, `y`, `width`, `height`, `z`, `anchor`, `visibleRect`,
  `variants[{id, label, file}]`; `label` po polsku).
- Salon: scena 1920×1080, ta sama kamera (`orthographic-like`, elewacja 45°, azymut 45°), światło z lewej góry,
  paleta z manifestu expansion (turquoise `#54BEB4`, leafGreen `#90C36A`, butterYellow `#F1CE6B`, ivory `#FFF5DF`,
  terracotta `#C98460`, oak `#C99B66`, deepTeal `#245C59`).
- Warianty jednej grupy: **to samo płótno** (szerokość, wysokość), **ten sam punkt `anchor`** (miejsce styku z
  podłogą/ścianą), ten sam kąt i światło; forma może się różnić, byle mieściła się w tym samym miejscu. PNG z
  kanałem alfa, 16 px przezroczystego marginesu jak w expansion. Bez cieni wpieczonych w mebel (cienie są
  osobną warstwą).
- Nazwy plików: kebab-case ASCII, np. `curtains-sea.png`.
- Grafika jest publikowana w publicznym repozytorium (zgoda autora z 2026-10-13); bez tekstu na grafice (napisy
  rysuje gra, po polsku).

## P1 — dźwięki (blokują S-16b)

Format: każdy dźwięk w **OGG (Vorbis) i M4A (AAC)**, mono, 44,1 kHz, poziom ok. −16 LUFS, cisza na początku
≤ 10 ms. Ton: ciepły, miękki, „drewniane/dzwoneczkowe” brzmienia; **żadnych ostrych dźwięków porażki** (gra nigdy
nie karze za błąd). Gra jest w pełni grywalna bez dźwięku, dźwięk tylko wzmacnia.

| Plik | Kiedy | Długość |
|---|---|---|
| `answer-right` | dobra odpowiedź | 0,3–0,6 s |
| `answer-retry` | błędna pierwsza próba, pokazuje się podpowiedź (łagodne „hmm”, nie „bzzt”) | 0,2–0,4 s |
| `star` | gwiazdka leci do licznika (może grać kilka razy pod rząd) | 0,15–0,3 s |
| `round-bonus` | bonus za rundę bez błędu | 0,8–1,5 s |
| `tap` | stuknięcie przycisku | ≤ 0,1 s |
| `panel-open` | otwarcie panelu wariantów mebla | 0,2–0,4 s |
| `variant-pick` | podgląd wariantu (zmiana miniatury) | ≤ 0,2 s |
| `purchase` | „Wybieram”: mebel pojawia się w pokoju | 0,5–1 s |
| `room-done` | „Pokój gotowy!” | 1,5–3 s |
| `skill-unlock` | „Nowa umiejętność!” | 1–2 s |
| `coin` | moneta/klocek odłożony w zadaniu z przeciąganiem | ≤ 0,2 s |
| `minigame-done` | koniec minigry / zagadki dnia | 1–2 s |
| `music-loop` (opcjonalnie) | spokojne tło w pokoju, zapętlone bez kliknięcia | 30–60 s |

## P2 — gra użyje od razu

1. **Ikona aplikacji** (PWA): kwadrat 1024×1024 PNG bez przezroczystości oraz wersja „maskable” z ważną treścią
   w środkowym kole 80 % (gra wytnie 512, 192 i 180 dla iPada).
2. **Ekran ładowania**: tło 1920×1080 (może być salon po remoncie, rozmyty) + osobny element tytułowy
   (np. sylwetka Martynki / gwiazdka / dom) PNG z alfą ok. 600×600; tytuł „Martynka urządza” narysuje gra.
3. **Miniatura salonu** na liście pokoi: 480×270, stan po remoncie (i opcjonalnie stan przed).
4. **Portfel / skarbonka** dla zadań „zapłać monetami” (cel przeciągania): widok z przodu, otwarty, ok. 640×420,
   miejsce na 6 monet; jeden plik.
5. **Ikony do liczenia** (512×512 + 96 + 64, jak w expansion `assets/icons`): **talerz**, **pudełko**,
   **naklejka**.
6. Karta „Nowa umiejętność!”: ilustracja **książki/zeszytu** 400×400 z alfą (dziś placeholder z kodu).

## P3 — rozbudowa salonu (po v1; dopisywana na końcu listy remontu)

Każdy punkt to nowy slot z 3 wariantami, na tej samej scenie, nie zmieniając istniejących plików mebli:

1. **Zasłony** ×3 (osobna warstwa). Wymaga też ponownego eksportu `architecture-before.png` i
   `architecture-after.png` **bez zasłon** (wszystko inne piksel w piksel takie samo).
2. **Lampa** ×3 (istniejąca `lamp-table` jako jeden z wariantów albo trzy nowe, to samo miejsce `x 769, y 94`).
3. **Roślina** ×3 dla jednego miejsca (np. lewa, `x 70, y 230`); druga roślina zostaje dekoracją.
4. **Półka ścienna** ×3 (nad komodą, z kilkoma drobiazgami).
5. **Pufa** ×3 (istniejąca `pouf` jako jeden z wariantów, `x 458, y 736`).
6. Opcjonalnie **tła pośrednie** remontu (posprzątane → ściany → podłoga), jak w pokoju dziecięcym w
   `martynka-evolution-v1`; ta sama scena, pełne 1920×1080 bez alfy.

## Poza salonem (jeśli zostanie czas)

- Waga przechylona (lewa/prawa szalka niżej) w stylu `martynka-maths-A-v1/assets/measuring`; odważniki gramowe
  100 g / 200 g / 500 g.
- Butelka 1,5 l i wiadro do zadań o pojemności (ten sam `visibleRect` co dzbanki).
- Scena z półkami do zadań „po lewej / nad / pod” (może być fragment salonu z 3 półkami i 4–5 przedmiotami).
