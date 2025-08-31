import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import { Model } from 'mongoose';
import { Guild } from '../shared/schemas/guild.schema';

@Controller('player')
export class PlayerController {
    constructor(
        private readonly httpService: HttpService,
        @InjectModel('Guild') private readonly guildModel: Model<Guild>, // Inject the Guild model
    ) { }

    @Get(':playerName')
    //Playername/uuid identifier
    async getPlayer(@Param('playerName') playerName: string) {
        if (!playerName) {
            throw new HttpException('Missing Player Name parameter', HttpStatus.BAD_REQUEST);
        }

        const EXTERNAL_API_URL = `https://api.wynncraft.com/v3/player/${playerName}?fullResult`;

        try {
            const response = await firstValueFrom(this.httpService.get(EXTERNAL_API_URL));
            // Fetch the guild data from the database using the player's UUID
            const guild = await this.guildModel.findOne({
                $or: [
                    { [`members.owner.${response.data.uuid}`]: { $exists: true } },
                    { [`members.chief.${response.data.uuid}`]: { $exists: true } },
                    { [`members.strategist.${response.data.uuid}`]: { $exists: true } },
                    { [`members.captain.${response.data.uuid}`]: { $exists: true } },
                    { [`members.recruiter.${response.data.uuid}`]: { $exists: true } },
                    { [`members.recruit.${response.data.uuid}`]: { $exists: true } },
                ],
            });

            response.data.guild = null;
            // Return if the player is not in any guild, no need to add guild data
            if (!guild) return response.data;

            // Determine the player's rank in the guild
            let playerRank = '';
            for (const rank of ['owner', 'chief', 'strategist', 'captain', 'recruiter', 'recruit']) {
                if (guild.members[rank] && guild.members[rank][response.data.uuid]) {
                    playerRank = rank;
                    break;
                }
            }

            // Add the guild data to the response
            response.data.guild = {
                uuid: guild.uuid,
                name: guild.name,
                prefix: guild.prefix,
                rank: playerRank,
            };

            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
            }
            console.error('Error fetching external data:', error);
            throw new HttpException('Unable to fetch data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
