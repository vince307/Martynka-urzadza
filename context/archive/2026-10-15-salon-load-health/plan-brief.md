# Zapis v3 z migracją starego salonu, limit ładowania grafiki, zapis po migracji przy starcie — Plan Brief

> Full plan: `context/changes/salon-load-health/plan.md`
> Research: `context/changes/salon-load-health/research.md`

## What & Why

Audyt obserwowalności 2026-10-15_2010 (PR #63) wykazał trzy luki po S-16a: przeliczenie starego 10-slotowego salonu
zmienia znaczenie `tasksDone` bez zmiany wersji zapisu (rollback po cichu pokazuje złe meble — H-1, znacznik po
„dowolnym nieznanym kluczu” — M-2), zawieszony plik grafiki trzyma pasek ładowania w nieskończoność (H-2), a stan
zmigrowany nie jest zapisywany, dopóki dziecko czegoś nie zmieni (migracja powtarza się przy każdym starcie — M-3).

## Starting Point

Zapis v2 (`src/core/save.ts`, `MIGRATIONS[1]`); `remapLegacySalon` wołane przy starcie w `src/main.ts` i w podglądzie
importu; autosaver robi kopię tylko przy `options.migrated`; `createGame` bez klucza `loader` (Phaser: brak limitu).

## Desired End State

Format v3: przeliczenie salonu jest krokiem `MIGRATIONS[2]` na zamrożonych tabelach, z kopią surowego v2
(`backup-v2`) i kartą `future` w starszym buildzie. Zmigrowany zapis trafia na dysk ~0,5 s po starcie, a status
runtime mówi kiedy. Zawieszony plik kończy ładowanie po ≤ 24 s; gra startuje na zastępstwach, „Obrazki” go liczą.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Format | v3 z `MIGRATIONS[2]`, kształt = v2 | Zgoda opiekuna; zmiana znaczenia pola wymaga wersji | Change / kontrakt |
| Dane kroku | Zamrożone tabele w `src/core/migrations/legacySalon.ts` | Migracja = czysta funkcja bajtów; żywe `SALON` rośnie | Research |
| `LEGACY_SALON` | Usunięte z `src/data`; stara lista tylko w kroku | Jedna prawda o liście, która się nie zmienia | Plan |
| M-2 | Znacznik = znane stare klucze; nieznane nie-stare zostają | Przyszły slot nie może być okrojony | Change / Plan |
| Kopia | `backup-v2` tą samą polityką; łańcuch z v1 = jedna kopia v1 | `store.backup` kluczuje po wersji pierwotnej | Research |
| M-3 | Autosaver sam uzbraja zapis przy `migrated` (`'migration'`, `migrationWrittenAt`) | Decyzja w `core`, testowalna, bez wyścigu z kartami | Plan |
| F3/F4 | Domknięte w fazie 2 | Trigger „v3 save format” odpalił, ten sam symbol | Plan |
| Loader | `timeoutMs 12000`, `maxRetries 1` | ≤ 24 s najgorzej; 289 KB mieści się na wolnej sieci | Plan |
| Dowód H-2 | SW zablokowany + wiszący `page.route` + szew `?e2eArt=stall` | Testuje prawdziwy loader, bez nowej infrastruktury | Research |

## Scope

**In scope:** H-1, M-2, H-2, M-3; M-1, L-1, L-2, F3/F4 przy okazji; notatka w `deploy/README.md`; `CLAUDE.md`; follow-upy.

**Out of scope:** nowe pola zapisu; odczyt kopii z aplikacji; e2e dwóch buildów; `migration-failed` w `replaceGate`
(krok nie może rzucić); M-4..M-6, L-3..L-8; limit `FontFace`; WebKit w Playwright; inne zmiany w `deploy/`.

## Architecture / Approach

`decodeSave` → `MIGRATIONS[1]` (v1 → v2) → `MIGRATIONS[2]` (v2 → v3, przeliczenie salonu) → `validateSave`. `main.ts`
już nie przelicza; `createAutosaver({ migrated })` robi kopię i zapis przy starcie. `createGame` dostaje
`loader: { timeout, maxRetries }` z `balance.loader`; plik po limicie → `loaderror` → `textures.exists` false → stand-in.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Format v3 (tdd) | `MIGRATIONS[2]`, fixtury v2-legacy/v3, szew na zamrożonym v2 | Krok rzuca na złym kształcie → `migration-failed` |
| 2. Start i kopia (tdd) | Zapis przy starcie, usunięcie `remapLegacySalon`, F3/F4 | Podwójny zapis/markDirty w `main.ts` |
| 3. Limit loadera (impl) | `balance.loader`, klucz `loader`, szew `stall` | Zbyt krótki limit na wolnej sieci |
| 4. Dokumentacja (impl) | `deploy/README.md`, `CLAUDE.md`, follow-upy | Martwe odwołania do starego remapu |
| 5. E2E (e2e, #2, #15) | 3 testy: v2/v1 → v3 przy starcie, zawieszony plik | Chromium w sesji agenta (request-file) |

**Prerequisites:** gałąź `feat/salon-load-health` z `main` @ `7f831c5`; zgoda na v3 (krok 0 runu).
**Estimated effort:** 5 faz, każda jedna sesja agenta; e2e uruchamia orkiestrator.

## Open Risks & Assumptions

- `[human]` Drzwi jednokierunkowe: rollback poniżej v3 = karta `future` bez zapisu (zaakceptowane w kroku 0).
- `[human]` WebKit (iPad): zachowanie `xhr.timeout` przy zawieszeniu nieudowodnione lokalnie.
- Plik > 12 s na pierwszym starcie zostaje zastępstwem do następnego startu (wtedy z cache SW).

## Success Criteria (Summary)

- Stary salon z v2 wczytuje się raz, jest zapisany jako v3 przy starcie z kopią v2; build v2 go nie nadpisuje.
- Zawieszony plik grafiki nie zatrzymuje gry na pasku ładowania; rodzic widzi go w „Obrazki”.
- Fixtury v1/v2 bajt w bajt; bramka lokalna i e2e zielone (`baseline + delta`).
