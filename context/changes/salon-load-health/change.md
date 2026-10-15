---
change_id: salon-load-health
title: Zapis v3 z migracją starego salonu, limit czasu ładowania grafiki i zapis po migracji przy starcie
status: planned
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Zmiana spoza roadmapy (autonomiczny run `2026-10-15-fix-salon-load-health`, jedyny slice, gałąź
`feat/salon-load-health` cięta z `main` @ `7f831c5`). Brak wiersza w roadmapie — statusów w
`context/foundation/roadmap.md` nie edytujemy.

**Źródło:** observability audit 2026-10-15_2010, PR #63 (niezmergowany; gałąź audytu nietykana): **H-1, H-2, M-3**
oraz **M-2** (ten sam kod). Zakres i zgoda na format zapisu v3 uzgodnione z opiekunem 2026-10-15 („Zapis v3 z
migracją”; kontrakt runu, „Slice-specific rules” → „fix salon-load-health”). Pozostałe ustalenia audytu → follow-upy
z `Trigger:`.

Wzorce (przykłady zmiany formatu z kopią): `context/archive/2026-10-14-minigame-daily-puzzle/` (v1 → v2,
`MIGRATIONS[1]`, kopia `backup-v1`, `migratedFrom`, `future`) i `context/archive/2026-10-15-save-v2-backup-health/`
(polityka kopii: `backupAttempts`, `withTimeLimit`, stan runtime `backup`/`backupError`, linia „przeniesiono” dopiero
po zapisie). Kod, na którym budujemy: `context/archive/2026-10-15-final-art-salon/` (S-16a: `remapLegacySalon`,
`LEGACY_SALON`, `?e2eSave=legacy-salon`, `ROOM_ART`, `LoadingScreen`). Plik `lessons.md` w `context/foundation/` nie
istnieje.

### Migracja tej zmiany: format zapisu v2 → v3

**Tak, ta zmiana zmienia format zapisu.** `SAVE_VERSION` 2 → 3 w `src/core/save.ts`; nowy krok `MIGRATIONS[2]`
(v2 → v3) przejmuje przeliczenie starego 10-slotowego salonu, które dziś robi `remapLegacySalon` przy wczytaniu
(`src/main.ts` `start`) i w podglądzie importu (`src/scenes/UIScene.ts`, `summarize`). Wymagania (kontrakt):

- dokładnie wzorzec v1 → v2: kopia surowego zapisu v2 pod własnym kluczem przed pierwszym zapisem v3 (ta sama
  polityka co `backup-v1`: `backupAttempts` prób, `writeTimeoutMs`, stan runtime, nigdy nie blokuje na zawsze);
  `src/storage/idb.ts` `backup` już pisze pod `${key}:backup-v${from}`, więc kopia v2 trafi pod
  `profile:default:backup-v2` bez zmiany układu magazynu;
- build sprzed tej zmiany widzi v3 jako `future` (`decodeSave`: `from > SAVE_VERSION`) i nigdy go nie nadpisuje
  (`replaceGate`) — to zamyka H-1 (rollback nie czyta po cichu przeliczonego `tasksDone`);
- `migratedFrom` w statusie runtime (już istnieje; teraz może być 1 albo 2);
- brak podwójnego przeliczenia: remap tylko w łańcuchu migracji, idempotentny na v3; `remapLegacySalon` znika z
  `main.ts` i z podglądu importu (import pliku v2 przechodzi przez `decodeSave`, więc migruje sam);
- M-2: stary salon rozpoznawany po **znanych starych** id slotów (`LEGACY_SALON.tasks`), nie po „dowolnym nieznanym
  kluczu”; nieznane klucze, które nie są stare, zostają;
- zamrożone fixture'y `tests/fixtures/save-v1*.json` i `save-v2*.json` zostają bajt w bajt; fixture'y v3 obok nich.

**Drzwi jednokierunkowe:** urządzenie, które wczytało build v3, po rollbacku do buildu v2 dostaje kartę `future`
(postęp bezpieczny, gra bez zapisu do powrotu nowego buildu). Wiersz `[human]` — zaakceptowane przez opiekuna w
kroku 0 runu. `deploy/README.md` może dostać jedną notatkę o tym (żadna inna zmiana w `deploy/`).

### Zakres

| Id | Co ma się zmienić (cel, nie rozwiązanie) |
|---|---|
| H-1 | Przeliczenie starego salonu jest krokiem migracji v2 → v3 z kopią v2 i odmową `future` po rollbacku; rollback nie pokazuje złych mebli i nie przelicza drugi raz. |
| M-2 | Znacznik starego salonu = znane stare klucze; zapis z dopisanym przyszłym slotem nie jest przeliczany ani okrajany. |
| H-2 | Zawieszone żądanie pliku w `BootScene.preload` kończy się po limicie (`loader.timeout` w konfiguracji gry, liczba w `src/data/balance.ts`) błędem ładowania → istniejąca ścieżka zastępstwa i licznik „Obrazki”; dowód e2e przez szew tylko w buildzie hooka (marker w `vite/e2eHookGuard.mjs`, nieobecny w `dist/`). |
| M-3 | Stan zmigrowany (v1 → v3 albo v2 → v3) jest oznaczony do zapisu przy starcie, więc migracja i jej log nie powtarzają się przy każdym uruchomieniu; moment zapisu nowego formatu widać w statusie runtime. |

