---
type: observability-audit
date: 2026-10-25 20:20
mode: audit
commit: 7770ae8
branch: docs/observability-audit-2026-10-25-audit-art-renderer
dirty_tree: false
areas: [art-pipeline-recolour-board-guard-mask-share-log-ci-skip, renderer-fallback-canvas-worn-ungraded-artfallbacks-boot-renderer-log-obrazki-wornplain]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-21_1719-naglowek-zadania-obrazki-kod-umiejetnosci.md
findings: { critical: 0, high: 0, medium: 0, low: 1 }
---

# Audyt obserwowalności: strażnik planszy w `npm run art`, sygnał renderera Canvas (2026-10-25)

Ten raport zamyka run `2026-10-25-audit-art-renderer`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #109 | fix `audit-art-renderer` (M-1 i L-1 z audytu PR #107, pouf pod „Wróć do notesu” jako design gap 174) | `7770ae8` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Konwersja grafik:** `npm run art` → `scripts/recolour-board.py` (strażnik udziału maski 5–30 % i wartości nieskończonych, linia udziału na stdout) oraz pomijanie `tests/recolourBoard.test.ts` w CI.
- **Fallback renderera:** Canvas bez filtrów → `applyWornGrade` zapisuje `artFallbacks.worn = 'ungraded'`, `BootScene.create` loguje renderer, „Obrazki” w panelu rodzica pokazuje `pl.settings.wornPlain`.

Zakres: diff runu `c123331..7770ae8` w `src/` i `scripts/` (9 plików; `vite/`, `deploy/`, `.github/` bez zmian). Poprzedni raport tego wątku (`2026-10-25_1157-salon-przed-remontem-cienie-konwersja-grafik.md`) leży w otwartym PR #107, nie na `main`; cytuję go jako „PR #107”. Follow-upy runu cytuję jako „FU-AAR” (`context/archive/2026-10-25-audit-art-renderer/follow-ups/review-fixes.md`), nie powielam. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (nowe).** Run zamknął oba ustalenia PR #107 (M-1, L-1).
- **M-1 naprawione:** `recolour` (`scripts/recolour-board.py`) rzuca `BoardError` przy wyniku z NaN/inf albo udziale maski poza 5–30 %; `main` zamienia to na `sys.exit` z nazwą pliku i nic nie zapisuje; `make-task-art.mjs` (pętla `ROOM_JOBS`) kończy `npm run art` kodem 1. Udział maski idzie na stdout (odziedziczony przez `execFileSync`, `stdio: inherit`).
- **L-1 naprawione:** `applyWornGrade` (`src/ui/wornGrade.ts`) zapisuje `worn: 'ungraded'` przez `recordFallback` w obu gałęziach `false` — jedno miejsce dla pokoju, miniatury, tła i duchów etapu; `UIScene.openSettings` czyta rekord, `artHealthLines` dodaje linię `worn`, `createArtHealthView` pokazuje `wornPlain` (sekcja zostaje `ok`, bo nic nie brakuje). `BootScene.create` pisze `console.info` z typem renderera raz na start.
- **Nowe LOW (L-2):** przedział 5–30 % jest ponad dwa razy szerszy od zmierzonych 13,5 %, a linia stdout nie podaje wartości oczekiwanej; maska, która wycieknie w pokój do ~29 %, przejdzie z kodem 0 i zostanie zauważona tylko okiem.
- **Pomijanie testu w CI jest jawne, nie ciche:** `tests/recolourBoard.test.ts` pisze powód na stderr i w nazwie `describe`, CI pokazuje „3 skipped”; znane jako FU-AAR 8. Lokalnie (przypięte Pillow/numpy) test przechodzi: 3/3 w tym audycie.

