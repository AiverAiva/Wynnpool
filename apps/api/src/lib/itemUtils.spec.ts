import { actualValueToInternalRoll, calculateIdentificationRoll } from './itemUtils';

describe('actualValueToInternalRoll (Wynntils encoding v3)', () => {
    it('inverts actual ≈ round(roll * raw / 100)', () => {
        expect(actualValueToInternalRoll(109, 90)).toBe(121);
        expect(actualValueToInternalRoll(-36, -45)).toBe(80);
        expect(actualValueToInternalRoll(236, -299)).toBe(79);
    });

    it('recovers ~79.76% overall for the Warp v3 test values', () => {
        // Decoded actual values from test.txt + Warp ranges from the item DB.
        const cases: Array<{
            key: string;
            actual: number;
            range: { min: number; max: number; raw: number };
        }> = [
            { key: 'reflection', actual: 109, range: { min: 27, max: 117, raw: 90 } },
            { key: 'exploding', actual: 41, range: { min: 15, max: 65, raw: 50 } },
            { key: 'manaRegen', actual: -36, range: { min: -58, max: -31, raw: -45 } },
            { key: 'healthRegen', actual: -108, range: { min: -195, max: -105, raw: -150 } },
            { key: 'healthRegenRaw', actual: -697, range: { min: -1092, max: -588, raw: -840 } },
            { key: 'healingEfficiency', actual: -21, range: { min: -39, max: -21, raw: -30 } },
            { key: 'airDamage', actual: 16, range: { min: 5, max: 20, raw: 15 } },
            { key: 'walkSpeed', actual: 227, range: { min: 54, max: 234, raw: 180 } },
            { key: 'raw2ndSpellCost', actual: 236, range: { min: -90, max: -389, raw: -299 } },
        ];

        const percentages = cases.map(({ key, actual, range }) => {
            const roll = actualValueToInternalRoll(actual, range.raw);
            return calculateIdentificationRoll(key, range, roll).percentage;
        });
        const overall = percentages.reduce((a, b) => a + b, 0) / percentages.length;
        expect(overall).toBeCloseTo(79.76, 1);
    });
});
