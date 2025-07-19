import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { OnlineCountService } from './online-count.service';

@Controller('guild/online-count')
export class OnlineCountController {
    constructor(private readonly onlineCountService: OnlineCountService) { }

    @Post()
    async getGuildOnlineCount(@Body() body: { guild_uuid: string; startTime: number }) {
        if (!body.guild_uuid || !body.startTime) {
            throw new HttpException('guild_uuid and startTime are required', HttpStatus.BAD_REQUEST);
        }

        try {
            const data = await this.onlineCountService.getGuildOnlineCount(body.guild_uuid, body.startTime);
            return { data };
        } catch (error) {
            console.error('Error fetching guild online count data:', error);
            throw new HttpException('Failed to fetch data', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
