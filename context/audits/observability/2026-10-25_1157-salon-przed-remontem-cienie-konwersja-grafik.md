---
type: observability-audit
date: 2026-10-25 11:57
mode: audit
commit: 8ee2993
branch: docs/observability-audit-2026-10-24-salon-style
dirty_tree: false
areas: [salon-before-worn-grade-contact-shadows-canvas-wash-stage-purchase-miniature-backdrop-obrazki, art-conversion-npm-run-art-recolour-board-python-step]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-21_1719-naglowek-zadania-obrazki-kod-umiejetnosci.md
findings: { critical: 0, high: 0, medium: 1, low: 1 }
---

# Audyt obserwowalności: salon przed remontem, cienie kontaktowe, konwersja grafik (2026-10-25)

Ten raport zamyka run `2026-10-24-salon-style`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #106 | fix `salon-style` (stan „przed” = meble „po” pod ColorMatrix, cienie kontaktowe, przemalowana plansza `#BCD799`, usunięty obraz `furnishings-before`) | `8ee2993` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Salon w grze:** stan przed remontem (`wornPieces` + `applyWornGrade`, wyciszenie `canvasWash` pod rendererem Canvas), cienie kontaktowe (`contactShadowPieces`, `RoomView.drawContactShadows`), etap ścian (`RoomScene.fadeStage`) i zakup mebla, miniatura pokoju (`drawRoomMiniature`) i rozmyte tło salonu za notesem (`SalonBackdrop`), brakujące lub uszkodzone grafiki pokoju i ich zgłoszenie w „Obrazki”.
- **Konwersja grafik:** `npm run art` (`scripts/make-task-art.mjs`) z nowym krokiem Pythona `scripts/recolour-board.py`; czy błąd tego kroku nie przechodzi po cichu.

Zakres: diff runu `309e672..8ee2993` w `src/` i `scripts/` (15 plików, +412/−32; `vite/`, `deploy/` i `.github/` bez zmian). Znane i zapisane, nie powielam: follow-upy runu (`context/archive/2026-10-24-salon-style/follow-ups/review-fixes.md`, cytowane jako „FU-SS”, zwłaszcza F2 z impl-review: żaden test automatyczny nie widzi wyglądu postarzenia ani cieni) oraz wcześniejsze otwarte PR-y audytowe #101 i #104 (ich ustalenia B-1/B-2/C-1/G-1/G-2 zamknął PR #105). Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 1 MEDIUM, 1 LOW (nowe).** Run nie dodał żadnego `catch`, `console.*` ani cichego `.catch`: liczniki przeglądu repozytorium są identyczne jak na `309e672`.
- **Krok Pythona nie ginie po cichu jako proces:** brak `python3`, zła wersja Pillow/numpy (`check_versions` → `sys.exit` z komunikatem), zły kolor, brak pliku i niezerowy kod wyjścia kończą `npm run art` przez `process.exit(1)` z nazwą pliku (`make-task-art.mjs`, pętla `ROOM_JOBS`). Tak samo `cwebp` (`convert`).
- **M-1 (MEDIUM, udowodnione lokalnie na funkcji):** `recolour` w `scripts/recolour-board.py` dla obrazu bez zielonej planszy przy krawędzi (pusta maska `board_mask`) zwraca **całkowicie czarny obraz z kodem 0** — tylko trzy `RuntimeWarning` na stderr. `npm run art` drukuje rozmiar i idzie dalej; czarne tło salonu przechodzi testy (budżet bajtów, precache, e2e) i deploy.
- **L-1 (LOW):** pod rendererem Canvas pokój pokazuje wyciszenie zamiast postarzenia, a miniatura, tło za notesem i duchy przejścia etapu pokazują meble bez żadnego postarzenia — i nigdzie (konsola, „Obrazki”, `artFallbacks`) nie ma śladu, że gra działa na Canvas. Wyzwalacz FU-SS 3 („zgłoszenie urządzenia z Canvas”) nie ma więc źródła sygnału.
- **Brakujące grafiki pokoju są zgłaszane:** postarzone meble używają tych samych tekstur co wariant 0 slotu lub dekoracja z `ROOM_ART`, więc brak takiej tekstury liczy linia pokoju w „Obrazki”; dziecko widzi brak mebla (bez zastępczego pudełka, świadoma decyzja, design gap 172). Obraz `furnishings-before` zniknął z `ROOM_ART`, z precache i ze smoke'u (`roomArtCheck` liczy z tej samej tabeli); e2e `salon-style.spec.ts` pilnuje, że nikt go nie żąda.

