import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AspectService } from './aspect.service';

@Controller('aspect')
export class AspectController {
    constructor(private readonly aspectService: AspectService) { }

    @Get('list')
    async getAllAspects(
        @Query('class') requiredClass?: string,
        @Query('rarity') rarity?: string,
    ): Promise<any[]> {
        return this.aspectService.findAll(requiredClass, rarity);
    }

    @Post('search')
    async searchAspects(@Body('search') search: string): Promise<any[]> {
        return this.aspectService.search(search);
    }

    @Get(':aspectId')
    async getAspect(@Param('aspectId') aspectId: string): Promise<any> {
        return this.aspectService.findByAspectId(aspectId);
    }
}
