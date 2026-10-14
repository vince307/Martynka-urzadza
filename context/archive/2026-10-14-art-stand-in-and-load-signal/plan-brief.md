# Polski stand-in obrazka, sygnał wczytania i import/reset po nieudanym odczycie — Plan Brief

> Full plan: `context/changes/art-stand-in-and-load-signal/plan.md`
> Research: `context/changes/art-stand-in-and-load-signal/research.md`

## What & Why

Audyt obserwowalności 2026-10-14 (PR #42) znalazł jeden CRITICAL: gdy obrazek monety, banknotu, odważnika lub dzbanka
się nie wczyta albo nie zdekoduje, zadanie pokazuje pudełko z angielskim id pliku (`coin-05gr`), a kwota jest tylko na
obrazku — dziecko zgaduje i nikt się o tym nie dowiaduje (S14-01..04, S14-11). Do tego import/reset po nieudanym odczycie
zapisu pokazuje świeżą sesję jako „Teraz” i może po cichu nadpisać zapis, którego nikt nie widział (S12-01). Przy okazji
stabilizujemy flaky limit czasu w `tests/spoken.test.ts`.

## Starting Point

`ArtImage.show` rysuje stand-in z `key.split('/').pop()`; `BootScene` ma tylko `console.warn` na `loaderror` (ślepe na
błąd dekodowania); `replace` odmawia tylko przy `fatal`; `UIScene.openImport/openReset` budują „Teraz” z `saver.current()`.

## Desired End State

Stand-in pokazuje polską wartość z danych („2 zł”, „10 dag”, „½ l”, „jabłko”) dopasowaną do pudełka, a runda pomija
umiejętności z wynikiem tylko na obrazku, gdy ich obrazków brak — bez blokowania odblokowania kroku. Rodzic widzi w
panelu sekcję „Obrazki” („3 z 38 obrazków nie wczytały się…”). Import i reset przy `unavailable` są odmawiane, przy
`unreadable` ostrzegają zamiast pokazywać „0 gwiazdek”.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Warstwy S14-01 | Polska etykieta zawsze + pomijanie MONEY_COUNT / MASS / CAPACITY `toLitres` przy brakach | Etykieta czyni zadanie rozwiązywalnym, pomijanie spełnia preferencję kontraktu „nie pokazywać” | Research / Plan |
| Zastój E2.2/E5.5 | Krok bieżący filtrowany tylko, gdy zostaje ≥ `ceil(unlockShare · n)` umiejętności | Brak obrazków nigdy nie blokuje odblokowania (FR-014, bez stanów porażki) | Plan (wbrew rekomendacji researchu) |
| Źródło zdrowia obrazków | `textures.exists` dla każdego wpisu `TASK_ART` w `BootScene.create` | Jedyny test łapiący 404 i błąd dekodowania | Research |
| Gdzie rodzic widzi | Sekcja „Obrazki” w panelu ustawień, rekord tylko w rejestrze | Wzór `saveHealthView`; karta błędu jest dla awarii fatalnej | Research |
| Etykiety | Pole `label` w `TASK_ART` z `formatMoney`, `WEIGHTS/JUGS.label`, `ICONS.noun` | Jedno źródło, bez nowych kluczy `pl.ts` | Research |
| S12-01 `unavailable` | Odmowa w `replace` i dialog tylko z „Zamknij” | `timeout` może ukrywać zdrowy zapis | Research |
| S12-01 `unreadable` | Ostrzeżenie zamiast „Teraz” + odesłanie do „Zachowaj kopię”, akcja dozwolona | Import kopii to zamierzona naprawa; bez trzymania `raw` w runtime | Plan |
| Szew e2e | `?e2eArt=missing` / `corrupt` w buildzie hook, marker `e2eArt` | SW precache przejmuje `page.route` | Research |
| Flaky test | `30_000` na trzech testach `forEachTask` | Ten sam wzorzec co `cd42b4a`, bez globalnego limitu | Research |

## Scope

**In scope:** S14-01, S14-02, S14-03, S14-04, S14-11, S12-01, rozgałęzienie logu `loaderror` po typie (część S14-08),
limit czasu `tests/spoken.test.ts`, gaps 66 (rewizja), 67, 68, zamknięcie dwóch follow-upów z archiwum.

**Out of scope:** S14-05..S14-10, S14-12, S12-02..S12-15, S13-*, kopia surowa w dialogu, ponowny odczyt magazynu,
zmiana `playable`/`unlockReady`/formatu zapisu, `deploy/`.

## Architecture / Approach

Czysta logika w `core` (`artHealth.ts`, `round/artFilter.ts`, `deviceSaveView`, odmowa w `autosave.replace`) z
opcjonalnymi parametrami, które bez braków nie zmieniają niczego (ten sam seed). Sceny tylko podają dane: `BootScene`
zapisuje rekord w `REGISTRY_KEYS.artHealth`, `TaskScene` przekazuje brakujące id do budowy rundy, `UIScene` daje widoki
panelowi i dialogom. `ArtImage` bierze etykietę z `TASK_ART`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. tdd — core zdrowia i filtra | `artHealth`, `artBlocked`, `withoutArtBlocked`, wpięcie w rundę/rozgrzewkę; limit spoken | Przesunięcie seedów, jeśli filtr zużyje rng |
| 2. tdd — core zapisu | `replace` odmawia przy `unavailable`; `deviceSaveView` | Zablokowanie zamierzonej naprawy przy `unreadable` |
| 3. impl — sygnał i filtr | Rekord w `BootScene`, szew `?e2eArt`, filtr w `TaskScene` | Wyciek szwu do `dist/` |
| 4. impl — linia panelu | Sekcja „Obrazki” (`artHealthView`) w panelu rodzica | Liczebnik w `artMissing` |
| 5. impl — stand-in | Polskie etykiety, dopasowanie tekstu w `ArtImage` | Czytelność w pudełku 84 px i obszarze 190 px |
| 6. impl — dialogi | Import/reset renderują `deviceSaveView` | Regresja `save-transfer.spec` |
| 7. impl — sweep | Komentarze, gaps, follow-upy, `CLAUDE.md` | Nieaktualne gaps 48/49/66 |
| 8. e2e #11 | `art-stand-in.spec.ts` (+4), 3 przerwy | Chromium tylko u orkiestratora |
| 9. e2e #2 | `save-transfer-blocked.spec.ts` (+2), 2 przerwy | Dojście do panelu po karcie `unavailable` |

**Prerequisites:** gałąź `feat/art-stand-in-and-load-signal`, research gotowy; e2e przez protokół request-file.
**Estimated effort:** 9 faz, ~9 sesji agentów (2 × tdd, 5 × impl, 2 × e2e; plan-review F1 rozdzielił dawną fazę 3).

## Open Risks & Assumptions

- Realna częstość braku obrazka na tablecie jest nieznana; szew dowodzi ścieżek, nie częstości.
- Uczeń na E5.5 przy trwałym braku dostaje zadania ze stand-inem (reguła progu) — świadomie.
- Dwie decyzje wbrew literze PRD do akceptacji opiekuna: FR-022 (brak importu/resetu przy `unavailable`) i FR-013 (skład rundy przy brakach).

## Success Criteria (Summary)

- Zadanie pieniężne, wagowe lub z dzbankami bez obrazka da się rozwiązać po polskiej etykiecie, a takie zadania rzadko w ogóle się pojawiają.
- Rodzic widzi w panelu, że obrazki się nie wczytały; e2e dowodzi tego także dla pliku niedekodowalnego.
- Żaden import ani reset nie nadpisze zapisu, którego gra nie odczytała z powodu `unavailable`.
