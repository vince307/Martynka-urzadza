# Follow-upy — parent-settings-progress (S-08)

Każdy wpis ma `Trigger:`; późniejsze slice'y szukają ich grepem.

## Test-plan

- Ryzyko #14 (proposed), do `context/foundation/test-plan.md` przez `/10x-test-plan refresh`: „Dziecko wchodzi do ustawień
  rodzica stuknięciem lub zwykłym przytrzymaniem, stuknięcie pod dialogiem rodzica trafia do gry, albo zmiana etapu przez
  rodzica nie działa od razu (kolejna runda wciąż ze starego etapu, gwiazdki znikają). Wpływ: wysoki, prawdopodobieństwo:
  średnie. Źródło: PRD FR-015, US-03 AC, Access Control; roadmap S-08. Warstwa: testy jednostkowe `core` (maszyna
  przytrzymania, `changeStageByParent`, ranking, `effectiveAutoRead`) + lokalny e2e (dotyk przez CDP). Anty-wzorce:
  ustawianie etapu przez hak, czekanie stałym czasem zamiast na dialog, asercja treści zadania.” Spec nosi w tytule
  `#14 (proposed)` (konwencja #12/#13).
  Trigger: `/10x-test-plan refresh`, or before S-11

## Zapis (S-11)

- Do S-11 ustawienia rodzica są sesyjne: zapisać `Settings` (`autoRead: boolean | null`), historię z polem `example`
  (przykłady błędów) i, jeśli karta „Nowa umiejętność!” ma przetrwać sesję, `pendingUnlock` jako `{ stage, step }`.
  Trigger: S-11
- Wcześniejszy zapis ucznia przed codzienną grą obejmuje teraz także ustawienia rodzica i podgląd postępów (zimny start:
  powitanie od nowa, etap z wieku albo z „Rodzic”, auto-czytanie domyślne etapu, podgląd z podłogi kalendarza i stan
  pusty). Trigger: before S-11, or any deploy used for daily play

## Eksport, import, reset (S-12)

- Eksport/import/reset trafią do tego samego panelu. Eksport niesie przykłady błędów dziecka (polecenie, odpowiedź
  dziecka, poprawna odpowiedź): dodać notkę prywatności przy eksporcie i przy imporcie cudzego pliku (plan-review F6).
  Trigger: S-12

## Strojenie

- Kalibracja `holdMs` (2000) i `moveTolerance` (30) w `balance.parentSettings` na prawdziwym tablecie: wystarcza
  rodzicowi, nie zdarza się dziecku trzymającemu tablet za róg. Trigger: S-17
