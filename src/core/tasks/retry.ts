// A bounded rejection loop for generators: draw until `ok`, never forever. An infeasible parameter set becomes a
// RangeError naming the loop instead of a hung tab. The rng is consumed exactly as in a plain `do … while` loop.
export const drawUntil = <T>(label: string, draw: () => T, ok: (t: T) => boolean, max = 1000): T => {
    for (let attempt = 0; attempt < max; attempt += 1) {
        const value = draw();
        if (ok(value)) {
            return value;
        }
    }
    throw new RangeError(`${label}: no draw in ${max} tries`);
};
