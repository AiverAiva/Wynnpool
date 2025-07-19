import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { AspectPoolService } from './aspect-pool.service';

@Controller('aspect-pool')
export class AspectPoolController {
    constructor(private readonly aspectPoolService: AspectPoolService) { }

    @Get()
    async fetchAspectPool(
        @Query('showAll') showAll?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        try {
            return this.aspectPoolService.getAspectPool(
                showAll === 'true',
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );
        } catch (error) {
            console.error('Error in /aspect-pool endpoint:', error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
