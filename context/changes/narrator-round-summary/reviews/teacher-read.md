# Teacher read — narrator-round-summary (S-05)

- **Date**: 2026-10-13 · reviewer: impl-review step (autonomous run 2026-10-12-s04-s08)
- **Source**: `npm run sample -- E1 … E6 --count 6` on `690847b` (all six stages `Naruszenia: 0`); the `czyta:` lines (the narrator text, `spokenText(speak ?? prompt)`); strings `pl.speech`, `pl.summary`, `pl.room`, `pl.tasks.*Speak`, `pl.tasks.romanLetters`.
- **Plan rows**: 1.5 (generator `speak`), 2.5 (`czyta:` lines and `pl.speech`), 6.5 (`pl.summary`), 7.4 (`pl.room`).

## 1.5 Generator `speak` (COMPARE_NUM, COMPARE_EXPR, MISSING_OP, ROMAN, CALENDAR) — PASS

| Type | Sample | Read |
|---|---|---|
| COMPARE_NUM | `3 □ 5` → „Jaki znak pasuje w okienku? trzy okienko pięć” | The question comes first, so „okienko” has a meaning; never the sign. „pasuje w okienku” matches the existing `pl.tasks.missing` wording (kept for consistency; „do okienka” would be slightly more natural). |
| COMPARE_EXPR | „Porównaj wyniki. Jaki znak pasuje w okienku? pięć minus dwa okienko trzy plus cztery” | Clear; no result of either side is spoken. |
| MISSING_OP | „Jakiego znaku działania brakuje w okienku? dziesięć okienko cztery równa się sześć” | Natural; the operator word never appears. |
| ROMAN (reading) | „Zegar z cyframi rzymskimi pokazuje fau, i, i. Która to godzina?”, „Winda zatrzymała się na piętrze oznaczonym cyframi rzymskimi iks, i. Które to piętro?”, „Jaką liczbę oznacza zapis rzymski i, fau?” | Letter names (i, fau, iks, el, ce, de, em) are the Polish school names; the value is never spoken. „zapis rzymski” is correct Polish and understood in grade 2–3; the other two contexts say „cyframi rzymskimi” — acceptable variation. A lone „i” may sound like the conjunction; the comma pause and the visible numeral make it clear (listening row 10.9). |
| ROMAN (writing) | „Jak zapisać liczbę 10 cyframi rzymskimi?” | No `speak` needed; the answer tiles are Roman, nothing leaks. |
| CALENDAR `romanMonth` | „Data 21, miesiąc zapisany cyframi rzymskimi iks. Który to miesiąc?” | Clear; the month name is not spoken. |

## 2.5 Narration lines (`czyta:`) and `pl.speech` — PASS with notes

- Bare calculations: „Oblicz. trzydzieści osiem plus dwadzieścia siedem” (kit form); „razy”, „podzielić przez”, „równa się”, „okienko” are the words a teacher says aloud. Number words correct across 0–1000 (e.g. „sześćset trzydzieści podzielić przez siedem”, „dziewięćset trzydzieści dziewięć”). Lowercase after „Oblicz.” does not matter to a synthesizer.
- Word problems keep digits in sentences („Zosia miała 4 ciastka i oddała Stasiowi 3 ciastka”): the noun after the digit is already in the right case, so a Polish voice reads „cztery ciastka”, „trzy ciastka”; gender of „dwie” is the synthesizer's job — listening row 10.9.
- A colon after a word becomes a full stop („Uzupełnij ciąg. 3, okienko, 7, 9”; „… Sprawdź. dziewięć plus cztery równa się okienko”): a natural pause; never read as division.
- Commutativity (`11 + 3 = 3 + □`) is read „Oblicz. jedenaście plus trzy równa się trzy plus okienko”: „Oblicz” over an equation with a box is a little odd but harmless; folded into the existing „Oblicz over comparisons” follow-up.
- NUMBER_WORDS „Jak zapisać słowami liczbę 23?” is read with the number's sound — not a leak beyond the visible digits; the skill is the written form. Kept.
- Second try reads „Spróbuj jeszcze raz.” + first hint. Hints are not spelled: a ROMAN hint „X = 10, I = 1; razem 10 + 1 = 11” is spoken with the Roman letters as the synthesizer reads them. The hint is already on screen, so speech adds nothing the child cannot see; but that first hint step already contains the result (pre-existing ROMAN/CALENDAR hint content from S-02/S-03, not this slice) → follow-up.
- No line contains `− · □ < >`, a hard space, or a standalone Roman numeral token (unit invariant, re-executed by this review).

## 6.5 `pl.summary` — PASS

„Brawo!” (`pl.round.correct`), „Kolejna runda”, „Do pokoju”, „+N” and the bonus line „Runda bez błędu! +2 ★” — copied from the kit or already reviewed in S-04; short and child-friendly.

## 7.4 `pl.room` — PASS

„Wróć do notesu” (kit) and the placeholder caption „Tu powstanie pokój” — correct, friendly, and honest about the empty room (DESIGN-GAP row 12).
