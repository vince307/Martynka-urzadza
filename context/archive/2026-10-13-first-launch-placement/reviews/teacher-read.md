# Teacher read — first-launch-placement (S-06)

Reviewer: `/10x-impl-review` step, 2026-10-13, branch `feat/first-launch-placement` @ `a6f091b`.

## 1.4 Placement table: `src/data/placement.ts` vs `docs/ZADANIA.md` §1

| Age | Sep–Jan (doc / data) | Feb–Jun (doc / data) | Jul–Aug (doc / data) |
|---|---|---|---|
| 6 | E1 (picture mode) / E1 | E1 / E1 | E1 / E1 |
| 7 | E1 / E1 | E2 / E2 | E2 / E2 |
| 8 | E3 / E3 | E4 / E4 | E4 / E4 |
| 9 | E5 / E5 | E6 / E6 | E6 / E6 |
| 10+ | E6 / E6 | E6 / E6 | E6 / E6 |

Bands: `autumn` = getMonth 8–11 and 0 (September–January), `spring` = 1–5, `summer` = 6–7: all 12 months covered once.
The "picture mode" for age 6 is skipped on purpose (design-gaps row 21, follow-up S-14). Verdict: PASS, row by row.

## 2.5 Warm-up: `npm run sample -- E1 … E6 --warmup` (seed 1)

- E1: "bez rozgrzewki (brak poprzedniego etapu)" — correct, E1 has nothing below it.
- E2: weekdays, 1 + 4, complement to 10 (E1), then 17 − 5, 7 + 5, 7 + 7 (E2.1/E2.3). Things a child at the start of grade 1 term 2 has done.
- E3: 16 − 7, 80 + 3, 80 − 10 (E2), then a comparison word problem with "złotych" (accusative/genitive right: "ma 7 złotych … O ile więcej złotych"), missing addend □ + 8 = 15 and 8 + 7 = □ (E3.1–2).
- E4: even/odd 28, Roman III, 18 : 3 (E3), then 81 □ 48, 10 − 4, 90 − 1 (E4.1–2). The E4.2 items are easy, which is right for a warm-up.
- E5: rounding 93 → 90, □ · 3 = 24, 12 : 3 (E4), then Roman X, 34 + 20, 60 − 31 (E5.2).
- E6: 10 · 0, a word problem "Zosia miała 19 ciastek i kupiła jeszcze 68 ciastek" (numeral agreement right; 68 cookies is a large number but it is the existing E5 generator, not this slice), 100 : 10 (E5), then 3 · 15, 88 : 8, 72 : 4 (E6.4, the first playable step: E6.2–3 have no playable skill yet).

The previous-stage half is "already done" material, the current half comes from the first steps only, so a child placed in September is not tested on unseen steps. Two tasks of the same skill in a row (E2.3, E4.2, E6.4) are acceptable; the same-prompt-twice risk is already a follow-up (S-07). Verdict: PASS.

## 4.6 `pl.welcome` and the brand

"Martynka urządza" (`pl.title`) and "Ile masz lat?" copy the kit word for word. Short, correct, child-level. Verdict: PASS.

## 5.5 `pl.parent` and `pl.stages`, read as a teacher and a parent

- "Rodzic", "Pytanie dla rodzica", "Ile to jest 13 · 14?" (school multiplication dot, as in the game's tasks), "Wpisana liczba" (label of the readout), "Usuń" (label of ⌫), "OK", "Anuluj": short and correct.
- Wrong answer: "To nie ta liczba. Spróbuj z nowym działaniem." Calm, no "błąd", tells the adult what happens next. PASS.
- Panel: "Ustawienia startowe", "Wiek dziecka", "Etap nauki", the tag "(propozycja)", "Zatwierdź"; age buttons "6" … "9", "10+" (the table's "10+"). PASS.
- `pl.stages`: "Klasa 1, I półrocze" … "Klasa 3, II półrocze" match ZADANIA §1 "Etapy" (capitalised as a button label). PASS.
- Gate range 13–19 × 13–19 (product 169–361) is outside E6 multiplication; whether a determined child can solve it on paper is the `[human]` row 7.9.

Verdict: PASS.
