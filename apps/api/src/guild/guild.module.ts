import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GuildController } from './guild.controller';
import { EventModule } from './event/event.module';
import { LastSeenModule } from './last-seen/last-seen.module';
import { OnlineCountModule } from './online-count/online-count.module';

@Module({
    imports: [
        HttpModule,
        EventModule,
        LastSeenModule,
        OnlineCountModule
    ],
    controllers: [GuildController],
})
export class GuildModule { }
