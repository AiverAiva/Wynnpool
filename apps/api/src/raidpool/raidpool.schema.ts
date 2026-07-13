import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'raidpool_gambits', _id: false })
export class RaidpoolGambits {
  @Prop({ type: String, required: true })
  _id: string; // e.g. "2024-39-16"

  @Prop({ type: Number, required: true, index: true })
  year: number;

  @Prop({ type: Number, required: true, index: true })
  month: number;

  @Prop({ type: Number, required: true, index: true })
  day: number;

  @Prop({ type: [Object], required: true })
  gambits: any[];
}

export const RaidpoolGambitsSchema =
  SchemaFactory.createForClass(RaidpoolGambits);
