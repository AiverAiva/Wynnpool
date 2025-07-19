import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'lootrun_pool' })
export class LootrunPool extends Document {
    @Prop({ type: Object, required: true }) data: any;
}

export const LootrunPoolSchema = SchemaFactory.createForClass(LootrunPool);
