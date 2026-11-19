import { ItemDecodeFailureCode } from './wynntils-decode';

/**
 * Broken item strings kept for reuse.
 *
 * To see the matching error by hand, paste `item` into the Item Analyzer
 * (`/item/analyze`). The PUA characters may render as boxes in editors, but
 * they copy and decode fine. Tests assert the same codes and offsets through
 * `parseIdString`; `httpStatus` documents what the API returns, including the
 * 404 that needs a running API with its item database.
 */
export interface BrokenItemStringFixture {
    /** Short id used in test names. */
    name: string;
    /** The string to paste into the analyzer. */
    item: string;
    /** Decoder failure code, or null when the string decodes cleanly. */
    decodeCode: ItemDecodeFailureCode | null;
    /** HTTP status the decode endpoints return (or the analyze page shows). */
    httpStatus: number;
    /** What a reader should expect. */
    expected: string;
    version?: number;
    versionName?: string;
    offset?: number;
    byteLength?: number;
}

/** Healthy Ascended Lament string (Arethusa 4.X.X), the source of the truncation case. */
export const VALID_V4_ITEM_STRING = '󰀃󰄀󰉁󷍣󶕮󶑥󶐠󴱡󶵥󶹴󰀃󰔁󰄹󴘞󺼉󻜋󰔀󲍐󵰝󰀗󶒀󰄣󰁒󼠁󸐂󲐁󰀶󴐠󰀄󰌃󵕕󴀅󰜅󰓿';

export const BROKEN_ITEM_STRINGS: BrokenItemStringFixture[] = [
    {
        name: 'garbage',
        item: 'abc',
        decodeCode: 'invalid-characters',
        httpStatus: 400,
        expected: 'Plain text pasted instead of an item string',
        offset: 0,
        byteLength: 0,
    },
    {
        name: 'truncated-v4',
        item: '󰀃󰄀󰉁󷍣󶕮󶑥󶐠󴱡󶵥󶹴󰀃󰔁󰄹󴘞󺼉󻜋󰔀󲍐󵰝󰀗󶒀󰄣󰁒󼠁󸐂󲐁󰀶󴐠󰀄󰌃󵕕󴀅󰜅',
        decodeCode: 'truncated',
        httpStatus: 400,
        expected: 'Valid 4.X.X string with the End block cut off',
        version: 3,
        versionName: 'Arethusa 4.X.X',
        offset: 66,
        byteLength: 66,
    },
    {
        name: 'unsupported-version',
        item: '󰀄󰄀󿼀',
        decodeCode: 'unsupported-version',
        httpStatus: 400,
        expected: 'Version byte 0x04, newer than the supported 4.X.X',
        version: 4,
        versionName: 'version byte 0x04',
        offset: 2,
        byteLength: 6,
    },
    {
        name: 'missing-start-block',
        item: '󰄃󿼀',
        decodeCode: 'invalid-start',
        httpStatus: 400,
        expected: 'Starts with another block id instead of StartData',
        offset: 1,
        byteLength: 4,
    },
    {
        name: 'unknown-item-name',
        item: '󰀃󰄀󰉎󶽓󷕣󶡉󷑥󶴀󿼀',
        decodeCode: null,
        httpStatus: 404,
        expected: 'Decodes to "NoSuchItem", which is not in item_data',
        version: 3,
        versionName: 'Arethusa 4.X.X',
    },
];
