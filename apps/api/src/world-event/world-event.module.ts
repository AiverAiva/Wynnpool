import { Module } from '@nestjs/common';
import { WorldEventController } from './world-event.controller';
import { WorldEventService } from './world-event.service';
import { AnnihilationService } from './annihilation.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [WorldEventController, SubscriptionController],
  providers: [WorldEventService, AnnihilationService, SubscriptionService],
})
export class WorldEventModule {}
