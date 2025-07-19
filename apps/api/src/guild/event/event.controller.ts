import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GuildEventService } from './event.service';

@Controller('guild/event')
export class GuildEventController {
    constructor(private readonly guildEventService: GuildEventService) { }

    @Post()
    async getGuildEvents(
        @Body() body: { query: any; page: number; limit: number } // Read data from the request body
    ) {
        try {
            const { query, page = 1, limit = 10 } = body; // Extract from body
            return await this.guildEventService.getEvents(query, page, limit);
        } catch (error) {
            console.error('Error fetching guild events:', error);
            throw new HttpException('Failed to fetch guild events', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
