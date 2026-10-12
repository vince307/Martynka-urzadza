// Calendar data for CALENDAR tasks: month names with the cases the prompts
// need, quarters and weekdays. Data only; generators pick and format.

export interface Month {
    index: number;        // 1–12
    name: string;         // mianownik: "styczeń"
    genitive: string;     // dopełniacz: "stycznia" (daty: 7 stycznia)
    locative: string;     // miejscownik po "w" / "po": "w styczniu", "po styczniu"
    instrumental: string; // narzędnik po "przed": "przed styczniem"
    quarter: 1 | 2 | 3 | 4;
}

export const months: readonly Month[] = [
    { index: 1, name: 'styczeń', genitive: 'stycznia', locative: 'styczniu', instrumental: 'styczniem', quarter: 1 },
    { index: 2, name: 'luty', genitive: 'lutego', locative: 'lutym', instrumental: 'lutym', quarter: 1 },
    { index: 3, name: 'marzec', genitive: 'marca', locative: 'marcu', instrumental: 'marcem', quarter: 1 },
    { index: 4, name: 'kwiecień', genitive: 'kwietnia', locative: 'kwietniu', instrumental: 'kwietniem', quarter: 2 },
    { index: 5, name: 'maj', genitive: 'maja', locative: 'maju', instrumental: 'majem', quarter: 2 },
    { index: 6, name: 'czerwiec', genitive: 'czerwca', locative: 'czerwcu', instrumental: 'czerwcem', quarter: 2 },
    { index: 7, name: 'lipiec', genitive: 'lipca', locative: 'lipcu', instrumental: 'lipcem', quarter: 3 },
    { index: 8, name: 'sierpień', genitive: 'sierpnia', locative: 'sierpniu', instrumental: 'sierpniem', quarter: 3 },
    { index: 9, name: 'wrzesień', genitive: 'września', locative: 'wrześniu', instrumental: 'wrześniem', quarter: 3 },
    { index: 10, name: 'październik', genitive: 'października', locative: 'październiku', instrumental: 'październikiem', quarter: 4 },
    { index: 11, name: 'listopad', genitive: 'listopada', locative: 'listopadzie', instrumental: 'listopadem', quarter: 4 },
    { index: 12, name: 'grudzień', genitive: 'grudnia', locative: 'grudniu', instrumental: 'grudniem', quarter: 4 },
];

/** Quarter labels as children see them on a calendar page. */
export const quarters: readonly string[] = ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał'];

export const weekdays: readonly string[] = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
