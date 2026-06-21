export type WorldEventDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type WorldEventLength = 'SHORT' | 'MEDIUM' | 'LONG';

export interface MapCoordinate3D {
    x: number;
    y: number;
    z: number;
}

export interface WorldEventRequirement {
    type: string; // e.g. "COMBAT_LEVEL", "GLOBAL_QUEST"
    value: number | string;
}

export interface WorldEventLocation {
    event: MapCoordinate3D | null;
    spawn: MapCoordinate3D | null;
    reward: MapCoordinate3D | null;
    radius: number | null;
    spawnRadius: number | null;
}

export interface WorldEvent {
    name: string;
    internalName: string;
    lore: string;
    difficulty: WorldEventDifficulty | null;
    level: number | null;
    length: WorldEventLength | null;
    rewardPerLevel: Record<string, string[]> | null;
    requirements: WorldEventRequirement[] | null;
    location: WorldEventLocation[];
    schedule: string | null; // ISO 8601 timestamp or null
}

export interface WorldEventSchedule {
    internalName: string;
    schedule: string | null; // ISO 8601 timestamp or null
    polledAt: string; // ISO 8601 timestamp
}

export interface WorldEventChangelogEntry {
    internalName: string;
    eventName: string;
    changes: WorldEventChange[];
    changedAt: string; // ISO 8601 timestamp
}

export interface WorldEventChange {
    field: string;
    before: unknown;
    after: unknown;
}
