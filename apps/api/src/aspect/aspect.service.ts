import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Aspect } from './aspect.schema';

@Injectable()
export class AspectService {
    private cache: Map<string, { data: any[], timestamp: number }> = new Map();

    constructor(
        @InjectModel(Aspect.name) private readonly aspectModel: Model<Aspect>,
    ) { }

    async findAll(requiredClass?: string, rarity?: string): Promise<any[]> {
        // Only cache when no filters are applied
        if (!requiredClass && !rarity) {
            const cacheKey = 'all';
            const cached = this.cache.get(cacheKey);
            const now = Date.now();
            
            // Check if cache exists and is still valid (1 day TTL)
            if (cached && now - cached.timestamp < 24 * 60 * 60 * 1000) {
                return cached.data;
            }
            
            // Fetch from database and cache result
            const data = await this.aspectModel.find({}).select('-_id').lean();
            this.cache.set(cacheKey, { data, timestamp: now });
            return data;
        }
        
        // For filtered queries, don't cache and query directly
        const query: FilterQuery<Aspect> = {};
        
        if (requiredClass) {
            query.requiredClass = requiredClass;
        }
        
        if (rarity) {
            query.rarity = rarity;
        }
        
        return await this.aspectModel.find(query).select('-_id').lean();
    }

    async search(searchString: string): Promise<any[]> {
        const regex = new RegExp(searchString, 'i');

        return await this.aspectModel.find({
            $or: [
                { requiredClass: regex },
                { name: regex },
                { 'tiers.1.description': regex },
                { 'tiers.2.description': regex },
                { 'tiers.3.description': regex },
                { 'tiers.4.description': regex },
            ]
        }).select('-_id').lean();
    }

    async findByAspectId(aspectId: string): Promise<any> {
        const aspect = await this.aspectModel.findOne({ aspectId }).select('-_id').lean();

        if (!aspect) {
            throw new HttpException('Aspect not found', HttpStatus.NOT_FOUND);
        }

        return aspect;
    }
}
