import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GuildOnlineCount } from '@shared/schemas/online-count.schema';
import { Model } from 'mongoose';

@Injectable()
export class LeaderboardService {
    constructor(@InjectModel('guild_online_count') private readonly onlineCountModel: Model<GuildOnlineCount>) { }

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
}
