import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuildMemberEvent } from './event.schema';

@Injectable()
export class GuildEventService {
    constructor(@InjectModel(GuildMemberEvent.name) private guildEventModel: Model<GuildMemberEvent>) {}

    async getEvents(query: any, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const data = await this.guildEventModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);
        const totalCount = await this.guildEventModel.countDocuments(query);
        return { data, page, totalPages: Math.ceil(totalCount / limit), totalCount };
    }
}
