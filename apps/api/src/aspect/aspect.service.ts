import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Aspect } from './aspect.schema';

@Injectable()
export class AspectService {
    constructor(
        @InjectModel(Aspect.name) private readonly aspectModel: Model<Aspect>,
    ) { }

    async findAll(requiredClass?: string, rarity?: string): Promise<any[]> {
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
