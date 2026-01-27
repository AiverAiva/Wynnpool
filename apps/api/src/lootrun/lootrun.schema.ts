import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class LootpoolItem {
  @Prop({ required: true })
  amount: number;

  @Prop({ type: Object, default: null })
  icon: { format: string; value: string } | null;

  @Prop({ required: true })
  itemType: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rarity: string;

  @Prop({ required: true })
  shiny: boolean;

  @Prop({ type: Object, default: null })
  shinyStat: {
    shinyRerolls: number;
    statType: {
      displayName: string;
      id: number;
      key: string;
      statUnit: string;
    };
    value: number;
  } | null;

  @Prop({ required: true })
  subtype: string;
}

export const LootpoolItemSchema =
  SchemaFactory.createForClass(LootpoolItem);

@Schema({ _id: false })
export class LootpoolRegion {
  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  timestamp: string;

  @Prop({ type: String, default: null })
  type: string | null;

  @Prop({ type: [LootpoolItemSchema], default: [] })
  items: LootpoolItem[];
}

export const LootpoolRegionSchema =
  SchemaFactory.createForClass(LootpoolRegion);

@Schema({
  collection: 'lootpool',
  _id: false,
})
export class Lootpool {
  @Prop({ type: String, required: true })
  _id: string; // e.g. "2024-39"

  @Prop({ type: Number, required: true, index: true })
  year: number;

  @Prop({ type: Number, required: true, index: true })
  week: number;

  @Prop({ type: [LootpoolRegionSchema], default: [] })
  regions: LootpoolRegion[];
}

export type LootpoolDocument = Lootpool & Document<string>;

export const LootpoolSchema =
  SchemaFactory.createForClass(Lootpool);
