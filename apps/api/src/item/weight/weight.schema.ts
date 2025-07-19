import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false })
export class Weight extends Document {
  @Prop({ required: true })
  weight_id: string;
  // Add other fields as needed, or keep strict: false for flexibility
}

export const WeightSchema = SchemaFactory.createForClass(Weight);
