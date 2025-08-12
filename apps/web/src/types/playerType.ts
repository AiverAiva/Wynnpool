import { LargeNumberLike } from 'crypto';
import { Code, CodeXml, Star, PiggyBank } from 'lucide-react';
import { createElement } from 'react';

export const cutePlayers = [
    {
        uuid: 'cd2f08fb-eede-4b88-b1c1-6f3e46007171',
        name: 'AiverAiva',
        emoji: '🐢',
        quote: 'i cutes veri mucc',
        icon: createElement(CodeXml, { className: 'w-4 h-4 text-muted-foreground' })  //developer
    },
    {
        uuid: 'f33dfcce-8e29-49b9-a528-93729f95fa39',
        name: 'Flufe',
        emoji: '🐉',
        quote: 'Dungeons are cool',
        icon: createElement(PiggyBank, { className: 'w-4 h-4 text-muted-foreground' })  //funder 
    }
];

export function getPlayerDisplayName(name: string): string {
    const player = cutePlayers.find(player => player.name === name);
    return player ? `${name} ${player.emoji}` : name;
}

interface GlobalData {
    wars: number;
    totalLevel: number;
    mobsKilled: number;
    chestsFound: number;
    dungeons: {
        total: number;
        list: Record<string, number>;
    };
    raids: {
        total: number;
        list: Record<string, number>;
    };
    completedQuests: number;
    pvp: {
        kills: number;
        deaths: number;
    };
    worldEvents: number;
    lootruns: number;
    caves: number;
}

