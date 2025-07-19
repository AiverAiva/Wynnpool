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
}

export const DatabaseItemSchema = SchemaFactory.createForClass(DatabaseItem);
