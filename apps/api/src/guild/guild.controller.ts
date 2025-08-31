import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GuildService } from './guild.service';

@Controller('guild')
export class GuildController {
    constructor(
        private readonly httpService: HttpService,
        private readonly guildService: GuildService,
    ) {}

    @Get('current-season')
    async getMaxSeason() {
        try {
            const max = await this.guildService.getCurrentSeason();
            if (max === null) throw new HttpException('No seasons found', HttpStatus.NOT_FOUND);
            return { currentSeason: max };
        } catch (error) {
            console.error('Error fetching currentSeason season:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(':guildName')
    async getGuild(@Param('guildName') guildName: string) {
        if (!guildName) {
            throw new HttpException('Missing Guild Name parameter', HttpStatus.BAD_REQUEST);
        }

        const EXTERNAL_API_URL = `https://api.wynncraft.com/v3/guild/${guildName}?identifier=uuid`;

        try {
            const response = await firstValueFrom(this.httpService.get(EXTERNAL_API_URL));
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new HttpException('Guild not found', HttpStatus.NOT_FOUND);
            }
            console.error('Error fetching external data:', error);
            throw new HttpException('Unable to fetch data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    
}