interface CharacterData {
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

// interface OnlineData {
//     currentServer: string;
// }

/*
        mainAccess: MainAccess;
        //hides feature stats & global stats

        characterDataAccess: CharData;
        //when this is true, charaterBuildAccess doesnt exist and it hides the entire charater list

        characterBuildAccess: undefined,
        
        onlineStatus: OnlineStatus;
        //doesnt hide anything, but online: boolean is always false, and server: string changes normally
*/

export interface PlayerBase {
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
    guild: {
        name: string;
        prefix: string;
        rank: string;
        rankStars: string;
    };
    forumLink: number | null;
    ranking: Record<string, number>; // Key: Ranking Type, Value: Rank
    previousRanking: Record<string, number>; // Key: Ranking Type, Value: Previous Rank
    publicProfile: boolean;
    characters: Record<string, CharacterData> | null;
    restrictions: {
        mainAccess: boolean;
        characterDataAccess: boolean;
        characterBuildAccess: boolean;
        onlineStatus: boolean;
    }
    globalData: GlobalData | undefined; //this is not exist when mainAccess is true 
    playtime: number | undefined; //this doesnt exist when mainAccess is true
    firstJoin: string | undefined; //this doesnt exist when mainAccess is true
    lastJoin: string | undefined; //this doesnt exist when mainAccess is true
}

export interface mainAccess extends PlayerBase {
    restrictions: PlayerBase["restrictions"] & {
        mainAccess: false;
    };
    globalData: GlobalData; //this is not exist when mainAccess is true 
    playtime: number; //this doesnt exist when mainAccess is true
    firstJoin: string; //this doesnt exist when mainAccess is true
    lastJoin: string; //this doesnt exist when mainAccess is true
}

export interface characterDataAccess extends PlayerBase {
    restrictions: PlayerBase["restrictions"] & {
        characterDataAccess: false;
    };
    characters: Record<string, CharacterData>; //this is null when true
}

export type Player = mainAccess | characterDataAccess
// export type Player<
//     MainAccess extends boolean = boolean,
//     CharData extends boolean = boolean,
//     OnlineStatus extends boolean = boolean
// > = PlayerBase & {
//     restrictions: {
//         mainAccess: MainAccess;
//         //hides feature stats & global stats

//         characterDataAccess: CharData;
//         //when this is true, charaterBuildAccess doesnt exist and it hides the entire charater list

//         characterBuildAccess: undefined,

//         onlineStatus: OnlineStatus;
//         //doesnt hide anything, but online: boolean is always false, and server: string changes normally
//     };
// } & (MainAccess extends false ? { globalData: GlobalData } : { globalData?: undefined })
//     & (CharData extends false ? { characters: Record<string, CharacterData>; } : { characters: null })
// & (OnlineStatus extends false ? { onlineData: OnlineData } : { onlineData?: undefined });


export const QuestList: string[] = [
    "A Hunter's Calling",
    "Point of No Return",
    "A Journey Further",
    "A Journey Beyond",
    "The Olmic Rune",
    "Mini-Quest - Slay Dragonlings",
    "The Hero of Gavel",
    "Royal Trials",
    "Mini-Quest - Slay Angels",
    "The Breaking Point",
    "Mini-Quest - Slay Conures",
    "Recipe For Disaster",
    "Mini-Quest - Slay Creatures of the Void",
    "One Thousand Meters Under",
    "Mini-Quest - Slay Astrochelys Manis",
    "Dwarves and Doguns Part IV",
    "Mini-Quest - Slay Ifrits",
    "Dwarves and Doguns Part III",
    "The Feathers Fly Part II",
    "Mini-Quest - Slay Azers",
    "Dwarves and Doguns Part II",
    "Mini-Quest - Slay Frosted Guards & Cryostone Golems",
    "The Feathers Fly Part I",
    "Mini-Quest - Slay Magma Entities",
    "Dwarves and Doguns Part I",
    "Mini-Quest - Slay Pernix Monkeys",
    "Fantastic Voyage",
    "Enter the Dojo",
    "The Envoy Part II",
    "The Hidden City",
    "Mini-Quest - Slay Ailuropodas",
    "Beyond the Grave",
    "Mixed Feelings",
    "Cowfusion",
    "Desperate Metal",
    "The Canary Calls",
    "The Lost",
    "Mini-Quest - Slay Robots",
    "The Canyon Guides",
    "A Marauder's Dues",
    "Mini-Quest - Slay Jinkos",
    "The Envoy Part I",
    "The Thanos Depository",
    "From the Bottom",
    "General's Orders",
    "Mini-Quest - Slay Hobgoblins",
    "The Qira Hive",
    "???",
    "Fallen Delivery",
    "Realm of Light V - The Realm of Light",
    "Aldorei's Secret Part II",
    "Hunger of the Gerts Part II",
    "Mini-Quest - Slay Felrocs",
    "Hunger of the Gerts Part I",
    "Purple and Blue",
    "The Bigger Picture",
    "Flight in Distress",
    "The Ultimate Weapon",
    "Mini-Quest - Slay Weirds",
    "Acquiring Credentials",
    "Aldorei's Secret Part I",
    "Reincarnation",
    "Murder Mystery",
    "Hollow Serenity",
    "Troubled Tribesmen",
    "Mini-Quest - Slay Myconids",
    "Lexdale Witch Trials",
    "Forbidden Prison",
    "Realm of Light IV - Finding the Light",
    "WynnExcavation Site D",
    "Shattered Minds",
    "Mini-Quest - Slay Dead Villagers",
    "Haven Antiquity",
    "Grand Youth",
    "Lazarus Pit",
    "Temple of the Legends",
    "Memory Paranoia",
    "From the Mountains",
    "Lost Soles",
    "Mini-Quest - Slay Idols",
    "Lost Royalty",
    "Realm of Light III - A Headless History",
    "All Roads To Peace",
    "Out of my Mind",
    "Lost in the Jungle",
    "Realm of Light II - Taproot",
    "Redbeard's Booty",
    "Reclaiming the House",
    "Beneath the Depths",
    "Mini-Quest - Slay Wraiths & Phantasms",
    "The Order of the Grook",
    "An Iron Heart Part II",
    "The Passage",
    "Mini-Quest - Slay Lizardmen",
    "Zhight Island",
    "WynnExcavation Site C",
    "Realm of Light I - The Worm Holes",
    "The Shadow of the Beast",
    "Master Piece",
    "Death Whistle",
    "Crop Failure",
    "Corrupted Betrayal",
    "Jungle Fever",
    "The Maiden Tower",
    "A Grave Mistake",
    "Mini-Quest - Slay Slimes",
    "The House of Twain",
    "An Iron Heart Part I",
    "Rise of the Quartron",
    "Frost Bite",
    "WynnExcavation Site B",
    "Bob's Lost Soul",
    "Mini-Quest - Slay Orcs",
    "Blazing Retribution",
    "UndericeÀ",
    "Fate of the Fallen",
    "Star Thief",
    "Heart of Llevigar",
    "Ice Nations",
    "Tower of Ascension",
    "Mini-Quest - Slay Creatures of Nesaak Forest",
    "Clearing the Camps",
    "Pirate's Trove",
    "Wrath of the Mummy",
    "WynnExcavation Site A",
    "Tribal Aggression",
    "Mini-Quest - Slay Coyotes",
    "Canyon Condor",
    "Meaningful Holiday",
    "Kingdom of Sand",
    "A Sandy Scandal",
    "Green Gloop",
    "Mini-Quest - Slay Scarabs",
    "The Mercenary",
    "Misadventure on the Sea",
    "The Corrupted Village",
    "Deja Vu",
    "Tempo Town Trouble",
    "Recover the Past",
    "Mini-Quest - Slay Skeletons",
    "Creeper Infiltration",
    "Lost Tower",
    "Cluck Cluck",
    "Dwelling Walls",
    "The Dark Descent",
    "Pit of the Dead",
    "Grave Digger",
    "Lava Springs",
    "Supply and Delivery",
    "Mini-Quest - Slay Mooshrooms",
    "Arachnids' Ascent",
    "Stable Story",
    "Potion Making",
    "Elemental Exercise",
    "Maltic's Well",
    "Underwater",
    "Taking the Tower",
    "Tunnel Trouble",
    "Mushroom Man",
    "The Sewers of Ragni",
    "Mini-Quest - Slay Spiders",
    "Infested Plants",
    "Cook Assistant",
    "Poisoning the Pest",
    "King's Recruit",
    "Enzan's Brother",
    "Mini-Quest - Gather Copper",
    "Mini-Quest - Gather Birch Logs",
    "Mini-Quest - Gather Oak Logs",
    "Mini-Quest - Gather Sandstone",
    "Mini-Quest - Gather Acacia Logs",
    "Mini-Quest - Gather Gudgeon",
    "Mini-Quest - Gather Trout",
    "Mini-Quest - Gather Salmon II",
    "Mini-Quest - Gather Carp",
    "Mini-Quest - Gather Gold",
    "Mini-Quest - Gather Icefish",
    "Mini-Quest - Gather Silver",
    "Mini-Quest - Gather Hops",
    "Mini-Quest - Gather Spruce Logs",
    "Mini-Quest - Gather Iron II",
    "Mini-Quest - Gather Gold II",
    "Mini-Quest - Gather Malt II",
    "Mini-Quest - Gather Malt",
    "Mini-Quest - Gather Sandstone II",
    "Mini-Quest - Gather Acacia Logs II",
    "Mini-Quest - Gather Carp II",
    "Mini-Quest - Gather Oats II",
    "Mini-Quest - Gather Willow Logs II",
    "Mini-Quest - Gather Salmon",
    "Mini-Quest - Gather Willow Logs",
    "Mini-Quest - Gather Oats",
    "Mini-Quest - Gather Iron",
    "Mini-Quest - Gather Barley",
    "Mini-Quest - Gather Granite",
    "Mini-Quest - Gather Wheat",
    "Mini-Quest - Gather Spruce Logs II",
    "Mini-Quest - Gather Kanderstone",
    "Mini-Quest - Gather Cobalt II",
    "Mini-Quest - Gather Cobalt III",
    "Mini-Quest - Gather Silver II",
    "Mini-Quest - Gather Cobalt",
    "Mini-Quest - Gather Kanderstone II",
    "Mini-Quest - Gather Kanderstone III",
    "Mini-Quest - Gather Diamonds IV",
    "Mini-Quest - Gather Diamonds III",
    "Mini-Quest - Gather Diamonds",
    "Mini-Quest - Gather Diamonds II",
    "Mini-Quest - Gather Molten Ore",
    "Mini-Quest - Gather Molten Ore II",
    "Mini-Quest - Gather Molten Ore III",
    "Mini-Quest - Gather Molten Ore IV",
    "Mini-Quest - Gather Icefish II",
    "Mini-Quest - Gather Hops II",
    "Mini-Quest - Gather Jungle Logs",
    "Mini-Quest - Gather Jungle Logs II",
    "Mini-Quest - Gather Piranhas",
    "Mini-Quest - Gather Piranhas II",
    "Mini-Quest - Gather Rye",
    "Mini-Quest - Gather Rye II",
    "Mini-Quest - Gather Dark Logs",
    "Mini-Quest - Gather Dark Logs II",
    "Mini-Quest - Gather Dark Logs III",
    "Mini-Quest - Gather Koi III",
    "Mini-Quest - Gather Millet",
    "Mini-Quest - Gather Millet II",
    "Mini-Quest - Gather Millet III",
    "Mini-Quest - Gather Koi II",
    "Mini-Quest - Gather Koi",
    "Mini-Quest - Gather Light Logs",
    "Mini-Quest - Gather Light Logs II",
    "Mini-Quest - Gather Light Logs III",
    "Mini-Quest - Gather Decay Roots II",
    "Mini-Quest - Gather Decay Roots",
    "Mini-Quest - Gather Decay Roots III",
    "Mini-Quest - Gather Gylia Fish",
    "Mini-Quest - Gather Gylia Fish III",
    "Mini-Quest - Gather Gylia Fish II",
    "Mini-Quest - Gather Bamboo",
    "Mini-Quest - Gather Bass III",
    "Mini-Quest - Gather Bass II",
    "Mini-Quest - Gather Bass",
    "Mini-Quest - Gather Rice IV",
    "Mini-Quest - Gather Bass IV",
    "Mini-Quest - Gather Pine Logs III",
    "Mini-Quest - Gather Pine Logs II",
    "Mini-Quest - Gather Rice III",
    "Mini-Quest - Gather Pine Logs",
    "Mini-Quest - Gather Rice",
    "Mini-Quest - Gather Rice II",
    "Mini-Quest - Gather Molten Eel IV",
    "Mini-Quest - Gather Molten Eel III",
    "Mini-Quest - Gather Molten Eel II",
    "Mini-Quest - Gather Molten Eel",
    "Mini-Quest - Gather Avo Logs",
    "Mini-Quest - Gather Avo Logs II",
    "Mini-Quest - Gather Sorghum",
    "Mini-Quest - Gather Avo Logs III",
    "Mini-Quest - Gather Avo Logs IV",
    "Mini-Quest - Gather Sorghum II",
    "Mini-Quest - Gather Sorghum IV",
    "Mini-Quest - Gather Sorghum III"
]