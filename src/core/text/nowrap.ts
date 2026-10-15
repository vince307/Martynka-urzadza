// Phaser's word wrap breaks lines at plain spaces only, so a no-break space keeps two pieces on one line.
// Visual gate S-14b: solution lines in a narrow strip broke inside equations ("9 + / 3 = 12") and left a lone number ("odejmij / 9.").

const NBSP = ' ';
// A number, an operator, a number: the spaces on both sides of the operator (the lookahead lets a chain "9 + 3 = 12" glue link by link).
const OPERATOR = /(\d) ([+−\-·:=<>]) (?=\d)/g;
// A number (with its closing punctuation) that ends the line stays with the word before it.
const LAST_NUMBER = / (\d+[.,!?]?)$/;
// Visual gate S-14d: a number and its unit ("8 zł") stay together, and an operator stays with the amount after it ("= 8 zł"), so a
// sum of amounts ("5 zł + 2 zł = 7 zł") can break only before an operator.
const UNIT = /(\d) (zł|gr|km|dm|cm|mm|m|kg|dag|g|ml|l)(?=$|[\s.,!?;:)])/g;
const OPERATOR_BEFORE_AMOUNT = / ([+−=<>·]) (?=\d)/g;

/** The line with no-break spaces inside every equation and before a number that ends it; the text itself is unchanged. */
export const keepTogether = (line: string): string =>
    line
        .replace(OPERATOR, `$1${NBSP}$2${NBSP}`)
        .replace(UNIT, `$1${NBSP}$2`)
        .replace(OPERATOR_BEFORE_AMOUNT, ` $1${NBSP}`)
        .replace(LAST_NUMBER, `${NBSP}$1`);
