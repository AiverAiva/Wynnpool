import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuildLastSeen } from './last-seen.schema';

@Injectable()
export class LastSeenService {
    constructor(@InjectModel(GuildLastSeen.name) private readonly guildLastSeenModel: Model<GuildLastSeen>) { }

    async getGuildLastSeen(guild_uuid: string): Promise<GuildLastSeen> {
        const guildData = await this.guildLastSeenModel.findOne({ guild_uuid });
        if (!guildData) {
            throw new NotFoundException('Guild not found');
        }
        return guildData;
    }
}
