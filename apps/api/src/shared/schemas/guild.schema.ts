import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'guild_data' }) // Adjust collection name if needed
export class Guild extends Document {
  @Prop({ required: true })
  uuid: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  prefix: string;

  // Explicitly define the type for 'members' field
  @Prop({ type: Object, default: {} })
  members: {
    owner: Record<string, any>;
    chief: Record<string, any>;
    strategist: Record<string, any>;
    captain: Record<string, any>;
    recruiter: Record<string, any>;
    recruit: Record<string, any>;
    [key: string]: Record<string, any>;
  };
}

export const GuildSchema = SchemaFactory.createForClass(Guild);
