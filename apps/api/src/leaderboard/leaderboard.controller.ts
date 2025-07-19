import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) {}

    @Get('guild-average-online')
    async getLeaderboard() {
        try {
            return await this.leaderboardService.getGuildAverageOnlineLeaderboard();
        } catch (error) {
            console.error('Error generating leaderboard:', error);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
