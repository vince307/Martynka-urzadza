// All player-facing Polish strings live here. Scenes and generators reference
// keys, never literals. Task prompts that need a number are functions.
import type { FailureStage } from '../core/autosave';
import { formatNumber } from '../core/text/formatNumber';
import { countNoun, inflect, pluralCategory } from '../core/text/plural';
import { nouns } from './nouns';

export const pl = {
    title: 'Martynka urządza',
    welcome: {
        question: 'Ile masz lat?',   // kit welcome.png
    },
    // DESIGN-GAP (docs/design-gaps.md rows 15-17): the kit has no parent entry, adult gate or stage panel; the texts are ours.
    parent: {
        entry: 'Rodzic',
        gateTitle: 'Pytanie dla rodzica',
        gatePrompt: (a: number, b: number) => `Ile to jest ${a} · ${b}?`,
        gateWrong: 'To nie ta liczba. Spróbuj z nowym działaniem.',
        gateAnswer: 'Wpisana liczba',
        deleteKey: 'Usuń',
        okKey: 'OK',
        cancel: 'Anuluj',
        panelTitle: 'Ustawienia startowe',
        ageHeading: 'Wiek dziecka',
        stageHeading: 'Etap nauki',
        proposal: 'propozycja',
        confirm: 'Zatwierdź',
        ageOption: (age: number, openEnded: boolean) => (openEnded ? `${age}+` : String(age)),
    },
    // DESIGN-GAP (docs/design-gaps.md rows 26-27): the kit has no settings view or progress preview; the texts are ours. Stage names, "Zatwierdź" and "Anuluj" come from pl.parent / pl.stages.
    settings: {
        title: 'Ustawienia rodzica',
        autoReadHeading: 'Czytanie poleceń na głos',
        autoReadOn: 'Włączone',
        autoReadOff: 'Wyłączone',
        noVoice: 'Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi.',
        // Progress preview (S-08 phase 8). Numbers only, no nouns, so no numeral agreement is needed; the step name is the author-facing step title.
        progressHeading: 'Postępy',
        currentStep: (index: number, total: number, title: string) => `Krok ${index} z ${total}: ${title}`,
        weakestHeading: 'Do poćwiczenia',
        mastery: (value: number, max: number) => `opanowanie ${value} z ${max}`,
        example: (prompt: string, given: string, answer: string) => `${prompt} — odpowiedź dziecka: ${given}, poprawna: ${answer}`,
        // Save health (audit C-2); parent only, no numbers, so no numeral agreement is needed.
        saveHeading: 'Zapis gry',
        saveOk: 'Postępy zapisują się na tym urządzeniu.',
        saveLast: (time: string) => `Ostatni zapis: ${time}`,
        // DESIGN-GAP 50: the kit has no copy for a save that has not happened yet, earlier failures or the persistence answer.
        saveNotYet: 'Gra jeszcze niczego nie zapisała. Zapis nastąpi po pierwszej zmianie.',
        saveEarlier: (count: number, error: string) => `Wcześniej: ${countNoun(count, ['nieudana próba', 'nieudane próby', 'nieudanych prób'])} (${error}).`,
        savePersist: {
            granted: 'Przeglądarka nie usunie zapisu sama.',
            denied: 'Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię.',
            unsupported: 'Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię.',
            error: 'Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię.',
        },
        saveFailing: 'Ostatnie próby zapisu się nie udały. Postępy z tej gry mogą nie zostać zachowane.',
        // DESIGN-GAP 94: the kit has no line for why saving fails; the number of tries, the stage and the code under saveFailing.
        saveFailingDetail: (count: number, stage: FailureStage, error: string) =>
            `${countNoun(count, ['nieudana próba', 'nieudane próby', 'nieudanych prób'])} · ${pl.settings.saveStage[stage]} · Kod: ${error}`,
        saveStage: {
            encode: 'przygotowanie zapisu',
            backup: 'kopia starego zapisu',
            write: 'zapis',
            replace: 'zastąpienie zapisu',
        },
        // DESIGN-GAP 95: the kit has no line for a save moved from an older version. Told only after a v2 write in this session;
        // `lost` (the v1 copy could not be written) is followed by the code line.
        saveMigrated: {
            kept: (from: number) => `Zapis przeniesiono z wersji ${from}. Stara kopia została na tym urządzeniu.`,
            lost: (from: number) => `Zapis przeniesiono z wersji ${from}, ale starej kopii nie udało się zachować.`,
        },
        saveOff: {
            unreadable: 'Zapis jest wyłączony: starego zapisu nie udało się wczytać.',
            unavailable: 'Zapis jest wyłączony: przeglądarka nie udostępniła zapisu.',
            // DESIGN-GAP 69: the kit has no line for the reason of a switched-off save.
            future: 'Zapis jest wyłączony: zapis na tym urządzeniu pochodzi z nowszej wersji gry. Zaktualizuj grę, a postępy wrócą.',
            timeout: 'Zapis jest wyłączony: odczyt zapisu trwał za długo. Uruchom grę ponownie. Jeśli to się powtarza, może pomóc usunięcie danych tej strony (to usuwa też zapis gry).',
            'migration-failed': 'Zapis jest wyłączony: starego zapisu nie udało się przenieść do tej wersji gry. Został bez zmian.',
            fatal: 'Zapis jest wyłączony do ponownego uruchomienia gry.',
        },
        // Task pictures (DESIGN-GAP 67): the kit has no parent line for pictures that failed to load. The verb agrees with the count (1 nie wczytał się, 2-4 nie wczytały się, 5+ nie wczytało się).
        artHeading: 'Obrazki',
        artOk: 'Wszystkie obrazki zadań są wczytane.',
        artMissing: (count: number, total: number) =>
            `${count} z ${total} obrazków ${inflect(count, ['nie wczytał się', 'nie wczytały się', 'nie wczytało się'])}. W tych zadaniach zamiast obrazka jest napis. Uruchom grę ponownie.`,
        // The salon pictures (the second line of "Obrazki"): the same verb agreement as artMissing.
        roomArtOk: 'Wszystkie obrazki pokoju są wczytane.',
        roomArtMissing: (count: number, total: number) =>
            `${count} z ${total} obrazków pokoju ${inflect(count, ['nie wczytał się', 'nie wczytały się', 'nie wczytało się'])}. W pokoju zamiast obrazka jest napis. Uruchom grę ponownie.`,
        empty: 'Za mało odpowiedzi z błędami. Zajrzyj tu po kilku rundach.',
    },
    stages: {
        E1: 'Klasa 1, I półrocze',
        E2: 'Klasa 1, II półrocze',
        E3: 'Klasa 2, I półrocze',
        E4: 'Klasa 2, II półrocze',
        E5: 'Klasa 3, I półrocze',
        E6: 'Klasa 3, II półrocze',
    },
    overlay: {
        rotate: 'Obróć tablet',
        rotateHint: 'Gra działa w poziomie.',
    },
    errorCard: {
        title: 'Ups! Gra się zatrzymała.',
        body: 'Dotknij przycisku, a gra uruchomi się od nowa.',
        restart: 'Zacznij od nowa',
        build: (id: string) => `Wersja ${id}`,
    },
    // DESIGN-GAP 42: the kit has no copy for a save that cannot be read; the parent sees it, the child only taps "Graj dalej".
    saveFailed: {
        title: 'Nie udało się wczytać zapisu',
        body: 'Zapis gry został na tablecie bez zmian. Rodzic może zachować jego kopię.',
        export: 'Zachowaj kopię',
        continue: 'Graj dalej',
        note: 'Tym razem gra nie zapisze postępów.',
        // S12-14: the raw copy carries the date like the current save's file, with "surowy" so the two are never mixed up.
        fileName: (date: string) => `martynka-zapis-surowy-${date}.txt`,
        // DESIGN-GAP 51: the kit has no line for the reason of a failed read; a code and the build, for the parent to quote.
        detail: (reason: string, build: string) => `Kod: ${reason} · Wersja ${build}`,
    },
    // DESIGN-GAP 87: the kit has no card for a save from a newer game version; calm, for the adult, the main advice is to update.
    saveFuture: {
        title: 'Ten zapis pochodzi z nowszej wersji gry',
        body: 'Zapis na tablecie jest bezpieczny i nie został zmieniony. Zaktualizuj grę, a postępy wrócą.',
        export: 'Zachowaj kopię',
        continue: 'Graj dalej',
        note: 'Tym razem gra nie zapisze postępów.',
    },
    // DESIGN-GAP 87: the same for a save that could not be moved to the current format; the old save stays as it was.
    saveMigrationFailed: {
        title: 'Nie udało się przenieść zapisu',
        body: 'Zapis na tablecie został bez zmian. Rodzic może zachować jego kopię.',
        export: 'Zachowaj kopię',
        continue: 'Graj dalej',
        note: 'Tym razem gra nie zapisze postępów.',
    },
    // DESIGN-GAP 46, 47: the kit has no copy for keeping a copy of the save; calm, for the adult.
    saveTransfer: {
        exportButton: 'Zapisz kopię',
        exportTitle: 'Kopia zapisu',
        exportBody: 'Plik zostanie zapisany na tym urządzeniu albo udostępniony wybranej aplikacji.',
        privacy: 'Plik zawiera postępy dziecka i przykłady jego błędów. Nie wysyłaj go obcym osobom.',
        saveFile: 'Zapisz plik',
        // DESIGN-GAP 72: shown in the export dialog when the game did not load the device save.
        exportNotDevice: 'Gra nie wczytała zapisu z tego urządzenia, więc ta kopia zawiera tylko obecną grę, bez wcześniejszych postępów.',
        close: 'Zamknij',
        exportOutcome: {
            shared: 'Kopia została przekazana wybranej aplikacji.',
            downloaded: 'Plik został pobrany na to urządzenie.',
            cancelled: 'Anulowano. Kopia nie powstała.',
            failed: 'Nie udało się zapisać pliku. Spróbuj jeszcze raz.',
        },
        fileName: (date: string) => `martynka-zapis-${date}.txt`,
        // DESIGN-GAP 48 (docs/design-gaps.md): the kit has no import flow; texts are ours. Every refusal says the current save is untouched.
        importButton: 'Wczytaj z pliku',
        importTitle: 'Wczytaj zapis z pliku',
        importBody: 'Wczytanie zastąpi obecne postępy na tym urządzeniu.',
        importPrivacy: 'Wybierz kopię zapisu z tej gry. Plik nie jest nigdzie wysyłany.',
        choose: 'Wybierz plik',
        chooseOther: 'Wybierz inny plik',
        now: 'Teraz',
        fromFile: 'Z pliku',
        stars: (n: number) => countNoun(n, ['gwiazdka', 'gwiazdki', 'gwiazdek']),
        noStage: 'przed wyborem etapu',
        // Room names are lower case in data (they sit inside sentences); a summary line starts with a capital.
        room: (name: string, done: number, total: number) => `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${done} z ${total}`,
        load: 'Wczytaj',
        // S12-09: what the file says about itself, shown in the summary step so the parent can tell an old copy from a new one.
        fileInfo: (date: string | null, build: string | null) =>
            date !== null && build !== null ? `Kopia z ${date}, wersja gry ${build}` : date !== null ? `Kopia z ${date}` : build !== null ? `Wersja gry ${build}` : '',
        rejected: {
            'too-big': 'Ten plik jest za duży, to nie jest zapis tej gry. Obecne postępy zostały bez zmian.',
            'not-json': 'To nie jest plik zapisu tej gry. Obecne postępy zostały bez zmian.',
            'not-ours': 'To nie jest plik zapisu tej gry. Obecne postępy zostały bez zmian.',
            corrupt: 'Plik zapisu jest uszkodzony. Obecne postępy zostały bez zmian.',
            future: 'Ten zapis pochodzi z nowszej wersji gry. Zaktualizuj grę i spróbuj ponownie. Obecne postępy zostały bez zmian.',
            'unknown-version': 'Nie można rozpoznać wersji tego zapisu. Obecne postępy zostały bez zmian.',
            'migration-failed': 'Nie udało się przenieść tego zapisu do obecnej wersji gry. Obecne postępy zostały bez zmian.',
        },
        applyFailed: 'Nie udało się wczytać zapisu. Obecne postępy zostały bez zmian.',
        // DESIGN-GAP 49 (docs/design-gaps.md): the kit has no reset confirmation; texts are ours.
        resetButton: 'Zacznij od nowa',
        resetTitle: 'Zacząć grę od nowa?',
        resetBody: 'Znikną wszystkie postępy z tego urządzenia:',
        resetHint: 'Jeśli chcesz je zachować, najpierw zapisz kopię.',
        resetConfirm: 'Zacznij od nowa',
        // DESIGN-GAP 68 (docs/design-gaps.md): the kit has no line for a device save that was not read; for the adult, calm, no codes.
        // DESIGN-GAP 71 (docs/design-gaps.md): the kit has no way out of a save the browser never gives; second confirmation and a last-resort advice, texts are ours.
        deviceUnavailable: 'Gra nie mogła odczytać zapisu na tym urządzeniu. Jeśli to się powtarza przy każdym uruchomieniu, możesz go zastąpić. Postępy zapisane wcześniej na tym urządzeniu wtedy znikną.',
        force: 'Zastąp mimo to',
        forcedWarning: 'Zapisu z tego urządzenia nie udało się odczytać. Zostanie zastąpiony.',
        siteDataAdvice: 'Nie udało się zapisać na tym urządzeniu. Ostatnie wyjście: usuń dane tej strony w ustawieniach przeglądarki albo usuń ikonę gry z ekranu i dodaj ją ponownie. To usuwa też zapis gry.',
        resetFailed: 'Nie udało się zacząć od nowa. Obecne postępy zostały bez zmian.',
        // DESIGN-GAP 70 (docs/design-gaps.md): the kit has no line per reason a device save cannot be replaced (newer version, slow read).
        deviceFuture: 'Zapis na tym urządzeniu pochodzi z nowszej wersji gry, więc ta wersja go nie zastąpi. Zaktualizuj grę: zapis wczyta się bez zmian.',
        deviceTimeout: 'Odczyt zapisu na tym urządzeniu trwał za długo, więc gra nie może go teraz zastąpić. Uruchom grę ponownie i spróbuj jeszcze raz. Jeśli to się powtarza, może pomóc usunięcie danych tej strony (to usuwa też zapis gry).',
        deviceFatal: 'Gra się zatrzymała, więc nie może teraz zastąpić zapisu. Uruchom grę ponownie.',
        deviceUnreadable: 'Zapisu na tym urządzeniu nie da się odczytać. Jeśli chcesz go zachować, uruchom grę ponownie i na pierwszej karcie wybierz „Zachowaj kopię”. „Zapisz kopię” w tym panelu zapisuje tylko obecną grę.',
    },
    // DESIGN-GAP 45: the kit has no copy for a browser that gives no storage; calm, for the adult, no blame, no jargon.
    saveUnavailable: {
        title: 'Gra nie może teraz zapisywać postępów',
        body: 'Przeglądarka nie udostępniła zapisu gry. Można grać dalej. Jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron.',
        continue: 'Graj dalej',
        note: 'Tym razem gra nie zapisze postępów.',
    },
    // DESIGN-GAP 96: the kit has no card for a save that reads too slowly; it reuses the overlay styles. DESIGN-GAP 97: no way out of a read that times out at every start, so a conditional line (it also removes the save).
    saveSlow: {
        title: 'Zapis wczytuje się bardzo wolno',
        body: 'Przeglądarka długo nie oddaje zapisu gry. Możesz poczekać dłużej albo grać dalej bez zapisywania tej gry.',
        wait: 'Poczekaj dłużej',
        waiting: 'Czekam na zapis…',
        continue: 'Graj dalej',
        note: 'Postępy zapisane wcześniej na tym urządzeniu zostają nietknięte.',
        stillSlow:
            'Zapis nadal się nie wczytał. Jeśli to się powtarza przy każdym uruchomieniu, usuń dane tej strony w ustawieniach przeglądarki albo usuń ikonę gry z ekranu i dodaj ją ponownie. To usuwa też zapis gry.',
    },
    install: {
        title: 'Zainstaluj grę na tablecie',
        ipad: 'Stuknij Udostępnij (kwadrat ze strzałką), potem „Do ekranu początkowego”.',
        android: 'Stuknij menu ⋮ w prawym górnym rogu, potem „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”.',
        afterInstall: 'Potem uruchamiaj grę z ikony. Działa też bez internetu.',
        installButton: 'Zainstaluj',
        continueButton: 'Zagraj w przeglądarce',
    },
    words: {
        // Verb forms by the subject's gender: [masculine, feminine].
        had: ['miał', 'miała'],
        bought: ['kupił', 'kupiła'],
        gave: ['oddał', 'oddała'],
        ate: ['zjadł', 'zjadła'],
        got: ['dostał', 'dostała'],
        paid: ['zapłacił', 'zapłaciła'],
        has: 'ma',
        was: 'było',
        were: 'były',
        is: 'jest',
        are: 'są',
        and: 'i',
        willHave: ['będzie miał', 'będzie miała'],
    },
    // Words the narrator says for the glyphs of a task (S-05); core/narration gets them as an argument.
    speech: {
        plus: 'plus',
        minus: 'minus',
        times: 'razy',
        divide: 'podzielić przez',
        equals: 'równa się',
        blank: 'okienko',
        less: 'mniejsze niż',
        greater: 'większe niż',
    },
    round: {
        calculate: 'Oblicz',
        correct: 'Brawo!',
        correctStar: (n: number) => `Brawo! +${n} ★`,
        next: 'Dalej',
        tryAgain: 'Spróbuj jeszcze raz',
        nextStep: 'Następny krok',
        gotIt: 'Już wiem',
        deleteKey: 'kasuj',
        okKey: 'OK',
        // DESIGN-GAP (docs/design-gaps.md row 55): the kit has no tray of blocks; the labels under the tray blocks are ours.
        trayLabels: { hundred: 'Setki', ten: 'Dziesiątki', one: 'Jedności' },
        // DESIGN-GAP: the kit has no solution result line (docs/design-gaps.md row 6); the bonus line sits under "+N" on the summary (row 9).
        bonus: (n: number) => `Runda bez błędu! +${n} ★`,
        resultLine: (answer: string) => `Wynik: ${answer}`,
    },
    summary: {
        nextRound: 'Kolejna runda',   // kit summary.png
        toRoom: 'Do pokoju',          // kit summary.png
        earned: (n: number) => `+${n}`,
    },
    // Kit unlock.png: the card shown after "Kolejna runda" when a new step was unlocked. The spoken line is ours (DESIGN-GAP, docs/design-gaps.md row 23: the kit has no narration of the card).
    // Loading screen of BootScene: the game's name (S-16a).
    loading: { title: 'Martynka urządza' },
    unlock: {
        title: 'Nowa umiejętność!',
        next: 'Dalej',
        spoken: (name: string) => `Nowa umiejętność! ${name}.`,
    },
    // S-15 minigames (Zakrywanka = dice, Hasło z wyników = word). Titles and hints are ours (DESIGN-GAP rows 79, 81, 82).
    minigames: {
        diceTitle: 'Kostki · 0–12',
        wordTitle: 'Ukryte słowo',
        puzzleTitle: 'Zagadka dnia',
        puzzleBadge: '×2',   // DESIGN-GAP 79: the kit has no daily-puzzle screen; the badge sits next to a star drawn in code (the font has no ★)
        diceAllCovered: 'Wszystkie pola zakryte!',
        diceAddHint: 'Policz razem oczka obu kostek.',
        diceSubHint: 'Odejmij oczka drugiej kostki.',
        diceAddStepHint: (a: number, b: number) => `Zacznij od ${a} i dodaj ${b}.`,
        diceSubStepHint: (a: number, b: number) => `Zacznij od ${a} i odejmij ${b}.`,
        hiddenLetter: '·',   // a letter not uncovered yet (kit)
    },
    // DESIGN-GAP (docs/design-gaps.md row 12): the kit has the return button only; the rest of the room copy is ours.
    room: {
        resume: 'Wróć do notesu',   // kit room-return view
        choose: 'Wybieram',
        close: 'Zamknij',
        // DESIGN-GAP (docs/design-gaps.md rows 31-36): the kit has no slots, task button or variant panel copy; these strings are ours.
        name: 'Salon',
        // DESIGN-GAP (docs/design-gaps.md rows 37-41): the kit has no room-done card, room list or change mode; these strings are ours. No numerals.
        done: { title: 'Pokój gotowy!', spoken: 'Pokój gotowy!', teaser: 'Wkrótce' },
        change: { enter: 'Zmień wygląd', exit: 'Gotowe', hint: 'Stuknij mebel, który chcesz zmienić.' },
        // Imperative with the accusative, keyed by RoomTaskDef.label. "Odnów ściany i podłogę" is the author's wording (2026-10-15).
        tasks: {
            renovate: 'Odnów ściany i podłogę',
            addSofa: 'Postaw sofę',
            layRug: 'Połóż dywan',
            placeCoffeeTable: 'Postaw stolik',
            placeCabinet: 'Postaw komodę',
            placeArmchair: 'Postaw fotel',
            hangFrames: 'Powieś obrazki',
        },
        // Nominative captions of the furniture, keyed by SlotDef.id (also the words of the "Hasło z wyników" minigame).
        slots: {
            sofa: 'sofa',
            rug: 'dywan',
            'coffee-table': 'stolik',
            cabinet: 'komoda',
            armchair: 'fotel',
            'wall-frames': 'obrazki',
        },
        // Names of the three variants of a slot (the art pack's manifest labels), keyed by SlotDef.id; index = variant.
        variants: {
            sofa: ['Morska', 'Słoneczna', 'Listkowa'],
            rug: ['Listki', 'Łuki', 'Kwiaty'],
            'coffee-table': ['Dębowy', 'Kremowy', 'Turkusowy'],
            cabinet: ['Dębowa', 'Miętowa', 'Kremowa'],
            armchair: ['Kremowy', 'Miętowy', 'Słoneczny'],
            'wall-frames': ['Botaniczne', 'Łąka', 'Niebo'],
        } as Record<string, readonly [string, string, string]>,
        // Fixed decoration of the renovated room (stand-in captions only), keyed by LayerDef.id.
        decor: {
            'lamp-table': 'lampa',
            'plant-left': 'roślina',
            'plant-right': 'roślina',
            pouf: 'pufa',
        } as Record<string, string>,
        // Digits only, so no numeral agreement is needed.
        short: (have: number, need: number) => `masz ${have}/${need}`,
    },
    tasks: {
        // SHAPES and PATTERN (S-14d): figures are drawn on the tiles, the texts name them by words only.
        shapesName: (genitive: string) => `Dotknij ${genitive}.`,
        shapesAll: (genitivePlural: string) => `Dotknij wszystkich ${genitivePlural}.`,
        shapesOdd: 'Który nie pasuje?',
        shapesLookEach: 'Popatrz na każdą figurę po kolei.',
        shapesLookName: (look: string) => `Szukaj figury ${look}.`,
        shapesLookAll: (look: string) => `Szukaj wszystkich figur ${look}.`,
        shapesOddLook: 'Popatrz na kształt, kolor i wielkość.',
        shapesOddThree: 'Trzy figury mają coś wspólnego, jedna jest inna.',
        shapesOddFigure: (nominative: string) => `Tylko jedna figura to ${nominative}.`,
        shapesOddFeature: (feminine: string) => `Tylko jedna figura jest ${feminine}.`,
        pattern: 'Co będzie dalej?',
        patternRepeats: 'Szlaczek się powtarza.',
        patternPeriod: (labels: string) => `Powtarza się tak: ${labels}.`,
        missing: 'Jaka liczba pasuje w okienku?',
        missingHint: (inverse: string) => `Policz w drugą stronę: ${inverse}`,
        // Same question as the BONDS hint; "Ile brakuje od 2 do 10?" read awkwardly (impl-review S-03).
        complement: (n: number, target: number) => `Ile trzeba dodać do ${n}, żeby było ${target}?`,
        complementHint: (n: number, target: number) => `${n} + ${target - n} = ${target}`,
        bonds: (total: number) => `Uzupełnij domek liczby ${total}.`,
        bondsHint: (shown: number, total: number) => `Ile trzeba dodać do ${shown}, żeby było ${total}?`,
        factSwapHint: 'Zamiana składników nie zmienia sumy.',
        factCheck: 'Sprawdź:',
        factCheckSubHint: 'Dodaj wynik i odjemnik.',
        factCheckAddHint: 'Odejmij od sumy jeden ze składników.',
        factCheckDivHint: 'Pomnóż iloraz przez dzielnik.',
        // COMPARE_QTY, ORDINAL and the picture CHOOSE_OP (S-14d): the picture carries the task, the texts stay one short sentence.
        compareQtyPrompt: (more: boolean, many: string) => `Gdzie jest ${more ? 'więcej' : 'mniej'} ${many}?`,
        compareQtyTiles: { left: 'Po lewej', right: 'Po prawej', same: 'Tyle samo' },
        compareQtyCountHint: 'Policz po kolei każdą grupę. Pokazuj palcem: 1, 2, 3.',
        compareQtyCountsHint: (left: string, right: string) => `Z lewej strony: ${left}, z prawej: ${right}.`,
        compareQtyAnswerHint: (tile: string) => `Wybierz: ${tile}.`,
        ordinalPrompt: (nominative: string) => `Na którym miejscu od lewej jest ${nominative}?`,
        ordinalFromMarkHint: 'Zacznij liczyć od chorągiewki po lewej stronie.',
        ordinalPointHint: 'Pokazuj palcem kolejne obrazki i licz.',
        ordinalAnswerHint: (nominative: string, place: number) => `${nominative.charAt(0).toUpperCase()}${nominative.slice(1)} jest na miejscu ${place}.`,
        chooseOpPictureStory: (was: string, counted: string, motion: 'come' | 'go', n: number) =>
            `Na stole ${was} ${counted}. ${motion === 'come' ? 'Dołożono' : 'Zabrano'} ${n}.`,
        chooseOp: 'Które działanie pasuje?',
        chooseOpHint: {
            sum: 'Przybyło, więc dodajemy.',
            left: 'Ubyło, więc odejmujemy.',
            moreBy: 'Jest więcej, więc dodajemy.',
        },
        sequence: 'Uzupełnij ciąg:',
        // ARROW_TABLE (S-14b, DESIGN-GAP 89: the kit has no arrow-graph copy, the texts are ours): the rule line never states a result.
        arrowGraph: 'Uzupełnij graf.',
        arrowTable: 'Uzupełnij tabelkę.',
        arrowRule: (plus: boolean, n: number) => (plus ? `Reguła strzałki: dodaj ${n} do liczby.` : `Reguła strzałki: odejmij ${n} od liczby.`),
        arrowRuleBack: (plus: boolean, n: number, from: number) => (plus ? `Idź pod prąd strzałki: od ${from} odejmij ${n}.` : `Idź pod prąd strzałki: do ${from} dodaj ${n}.`),
        multGroupsJumps: 'Które działanie pokazują skoki?',
        multGroupsJumpsHint: 'Policz skoki i sprawdź, jak długi jest jeden skok.',
        sequenceHint: (step: number, up: boolean) =>
            `Każda następna liczba jest o ${step} ${up ? 'większa' : 'mniejsza'}.`,
        missingOpHint: (a: number, plus: boolean) =>
            plus ? `Wynik jest większy niż ${a}, więc dodajemy.` : `Wynik jest mniejszy niż ${a}, więc odejmujemy.`,
        rounding: (n: string, to: 10 | 100 | 1000) =>
            to === 1000 ? `Który pełny tysiąc jest najbliżej liczby ${n}?`
            : to === 100 ? `Która pełna setka jest najbliżej liczby ${n}?`
            : `Która pełna dziesiątka jest najbliżej liczby ${n}?`,
        roundingHint: (n: string, low: string, high: string, nearest: string) => [
            `${n} jest między ${low} a ${high}`,
            `${n} jest bliżej ${nearest}`,
        ],
        half: (n: number) => `Ile to jest połowa liczby ${n}?`,
        compareHint: (n: number, parts: string) => `${n} to ${parts}`,
        compareDigitsHint: (n: string, digits: string) => `${n} ma ${digits}`,
        // Object of "ma" in the accusative: "2 ma 1 cyfrę" (2–7 digits agree through nouns.cyfra).
        oneDigit: '1 cyfrę',
        compareMoreDigits: 'Liczba z większą liczbą cyfr jest większa',
        compareFirstDiffHint: (place: string, x: number, y: number) =>
            `Porównujemy cyfry od lewej. Pierwsza różna cyfra jest na miejscu ${place}: ${x} i ${y}`,
        placeNames: ['jedności', 'dziesiątek', 'setek', 'tysięcy', 'dziesiątek tysięcy', 'setek tysięcy', 'milionów'],
        compareEqualHint: 'To takie same liczby',
        evenOdd: (n: number) => `Liczba ${n} jest parzysta czy nieparzysta?`,
        even: 'parzysta',
        odd: 'nieparzysta',
        evenOddHint: (n: number, lastDigit: number, isEven: boolean) =>
            n === 0 ? 'Zero kończy się cyfrą 0, więc jest parzyste' : `${n} kończy się cyfrą ${lastDigit}, więc jest ${isEven ? 'parzysta' : 'nieparzysta'}`,
        selectEven: 'Zaznacz wszystkie liczby parzyste.',
        selectEvenHint: 'Liczby parzyste kończą się na 0, 2, 4, 6 albo 8.',
        // INEQUALITY: several tiles fit; the hint walks through the equality at the boundary.
        inequality: (expr: string) => `Jaka liczba pasuje do okienka? ${expr}`,
        inequalityEquality: (equation: string) => `Najpierw znajdź równość: ${equation}.`,
        inequalityBoundary: (fact: string, relation: 'less' | 'more', boundary: number) =>
            `${fact}, więc w okienku musi być ${relation === 'less' ? 'mniej' : 'więcej'} niż ${boundary}.`,
        inequalityExample: (fact: string, check: string, answer: number) => `Na przykład ${fact}, a ${check}. Pasuje ${answer}.`,
        // ORDER_OPS: the first hint names the step that comes first, without its result.
        orderOpsFirst: (op: 'mult' | 'div', expr: string) => `Najpierw ${op === 'mult' ? 'mnożenie' : 'dzielenie'}: ${expr}.`,
        // TIMES_MORE: "razy" is multiplication or division, never "o" (adding or taking away).
        timesMoreMore: (expr: string) => `„Razy więcej” to mnożenie, nie dodawanie: ${expr}.`,
        timesMoreLess: (expr: string) => `„Razy mniej” to dzielenie, nie odejmowanie: ${expr}.`,
        timesMoreFactor: (expr: string) => `„Ile razy więcej” to dzielenie, nie odejmowanie: ${expr}.`,
        // Prompts: `has` is the verb ("ma"), `gen` the noun in the genitive plural, `base`/`total` counted nouns ("3 klocki").
        timesMorePromptMore: (person: string, other: string, has: string, base: string, k: number, gen: string) =>
            `${person} ${has} ${base}. ${other} ${has} ${k} razy więcej ${gen}. Ile ${gen} ${has} ${other}?`,
        timesMorePromptLess: (person: string, other: string, has: string, total: string, k: number, gen: string) =>
            `${person} ${has} ${total}. ${other} ${has} ${k} razy mniej ${gen}. Ile ${gen} ${has} ${other}?`,
        timesMorePromptFactor: (person: string, other: string, has: string, base: string, total: string, gen: string) =>
            `${person} ${has} ${base}, a ${other} ${has} ${total}. Ile razy więcej ${gen} ${has} ${other}?`,
        // PRICE: whole złoty; the goods are in data/wordTemplates.ts.
        priceTotalHint: (expr: string) => `Cena jednej sztuki razy liczba sztuk: ${expr}.`,
        priceUnitHint: (expr: string) => `Cenę jednej sztuki liczymy dzieleniem: ${expr}.`,
        // `bought`/`paid` agree with the buyer, `goods` is the counted accusative ("4 zeszyty", "1 bułkę"), `one` "jeden zeszyt".
        priceTotalPrompt: (person: string, bought: string, goods: string, one: string, price: string, paid: string) =>
            `${person} ${bought} ${goods}. ${one.charAt(0).toUpperCase() + one.slice(1)} kosztuje ${price}. Ile złotych ${paid} za zakupy?`,
        priceUnitPrompt: (person: string, bought: string, goods: string, total: string, one: string) =>
            `${person} ${bought} ${goods} za ${total}. Ile kosztuje ${one}?`,
        // CLOCK_ELAPSED: elapsed time. Times are written "8.15"; the unit after "jest jeszcze / mija" is the nominative.
        elapsedToFullHour: 'Najpierw policz minuty do pełnej godziny.',
        elapsedToFullHourLine: (next: string, minutes: number) => `Do ${next} brakuje ${countNoun(minutes, nouns.minuta)}.`,
        elapsedEndAddFirst: 'Dodaj czas trwania do minut na zegarze.',
        elapsedEndRest: (minutes: number) => `Potem jeszcze ${countNoun(minutes, nouns.minuta)}.`,
        elapsedEndAnswer: (time: string) => `Kończy się o ${time}.`,
        elapsedSpanSameHour: 'Czas jest w tej samej godzinie, więc odejmij minuty.',
        elapsedSpanAfterHour: (next: string, end: string, minutes: number) => `Od ${next} do ${end} mija ${countNoun(minutes, nouns.minuta)}.`,
        elapsedToHourFirst: 'Godzina ma 60 minut. Od 60 odejmij minuty, które już minęły.',
        elapsedNightFirst: 'Najpierw policz godziny do północy, czyli do 24.00.',
        elapsedNightAfter: (end: string, hours: number) => `Od północy do ${end} mija ${countNoun(hours, nouns.godzina)}.`,
        // TIME_UNITS: "Ile minut to 3 godziny?"; the asked unit is the genitive plural, the given one agrees with its number.
        timeUnitsAsk: (asked: string, given: string) => `Ile ${asked} to ${given}?`,
        timeUnitsFact: (big: string, small: string) => `1 ${big} to ${small}.`,
        // UNIT_CHOICE: "Długopis ma 14 □." with unit tiles. The first hint holds no digit and names no unit.
        unitChoicePrompt: (subject: string, verb: 'ma' | 'waży', n: number) => `${subject} ${verb} ${n} □.`,
        unitChoiceSpeak: (subject: string, verb: 'ma' | 'waży', n: number) => `${subject} ${verb} ${n}. Jaka to jednostka?`,
        unitChoiceFirst: {
            length: 'Porównaj z paznokciem, ręką, klasą i długą drogą.',
            mass: 'Czy to lekkie jak piórko, czy ciężkie jak człowiek?',
        },
        unitChoiceLike: (subject: string, like: string) => `${subject} ${like}.`,
        unitChoiceAnswer: (subject: string, verb: 'ma' | 'waży', n: number, unit: string) => `${subject} ${verb} ${n} ${unit}.`,
        numberToWords: (n: number) => `Jak zapisać słowami liczbę ${n}?`,
        wordsToNumber: (words: string) => `Która liczba to „${words}”?`,
        numberWordsHint: (n: number, parts: string) => `${n} to ${parts}`,
        romanContexts: [
            (r: string) => `Zegar z cyframi rzymskimi pokazuje ${r}. Która to godzina?`,
            (r: string) => `Winda zatrzymała się na ${r} piętrze. Które to piętro?`,
            (r: string) => `Jaką liczbę oznacza ${r}?`,
        ],
        // Spoken forms (Task.speak): the synthesizer would read Roman numerals as their value, so letters are spelled out.
        romanLetters: { I: 'i', V: 'fau', X: 'iks', L: 'el', C: 'ce', D: 'de', M: 'em' } as Record<string, string>,
        romanSpeakContexts: [
            (spelled: string) => `Zegar z cyframi rzymskimi pokazuje ${spelled}. Która to godzina?`,
            (spelled: string) => `Winda zatrzymała się na piętrze oznaczonym cyframi rzymskimi ${spelled}. Które to piętro?`,
            (spelled: string) => `Jaką liczbę oznacza zapis rzymski ${spelled}?`,
        ],
        romanMonthSpeak: (day: number, spelled: string) => `Data ${day}, miesiąc zapisany cyframi rzymskimi ${spelled}. Który to miesiąc?`,
        compareSpeak: (expr: string) => `Jaki znak pasuje w okienku? ${expr}`,
        compareExprSpeak: (expr: string) => `Porównaj wyniki. Jaki znak pasuje w okienku? ${expr}`,
        missingOpSpeak: (expr: string) => `Jakiego znaku działania brakuje w okienku? ${expr}`,
        toRoman: (n: number) => `Jak zapisać liczbę ${n} cyframi rzymskimi?`,
        romanHint: (pieces: string, sum: string) => `${pieces}; razem ${sum}`,
        nextMonth: (locative: string) => `Który miesiąc jest po ${locative}?`,
        prevMonth: (instrumental: string) => `Który miesiąc jest przed ${instrumental}?`,
        quarterOf: (month: string) => `W którym kwartale roku jest ${month}?`,
        romanMonth: (day: number, roman: string) => `Data ${day} ${roman}. Który to miesiąc?`,
        nextWeekday: (after: string) => `Jaki dzień tygodnia jest po ${after}?`,
        prevWeekday: (before: string) => `Jaki dzień tygodnia jest przed ${before}?`,
        weekdaysHint: (list: string) => `Dni tygodnia po kolei: ${list}`,
        monthDays: (month: string) => `Ile dni ma ${month}?`,
        knuckleHint: 'Policz na knykciach: wysokie kostki to miesiące dłuższe, doliny między nimi to krótsze.',
        monthDaysHint: (month: string, days: number) => `${month[0].toUpperCase()}${month.slice(1)} ma ${days} dni.`,
        monthsHint: (list: string) => `Miesiące po kolei: ${list}`,
        quarterHint: (quarter: string, list: string) => `${quarter} to ${list}`,
        romanMonthHint: (roman: string, index: number) => `${roman} to ${index}, czyli ${index}. miesiąc roku`,
        // CLOCK and LENGTH (S-13). Times are written the school way ("3.30", "15.00"); the drawing carries the clock face and the ruler.
        clockRead: 'Która godzina jest na zegarze?',
        clockReadSpeak: 'Popatrz na zegar. Która godzina?',
        // After "za" the object is in the accusative: "za 1 godzinę", "za 2 godziny".
        clockLater: (n: number) => `Zegar pokazuje godzinę. Która godzina będzie za ${n === 1 ? '1 godzinę' : countNoun(n, nouns.godzina)}?`,
        clockLaterSpeak: (n: number) => `Popatrz na zegar. Która godzina będzie za ${n === 1 ? '1 godzinę' : countNoun(n, nouns.godzina)}?`,
        clockH24: 'Zegar pokazuje godzinę po południu. Która to godzina w zapisie 24-godzinnym?',
        clockH24Speak: 'Popatrz na zegar. Jest po południu. Która to godzina w zapisie 24-godzinnym?',
        clockHandsHint: 'Najpierw spójrz na krótką wskazówkę: pokazuje godzinę. Potem na długą: pokazuje minuty.',
        // Past the full hour the short hand has left the number (at 3.40 it is nearer 4): name both numbers it is between.
        clockShortHandHint: (hour: number, minute: number, next: number) =>
            minute === 0 ? `Krótka wskazówka jest przy ${hour}.` : `Krótka wskazówka jest między ${hour} a ${next}, więc godzina to ${hour}.`,
        clockLongHandHint: (marker: number, minute: number) =>
            minute === 0 ? 'Długa wskazówka jest na 12, więc jest pełna godzina.' : `Długa wskazówka jest na ${marker}, czyli ${countNoun(minute, nouns.minuta)} po pełnej godzinie.`,
        clockAnswerHint: (time: string) => `Na zegarze jest ${time}.`,
        clockLaterAnswerHint: (time: string) => `Będzie ${time}.`,
        clockLaterNowHint: (time: string) => `Teraz jest ${time}.`,
        // Clock to set (S-13b): the child turns the hands; the prompt names the time, the hints teach which hand is which.
        clockSet: (time: string) => `Ustaw zegar na ${time}.`,
        clockSetSpeak: (hour: number, minute: number) =>
            minute === 0 ? `Ustaw zegar na godzinę ${hour}.` : `Ustaw zegar na godzinę ${hour} i ${countNoun(minute, nouns.minuta)}.`,
        clockSetHandsHint: 'Krótka wskazówka pokazuje godzinę, długa pokazuje minuty. Przeciągnij je palcem.',
        // Full hours (E3): only the short hand moves, the long one stays on 12 (impl review teacher read).
        clockSetHourHandHint: 'Krótka wskazówka pokazuje godzinę. Przeciągnij ją palcem.',
        clockSetLongStaysHint: 'Długa wskazówka zostaje na 12, bo to pełna godzina.',
        clockSetH24Hint: 'Po południu od godziny w zapisie 24-godzinnym odejmij 12.',
        clockSetShortHint: (hour: number, minute: number, next: number) =>
            minute === 0 ? `Krótką wskazówkę ustaw na ${hour}.` : `Krótką wskazówkę ustaw między ${hour} a ${next}.`,
        clockSetLongHint: (marker: number, minute: number) =>
            minute === 0 ? 'Długą wskazówkę ustaw na 12.' : `Długą wskazówkę ustaw na ${marker}, czyli ${countNoun(minute, nouns.minuta)} po pełnej godzinie.`,
        clockSetAnswerHint: (time: string) => `Wtedy zegar pokaże ${time}.`,
        clockH24Hint: 'Po południu do godziny z zegara dodaj 12.',
        clockH24AnswerHint: (time: string) => `Zapis 24-godzinny: ${time}.`,
        lengthRuler: (unit: 'cm' | 'mm') => (unit === 'cm' ? 'Ile centymetrów ma ten odcinek?' : 'Ile milimetrów ma ten odcinek?'),
        lengthRulerSpeak: (unit: 'cm' | 'mm') => (unit === 'cm' ? 'Popatrz na linijkę. Ile centymetrów ma odcinek?' : 'Popatrz na linijkę. Ile milimetrów ma odcinek?'),
        lengthReadMarksHint: 'Sprawdź, gdzie odcinek się zaczyna i gdzie się kończy.',
        lengthFromZeroHint: (to: number, len: number, unit: 'cm' | 'mm') => `Odcinek zaczyna się na 0 i kończy na ${to}. Ma ${len} ${unit}.`,
        lengthAnswerHint: (len: number, unit: 'cm' | 'mm') => `Odcinek ma ${len} ${unit}.`,
        lengthConvert: (m: number, cm: number) => (cm === 0 ? `${m} m to ile centymetrów?` : `${m} m ${cm} cm to ile centymetrów?`),
        lengthMetreHint: '1 m = 100 cm',
        rulerUnitLabel: 'cm',   // printed at the end of the drawn ruler (its digits count centimetres, also on the millimetre ruler)
        lengthConvertAnswerHint: (cm: number) => `To jest ${cm} cm.`,
        // LENGTH in words (S-14c): plan scale and two-unit expressions. The place is a nominative subject, so no case has to agree.
        lengthScalePlanPrompt: (perCm: number, place: string, plan: number) =>
            `Na planie 1 cm to ${perCm} m. ${place} ma na planie ${plan} cm długości. Ile metrów długości ma naprawdę?`,
        lengthScaleRealPrompt: (perCm: number, place: string, real: number) =>
            `Na planie 1 cm to ${perCm} m. ${place} ma naprawdę ${real} m długości. Ile centymetrów ma ${place.toLowerCase()} na planie?`,
        lengthScalePlanFirst: 'Pomnóż centymetry z planu przez to, ile metrów ma 1 cm.',
        lengthScaleRealFirst: 'Sprawdź, ile razy 1 cm planu mieści się w prawdziwej długości.',
        lengthScalePlanAnswer: (place: string, real: number) => `${place} ma naprawdę ${real} m długości.`,
        lengthScaleRealAnswer: (place: string, plan: number) => `${place} ma na planie ${plan} cm długości.`,
        lengthFact: (big: string, factor: number, small: string) => `1 ${big} = ${factor} ${small}`,
        // MONEY_COUNT, MONEY_CHANGE and MASS (S-14). Amounts are written with the short signs (zł, gr, kg, dag) by the caller; the
        // spoken forms come from core/text/measure.ts. A purchase is one thing in the accusative, so no numeral has to agree with it.
        moneyCountPrompt: (mode: 'number-zl' | 'number-gr' | 'text') =>
            mode === 'number-zl' ? 'Ile złotych leży na stole?' : mode === 'number-gr' ? 'Ile groszy leży na stole?' : 'Ile pieniędzy leży na stole?',
        moneyCountSpeak: (mode: 'number-zl' | 'number-gr' | 'text') =>
            `Popatrz na pieniądze. ${mode === 'number-zl' ? 'Ile złotych leży na stole?' : mode === 'number-gr' ? 'Ile groszy leży na stole?' : 'Ile pieniędzy leży na stole?'}`,
        moneyCountHint: 'Dodawaj po kolei: najpierw największe nominały.',
        moneyCountTextHint: 'Dodaj osobno złote i osobno grosze.',
        moneyZlotyLine: (parts: readonly number[], sum: number) => (parts.length > 1 ? `Złote: ${parts.join(' + ')} = ${sum}` : `Złote: ${sum}`),
        moneyGroszeLine: (parts: readonly number[], sum: number) => (parts.length > 1 ? `Grosze: ${parts.join(' + ')} = ${sum}` : `Grosze: ${sum}`),
        moneyGroszeToZloty: (grosze: number, text: string) => `${grosze} gr to ${text}.`,
        moneyCountAnswerHint: (amount: string) => `Na stole leży ${amount}.`,
        moneyChangeQuestion: (mode: 'number-zl' | 'number-gr' | 'text') =>
            mode === 'number-zl' ? 'Ile złotych zostało?' : mode === 'number-gr' ? 'Ile groszy zostało?' : 'Ile pieniędzy zostało?',
        moneyChange: (name: string, feminine: boolean, had: string, thing: string, price: string, question: string) =>
            `${name} ${feminine ? 'miała' : 'miał'} ${had}. ${feminine ? 'Kupiła' : 'Kupił'} ${thing} za ${price}. ${question}`,
        moneyChangeHint: 'Od kwoty na początku odejmij cenę.',
        moneyChangeGroszeHint: 'Złotówka to 100 groszy.',
        moneyChangeGroszeLine: (had: number, price: number, change: number) => `Zamień na grosze: ${had} − ${price} = ${change}.`,
        moneyChangeAnswerHint: (amount: string) => `Zostało ${amount}.`,
        // MONEY_PAY (S-14d): the amount is a whole number of złoty; the last hint states it, as the answer is a wallet and gets no result line.
        moneyPayPrompt: (amount: string, fewest: boolean) => (fewest ? `Zapłać ${amount}. Użyj jak najmniej monet.` : `Zapłać ${amount}.`),
        moneyPaySpeak: (amount: string, fewest: boolean) => (fewest ? `Zapłać ${amount}. Użyj jak najmniej monet.` : `Zapłać ${amount}.`),
        moneyPayHint: (hasNote: boolean) => (hasNote ? 'Połóż największą monetę lub banknot, który nie jest za duży.' : 'Połóż największą monetę, która nie jest za duża.'),
        moneyPayRestLine: (first: string, rest: string) => `${first} i jeszcze ${rest}.`,
        moneyPaySumLine: (parts: readonly string[], amount: string) => `${parts.join(' + ')} = ${amount}`,
        moneyPayOneLine: (amount: string, note: boolean) => (note ? `Wystarczy jeden banknot: ${amount}.` : `Wystarczy jedna moneta: ${amount}.`),
        // MASS in words (S-14c): brutto / netto / tara of a pack and unit conversions, no drawing. The pack is one thing in the
        // nominative, so no numeral has to agree with it; the asked unit is the genitive plural, the given one agrees with its number.
        massPackPrompt: {
            net: (pack: string, a: number, b: number, unit: string) => `${pack}: razem z opakowaniem (brutto) waży ${a} ${unit}, samo opakowanie (tara) ${b} ${unit}. Ile waży zawartość (netto)?`,
            gross: (pack: string, a: number, b: number, unit: string) => `${pack}: zawartość (netto) waży ${a} ${unit}, a opakowanie (tara) ${b} ${unit}. Ile waży całość (brutto)?`,
            tare: (pack: string, a: number, b: number, unit: string) => `${pack}: razem z opakowaniem (brutto) waży ${a} ${unit}, a sama zawartość (netto) ${b} ${unit}. Ile waży opakowanie (tara)?`,
        },
        massPackFirst: {
            net: 'Brutto to masa z opakowaniem, netto to sama zawartość.',
            gross: 'Brutto to zawartość razem z opakowaniem.',
            tare: 'Tara to samo opakowanie: brutto bez netto.',
        },
        massAsk: (asked: string, given: string) => `Ile ${asked} to ${given}?`,
        massFact: (big: string, small: string) => `1 ${big} to ${small}.`,
        massHalfKgPrompt: 'Ile gramów to pół kilograma?',
        massQuarterKgPrompt: 'Ile gramów to ćwierć kilograma?',
        massToKiloPrompt: (grams: number) => `Na wadze jest ${grams} g. Ile gramów brakuje do 1 kg?`,
        massPrompt: (unit: 'kg' | 'dag', noun: string) => `Waga jest w równowadze. Ile ${unit === 'kg' ? 'kilogramów' : 'dekagramów'} waży ${noun}?`,
        massHalfPrompt: 'Waga jest w równowadze. Ile dekagramów brakuje do pół kilograma?',
        massKiloPrompt: 'Waga jest w równowadze. Ile dekagramów brakuje do kilograma?',
        massReadHint: 'Dodaj masy wszystkich odważników z prawej szalki.',
        massReadOneHint: 'Odczytaj masę odważnika z prawej szalki.',
        massAnswerHint: (noun: string, n: number, unit: 'kg' | 'dag') => `${noun.charAt(0).toUpperCase()}${noun.slice(1)} waży ${n} ${unit}.`,
        massHalfFactHint: 'Pół kilograma to 50 dag.',
        massKiloFactHint: '1 kg = 100 dag',
        massWeighsHint: (n: number) => `Odważnik waży ${n} dag.`,
        massMissingAnswerHint: (n: number) => `Brakuje ${n} dag.`,
        // CAPACITY, TEMPERATURE, COUNT and MULT_GROUPS (S-14). Litres and degrees agree with the number through nouns.litr / nouns.stopień
        // (the callers use countNoun); the tiles and the keypad carry the digits, so the prompts hold none except the story's own.
        capacityLitresPrompt: 'Ile litrów wody jest w dzbankach?',
        capacityLitresSpeak: 'Popatrz na dzbanki. Ile litrów wody jest w dzbankach?',
        capacityOneLitreFact: 'Każdy duży dzbanek mieści litr.',
        capacityHalfFact: 'Dwa dzbanki po pół litra to litr.',
        capacityQuarterFact: 'Cztery dzbanki po ćwierć litra to razem litr.',
        capacityQuarterAlso: 'Cztery po ćwierć litra też.',
        capacityLitresAnswerHint: (litres: string) => `To razem ${litres}.`,
        capacityHowMany: (jug: 'half' | 'quarter', litres: string) =>
            `Ile dzbanków po ${jug === 'half' ? 'pół' : 'ćwierć'} litra potrzeba, żeby nalać ${litres} wody?`,
        capacityHowManySpeak: (jug: 'half' | 'quarter', litres: string) =>
            `Popatrz na dzbanek. Ile dzbanków po ${jug === 'half' ? 'pół' : 'ćwierć'} litra potrzeba, żeby nalać ${litres} wody?`,
        capacityLitreFitsHalf: 'Dwa takie dzbanki to razem jeden litr.',
        capacityLitreFitsQuarter: 'Cztery takie dzbanki to razem jeden litr.',
        capacityHowManyAnswerHint: (jugs: string) => `To razem ${jugs}.`,
        // CAPACITY in words (S-14c): glasses of ½ l and ¼ l. The narrator gets the fractions spelled out.
        capacityGlassesPrompt: (litres: string, liquid: string, sign: string) => `W dzbanku jest ${litres} ${liquid}. Ile szklanek po ${sign} l możesz z niego nalać?`,
        capacityGlassesSpeak: (litres: string, liquid: string, words: string) => `W dzbanku jest ${litres} ${liquid}. Ile szklanek po ${words} możesz z niego nalać?`,
        capacityGlassesToLitresPrompt: (glasses: string, sign: string) => `${glasses} po ${sign} l to ile litrów?`,
        capacityGlassesToLitresSpeak: (glasses: string, words: string) => `${glasses} po ${words} to ile litrów?`,
        capacityGlassFact: { half: 'Dwie szklanki po ½ l to razem litr.', quarter: 'Cztery szklanki po ¼ l to razem litr.' },
        capacityGlassWords: { half: 'pół litra', quarter: 'ćwierć litra' },
        temperatureReadPrompt: (mode: 'number' | 'text') => (mode === 'number' ? 'Ile stopni pokazuje termometr?' : 'Jaką temperaturę pokazuje termometr?'),
        temperatureFindHint: 'Znajdź koniec słupka i najbliższą liczbę.',
        temperatureBelowZeroHint: 'Poniżej zera liczymy w dół.',
        temperatureShowsHint: (celsius: string) => `Termometr pokazuje ${celsius}.`,
        temperatureDiff: (morning: string, warmer: boolean) =>
            `Rano było ${morning}. Popatrz na termometr: tyle jest teraz. O ile stopni się ${warmer ? 'ociepliło' : 'ochłodziło'}?`,
        temperatureNowHint: (celsius: string) => `Teraz jest ${celsius}.`,
        temperatureAcrossZeroHint: 'Przejdź przez zero: policz osobno do zera i od zera.',
        temperatureChangeHint: (degrees: string, warmer: boolean) => `${warmer ? 'Ociepliło' : 'Ochłodziło'} się o ${degrees}.`,
        countPrompt: (many: string) => `Ile jest ${many}?`,
        countPointHint: 'Pokazuj palcem każdy przedmiot i licz po kolei.',
        countTenHint: 'Pierwszy rząd to dziesięć. Policz, ile jest pod nim.',
        countAnswerHint: (what: string) => `Na obrazku: ${what}.`,
        multGroupsResult: (groups: number, size: number, each: string, many: string) => `Na ${groups} talerzykach leży po ${size} ${each}. Ile ${many} jest razem?`,
        multGroupsResultHint: 'Policz, ile jest talerzyków i ile jest na jednym.',
        multGroupsExpr: 'Które działanie pokazuje obrazek?',
        multGroupsExprHint: 'Zobacz, ile jest grup i ile ikon w jednej grupie.',
        multGroupsJumpsCountsHint: (jumps: number, length: number) => `Skoków: ${jumps}. Każdy ma długość ${length}.`,
        multGroupsCountsHint: (groups: number, size: number) => `Grup: ${groups}. W każdej po ${size}.`,
        multGroupsExprAnswerHint: (expr: string) => `Pasuje ${expr}.`,
        // PLACE_VALUE and DATA (S-13). The blocks and the bar chart are drawings; the texts only name them.
        placeValueRead: 'Jaka to liczba?',
        placeValueReadSpeak: 'Popatrz na klocki. Jaka to liczba?',
        placeValueTens: 'Ile jest dziesiątek na obrazku?',
        placeValueTensSpeak: 'Popatrz na klocki. Ile jest dziesiątek?',
        placeValueBuild: (n: number) => `Zbuduj z klocków liczbę ${n}.`,
        placeValueReadHint: 'Policz osobno dziesiątki i jedności.',
        placeValueReadHundredsHint: 'Policz osobno setki, dziesiątki i jedności.',
        placeValueHundredsLine: (h: number) => `${countNoun(h, nouns.setka)} to ${h * 100}`,
        placeValueTensLine: (t: number) => `${countNoun(t, nouns.dziesiątka)} to ${t * 10}`,
        placeValueReadAnswerHint: (n: number) => `To jest liczba ${n}.`,
        placeValueTensHint: 'Długie klocki to dziesiątki. Policz je.',
        placeValueTensAnswerHint: (t: number) => `${pluralCategory(t) === 'few' ? 'Są' : 'Jest'} ${countNoun(t, nouns.dziesiątka)}.`,
        placeValueDecomposeHint: 'Od całej liczby odejmij to, co już jest.',
        placeValueBuildHint: 'Dziesiątki to długie klocki, a jedności to małe kostki.',
        placeValueBuildAnswerHint: (n: number, t: number, o: number) =>
            `Liczba ${n} to ${[t > 0 ? countNoun(t, nouns.dziesiątka) : '', o > 0 ? countNoun(o, nouns.jedność) : ''].filter((x) => x !== '').join(' i ')}.`,
        // PLACE_VALUE thousands and orders (S-14c): text only, numbers from 10 000 grouped by `formatNumber`.
        placeValuePlaces: { thousands: 'tysięcy', hundreds: 'setek', tens: 'dziesiątek', ones: 'jedności' },
        placeValueDigitPrompt: (place: string, n: number) => `Jaka cyfra jest na miejscu ${place} w liczbie ${formatNumber(n)}?`,
        placeValueDigitHint: 'Czytaj liczbę od lewej: tysiące, setki, dziesiątki, jedności.',
        placeValueDigitLine: (n: number, th: number, h: number, t: number, o: number) =>
            `${formatNumber(n)}: ${countNoun(th, nouns.tysiąc)}, ${countNoun(h, nouns.setka)}, ${countNoun(t, nouns.dziesiątka)}, ${countNoun(o, nouns.jedność)}.`,
        placeValueDigitAnswerHint: (place: string, digit: number) => `Na miejscu ${place} jest cyfra ${digit}.`,
        placeValueGapHint: 'Od całej liczby odejmij części, które już są.',
        placeValueComposeSentence: (parts: string) => `${parts} to jaka liczba?`,
        placeValueJoin: (parts: readonly string[]) => (parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} i ${parts[parts.length - 1]}`),
        placeValuePartValue: (part: string, value: number) => `${part} to ${value}`,
        placeValueComposeHint: 'Zamień każdy rząd na liczbę i dodaj.',
        placeValueOrdersCountPrompt: (n: number) => `Ile tysięcy to ${formatNumber(n)}?`,
        placeValueOrdersCountHint: 'Odetnij z końca liczby trzy zera.',
        placeValueOrdersCountAnswerHint: (n: number, k: number) => `Po odcięciu trzech zer z ${formatNumber(n)} zostaje ${k}.`,
        placeValueOrdersHundredsPrompt: (n: number) => `Ile setek tysięcy ma ${formatNumber(n)}?`,
        placeValueOrdersHundredsHint: 'Jedna setka tysięcy to sto tysięcy.',
        placeValueOrdersHundredsAnswerHint: (n: number, d: number) => `${formatNumber(n)} to ${countNoun(d, nouns.setka)} tysięcy.`,
        placeValueOrdersCompose: (hundreds: number, thousands: number) => `${countNoun(hundreds, nouns.setka)} tysięcy i ${thousands} tysięcy`,
        placeValueOrdersComposeLine: (hundreds: number, thousands: number) =>
            `${countNoun(hundreds, nouns.setka)} tysięcy to ${formatNumber(hundreds * 100000)}, ${thousands} tysięcy to ${formatNumber(thousands * 1000)}.`,
        // PUZZLE_GRID (S-13b): the magic square and the number pyramid are drawings; the texts name the rule.
        puzzleMagicPrompt: 'Jaka liczba pasuje do pustego pola w kwadracie magicznym?',
        puzzleMagicSpeak: 'Popatrz na kwadrat magiczny. Jaka liczba pasuje do pustego pola?',
        puzzleMagicHint: 'Wiersze, kolumny i przekątne mają równe sumy. Dodaj pełną linię.',
        puzzleMagicFullLine: (kind: 'row' | 'column' | 'diagonal', terms: string, sum: number) =>
            `${kind === 'row' ? 'Pełny wiersz' : kind === 'column' ? 'Pełna kolumna' : 'Pełna przekątna'}: ${terms} = ${sum}.`,
        puzzleMagicGapLine: (kind: 'row' | 'column' | 'diagonal', a: number, b: number) =>
            `${kind === 'row' ? 'W wierszu' : kind === 'column' ? 'W kolumnie' : 'Na przekątnej'} z pustym polem są ${a} i ${b}.`,
        puzzlePyramidPrompt: 'Jaka liczba pasuje do pustej cegły w piramidzie?',
        puzzlePyramidSpeak: 'Popatrz na piramidę. Jaka liczba pasuje do pustej cegły?',
        puzzlePyramidHint: 'Liczba w cegle to suma dwóch cegieł pod nią.',
        puzzlePyramidBaseHint: 'Cegła nad dwiema cegłami jest ich sumą, więc odejmij znaną cegłę od tej nad nimi.',
        // GRID (S-13b): columns are letters, rows are numbers; the item names are nominative nouns from the dictionary.
        gridWherePrompt: (noun: string) => `Na którym polu leży ${noun}?`,
        gridWhatPrompt: (cell: string) => `Co leży na polu ${cell}?`,
        // The narrator says the column letter by its Polish name: a bare "D" or "C" would be read as a Roman numeral or a stray letter.
        gridWhatSpeak: (col: number, row: number) =>
            `Co leży na polu ${['a', 'be', 'ce', 'de', 'e', 'ef'][col] ?? ''} ${row + 1}?`,
        gridHint: 'Najpierw litera kolumny, potem numer wiersza.',
        gridCellHint: (cell: string, col: number, row: number) =>
            `Pole ${cell}: kolumna ${String.fromCharCode(65 + col)}, wiersz ${row + 1}.`,
        gridWhereAnswerHint: (cell: string) => `To pole ${cell}.`,
        gridWhatAnswerHint: (cell: string, noun: string) => `Na polu ${cell} leży ${noun}.`,
        // PERIMETER (S-13b): the figures carry the lengths; the texts name the rule. Lengths are in centimetres.
        perimeterRectPrompt: 'Oblicz obwód prostokąta w centymetrach.',
        perimeterSquarePrompt: 'Oblicz obwód kwadratu w centymetrach.',
        perimeterTrianglePrompt: 'Oblicz obwód trójkąta w centymetrach.',
        perimeterSideSquarePrompt: (perimeter: number) => `Obwód kwadratu wynosi ${perimeter} cm. Ile centymetrów ma jeden bok?`,
        perimeterSideRectPrompt: (perimeter: number, side: number) =>
            `Obwód prostokąta wynosi ${perimeter} cm. Jeden bok ma ${side} cm. Ile centymetrów ma drugi bok?`,
        perimeterCompositePrompt: 'Bok każdej kratki ma 1 cm. Oblicz obwód tej figury w centymetrach.',
        sideLabel: (cm: number) => `${cm} cm`,   // written at a side of a drawn figure
        // WRITTEN (S-14b, DESIGN-GAP 90, 91): the kit has no copy for the column task; prompts and step lines are ours.
        writtenAddPrompt: (a: number, b: number) => `Dodaj w słupku: ${a} + ${b}`,
        writtenSubPrompt: (a: number, b: number) => `Odejmij w słupku: ${a} − ${b}`,
        writtenColumnNames: ['Jedności', 'Dziesiątki', 'Setki'] as readonly string[],
        writtenBorrowFrom: ['dziesiątkę', 'setkę'] as readonly string[],   // accusative: the unit borrowed from the next column
        writtenAddLine: (name: string, terms: string, total: number, carry: boolean) =>
            carry ? `${name}: ${terms} = ${total}. Piszę ${total - 10}, 1 dalej.` : `${name}: ${terms} = ${total}.`,
        writtenSubLine: (name: string, a: number, b: number) => `${name}: ${a} − ${b} = ${a - b}.`,
        writtenSubLineReduced: (name: string, was: number, now: number, b: number) => `${name}: było ${was}, po pożyczce ${now}. ${now} − ${b} = ${now - b}.`,
        writtenSubBorrowLine: (name: string, a: number, b: number, unit: string) => `${name}: ${a} − ${b} nie da się. Pożyczam ${unit}: ${a + 10} − ${b} = ${a + 10 - b}.`,
        writtenSubBorrowLineReduced: (name: string, was: number, now: number, b: number, unit: string) =>
            `${name}: było ${was}, po pożyczce ${now}. ${now} − ${b} nie da się. Pożyczam ${unit}: ${now + 10} − ${b} = ${now + 10 - b}.`,
        perimeterHint: 'Obwód to suma długości wszystkich boków.',
        perimeterSquareHint: 'Kwadrat ma cztery równe boki.',
        perimeterSideRectHint: 'Obwód to dwa razy suma dwóch sąsiednich boków.',
        perimeterCompositeHint: 'Idź dookoła figury i dodaj długości wszystkich jej boków.',
        dataMostLeast: 'Porównaj wysokość słupków.',
        dataValuesHint: (pairs: string) => `Wysokości słupków: ${pairs}.`,
        dataMostAnswerHint: (label: string) => `Najwyższy jest słupek „${label}”.`,
        dataLeastAnswerHint: (label: string) => `Najniższy jest słupek „${label}”.`,
        dataHowMany: (intro: string, acc: string) => `${intro} Ile dzieci zagłosowało na ${acc}?`,
        dataHowManyHint: (label: string) => `Znajdź słupek „${label}” i zobacz, do której kreski sięga.`,
        dataHowManyAnswerHint: (label: string, value: number) => `Słupek „${label}” sięga do ${value}.`,
        dataDiff: (intro: string, more: string, less: string) => `${intro} O ile więcej dzieci zagłosowało na ${more} niż na ${less}?`,
        dataDiffHint: 'Odczytaj oba słupki i odejmij mniejszą wysokość od większej.',
    },
} as const;

/** Room texts looked up by a data key (RoomTaskDef.label, SlotDef.id); an unknown key yields undefined. */
export const roomText = {
    task: (key: string): string | undefined => (pl.room.tasks as Readonly<Record<string, string>>)[key],
    slot: (key: string): string | undefined => (pl.room.slots as Readonly<Record<string, string>>)[key],
    variant: (slot: string, index: number): string | undefined => pl.room.variants[slot]?.[index],
    decor: (key: string): string | undefined => pl.room.decor[key],
};
