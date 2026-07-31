import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false, versionKey: false })
export class DatabaseItem extends Document {
  @Prop({ required: true })
  itemName: string;

  @Prop({ required: true })
  originalString: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ type: Number, default: Date.now })
  timestamp: number;

  @Prop()
  ironman: boolean;

  @Prop()
  verified: boolean;

  /** When true, public GET responses redact owner/uuid. Staff search keeps the real values. */
  @Prop({ type: Boolean, default: false })
  anonymous: boolean;
}

export const DatabaseItemSchema = SchemaFactory.createForClass(DatabaseItem);
