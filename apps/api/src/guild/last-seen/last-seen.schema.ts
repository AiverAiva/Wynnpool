import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'guild_last_seen' }) 
export class GuildLastSeen extends Document {
    @Prop({ required: true }) guild_uuid: string;
    @Prop({ required: true }) guild_name: string;
    @Prop({ type: Map, of: { lastSeen: { type: Number } } }) members: Map<string, { lastSeen: number }>;
}

export const GuildLastSeenSchema = SchemaFactory.createForClass(GuildLastSeen);
