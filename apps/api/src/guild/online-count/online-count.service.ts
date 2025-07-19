import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuildOnlineCount } from '@shared/schemas/online-count.schema';

@Injectable()
export class OnlineCountService {
    constructor(@InjectModel(GuildOnlineCount.name) private readonly onlineCountModel: Model<GuildOnlineCount>) { }

    async getGuildOnlineCount(guild_uuid: string, startTime: number): Promise<GuildOnlineCount[]> {
        const now = Math.floor(Date.now() / 1000);

        return this.onlineCountModel.find({
            guild_uuid,
            timestamp: { $gte: startTime, $lte: now },
        }).sort({ timestamp: 1 });
    }
}
