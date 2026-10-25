---
project: "Martynka urządza"
version: 2
status: draft
created: 2026-10-11
updated: 2026-10-25
prd_version: 3
main_goal: quality
top_blocker: decisions
milestone_id: wysylki-rodzica-i-statystyki
milestone_seq: 2
milestone_status: open
---

# Roadmap: Martynka urządza

> Derived from `context/foundation/prd.md` (v3, wymagania „Po v1 — opinia rodzica, raport o błędzie, statystyki odwiedzin”) + decyzje autora w `docs/human-checklist.md` (sekcje „Do zrobienia: statystyki odwiedzin” i „Do zrobienia: opinia rodzica i raport o błędzie z gry”) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded. Poprzedni kamień (M-01, etapy M0–M8) jest w historii gita tego pliku i w `## Milestone History`.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-02: Wysyłki rodzica i statystyki odwiedzin** — Status: open

- **Intent:** Rodzic może świadomie, za bramką dla dorosłych, wysłać autorowi opinię albo raport o błędzie i przeczytać, co gra zbiera; autor widzi zbiorcze statystyki odwiedzin strony. Dane dziecka nadal nie opuszczają urządzenia. Kamień niesie też przeniesiony z M-01 balans po testach z córką (S-17).
- **Source materials:** `context/foundation/prd.md` (v3): FR-028–FR-031 z sekcji „Po v1”, NFR prywatności, Guardrails, Open Questions 8–10; FR-027 dla przeniesionego S-17.
- **Done when:** every S-NN below is `done`.
- **Scope anchors:** FR-027 (przeniesione z M-01), FR-028, FR-029, FR-030, FR-031; NFR „Prywatność”; Guardrail „Działa offline i bez sieci zewnętrznej”.

## Vision recap

Gra działa lokalnie i offline, bez kont i bez telemetrii; dziecko ćwiczy matematykę i urządza salon. Wersja 2 PRD dodaje jedną kontrolowaną furtkę: rodzic, nie dziecko, może sam wysłać autorowi opinię albo raport o błędzie, zawsze bez danych dziecka, a autor dowiaduje się o ruchu na stronie wyłącznie z obsługi pobierania gry, bez kodu w grze.

## North star

**S-19: Rodzic wysyła autorowi opinię z ustawień, a autor ją czyta** — pierwszy przepływ, w którym coś z gry trafia na własny serwer; dowodzi naraz trzech rzeczy, na których stoi cały kamień: wysyłka tylko za bramką, nic z danych dziecka, spokojne zachowanie bez sieci.

> Gwiazda przewodnia (north star) to tutaj: najmniejszy wycinek od ekranu do zapisu po drugiej stronie, którego dostarczenie dowodzi, że ta część produktu działa. Stoi tak wcześnie, jak pozwala strona „Prywatność” (cel `quality`: najpierw rodzic może przeczytać, co wychodzi, potem coś wychodzi).

## At a glance

| ID    | Change ID             | Outcome (user can …)                                                        | Prerequisites | PRD refs                    | Status   |
| ----- | --------------------- | --------------------------------------------------------------------------- | ------------- | --------------------------- | -------- |
| S-17  | playtest-balance      | autor dostraja balans w danych gry po obserwacji córki                       | S-16a (M-01, done) | FR-027, Success Criteria (Primary), PRD Open Question 5 | proposed |
| S-18  | privacy-page          | rodzic czyta stronę „Prywatność” z linku w grze                              | —             | FR-031, NFR Prywatność      | ready    |
| S-19  | parent-feedback-send  | rodzic wysyła opinię za bramką (także bez sieci), autor ją czyta             | S-18          | FR-028, NFR Prywatność, Guardrails | proposed |
| S-20  | parent-bug-report     | rodzic jednym stuknięciem wysyła raport z karty „Ups!” i z „Zapis gry”       | S-19          | FR-029, NFR Prywatność      | proposed |
| S-21  | visit-stats           | autor widzi zbiorcze statystyki odwiedzin bez kodu w grze                    | S-18          | FR-030, NFR Prywatność      | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                  | Chain                       | Note                                                                 |
| ------ | ---------------------- | --------------------------- | -------------------------------------------------------------------- |
| A      | Wysyłki rodzica        | `S-18` → `S-19` → `S-20`    | Cel `quality`: strona „Prywatność” przed pierwszą wysyłką; raport o błędzie używa drogi opinii. |
| B      | Statystyki odwiedzin   | `S-21`                      | Joins Stream A at `S-18`; równolegle z `S-19`, bez kodu w grze.        |
| C      | Balans po testach      | `S-17`                      | Przeniesione z M-01; zależy od obserwacji córki, nie od kodu; równolegle ze wszystkim. |

## Baseline

