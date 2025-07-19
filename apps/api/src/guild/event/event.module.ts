import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildEventController } from './event.controller';
import { GuildEventService } from './event.service';
import { GuildMemberEvent, GuildMemberEventSchema } from './event.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: GuildMemberEvent.name, schema: GuildMemberEventSchema }])],
    controllers: [GuildEventController],
    providers: [GuildEventService],
})
export class EventModule {}
