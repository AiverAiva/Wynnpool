import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlayerController } from './player.controller';
import { Guild, GuildSchema } from '../shared/schemas/guild.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerService } from './player.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Guild.name, schema: GuildSchema }]), 
        HttpModule
    ],
    providers: [PlayerService],
    controllers: [PlayerController],
})
export class PlayerModule {}
    