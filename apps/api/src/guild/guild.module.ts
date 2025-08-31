import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GuildController } from './guild.controller';
import { EventModule } from './event/event.module';
import { LastSeenModule } from './last-seen/last-seen.module';
import { OnlineCountModule } from './online-count/online-count.module';
import { GuildService } from './guild.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildSchema } from '@shared/schemas/guild.schema';

@Module({
    imports: [
        HttpModule,
        EventModule,
        LastSeenModule,
        OnlineCountModule,
        MongooseModule.forFeature([
            { name: 'guild_data', schema: GuildSchema },
        ]),
    ],
    controllers: [GuildController],
    providers: [GuildService],
})
export class GuildModule { }
