# S-16a `final-art-salon` — Plan Brief

> Full plan: `context/changes/final-art-salon/plan.md`
> Research: `context/changes/final-art-salon/research.md`

## What & Why

Salon dostaje docelową grafikę z paczki `martynka-expansion-v1` (FR-026): etap tła „Odnów ściany i podłogę” (przed →
po, jedno stuknięcie) i 6 mebli × 3 warianty, stała dekoracja, animacje z „ogranicz ruch” i ekran ładowania. Żywe
zapisy z 10-slotowym salonem muszą przejść na nową listę bez zmiany formatu (v2) i bez utraty czegokolwiek, co
dziecko kupiło.

## Starting Point

Dziś salon to 10 slotów rysowanych kodem (`SALON_PLACEHOLDERS`), każda czynność ma panel wariantów, `BootScene` nic
nie rysuje, a grafika zadań idzie rurą `npm run art` → `TASK_ART` → `BootScene` → `artHealth`. `RoomState` (`tasksDone`
+ `chosen`) wystarcza dla nowego salonu.

## Desired End State

Dziecko widzi ekran ładowania, zniszczony salon, jednym stuknięciem odnawia tło (przenikanie), potem wybiera meble z
miniaturami i nazwami wariantów; po 7 czynnościach (suma 71 gwiazdek) „Pokój gotowy!” z miniaturą z grafiki. Stary
zapis pokazuje co najmniej opłacony postęp z zachowanymi wariantami, gwiazdki bez zmian. Brak tekstury → zastępnik,
policzony w „Obrazki”.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Etap w modelu | `RoomTaskDef` = unia `stage \| slot`; stan etapu tylko z `tasksDone` | v2 bez zmian, sloty P3 dopisywane na końcu | Research / change.md |
| Przeliczenie zapisów | Reguła B: najkrótszy nowy prefiks ≥ wydanym, warianty przeniesione, bez zwrotu | Nic nie ginie, gwiazdek się nie rusza; wbrew `change.md` (A) → `[human]` 2.5 | Plan |
| Koszty | 5, 7, 9, 10, 12, 13, 15 = 71 (≈ 10 czystych rund) | W widełkach 5–15; kolejność mebli jak w starej liście, więc każdy stary mebel trafia do prefiksu | Plan |
| Puste sloty / warstwy | Przed etapem cały zniszczony pokój; po etapie tylko kupione meble; cienie przy ukończonym | `furnishings-before` i `shadows` nie dzielą się per slot | Research |
| Scena | Pełnoekranowa 1920×1080 pod kontrolkami, tacka panelu bez zmian | Jak w kicie; gate wizualny ocenia zakrycie | Research |
| Trafianie | `visibleRect` + najwyższy `z` + wstrzyknięta alfa (`getPixelAlpha`) | Dywan nie zjada fotela; `core` zostaje czysty | Research |
| Grafika | 26 WebP q85 pełna rozdzielczość (≈ 1,23 MB), bez atlasu | Scena 1:1, retina; precache ≈ 3,7 MB | Research |
| Słowa minigry | 6 nowych podpisów; asercja Ó/Ł zastąpiona testem `revealed('PÓŁKA')` | Żaden nowy podpis nie ma Ó/Ł | Plan |
| Ekran ładowania | Widżet w `BootScene.preload`, pasek z `progress`, DESIGN-GAP P2.2 | Scena renderuje się w `preload`; brak grafiki w kicie | Research |
| Follow-upy | Salon + książka (22) + `TaskScene.shake` w zakresie; ekran zadań, lektor, atlas, dźwięk → re-trigger | Slice o grafice salonu | change.md |

## Scope

**In scope:** etap tła, nowe dane salonu z manifestu, przeliczenie starych zapisów (wczytanie + podgląd importu),
`npm run art` dla salonu, `ROOM_ART` + ładowanie + zdrowie, pokój/panel/karta z obrazów z zastępnikiem, animacje
(przenikanie, pop na głębokości, cząsteczki) za „ogranicz ruch”, ekran ładowania, książka na karcie odblokowania,
DESIGN-GAP 105+, follow-upy z triggerami, e2e.

**Out of scope:** format v3, dźwięki (S-16b), atlas, ekran zadań (termometr, podświetlenie, O3, ` = ?`, lektor),
SPATIAL, portfel, drugi pokój i sloty P3, strojenie kosztów (S-17).

## Architecture / Approach

Czysta logika najpierw (`src/core/rooms.ts`, `variantPanel.ts`, `roomHit.ts`), dane w `src/data/rooms.ts` /
`roomArt.ts` / `pl.ts`, przeliczenie wołane w `src/main.ts` `start` po `repairCurrentRoom` i w `UIScene.openImport`
`summarize`. Zastępniki wchodzą razem z danymi (faza 3), więc każda faza jest zielona przed grafiką; potem `RoomLayer`
(obraz albo zastępnik) składa pokój w `RoomView`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Etap w modelu (tdd) | `stage`, zakup bez wariantu, gałąź w `stepPanel` | Podwójne wydanie (#16) |
| 2. Przeliczenie (tdd) | `remapLegacySalon`, wywołania, seam `legacy-salon` | Utrata postępu (#2) |
| 3. Dane i trafianie (tdd) | Nowy `SALON`, geometria z manifestu, zastępniki, testy i 3 spec'e | Duża faza mechaniczna |
| 4. Rura grafiki (impl) | 26 WebP, `ROOM_ART`, ładowanie, „Obrazki” | Waga precache |
| 5. Pokój z grafiki (impl) | `RoomLayer`, warstwy, alfa | Kolejność `z` |
| 6. Panel i karta (impl) | Miniatury z obrazów, nazwy wariantów, miniatura salonu | Zakrycie przez tackę |
| 7. Animacje (impl) | Przenikanie, pop na głębokości, „ogranicz ruch” | Czas karty |
| 8. Ładowanie + książka (impl) | `LoadingScreen`, ikona na karcie | Start gry |
| 9. Dokumentacja (impl) | design-gaps, follow-upy, CLAUDE.md | — |
| 10. e2e (#16, #2) | `salon-art.spec.ts` | Chromium w subagencie |

**Prerequisites:** S-14, S-15 zrobione; `cwebp` lokalnie; paczka `designs/martynka-expansion-v1` na dysku.
**Estimated effort:** ~10 sesji agentów (jedna na fazę) + gate wizualny.

## Open Risks & Assumptions

- `[human]` 2.5: maintainer może woleć regułę A (zwrot gwiazdek).
- Rollback deployu po przeliczeniu: starszy build źle odczyta pozycyjny `tasksDone` (nic nie ginie).
- GPU ≈ 59 MB na starszym iPadzie (`[human]` 10.4).

## Success Criteria (Summary)

- Salon w pełni z grafiki, bez placeholderów, grywalny dotykiem od etapu do „Pokój gotowy!”.
- Stary zapis po aktualizacji: nic kupionego nie zginęło, gwiazdki te same.
- Bramka lokalna i nowy spec e2e zielone; zrzuty stanów w gate wizualnym.