## 2. Model przechwytywania (zmiany względem raportu 2026-10-21 17:19)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA (`src/main.ts`, `type: AUTO`), bez trackera i sieci w czasie gry. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`errorCode` w `src/core/save.ts`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, log CI smoke'u deployu. Dla narzędzi lokalnych (`npm run art`, `npm run font`): stdout/stderr i kod wyjścia w terminalu opiekuna; wyniki są commitowane, CI ich nie przebudowuje.
- **Postarzenie:** `wornPieces` (`src/core/rooms.ts`) buduje listę z `SALON.worn`; `findPiece` rzuca `Error` z id dla nieznanego elementu (dane statyczne, pilnowane przez `tests/roomWorn.test.ts`), rzut trafiłby do granicy błędów (`installErrorBoundary`) z kartą „Ups!”. `buildWorn` (`src/ui/widgets/RoomView.ts`) pomija element bez tekstury (gap 172) i woła `applyWornGrade` (`src/ui/wornGrade.ts`), które zwraca `false`, gdy `enableFilters().filters` nie istnieje (Canvas). `RoomView.drawWorn` kładzie wtedy `canvasWash`. Wynik trafia tylko do hooka e2e (`RoomSnapshot.worn.graded`).
- **Cienie kontaktowe:** `contactShadowPieces` (czysta funkcja, ta sama dla obu rendererów), rysowane `Graphics` w `RoomView.drawContactShadows`; hook e2e: `contactShadows`. Warstwa `shadows` jest teraz pokazywana także przed etapem; jej brak to pusta warstwa pełnoekranowa (`RoomLayer.show(..., null)`) i linia pokoju w „Obrazki”.
- **Etap i zakup:** `RoomScene.fadeStage` buduje duchy (`before`, `shadows`, `buildWorn(emptyRoomState())`) i je czyści przy uśpieniu i zamknięciu (`clearGhosts`); ścieżka zakupu, gwiazdek i zapisu bez zmian (FU-SS 6: L-R9, M-5 ponownie otwarte).
- **Miniatura i tło za notesem:** `drawRoomMiniature` woła `applyWornGrade` i **ignoruje wynik**; `SalonBackdrop.render` liczy `graded` jako liczbę obrazów z niepustą listą filtrów (`BackdropSnapshot.graded`, tylko hook e2e; FU-SS 6: „`graded` nie jest dowodem pikselowym”).
- **Konwersja grafik:** `make-task-art.mjs` sprawdza istnienie kitów i plików, każde `execFileSync` (`python3`, `cwebp`) jest w `try` z `console.error` i `process.exit(1)`. `recolour-board.py` sprawdza przypięte wersje i format koloru, ale nie sprawdza wyniku maski (pokrycie planszy) ani wartości NaN.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | 309e672 | 8ee2993 |
  |---|---|---|
  | linie z `catch` | 68 | 68 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 54 | 54 |

## 3. Co dociera do obserwatora (statycznie; jedna sonda lokalna na funkcji Pythona)

| Kształt awarii | Dziecko | Rodzic | Konsola / terminal / CI | Werdykt |
|---|---|---|---|---|
| Brak tekstury postarzonego mebla | brak mebla w pokoju „przed” | linia pokoju w „Obrazki” (ta sama tekstura co wariant 0 / dekoracja) | log ładowania (`loadErrorLine`) | widoczne |
| Brak tekstury `shadows` lub tła | pusta warstwa / kolorowe tło zastępcze | „Obrazki” | log ładowania | widoczne |
| Nieznany element w `SALON.worn` / `contactShadows` | karta „Ups!” | — | `Error` z id w konsoli; test jednostkowy czerwony przed wydaniem | widoczne |
| Renderer Canvas (brak filtrów) | wyciszenie zamiast postarzenia; miniatura, tło i duchy bez postarzenia | nic | nic | **niewidoczne** (L-1) |
| Filtr dodany, ale nie renderuje (np. tekstura dynamiczna) | meble jak po remoncie | nic | nic | znane (FU-SS F2, FU-SS 6 F6) |
| `python3` brak / zła wersja / zły kolor / brak pliku | — | — | komunikat + kod 1 | widoczne |
| Plansza bez zielonego przy krawędzi (zmieniony kit) | czarne tło salonu po deployu | „Obrazki” w porządku (tekstura istnieje) | 3 × `RuntimeWarning`, kod 0, testy i smoke zielone | **niewidoczne** (M-1) |

## 4. Systemowe przyczyny źródłowe

