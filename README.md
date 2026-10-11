# Martynka urządza

Gra matematyczna dla dzieci z klas 1–3: dziecko rozwiązuje rundy zadań dopasowanych do etapu nauki (program klas 1–3), zdobywa gwiazdki i wydaje je na urządzanie pokoju, wybierając jeden z trzech wariantów każdego mebla. Tablet w poziomie, tylko dotyk, instalowalna aplikacja webowa działająca offline, bez kont i bez backendu. Cały tekst w grze po polsku.

Stan: szkielet (etap M0). Phaser 4.2 + TypeScript + Vite, scena 1920×1080 dopasowana do ekranu, pusta scena startowa. PWA, testy i deploy dochodzą w kolejnych etapach.

## Wymagania

- Node.js 22 lub nowszy
- npm

## Komendy

| Komenda | Opis |
|---|---|
| `npm install` | Instalacja zależności |
| `npm run dev` | Serwer deweloperski Vite na http://localhost:8080 (dodaj `-- --host`, żeby otworzyć na tablecie w tej samej sieci) |
| `npm run build` | Build produkcyjny do `dist/` |
| `npm run preview` | Podgląd builda produkcyjnego |
| `npm run typecheck` | Sprawdzenie typów (`tsc --noEmit`); Vite nie sprawdza typów przy dev ani build |

## Układ katalogów

```
src/
  core/        czysta logika gry (bez importów Phasera), testowalna jednostkowo
  data/        treść i strojenie jako dane: teksty (pl.ts), układ sceny (layout.ts), dalej program, pokoje, balans
  scenes/      sceny Phasera; tylko rysują stan i przekazują akcje do core/
  ui/widgets/  widżety wielokrotnego użytku (klawiaturka, kafelki, zegar, linijka …)
  storage/     zapis postępu w przeglądarce, eksport i import
  main.ts      konfiguracja gry i start
public/        pliki serwowane z katalogu głównego (favicon, style, docelowo assets/)
tests/         testy logiki z core/
docs/          katalog zadań matematycznych (ZADANIA.md)
designs/       paczka graficzna (tylko do odczytu)
context/       dokumenty projektowe: PRD, roadmapa, zmiany
```

## Dokumentacja

- `Martynka-urzadza.md`: projekt i plan gry (pętla, model danych, ekrany, zapis, PWA, etapy M0–M8).
- `docs/ZADANIA.md`: katalog zadań matematycznych (etapy E1–E6, typy zadań, zakresy liczb).
- `context/foundation/`: PRD, stack, roadmapa.
- `CLAUDE.md`, `AGENTS.md`: zasady pracy dla agentów AI w tym repozytorium.

## Licencja

MIT (zob. `LICENSE`). Szkielet projektu powstał z szablonu [Phaser Vite TypeScript](https://github.com/phaserjs/template-vite-ts) (MIT, Phaser Studio Inc).
