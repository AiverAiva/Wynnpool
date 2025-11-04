import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { sendToWebhook } from '../../lib/send-to-webhook';
import { Cacheable } from '@shared/decorators/cacheable.decorator';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class WeightService {
    constructor(
        @InjectConnection() private readonly connection: Connection,
        @Inject(CACHE_MANAGER) public cache: Cache,
    ) { }

    async updateWeight(weightId: string, data: any, user: any) {
        const collection = this.connection.collection('weight_data');
        const { _id, userId, ...rest } = data;
        const updateFields = {
            ...rest,
            description: data.description || '',
            timestamp: Date.now(),
        };

        const existing = await collection.findOne({ weight_id: weightId });
        if (!existing) throw new NotFoundException('Weight not found');

        const result = await collection.updateOne(
            { weight_id: weightId },
            { $set: updateFields }
        );

        // Only send webhook if something changed and not a test weight
        if (result.modifiedCount > 0 && updateFields.weight_name !== 'test') {
            // Compute diff for identifications
            const diff: Record<string, { old?: number; new?: number }> = {};
            if (data.identifications && existing.identifications) {
                for (const [key, newVal] of Object.entries(data.identifications)) {
                    const oldVal = existing.identifications[key] ?? 0;
                    if (oldVal !== newVal) {
                        diff[key] = { old: oldVal as number, new: newVal as number };
                    }
                }
            }
            // Check for description change
            if ((existing.description || '') !== (updateFields.description || '')) {
                diff['description'] = { old: existing.description || '', new: updateFields.description || '' };
            }
            // Check for weight_name change
            if ((existing.weight_name || '') !== (updateFields.weight_name || '')) {
                diff['weight_name'] = { old: existing.weight_name || '', new: updateFields.weight_name || '' };
            }
            await sendToWebhook({
                action: 'updated',
                author: user?.discordProfile?.username || user?.discordId || 'Unknown',
                item_id: updateFields.item_id,
                weight_name: updateFields.weight_name,
                weight_id: weightId,
                description: updateFields.description,
                diff,
            });
        }
        return { success: true };
    }

    async deleteWeight(weightId: string, user: any) {
        const collection = this.connection.collection('weight_data');
        const existing = await collection.findOne({ weight_id: weightId });
        if (!existing) throw new NotFoundException('Weight not found');

        const result = await collection.deleteOne({ weight_id: weightId });
        if (result.deletedCount === 0) throw new NotFoundException('Deletion failed');

        // Send webhook on deletion (unless test)
        if (existing.weight_name !== 'test') {
            const diff = Object.fromEntries(
                Object.entries(existing.identifications || {}).map(([k, v]) => [k, { old: v as number }])
            );
            await sendToWebhook({
                action: 'deleted',
                author: user?.discordProfile?.username || user?.discordId || existing.author || 'Unknown',
                item_id: existing.item_id,
                weight_name: existing.weight_name,
                weight_id: weightId,
                description: existing.description,
                diff,
            });
        }
        return { success: true };
    }

    async findWeightByWeightId(weightId: string) {
        const collection = this.connection.collection('weight_data');
        return collection.findOne({ weight_id: weightId });
    }

    async insertWeight(weight: any, user?: any) {
        const collection = this.connection.collection('weight_data');
        const result = await collection.insertOne(weight);
        // Send webhook on creation (unless test)
        if (weight.weight_name !== 'test') {
            const diff = Object.fromEntries(
                Object.entries(weight.identifications || {}).map(([k, v]) => [k, { new: v as number }])
            );
            await sendToWebhook({
                action: 'created',
                author: user?.discordProfile?.username || user?.discordId || weight.author || 'Unknown',
                item_id: weight.item_id,
                weight_name: weight.weight_name,
                weight_id: weight.weight_id,
                description: weight.description,
                diff,
            });
        }
        return result;
    }

    @Cacheable('getAllWeights', 24 * 60 * 60 * 1000)
    async getAllWeights() {
        const collection = this.connection.collection('weight_data');
        const data = await collection.find({}).toArray();
        return data;
    }
}
