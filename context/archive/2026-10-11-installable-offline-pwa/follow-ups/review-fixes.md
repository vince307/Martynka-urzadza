# Follow-ups z przeglądu implementacji (2026-10-12)

- **F6 (impl-review)**: nagłówki hardeningu w `deploy/Caddyfile`: `X-Content-Type-Options nosniff`, `Referrer-Policy no-referrer`, CSP (`default-src 'self'`; sprawdzić, czy Phaser 4 wymaga `blob:`/`worker-src`/`unsafe-eval` dla WebGL i Web Audio). Osobna mała zmiana `deploy/` po M0; wdrożenie przez `ssh martynka-ops sync` + `bootstrap`.
