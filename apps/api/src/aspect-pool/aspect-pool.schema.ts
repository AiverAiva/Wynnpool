import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'aspect_pool' }) 
export class AspectPool extends Document {
    @Prop({ type: Object, required: true }) data: any;
}

export const AspectPoolSchema = SchemaFactory.createForClass(AspectPool);
