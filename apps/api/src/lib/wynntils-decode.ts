
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
 * Why an item string could not be decoded. Used to give users a message they
 * can act on and to include actionable fields in bug reports.
 */
export type ItemDecodeFailureCode =
    | 'invalid-characters'
    | 'invalid-start'
    | 'unsupported-version'
    | 'unsupported-block'
    | 'truncated'
    | 'invalid-block';

export interface ItemDecodeDetails {
    code: ItemDecodeFailureCode;
    /** Technical description of the failure. */
    reason: string;
    /** Encoding version byte from the Start block, when it could be read. */
    version?: number;
    /** Human-readable encoding name, for example "Arethusa 4.X.X". */
    versionName?: string;
    /** Byte offset where decoding stopped. */
    offset: number;
    /** Number of bytes decoded from the string. */
    byteLength: number;
    /** Blocks decoded before the failure, in order. */
    decodedBlocks: string[];
}

export class ItemDecodeError extends Error {
    readonly details: ItemDecodeDetails;

    constructor(details: ItemDecodeDetails) {
        super(details.reason);
        this.name = 'ItemDecodeError';
        this.details = details;
    }
}

/** Internal marker thrown while walking the byte stream. */
class DecodeFailure extends Error {
    constructor(
        readonly code: ItemDecodeFailureCode,
        message: string,
        /** Byte offset to report, when it differs from the current read position. */
        readonly offset?: number,
    ) {
        super(message);
    }
}

/** Map a version byte to the encoding name used in docs and bug reports. */
export function arethusaVersionName(version: number): string {
    switch (version) {
        case 0:
            return 'Arethusa 1.X.X/2.X.X';
        case 1:
            return 'Arethusa 2.X.X';
        case 2:
            return 'Arethusa 3.X.X';
        case 3:
            return 'Arethusa 4.X.X';
        default:
            return `version byte 0x${version.toString(16).padStart(2, '0')}`;
    }
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
    CustomGearType = 7,
    DurabilityData = 8,
    RequirementsData = 9,
    DamageData = 10,
    DefenseData = 11,
    CustomIdentificationData = 12,
    CustomConsumableTypeData = 13,
    UsesData = 14,
    EffectsData = 15,
    MountTypeData = 16,
    MountPotentialData = 17,
    MountColorData = 18,
    MountEnergyData = 19,
    MountStatsData = 20,
    MountStatsMaxData = 21,
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
    /**
     * 'v4' = Arethusa 4.X.X (version byte 0x03) writes the displayed value plus
     * an always-present meter and perfect byte, and stores no roll.
     * 'v3' = Arethusa 3.X.X carries the displayed value plus a flags byte.
     * 'legacy' = Arethusa 1.X.X/2.X.X stores internal rolls (≈30–130).
     */
    layout: 'v4' | 'v3' | 'legacy';
    identifications: Array<{
        kind: number;
        base: number | null;
        value: number | null;
        flags?: number;
        meter?: number;
        perfect?: number;
        preid: boolean;
    }>;
}

export interface PowderDataBlock {
    id: DataBlockId.PowderData;
    name: 'PowderData';
    powderSlots: number;
    powders: Array<{ element: number; tier: number }>;
    /** Arethusa 4.X.X only: powder special id (0 = none) and its tier. */
    specialId?: number;
    specialTier?: number;
}

export interface ShinyDataBlock {
    id: DataBlockId.ShinyData;
    name: 'ShinyData';
    shinyId: number;     // tracker stat ID
    rerollCount?: number; // number of shiny rerolls
    val: number;         // tracker count
}

export interface CustomGearTypeBlock {
    id: DataBlockId.CustomGearType;
    name: 'CustomGearType';
    gearType: number;
}

export interface DurabilityDataBlock {
    id: DataBlockId.DurabilityData;
    name: 'DurabilityData';
    maxDurability: number;
    currentDurability: number;
    effectStrength?: number;
}

export interface RequirementsDataBlock {
    id: DataBlockId.RequirementsData;
    name: 'RequirementsData';
    level: number;
    classId: number;
    skillRequirements: Array<{ skillId: number; requirement: number }>;
}

export interface DamageDataBlock {
    id: DataBlockId.DamageData;
    name: 'DamageData';
    attackSpeedId: number;
    dps?: number; // v3 only
    damages: Array<{ damageTypeId: number; min: number; max: number }>;
}

