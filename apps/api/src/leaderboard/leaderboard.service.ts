import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GuildOnlineCount } from '@shared/schemas/online-count.schema';
import { Model, Document } from 'mongoose';
import { GuildService } from '../guild/guild.service';

@Injectable()
export class LeaderboardService {
    constructor(
        @InjectModel('guild_online_count') private readonly onlineCountModel: Model<GuildOnlineCount>,
        @InjectModel('guild_data') private readonly guildDataModel: Model<Document>,
        private readonly guildService: GuildService,
    ) { }

    async getGuildAverageOnlineLeaderboard() {
        // Single aggregation pipeline: group -> sort -> limit -> lookup guild_data -> project
        const pipeline: any[] = [
            {
                $group: {
                    _id: '$guild_uuid',
                    guild_name: { $first: '$guild_name' },
                    avg_online: { $avg: '$count' }
                }
            },
            { $sort: { avg_online: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: 'guild_data',
                    localField: '_id',
                    foreignField: 'uuid',
                    as: 'guild'
                }
            },
            { $unwind: { path: '$guild', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    uuid: '$_id',
                    guild_name: 1,
                    averageOnline: '$avg_online',
                    'guild.uuid': 1,
                    'guild.name': 1,
                    'guild.prefix': 1,
                    // 'guild.level': 1,
                    // 'guild.xp': 1,
                    'guild.created': 1,
                    'guild.banner': 1,
                }
            }
        ];

        const aggResults = await this.onlineCountModel.aggregate(pipeline as any).exec();

        if (!aggResults || aggResults.length === 0) return {};

        const result: Record<string, any> = {};
        aggResults.forEach((entry: any, idx: number) => {
            const rank = idx + 1;
            const guild = entry.guild || {};
            result[String(rank)] = {
                uuid: entry.uuid || entry._id,
                name: guild.name || entry.guild_name || null,
                prefix: guild.prefix || null,
                // level: guild.level || null,
                // xp: guild.xp || null,
                averageOnline: Math.round((entry.averageOnline ?? entry.avg_online) * 100) / 100,
                created: guild.created || null,
                banner: guild.banner || null,
            };
        });

        return result;
    }

    /**
     * Returns ranking for a given season number. If seasonArg === 'current', resolve via GuildService.getCurrentSeason().
     * Returns object: { season: number, ranking: [ { rank, guild_uuid, guild_name, rating } ] }
     */
    async getSeasonRating(seasonArg: string, full = false): Promise<{ season: number; ranking: any[] }> {
        let seasonNum: number;

        if (seasonArg === 'current') {
            const cs = await this.guildService.getCurrentSeason();
            if (cs === null) throw new Error('Current season not found');
            seasonNum = cs;
        } else {
            seasonNum = parseInt(seasonArg, 10);
            if (isNaN(seasonNum)) throw new Error('Invalid season');
        }

        const seasonKey = seasonNum.toString();

        const pipeline = [
            { $match: { [`seasonRanks.${seasonKey}.rating`]: { $exists: true } } },
            { $project: { uuid: '$uuid', name: '$name', rating: `$seasonRanks.${seasonKey}.rating` } },
            { $sort: { rating: -1 } },
        ];

        // Note: using $project with dynamic field via string interpolation requires $getField in newer Mongo, but the $project above with template will work in aggregation with $literal substitution not available here.
        // Safer approach: convert seasonRanks to array and filter on key.
        const altPipeline: any[] = [
            { $project: { uuid: 1, name: 1, seasons: { $objectToArray: '$seasonRanks' } } },
            { $unwind: '$seasons' },
            { $match: { 'seasons.k': seasonKey } },
            { $project: { uuid: 1, name: 1, rating: '$seasons.v.rating' } },
            { $sort: { rating: -1 } },
        ];

        if (!full) {
            altPipeline.push({ $limit: 100 });
        }

        const results = await this.guildDataModel.aggregate(altPipeline as any).exec();

        return {
            season: seasonNum,
            ranking: results.map((entry, idx) => ({
                rank: idx + 1,
                guild_uuid: entry.uuid,
                guild_name: entry.name,
                rating: entry.rating,
            })),
        };
    }
}
