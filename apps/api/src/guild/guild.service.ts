import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from 'mongoose';

@Injectable()
export class GuildService {
    constructor(
        @InjectModel('guild_data') private readonly guildDataModel: Model<Document>,
    ) { }

    /**
     * Finds the largest season number present in any guild's seasonRanks across the collection.
     * Returns null if no seasons are found.
     */
    async getCurrentSeason(): Promise<number | null> {
        // seasonRanks is an object where keys are season numbers as strings. We need to extract keys across all documents.
        const pipeline = [
            // Project only seasonRanks
            { $project: { seasonRanks: 1 } },
            // Convert seasonRanks object to array of {k,v}
            { $project: { seasons: { $objectToArray: '$seasonRanks' } } },
            // Unwind the seasons array
            { $unwind: { path: '$seasons', preserveNullAndEmptyArrays: false } },
            // Convert key to int and keep as season
            { $project: { seasonNum: { $toInt: '$seasons.k' } } },
            // Group to get global max
            { $group: { _id: null, maxSeason: { $max: '$seasonNum' } } },
        ];

        const res = await this.guildDataModel.aggregate(pipeline).exec();
        if (!res || res.length === 0) return null;
        return res[0].maxSeason ?? null;
    }
}
