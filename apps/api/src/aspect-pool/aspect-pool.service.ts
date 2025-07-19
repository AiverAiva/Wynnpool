import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AspectPool } from './aspect-pool.schema';

const EXTERNAL_API_URL = 'https://nori.fish/api/aspects';

@Injectable()
export class AspectPoolService {
    constructor(@InjectModel(AspectPool.name) private readonly aspectPoolModel: Model<AspectPool>) { }

    async fetchExternalData() {
        try {
            const response = await fetch(EXTERNAL_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching external data:', error);
            return null;
        }
    }

    async getAspectPool(showAll?: boolean, page?: number, limit?: number) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const sevenDaysAgo = currentTimestamp - 86400 * 7;

        // ✅ Use `.lean<AspectPool>()` to ensure TypeScript understands the returned object
        let latestEntry = await this.aspectPoolModel.findOne().sort({ 'data.Timestamp': -1 }).lean<AspectPool>();

        if (!latestEntry || latestEntry?.data.Timestamp < sevenDaysAgo) {
            console.log('Fetching new data from external API');
            const newData = await this.fetchExternalData();

            if (!newData || typeof newData !== 'object') {
                throw new HttpException('Invalid API response', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // ✅ Compare only `data`, ignoring `_id`
            if (latestEntry && JSON.stringify(latestEntry.data) === JSON.stringify(newData)) {
                console.log('🛑 Skipping database insert: New data is identical to the latest entry.');
                return latestEntry.data; // ✅ Return existing entry instead of inserting
            }

            // ✅ Insert only if data is different
            latestEntry = await this.aspectPoolModel.create({ data: newData });

            return latestEntry.data;
        }


        if (!showAll && page === undefined && limit === undefined) {
            const latestEntry = await this.aspectPoolModel
                .findOne()
                .sort({ 'data.Timestamp': -1 })
                .lean();

            if (!latestEntry) {
                throw new HttpException('No data found', HttpStatus.NOT_FOUND);
            }

            return latestEntry.data;
        }

        if (showAll) {
            const allEntries = await this.aspectPoolModel
                .find()
                .sort({ 'data.Timestamp': -1 })
                .lean();

            return allEntries.map(entry => entry.data);
        }

        if (page !== undefined && limit !== undefined) {
            const skip = (page - 1) * limit;
            const [entries, totalCount] = await Promise.all([
                this.aspectPoolModel
                    .find()
                    .sort({ 'data.Timestamp': -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.aspectPoolModel.countDocuments(),
            ]);

            return {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                data: entries.map(entry => entry.data),
            };
        }

        throw new HttpException('Invalid parameters', HttpStatus.BAD_REQUEST);
    }
}
