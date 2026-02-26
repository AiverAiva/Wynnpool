import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { AuthenticatedGuard } from '@shared/guards/authenticated.guard';
import { OptionalAuthenticatedGuard } from '@shared/guards/optional-authenticated.guard';

@Controller('item/weight/feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    @Get(':weightId')
    @UseGuards(OptionalAuthenticatedGuard)
    async getFeedback(@Param('weightId') weightId: string, @Req() req: Request) {
        const discordId = (req.user as any)?.discordId || null;
        const feedback = await this.feedbackService.getFeedbackForWeight(weightId);
        const userVote = discordId ? await this.feedbackService.getUserVoteForWeight(weightId, discordId) : null;
        return { ...feedback, userVote };
    }

    @Post(':weightId')
    @UseGuards(AuthenticatedGuard)
    async submitVote(
        @Param('weightId') weightId: string,
        @Body() body: { vote: 'upvote' | 'downvote' },
        @Req() req: Request
    ) {
        const discordId = (req.user as any)?.discordId;
        if (!discordId) {
            throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        }
        
        if (!body.vote || !['upvote', 'downvote'].includes(body.vote)) {
            throw new HttpException({ error: 'Invalid vote value. Must be "upvote" or "downvote"' }, HttpStatus.BAD_REQUEST);
        }

        return this.feedbackService.submitVote(weightId, discordId, body.vote);
    }

    @Delete(':weightId')
    @UseGuards(AuthenticatedGuard)
    async removeVote(@Param('weightId') weightId: string, @Req() req: Request) {
        const discordId = (req.user as any)?.discordId;
        if (!discordId) {
            throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        }

        return this.feedbackService.removeVote(weightId, discordId);
    }
}