What's already in place in the codebase as of `2026-10-25` (auto-researched + user-confirmed).

- **Frontend:** present — gra Phaser 4.2.1 z panelem rodzica za bramką dla dorosłych (`src/ui/dom/settingsPanel.ts`, `src/core/parentGate.ts`), kartą awarii z linią `Kod:` (`src/ui/dom/errorCard.ts`) i sekcją „Zapis gry” (`src/ui/dom/saveHealthView.ts`); wszystkie teksty w `src/data/pl.ts`.
- **Backend / API:** absent — serwer tylko podaje statyczne pliki gry (`deploy/Caddyfile`: `file_server`); nie ma żadnego adresu przyjmującego dane.
- **Data:** present lokalnie, absent na serwerze — zapis gry w IndexedDB (`src/storage/idb.ts`); na serwerze nie ma miejsca na opinie i raporty.
- **Auth:** n/a — bez kont; bramka dla dorosłych to element UI (PRD Access Control).
- **Deploy / infra:** present — GitHub Actions → VPS wspólny z CoiledSpring (`deploy/`, `.github/workflows/deploy.yml`), konto agenta `martynka-ops`; zmiany w `deploy/` wdraża właściciel (`sync` + `bootstrap`).
- **Observability:** partial — w grze linie zdrowia w panelu rodzica (nic nie wychodzi z urządzenia); serwer nie ma logu dostępu, więc statystyk odwiedzin nie ma z czego liczyć.

## Foundations

Brak w tym kamieniu. Jedyny brakujący element przekrojowy — adres na serwerze przyjmujący wysyłki — powstaje w pierwszym wycinku, który go używa (`S-19`), a log dostępu w `S-21`.

## Slices

### S-17: Balans po testach z graczem

- **Outcome:** autor po obserwacji gry córki i miarach z historii w zapisie (czas na pokój, odsetek drugich prób per umiejętność) dostraja wyłącznie w danych gry tempo gwiazdek, koszty mebli, progi opanowania i czytelność poleceń; przejście salonu zajmuje sensowny czas, zadania nie są ani za łatwe, ani frustrujące.
- **Change ID:** playtest-balance
- **PRD refs:** FR-027, Success Criteria (Primary), PRD Open Question 5 (motywacja po salonie)
- **Prerequisites:** S-16a (M-01, done)
- **Parallel with:** S-18, S-19, S-20, S-21
- **Blockers:** —
- **Unknowns:**
  - Ile tygodni obserwacji wystarczy, by ocenić kryterium „gra 3 razy w tygodniu przez 4 tygodnie”? — Owner: autor. Block: no.
- **Risk:** zamyka M8 i cały kamień; jedyny wycinek, którego „gotowe” zależy od zachowania gracza, nie od kodu.
- **Status:** proposed

### S-18: Strona „Prywatność”

- **Outcome:** rodzic otwiera z gry krótką stronę „Prywatność” i czyta po polsku, co gra zbiera przy pobieraniu i aktualizacji, co będzie zawierać opinia i raport o błędzie, po co, jak długo jest przechowywane i jak poprosić o usunięcie; strona działa też offline.
- **Change ID:** privacy-page
- **PRD refs:** FR-031, NFR Prywatność, PRD Open Questions 8 i 10
- **Prerequisites:** —
- **Parallel with:** S-17
- **Blockers:** —
- **Unknowns:**
  - Gdzie rodzic znajduje link do strony: ekran powitalny dla rodzica, ustawienia, czy oba (PRD Open Question 10)? — Owner: autor. Rozstrzygnięte 2026-10-25: oba (ekran powitalny przy „Rodzic” i ustawienia).
  - Jak długo autor trzyma opinie i raporty (propozycja PRD: 12 miesięcy) i czy e-mail znika wcześniej, po odpowiedzi (PRD Open Question 8)? — Owner: autor. Rozstrzygnięte 2026-10-25: 12 miesięcy; e-mail usuwany po odpowiedzi, najpóźniej po 12 miesiącach.
  - Kto jest administratorem danych i jaki adres kontaktowy podać do prośby o usunięcie (strona publiczna, repozytorium publiczne)? — Owner: autor. Block: no (rozstrzygnąć w `/10x-plan`).
- **Risk:** stoi pierwsza, bo przy celu `quality` rodzic ma móc przeczytać, co wychodzi, zanim cokolwiek wyjdzie; ryzyko: strona obiecuje coś, czego kolejne wycinki nie dotrzymają — każdy z nich aktualizuje ją w tym samym PR.
- **Status:** ready

### S-19: Opinia rodzica do autora