1. **Narzędzie lokalne sprawdza proces, nie wynik.** `make-task-art.mjs` i `recolour-board.py` dbają o kody wyjścia i wersje, ale nie mają asercji na treść obrazu (pokrycie maski, NaN, zakres jasności). Rozsądne lokalnie (narzędzie deterministyczne, wynik commitowany), ale jedyną kontrolą treści zostaje ludzkie oko na bramce wizualnej. Wyjaśnia M-1.
2. **Łagodny fallback renderera bez własnego sygnału.** `applyWornGrade` zwraca `false`, `drawWorn` kładzie wyciszenie, `drawRoomMiniature` wynik pomija; jedynym odbiorcą informacji jest hook e2e, którego nie ma w `dist/`. Ten sam wzorzec, który projekt rozwiązał dla innych fallbacków przez `REGISTRY_KEYS.artFallbacks`, tu nie został użyty. Wyjaśnia L-1 (i ogranicza FU-SS 3).

## 5. Ustalenia według obszarów

### Konwersja grafik (`npm run art`)

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| M-1 | `scripts/recolour-board.py` `recolour` / `board_mask` (wołane z `scripts/make-task-art.mjs`, pętla `ROOM_JOBS`) | swallowed | MEDIUM | Gdy kit dostarczy tło, którego plansza przy krawędzi nie mieści się w HSV 95–165° / s > 0,30 (nowa grafika autora, zmieniony kolor planszy), `a[filled].mean()` daje NaN, cały obraz wychodzi czarny (`astype(uint8)` z NaN), skrypt kończy się kodem 0. `npm run art` drukuje rozmiar, budżet bajtów (`tests/bootBudget.test.ts`), precache, smoke deployu i e2e są zielone; dziecko widzi czarny salon przed i po remoncie. Sprawdzone lokalnie: obraz 60×40 bez zieleni → min/max 0/0, `exit=0`. Podobnie po cichu: maska, która wycieknie do środka pokoju, przemaluje pokój. | W `recolour`: `sys.exit` z nazwą pliku, gdy `filled.sum()` jest poza rozsądnym przedziałem udziału w obrazie (np. 5–60 %) lub `np.isfinite(out).all()` jest fałszem; drukować udział maski w stdout, żeby był w logu konwersji. |

### Salon w grze

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-1 | `src/ui/widgets/RoomView.ts` `RoomView.drawWorn` i `drawRoomMiniature` (wynik `applyWornGrade` pominięty); `src/scenes/RoomScene.ts` `fadeStage` (duchy z `buildWorn`) | coverage | LOW | Na tablecie, na którym Phaser `AUTO` wybierze Canvas (brak WebGL, czarna lista GPU), pokój „przed” ma tylko wyciszenie, a miniatura na „Pokój gotowy!”, tło za notesem i duchy przejścia pokazują meble jak po remoncie. Nikt się o tym nie dowie: renderer nie trafia do konsoli, „Obrazki” ani `artFallbacks`, `BackdropSnapshot.renderer` i `RoomSnapshot.worn.graded` są tylko w hooku e2e. Wyzwalacz FU-SS 3 nie ma źródła. | Zapisać `worn` (renderer bez filtrów) w `REGISTRY_KEYS.artFallbacks` przy pierwszym `false` z `applyWornGrade` i jedną linię `console.info` z typem renderera przy starcie; ewentualnie jedno zdanie w „Obrazki” (tekst w `pl.ts`, gap w `docs/design-gaps.md`). |

Sprawdzone i bez ustaleń: `findPiece` rzuca z id (granica błędów, test jednostkowy); `clearGhosts` przy `sleep`/`shutdown`; `wornPieces` nigdy nie trafia do `chosen` ani `shownVariants`, więc zapis (v4) i `roomStateProblems` są nietknięte; usunięcie `furnishings-before` jest spójne w `SCENE_FILES`, `ROOM_ART`, `roomArtCheck` i komentarzu budżetu w `balance.loader`; `tests/phaserLoaderPin.test.ts` przypina `ColorMatrix#set` i `filters.colorMatrix` (Phaser 4.2.1).

## 6. Zalecana kolejność poprawek

1. **M-1** — dwie asercje w `recolour` (udział maski, `isfinite`) i jedna linia udziału w stdout. Kilka linii Pythona, zamyka jedyną drogę, którą czarne tło przechodzi przez wszystkie bramki. Ograniczenie: zachować bajtową powtarzalność wyniku (asercje nie zmieniają obliczeń).
2. **L-1** — jeden wpis `artFallbacks` i jedna linia konsoli. Daje sygnał dla FU-SS 3 i przy okazji dla FU-SS 5 (koszt filtrów na tablecie: wiadomo przynajmniej, który renderer działa). Ograniczenie: bez telemetrii, tylko konsola i panel rodzica (PRD).

