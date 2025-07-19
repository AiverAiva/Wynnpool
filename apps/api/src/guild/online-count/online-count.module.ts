import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnlineCountController } from './online-count.controller';
import { OnlineCountService } from './online-count.service';
import { GuildOnlineCount, GuildOnlineCountSchema } from '@shared/schemas/online-count.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: GuildOnlineCount.name, schema: GuildOnlineCountSchema }])],
    controllers: [OnlineCountController],
    providers: [OnlineCountService],
})
export class OnlineCountModule { }