export interface DefenseDataBlock {
    id: DataBlockId.DefenseData;
    name: 'DefenseData';
    health: number;
    defenses: Array<{ elementId: number; value: number }>;
}

export interface CustomIdentificationDataBlock {
    id: DataBlockId.CustomIdentificationData;
    name: 'CustomIdentificationData';
    identifications: Array<{ statId: number; value: number; flags?: number; meter?: number; perfect?: number }>;
}

export interface CustomConsumableTypeBlock {
    id: DataBlockId.CustomConsumableTypeData;
    name: 'CustomConsumableTypeData';
    consumableType: number;
}

export interface UsesDataBlock {
    id: DataBlockId.UsesData;
    name: 'UsesData';
    currentUses: number;
    maxUses: number;
}

export interface EffectsDataBlock {
    id: DataBlockId.EffectsData;
    name: 'EffectsData';
    effects: Array<{ effectId: number; value: number }>;
}

export interface MountTypeDataBlock {
    id: DataBlockId.MountTypeData;
    name: 'MountTypeData';
    mountType: number;
}

export interface MountPotentialDataBlock {
    id: DataBlockId.MountPotentialData;
    name: 'MountPotentialData';
    potential: number;
}

export interface MountColorDataBlock {
    id: DataBlockId.MountColorData;
    name: 'MountColorData';
    primaryColorId: number;
    secondaryColorId: number;
}

export interface MountEnergyDataBlock {
    id: DataBlockId.MountEnergyData;
    name: 'MountEnergyData';
    currentEnergy: number;
    maxEnergy: number;
}

export interface MountStatsDataBlock {
    id: DataBlockId.MountStatsData;
    name: 'MountStatsData';
    stats: Array<{ statId: number; current: number; max: number }>;
}

