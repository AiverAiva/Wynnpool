import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GuildModule } from './guild/guild.module';
import { PlayerModule } from './player/player.module';
import { LootrunPoolModule } from './lootrun-pool/lootrun-pool.module';
import { ItemModule } from './item/item.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AspectPoolModule } from './aspect-pool/aspect-pool.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string, { dbName: 'wynnpool' }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60 * 1000, // Time-to-live in milliseconds
          limit: 30,      // Maximum requests in the TTL period
        },
      ],
    }),
    GuildModule,
    PlayerModule,
    LootrunPoolModule,
    AspectPoolModule,
    ItemModule,
    LeaderboardModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }],
})
export class AppModule { }
