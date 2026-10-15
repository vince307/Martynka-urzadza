# Nieudana kopia `backup-v1`, limity czasu zapisu i uczciwy panel „Zapis gry” — Plan Brief

> Full plan: `context/changes/save-v2-backup-health/plan.md`
> Research: `context/changes/save-v2-backup-health/research.md`

## What & Why

Audyt 2026-10-15_0253 (PR #52) znalazł, że na urządzeniu, gdzie kopia `profile:default:backup-v1` się nie udaje, gra
po aktualizacji do v2 **nic nie zapisuje** — postęp dziecka ginie przy każdym starcie (SV2-01, CRITICAL). Do tego
zawieszony magazyn nie ma limitu czasu (dialogi importu/resetu wiszą, panel mówi „jeszcze nic nie zapisano”), panel
„Zapis gry” mówi o zamiarze zamiast o skutku, a trwały `timeout` odczytu każe w kółko „uruchomić ponownie”.

## Starting Point

`createAutosaver` robi kopię przed zapisem w jednym `try`; padająca kopia kończy każdą próbę. Tylko `loadSave` ma limit
czasu. `saveHealthView` pokazuje `migratedFrom` ze startu i `failing` bez kodu. Karta `timeout` = karta `unavailable`.

## Desired End State

Postęp zapisuje się zawsze, gdy magazyn przyjmuje zapis: kopia jest próbowana 3 razy w sesji, potem v2 idzie bez niej
(z nazwanym stanem i kodem w panelu). Każda operacja magazynu kończy się w 5 s sukcesem albo porażką `timeout` z etapem;
dialogi zawsze odzyskują „Zamknij”. Wolny odczyt ma kartę z „Poczekaj dłużej” i warunkową radę zamiast pętli.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Polityka kopii (SV2-01) | Opcja A: 3 próby w sesji, potem v2 bez kopii; `hidden` po ≥ 1 porażce pisze od razu | v2 ⊇ v1 (zwalidowane), a cicha utrata postępu łamie „Postęp nigdy nie ginie” | Research → Plan |
| Kopia w `replace` (SRR-04) | Raz, z limitem, nieblokująco | reset przed pierwszym zapisem niszczył surowe v1 na zdrowym urządzeniu | Plan |
| Limit czasu (SV2-02) | `writeTimeoutMs = 5000`, jeden helper `withTimeLimit`, bez `abort` | wzorzec `loadSave`; idb-keyval nie daje `abort` | Research |
| Po limicie `replace` | `dirty` + `arm()` tylko dla `timeout` | porzucony zapis może wylądować później; bieżąca sesja ląduje po nim | Research → Plan |
| Panel (SV2-03) | `failing` z liczbą/etapem/kodem; „przeniesiono” dopiero po zapisie v2, z informacją o kopii | panel mówi tylko to, co autosaver widział w tej sesji | Research |
| Wyjście z `timeout` (SRR-02) | „Poczekaj dłużej” na ten sam odczyt (20 s) + warunkowa rada; bez licznika w `localStorage` | licznik zawodny w trybie prywatnym; nowy odczyt kolejkowałby się za zawieszonym | Research |
| Format | Zostaje v2; nowe pola tylko w `AutosaveStatus` | kontrakt runu | Change |
| Dodatki | O2 (Escape przy `busy`), S12-12 (log `persist()`), SRR-12 (karta `timeout`); reszta follow-upy | te same symbole, tanie | Plan |

## Scope

**In scope:** SV2-01, SV2-02, SV2-03, SRR-02, SRR-04, SRR-12, O2, S12-12; szwy e2e `writehang`, `backupfail`,
`backuphang`, `slow`; DESIGN-GAP 94–97; follow-upy z `Trigger:`; zdanie w `CLAUDE.md`.

**Out of scope:** zmiana formatu (v3), licznik startów (SRR-08), przycisk kopii v1 (SV2-04, opcja B), osobny klucz v2
(opcja C), `abort` transakcji, S12-03/07/08/11/13, SV2-05..15, `deploy/`, pomiar N-7 (`[human]`).

## Architecture / Approach

Cała logika w czystym `core` (`autosave.ts`: `withTimeLimit`, polityka kopii, `waitLonger` w `loadSave`;
`saveHealth.ts`: widok), wstrzykiwany zegar w testach. DOM tylko renderuje (`saveHealthView.ts`, `saveFailedCard.ts`,
dwa dialogi). Każdy nowy szew e2e w buildzie z hakiem pod markerem `e2eSave`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Limit czasu (tdd) | `withTimeLimit`, `lastFailure` z etapem, szew `writehang` | późne odrzucenie porzuconej obietnicy → karta fatalna |
| 2. Polityka kopii (tdd) | 3 próby → v2 bez kopii, `hidden`, kopia w `replace`, szwy `backupfail`/`backuphang` | decyzja ponad PRD (`[human]` 2.5) |
| 3. Panel o skutku (tdd) | `failing` z kodem, linia przeniesienia po zapisie, gaps 94–95 | zmiana kształtu `SaveHealthView` |
| 4. Wolny odczyt (impl) | karta „Poczekaj dłużej”, `waitLonger`, rada, szew `slow`, gaps 96–97, 2 spec'e zmienione | pętla kart w `main.ts start` |
| 5. Dialogi + domknięcie (impl) | Escape przy `busy`, log `persist()`, seam sweep, follow-upy, `CLAUDE.md` | brak testu DOM (dowód w fazie 6) |
| 6. E2E #2 (e2e) | 4 testy: padająca kopia, zawieszony zapis + Escape, wolny odczyt, odczyt bez odpowiedzi | Chromium tylko u orkiestratora |

**Prerequisites:** gałąź `feat/save-v2-backup-health` z `main` @ `16848c6`; baseline unit 2445, e2e 77 (kontrakt runu).
**Estimated effort:** 6 faz, każda jedna sesja agenta; e2e faz 4 i 6 przez protokół request-file.

## Open Risks & Assumptions

- Siatka na przyszły błąd migracji znika na urządzeniach z padającą kopią (`[human]` 2.5).
- Import po `timeout` `replace` może wylądować, jeśli strona zamknie się przed zapisem sesji, który go przykrywa.
- Trwały `timeout` po 20 s dalej kończy się tylko radą — zależy od pomiaru N-7 (`[human]` 4.8).

## Success Criteria (Summary)

- Zmigrowany zapis na urządzeniu z padającą kopią jest zapisany jako v2 w pierwszej minucie gry, a panel mówi, że
  starej kopii nie zachowano (z kodem).
- Żadna operacja zapisu nie wisi dłużej niż limit; dialog resetu po zawieszonym zapisie pokazuje „Zamknij”.
- Rodzic przy wolnym odczycie może poczekać albo dostaje radę — nigdy pętli „uruchom ponownie”.
