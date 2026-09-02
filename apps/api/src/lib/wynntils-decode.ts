
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
    /** v3 stores actual identification values; legacy stores internal rolls (≈30–130). */
    layout: 'v3' | 'legacy';
    identifications: Array<{
        kind: number;
        base: number | null;
        value: number | null;
        flags?: number;
        meter?: number;
        preid: boolean;
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
    identifications: Array<{ statId: number; value: number; flags?: number; meter?: number }>;
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
 * Parse an IdentificationData block (id 3) in either the new v3 layout
 * (value varint + flags byte + optional meter byte) or the legacy layout
 * (roll byte). @Wynntils PR #4265 made v3 the default, but strings with a
 * version byte < 3 can still carry v3 identification data, so callers must
 * try v3 first and fall back to legacy.
 */
function readIdentificationEntries(
    bytes: number[],
    start: number,
    layout: 'v3' | 'legacy'
): { end: number; extended: boolean; entries: IdentificationDataBlock['identifications'] } {
    let i = start;
    const next = (): number => {
        if (i >= bytes.length) throw new Error('Unexpected end of bytes');
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
        if (layout === 'v3') {
            const value = decodeVarint(next);
            const flags = next();
            // bit0 PERFECT_INTERNAL_ROLL, bit1 ICON_PREFIX, bit2 VANILLA_METER
            const meter = (flags & 4) !== 0 ? next() : undefined;
            entries.push({ kind, base, value, flags, meter, preid: false });
        } else {
            const value = next();
            entries.push({ kind, base, value, preid: false });
        }
    }
    return { end: i, extended, entries };
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
                const startIdx = i;
                let layout: 'v3' | 'legacy' = 'v3';
                let parsed: { end: number; extended: boolean; entries: IdentificationDataBlock['identifications'] };
                try {
                    parsed = readIdentificationEntries(bytes, startIdx, 'v3');
                    // Sanity: the byte right after the block must be a valid next block id,
                    // otherwise the v3 parse desynced and we fall back to the legacy layout.
                    if (parsed.end < bytes.length && !isValidBlockId(bytes[parsed.end])) {
                        throw new Error('v3 identification parse desync');
                    }
                } catch {
                    parsed = readIdentificationEntries(bytes, startIdx, 'legacy');
                    layout = 'legacy';
                }
                i = parsed.end;
                blocks.push({
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
                const shinyId = next();

                if (version === 0) {
                    // Legacy: [statId, varint(val)]
                    const val = decodeVarint(next);
                    blocks.push({ id, name: 'ShinyData', shinyId, val });
                } else {
                    // v1+: [statId, rerollCount, varint(val)]
                    const rerollCount = next();
                    const val = decodeVarint(next);
                    blocks.push({ id, name: 'ShinyData', shinyId, val, rerollCount });
                }
                break;
            }

            case DataBlockId.CustomGearType: {
                const gearType = next();
                blocks.push({ id, name: 'CustomGearType', gearType });
                break;
            }

            case DataBlockId.DurabilityData: {
                if (version < 3) {
                    // v1/v2: [effectStrength byte, max varint, current varint]
                    const effectStrength = next();
                    const maxDurability = decodeVarint(next);
                    const currentDurability = decodeVarint(next);
                    blocks.push({ id, name: 'DurabilityData', effectStrength, maxDurability, currentDurability });
                } else {
                    // v3: [max varint, current varint] (effectStrength dropped, fixed at 100)
                    const maxDurability = decodeVarint(next);
                    const currentDurability = decodeVarint(next);
                    blocks.push({ id, name: 'DurabilityData', maxDurability, currentDurability });
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
                blocks.push({ id, name: 'RequirementsData', level, classId, skillRequirements });
                break;
            }

            case DataBlockId.DamageData: {
                let dps: number | undefined;
                if (version >= 3) {
                    // v3 prepends a DPS varint before the standard layout
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
                blocks.push({ id, name: 'DamageData', attackSpeedId, ...(dps !== undefined ? { dps } : {}), damages });
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
                blocks.push({ id, name: 'DefenseData', health, defenses });
                break;
            }

            case DataBlockId.CustomIdentificationData: {
                const count = next();
                const idents: CustomIdentificationDataBlock['identifications'] = [];
                for (let k = 0; k < count; k++) {
                    const statId = next();
                    if (version >= 3) {
                        // v3: [statId byte, value varint, flags byte, optional meter byte]
                        const value = decodeVarint(next);
                        const flags = next();
                        const meter = (flags & 4) !== 0 ? next() : undefined;
                        idents.push({ statId, value, flags, meter });
                    } else {
                        const value = decodeVarint(next);
                        idents.push({ statId, value });
                    }
                }
                blocks.push({ id, name: 'CustomIdentificationData', identifications: idents });
                break;
            }

            case DataBlockId.CustomConsumableTypeData: {
                const consumableType = next();
                blocks.push({ id, name: 'CustomConsumableTypeData', consumableType });
                break;
            }

            case DataBlockId.UsesData: {
                const currentUses = next();
                const maxUses = next();
                blocks.push({ id, name: 'UsesData', currentUses, maxUses });
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
                blocks.push({ id, name: 'EffectsData', effects });
                break;
            }

            case DataBlockId.MountTypeData: {
                const mountType = next();
                blocks.push({ id, name: 'MountTypeData', mountType });
                break;
            }

            case DataBlockId.MountPotentialData: {
                const potential = decodeVarint(next);
                blocks.push({ id, name: 'MountPotentialData', potential });
                break;
            }

            case DataBlockId.MountColorData: {
                const primaryColorId = next();
                const secondaryColorId = next();
                blocks.push({ id, name: 'MountColorData', primaryColorId, secondaryColorId });
                break;
            }

            case DataBlockId.MountEnergyData: {
                const currentEnergy = decodeVarint(next);
                const maxEnergy = decodeVarint(next);
                blocks.push({ id, name: 'MountEnergyData', currentEnergy, maxEnergy });
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
                blocks.push({ id, name: 'MountStatsData', stats });
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
                blocks.push({ id, name: 'MountStatsMaxData', estimatedMaxStats, stats });
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