- **Outcome:** rodzic w ustawieniach (za bramką dla dorosłych) pisze opinię, opcjonalnie podaje e-mail do odpowiedzi i wysyła ją; do opinii dołącza się wersja gry i typ urządzenia, nigdy postęp, etap, imię ani historia; bez sieci opinia czeka i wychodzi przy następnym połączeniu, a rodzic widzi, że jeszcze nie wyszła; nieudana wysyłka kończy się spokojnym komunikatem bez utraty tekstu; autor czyta opinie po swojej stronie i dowiaduje się o nowej.
- **Change ID:** parent-feedback-send
- **PRD refs:** FR-028, NFR Prywatność, Guardrails (wysyłki tylko świadomie przez rodzica), PRD Open Questions 8 i 9
- **Prerequisites:** S-18
- **Parallel with:** S-21, S-17
- **Blockers:** wdrożenie części serwerowej — po scaleniu PR właściciel uruchamia `sync` i `bootstrap` na VPS-ie i sprawdza, że CoiledSpring działa (zmian w `deploy/` agent nie wdraża sam).
- **Unknowns:**
  - Ile opinii z jednego urządzenia lub adresu w danym czasie jest w porządku, zanim kolejne zostaną odrzucone, i jak autor dowiaduje się o nowej opinii (e-mail, komenda na serwerze, oba) (PRD Open Question 9)? — Owner: autor. Rozstrzygnięte 2026-10-25: 5 na godzinę i 20 na dobę z jednego adresu; raz dziennie e-mail z liczbą nowych, treść komendą na serwerze.
  - Jak długo opinie leżą na serwerze i kiedy znika e-mail (PRD Open Question 8; ta sama decyzja co w S-18)? — Owner: autor. Rozstrzygnięte 2026-10-25 (jak w S-18).
  - Gdzie na wspólnym VPS-ie żyje przyjmowanie wysyłek, tak żeby awaria lub nadużycie nie dotknęły CoiledSpring ani wydań gry? — Owner: zespół. Block: no (rozstrzyga `/10x-research`).
  - Jak kolejka „wyślij przy następnym połączeniu” zachowuje się po zamknięciu gry i po aktualizacji (gdzie leży tekst, czy przeżywa reset zapisu)? — Owner: zespół. Block: no.
- **Risk:** gwiazda przewodnia; pierwszy ruch danych z gry na zewnątrz i pierwszy adres na serwerze przyjmujący dane — ryzyko prywatności (dane dziecka w treści, e-mail w logach) i nadużycia (spam, zapchany dysk wspólnego VPS-a).
- **Status:** proposed

### S-20: Raport o błędzie z gry

- **Outcome:** rodzic jednym stuknięciem wysyła autorowi raport z karty awarii („Ups!”) i z sekcji „Zapis gry”: kod błędu, wersja gry, typ urządzenia i kilka linii technicznych, bez postępu, etapu i historii dziecka; gra nigdy nie wysyła raportu sama; bez sieci raport zachowuje się jak opinia.
- **Change ID:** parent-bug-report
- **PRD refs:** FR-029, NFR Prywatność
- **Prerequisites:** S-19
- **Parallel with:** S-21, S-17
- **Blockers:** jak w S-19, jeśli raport zmienia część serwerową.
- **Unknowns:**
  - Karta „Ups!” zatrzymuje grę — czy wysyłka z niej ma działać bez bramki dla dorosłych (gra stoi, dziecko może stuknąć), czy z bramką? — Owner: autor. Block: no (rozstrzygnąć w `/10x-plan`; PRD mówi „rodzic jednym stuknięciem”).
  - Które „kilka linii technicznych” wolno dołączyć, żeby żadna nie niosła danych dziecka (np. nazwa umiejętności w `Kod:` jest daną o postępie?) — Owner: zespół. Block: no.
- **Risk:** po S-19, bo używa tej samej drogi i tej samej kolejki; ryzyko: linia techniczna przemyca dane dziecka.
- **Status:** proposed

### S-21: Statystyki odwiedzin dla autora

- **Outcome:** autor widzi zbiorczy raport odwiedzin strony gry: unikalni odwiedzający (dzień, tydzień, miesiąc), nowi i powracający, uruchomienia gry z siecią, typ urządzenia, źródła wejść, odsetek urządzeń z najnowszą wersją, błędy pobierania; raport powstaje wyłącznie z obsługi pobierania i aktualizacji gry, adresy są skracane, surowe zapisy znikają po 30–90 dniach; w grze nie przybywa ani jednej linii kodu.
- **Change ID:** visit-stats
- **PRD refs:** FR-030, NFR Prywatność
- **Prerequisites:** S-18
- **Parallel with:** S-19, S-20, S-17
- **Blockers:** wdrożenie na VPS-ie przez właściciela (`sync` + `bootstrap`), jak w S-19.
- **Unknowns:**
  - Ile dni trzymać surowe zapisy w widełkach 30–90? — Owner: autor. Block: no (rozstrzygnąć w `/10x-plan`, potrzebne też na stronie „Prywatność”).
  - Jak autor ogląda raport: tylko przez tailnet, za hasłem, czy jako podsumowanie z komendy na serwerze? — Owner: autor. Block: no.
  - Czy wersja serwera na VPS-ie umie skracać adresy w logu tak, jak zakłada decyzja z 2026-10-20? — Owner: zespół. Block: no (sprawdza `/10x-research`).
