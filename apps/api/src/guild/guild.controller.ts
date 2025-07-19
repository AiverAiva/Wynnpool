import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('guild')
export class GuildController {
    constructor(private readonly httpService: HttpService) {}

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
