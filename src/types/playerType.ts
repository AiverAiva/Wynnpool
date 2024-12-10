import { Code, Star } from 'lucide-react';
import { createElement } from 'react';

export const cutePlayers = [
    {
        uuid: 'cd2f08fb-eede-4b88-b1c1-6f3e46007171',
        name: 'AiverAiva',
        emoji: '🐢',
        quote: 'i cutes veri mucc',
        icon: createElement(Code, { className: 'w-4 h-4 text-muted-foreground' })
    }
];

export function getPlayerDisplayName(name: string): string {
    const player = cutePlayers.find(player => player.name === name);
    return player ? `${name} ${player.emoji}` : name;
}

export interface Player {
    username: string;
    online: boolean;
    server: string;
    activeCharacter: string | null;
    uuid: string;
    rank: string;
    rankBadge: string; // URL path to the badge SVG in the Wynncraft CDN
    legacyRankColour: {
        main: string;
        sub: string;
    };
    shortenedRank: string;
    supportRank: string;
    veteran: boolean;
    firstJoin: string;
    lastJoin: string;
    playtime: number;
    guild: {
        name: string;
        prefix: string;
        rank: string;
        rankStars: string;
    };
    globalData: {
        wars: number;
        totalLevel: number;
        killedMobs: number;
        chestsFound: number;
        dungeons: {
            total: number;
            list: Record<string, number>; // Key: Dungeon Name, Value: Number of completions
        };
        raids: {
            total: number;
            list: Record<string, number>; // Key: Raid Name, Value: Number of completions
        };
        completedQuests: number;
        pvp: {
            kills: number;
            deaths: number;
        };
    };
    forumLink: number | null;
    ranking: Record<string, number>; // Key: Ranking Type, Value: Rank
    previousRanking: Record<string, number>; // Key: Ranking Type, Value: Previous Rank
    publicProfile: boolean;
    characters: Record<
        string,
        {
            type: string;
            nickname: string;
            level: number;
            xp: number;
            xpPercent: number;
            totalLevel: number;
            wars: number;
            playtime: number;
            mobsKilled: number;
            chestsFound: number;
            blocksWalked: number;
            itemsIdentified: number;
            logins: number;
            deaths: number;
            discoveries: number;
            pvp: {
                kills: number;
                deaths: number;
            };
            gamemode: string[]; // e.g., ["hunted", "hardcore"]
            skillPoints: {
                strength: number;
                dexterity: number;
                intelligence: number;
                defence: number;
                agility: number;
            };
            professions: Record<
                string,
                {
                    level: number;
                    xpPercent: number;
                }
            >;
            dungeons: {
                total: number;
                list: Record<string, number>; // Key: Dungeon Name, Value: Number of completions
            };
            raids: {
                total: number;
                list: Record<string, number>; // Key: Raid Name, Value: Number of completions
            };
            quests: string[]; // List of completed quest names
        }
    >;
}
