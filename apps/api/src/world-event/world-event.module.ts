import { Module } from '@nestjs/common';
import { WorldEventService } from './world-event.service';
import { WorldEventController } from './world-event.controller';

@Module({
    providers: [WorldEventService],
    controllers: [WorldEventController],
})
export class WorldEventModule {}
