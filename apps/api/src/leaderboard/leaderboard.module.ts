import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { HttpModule } from '@nestjs/axios';
import { GuildOnlineCountSchema } from '@shared/schemas/online-count.schema';
import { GuildModule } from '../guild/guild.module';
import { GuildSchema } from '@shared/schemas/guild.schema';

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
            { name: 'guild_online_count', schema: GuildOnlineCountSchema },
            { name: 'guild_data', schema: GuildSchema },
        ]),
        GuildModule,
    ], // register guild_data model for leaderboard queries
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
})
export class LeaderboardModule {}
