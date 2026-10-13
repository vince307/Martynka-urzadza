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

## Impl-review (2026-10-13, `reviews/impl-review.md`)

- (F4) `src/pwa/installHint.ts` `mountInstallHint`: the `beforeinstallprompt` listener stays registered after "Graj w
  przeglądarce" and keeps calling `preventDefault()`, hiding the browser's own install prompt for the session (code from
  S-01, not changed in intent by S-08). Remove the listener or stop preventing the default in `dismiss`.
  Trigger: the next change to src/pwa
- (F5) `src/scenes/UIScene.ts`: the long-press state returns to idle only in `UIScene.openSettings`; another holder of the
  input suspender opening over the HUD would leave a hold armed. Feed `{ type: 'reset' }` from the suspender (or on every
  `suspend`) when a second overlay can open above the HUD. Trigger: any new overlay that calls `suspend()` while the HUD exists
- (F6) `src/scenes/WelcomeScene.ts` `openParent` casts `registry.get(REGISTRY_KEYS.inputSuspender)` without the
  `undefined` guard `UIScene.openSettings` has; pick one style. Trigger: the next change to WelcomeScene or UIScene
- (F7) `src/data/pl.ts` `settings.empty` ("Za mało odpowiedzi z błędami…") also shows for a child who made no first-try
  mistakes at all; a parent may read it as "no data". Consider a separate line for "no mistakes yet" once the save
  (S-11) keeps long histories. Trigger: S-11, or a parent's feedback on the preview
