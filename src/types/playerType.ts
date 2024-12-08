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
