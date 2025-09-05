import { Controller, Get, HttpException, HttpStatus, Param, Query, Req, Res } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(
        private readonly leaderboardService: LeaderboardService,
        private readonly httpService: HttpService
    ) { }

    private readonly base = 'https://api.wynncraft.com/v3/leaderboards';
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

    @Get('types')
    async listTypes(@Req() req: Request, @Res() res: Response) {
        const url = `${this.base}/types`;
        try {
            const response = await this.httpService.axiosRef.get(url, { responseType: 'stream', timeout: 10000 });
            res.status(response.status);
            response.data.pipe(res);
        } catch (err) {
            console.error('Error proxying leaderboard types:', err?.message || err);
            throw new HttpException('Failed to fetch external leaderboard types', HttpStatus.BAD_GATEWAY);
        }
    }

    // GET /leaderboards/:type?resultLimit=number -> proxy to /v3/leaderboards/:type?resultLimit=number
    @Get(':type')
    async getType(
        @Param('type') type: string,
        @Query('resultLimit') resultLimit: string | number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Custom handlers map: map type -> async handler returning the response object
        const customHandlers: Record<string, (limit?: number) => Promise<any>> = {
            guildAverageOnline: async () => this.leaderboardService.getGuildAverageOnlineLeaderboard(),
            guildLevel: async (limit = 100) => this.leaderboardService.getGuildLeaderboardByField('level', limit, { tiebreaker: 'xpPercent' }),
            guildTerritories: async (limit = 100) => this.leaderboardService.getGuildLeaderboardByField('territories', limit),
            guildWars: async (limit = 100) => this.leaderboardService.getGuildLeaderboardByField('wars', limit),
            // guildMemberLeave: async (limit = 100) => this.leaderboardService.getGuildMemberLeaveLeaderboard(limit),
        };

        if (type in customHandlers) {
            try {
                const limitNum = resultLimit ? parseInt(String(resultLimit), 10) : undefined;
                const data = await customHandlers[type](limitNum as any);
                res.status(200).json(data);
                return;
            } catch (error) {
                console.error(`Error generating leaderboard for type ${type}:`, error);
                throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        // Fallback to external API
        const q = resultLimit ? `?resultLimit=${encodeURIComponent(String(resultLimit))}` : '';
        const url = `${this.base}/${encodeURIComponent(type)}${q}`;
        try {
            const response = await this.httpService.axiosRef.get(url, { responseType: 'stream', timeout: 10000 });
            res.status(response.status);
            response.data.pipe(res);
        } catch (err) {
            console.error('Error proxying leaderboard type:', err?.message || err);
            throw new HttpException('Failed to fetch external leaderboard type', HttpStatus.BAD_GATEWAY);
        }
    }
}
