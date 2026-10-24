---
type: observability-audit
date: 2026-10-24 18:25
mode: audit
commit: e020886
branch: docs/observability-audit-2026-10-23-fox-guide
dirty_tree: false
areas: [task-screen-guide-fox-pose-over-round, boot-ui-art-fox-textures-obrazki-uiArtHealth, missing-fox-art]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-21_1719-naglowek-zadania-obrazki-kod-umiejetnosci.md
findings: { critical: 0, high: 0, medium: 0, low: 2 }
---

# Audyt obserwowalności: lisek przewodnik, jego obrazki w „Obrazkach”, brak grafiki liska (2026-10-24)

Ten raport zamyka run `2026-10-23-fox-guide`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #102 | fix `fox-guide` (PRD FR-037: cichy lisek w marginesie zeszytu, pozy idle/cheer/think, trzy wiersze `UI_ART`, `tests/bootBudget.test.ts`) | `3d6f0e8` (main `e020886`), deploy, `check:deploy` 23/23 |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Ekran zadania:** zmiana pozy `GuideFox` w trakcie rundy (`guidePose` nad `RoundPhase` i ekranem, wywoływane w `TaskScene.render`).
- **Start i „Obrazki”:** tekstury liska jako wiersze `UI_ART` ładowane w `BootScene` (grupa `ui` w `bootQueue`), rekord `REGISTRY_KEYS.uiArtHealth`, trzecia linia „Obrazków” (`artHealthLines`), konsola, smoke deployu.
- **Brak grafiki liska:** co widzi dziecko, rodzic, konsola i hook, gdy brakuje jednej lub wszystkich póz.

