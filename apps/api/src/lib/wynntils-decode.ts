
/**
 * Wynntils private-use-area decoder constants & logic
 * Based on src/encoding/string.rs from idmangler-lib
 */
export const AREA_A = 0x0f0000;
export const AREA_B = 0x100000;

/**
 * Decode a Wynntils idstring into raw bytes.
 * @param idstr - the PUA-encoded string
 * @returns array of decoded byte values [0..255]
 */
export function decodeString(idstr: string): number[] {
    const out: number[] = [];
    for (const ch of idstr) {
        const cp = ch.codePointAt(0) as number;
        if (cp < AREA_A || cp > AREA_B + 0xffff) {
            throw new Error(`Invalid codepoint: ${cp.toString(16)}`);
        }
        if (cp >= AREA_B) {
            const low = cp & 0xff;
            if (low === 0xee) {
                out.push((cp & 0xff00) >> 8);
            } else {
                out.push(0xff, 254 + low);
            }
        } else {
            out.push((cp & 0xff00) >> 8, cp & 0x00ff);
        }
    }
    return out;
}

/**
 * Decode a zigzag LEB128 varint per idmangler-lib/src/encoding/varint.rs
 * @param next - function that returns next byte from stream
 * @returns signed integer value
 */
function decodeVarint(next: () => number): number {
    const data: number[] = [];
    while (true) {
        const b = next();
        data.push(b);
        if ((b & 0x80) === 0) break;
    }
    let zigzag = 0;
    for (let i = 0; i < data.length; i++) {
        zigzag |= (data[i] & 0x7f) << (7 * i);
    }
    // zigzag decode: (value >> 1) ^ -(value & 1)
    return (zigzag >>> 1) ^ -(zigzag & 1);
}

/**
 * Block identifiers as per src/block/mod.rs
 */
export enum DataBlockId {
    StartData = 0,
    TypeData = 1,
    NameData = 2,
    IdentificationData = 3,
    PowderData = 4,
    RerollData = 5,
    ShinyData = 6,
    CraftedGearType = 7,
    DurabilityData = 8,
    RequirementsData = 9,
    DamageData = 10,
    DefenseData = 11,
    CraftedIdentificationData = 12,
    CraftedConsumableTypeData = 13,
    UsesData = 14,
    EffectsData = 15,
    EndData = 255,
}

/**
 * Interfaces for each block type
 */
export interface StartDataBlock {
    id: DataBlockId.StartData;
    name: 'StartData';
    version: number;
}

export interface TypeDataBlock {
    id: DataBlockId.TypeData;
    name: 'TypeData';
    itemType: number;
}

export interface NameDataBlock {
    id: DataBlockId.NameData;
    name: 'NameData';
    nameStr: string;
}

export interface RerollDataBlock {
    id: DataBlockId.RerollData;
    name: 'RerollData';
    rerollCount: number;
}

export interface IdentificationDataBlock {
    id: DataBlockId.IdentificationData;
    name: 'IdentificationData';
    extended: boolean;
    identifications: Array<{
        kind: number;
        base: number | null;
        roll: number | 'preid';
    }>;
}

export interface PowderDataBlock {
    id: DataBlockId.PowderData;
    name: 'PowderData';
    powderSlots: number;
    powders: Array<{ element: number; tier: number }>;
}

export interface ShinyDataBlock {
    id: DataBlockId.ShinyData;
    name: 'ShinyData';
    shinyId: number;     // tracker stat ID
    rerollCount: number; // number of shiny rerolls
    val: number;         // tracker count
}

export interface EndDataBlock {
    id: DataBlockId.EndData;
    name: 'EndData';
}

/**
 * Union of all block types
 */
export type Block =
    | StartDataBlock
    | TypeDataBlock
    | NameDataBlock
    | RerollDataBlock
    | IdentificationDataBlock
    | PowderDataBlock
    | ShinyDataBlock
    | EndDataBlock;

/**
 * Walk the byte stream and decode into Block[]
 * @param bytes - array of bytes from decodeString()
 */
