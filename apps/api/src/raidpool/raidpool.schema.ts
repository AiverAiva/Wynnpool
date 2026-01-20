import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class RaidpoolItem {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  itemType: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rarity: string;

  @Prop({ required: true })
  shiny: boolean;

  @Prop({ required: true })
  subtype: string;
}

export const RaidpoolItemSchema =
  SchemaFactory.createForClass(RaidpoolItem);

@Schema({ _id: false })
export class RaidpoolRegion {
  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  timestamp: string;

  @Prop({ type: String, default: null })
  type: string | null;

  @Prop({ type: [RaidpoolItemSchema], default: [] })
  items: RaidpoolItem[];
}

export const RaidpoolRegionSchema =
  SchemaFactory.createForClass(RaidpoolRegion);

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

@Schema({
  collection: 'raidpool',
  _id: false,
})
export class Raidpool {
  @Prop({ type: String, required: true })
  _id: string; // e.g. "2024-39"

  @Prop({ type: Number, required: true, index: true })
  year: number;

  @Prop({ type: Number, required: true, index: true })
  week: number;

  @Prop({ type: [RaidpoolRegionSchema], default: [] })
  regions: RaidpoolRegion[];
}

export type RaidpoolDocument = Raidpool & Document<string>;

export const RaidpoolSchema =
  SchemaFactory.createForClass(Raidpool);
