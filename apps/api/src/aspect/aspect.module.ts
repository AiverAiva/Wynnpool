import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Aspect, AspectSchema } from './aspect.schema';
import { AspectController } from './aspect.controller';
import { AspectService } from './aspect.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Aspect.name, schema: AspectSchema },
        ]),
    ],
    controllers: [AspectController],
    providers: [AspectService],
})

export class AspectModule {}