---
change_id: static-deploy-pipeline
title: Statyczny deploy dist/ z GitHub Actions na VPS za Caddy
status: implemented
created: 2026-10-11
updated: 2026-10-11
archived_at: null
---

## Notes

Roadmapa F-02 (etap M0, `context/foundation/roadmap.md`): build `dist/` publikowany z GitHub Actions na istniejący VPS za Caddy (HTTPS), z zachowaniem poprzedniego wydania do rollbacku; runbook w `deploy/README.md`. Odblokowuje S-01 (gra otwiera się z adresu URL na tablecie) i weryfikację offline po każdym etapie. Blocker: własna domena nie jest kupiona; do tego czasu adres tymczasowy. Wzorce do ponownego użycia: `/Users/kamilp/Dev/CoiledSpring/deploy/` (bootstrap, ops account, rollback). Decyzje: CLAUDE.md sekcja „Deployment” (2026-10-10), `tech-stack.md` (self-host, github-actions, auto-deploy-on-merge). Prowadzone przez agenta jako orkiestratora (run 2026-10-11).