- **Risk:** po S-18, bo log dostępu to nowe zbieranie danych, które strona „Prywatność” ma opisać, zanim się zacznie; ryzyko: log wspólnego serwera obejmie też ruch CoiledSpring albo trzyma pełne adresy.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID            | Suggested issue title                                       | Ready for `/10x-plan` | Notes |
| ---------- | -------------------- | ----------------------------------------------------------- | --------------------- | ----- |
| S-17       | playtest-balance     | Balans po testach z córką                                   | no                    | Czeka na obserwacje autora (przeniesione z M-01). |
| S-18       | privacy-page         | Strona „Prywatność” z linkiem dla rodzica                   | yes                   | PRD Open Questions 8 i 10 rozstrzygnięte 2026-10-25. |
| S-19       | parent-feedback-send | Opinia rodzica wysyłana do autora (z kolejką offline)        | no                    | Po S-18; PRD Open Questions 8 i 9 rozstrzygnięte 2026-10-25. |
| S-20       | parent-bug-report    | Raport o błędzie z karty „Ups!” i z „Zapis gry”             | no                    | Po S-19. |
| S-21       | visit-stats          | Statystyki odwiedzin z logu serwera, bez kodu w grze        | no                    | Po S-18; zmiana w `deploy/` wdrażana przez właściciela. |

## Open Roadmap Questions

1. **Przechowywanie opinii i raportów** (PRD Open Question 8): jak długo autor trzyma opinie i raporty (propozycja: 12 miesięcy) i czy adres e-mail jest usuwany wcześniej, po odpowiedzi. — Owner: autor. Rozstrzygnięte 2026-10-25: 12 miesięcy, e-mail usuwany po odpowiedzi (najpóźniej po 12 miesiącach).
2. **Ochrona przed nadużyciem wysyłek** (PRD Open Question 9): ile opinii i raportów z jednego urządzenia w danym czasie jest w porządku, zanim kolejne zostaną odrzucone; jak autor dowiaduje się o nowej opinii. — Owner: autor. Rozstrzygnięte 2026-10-25: 5/h i 20/dobę z jednego adresu; dzienny e-mail z liczbą nowych, treść komendą na serwerze.
3. **Gdzie rodzic znajduje stronę „Prywatność”** (PRD Open Question 10): ekran powitalny dla rodzica, ustawienia, czy oba. — Owner: autor. Rozstrzygnięte 2026-10-25: oba.
4. **Ryzyko: motywacja po salonie** (PRD Open Question 5): mierzy S-17; kierunek po v1 to ulica i domy. — Owner: autor. Block: — (kolejny kamień).

## Parked

- **Ulica i domy** (PRD v3 FR-032–FR-036) — Why parked: kandydat na kamień M-03; zależy od tempa z S-17 (PRD Open Question 11) i od inwentaryzacji grafik (PRD Open Questions 12–13).
- **Docelowe grafiki salonu „przed remontem”** (paczka zamówiona 2026-10-25) — Why parked: nie jest wymaganiem PRD, tylko podmianą obecnego postarzenia w kodzie; wejdzie jako osobna zmiana, gdy paczka dotrze.
- **Statystyki nauki z gry** — Why parked: PRD Non-Goals; dane o dziecku, mało graczy; później najwyżej jako opcja domyślnie wyłączona.
- **Opinia przez `mailto:`, formularz zewnętrzny lub GitHub** — Why parked: odrzucone przez autora 2026-10-20/21 (`docs/human-checklist.md`): dane u obcej firmy albo rodzice bez kont.
- **Fabuła, energia, timery, reklamy, zakupy, wiele profili, chmura, merge board, układ pionowy** — Why parked: PRD Non-Goals, bez zmian od M-01.

## Milestone History

(Append-only. Carried forward verbatim into each successor milestone's roadmap.)

- **M-01: Wersja 1, pełna pętla gry (etapy M0–M8)** (`v1-pelna-petla-m0-m8`) — closed 2026-10-25. Etapy M0–M7 dostarczone i wdrożone (F-01–F-03, S-01–S-16d done, ostatnie scalenie 7770ae8); S-17 (M8, balans po testach z córką) zależy od obserwacji, nie od kodu, więc za zgodą autora przeniesione do M-02 zamiast blokować zamknięcie.

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Pełna lista M-01 jest w historii gita tego pliku.)
