# Zadania z grafiką paczki A i widżety S-13 w E1–E2, E5–E6 — Plan Brief

> Full plan: `context/changes/art-tasks-all-stages/plan.md`
> Research: `context/changes/art-tasks-all-stages/research.md`

## What & Why

Slice S-14 (M6): pierwsza grafika rastrowa w grze. Dziecko rozwiązuje zadania z monetami i banknotami, wagą szalkową,
dzbankami, termometrem i ikonami z paczki A v1, a widżety S-13 (zegar, linijka, klocki, diagram) trafiają do E1, E2, E5, E6.
Pięć pustych kroków programu (E1.8, E1.10, E2.2, E2.8, E5.5) staje się grywalnych.

## Starting Point

S-13 dał model `Task.visual` (zegar, linijka, klocki, diagram), dyspozytor `TaskPicture`, `pictureLayout` i szew e2e
`?e2eSkills`. W grze nie ma żadnego obrazu rastrowego (`BootScene` ładuje tylko font), klawiatura nie ma minusa ani
przecinka, walidator odrzuca liczby ujemne, a seed offline (#8) nie zauważyłby assetu spoza precache.

## Desired End State

38 plików WebP (≈ 0,5 MB) z kitu w `public/assets/tasks/`, ładowanych na starcie i działających offline. W rundach pojawiają
się MONEY_COUNT, MONEY_CHANGE, MASS (waga w równowadze), CAPACITY, TEMPERATURE (także ujemne), COUNT i MULT_GROUPS, z
podpowiedzią i rozwiązaniem obok ilustracji (termometr po lewej od klawiatury). Brak obrazu nigdy nie psuje gry. Nowy spec
e2e czyta stan tekstury i widoczności każdego obrazu.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Zakres | Grafika paczki A + dane widżetów S-13; reszta typów → S-14b/c/d, PERIMETER → S-13b | Pełny zestaw to ~25–30 faz | Research / Plan |
| MONEY_PAY | Odłożony do S-14d | Nowy układ, widżet `Wallet`, wariant `drag`, ryzyko dla helperów e2e | Research |
| Format assetów | WebP ½ rozdz. (≤ 2× wyświetlania), luźne pliki, `cwebp` lokalnie, wyniki w repo | 0,5 MB zamiast ~10 MB PNG; CI bez narzędzia | Research (wbrew planowi § 10 → [human]) |
| Brak obrazu | Zapasowy kształt w kodzie + `console.warn`; test tabela ↔ pliki; seed ↔ precache | „No fail states”, a błąd i tak łapią testy | Research |
| Odpowiedzi | Kafelki tekstowe dla „−5 °C” i „3 zł 40 gr”; klawiatura dla całkowitych od E2/E3; E1 tylko kafelki; `Keypad` bez zmian | Klawiatura bez minusa/przecinka, wzór CLOCK | Research |
| Termometr | Skala co 5 °C w E3, co 2 °C w E5–E6; układ „obok” klawiatury w rozwiązaniu | 63×190 px nieczytelne; 1 °C to ~4,5 px | Plan |
| MASS | Tylko równowaga, masy z tabeli wiarygodnych zakresów na ikonę | Kit nie ma wagi przechylonej ani gramów | Research / Plan |
| Kolejność kroków | Zmienia się raz (faza 8); wcześniej dane tylko w krokach grywalnych | Jedna aktualizacja testów przypiętych | Plan |
| Hak e2e | `snapshot.art` = klucz + `loaded` każdego pokazanego obrazu | Lekcja F1 z S-13 (widżet nienarysowany przeszedł e2e) | Plan |
| Prostokąt | Wspólny `Rect` w `src/core/geometry.ts` | Follow-up S-13 wyzwolony zmianą `pictureLayout` | Research |

## Scope

**In scope:** MONEY_COUNT, MONEY_CHANGE, MASS (równowaga), CAPACITY (1 l, ½ l, ¼ l), TEMPERATURE (odczyt, różnica),
COUNT, MULT_GROUPS; dane CLOCK/DATA/LENGTH/PLACE_VALUE w E1, E2, E5, E6; pipeline WebP; asercja precache w seedzie;
pięć nowych `childName`; zmiana profilu § 10.

**Out of scope:** MONEY_PAY; MASS cięższe/lżejsze, gramy, tona, brutto/netto; 1,5 l; WRITTEN, ARROW_TABLE, oś; typy
tekstowe (S-14c); E1.1, ORDINAL, pary (S-14d); PERIMETER (S-13b); minus/przecinek w klawiaturze; atlas; inne paczki
`designs/`; zmiana formatu zapisu; `deploy/`.

## Architecture / Approach

`core` niesie tylko id i liczby (`TaskVisual` + `src/data/measures.ts` z wartościami z `manifest.json`); `src/data/taskArt.ts`
mapuje id na teksturę; `BootScene` ładuje wszystko na starcie; widżety (`MoneyTable`, `BalanceScale`, `Jugs`,
`Thermometer`, `IconGroups`) rysują przez wspólny `ArtImage` z zapasem i raportują stan do haka. `pictureLayout` wybiera
układ „obok” dla wysokich rysunków. Generatory czyste, test-first, dane po widżetach.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Core (tdd) | 5 rodzajów rysunku, `formatMoney`/`formatCelsius`, `allowNegative`, wyciek tekstu, `Rect`, układ „obok” | Wyjątek ujemny zbyt szeroki |
| 2. Assety (impl) | `npm run art`, 38 WebP, `TASK_ART`, `BootScene`, `ArtImage`, seed #8 | Chromium w sesji agenta (request-file) |
| 3. Generatory pieniędzy i masy (tdd) | MONEY_COUNT, MONEY_CHANGE, MASS | Niewiarygodne masy/kwoty |
| 4. Generatory pozostałe (tdd) | CAPACITY, TEMPERATURE, COUNT, MULT_GROUPS | Dwie poprawne odpowiedzi w kafelkach |
| 5. `MoneyTable` + `BalanceScale` (impl) | Pieniądze i waga w E1.11, E3.4, E4.1; hak `art` | Czytelność „12 zł 50 gr” |
| 6. `Jugs` + `Thermometer` (impl) | Pojemność i temperatura w E3.11, E4.7, E5.4, E6.1 | Port twarzy termometru |
| 7. `IconGroups` (impl) | COUNT w E1.2, E1.4; MULT_GROUPS w E3.9 | Gęstość ikon |
| 8. Nowe kroki (impl) | E1.8, E1.10, E2.2, E2.8, E5.5 + widżety S-13 w E1/E2/E5/E6 + testy przypięte | Wyrocznia startu kalendarzowego |
| 9. Dokumentacja + seam sweep (impl) | design-gaps od 59, follow-upy, `CLAUDE.md`, profil § 10 | — |
| 10. E2E #11 (e2e) | `art-tasks.spec.ts` (4 testy, < 60 s), 4 patche przerw | Czas pełnego zestawu |

**Prerequisites:** S-13 na `main` (`bb00d7f`); lokalny `cwebp` (jest, 1.1.0); `designs/martynka-maths-A-v1/` na dysku.
**Estimated effort:** 10 sesji agenta (jedna faza na sesję), e2e przez orkiestratora.

## Open Risks & Assumptions

- Ostrość WebP ½ rozdzielczości na iPadzie (DPR 2) — tylko `[human]`; zmiana: pełna rozdzielczość tych plików.
- Kafelki tekstowe w E6 mogą być za łatwe; zmiana: pytanie dzielone.
- Rozgrzewka E2 dostaje zadania pieniężne (E2.2 jest drugim krokiem grywalnym).
- Pełne e2e rośnie o 4 testy; `adaptive.spec` blisko 180 s (bez nowych `drag`).
- Plan-review (2026-10-14): progi inwariantów treści (≥ 12 różnych zadań, najczęstsze ≤ 15 %) mierzone już w fazach 3–4; MASS `half`/`convert` jako „ile brakuje do …”; CAPACITY z mieszanym rzędem dzbanków; TEMPERATURE `low/high`, różnica co 2 °C; E4.1 pieniądze ≤ 100 zł (banknoty 200/500 zł bez umiejętności → follow-up); waga przy klawiaturze w 768×190 sprawdzana zrzutem.

## Success Criteria (Summary)

- Dziecko gra zadania z monetami, wagą, dzbankami, termometrem i ikonami w E1–E6; wszystkie obrazy działają offline.
- Pięć nowych kroków grywalnych z `childName`; odczyt nauczyciela bez uwag krytycznych; zapis v1 bez zmian.
- Pełna bramka zielona: unit baseline + N, e2e baseline + 4, seed sprawdza precache każdego obrazu.
