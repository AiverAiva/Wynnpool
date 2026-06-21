import { Controller, Get, Query } from '@nestjs/common';
import { WorldEventService } from './world-event.service';

@Controller('world-event')
export class WorldEventController {
    constructor(private readonly worldEventService: WorldEventService) {}

    @Get()
    async getEvents(
        @Query('difficulty') difficulty?: string,
        @Query('levelMin') levelMin?: string,
        @Query('levelMax') levelMax?: string,
        @Query('length') length?: string,
    ) {
        const filters = {
            difficulty: difficulty ? difficulty.split(',') : undefined,
            levelMin: levelMin ? parseInt(levelMin, 10) : undefined,
            levelMax: levelMax ? parseInt(levelMax, 10) : undefined,
            length: length ? length.split(',') : undefined,
        };
        return this.worldEventService.getEvents(filters);
    }

    @Get('schedule')
    async getSchedule() {
        return this.worldEventService.getLatestSchedules();
    }

    @Get('changelog')
    async getChangelog(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.worldEventService.getChangelog(parsedLimit);
    }
}
