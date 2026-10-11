---
starter_id: phaser-vite-ts
package_manager: npm
project_name: martynka-urzadza
hints:
  language_family: js
  team_size: solo
  deployment_target: self-host
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: best-effort
  path_taken: custom
  quality_override: true
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: false
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Stack został ustalony w planie (`Martynka-urzadza.md`, sekcja 3) przed tym krokiem: Phaser 4.2.x + TypeScript + Vite z oficjalnego szablonu `npm create @phaserjs/game` (Vite + TypeScript), do tego `vite-plugin-pwa` (manifest, service worker, precache, cicha aktualizacja), `idb-keyval` (zapis w IndexedDB) i `vitest` (testy czystej logiki w `core/`); lektor przez Web Speech API. Produkt to statyczna, instalowalna aplikacja webowa offline dla jednego dziecka na jednym urządzeniu, bez backendu, bez auth, płatności, realtime, AI ani zadań w tle, więc żaden starter z rejestru nie pasuje, a `starter_id` jest spoza rejestru: repo jest już wygenerowane z szablonu Phasera, dlatego `/10x-bootstrapper` należy pominąć (odmówi na nieznanym starterze), a brakujące zależności i podbicie Phasera z 4.0.0 do 4.2.x robi etap M0. Bramka „oparty na konwencjach” nie przechodzi dla minimalnego szablonu Vite; kompensacją jest architektura z planu (`core/` bez Phasera, `data/`, `scenes/`, `storage/`, `tests/`) oraz zasady w CLAUDE.md/AGENTS.md, w tym sprawdzanie API Phaser 4 w dokumentacji zamiast polegania na idiomach v3. Wdrożenie: statyczny build `dist/` serwowany przez Caddy na własnym VPS (self-host), deploy z GitHub Actions z auto-deployem po merge do `main` i zachowaniem poprzedniego wydania do rollbacku.
