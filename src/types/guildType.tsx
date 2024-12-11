type GuildEventBase = {
    _id: string;
    timestamp: number; // Unix timestamp for the event
    event: 'join' | 'leave' | 'rank_change'; // Discriminated union for event type
    uuid: string;
    name: string; // Name of the player involved in the event
    guild_uuid: string; // Unique identifier for the guild
    guild_name: string; // Name of the guild
}

type GuildEventJoin = GuildEventBase & {
    event: 'join'; // Discriminates this type as a "join" event
}

type GuildEventLeave = GuildEventBase & {
    event: 'leave'; // Discriminates this type as a "leave" event
    rank: string; // Rank of the player at the time of leaving
}

type GuildEventRankChange = GuildEventBase & {
    event: 'rank_change'; // Discriminates this type as a "rank_change" event
    old_rank: string; // Old rank before the change
    new_rank: string; // New rank after the change
}

export type GuildEvent = GuildEventJoin | GuildEventLeave | GuildEventRankChange;