export function decodeBlocks(bytes: number[]): Block[] {
    let i = 0;
    const next = (): number => {
        if (i >= bytes.length) throw new Error('Unexpected end of bytes');
        return bytes[i++];
    };

    // --- StartData (id=0) & version
    const startId = next();
    if (startId !== DataBlockId.StartData) {
        throw new Error('No start block');
    }
    const version = next();
    const blocks: Block[] = [
        { id: DataBlockId.StartData, name: 'StartData', version },
    ];

    // --- Main loop until EndData
    while (true) {
        const id = next();
        if (id === DataBlockId.EndData) {
            blocks.push({ id: DataBlockId.EndData, name: 'EndData' });
            break;
        }
        switch (id) {
            case DataBlockId.TypeData: {
                const itemType = next();
                blocks.push({ id: DataBlockId.TypeData, name: 'TypeData', itemType });
                break;
            }

            case DataBlockId.NameData: {
                const nameBytes: number[] = [];
                while (true) {
                    const b = next();
                    if (b === 0) break;
                    nameBytes.push(b);
                }
                const nameStr = new TextDecoder().decode(new Uint8Array(nameBytes));
                blocks.push({ id: DataBlockId.NameData, name: 'NameData', nameStr });
                break;
            }

            case DataBlockId.RerollData: {
                const rerollCount = next();
                blocks.push({ id: DataBlockId.RerollData, name: 'RerollData', rerollCount });
                break;
            }

            case DataBlockId.IdentificationData: {
                const identCount = next();
                const extended = next() === 1;
                const preidCount = extended ? next() : 0;
                const total = identCount + preidCount;
                const idents: IdentificationDataBlock['identifications'] = [];
                for (let idx = 0; idx < total; idx++) {
                    const kind = next();
                    // decode base via varint if extended
                    const base = extended ? decodeVarint(next) : null;
                    const isPre = idx < preidCount;
                    const roll: number | 'preid' = isPre ? 'preid' : next();
                    idents.push({ kind, base, roll });
                }
                blocks.push({
                    id: DataBlockId.IdentificationData,
                    name: 'IdentificationData',
                    extended,
                    identifications: idents,
                });
                break;
            }

            case DataBlockId.PowderData: {
                const powderSlots = next();
                const powderCount = next();
                const bits = powderCount * 5;
                const totalBytes = Math.ceil(bits / 8);
                const raw = bytes.slice(i, i + totalBytes);
                i += totalBytes;
                const powders: PowderDataBlock['powders'] = [];
                for (let p = 0; p < powderCount; p++) {
                    let val = 0;
                    for (let b = 0; b < 5; b++) {
                        const bitIdx = p * 5 + b;
                        const byteVal = raw[Math.floor(bitIdx / 8)];
                        const bit = (byteVal >> (7 - (bitIdx % 8))) & 1;
                        val = (val << 1) | bit;
                    }
                    if (val === 0) continue;
                    const element = Math.floor(val / 6);
                    const tier = val % 6 === 0 ? 6 : val % 6;
                    powders.push({ element, tier });
                }
                blocks.push({
                    id: DataBlockId.PowderData,
                    name: 'PowderData',
                    powderSlots,
                    powders,
                });
                break;
            }

            case DataBlockId.ShinyData: {
                const shinyId = next(); // always exists

                // Try to parse as new format
                let rerollCount = 0;
                let val: number;

                const savedIndex = i;  // save current position
                try {
                    rerollCount = next();         // try consuming rerollCount
                    val = decodeVarint(next);     // decode val
                } catch {
                    // rollback -> old format
                    i = savedIndex;
                    rerollCount = 0;
                    val = decodeVarint(next);
                }

                blocks.push({
                    id,
                    name: "ShinyData",
                    shinyId,
                    rerollCount,
                    val,
                });
                break;
            }

            default:
                throw new Error(`Unhandled block id: ${id}`);
        }
    }
    return blocks;
}

/**
 * High-level: string -> Block[]
 */
export function parseIdString(idstr: string): Block[] {
    const bytes = decodeString(idstr);
    return decodeBlocks(bytes);
}