## 2. Model przechwytywania (zmiany względem PR #107)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA (`src/main.ts`, `type: AUTO`), bez trackera i sieci w grze. Kanały człowieka: ekran dziecka, karty DOM z `Kod:`, panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, log CI i smoke deployu; dla narzędzi lokalnych stdout/stderr i kod wyjścia w terminalu opiekuna (wyniki commitowane, CI ich nie przebudowuje).
- **Renderer:** nowy sygnał w dwóch kanałach: `console.info('Renderer: …')` w `BootScene.create` (w `try`, błąd odczytu → `console.warn`), oraz rekord runtime `REGISTRY_KEYS.artFallbacks.worn` (pierwszy zapis wygrywa, `noteFallback`), czytany raz przy otwarciu panelu rodzica.
- **Konwersja:** wynik `recolour` ma teraz asercje treści (udział maski, skończoność); proces dalej sprawdza wersje (`check_versions`) i kolor.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | c123331 | 7770ae8 |
  |---|---|---|
  | linie z `catch` | 68 | 69 (`BootScene.create`, renderer) |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 54 | 55 (ten sam `catch`) |
  | `console.info` | 3 | 4 (linia renderera) |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / terminal / CI | Werdykt |
|---|---|---|---|---|
| Tło bez zielonej planszy przy krawędzi | — (nic nie wychodzi) | — | `recolour-board: <plik>: … non-finite values`, kod 1 | widoczne (było M-1) |
| Obraz cały zielony / maska > 30 % | — | — | komunikat z udziałem, kod 1 | widoczne |
| Maska wycieka w pokój, udział 14–30 % | przemalowany fragment pokoju | „Obrazki” w porządku | linia udziału bez wartości oczekiwanej, kod 0 | **tylko oko** (L-2) |
| Renderer Canvas | wyciszenie zamiast postarzenia | linia `wornPlain` po zbudowaniu choć jednego postarzonego mebla | `Renderer: Canvas (no filters…)` | widoczne (było L-1) |
| Odczyt typu renderera rzuca | nic | nic | `console.warn('Renderer could not be read', error)` | widoczne w konsoli |
| Regresja strażnika w skrypcie | — | — | test czerwony lokalnie; w CI „skipped” + powód na stderr | znane (FU-AAR 8) |

## 4. Systemowe przyczyny źródłowe

1. **Asercja treści bez wartości odniesienia.** Strażnik odrzuca przypadki skrajne (brak planszy, cały obraz zielony), ale zmierzona wartość (13,47 / 13,45 %) żyje tylko w komentarzu przy `MIN_SHARE`/`MAX_SHARE`; log nie zestawia jej z wynikiem. Rozsądne lokalnie (luźny przedział nie łamie przyszłego kitu), ale środek przedziału zostaje bez sygnału. Wyjaśnia L-2.

## 5. Ustalenia według obszarów

### Konwersja grafik (`npm run art`)

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-2 | `scripts/recolour-board.py` `MIN_SHARE`/`MAX_SHARE`, `main` (linia `board mask`) | noise / missing-context | LOW | Zmieniony kit, w którym maska planszy przecieka w podłogę lub ścianę (np. zielonkawy dywan), daje udział 20–29 %: skrypt pisze „board mask 24.80%”, kod 0, część pokoju jest przemalowana na `#BCD799`. Testy, precache i smoke są zielone; zostaje tylko bramka wizualna. | Wypisywać udział razem z oczekiwanym (`expected ~13.5%`) lub ostrzegać (stderr, bez zmiany kodu wyjścia) przy odchyleniu > kilka punktów od zmierzonej wartości; ewentualnie zawęzić przedział po decyzji opiekuna. Bez zmiany obliczeń (wynik bajtowo ten sam). |

### Fallback renderera

Bez ustaleń. Sprawdzone: oba `return false` w `applyWornGrade` wołają `recordFallback`; `noteFallback` nie nadpisuje pierwszego wpisu; `DrawnFallbackWhere` wyklucza `worn`, więc linia „rysunek zamiast obrazka” nie twierdzi niczego fałszywego; `createArtHealthView` liczy `missing` tylko z `missing`/`cut`/`font`, więc sam Canvas nie zmienia stanu sekcji; `console.info` stoi po powrocie z drugiego `create`, więc loguje raz; hook e2e na powitaniu podaje teraz `artFallbacks` (tylko build e2e). Linia `wornPlain` pojawia się dopiero po zbudowaniu postarzonego obrazu (pokój, miniatura, tło, duch etapu) — salon w pełni odnowiony nie ma czego zgłaszać, co jest zgodne z prawdą; konsola mówi o rendererze od startu.

## 6. Zalecana kolejność poprawek

