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
        const leaderboard = await this.onlineCountModel.aggregate([
            {
                $group: {
                    _id: '$guild_uuid', // ✅ Group by guild UUID
                    guild_name: { $first: '$guild_name' }, // ✅ Keep the first guild name
                    avg_online: { $avg: '$count' } // ✅ Calculate the average online count
                }
            },
            { $sort: { avg_online: -1 } }, // ✅ Sort in descending order (highest avg first)
            { $limit: 100 } // ✅ Optional: Limit to top 100 for efficiency
        ]).exec();

        return leaderboard.map((entry, index) => ({
            rank: index + 1, // ✅ Add rank number
            guild_uuid: entry._id,
            guild_name: entry.guild_name,
            avg_online: entry.avg_online
        }));
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
