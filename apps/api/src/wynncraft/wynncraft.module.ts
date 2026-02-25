import { Module } from '@nestjs/common';
import { WynncraftController } from './wynncraft.controller';
import { WynncraftService } from './wynncraft.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [WynncraftController],
  providers: [WynncraftService]
})
export class WynncraftModule {}
