<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Instalowalna gra offline na tablecie (PWA)

- **Plan**: context/changes/installable-offline-pwa/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-12
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warnings, 7 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Zakres git: f2d8bd5..ab029e4 (PR #5, #6) plus commity domykające na gałęzi close-out. Wszystkie pozycje „Changes Required” faz 1–3 istnieją i odpowiadają kontraktom (zaakceptowane adaptacje: trzeci argument `mountInstallHint`, `userAgent` w `WindowInfo`, akapit w README zamiast podmiany, nagłówek `Content-Type` manifestu z PR #6). Żadna pozycja „What We're NOT Doing” nie weszła. Kryteria automatyczne 1.1–1.6, 2.1–2.4, 3.1–3.3 powtórzone 2026-10-12 na `main`: wszystkie przechodzą; ręczne 1.7, 2.5, 3.4, 3.7 sprawdzone przez agenta w Chrome i curl, 3.5–3.6 potwierdzone przez właściciela na iPadzie i Androidzie. Weryfikacja PNG: sygnatura, IHDR (8-bit RGBA), bajt filtra 0, poprawne CRC w pięciu plikach.

## Findings

### F1 — Brak jawnego `maximumFileSizeToCacheInBytes`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: vite/config.shared.mjs:47-54
- **Detail**: Domyślny limit Workbox to 2 MiB; chunk Phasera ma 1,38 MB, ale globy obejmują ogg/m4a/webp/png, a CLAUDE.md obiecuje „wszystko ładowane na starcie”. Pierwszy plik powyżej 2 MiB wypadłby z precache z samym ostrzeżeniem builda i zepsuł offline.
- **Fix**: `maximumFileSizeToCacheInBytes: 10 * 1024 * 1024` w `workbox`.
- **Decision**: FIXED (2026-10-12)

### F2 — `style.css` z `public/` bez kontroli cache

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: index.html:12, public/style.css, deploy/Caddyfile:12-20
- **Detail**: Plik z `public/` nie ma `Cache-Control`; karta bez aktywnego SW (pierwsza wizyta, wyczyszczone dane) może trzymać stary arkusz po deployu wg heurystyki `Last-Modified`.
- **Fix**: Przenieść do `src/style.css` i `import './style.css'` w `src/main.ts`, żeby Vite hashował go do `_app/` (immutable).
- **Decision**: FIXED (2026-10-12)

### F3 — Listener `beforeinstallprompt` na poziomie modułu

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pwa/installHint.ts:16-20
- **Detail**: `preventDefault()` zawsze, także gdy instrukcja nie jest pokazywana (tłumi natywne UI Chrome bez zamiennika); efekt uboczny przy imporcie utrudnia testy bez `window`.
- **Fix**: Rejestrować listener wewnątrz `mountInstallHint` po bramce `shouldShowInstallHint` (zdarzenie przychodzi asynchronicznie, więc zdąży).
- **Decision**: FIXED (2026-10-12)

### F4 — Health check bez retry dla manifestu i sw.js

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: .github/workflows/deploy.yml:104-109
- **Detail**: Tylko pierwszy `curl` ma `--retry`; przy przeładowaniu Caddy w trakcie job może zbędnie upaść. Brak `shell: bash` (pipefail).
- **Fix**: `shell: bash` i te same flagi retry dla wszystkich trzech żądań.
- **Decision**: FIXED (2026-10-12)

### F5 — Ikony manifestu dwukrotnie w precache

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: vite/config.shared.mjs:41-49
- **Detail**: Glob png plus domyślne `includeManifestIcons`; Workbox scala identyczne wpisy, ale inna ścieżka w przyszłości dałaby błąd konfliktu rewizji.
- **Fix**: `includeManifestIcons: false`.
- **Decision**: FIXED (2026-10-12)

### F6 — Brak nagłówków hardeningu w Caddy

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: deploy/Caddyfile
- **Detail**: Kolejność nagłówków poprawna. Brak `X-Content-Type-Options nosniff`, `Referrer-Policy no-referrer` i CSP; CSP wymaga sprawdzenia, czy Phaser 4 potrzebuje `blob:`/`unsafe-eval`.
- **Fix**: Osobna mała zmiana `deploy/` (nosniff, referrer-policy, CSP po teście z Phaserem) po M0.
  - Strength: Tanie wzmocnienie strony dla dzieci bez wpływu na kod gry.
  - Tradeoff: CSP może zablokować Web Audio/WebGL workery bez testu; stąd osobna zmiana z weryfikacją.
  - Confidence: HIGH — nagłówki są standardowe; niepewność dotyczy tylko CSP.
  - Blind spot: Wymagania Phasera 4 wobec CSP niesprawdzone.
- **Decision**: DEFERRED (follow-ups/review-fixes.md)

### F7 — Tytuł instrukcji używa słownictwa iOS

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/data/pl.ts:10-12
- **Detail**: Tytuł „ekranu początkowego” (iOS) przy instrukcji Androida „ekranu głównego”.
- **Fix**: Neutralny tytuł „Zainstaluj grę na tablecie”; platformowe nazwy zostają w instrukcjach.
- **Decision**: FIXED (2026-10-12)

### F8 — Heurystyka platformy (`navigator.platform`, tryb „Wersja na komputer”)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pwa/platform.ts:22
- **Detail**: `navigator.platform` jest przestarzałe, ale to jedyny sygnał iPadOS; Android z „Wersją na komputer” nie dostanie instrukcji. Gra działa bez instrukcji.
- **Fix**: — (akceptowalne w M0).
- **Decision**: ACCEPTED
