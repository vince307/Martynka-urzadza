# Pierwszy mebel za gwiazdki (S-09) — Plan Brief

> Full plan: `context/changes/first-furniture-purchase/plan.md`
> Research: `context/changes/first-furniture-purchase/research.md`

## What & Why

Gwiazda przewodnia PRD: „nagrodą musi być budowanie”. Dziecko wydaje gwiazdki z rund na kolejne zadanie remontowe
salonu i wybiera jeden z 3 wariantów z podglądem w pokoju; gwiazdki schodzą dopiero przy „Wybieram” i dokładnie raz
(FR-016, FR-017, US-02, ryzyko #16).

## Starting Point

Pokój to pusty placeholder S-05 („Tu powstanie pokój”). Gwiazdki są prywatnym polem `TaskScene.sessionStars`, a rejestr
ma tylko ich kopię dla HUD — pokój nie ma jak ich wydać. Typy `RoomDef`/`RoomState` istnieją, nieużywane; danych pokoju
i logiki zakupu brak; „Do pokoju” nigdy nie jest wyróżnione (`nextRoomTaskCost: null`).

## Desired End State

Salon rysowany w kodzie (tło + 10 slotów), przycisk bieżącego zadania z kosztem; przy braku gwiazdek wyszarzony
„masz X/Y” wraca do zadań; przy wystarczającej liczbie panel 3 miniatur, podgląd w slocie, „Zamknij” bez kosztów,
„Wybieram” odejmuje koszt raz, z animacją (bez ruchu przy „ogranicz ruch”). Jedno saldo w rejestrze dla zadań, pokoju,
HUD i podsumowania. Do S-11 wszystko w sesji.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Właściciel salda | Rejestr; `TaskScene` dopisuje deltę, zakup tylko przez `core` | Jedno źródło, kształt `SaveState` dla S-11 | Research |
| Salon | 10 slotów, koszty 5,6,…,13,15 (suma 96) w `src/data/rooms.ts` | Plan §6/§10; treść autorska → `[human]` | Change / Plan |
| Placeholdery | Tabela `SALON_PLACEHOLDERS` obok `RoomDef`; warianty: kolor + wzór | `SlotDef.variants` zostaje dla grafiki S-16; nic tylko kolorem | Plan |
| Panel | Canvas, czysty reduktor `stepPanel`; podgląd pusty na start; zamyka tylko „Zamknij” | Ryzyko #16; świadomy wybór dziecka | Research / Plan |
| Dźwięk | Brak (punkt zaczepienia + DESIGN-GAP) | Brak plików do S-16 → `[human]` | Change |
| Ruch | `src/ui/motion.ts`, też dla lotu gwiazdki | Plan §9 + kit `.flying-star` | Research |
| Narracja | Głośnik HUD czyta etykietę zadania w pokoju | Dziecko E1 nie czyta | Research |
| Follow-upy S-09 | `nextRoomTaskCost` i gwiazdka w locie w zakresie; wspólny przycisk HUD nie | Żaden przycisk HUD się nie zmienia | Research |

## Scope

**In scope:** saldo w rejestrze; `core/stars.ts`, `core/rooms.ts`, `core/variantPanel.ts`; `data/rooms.ts` + `pl.room`;
`RoomView`, `RoomTaskButton`, `VariantPanel`; animacja zatwierdzenia; FR-010 wyróżnienie; hak e2e pokoju; spec `#16`.

**Out of scope:** zmiana wariantu, „Pokój gotowy!” (S-10); zapis (S-11); grafika i dźwięk (S-16); strojenie kosztów (M8);
wspólny przycisk HUD.

## Architecture / Approach

`core` (czyste: `earn`, `purchase`, `stepPanel`) ← `data` (salon, napisy, układ) ← sceny tylko rysują i przekazują
stuknięcia. Rejestr niesie `stars`, `rooms`, `currentRoom` (inicjowane w `main.ts`); `UIScene` słucha `changedata-stars`
bez zmian. Hak e2e (tylko build e2e) czyta stan pokoju.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Saldo i zakup w core (tdd) | `earn`, `purchase`, widok przycisku | odjęcie przy za małym saldzie |
| 2. Dane salonu (tdd) | 10 slotów/zadań, napisy, geometria | treść autorska, polszczyzna |
| 3. Reduktor panelu (tdd) | `stepPanel` + test własnościowy #16 | podwójny zakup |
| 4. Jedno saldo (impl) | rejestr, delta, FR-010, gwiazdka w locie, ruch | podwójne liczenie zarobku |
| 5. Salon + przycisk (impl) | `RoomView`, `RoomTaskButton`, „masz X/Y” | układ przy 1024×768 |
| 6. Panel + animacja (impl) | `VariantPanel`, podgląd, zakup, cząsteczki | szew sceny ↔ reduktor |
| 7. Seam sweep (impl) | DESIGN-GAP 31–36, follow-upy, `CLAUDE.md`, `[human]` | — |
| 8. e2e #16 (e2e) | `room-purchase.spec.ts` przez dotyk | Chromium w sesji agenta |

**Prerequisites:** S-08 done; gałąź `feat/first-furniture-purchase`.
**Estimated effort:** 8 sesji agenta (jedna na fazę).

## Open Risks & Assumptions

- Stan sesyjny do S-11: zimny start = 0 gwiazdek i pusty salon.
- Brak dźwięku wbrew dosłownemu FR-017 (oznaczone przez orkiestratora do drugiego spojrzenia).
- Warianty bez grafiki różnią się tylko kolorem i wzorem — rozpoznawalność do S-16.

## Success Criteria (Summary)

- Dziecko po jednej-dwóch rundach kupuje podłogę w salonie i widzi wybrany wariant; „Zamknij” i krótki przycisk nic nie kosztują.
- Żadna sekwencja stuknięć nie odejmuje gwiazdek dwa razy ani poniżej zera (unit/property + e2e #16).
- Licznik HUD, podsumowanie i pokój zawsze pokazują to samo saldo.
