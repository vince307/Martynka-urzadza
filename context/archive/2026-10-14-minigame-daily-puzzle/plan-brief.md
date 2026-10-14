# Minigry i zagadka dnia (S-15) — Plan Brief

> Full plan: `context/changes/minigame-daily-puzzle/plan.md`
> Research: `context/changes/minigame-daily-puzzle/research.md`

## What & Why

Co kilka rund dziecko zamiast zwykłej rundy dostaje minigrę (Hasło z wyników albo Zakrywankę) lub zagadkę dnia z puli
15 oryginalnych zagadek LOGIC dla E3–E4 za podwójne gwiazdki (PRD FR-024, FR-025; decyzje autora 2026-10-14). Żeby „co
kilka rund” i „raz dziennie” przeżyły zamknięcie gry, format zapisu przechodzi na v2.

## Starting Point

Runda to „lista `Task` + `RoundRules`” w `src/core/round.ts`, budowana w `TaskScene.freshRound` (rozgrzewka / e2e /
adaptacyjna) i zamykana w `finishRound` (`endRound` + `flush('now')`). Zapis v1 ma pusty łańcuch `MIGRATIONS`; strażnicy
nowszego zapisu (SIR-01) kluczują na powodzie `future`. Nic o minigrach, zagadkach, dniu ani liczniku rund nie istnieje.

## Desired End State

Po 3 zwykłych rundach 4. jest wariantem: zagadka dnia (E3–E4, pierwsza w danym dniu, ×2) albo minigra na zmianę.
Hasło odsłania literę nazwy mebla po każdym działaniu; Zakrywanka zakrywa pole 0–12 stuknięciem. Warianty nie ruszają
opanowania. Każdy zapis v1 wczytuje się w v2 bez straty, z kopią `backup-v1` przed pierwszym nadpisaniem.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Minigry v1, mnożnik, autor zagadek | Hasło + Zakrywanka, ×2, agent pisze 15 oryginalnych | Decyzje autora 2026-10-14 | Change |
| Trwały stan | Zapis v2 z blokiem `variants`, migracja przy odczycie, faza 1 | Krótkie sesje dziecka; opiekun zatwierdził v2 | Research |
| Bezpieczeństwo migracji | `migration-failed` + kopia `backup-v1` blokująca pierwszy zapis | FR-021 także dla błędu wykrytego po zapisie | Research |
| Częstotliwość | Wariant co 4. rundę (`everyRounds` 3), rozgrzewka się nie liczy | Brak liczby w źródłach; strojenie w S-17 | Plan |
| Dzień | Lokalna data z `main.ts`, zagadka gdy `puzzleDay !== today` | Bez arytmetyki czasu; cofnięty zegar nie blokuje | Research |
| Hasło | Litera po każdym działaniu (kit), słowa z podpisów salonu | Kit jest źródłem widoku; wbrew ZADANIA → `[human]` | Research |
| Zakrywanka | 13 rzutów, stuknięcie w planszę, 0–12 dla każdego etapu | Bez martwego rzutu i stanu porażki | Research |
| Gwiazdki | Zagadka 2 za 1. i 2. próbę; minigry 1 za zadanie, bez premii | Druga próba nigdy nie jest karą | Research |
| Opanowanie | Warianty pomijają `endRound` | Kostki i zagadki nie są umiejętnościami etapu | Research |
| E2E | Szwy `?e2eDay`, `?e2eVariant`, `?e2eSave=v1`; `off` w specach wielorundowych | Hook build jak produkcja, istniejące specy zielone | Plan |

## Scope

**In scope:** zapis v2 + L-S1 + `backup-v1` + teksty zapisu (O1, S12-09, S12-14); harmonogram wariantów; pula 15 zagadek;
Hasło i Zakrywanka (logika + 4 widżety + tytuł HUD); 3 specy e2e; design-gaps 79+, follow-upy.

**Out of scope:** pozostałe minigry, zagadki E1–E2/E5–E6, przyciski minigier w pokoju, „Podpowiedź”/„Pokaż” na żądanie,
rysunki zagadek, prawdziwy e2e dwóch buildów, S13-06, zmiany w `deploy/`.

## Architecture / Approach

Czysty `src/core/variants.ts` (`nextRoundKind`, `afterRound`, `pickPuzzle`, `variantRules`) z wstrzykniętym dniem;
`src/core/minigames/{dice,word}.ts` i `src/core/puzzles.ts` dają listy `Task`, które prowadzi niezmieniony `round.ts`.
`TaskScene` dostaje trzecią gałąź rodzaju rundy („zbuduj, potem zatwierdź”); minigry włącza lista w `balance.ts` faza po fazie.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Zapis v2 (tdd) | Format, migracja 1 → 2, fixtures v2 | Fixture v1 przypadkiem zmieniony |
| 2. Bezpieczeństwo migracji (tdd) | `migration-failed`, `backup-v1`, `migratedFrom` | Kopia po zapisie zamiast przed |
| 3. Teksty zapisu (impl) | Karta `future`, import z datą, `?e2eSave=v1` | Szew w `dist/` |
| 4. Harmonogram (tdd) | Licznik, dzień, rotacja, ×2 | `>` zamiast `!==` |
| 5. Zagadki (tdd) | 15 zagadek, test treści | Treść — odczyt autora |
| 6. Minigry w core (tdd) | Rzuty i rundy Hasła | Zakres zadań E5–E6 na kafelkach |
| 7. Wariant w scenie (impl) | Zagadka dnia ×2, tytuł HUD, szwy, `off` w specach | Przeoczony spec wielorundowy |
| 8. Hasło (impl) | `LetterTiles`, `MinigameDoneCard` | Ó/Ł w kaflu 132 px |
| 9. Zakrywanka (impl) | `Dice`, `CoverBoard` | Pola za małe na tablecie |
| 10. Seam sweep (impl) | Gaps, follow-upy, `CLAUDE.md` | — |
| 11–13. E2E | Migracja w przeglądarce; minigry dotykiem; zagadka raz dziennie | Chromium w subagencie (request-file) |

**Prerequisites:** fix save-reason-and-recovery (#48) i S-13b (#49) na `main` — spełnione.
**Estimated effort:** 13 faz, każda jedna sesja agenta; e2e uruchamia orkiestrator.

## Open Risks & Assumptions

- Ekonomia: plansza kostek płaci do 13 gwiazdek (≈ +15 % tempa) — S-17 playtest.
- Decyzje wbrew dosłownemu tekstowi czekają na odczyt autora (`[human]` 1.6, 5.6, 8.5, 10.6).
- `TaskScene` (865 linii) — faza 7 może wymagać kontynuacji w drugiej sesji.

## Success Criteria (Summary)

- Dziecko widzi minigrę albo zagadkę co 4. rundę, zagadkę najwyżej raz dziennie, ×2 na liczniku, bez kar.
- Postęp z buildu v1 jest identyczny po aktualizacji; zapis v3 nigdy nie jest nadpisany.
- Pełna bramka i e2e `63 + 8` zielone; `e2e hook: absent (` w `dist/`.
