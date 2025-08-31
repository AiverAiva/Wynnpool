import { Controller, Get, HttpException, HttpStatus, Param, Query } from '@nestjs/common';
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

    @Get('season-rating/:season')
    async getSeasonRating(
        @Param('season') season: string,
        @Query('fullResult') fullResult?: string,
    ) {
        try {
            const full = fullResult === 'true' || fullResult === '1';
            const result = await this.leaderboardService.getSeasonRating(season, full);
            return result;
        } catch (error) {
            console.error('Error fetching season rating:', error);
            if (error.message === 'Invalid season') {
                throw new HttpException('Invalid season parameter', HttpStatus.BAD_REQUEST);
            }
            if (error.message === 'Current season not found') {
                throw new HttpException('Current season not found', HttpStatus.NOT_FOUND);
            }
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
