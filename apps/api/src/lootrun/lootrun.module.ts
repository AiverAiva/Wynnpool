import { Module } from '@nestjs/common';
import { LootrunController } from './lootrun.controller';
import { LootrunService } from './lootrun.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LootrunController],
  providers: [LootrunService],
})
export class LootrunModule {}
