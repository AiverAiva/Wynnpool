import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface WynnServerSnapshot {
    server?: string;
    online?: boolean;
    playerCount?: number | string;
    players?: string[];
    firstSeen?: number | string;
    offlineSince?: number | string;
}

@Injectable()
export class ServerService {
    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) { }

    async getStatus() {
        try {
            const collection = this.connection.collection('wynncraft_servers');
            const docs = await collection.find({}).toArray() as Array<WynnServerSnapshot & Record<string, any>>;

            const nowTs = Math.floor(Date.now() / 1000);
            const result: Record<string, any> = {
                totalPlayer: 0,
            };

            if (!docs || docs.length === 0) {
                return result;
            }

            let totalPlayer = 0;
            result['servers'] = {};

            const toNumber = (v: any) => {
                if (typeof v === 'number') return v;
                if (typeof v === 'string') {
                    const n = parseInt(v, 10);
                    return Number.isNaN(n) ? undefined : n;
                }
                if (v && typeof v === 'object' && ('$numberLong' in v || '$date' in v)) {
                    if ('$numberLong' in v) return parseInt(v['$numberLong'] as string, 10);
                    if ('$date' in v) return Math.floor(new Date(v['$date']).getTime() / 1000);
                }
                return undefined;
            };

            docs.forEach((doc) => {
                if (!doc || !doc.server) return;

                const serverName = String(doc.server);
                const online = !!doc.online;
                const players = Array.isArray(doc.players) ? doc.players : [];

                const rawPlayerCount = doc.playerCount ?? players.length;
                const playerCountNum = typeof rawPlayerCount === 'number'
                    ? rawPlayerCount
                    : toNumber(rawPlayerCount) ?? players.length;

                totalPlayer += playerCountNum;

                const firstSeenNum = toNumber(doc.firstSeen) ?? nowTs;

                const offlineSinceNum = toNumber((doc as any).offlineSince);

                const lastSeen = online ? nowTs : (offlineSinceNum ?? firstSeenNum);

                const uptime = Math.max(0, nowTs - firstSeenNum);

                result['servers'][serverName] = {
                    online,
                    firstSeen: firstSeenNum,      // unix timestamp
                    lastSeen,      // unix timestamp
                    uptime,        // seconds since launchAt
                    playerCount: playerCountNum,
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
