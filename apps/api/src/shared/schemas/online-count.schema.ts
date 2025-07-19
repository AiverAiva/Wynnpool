import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'guild_online_count' }) 
export class GuildOnlineCount extends Document {
    @Prop({ required: true }) guild_name: string;
    @Prop({ required: true }) guild_uuid: string;
    @Prop({ required: true }) timestamp: number;
    @Prop({ required: true }) count: number;
}

export const GuildOnlineCountSchema = SchemaFactory.createForClass(GuildOnlineCount);