Zakres: diff runu `1962312..e020886` w `src/` i `scripts/` (9 plików, +157/−8; `vite/`, `deploy/`, `.github/` i `src/testing/` bez zmian). Raport z otwartego PR #101 (`2026-10-23_0742-tlo-salonu-animacje-czcionka.md`, gałąź `docs/observability-audit-2026-10-22-notebook-polish`, jeszcze nie na main) cytuję po id (B-1, B-2, A-1, C-1) i nie powielam; dlatego `previous_report` wskazuje ostatni raport na main. Follow-upy runu cytuję jako „FU-FG n” (`context/archive/2026-10-23-fox-guide/follow-ups/review-fixes.md`). Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW.** Run nie dodał żadnego `catch`, `console.*`, parametru `?e2e…` ani zmiany w hooku e2e poza polem `guide` migawki zadania; liczniki przeglądu repozytorium są identyczne jak na `1962312`.
- **Ścieżka sygnału liska jest w większości kompletna i nie wymagała nowego kodu:** trzy pozy to zwykłe wiersze `UI_ART`, więc brak pliku trafia do `uiArtHealth` (z przyczyną `fetch`/`network`/`decode`/`cut` przez `withCauses` i kontrolą rozmiaru `wrongSize`), do linii „Obrazki” `uiArtMissing`, do `console.warn('UI art missing: … guideThink')`, a smoke deployu pokrywa pliki przez `precacheCovers('screen pictures', …, UI_ART…)`. Hook podaje `guide: { pose, visible, rect, interactive, pops }`, a e2e `#11` (seam `?e2eArt=ui`) dowodzi, że runda bez liska gra do podsumowania.
- **LOW G-1:** rodzic nie dowie się, że brakuje *liska*: linia UI mówi o „napisie lub rysunku”, którego dla liska nie ma (to już FU-FG 6), a `GuideFox.show` nie woła `recordFallback`, więc linia `artFallback` (`FALLBACK_ORDER`: wallet, notebook, miniature, loading) też go nie wymienia. Jedynym miejscem z nazwą pozy jest konsola tabletu.
- **LOW G-2:** brak *jednej* pozy daje migający lisek (np. bez `think` znika po każdym błędzie i wraca po dobrej odpowiedzi), a migawka mówi wtedy `pose: null, visible: false` i gubi, o którą pozę scena prosiła. E2e sprawdza tylko brak wszystkich obrazków ekranów naraz.
- **Bez zmian od PR #101:** B-1 (tło salonu po utracie kontekstu WebGL) nadal otwarte, w `src/` dalej brak `restorewebgl`/`contextlost`; tekstury liska są wczytane z plików, nie są `DynamicTexture`, więc B-1 ich nie dotyczy (nie dowiedzione na urządzeniu).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-23 07:42 z PR #101)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci w czasie gry. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`errorCode` w `src/core/save.ts`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, hook e2e (tylko build `E2E_HOOK=1`), log CI smoke'u deployu.
- **Ładowanie liska:** `src/data/uiArt.ts` `UI_ART` dostał `guideIdle`/`guideCheer`/`guideThink` (`fox-*.webp`, 384 × 384, etykieta `''`), `UI_ART_KEYS` klucze `ui/fox-*`. `BootScene` kolejkuje je w grupie `ui` (`queuers.ui`, seam `?e2eArt=ui` podmienia URL na brakujący), pod jednym limitem `balance.loader.totalMs` (50 s; `tests/bootBudget.test.ts` pilnuje 2 s zapasu, FU-FG 4). W `create`: `withCauses('Ui', UI_ART, artHealth(…))` → `REGISTRY_KEYS.uiArtHealth` + `console.warn('UI art missing: N of 8: <ids>')`.
- **Rysowanie:** `GuideFox` (`src/ui/widgets/GuideFox.ts`) tworzony w `TaskScene.create` po `drawNotebook`, niewidoczny na starcie. `TaskScene.render` liczy ekran (`unlock` > `summary` > `task`) i woła `guide.show(guidePose(screen, state.phase))`. `show` ukrywa liska dla `null` i dla pozy, której tekstura nie istnieje (`textures.exists`), bez zastępczego pudełka (gap 168); zmiana pozy widocznego liska daje `pop` (tween skali), pomijany pod `prefersReducedMotion()`; `pops` liczy dodane tweeny.
- **Raport do rodzica:** `UIScene.openSettings` → `artHealthLines({ ui: uiArtHealth, fallbacks: artFallbacks, … })` → `artHealthView`: `uiArtOk` albo `uiArtMissing(count, total)` + linia przyczyny i rady o restarcie (`mainCause`, `restartHelps`). Etykiet brakujących obrazków ekranów nie ma (etykiety są tylko dla pokoju), a linia `artFallback` wymienia tylko ekrany z `FALLBACK_ORDER`.
- **Deploy:** `scripts/check-deploy.ts` `precacheCovers('screen pictures', precache, UI_ART.map(a => a.url))` z SHA; nowe pliki liska weszły do kontroli bez zmiany skryptu (smoke 23/23 po merge'u, cytowane z run-logu).
- **Przegląd repozytorium** (`src/` bez `src/testing`, ten sam wzorzec co poprzednio):

  | | 1962312 | e020886 |
  |---|---|---|
  | linie z `catch` | 68 | 68 |
  | puste `catch {}` | 0 | 0 |
  | `console.error` | 9 | 9 |
  | `console.warn` | 53 | 53 |

## 3. Co dociera do obserwatora (statycznie; e2e runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola / hook / CI | Werdykt |
|---|---|---|---|---|
| Wszystkie obrazki ekranów brakują (`?e2eArt=ui`) | brak liska, runda gra | „Obrazki”: N z 8 obrazków ekranów… „napis lub rysunek”; linia `artFallback` wymienia portfel/zeszyt, nie liska | `UI art missing: … guideIdle, guideCheer, guideThink`; hook `guide.visible: false`; e2e `#11` | **widoczne**, lisek nienazwany u rodzica (G-1) |
| Brak jednej pozy (np. `fox-think.webp` 404 lub zły plik) | lisek znika po każdym błędzie, wraca po dobrej odpowiedzi | „Obrazki”: 1 z 8 … „napis lub rysunek” | konsola nazywa `guideThink`; hook `pose: null, visible: false` (bez żądanej pozy) | tylko konsola (G-2) |
| Plik liska odcięty limitem startu | jak wyżej | linia `artCut` + rada o lepszym internecie | `bootLoad.cutByTable.ui` | **widoczne** |
| Plik liska poza precache nowego wydania | — | — | smoke `precache covers screen pictures` FAIL (tylko z SHA) | **widoczne w CI** |
| Plik liska o złym rozmiarze | lisek w 320 px (`setDisplaySize` kompensuje) | nic | `wrongSize` w rekordzie i konsoli | **widoczne w konsoli**; bez wpływu na dziecko |
| Lisek przestaje zmieniać pozę (regresja w `render`) | stała poza | nic | e2e `#11` (idle → cheer → think → cheer) czerwone | **złapane w e2e** (Chromium) |
| Wyjątek w `GuideFox` (create/render) | karta „Ups!” | `Kod:` z nazwą błędu | stack w konsoli | **diagnozowalne** |
| Pop się nie odpala | brak ruchu | nic | `pops` liczy dodanie tweena, nie wykonanie | rodzina A-1 z PR #101 |

## 4. Systemowe przyczyny źródłowe

1. **Rekord obrazków ekranów zna liczbę, nie ekran.** `artHealthLines` ma etykiety tylko dla pokoju, a rejestr zastępstw (`recordFallback`, `FALLBACK_ORDER`) zna tylko ekrany z rysowanym zastępstwem. Lisek nie ma zastępstwa (decyzja opiekuna, gap 168), więc nie pasuje do żadnej z dwóch szuflad. Wyjaśnia G-1; FU-FG 6 notuje sam nieprawdziwy tekst.
2. **Migawka liska opisuje wynik, ale nie żądanie.** `GuideFox.snapshot` zwraca `pose` po decyzji o teksturze; żądanie z `guidePose` ginie, gdy tekstury brak. Wyjaśnia G-2. (Odwrotnie niż B-2 z PR #101, gdzie rekord tła opisuje zamiar, a nie wynik.)

## 5. Ustalenia według obszaru

### 5.1 Ekran zadania: poza liska w rundzie

Bez ustaleń. `guidePose` jest czystą funkcją z wyczerpującymi `switch` (`never`), `render` woła ją przy każdym przerysowaniu, `show` zabija tweeny przed każdą zmianą, a e2e `#11` przechodzi całą ścieżkę idle → cheer → think (druga próba, rozwiązanie, przepisanie) → cheer na podsumowaniu, ukrycie na karcie odblokowania i powrót po niej oraz brak reakcji na dotyk (`interactive: false`). `tests/guideWiring.test.ts` pilnuje, że `render` woła `guidePose(` dokładnie raz przed pierwszym `return`, a widżet nie bierze wejścia i pyta o ograniczony ruch przed tweenem. Uwaga bez rangi: `pops` liczy dodanie tweena, nie jego wykonanie (rodzina A-1 z PR #101, nie powielam).

### 5.2 Start i „Obrazki”: tekstury liska

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| G-1 | `src/ui/widgets/GuideFox.ts` `GuideFox.show` (gałąź bez tekstury, brak `recordFallback`); `src/core/artPick.ts` `FALLBACK_ORDER`; `src/core/artHealth.ts` `artHealthLines` (etykiety tylko dla pokoju); `src/data/pl.ts` `pl.settings.uiArtMissing` | missing-context | low | Gdy brakuje liska, rodzic w „Obrazkach” czyta „N z 8 obrazków ekranów nie wczytało się. Na tych ekranach zamiast obrazka jest napis lub rysunek.” Nie wie, który ekran, a zdanie jest nieprawdziwe dla liska (FU-FG 6). Linia `artFallback` nie wymienia liska, bo `GuideFox` nic nie zapisuje do `REGISTRY_KEYS.artFallbacks`. Zgłoszenie „lisek zniknął” nie ma u rodzica punktu zaczepienia; nazwa pozy jest tylko w konsoli tabletu. Kosmetyczne: gra, gwiazdki i zapis działają. | Razem z FU-FG 6: `recordFallback(scene, 'guide', 'none')` w gałęzi bez tekstury i `guide` w `FallbackWhere`/`FALLBACK_ORDER` z nazwą w `pl.settings.artFallbackNames` („lisek”), albo osobne zdanie dla obrazków bez zastępstwa; tekst tylko w `src/data/pl.ts`, rekord runtime, poza zapisem. |

### 5.3 Brak grafiki liska

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| G-2 | `src/ui/widgets/GuideFox.ts` `GuideFox.show` (`this.pose = null` przy braku tekstury), `GuideFox.snapshot`; `tests/e2e/fox-guide.spec.ts` (`#11 no fox without its art` tylko z `?e2eArt=ui`) | missing-context | low | Brak jednej pozy (404 jednego pliku, uszkodzony WebP, ręczna podmiana paczki) daje liska, który pojawia się i znika zależnie od fazy rundy. Dziecko widzi miganie zamiast „liska nie ma”, rodzic widzi tylko licznik 1 z 8, a hook mówi `pose: null, visible: false`, więc test nie odróżni „lisek ukryty na karcie odblokowania” od „brak tekstury pozy, o którą scena prosiła”. Ścieżki częściowego braku nie ćwiczy żaden test. | W migawce dodać `requested: GuidePose \| null` (wynik `guidePose`) obok `pose`; rozważyć regułę „brak dowolnej pozy = brak liska w ogóle” (stabilny obraz zamiast migania) albo pozę zastępczą `idle`; jeden test e2e lub jednostkowy z brakiem tylko `fox-think` (seam w obrębie markera `e2eArt`). |

### 5.4 Platforma i infrastruktura

Run nie zmienił `vite/`, `deploy/`, `.github/` ani `scripts/check-deploy.ts`; `scripts/make-task-art.mjs` (lokalny, poza CI) dostał trzeci katalog paczki i kończy się `process.exit(1)` z nazwą katalogu, gdy go brak. Wiersz `balance.loader` ma zaktualizowany komentarz budżetu (2 378 800 B, 47,6 s przy 50 KB/s); limit 50 s bez zmian, `tests/bootBudget.test.ts` jest nowym wyzwalaczem decyzji (FU-FG 4).

## 6. Rekomendowana kolejność poprawek

1. **B-1 + B-2 z PR #101** (tło salonu po utracie kontekstu WebGL): nadal jedyne MEDIUM z ostatnich dwóch runów, bez zmian w kodzie.
2. **G-1 razem z FU-FG 6:** jedna zmiana tekstu w `pl.ts` i jeden wpis `guide` w rejestrze zastępstw; mała i zamyka oba.
3. **G-2:** pole `requested` w migawce plus test częściowego braku; przy okazji decyzja opiekuna, czy lisek z brakującą pozą ma znikać całkiem.
4. Pozostałe otwarte MEDIUM i LOW z wcześniejszych raportów (Z-1, Z-3..Z-6, H-3, H-4, C-4, C-5, I-4, I-9; N-7, N-8; A-1, C-1 z PR #101).

Ograniczenia: nic nie opuszcza urządzenia; tekst tylko w `src/data/pl.ts`; `src/core` bez przeglądarki i Phasera; zapis zostaje v4 (żaden rekord z tej listy nie trafia do zapisu).

## 7. Zmiany od ostatniego audytu

Ostatni raport na main to 2026-10-21 17:19; raport 2026-10-23 07:42 jest w otwartym PR #101 i jego ustalenia sprawdzam tu również.

| Poprzedni id | Status | Dowód |
|---|---|---|
| B-1 (PR #101: tło po utracie kontekstu WebGL) | still open | `git grep restorewebgl\|contextlost e020886 -- src` nic nie zwraca; `SalonBackdrop.ts` poza diffem runu. |
| B-2, A-1 (PR #101) | still open | `SalonBackdrop.render`, `TaskScene.bounce`/`wobble` poza diffem; `GuideFox.pops` powtarza wzorzec A-1 (licznik dodania tweena). |
| C-1 (PR #101: `docs/art-inventory.md` o czcionce) | still open | Wiersz 27 nadal mówi o `AtkinsonHyperlegibleNext.ttf` „w `public/fonts/`”; run zmienił tylko `docs/design-gaps.md` i `docs/human-checklist.md`. |
| N-7, N-8 (2026-10-21) | not re-checked | `TaskScene.currentNarration`, `variety.ts` `repairCap` poza diffem runu (diff `TaskScene` to tylko lisek). |
| H-3..H-11, Z-1..Z-12, C-4..C-10, I-2..I-11, N-2, N-5, N-6 | not re-checked | `artHealth.ts`, `BootScene.ts`, `autosave.ts`, `src/storage/`, `vite/`, `deploy/` bez zmian w diffie runu (poza danymi `UI_ART`, które `BootScene` czyta generycznie). |
| FU-FG 4, 6 (follow-upy runu) | cytowane, nie powielane | G-1 rozszerza FU-FG 6 o brak wpisu w rejestrze zastępstw. |

## 8. Metoda i ograniczenia

- **Sposób:** jeden czytelnik diffu runu (ten agent), bez subagentów, jak w trzech poprzednich raportach: około 160 dodanych linii w `src/` i `scripts/`. Przeczytane: pełny diff `src/` i `scripts/make-task-art.mjs`, ścieżka `BootScene` (`queuers.ui`, `withCauses`, `uiArtHealth`, `recordFallback('loading')`), `artHealthLines` i `mainCause` w `src/core/artHealth.ts`, `artHealthView.ts`, `UIScene.openSettings`, `FALLBACK_ORDER` w `artPick.ts`, `pl.settings.uiArt*`, nagłówki testów `tests/e2e/fox-guide.spec.ts`, follow-upy runu i gapy 165-168.
- **Sprawdzone ręcznie:**
  - `GuideFox.show` sprawdza `textures.exists` przed `setTexture`, więc brak pozy nigdy nie rysuje `__MISSING`; konstruktor tworzy obraz niewidoczny;
  - `recordFallback` wołają tylko `BootScene` (loading), `CoinWallet`, `UnlockCard`, `RoomDoneCard` — nie `GuideFox`;
  - `scripts/check-deploy.ts` `precacheCovers('screen pictures', …)` bierze cały `UI_ART`, więc pliki liska są w kontroli smoke'u bez zmiany skryptu;
  - liczniki przeglądu repozytorium identyczne na `1962312` i `e020886`; `src/testing/` bez zmian (pole `guide` siedzi w `TaskSnapshot` w `TaskScene.ts`).
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond, przeglądarki ani e2e; zielone bramki runu (CI, e2e, visual gate, deploy smoke 23/23) cytowane z `run-log.md`, nie powtarzane. Produkcja niesprawdzana.
  - G-2: zachowanie przy braku jednej pozy wywnioskowane z kodu `show`; żaden test go nie ćwiczy.
  - Czy Safari na iPadzie po utracie kontekstu WebGL przywraca tekstury liska wczytane z plików (zakładam, że tak, bo Phaser odtwarza tekstury ze źródła obrazu; nie sprawdzone w źródle Phasera ani na urządzeniu).
  - Pop liska i ostrość 384 px przy 320 px na tablecie: tylko visual gate runu w Chromium (FU-FG 3).

## Autonomous decisions

- **Obszary:** wzięte dosłownie z argumentów kroku (bez AskUserQuestion); odrzucona rotacja na nieaudytowane przepływy, bo krok zamyka run i ma audytować to, co run wydał. Zmieniłoby to: polecenie opiekuna, by audytować inne przepływy.
- **Dowód w czasie działania:** nie uruchamiany (krok mówi „static”); Chromium i tak nie startuje w sandboksie agenta. Zmieniłoby to: `--runtime` w poleceniu kroku.
- **Subagenci:** nie uruchamiani (domyślnie skill rozdziela audyt na obszary i audytora infrastruktury); wybrany jeden czytelnik, bo diff ma około 160 linii, nie dotyka zapisu, `vite/`, `deploy/` ani granicy błędów, a model przechwytywania jest stabilny od kilku runów. Zmieniłoby to: diff dotykający tych miejsc.
- **`previous_report`:** wskazuje ostatni raport na main (2026-10-21 17:19), bo raport z PR #101 nie jest na main; jego ustalenia są śledzone w sekcji 7 po id. Zmieniłoby to: merge PR #101 przed tym PR (wtedy następny audyt powinien wskazać raport 2026-10-23 07:42).
- **Ważność G-1 i G-2:** LOW, nie MEDIUM: lisek jest dekoracyjny, jego brak nie zmienia rundy, gwiazdek ani zapisu, a konsola nazywa brakującą pozę. Zmieniłoby to: playtest, w którym migający lisek rozprasza dziecko (wtedy G-2 MEDIUM).
