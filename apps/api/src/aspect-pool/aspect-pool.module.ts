import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AspectPoolController } from './aspect-pool.controller';
import { AspectPoolService } from './aspect-pool.service';
import { AspectPool, AspectPoolSchema } from './aspect-pool.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: AspectPool.name, schema: AspectPoolSchema }])],
    controllers: [AspectPoolController],
    providers: [AspectPoolService],
})
export class AspectPoolModule { }
