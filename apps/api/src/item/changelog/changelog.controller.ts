import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ChangelogService } from './changelog.service';

@Controller('item/changelog')
export class ChangelogController {
    constructor(private readonly changelogService: ChangelogService) { }

    @Get('list')
    async getChangelogTimestamps() {
        return this.changelogService.getDistinctTimestamps();
    }

    @Get(':timestamp')
    async getChangelogByTimestamp(@Param('timestamp') timestamp: string) {
        const parsedTimestamp = Number(timestamp);
        if (isNaN(parsedTimestamp)) {
            throw new HttpException('Invalid timestamp format', HttpStatus.BAD_REQUEST);
        }

        return this.changelogService.getChangelogByTimestamp(parsedTimestamp);
    }
}