### Weryfikacja twierdzeń audytu (repo @ `7f831c5`)

| Twierdzenie audytu | Repo teraz | Korekta |
|---|---|---|
| H-1: `remapLegacySalon` zmienia znaczenie `tasksDone` przy `SAVE_VERSION` = 2, poza `MIGRATIONS` | Potwierdzone: `src/core/save.ts` `SAVE_VERSION = 2`, `MIGRATIONS` ma tylko krok `1`; `src/main.ts` `start` woła `remapLegacySalon(repaired.session, LEGACY_SALON, SALON)` po `repairCurrentRoom` | brak |
| H-1: brak kopii starego salonu, brak `future` po rollbacku | Potwierdzone: kopia tylko przy `options.migrated` (`src/core/autosave.ts` `createAutosaver`), a remap nie ustawia `migrated`; zapis zostaje v2, więc stary build go przyjmuje | brak |
| H-1/podgląd importu: import widzi stan po remapie | Potwierdzone: `src/scenes/UIScene.ts` `summarize: (s) => saveSummary(remapLegacySalon(s, LEGACY_SALON, SALON).session, ROOMS)`; samo `replace` pisze zapis bez remapu (remap dzieje się dopiero przy przeładowaniu) | doprecyzowanie: po v3 import pliku v2 migruje w `decodeSave` (`parseImport`), więc podgląd i zapis widzą to samo bez osobnego remapu |
| M-2: znacznik = dowolny nieznany klucz `chosen` | Potwierdzone: `src/core/rooms.ts` `remapLegacySalon`, `Object.keys(old.chosen).some((key) => !newSlots.has(key))` | brak |
| M-3: przeliczony stan ustawiany w `preBoot` przed nasłuchem `setdata`/`changedata`, więc nieoznaczony do zapisu | Potwierdzone: `src/main.ts` `createGame` `preBoot` ustawia rejestr; `createAutosaver` i `registry.events.on('changedata'/'setdata')` powstają później w `start`; nic nie woła `saver.markDirty()` po remapie | rozszerzenie: ta sama luka dotyczy dziś migracji v1 → v2 (stan zmigrowany też nie jest oznaczony; zapis v2 pojawia się dopiero po pierwszej zmianie dziecka) — M-3 obejmie każdy `migratedFrom !== null` |
| H-2: brak `loader` w GameConfig, Phaser `loaderTimeout` = 0 | Potwierdzone: `src/main.ts` `createGame` bez klucza `loader`; `node_modules/phaser/src/core/Config.js` `this.loaderTimeout = GetValue(config, 'loader.timeout', 0)` | brak (zachowanie WebKit przy zawieszeniu nieudowodnione — audyt bez `--runtime`; e2e tej zmiany ma to pokazać) |
| L-3 (kontekst H-2): `loaderror` nazywa pliki pokoju „Task art” | Potwierdzone: `src/scenes/BootScene.ts` `preload`, `` `Task art failed to load: ${file.key}` `` | poza zakresem (follow-up), chyba że plan dotknie tego handlera przy H-2 |
| L-2: fixture'y v1/v2 mają pokój `living`, więc nie sprawdzają znacznika | Potwierdzone: `tests/fixtures/save-v1*.json`, `save-v2*.json` zawierają `"living"`; `FIRST_ROOM = 'salon'` | brak; fixture starego salonu w v2 jest naturalnym testem migracji (patrz decyzje) |
| Szew `?e2eSave=legacy-salon` i marker | Potwierdzone: `src/testing/e2eHook.ts` `E2ESaveSeam` zawiera `'legacy-salon'`, `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` zawiera `'legacy-salon'` | brak |

Żadne twierdzenie nie okazało się nieaktualne.

### Otwarte follow-upy z triggerem „v3 / następna zmiana formatu”

