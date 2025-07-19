import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
    @Prop({ required: true, unique: true })
    discordId: string;

    @Prop({ type: [String], default: [] })
    roles: string[];

    @Prop({ type: Object })
    discordProfile: any; // Store the latest Discord profile

    @Prop({ type: String })
    accessToken: string; // Store the latest access token

    @Prop({ type: String })
    refreshToken: string; // Store the latest refresh token
}

export const UserSchema = SchemaFactory.createForClass(User);