## 7. Zmiany od ostatniego audytu

Poprzedni raport (2026-10-21 17:19) obejmował nagłówek zadania, „Obrazki” bez dźwięków i kod umiejętności przy budowie zadania — inne obszary niż ten run.

| Poprzedni id | Status | Dowód |
|---|---|---|
| N-7 (Zakrywanka: lektor mówi „Oblicz.”, ekran bez nagłówka) | not re-checked | poza obszarami; run nie dotknął `headingOf` ani `TaskScene.drawPrompt` |
| N-8 (`repairCap` bez śladu) | not re-checked | poza obszarami; run nie dotknął `src/core/round/variety.ts` |
| PR #101 B-1/B-2/C-1, PR #104 G-1/G-2 | fixed (przez PR #105, przed tym runem) | `SalonBackdrop` przerysowuje się na `RESTORE_WEBGL` (`TaskScene`, `WelcomeScene`); `guideAvailable`; ten run dodał tylko pole `graded` do `BackdropSnapshot` |

## 8. Metoda i ograniczenia

- Audyt wykonany bezpośrednio w jednym przebiegu, bez subagentów: diff runu ma 412 dodanych linii w 15 plikach, a model przechwytywania jest ten sam co w poprzednich raportach (decyzja niżej).
- Sprawdzone ręcznie: pełny diff `309e672..8ee2993` w `src/` i `scripts/`, `RoomLayer.show` dla braku tekstury, `roomArtCheck`, `ROOM_ART`, brak pozostałości `furnishings` w `src/`, `scripts/`, `vite/` (zostały tylko w testach, które pilnują jego braku), brak logów renderera w `src/`, liczniki przeglądu na obu commitach.
- **Sonda lokalna (nie runtime aplikacji):** funkcja `recolour` załadowana z `scripts/recolour-board.py` (`python3 -I`, Pillow 12.1.0, numpy 2.4.3) na syntetycznym obrazie 60×40: bez zieleni → wynik cały 0, `exit=0`, trzy `RuntimeWarning`; z zielonym pasem przy krawędzi → wynik poprawny (90–215). Nic nie zostało zapisane w repozytorium.
- **Nieudowodnione:** czy filtry ColorMatrix renderują się w teksturze dynamicznej tła za notesem i w miniaturze (FU-SS F2/F6, wymaga piksela); zachowanie filtrów po utracie i przywróceniu kontekstu WebGL w `RoomScene` (scena nie słucha `RESTORE_WEBGL`; obrazy i filtry odtwarza Phaser, statycznie nie do potwierdzenia); jaki renderer wybiera `AUTO` na tabletach rodziny; koszt klatek filtrów na tablecie (FU-SS 5); rzeczywiste działanie `npm run art` na pełnym kicie (folder `designs/` jest lokalny, konwersja nie była uruchamiana).

## Autonomous decisions

- **Obszary:** przyjęte z argumentów kroku bez pytania (AskUserQuestion zakazane kontraktem). Odrzucone: propozycja rotacji obszarów. Zmieniłoby to: polecenie kroku bez argumentów.
- **Dowód w czasie działania:** nie uruchomiony (`runtime_proof: not-run`), zgodnie z poleceniem „static, no --runtime”. Wykonana jedynie lokalna sonda funkcji Pythona, bez uruchamiania aplikacji ani worktree. Zmieniłoby to: `--runtime` w poleceniu.
- **Bez subagentów:** zamiast domyślnego rozdzielenia na audytorów obszarów i infrastruktury audyt wykonany w jednym przebiegu, bo diff ma 15 plików, a infrastruktura (tracker, granica, logowanie) jest bez zmian od poprzedniego raportu. Zmieniłoby to: diff obejmujący `vite/`, `deploy/`, `src/main.ts` lub granicę błędów.
- **Waga M-1 jako MEDIUM, nie HIGH:** narzędzie lokalne, wynik commitowany i oglądany na bramce wizualnej runu; nie CRITICAL, bo człowiek widzi obraz przed merge. Zmieniłoby to: konwersja uruchamiana w CI bez bramki wizualnej.
- **`previous_report`:** najnowszy raport na `main` (2026-10-21 17:19); raporty z PR-ów #101 i #104 nie są na `main`, cytowane w § 7.
