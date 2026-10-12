## Co i dlaczego

<!-- Jedno–trzy zdania. Link do zmiany w context/ (plan, przegląd), jeśli jest. -->

## Treść zadań (wypełnij, gdy PR zmienia `src/data/` albo generatory w `src/core/tasks/`)

Odczyt nauczyciela (plan testów, §6.2) — zaznacz, co sprawdzono na `npm run sample -- <etap> --count 6`:

- [ ] Przeczytałem/am wszystkie zadania zmienionych kroków, nie tylko wyrywkowo.
- [ ] Liczba i rzeczownik zgadzają się: 1 jabłko / 2 jabłka / 5 jabłek, a po czasowniku biernik („ma 1 naklejkę”).
- [ ] Rodzaj czasownika zgadza się z imieniem („Ola kupiła”, „Kuba kupił”).
- [ ] Kontekst ma sens (ciastka na talerzu, nie poduszki; pudełka dla małych rzeczy).
- [ ] Podpowiedź uczy metody ze szkoły (do dziesiątki, podwajanie, działanie odwrotne), nie zdradza wyniku w pierwszym kroku przy okienku.
- [ ] Rozpraszacze są bliskie, ale jednoznaczne; odpowiedź zawsze wśród kafelków.
- [ ] Każdy nowy rzeczownik jest w `src/data/nouns.ts` (3 formy) i ma biernik w kontekście.
- [ ] Polecenie mieści się w 1–3 zdaniach (E3+), bez „undefined”, podwójnych spacji, literówek.

## Weryfikacja

- [ ] `npm run lint`, `npm run typecheck`, `npm test` zielone lokalnie (CI powtórzy).
- [ ] Zmiany w `deploy/`: po merge `ssh martynka-ops sync` + `bootstrap` z listą kontrolną CoiledSpring (runbook, sekcja 10).
