import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { GuildOnlineCountSchema } from '@shared/schemas/online-count.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'guild_online_count', schema: GuildOnlineCountSchema }])], // ✅ No schema needed, using aggregation
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
})
export class LeaderboardModule {}