1. **L-2** — jedna linia stdout z wartością oczekiwaną albo ostrzeżenie przy odchyleniu. Kilka linii Pythona, przy następnej zmianie `scripts/recolour-board.py` (ten sam wyzwalacz co FU-AAR 8). Ograniczenie: zachować bajtową powtarzalność wyniku.

## 7. Zmiany od ostatniego audytu

Poprzedni raport na `main` (2026-10-21 17:19) obejmował inne obszary; ustalenia tych obszarów pochodzą z raportu w PR #107 (2026-10-25 11:57).

| Poprzedni id | Status | Dowód |
|---|---|---|
| PR #107 M-1 (czarne tło z kodem 0) | fixed | `recolour` → `BoardError` (NaN/inf, udział poza 5–30 %), `main` → `sys.exit` z nazwą pliku, nic nie zapisuje; `tests/recolourBoard.test.ts` 3/3 lokalnie w tym audycie |
| PR #107 L-1 (Canvas bez śladu) | fixed | `applyWornGrade` → `recordFallback(scene, 'worn', 'ungraded')`; `artHealthLines` linia `worn`; `pl.settings.wornPlain`; `BootScene.create` `console.info`; e2e `tests/e2e/canvas-renderer.spec.ts` (run: 167 e2e) |
| N-7, N-8 (raport 2026-10-21) | not re-checked | poza obszarami; run nie dotknął `headingOf` ani `variety.ts` |

## 8. Metoda i ograniczenia

- Audyt wykonany w jednym przebiegu, bez subagentów (decyzja niżej): diff ma 9 plików kodu, infrastruktura przechwytywania bez zmian.
- Sprawdzone ręcznie: pełny diff `c123331..7770ae8` w `src/` i `scripts/`, `recordFallback`/`noteFallback`, wywołanie Pythona w `make-task-art.mjs` (`stdio`, `process.exit(1)`), `UIScene.openSettings` (źródło `fallbacks`), `createArtHealthView` (stan sekcji), `.github/workflows/ci.yml` (brak Pythona z przypięciami), liczniki na obu commitach. Uruchomione: `npx vitest run tests/recolourBoard.test.ts tests/artHealthLines.test.ts tests/salonStyleWiring.test.ts` → 39 passed (lokalny Python ma przypięte wersje, test nie był pominięty).
- **Nieudowodnione:** jaki renderer wybiera `AUTO` na tabletach rodziny; czy filtry ColorMatrix renderują się w teksturze dynamicznej tła i miniatury (FU-AAR 4, 6); zachowanie `npm run art` na pełnym kicie (folder `designs/` lokalny, konwersja nie była uruchamiana w tym audycie — run zmierzył ją jako bajtowo identyczną); obecność linii `wornPlain` na prawdziwym urządzeniu z Canvas (dowód tylko przez flagi Chromium w e2e runu).

## Autonomous decisions

- **Obszary:** przyjęte z argumentów kroku bez pytania (AskUserQuestion zakazane kontraktem). Odrzucone: rotacja obszarów. Zmieniłoby to: polecenie kroku bez argumentów.
- **Dowód w czasie działania:** nie uruchomiony (`runtime_proof: not-run`), zgodnie z poleceniem „static; no runtime proof”. Uruchomiono tylko istniejące testy jednostkowe jako wyrywkową weryfikację. Zmieniłoby to: `--runtime` w poleceniu.
- **Bez subagentów:** zamiast domyślnego rozdzielenia na audytorów obszarów i infrastruktury, bo diff jest mały, a tracker, granica i logowanie są bez zmian od PR #107. Zmieniłoby to: diff w `vite/`, `deploy/`, `src/main.ts` lub granicy błędów.
- **`previous_report`:** najnowszy raport na `main` (2026-10-21 17:19); raport z PR #107 nie jest na `main`, cytowany w § 7.
- **Pomijanie testu w CI nie jest nowym ustaleniem:** jawne (stderr, nazwa `describe`, licznik skipped) i już zapisane jako FU-AAR 8. Zmieniłoby to: obraz CI z przypiętym Pillow/numpy, w którym test nadal by się pomijał.
- **Waga L-2 jako LOW:** narzędzie lokalne, wynik commitowany i oglądany na bramce wizualnej; ekstremalne przypadki już odrzucane. Zmieniłoby to: konwersja w CI bez bramki wizualnej.
