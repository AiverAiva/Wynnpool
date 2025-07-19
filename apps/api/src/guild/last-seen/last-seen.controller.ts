import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { LastSeenService } from './last-seen.service';

@Controller('guild/last-seen')
export class LastSeenController {
    constructor(private readonly lastSeenService: LastSeenService) { }

    @Post()
    async getGuildLastSeen(@Body() body: { guild_uuid: string }) {
        if (!body.guild_uuid) {
            throw new HttpException('guild_uuid is required', HttpStatus.BAD_REQUEST);
        }

        try {
            return { data: await this.lastSeenService.getGuildLastSeen(body.guild_uuid) };
        } catch (error) {
            throw new HttpException(error.message, error.getStatus ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