| Follow-up (źródło) | Trigger | Ocena zakresu (plan decyduje) |
|---|---|---|
| Prawdziwe e2e dwóch buildów (S-15 `minigame-daily-puzzle`; wcześniej autosave „two-build e2e”) | the next save-format change (v3) | **Ponowny trigger.** Jeden origin dla dwóch buildów wymaga nowej infrastruktury serwera; v2 → v3 pokryje szew `?e2eSave=legacy-salon`/v2 i zamrożone fixture'y (tak jak v1 → v2). |
| Kopia `backup-v1` nieczytelna z aplikacji (S-15, plan-review F5); SV2-04 + opcja B (`save-v2-backup-health`) | v3 save format / lost progress | **Częściowo:** v3 dodaje `backup-v2` tą samą ścieżką; odczyt kopii w aplikacji (eksport za bramką) i „v1 czytelny po przejściu” — ponowny trigger (osobna funkcja UI). |
| `migration-failed` nadpisywalny jak `corrupt` (S-15 F7; F7, SRR-09, SRR-01 w `save-v2-backup-health`) | a migration step that can throw (v3) | **W zakresie do oceny:** `MIGRATIONS[2]` działa na surowym, niezwalidowanym zapisie, więc może rzucić. Minimum: krok totalny (zły kształt przechodzi dalej do `validateSave` → `corrupt`) z testem; plan sprawdza, czy `replaceGate` ma traktować `migration-failed` jak `future`. |
| `Autosaver.replace` nie bierze kopii (S-15) | replace before first write after migration, or v3 | **Już zamknięte** przez `save-v2-backup-health` (`replace` bierze należną kopię raz) — korekta w planie; sprawdzić, że dotyczy też kopii v2. |
| Impl-review F3/F4: `replace` oznacza kopię `skipped` po jednej porażce, log `attempts: 0` (`save-v2-backup-health`, powtórzone w `final-art-salon`) | next change to `replace`, or the v3 save format | **Może jechać razem** (mały, ten sam kod `createAutosaver` `replace`, ta sama polityka kopii, którą v3 obciąża drugi raz). |
| S13-06 / design-gaps 58: podgląd błędów rodzica bez rysunku (S-13, S-13b, S-15) | the next save-format change or S-17 | **Ponowny trigger** (S-17): zmiana kształtu `example` w historii, niezwiązana z audytem. |
| Przykład błędu `digits` jako liczba (S-14b), INEQUALITY jedna kanoniczna odpowiedź (S-14c), portfel MONEY_PAY (S-14d) | a v3 save that records the example differently | **Ponowny trigger:** ta v3 nie zmienia kształtu `example`; trigger przechodzi na „zapis, który zmienia kształt przykładu błędu, albo S-17”. |
| Ryzyko rollbacku po remapie (S-16a `final-art-salon`, „Rollback risk”) | any deploy rollback of the S-16a build | **Zamknięte przez H-1** (karta `future` zamiast złych mebli) + notatka w `deploy/README.md`. |
| M-S1 reguła wdrożenia dla zapisu (`save-observability-c1-c2`) | first save-format change or next change to deploy/ | **W zakresie jako notatka** w `deploy/README.md` (rollback poniżej buildu v3 = karta `future`); nic więcej w `deploy/`. |
| Dwie karty jednego originu (autosave, export-import-reset) | first save-format change (v2), or lost progress | **Ponowny trigger** (wymaga `BroadcastChannel`/licznika; poza audytem). |

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Wybrane: research (prompt kroku to ustala; migracja +
   kopia + szew e2e zawieszenia dotyka `save.ts`, `autosave.ts`, `main.ts`, `UIScene`, `BootScene`, hooka).
   Odrzucone: `/10x-frame` — ramę ustalił opiekun (v3 z migracją). Zmieniłoby to: opiekun cofający zgodę na v3.
2. **Kopia przy każdej migracji v2 → v3, nie tylko dla starego salonu.** Wybrane: każdy zapis v2 dostaje
   `backup-v2` (jedna, jednolita polityka jak v1 → v2; `store.backup` już kluczuje po `from`). Odrzucone: kopia tylko
   przy faktycznym remapie (warunkowa ścieżka, druga reguła do testowania). Zmieniłoby to: research pokazujący, że
   druga kopia przekracza budżet magazynu albo podwaja porażki kopii na realnych urządzeniach.
3. **M-3 obejmuje każdą migrację, nie tylko salon.** Wybrane: `markDirty` przy starcie gdy `migratedFrom !== null`
   (luka dotyczy też dzisiejszego v1 → v2). Odrzucone: tylko remap salonu. Zmieniłoby to: research pokazujący, że
   wymuszony zapis przy starcie koliduje z kartą `slow`/`unavailable` lub kolejnością `replaceGate`.
4. **Migracja ma dostęp do `LEGACY_SALON`/`SALON`.** Kierunek: `src/core` już importuje z `src/data` (np.
   `curriculum.ts`, `roomHit.ts`), więc krok może czytać dane wprost albo dostać je wstrzyknięte przez parametr
   `migrations` (`decodeSave(raw, migrations)` już to wspiera). Wybór techniki zostawiony planowi. Zmieniłoby to:
   reguła ESLint zabraniająca importu `data` w `save.ts`.
5. **Ride-along: L-1 i L-2** (testy na prawdziwych `LEGACY_SALON`/`SALON` i zamrożony `save-v2-legacy-salon.json`
   obok istniejących) są częścią dowodu migracji, nie osobną pracą; nowy fixture v2 nie zmienia zamrożonych.
   M-1 zamyka się kopią `backup-v2`. M-4 (pełna treść `console.warn`, zdanie w „Zapis gry”) — plan decyduje;
   minimum to linia „przeniesiono z wersji N”, która już istnieje dla v1. Zmieniłoby to: rozrost planu ponad ~6 faz.
6. **Poza zakresem (follow-upy z triggerem):** M-5, M-6, L-3..L-8, L-5r oraz follow-upy oznaczone w tabeli jako
   „ponowny trigger”. Zmieniłoby to: plan, który dotyka tego samego symbolu (wtedy reguła „next change to X” odpala).
