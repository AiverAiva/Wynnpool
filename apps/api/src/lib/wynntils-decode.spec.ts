import { decodeBlocks, ItemDecodeError, parseIdString } from './wynntils-decode';
import { BROKEN_ITEM_STRINGS, VALID_V4_ITEM_STRING } from './wynntils-decode.fixtures';

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
            0, 2, // StartData + version 3.X.X
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

/**
 * Arethusa 4.0.0 (version byte 0x03) string for an Ascended Lament, captured
 * from Wynntils v4.2.17. v4 stores meter + perfect bytes per identification,
 * 6-bit powders with a powder special, and drops the durability effectiveness
 * byte; decoding it with the 3.X.X rules desyncs the byte stream.
 */
const V4_TEST_STRING = VALID_V4_ITEM_STRING;

describe('wynntils-decode v4 (Arethusa 4.0.0)', () => {
    it('decodes a v4 gear string end to end', () => {
        const blocks = parseIdString(V4_TEST_STRING);
        expect(blocks[0]).toMatchObject({ name: 'StartData', version: 3 });
        expect(blocks[blocks.length - 1].name).toBe('EndData');

        expect(blocks.find((b) => b.name === 'NameData')).toMatchObject({
            nameStr: 'Ascended Lament',
        });

        const ident = blocks.find((b) => b.name === 'IdentificationData')!;
        expect(ident.layout).toBe('v4');
        expect(ident.identifications).toEqual([
            { kind: 0x39, base: 35, value: null, preid: true },
            { kind: 0x1e, base: -600, value: -732, meter: 5, perfect: 0, preid: false },
            { kind: 0x23, base: 40, value: 46, meter: 29, perfect: 0, preid: false },
            { kind: 0x17, base: 50, value: 64, meter: 35, perfect: 0, preid: false },
            { kind: 0x52, base: 100, value: 130, meter: 36, perfect: 1, preid: false },
            { kind: 0x00, base: 27, value: 34, meter: 32, perfect: 0, preid: false },
        ]);

        expect(blocks.find((b) => b.name === 'PowderData')).toMatchObject({
            powderSlots: 3,
            powders: [
                { element: 2, tier: 7 },
                { element: 2, tier: 7 },
                { element: 2, tier: 7 },
            ],
            specialId: 5,
            specialTier: 7,
        });

        expect(blocks.find((b) => b.name === 'RerollData')).toMatchObject({ rerollCount: 4 });
    });

    it('reports a desynced identification block instead of failing later', () => {
        const bytes = [
            0, 3, // StartData + version 3
            3, 1, 1, 0, // IdentificationData: count=1, extended, no pre-IDs
            5, 4, 6, 1, 0, // kind=5, base=2, value=3, meter=1, perfect=0
            0x20, // not a valid block id
            255,
        ];
        expect(() => decodeBlocks(bytes)).toThrow(/desync/);

        const error = captureDecodeError(() => decodeBlocks(bytes));
        expect(error.details).toMatchObject({
            code: 'invalid-block',
            version: 3,
            versionName: 'Arethusa 4.X.X',
            offset: 11,
            byteLength: 13,
            decodedBlocks: ['StartData'],
        });
        expect(error.details.reason).toMatch(/desync/);
    });
});

describe('decode error diagnostics', () => {
    it('flags an encoding version newer than 4.X.X', () => {
        const error = captureDecodeError(() => decodeBlocks([0, 4, 255]));
        expect(error.details).toMatchObject({
            code: 'unsupported-version',
            version: 4,
            offset: 2,
            byteLength: 3,
            decodedBlocks: [],
        });
        expect(error.details.reason).toMatch(/Unsupported encoding version/);
    });

    it('flags a truncated byte stream', () => {
        const error = captureDecodeError(() => decodeBlocks([0, 3, 1]));
        expect(error.details).toMatchObject({
            code: 'truncated',
            version: 3,
            offset: 3,
            byteLength: 3,
            decodedBlocks: ['StartData'],
        });
    });

    it('flags characters outside the private-use areas', () => {
        const error = captureDecodeError(() => parseIdString('abc'));
        expect(error.details).toMatchObject({
            code: 'invalid-characters',
            offset: 0,
            byteLength: 0,
            decodedBlocks: [],
        });
    });
});

function captureDecodeError(run: () => unknown): ItemDecodeError {
    try {
        run();
    } catch (error) {
        expect(error).toBeInstanceOf(ItemDecodeError);
        return error as ItemDecodeError;
    }
    throw new Error('Expected decoding to fail');
}

describe('broken item string fixtures', () => {
    for (const fixture of BROKEN_ITEM_STRINGS) {
        it(`${fixture.name} -> ${fixture.decodeCode ?? 'clean decode'} (HTTP ${fixture.httpStatus})`, () => {
            if (fixture.decodeCode === null) {
                expect(() => parseIdString(fixture.item)).not.toThrow();
                return;
            }

            const error = captureDecodeError(() => parseIdString(fixture.item));
            expect(error.details).toMatchObject({
                code: fixture.decodeCode,
                ...(fixture.version !== undefined ? { version: fixture.version } : {}),
                ...(fixture.versionName !== undefined ? { versionName: fixture.versionName } : {}),
                ...(fixture.offset !== undefined ? { offset: fixture.offset } : {}),
                ...(fixture.byteLength !== undefined ? { byteLength: fixture.byteLength } : {}),
            });
        });
    }
});
