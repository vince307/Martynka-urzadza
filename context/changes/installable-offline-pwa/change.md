---
change_id: installable-offline-pwa
title: Instalowalna gra offline na tablecie (PWA, cicha aktualizacja, nakładka „Obróć tablet”)
status: implemented
created: 2026-10-11
updated: 2026-10-12
archived_at: null
---

## Notes

S-01 z roadmapy (zamyka etap M0): manifest i service worker przez vite-plugin-pwa z precache całego buildu i cichą aktualizacją przy następnym starcie (FR-003), instrukcja „Dodaj do ekranu początkowego” przy pierwszym uruchomieniu w przeglądarce dopasowana do iPada/Androida (FR-001), nakładka „Obróć tablet” w pionie (FR-002). Z przeglądu F-02: hashowane bundle Vite do `build.assetsDir: '_app'`, matcher Caddy `/_app/*`; ponowny bootstrap przez `ssh martynka-ops sync` + `bootstrap`. Test instalacji na tabletach wykonuje właściciel.
