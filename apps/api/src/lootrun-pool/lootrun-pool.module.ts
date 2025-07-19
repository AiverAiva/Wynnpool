import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LootrunPoolController } from './lootrun-pool.controller';
import { LootrunPoolService } from './lootrun-pool.service';
import { LootrunPool, LootrunPoolSchema } from './lootrun-pool.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: LootrunPool.name, schema: LootrunPoolSchema }])],
    controllers: [LootrunPoolController],
    providers: [LootrunPoolService],
})
export class LootrunPoolModule {}
