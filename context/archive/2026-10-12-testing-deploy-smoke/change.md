---
change_id: testing-deploy-smoke
title: Smoke wdrożenia i PWA po każdym deployu (plan testów, etap 2)
status: archived
created: 2026-10-12
updated: 2026-10-12
archived_at: 2026-10-12T14:23:06Z
---

## Notes

Open a change folder for rollout Phase 2 of context/foundation/test-plan.md: "Deploy and PWA smoke".
Risks covered: #3 (zainstalowana gra nie startuje offline, stary build lub złe nagłówki po deployu), #4 (deploy lub bootstrap psuje wspólny VPS / CoiledSpring). Test types planned: integration (post-deploy smoke), manual tablet.
Risk response intent: #3 — po `switch` strona serwuje nowy identyfikator builda, manifest i `sw.js` z `no-cache`, hashowane bundle z `immutable`, a precache w `sw.js` wymienia dokładnie bieżące bundle z `index.html`; nie ufać samemu „tytuł w HTML”. #4 — stan CoiledSpring obserwowany przed i po deployu/bootstrapie, nie z linii `[ok]`.
