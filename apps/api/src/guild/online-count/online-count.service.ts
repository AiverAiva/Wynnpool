import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuildOnlineBucket } from '@shared/schemas/online-count-bucket.schema';

export interface GuildOnlinePoint {
    /** Start of the bucket window, in unix seconds. */
    timestamp: number;
    /** Mean online count across the samples taken in that window. */
    count: number;
    /** Peak online count seen in that window. */
    countMax: number;
    /** How many samples the bucket is based on (0 would mean a fake bucket). */
    samples: number;
}

@Injectable()
export class OnlineCountService {
    constructor(@InjectModel(GuildOnlineBucket.name) private readonly onlineCountModel: Model<GuildOnlineBucket>) { }

    async getGuildOnlineCount(guild_uuid: string, startTime: number): Promise<GuildOnlinePoint[]> {
        const now = Math.floor(Date.now() / 1000);

        const rows = await this.onlineCountModel
            .find({
                guild_uuid,
                bucket: { $gte: startTime, $lte: now },
            })
            .sort({ bucket: 1 })
            .lean();

        return rows.map((row: any) => ({
            timestamp: row.bucket,
            count: row.samples > 0 ? Math.round((row.countSum / row.samples) * 10) / 10 : 0,
            countMax: row.countMax ?? 0,
            samples: row.samples ?? 0,
        }));
    }
}
