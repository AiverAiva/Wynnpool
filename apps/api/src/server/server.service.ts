import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type Redis from 'ioredis';

interface WynnServerSnapshot {
    server?: string;
    online?: boolean;
    playerCount?: number;
    players?: string[];
    firstSeen?: number;
    offlineSince?: number;
}

@Injectable()
export class ServerService {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    async getStatus() {
        try {
            const serverNames: string[] = await this.redis.smembers('wynnpool:servers');

            const nowTs = Math.floor(Date.now() / 1000);
            const result: Record<string, any> = {
                totalPlayer: 0,
            };

            if (serverNames.length === 0) {
                return result;
            }

            const keys = serverNames.map(
                (name) => `wynnpool:server:${name}:data`,
            );

            const rawValues = await this.redis.mget(...keys);

            let totalPlayer = 0;

            result['servers'] = {};
            rawValues.forEach((raw, idx) => {
                if (!raw) return;

                let data: WynnServerSnapshot;
                try {
                    data = JSON.parse(raw);
                } catch {
                    // bad JSON, ignore this entry
                    return;
                }

                const serverName = serverNames[idx];

                const online = !!data.online;
                const players = Array.isArray(data.players) ? data.players : [];
                const playerCount =
                    typeof data.playerCount === 'number'
                        ? data.playerCount
                        : players.length;

                totalPlayer += playerCount;

                const firstSeen =
                    typeof data.firstSeen === 'number' ? data.firstSeen : nowTs;

                const offlineSince =
                    typeof data.offlineSince === 'number'
                        ? data.offlineSince
                        : undefined;

                const lastSeen = online
                    ? nowTs
                    : offlineSince ?? firstSeen;

                const uptime = Math.max(0, nowTs - firstSeen);

                result['servers'][serverName] = {
                    online,
                    firstSeen,      // unix timestamp
                    lastSeen,      // unix timestamp
                    uptime,        // seconds since launchAt
                    playerCount,
                    players,
                };
            });

            result.totalPlayer = totalPlayer;
            return result;
        } catch (e) {
            console.error('Error in getStatus:', e);
            throw new InternalServerErrorException('Failed to fetch server status');
        }
    }
}
