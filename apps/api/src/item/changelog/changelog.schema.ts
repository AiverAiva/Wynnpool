import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'item_changelog' }) 
export class Changelog extends Document {
    @Prop({ required: true }) timestamp: number;
}

export const ChangelogSchema = SchemaFactory.createForClass(Changelog);
