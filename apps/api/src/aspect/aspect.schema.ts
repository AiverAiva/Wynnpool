import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'aspect_data' })
export class Aspect extends Document {
    @Prop({ required: true }) aspectId: string;
}


export const AspectSchema = SchemaFactory.createForClass(Aspect);