export interface MountStatsMaxDataBlock {
    id: DataBlockId.MountStatsMaxData;
    name: 'MountStatsMaxData';
    estimatedMaxStats: number;
    stats: Array<{ statId: number; max: number }>;
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
    | CustomGearTypeBlock
    | DurabilityDataBlock
    | RequirementsDataBlock
    | DamageDataBlock
    | DefenseDataBlock
    | CustomIdentificationDataBlock
    | CustomConsumableTypeBlock
    | UsesDataBlock
    | EffectsDataBlock
    | MountTypeDataBlock
    | MountPotentialDataBlock
    | MountColorDataBlock
    | MountEnergyDataBlock
    | MountStatsDataBlock
    | MountStatsMaxDataBlock
    | EndDataBlock;

/**
 * Parse an IdentificationData block (id 3) in one of the three layouts:
 * - v4 (Arethusa 4.X.X, version byte 0x03): value varint + meter byte + perfect byte.
 * - v3 (Arethusa 3.X.X, version byte 0x02): value varint + flags byte + optional meter byte.
 * - legacy (Arethusa 1.X.X/2.X.X): a single roll byte per entry.
 *
 * Wynntils PR #4265 made the value layout the default, but strings with a
 * lower version byte can still carry it, so callers try v3 first and fall back
 * to legacy. Version byte 0x03 always uses v4.
 */
function readIdentificationEntries(
    bytes: number[],
    start: number,
    layout: 'v4' | 'v3' | 'legacy'
): { end: number; extended: boolean; entries: IdentificationDataBlock['identifications'] } {
    let i = start;
    const next = (): number => {
        if (i >= bytes.length) throw new DecodeFailure('truncated', 'Unexpected end of bytes');
        return bytes[i++];
    };
    const identCount = next();
    const extended = next() === 1;
    const preidCount = extended ? next() : 0;
    const total = identCount + preidCount;
    const entries: IdentificationDataBlock['identifications'] = [];
    for (let idx = 0; idx < total; idx++) {
        const kind = next();
        const base = extended ? decodeVarint(next) : null;
        const isPre = idx < preidCount;
        if (isPre) {
            entries.push({ kind, base, value: null, preid: true });
            continue;
        }
        if (layout === 'legacy') {
            const value = next();
            entries.push({ kind, base, value, preid: false });
        } else {
            const value = decodeVarint(next);
            if (layout === 'v4') {
                // meter: 0x00–0x24 roll stages, 0xFF = no meter; perfect: 0x01 = perfect roll
                const meter = next();
                const perfect = next();
                entries.push({ kind, base, value, meter, perfect, preid: false });
            } else {
                const flags = next();
                // bit0 PERFECT_INTERNAL_ROLL, bit1 ICON_PREFIX, bit2 VANILLA_METER
                const meter = (flags & 4) !== 0 ? next() : undefined;
                entries.push({ kind, base, value, flags, meter, preid: false });
            }
        }
    }
    return { end: i, extended, entries };
}

/** A parsed identification block is only valid if the next byte starts a block. */
function assertBlockBoundary(bytes: number[], end: number, blockName: string) {
    if (end < bytes.length && !isValidBlockId(bytes[end])) {
        throw new DecodeFailure('invalid-block', `${blockName} parse desync at byte ${end}`, end);
    }
}

function isValidBlockId(id: number): boolean {
    return id === 255 || (id >= 1 && id <= 21);
}

/**
 * Walk the byte stream and decode into Block[]
 * @param bytes - array of bytes from decodeString()
 */
export function decodeBlocks(bytes: number[]): Block[] {
    let i = 0;
    let version = -1;
    const blocks: Block[] = [];
    const decodedBlocks: string[] = [];
    const addBlock = (block: Block) => {
        blocks.push(block);
        decodedBlocks.push(block.name);
    };
    const next = (): number => {
        if (i >= bytes.length) throw new DecodeFailure('truncated', 'Unexpected end of bytes');
        return bytes[i++];
    };

    try {
        // --- StartData (id=0) & version
        const startId = next();
        if (startId !== DataBlockId.StartData) {
            throw new DecodeFailure('invalid-start', 'No start block');
        }
        version = next();
        if (version > 3) {
            throw new DecodeFailure(
                'unsupported-version',
                `Unsupported encoding version byte 0x${version.toString(16).padStart(2, '0')}`,
            );
        }
        addBlock({ id: DataBlockId.StartData, name: 'StartData', version });

        // --- Main loop until EndData
        while (true) {
            const id = next();
            if (id === DataBlockId.EndData) {
                addBlock({ id: DataBlockId.EndData, name: 'EndData' });
                break;
            }
            switch (id) {
            case DataBlockId.TypeData: {
                const itemType = next();
                addBlock({ id: DataBlockId.TypeData, name: 'TypeData', itemType });
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
                addBlock({ id: DataBlockId.NameData, name: 'NameData', nameStr });
                break;
            }

            case DataBlockId.RerollData: {
                const rerollCount = next();
                addBlock({ id: DataBlockId.RerollData, name: 'RerollData', rerollCount });
                break;
            }

            case DataBlockId.IdentificationData: {
                const startIdx = i;
                let layout: IdentificationDataBlock['layout'];
                let parsed: { end: number; extended: boolean; entries: IdentificationDataBlock['identifications'] };
                if (version >= 3) {
                    // Arethusa 4.X.X always writes meter + perfect bytes instead of flags,
                    // so there is no ambiguity to fall back from.
                    layout = 'v4';
                    parsed = readIdentificationEntries(bytes, startIdx, 'v4');
                    assertBlockBoundary(bytes, parsed.end, 'v4 identification');
                } else {
                    layout = 'v3';
                    try {
                        parsed = readIdentificationEntries(bytes, startIdx, 'v3');
                        // Sanity: the byte right after the block must be a valid next block id,
                        // otherwise the v3 parse desynced and we fall back to the legacy layout.
                        assertBlockBoundary(bytes, parsed.end, 'v3 identification');
                    } catch {
                        layout = 'legacy';
                        parsed = readIdentificationEntries(bytes, startIdx, 'legacy');
                        // An unvalidated fallback can land mid-stream and fail later with a
                        // confusing "Unhandled block id" instead of an invalid-string error.
                        assertBlockBoundary(bytes, parsed.end, 'legacy identification');
                    }
                }
                i = parsed.end;
                addBlock({
                    id: DataBlockId.IdentificationData,
                    name: 'IdentificationData',
                    extended: parsed.extended,
                    layout,
                    identifications: parsed.entries,
                });
                break;
            }

            case DataBlockId.PowderData: {
                const powderSlots = next();
                const powderCount = next();
                // Arethusa 4.X.X packs element × 7 + tier (1–7) into 6 bits so tier VII
                // fits, and always ends the block with a special id (plus tier when set).
                const bitsPerPowder = version >= 3 ? 6 : 5;
                const bits = powderCount * bitsPerPowder;
                const totalBytes = Math.ceil(bits / 8);
                if (i + totalBytes > bytes.length)
                    throw new DecodeFailure('truncated', 'Unexpected end of bytes');
                const raw = bytes.slice(i, i + totalBytes);
                i += totalBytes;
                const powders: PowderDataBlock['powders'] = [];
                for (let p = 0; p < powderCount; p++) {
                    let val = 0;
                    for (let b = 0; b < bitsPerPowder; b++) {
                        const bitIdx = p * bitsPerPowder + b;
                        const byteVal = raw[Math.floor(bitIdx / 8)];
                        const bit = (byteVal >> (7 - (bitIdx % 8))) & 1;
                        val = (val << 1) | bit;
                    }
                    if (val === 0) continue;
                    if (bitsPerPowder === 6) {
                        const element = Math.floor((val - 1) / 7);
                        const tier = ((val - 1) % 7) + 1;
                        powders.push({ element, tier });
                    } else {
                        const element = Math.floor(val / 6);
                        const tier = val % 6 === 0 ? 6 : val % 6;
                        powders.push({ element, tier });
                    }
                }
                const specialId = version >= 3 ? next() : undefined;
                const specialTier = specialId ? next() : undefined;
                addBlock({
                    id: DataBlockId.PowderData,
                    name: 'PowderData',
                    powderSlots,
                    powders,
                    ...(specialId !== undefined ? { specialId, specialTier } : {}),
                });
                break;
            }

            case DataBlockId.ShinyData: {
                const shinyId = next();

                if (version === 0) {
                    // Legacy: [statId, varint(val)]
                    const val = decodeVarint(next);
                    addBlock({ id, name: 'ShinyData', shinyId, val });
                } else {
                    // v1+: [statId, rerollCount, varint(val)]
                    const rerollCount = next();
                    const val = decodeVarint(next);
                    addBlock({ id, name: 'ShinyData', shinyId, val, rerollCount });
                }
                break;
            }

            case DataBlockId.CustomGearType: {
                const gearType = next();
                addBlock({ id, name: 'CustomGearType', gearType });
                break;
            }

            case DataBlockId.DurabilityData: {
                if (version < 2) {
                    // Arethusa 1.X.X/2.X.X: [effectStrength byte, max varint, current varint]
                    const effectStrength = next();
                    const maxDurability = decodeVarint(next);
                    const currentDurability = decodeVarint(next);
                    addBlock({ id, name: 'DurabilityData', effectStrength, maxDurability, currentDurability });
                } else {
                    // Arethusa 3.X.X+: [max varint, current varint] (effectStrength dropped, fixed at 100)
                    const maxDurability = decodeVarint(next);
                    const currentDurability = decodeVarint(next);
                    addBlock({ id, name: 'DurabilityData', maxDurability, currentDurability });
                }
                break;
            }

            case DataBlockId.RequirementsData: {
                const level = next();
                const classId = next();
                const skillCount = next();
                const skillRequirements: RequirementsDataBlock['skillRequirements'] = [];
                for (let s = 0; s < skillCount; s++) {
                    const skillId = next();
                    const requirement = decodeVarint(next);
                    skillRequirements.push({ skillId, requirement });
                }
                addBlock({ id, name: 'RequirementsData', level, classId, skillRequirements });
                break;
            }

            case DataBlockId.DamageData: {
                let dps: number | undefined;
                if (version >= 2) {
                    // Arethusa 3.X.X+ prepends a DPS varint before the standard layout
                    dps = decodeVarint(next);
                }
                const attackSpeedId = next();
                const damageCount = next();
                const damages: DamageDataBlock['damages'] = [];
                for (let d = 0; d < damageCount; d++) {
                    const damageTypeId = next();
                    const min = decodeVarint(next);
                    const max = decodeVarint(next);
                    damages.push({ damageTypeId, min, max });
                }
                addBlock({ id, name: 'DamageData', attackSpeedId, ...(dps !== undefined ? { dps } : {}), damages });
                break;
            }

            case DataBlockId.DefenseData: {
                const health = decodeVarint(next);
                const defenseCount = next();
                const defenses: DefenseDataBlock['defenses'] = [];
                for (let d = 0; d < defenseCount; d++) {
                    const elementId = next();
                    const value = decodeVarint(next);
                    defenses.push({ elementId, value });
                }
                addBlock({ id, name: 'DefenseData', health, defenses });
                break;
            }

            case DataBlockId.CustomIdentificationData: {
                const count = next();
                const idents: CustomIdentificationDataBlock['identifications'] = [];
                for (let k = 0; k < count; k++) {
                    const statId = next();
                    if (version >= 3) {
                        // Arethusa 4.X.X: [statId byte, value varint, meter byte, perfect byte]
                        const value = decodeVarint(next);
                        const meter = next();
                        const perfect = next();
                        idents.push({ statId, value, meter, perfect });
                    } else if (version >= 2) {
                        // Arethusa 3.X.X: [statId byte, value varint, flags byte, optional meter byte]
                        const value = decodeVarint(next);
                        const flags = next();
                        const meter = (flags & 4) !== 0 ? next() : undefined;
                        idents.push({ statId, value, flags, meter });
                    } else {
                        // Arethusa 1.X.X/2.X.X stores only the maximum value.
                        const value = decodeVarint(next);
                        idents.push({ statId, value });
                    }
                }
                addBlock({ id, name: 'CustomIdentificationData', identifications: idents });
                break;
            }

            case DataBlockId.CustomConsumableTypeData: {
                const consumableType = next();
                addBlock({ id, name: 'CustomConsumableTypeData', consumableType });
                break;
            }

            case DataBlockId.UsesData: {
                const currentUses = next();
                const maxUses = next();
                addBlock({ id, name: 'UsesData', currentUses, maxUses });
                break;
            }

            case DataBlockId.EffectsData: {
                const effectCount = next();
                const effects: EffectsDataBlock['effects'] = [];
                for (let e = 0; e < effectCount; e++) {
                    const effectId = next();
                    const value = decodeVarint(next);
                    effects.push({ effectId, value });
                }
                addBlock({ id, name: 'EffectsData', effects });
                break;
            }

            case DataBlockId.MountTypeData: {
                const mountType = next();
                addBlock({ id, name: 'MountTypeData', mountType });
                break;
            }

            case DataBlockId.MountPotentialData: {
                const potential = decodeVarint(next);
                addBlock({ id, name: 'MountPotentialData', potential });
                break;
            }

            case DataBlockId.MountColorData: {
                const primaryColorId = next();
                const secondaryColorId = next();
                addBlock({ id, name: 'MountColorData', primaryColorId, secondaryColorId });
                break;
            }

            case DataBlockId.MountEnergyData: {
                const currentEnergy = decodeVarint(next);
                const maxEnergy = decodeVarint(next);
                addBlock({ id, name: 'MountEnergyData', currentEnergy, maxEnergy });
                break;
            }

            case DataBlockId.MountStatsData: {
                const statCount = next();
                const stats: MountStatsDataBlock['stats'] = [];
                for (let s = 0; s < statCount; s++) {
                    const statId = next();
                    const current = decodeVarint(next);
                    const max = decodeVarint(next);
                    stats.push({ statId, current, max });
                }
                addBlock({ id, name: 'MountStatsData', stats });
                break;
            }

            case DataBlockId.MountStatsMaxData: {
                const estimatedMaxStats = next();
                const statCount = next();
                const stats: MountStatsMaxDataBlock['stats'] = [];
                for (let s = 0; s < statCount; s++) {
                    const statId = next();
                    const max = decodeVarint(next);
                    stats.push({ statId, max });
                }
                addBlock({ id, name: 'MountStatsMaxData', estimatedMaxStats, stats });
                break;
            }

            default:
                throw new DecodeFailure('unsupported-block', `Unsupported block id: ${id}`, i - 1);
            }
        }
        return blocks;
    } catch (err) {
        throw new ItemDecodeError({
            code: err instanceof DecodeFailure ? err.code : 'invalid-block',
            reason: err instanceof Error ? err.message : String(err),
            version: version >= 0 ? version : undefined,
            versionName: version >= 0 ? arethusaVersionName(version) : undefined,
            offset: err instanceof DecodeFailure && err.offset !== undefined ? err.offset : i,
            byteLength: bytes.length,
            decodedBlocks,
        });
    }
}

/**
 * High-level: string -> Block[]
 */
export function parseIdString(idstr: string): Block[] {
    let bytes: number[];
    try {
        bytes = decodeString(idstr);
    } catch (err) {
        throw new ItemDecodeError({
            code: 'invalid-characters',
            reason: err instanceof Error ? err.message : String(err),
            offset: 0,
            byteLength: 0,
            decodedBlocks: [],
        });
    }
    return decodeBlocks(bytes);
}
