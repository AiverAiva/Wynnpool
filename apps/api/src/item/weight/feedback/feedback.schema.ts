import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false })
export class WeightFeedback extends Document {
  @Prop({ required: true })
  weight_id: string;

  @Prop({ required: true })
  discord_id: string;

  @Prop({ required: true, enum: ['upvote', 'downvote'] })
  vote: string;

  @Prop({ required: true })
  created_at: number;
}

export const WeightFeedbackSchema = SchemaFactory.createForClass(WeightFeedback);

WeightFeedbackSchema.index({ weight_id: 1, discord_id: 1 }, { unique: true });
