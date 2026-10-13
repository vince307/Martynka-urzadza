# Darmowa zmiana wariantu i „Pokój gotowy!” (S-10) — Plan Brief

> Full plan: `context/changes/variant-change-room-done/plan.md`
> Research: `context/changes/variant-change-room-done/research.md`

## What & Why

Zamknięcie etapu M4: dziecko urządza salon do końca i może go dalej zmieniać. Przytrzymanie urządzonego mebla otwiera
ten sam panel 3 wariantów, a zmiana jest darmowa (FR-018, US-02); po ostatnim zadaniu widzi „Pokój gotowy!” z listą pokoi
i zapowiedzią, a odblokowanie kolejnego pokoju istnieje w danych (FR-019); potem „poprawki” i dalsze rundy.

## Starting Point

S-09 dał salon w kodzie, przycisk zadania, panel zakupu (`stepPanel`, jedyna ścieżka wydawania gwiazdek) i saldo w
rejestrze. Panel otwiera się tylko dla bieżącego zadania; `RoomView` nie ma obszarów dotyku; po 10. zakupie przycisk
po prostu znika. `longPress` istnieje, ale tylko dla koła zębatego rodzica (2 s). Brak listy pokoi i danych odblokowania;
`pl.room.name` martwy, podpisy slotów nachodzą na siebie.

## Desired End State

Przytrzymanie (≈ 0,6 s) urządzonego slotu → obrys, potem panel zmiany tego slotu; „Wybieram” zmienia wariant bez
odejmowania gwiazdek; stuknięcie nic nie otwiera. Po 10. zakupie karta „Pokój gotowy!” (kafelek „Salon” z miniaturą,
zapowiedź „Wkrótce”, „Dalej”). Gotowy pokój ma przycisk „Zmień wygląd” (tryb stuknięć, „Gotowe” wychodzi). Wszystko w
sesji do S-11, bez nowych pól stanu.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Tryb zmiany | Gałąź `stepPanel` (`mode: 'change'`, wynik `changed`, nigdy `bought`) | Jedna ścieżka wydawania gwiazdek, ryzyko #16 | Change / Research |
| Próg dziecka | `balance.roomHold` 600 ms / 40 px | „Krótkie” z FR-018, powyżej progów platform → `[human]` | Research |
| Sygnał trzymania | Statyczny obrys slotu | Odkrywalność bez ruchu | Research |
| Trafianie | `core/roomHit.ts`: najwyższy `depth` z urządzonych, wspólny `slotBox` | Rysunek i dotyk się nie rozjadą | Research |
| „Poprawki” | „Zmień wygląd”/„Gotowe” w miejscu przycisku zadania, tylko w gotowym pokoju | Wolne miejsce, jasny czasownik → `[human]` (wbrew dosłownemu FR-019) | Change / Plan |
| Karta | Canvas w `RoomScene`, po „popie” 10. zakupu, „Dalej” do pokoju, bez flagi zapisu | Wzorzec `UnlockCard`; brak potrzeby stanu | Change / Research |
| Lista pokoi | `ROOM_ORDER` (`RoomListEntry`) + `roomsListView`; `RoomDef` bez zmian | „Mechanika w danych” bez zmiany planu §5 | Research |
| Narracja | Głośnik czyta kartę i wskazówkę trybu; auto-czytanie karty | Dziecko E1 nie czyta (wiersz 23) | Research |
| Dojście w e2e | `?e2eStars=N` tylko w buildzie haka, marker w strażniku | 96 gwiazdek = 14 rund → `[human]` | Research |
| Follow-upy | hold+karta, F4, F5, V1, V2 w zakresie; wspólny przycisk HUD nie | Slice i tak zmienia `RoomScene`/`RoomView` | Change |

## Scope

**In scope:** gałąź zmiany `stepPanel`, `core/roomHit.ts`, `roomDone`, `roomsListView`, `ROOM_ORDER`, `balance.roomHold`,
kotwice podpisów, napisy `pl.room.done`/`pl.room.change`, szew `e2eStars`, przytrzymanie i obrys w `RoomScene`/`RoomView`,
`RoomDoneCard`, tryb „Zmień wygląd”, hak e2e, spec `room-change`.

**Out of scope:** zapis (S-11); drugi pokój (v1.1); osobny widok listy; tryb zmiany przed ukończeniem; pierścień postępu;
grafika i dźwięk (S-16); wspólny przycisk HUD.

## Architecture / Approach

`core` (czyste: `stepPanel`, `slotAt`/`holdPoint`, `roomDone`, `roomsListView`, `longPress`) ← `data` (salon, kolejność
pokoi, próg, napisy, układ) ← `RoomScene` tylko rysuje i karmi gesty; rejestr pisany tylko z wyniku `core`
(`bought` → saldo + pokój, `changed` → tylko pokój). Hak e2e (tylko build e2e) czyta tryb, kartę, przytrzymanie i punkty slotów.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Reduktor + trafianie (tdd) | gałąź zmiany, `slotAt`, `holdPoint`, `roomGesture`, `roomDone` | zmiana odejmuje gwiazdki |
| 2. Dane i napisy (tdd) | lista pokoi, próg, kotwice podpisów, kopia | polszczyzna, próg |
| 3. Szew `e2eStars` (tdd) | parser + marker strażnika | wyciek do `dist/` |
| 4. Przytrzymanie w pokoju (impl) | strefa, obrys, panel zmiany, F5/V1 | gest kradnie stuknięcia |
| 5. Karta + tryb (impl) | `RoomDoneCard`, „Zmień wygląd” | nakładanie celów dotyku |
| 6. Seam sweep (impl) | luki 37–41, follow-upy, `CLAUDE.md` | nieaktualne komentarze |
| 7. E2E (e2e) | `room-change.spec.ts`, breaks A–C | szew gest → rejestr |

**Prerequisites:** S-09 (done, #31). **Estimated effort:** 7 faz, każda dla jednego świeżego agenta; e2e przez orkiestratora.

## Open Risks & Assumptions

- Dywan osiągalny tylko na pasach obok kanapy (test osiągalności + tryb jako druga droga).
- Próg 600 ms do strojenia na urządzeniu; liczba w danych.
- Karta nie wróci po zimnym starcie po S-11 (zamierzone, follow-up `Trigger: S-11`).

## Success Criteria (Summary)

- Żadna sekwencja zdarzeń w trybie zmiany nie zmienia salda ani `tasksDone` (unit własnościowy + e2e).
- Przytrzymanie urządzonego slotu otwiera panel zmiany; stuknięcie i dryf nie.
- Ostatni zakup pokazuje „Pokój gotowy!” z listą (salon gotowy, zapowiedź odblokowana); tryb „Zmień wygląd” działa.
