import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { Changelog, ChangelogSchema } from './changelog.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'item_changelog', schema: ChangelogSchema }]), // ✅ Register model here
    ],
    controllers: [ChangelogController],
    providers: [ChangelogService],
    exports: [MongooseModule]
})
export class ChangelogModule { }
