import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LastSeenController } from './last-seen.controller';
import { LastSeenService } from './last-seen.service';
import { GuildLastSeen, GuildLastSeenSchema } from './last-seen.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: GuildLastSeen.name, schema: GuildLastSeenSchema }])],
    controllers: [LastSeenController],
    providers: [LastSeenService],
})
export class LastSeenModule { }
