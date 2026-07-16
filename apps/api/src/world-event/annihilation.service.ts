import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AnnihilationService {
    private readonly COLLECTION = 'world_event_predictions';

    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {}

    /**
     * Return the latest mean-reversion prediction for Annihilation.
     * The doc is upserted by the engine task and already matches the shape
     * the web page expects ({ current, predicted[] }).
     *
     * The engine writes `_id` as a plain string ("annihilation"), not an
     * ObjectId, so we type the collection as AnyObject to bypass the driver's
     * ObjectId-only _id inference.
     */
    async getPrediction() {
        try {
            const doc = await this.connection
                .collection<any>(this.COLLECTION)
                .findOne({ _id: 'annihilation' as any });

            if (!doc) {
                throw new NotFoundException('Annihilation prediction not yet computed');
            }
            return doc;
        } catch (e) {
            if (e instanceof NotFoundException) throw e;
            console.error('Error in getPrediction:', e);
            throw new InternalServerErrorException('Failed to fetch annihilation prediction');
        }
    }
}
