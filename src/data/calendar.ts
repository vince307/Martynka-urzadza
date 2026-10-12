// Calendar data for CALENDAR tasks: month names with the cases the prompts
// need, quarters and weekdays. Data only; generators pick and format.

export interface Month {
    index: number;        // 1–12
    name: string;         // mianownik: "styczeń"
    genitive: string;     // dopełniacz: "stycznia" (daty: 7 stycznia)
    locative: string;     // miejscownik po "w" / "po": "w styczniu", "po styczniu"
    instrumental: string; // narzędnik po "przed": "przed styczniem"
    quarter: 1 | 2 | 3 | 4;
    days: 28 | 30 | 31;   // length of the month (February: 28, never asked)
}

export const months: readonly Month[] = [
    { index: 1, name: 'styczeń', genitive: 'stycznia', locative: 'styczniu', instrumental: 'styczniem', quarter: 1, days: 31 },
    { index: 2, name: 'luty', genitive: 'lutego', locative: 'lutym', instrumental: 'lutym', quarter: 1, days: 28 },
    { index: 3, name: 'marzec', genitive: 'marca', locative: 'marcu', instrumental: 'marcem', quarter: 1, days: 31 },
    { index: 4, name: 'kwiecień', genitive: 'kwietnia', locative: 'kwietniu', instrumental: 'kwietniem', quarter: 2, days: 30 },
    { index: 5, name: 'maj', genitive: 'maja', locative: 'maju', instrumental: 'majem', quarter: 2, days: 31 },
    { index: 6, name: 'czerwiec', genitive: 'czerwca', locative: 'czerwcu', instrumental: 'czerwcem', quarter: 2, days: 30 },
    { index: 7, name: 'lipiec', genitive: 'lipca', locative: 'lipcu', instrumental: 'lipcem', quarter: 3, days: 31 },
    { index: 8, name: 'sierpień', genitive: 'sierpnia', locative: 'sierpniu', instrumental: 'sierpniem', quarter: 3, days: 31 },
    { index: 9, name: 'wrzesień', genitive: 'września', locative: 'wrześniu', instrumental: 'wrześniem', quarter: 3, days: 30 },
    { index: 10, name: 'październik', genitive: 'października', locative: 'październiku', instrumental: 'październikiem', quarter: 4, days: 31 },
    { index: 11, name: 'listopad', genitive: 'listopada', locative: 'listopadzie', instrumental: 'listopadem', quarter: 4, days: 30 },
    { index: 12, name: 'grudzień', genitive: 'grudnia', locative: 'grudniu', instrumental: 'grudniem', quarter: 4, days: 31 },
];

/** Quarter labels as children see them on a calendar page. */
export const quarters: readonly string[] = ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał'];

/** A weekday with the cases the prompts need: "po środzie", "przed środą". */
export interface Weekday {
    name: string;   // mianownik: "środa" (answer tiles)
    after: string;  // miejscownik po "po": "środzie"
    before: string; // narzędnik po "przed": "środą"
}

/** Monday first, as on a Polish calendar. */
export const weekdays: readonly Weekday[] = [
    { name: 'poniedziałek', after: 'poniedziałku', before: 'poniedziałkiem' },
    { name: 'wtorek', after: 'wtorku', before: 'wtorkiem' },
    { name: 'środa', after: 'środzie', before: 'środą' },
    { name: 'czwartek', after: 'czwartku', before: 'czwartkiem' },
    { name: 'piątek', after: 'piątku', before: 'piątkiem' },
    { name: 'sobota', after: 'sobocie', before: 'sobotą' },
    { name: 'niedziela', after: 'niedzieli', before: 'niedzielą' },
];

/** Small pool of calendar facts a child should know by heart (E5.11, E6.1). */
export interface TimeFact {
    question: string;
    answer: number;
    hint: string; // first hint line, never contains the answer
}

export const timeFacts: readonly TimeFact[] = [
    { question: 'Ile lat ma dekada?', answer: 10, hint: 'Dekada to tyle lat, ile palców mamy u obu rąk.' },
    { question: 'Ile miesięcy ma rok?', answer: 12, hint: 'Wyobraź sobie kalendarz od stycznia do grudnia i policz kartki.' },
    { question: 'Ile dni ma rok, który nie jest przestępny?', answer: 365, hint: 'Rok to dużo dni, ale mniej niż czterysta.' },
    { question: 'Ile dni ma tydzień?', answer: 7, hint: 'Wymień po kolei: poniedziałek, wtorek, środa, czwartek, piątek, sobota, niedziela.' },
    { question: 'Ile lat ma wiek?', answer: 100, hint: 'Wiek to inaczej stulecie.' },
];
