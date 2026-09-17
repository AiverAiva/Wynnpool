import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnlineCountController } from './online-count.controller';
import { OnlineCountService } from './online-count.service';
import { GuildOnlineBucket, GuildOnlineBucketSchema } from '@shared/schemas/online-count-bucket.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: GuildOnlineBucket.name, schema: GuildOnlineBucketSchema }])],
    controllers: [OnlineCountController],
    providers: [OnlineCountService],
})
export class OnlineCountModule { }
