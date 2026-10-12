// All player-facing Polish strings live here. Scenes and generators reference
// keys, never literals. Task prompts that need a number are functions.
export const pl = {
    title: 'Martynka urządza',
    welcome: {
        question: 'Ile masz lat?',   // kit welcome.png
    },
    overlay: {
        rotate: 'Obróć tablet',
        rotateHint: 'Gra działa w poziomie.',
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
        has: 'ma',
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
        correctStar: 'Brawo! +1 ★',
        next: 'Dalej',
        tryAgain: 'Spróbuj jeszcze raz',
        nextStep: 'Następny krok',
        gotIt: 'Już wiem',
        deleteKey: 'kasuj',
        okKey: 'OK',
        // DESIGN-GAP: the kit has no solution result line (docs/design-gaps.md row 6); the bonus line sits under "+N" on the summary (row 9).
        bonus: (n: number) => `Runda bez błędu! +${n} ★`,
        resultLine: (answer: string) => `Wynik: ${answer}`,
    },
    summary: {
        nextRound: 'Kolejna runda',   // kit summary.png
        toRoom: 'Do pokoju',          // kit summary.png
        earned: (n: number) => `+${n}`,
    },
    // DESIGN-GAP (docs/design-gaps.md row 12): the kit has the return button only; the placeholder caption is ours.
    room: {
        caption: 'Tu powstanie pokój',
        resume: 'Wróć do notesu',   // kit room-return view
    },
    tasks: {
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
        chooseOp: 'Które działanie pasuje?',
        chooseOpHint: {
            sum: 'Przybyło, więc dodajemy.',
            left: 'Ubyło, więc odejmujemy.',
            moreBy: 'Jest więcej, więc dodajemy.',
        },
        sequence: 'Uzupełnij ciąg:',
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
    },
} as const;
