import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false })
export class WeightSuggestion extends Document {
  @Prop({ required: true })
  weight_id: string;

  @Prop({ required: true })
  discord_id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: false })
  anonymous: boolean;

  @Prop({ required: true })
  discord_username: string;

  @Prop({ required: true })
  discord_avatar: string;

  @Prop({ required: true })
  created_at: number;
}

export const WeightSuggestionSchema = SchemaFactory.createForClass(WeightSuggestion);

WeightSuggestionSchema.index({ weight_id: 1, discord_id: 1 }, { unique: true });
