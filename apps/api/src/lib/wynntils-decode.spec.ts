import { decodeBlocks, parseIdString } from './wynntils-decode';

/**
 * v3 test string from test.txt: StartData version byte is 2, but the
 * IdentificationData block uses the v3 layout introduced by Wynntils PR #4265.
 */
const V3_TEST_STRING =
    '󰀂󰄀󰉗󶅲󷀀󰌉󰁅󽨁󰐞󱅒󰐑󲉇󰐚󱣗󰄄󱼙󿄊󰐙󱜩󰐣󰐠󰐘󵇆󰌄󱼦󽠃󰐐󰐃󰀅󰈆󰄀󹻦󰧿';

describe('wynntils-decode v3 (Wynntils PR #4265)', () => {
    it('decodes the v3 test string end to end', () => {
        const blocks = parseIdString(V3_TEST_STRING);
        expect(blocks[0]).toMatchObject({ name: 'StartData', version: 2 });
        expect(blocks[blocks.length - 1].name).toBe('EndData');

        const ident = blocks.find((b) => b.name === 'IdentificationData')!;
        expect(ident.layout).toBe('v3');
        expect(ident.identifications.length).toBeGreaterThan(0);
        for (const entry of ident.identifications) {
            if (entry.preid) {
                // preid entries carry only kind + base
                expect(entry.value).toBeNull();
            } else {
                // v3: rolled stat value is a varint, plus a flags byte
                expect(typeof entry.value).toBe('number');
                expect(typeof entry.flags).toBe('number');
                if ((entry.flags ?? 0) & 4) {
                    // VANILLA_METER flag present -> meter offset byte follows
                    expect(typeof entry.meter).toBe('number');
                }
            }
        }
    });

    it('falls back to the legacy identification layout', () => {
        const bytes = [
            0, 2, // StartData + version 2
            3, 1, 1, 0, // block 3: count=1, extended=1, preidCount=0
            5, 4, 42, // entry: kind=5, base=2 (varint 4), roll=42
            255,
        ];
        const blocks = decodeBlocks(bytes);
        const ident = blocks.find((b) => b.name === 'IdentificationData')!;
        expect(ident.layout).toBe('legacy');
        expect(ident.identifications).toHaveLength(1);
        expect(ident.identifications[0]).toMatchObject({ kind: 5, base: 2, value: 42, preid: false });
    });

    it('parses v3 identification entries with flags and meter byte', () => {
        const bytes = [
            0, 3, // StartData + version 3
            3, 1, 1, 0, // block 3: count=1, extended=1, preidCount=0
            5, 2, 6, 7, 1, // entry: kind=5, base=1 (varint 2), value=3 (varint 6), flags=0b111, meter=1
            255,
        ];
        const blocks = decodeBlocks(bytes);
        const ident = blocks.find((b) => b.name === 'IdentificationData')!;
        expect(ident.identifications[0]).toMatchObject({
            kind: 5,
            base: 1,
            value: 3,
            flags: 7,
            meter: 1,
            preid: false,
        });
    });

    it('parses preid entries without value bytes', () => {
        const bytes = [
            0, 2,
            3, 1, 1, 1, // block 3: count=1, extended=1, preidCount=1
            5, 4, // preid entry: kind=5, base=2 (varint 4)
            6, 2, 10, // normal entry: kind=6, base=1 (varint 2), roll=10
            255,
        ];
        const blocks = decodeBlocks(bytes);
        const ident = blocks.find((b) => b.name === 'IdentificationData')!;
        expect(ident.identifications).toHaveLength(2);
        expect(ident.identifications[0]).toMatchObject({ kind: 5, base: 2, value: null, preid: true });
        expect(ident.identifications[1]).toMatchObject({ kind: 6, base: 1, value: 10, preid: false });
    });

    it('parses the new mount blocks (16-21) and other new blocks', () => {
        const bytes = [
            0, 3,
            16, 4, // MountTypeData: mountType=4
            21, 1, 1, 5, 10, // MountStatsMaxData: estimatedMaxStats=1, count=1, statId=5, max=5 (varint 10)
            14, 3, 10, // UsesData: currentUses=3, maxUses=10
            255,
        ];
        const blocks = decodeBlocks(bytes);
        expect(blocks.map((b) => b.name)).toEqual([
            'StartData',
            'MountTypeData',
            'MountStatsMaxData',
            'UsesData',
            'EndData',
        ]);
        expect(blocks[1]).toMatchObject({ name: 'MountTypeData', mountType: 4 });
        expect(blocks[2]).toMatchObject({ estimatedMaxStats: 1, stats: [{ statId: 5, max: 5 }] });
        expect(blocks[3]).toMatchObject({ currentUses: 3, maxUses: 10 });
    });
});
