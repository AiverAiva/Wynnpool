import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RaidpoolController } from './raidpool.controller';
import { RaidpoolService } from './raidpool.service';
import { RaidpoolSchema, RaidpoolGambitsSchema } from './raidpool.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Raidpool', schema: RaidpoolSchema }]),
    MongooseModule.forFeature([{ name: 'RaidpoolGambits', schema: RaidpoolGambitsSchema }]),
    HttpModule,
  ],
  controllers: [RaidpoolController],
  providers: [RaidpoolService],
})
export class RaidpoolModule {}
