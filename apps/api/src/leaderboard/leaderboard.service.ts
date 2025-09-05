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
    // @InjectModel('guild_member_events') private readonly guildMemberEventsModel: Model<Document>,
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
     * Leaderboard of guilds with most member leave events.
     * Aggregates guild_member_events where event === 'leave' grouped by guild_uuid and counts occurrences.
     */
    // async getGuildMemberLeaveLeaderboard(limit = 100): Promise<Record<string, any>> {
    //     const pipeline: any[] = [
    //         { $match: { event: 'leave', guild_uuid: { $exists: true } } },
    //         { $group: { _id: '$guild_uuid', guild_name: { $first: '$guild_name' }, leaveCount: { $sum: 1 } } },
    //         { $sort: { leaveCount: -1 } },
    //         { $limit: Math.max(1, Math.min(1000, limit)) },
    //         { $lookup: { from: 'guild_data', localField: '_id', foreignField: 'uuid', as: 'guild' } },
    //         { $unwind: { path: '$guild', preserveNullAndEmptyArrays: true } },
    //         { $project: { uuid: '$_id', guild_name: 1, leaveCount: 1, 'guild.uuid': 1, 'guild.name': 1, 'guild.prefix': 1, 'guild.created': 1, 'guild.banner': 1 } }
    //     ];

    //     const results = await this.guildMemberEventsModel.aggregate(pipeline as any).exec();
    //     const out: Record<string, any> = {};
    //     results.forEach((r: any, idx: number) => {
    //         const rank = idx + 1;
    //         const guild = r.guild || {};
    //         out[String(rank)] = {
    //             uuid: r.uuid || r._id,
    //             name: guild.name || r.guild_name,
    //             prefix: guild.prefix || null,
    //             leaveCount: r.leaveCount,
    //             created: guild.created || null,
    //             banner: guild.banner || null,
    //         };
    //     });

    //     return out;
    // }

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

    /**
     * Generic helper to build a guild leaderboard by a numeric field.
     * tiebreaker: optional secondary field to sort by when primary values equal.
     */
    async getGuildLeaderboardByField(field: string, limit = 100, opts?: { tiebreaker?: string }): Promise<Record<string, any>> {
        const safeLimit = Math.max(1, Math.min(1000, limit));
        const projectFields: any = { uuid: 1, name: 1, prefix: 1, created: 1, banner: 1 };
        projectFields[field] = 1;
        if (opts?.tiebreaker) projectFields[opts.tiebreaker] = 1;

        const sortSpec: any = {};
        sortSpec[field] = -1;
        if (opts?.tiebreaker) sortSpec[opts.tiebreaker] = -1;

        const pipeline: any[] = [
            { $match: { [field]: { $exists: true } } },
            { $project: projectFields },
            { $sort: sortSpec },
            { $limit: safeLimit },
        ];

        const results = await this.guildDataModel.aggregate(pipeline as any).exec();
        const out: Record<string, any> = {};
        results.forEach((g: any, idx: number) => {
            const rank = idx + 1;
            out[String(rank)] = {
                uuid: g.uuid,
                name: g.name,
                prefix: g.prefix,
                [field]: g[field],
                ...(opts?.tiebreaker ? { [opts.tiebreaker]: g[opts.tiebreaker] } : {}),
                created: g.created,
                banner: g.banner || null,
            };
        });

        return out;
    }
}
