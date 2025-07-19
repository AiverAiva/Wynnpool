import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../shared/schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async findByDiscordId(discordId: string) {
        return this.userModel.findOne({ discordId });
    }

    async upsertByDiscordId(discordId: string, profile: any, accessToken: string, refreshToken: string) {
        return this.userModel.findOneAndUpdate(
            { discordId },
            {
                $set: {
                    discordId,
                    discordProfile: profile,
                    accessToken,
                    refreshToken,
                },
                $setOnInsert: {
                    roles: [], // or your default roles
                },
            },
            { upsert: true, new: true }
        );
    }

    async findById(id: string) {
        return this.userModel.findById(id);
    }
}
