import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'guild_member_events' })
export class GuildMemberEvent extends Document {
    @Prop({ required: true }) timestamp: number;
    @Prop({ required: true }) event: string;
    @Prop({ required: true }) name: string;
    @Prop({ required: true }) guild_uuid: string;
    @Prop({ required: true }) guild_name: string;
    @Prop() rank?: string;
    @Prop() old_rank?: string;
    @Prop() new_rank?: string;
}

export const GuildMemberEventSchema = SchemaFactory.createForClass(GuildMemberEvent);
