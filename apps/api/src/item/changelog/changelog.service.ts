import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import * as NodeCache from "node-cache";
// const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const preloadedChangelog = new Map<string, any>();

@Injectable()
export class ChangelogService implements OnModuleInit {
    private preloadedChangelog = new Map<string, any>();
    constructor(@InjectModel('item_changelog') private readonly changelogModel: Model<any>) { }

    /** ✅ Preload all changelog data on startup */
    async onModuleInit() {
        if(process.env.NODE_ENV !== 'production') return; // Skip preloading in non-production environments
        console.log('⏳ Preloading changelog data...');
        const timestamps = await this.changelogModel.distinct("timestamp").exec(); // ✅ Get unique timestamps

        for (const timestamp of timestamps) {
            const categorizedData = await this.loadChangelogByTimestamp(timestamp);
            if (categorizedData) {
                this.preloadedChangelog.set(timestamp.toString(), categorizedData);
            }
        }

        console.log(`✅ Preloaded ${this.preloadedChangelog.size} changelog timestamps.`);
    }

    /** ✅ Load changelog by timestamp (used in preloading & fallback queries) */
    private async loadChangelogByTimestamp(timestamp: number) {
        const pipeline = [
            { $match: { timestamp } },
            {
                $group: {
                    _id: "$status",
                    items: { $push: "$$ROOT" }
                }
            },
            { $project: { _id: 0, status: "$_id", items: 1 } }
        ];

        const categorizedData = await this.changelogModel.aggregate(pipeline).exec();
        if (!categorizedData || categorizedData.length === 0) {
            return null;
        }

        return categorizedData.reduce((acc, entry) => {
            acc[entry.status] = entry.items;
            return acc;
        }, {} as Record<string, any[]>);
    }

    async getDistinctTimestamps(): Promise<number[]> {
        const timestamps = await this.changelogModel.aggregate([
            { $group: { _id: '$timestamp' } },
            { $sort: { _id: -1 } },  // Sort in descending order (most recent first)
            { $project: { _id: 0, timestamp: '$_id' } }
        ]).exec();

        return timestamps.map(entry => entry.timestamp);
    }

    /** ✅ Return preloaded data or fallback to MongoDB */
    async getChangelogByTimestamp(timestamp: number) {
        const cacheKey = timestamp.toString();

        if (this.preloadedChangelog.has(cacheKey)) {
            return this.preloadedChangelog.get(cacheKey); // ✅ Serve from preloaded memory
        }

        console.warn(`⚠️ Timestamp ${timestamp} not preloaded. Falling back to MongoDB...`);
        const categorizedData = await this.loadChangelogByTimestamp(timestamp);

        if (!categorizedData) {
            throw new HttpException('No changelog data found for this timestamp', HttpStatus.NOT_FOUND);
        }

        // Store the fetched data in memory for future requests
        this.preloadedChangelog.set(cacheKey, categorizedData);
        console.log(`✅ Cached timestamp ${timestamp} after fallback.`);

        return categorizedData; // Serve dynamically fetched data
    }

}
