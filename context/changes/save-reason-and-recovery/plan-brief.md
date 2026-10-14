# Powód nieudanego odczytu zapisu, wyjście z trwałego „unavailable” i uczciwa kopia — Plan Brief

> Full plan: `context/changes/save-reason-and-recovery/plan.md`
> Research: `context/changes/save-reason-and-recovery/research.md`

## What & Why

Audyt obserwowalności 2026-10-14_1110 (PR #45) pokazał, że powód nieudanego odczytu zapisu gubi się po drodze. Skutek: zdrowy zapis z nowszej wersji gry (`future`) da się nadpisać importem lub resetem. Do tego trwałe `unavailable` nie zostawia rodzicowi żadnego wyjścia, panel nie pokazuje kodu błędu, a „Zapisz kopię” udaje kopię postępów dziecka. Zmiana zamyka SIR-01..04 i ASL-01, a przy okazji tanio SIR-05, SIR-06 i S12-06.

## Starting Point

`LoadOutcome.reason` dociera tylko do linii na karcie startowej. `AutosaveStatus` zna `blockedBy` (`unreadable`/`unavailable`/`fatal`), ale nie zna powodu. `replace` nadpisuje każde `unreadable` i odmawia każdego `unavailable`. Dialogi mają jedno zdanie dla wszystkich przyczyn. Szew e2e `?e2eSave=unreadable` to w praktyce zapis `future` (v99).

## Desired End State

- Zapisu `future` nie da się nadpisać, a dialogi każą zaktualizować grę.
- Przy trwałym `unavailable` rodzic może po drugim potwierdzeniu („Zastąp mimo to”) zastąpić zapis. Gdy i to się nie uda, dostaje radę „usuń dane tej strony”.
- `timeout` nigdy nie pozwala na nadpisanie.
- „Zapis gry” pokazuje zdanie dla każdej przyczyny i kod, a karta `unavailable` ma linię kodu.
- Eksport z panelu ostrzega, gdy zapisu z urządzenia nie wczytano.
- Test AST pilnuje okablowania `freshRound`.
- Format zapisu zostaje v1.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| `future` na urządzeniu | odmowa importu i resetu, bez `force` | zapis jest zdrowy, a aktualizacja go odzyska; PRD milczy, więc decyzja trafia do `[human]` 3.7 | Research / Plan |
| Wyjście z `unavailable` | drugie potwierdzenie → `replace(…, { force })` | dostępne już przy pierwszym starcie i działa w przypadku audytu „odczyt odrzuca, zapis działa” | Research |
| Licznik startów w `localStorage` | odrzucony | Safari w trybie prywatnym trzyma go tylko na sesję, a druga ścieżka magazynu ma własne awarie | Research |
| `timeout` | zawsze odmowa | to może być zdrowy, tylko powolny zapis; decyduje pomiar N-7 (`[human]` 5.8) | Research / Plan |
| Reguła UI i `core` | jedna czysta `replaceGate` + test lockstep | dialog i `replace` nie mogą się rozjechać | Plan |
| Decyzje o `timeout` | z niezmiennego `loadError`, nie z `lastError` | porażka wymuszonego zapisu nie może odblokować `timeout` | Plan |
| SIR-04 | linia w dialogu eksportu, bez pola w kopercie | rodzic musi to zobaczyć, a pole w kopercie jest niewidoczne | Research / Plan |
| Kod w panelu | istniejący `pl.saveFailed.detail` | jeden format kodu na karcie i w panelu | Plan |
| ASL-01 | test źródła (AST), faza `impl` | implementacja już istnieje; e2e byłby probabilistyczny | Research |
| Szew `corrupt` | w fazie 3, razem ze zmianą zachowania | każda faza zostaje zielona w pełnym e2e | Plan |

## Scope

**In scope:**
- SIR-01: `loadReason` i `loadError` w statusie, `replaceGate`, przyczyny w `deviceSaveView` i w dialogach.
- SIR-02: „Zastąp mimo to” i `siteDataAdvice`.
- SIR-03: „Zapis gry” z przyczyną i kodem, `detail` na karcie.
- SIR-04: ostrzeżenie w eksporcie.
- ASL-01: test AST `freshRound`.
- Dodatki: SIR-05 (log), SIR-06 (tekst `fatal`), S12-06 (tekst porażki resetu).
- Szew `?e2eSave=corrupt`, DESIGN-GAP 69–72, follow-upy, `CLAUDE.md`.

**Out of scope:**
- Format v2 (należy do S-15).
- Licznik startów i `deleteDatabase`.
- Pomiar N-7 i `loadTimeoutMs`.
- Osobne ciało karty dla `timeout`.
- S12-02/03/05/07..09/11..15 i ASL-02..09 (follow-upy z triggerami).
- Import z ekranu powitalnego.
- Pole w kopercie eksportu.

## Architecture / Approach

Decyzje zapadają w czystym `core`:
- `autosave.ts`: status runtime i `replaceGate`;
- `saveFile.ts`: `deviceSaveView` z `forceable`;
- `saveHealth.ts`: `stateOf` z `cause` i `code`.

`main.ts` przekazuje powód odczytu do autosavera. `UIScene` podaje widok i `force` dialogom DOM, a te tylko renderują teksty z `pl.ts`. Nic nowego nie trafia do `SaveState` ani `SAVE_KEYS`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Bramka w `core` (tdd) | `loadReason`/`loadError`, `replaceGate`, `deviceSaveView` per przyczyna, log odmów | rozjazd UI i `core` (zamyka go test lockstep) |
| 2. „Zapis gry” (tdd) | zdania `future`/`timeout`, linia kodu, `detail` karty `unavailable` | `code` brany z `lastError` |
| 3. SIR-01 widoczne (impl) | `main.ts` przekazuje powód; teksty per przyczyna; szew `corrupt`; test „warns” przeniesiony | rozbicie istniejącego e2e |
| 4. Wyjście SIR-02 (impl) | „Zastąp mimo to”, `force`, `siteDataAdvice`, `resetFailed` | nadpisanie zdrowego zapisu (`[human]` 4.7) |
| 5. Eksport + ASL-01 + sweep (impl) | `exportNotDevice`, `freshRoundWiring`, follow-upy, `CLAUDE.md` | martwe klucze, nieaktualne komentarze |
| 6. E2E #2 (e2e) | +4 testy (`future`, force, `timeout`, eksport) i rozszerzone C-1/M-S4 | Chromium w sesji agenta (protokół request-file) |

**Prerequisites:** gałąź `feat/save-reason-and-recovery` z `main` @ `16a0abd`; e2e uruchamia orkiestrator.
**Estimated effort:** 6 sesji agenta (jedna na fazę) plus przeglądy.

## Open Risks & Assumptions

- Przy chwilowej odmowie przeglądarki rodzic może po drugim potwierdzeniu nadpisać zdrowy zapis. Tekst o tym ostrzega (`[human]` 4.7).
- Rada „usuń dane strony” nie jest sprawdzona dla PWA na iPadOS i Androidzie (`[human]` 4.8).
- Trwały `timeout` na iPadzie nie ma wyjścia w aplikacji; zależy to od pomiaru N-7 (`[human]` 5.8).

## Success Criteria (Summary)

- Zapis z nowszej wersji gry przetrwa każdą akcję w panelu. Rodzic przy trwale niedostępnym zapisie ma wyjście w aplikacji.
- Rodzic widzi przyczynę i kod, a kopia z panelu nie udaje kopii postępów.
- Bramka lokalna jest zielona po każdej fazie. W e2e przybywają 4 testy, a każda przerwa celowa została zobaczona na czerwono.
