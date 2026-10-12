# /10x-configure-hook — raport (2026-10-12)

## Wejścia

- Plan testów: `context/foundation/test-plan.md` §5 (bramki: lint + typecheck, unit + property, content smoke, post-edit hook — wszystkie `required`; pre-commit lint `optional (not configured)`).
- Harness: Claude Code (`.claude/settings.json`, `.claude/hooks/`, `CLAUDE.md`, `.claude/.10x-cli-manifest.json`). Innych harnessów brak.
- Toolchain: ESLint 10.12 (`npm run lint` = `eslint --max-warnings 0 .`, ~2 s cały projekt, ~1,2 s plik), `tsc --noEmit` (~3 s), vitest 5 (`vitest run` 24 pliki / 201 testów ≈ 1,5 s, więc koniec tury uruchamia cały zestaw; `vitest related <plik> --run` działa i wychodzi 0 bez dopasowań). Git-hook manager: brak. `jq` dostępny.
- Baseline końca tury na czystym drzewie: zielony (lint, tsc, vitest).

## Odroczenia

- Brak odroczeń w planie testów. Pre-commit git hook oznaczony jako opcjonalny i nieskonfigurowany (zalecenie poniżej).

## Audyt istniejących hooków

`.claude/settings.json`: `PostToolUse` (`Write|Edit`) → `lint-edited-file.sh` (30 s) i `related-tests.sh` (60 s); `Stop` → `end-of-turn.sh` (120 s). Kanał: exit 2 + stderr. Wady znalezione:

1. Per-edit i koniec tury używały `eslint --quiet`: warning przechodził lokalnie, a `npm run lint --max-warnings 0` w CI by go odrzucił → zastąpione `--max-warnings 0 --no-warn-ignored`.
2. `tsc --noEmit` bez `--pretty false` (kolory w wyjściu dla modelu) → dodane.
3. Brak osieroconych skryptów; `related-tests.sh` bez zmian.

## Skonfigurowane

- `.claude/hooks/lint-edited-file.sh`: `npx eslint --max-warnings 0 --no-warn-ignored "$FILE"`, tylko pliki `.ts/.tsx/.mts/.cts/.js/.jsx/.mjs/.cjs` wewnątrz projektu, exit 2 + stderr.
- `.claude/hooks/end-of-turn.sh`: ESLint (te same flagi) na zmienionych plikach z `git diff` + nieśledzonych, `tsc --noEmit --pretty false`, `vitest run`; `stop_hook_active`/`loop_count` → exit 0.
- `settings.json` bez zmian (timeouty 30/60/120 s).

## Dowód (payloady przez stdin)

| Przypadek | Wynik |
|---|---|
| 1. Zepsuty plik (`const unusedThing = 1` w `src/core/rng.ts`), per-edit | exit 2, stderr „ESLint reported errors in …rng.ts … 97:7 error 'unusedThing' is assigned…” |
| 2. Poprawny plik, per-edit | exit 0, brak wyjścia |
| 3. Pomijany typ (`README.md`) | exit 0 |
| 4. Nieistniejący plik (`src/core/nope.ts`) | exit 0 |
| 5. Pusty payload `{}` i `not json` | exit 0, exit 0 |
| 6. Koniec tury z `stop_hook_active: true` przy zepsutym pliku | exit 0 |
| 7. Edycja przez powłokę (plik zepsuty na dysku, bez payloadu per-edit), koniec tury `{}` | exit 2, stderr „Fix these before you finish: ESLint errors in changed files: …rng.ts 97:7” |
| 8. Ścieżka ignorowana podana wprost (`dist/sw.js`) | exit 0 (`--no-warn-ignored`) |
| `related-tests.sh` na czystym `rng.ts` | exit 0 (uruchamia `tests/rng.test.ts`) |

Po dowodach plik przywrócony; `git status` czysty w `src/`.

## Nadal wymagane od użytkownika

- Hooki w `.claude/settings.json` są już załadowane (bez zmian w settings); zmiany skryptów działają od następnego wywołania. `/hooks` pokazuje listę.

## Dryf referencji

- Brak: `references/anthropic.md` (verified 2026-09-25) zgadza się z zachowaniem (exit 2 + stderr, `stop_hook_active`, timeouty w sekundach).

## Poza zasięgiem

Lint, typy i testy jednostkowe nie dowodzą zachowania działającej gry: skalowanie sceny, dotyk, PWA offline, nagłówki cache, odczyt treści przez dziecko. Powierzchnie ryzyka: `src/scenes`, `src/pwa`, `deploy/`; weryfikacja ręczna na tablecie i smoke deployu (etap 2 planu testów).

## Zalecane bramki git (niezapisane)

- pre-commit: `npm run lint` na plikach w stagingu (`eslint --max-warnings 0 <pliki>`) i `npx vitest related <pliki> --run`; pre-push: `npm run typecheck && npm test`. Brak managera; Lefthook lub prosty `.git/hooks` do rozważenia, gdy ktoś poza agentem zacznie commitować.

## Następny krok

Edycja narzędziem Edit z błędem lintu, potem z błędem typu: hook per-edit i koniec tury odsyłają; przepisanie pliku przez powłokę z błędem lintu: koniec tury odsyła.
