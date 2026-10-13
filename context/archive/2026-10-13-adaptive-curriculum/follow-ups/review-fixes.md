# Follow-upy — adaptive-curriculum (S-07)

Każdy wpis ma `Trigger:`; późniejsze slice'y szukają ich grepem.

## Test-plan i test-stack

- Ryzyko #13 (proposed), do `context/foundation/test-plan.md` przez `/10x-test-plan refresh`: „Adaptacja nie prowadzi
  dziecka: runda losuje spoza odblokowanych kroków, druga próba podnosi opanowanie, krok nie odblokowuje się po opanowaniu
  większości umiejętności albo karta „Nowa umiejętność!” blokuje przejście do następnej rundy. Wpływ: średni,
  prawdopodobieństwo: średnie. Warstwa: testy jednostkowe `core/curriculum` i `core/mastery` (wiele ziaren) + jeden lokalny
  e2e: dziecko gra poprawnie, aż hak pokaże `screen: 'unlock'`, „Dalej” startuje rundę, `unlockedStep` wzrósł.
  Anty-wzorce: ustawianie opanowania z testu, stałe ziarno rng, asercja treści zadania.” Dopisać też #12 (pierwsze
  uruchomienie; dziś tylko „#12 (proposed)” w nagłówku `tests/e2e/first-launch.spec.ts`).
  Trigger: `/10x-test-plan refresh`, or before S-11
- `test-stack.md` § E2E nie opisuje projektu `chromium-hook` ani portu 4397 (`playwright.config.ts`, `E2E_HOOK_PORT`).
  Trigger: `/10x-e2e-setup` re-run

## Treść i UI

- ` = ?` po wyrażeniu w poleceniu (przeniesione z S-04). Trigger: S-16
- Książka na karcie to placeholder z kodu (`docs/design-gaps.md` wiersz 22). Trigger: S-16

## Zapis (S-11)

- Zapis pełnego `SessionLearner` (opanowanie, `unlockedStep`, liczniki łagodzenia, historia) i podłoga
  `max(zapisany, calendarStart)` na starcie sesji. Trigger: S-11
- „Wcześniejszy zapis ucznia” z S-06 obejmuje teraz także postęp nauki: do S-11 każdy zimny start zeruje opanowanie, wraca
  do podłogi kalendarza, a karta „Nowa umiejętność!” może się powtórzyć dla kroku odblokowanego wczoraj.
  Trigger: before S-11, or any deploy used for daily play

## Historia (S-08)

- Historia nie trzyma treści zadania ani złej odpowiedzi; „przykłady błędów” w ekranie rodzica wymagają decyzji, jakie pole
  dodać (np. `taskType` + `skillId` zamiast promptu). Trigger: S-08

## Kalibracja (S-17)

- Wagi 60/30/10 i łagodzenie 20/50/30, `minStartSteps`, próg `unlockAt` 4 i `unlockShare` 0.5 oraz długość łagodzenia
  (`weakRounds`, `rounds`) — sprawdzić w playteście z dzieckiem. Trigger: S-17
- Formuła podłogi kalendarza (plan-review F1): dziś postęp liczony na indeksie grywalnych kroków z `ceil`; E3 w październiku
  stoi na kroku 6 („Liczby 21–30”), E6 w lutym na kroku 4, a wg kolejności podręcznika klasa jest wcześniej (~1 miesiąc).
  Alternatywa: indeks wszystkich kroków podręcznika zaokrąglony w dół do grywalnego kroku. Trigger: S-17

## Impl-review (2026-10-13)

- `SessionLearner.pendingUnlock` to goły numer kroku bez etapu: `TaskScene.unlockView` szuka go w bieżącym `this.stage`.
  Dziś etap nie zmienia się między końcem rundy a kartą (rozgrzewka nie odblokowuje, `WelcomeScene.start` zeruje), ale
  zmiana etapu przez rodzica albo wczytany zapis mogą to rozjechać (karta z nazwą innego kroku; brak nazwy obsługuje już
  `TaskScene.startNextRound`, który wtedy czyści oczekiwanie i gra dalej). Zapisać `{ stage, step }` albo czyścić
  `pendingUnlock` przy każdej zmianie etapu. Trigger: S-08 (zmiana etapu przez rodzica) or S-11
- `endRound`/`recordRound` zwracają `{ ...adaptation, … }`, a `TaskScene.finishRound` podaje cały `SessionLearner`, więc
  wynik typu `Adaptation` niesie też pola placementu. Działa, bo scena rozkłada go z powrotem na ucznia; przy S-11 (zapis
  samego `LearnerState`) wybrać klucze `Adaptation` jawnie. Trigger: S-11
- `firstPlayableSteps` (`core/round/pick.ts`) i `playableSteps` (`core/curriculum.ts`) filtrują kroki tym samym
  predykatem; jedno źródło przy następnej zmianie któregoś z nich. Trigger: next change to `pick.ts` or `curriculum.ts`

## Bramka wizualna (2026-10-13)

- W Chrome sterowanym przez rozszerzenie pierwsze stuknięcie po zmianie rozmiaru iframe (1024 ↔ 1440) albo po jego
  przeładowaniu czasem przepadało (3 z 5 razy; drugie zawsze działało), a gwiazdki lotu zostawały w połowie drogi.
  Najpewniej artefakt przyciętej pętli klatek w karcie bez fokusu (ta sama uwaga co O2 w bramkach S-05/S-06), nie błąd
  `TaskScene`. Sprawdzić na tablecie: obrót do pionu (nakładka „Obróć tablet”) i z powrotem, potem jedno stuknięcie
  w „Kolejna runda”/„Dalej” musi zadziałać. Trigger: first device playtest (S-17) or any `Scale` config change
