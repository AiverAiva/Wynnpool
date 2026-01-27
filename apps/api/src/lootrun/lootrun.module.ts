import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LootrunController } from './lootrun.controller';
import { LootrunService } from './lootrun.service';
import { LootpoolSchema } from './lootrun.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Lootpool', schema: LootpoolSchema }]),
    HttpModule,
  ],
  controllers: [LootrunController],
  providers: [LootrunService],
})
export class LootrunModule { }
