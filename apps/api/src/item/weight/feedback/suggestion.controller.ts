import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { SuggestionService } from './suggestion.service';
import { AuthenticatedGuard } from '@shared/guards/authenticated.guard';
import { OptionalAuthenticatedGuard } from '@shared/guards/optional-authenticated.guard';

@Controller('item/weight/suggestions')
@SkipThrottle()
export class SuggestionController {
    constructor(private readonly suggestionService: SuggestionService) { }

    @Get(':weightId')
    @UseGuards(OptionalAuthenticatedGuard)
    async getSuggestions(@Param('weightId') weightId: string, @Req() req: Request) {
        const discordId = (req.user as any)?.discordId || null;
        const suggestions = await this.suggestionService.getSuggestionsForWeight(weightId);
        const userSuggestion = discordId 
            ? await this.suggestionService.getUserSuggestionForWeight(weightId, discordId)
            : null;
        return { suggestions, userSuggestion };
    }

    @Post(':weightId')
    @UseGuards(AuthenticatedGuard)
    async createSuggestion(
        @Param('weightId') weightId: string,
        @Body() body: { content: string; anonymous: boolean },
        @Req() req: Request
    ) {
        const discordId = (req.user as any)?.discordId;
        const discordProfile = (req.user as any)?.discordProfile;
        
        if (!discordId) {
            throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        }

        if (!body.content || body.content.trim().length === 0) {
            throw new HttpException({ error: 'Suggestion content is required' }, HttpStatus.BAD_REQUEST);
        }

        if (body.content.length > 1000) {
            throw new HttpException({ error: 'Suggestion content must be less than 1000 characters' }, HttpStatus.BAD_REQUEST);
        }

        return this.suggestionService.createSuggestion(
            weightId,
            discordId,
            body.content,
            body.anonymous || false,
            {
                username: discordProfile?.username || 'Unknown',
                avatar: discordProfile?.avatar || '',
            }
        );
    }

    @Delete(':weightId/:suggestionId')
    @UseGuards(AuthenticatedGuard)
    async deleteSuggestion(
        @Param('weightId') weightId: string,
        @Param('suggestionId') suggestionId: string,
        @Req() req: Request
    ) {
        const discordId = (req.user as any)?.discordId;
        if (!discordId) {
            throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        }

        return this.suggestionService.deleteSuggestion(weightId, suggestionId, discordId);
    }
}
