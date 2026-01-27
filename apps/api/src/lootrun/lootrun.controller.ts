import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { LootrunService } from './lootrun.service';

@Controller('lootrun')
export class LootrunController {
  constructor(
    private readonly lootrunService: LootrunService,
  ) { }

  @Get()
  async getLootrunCurrent(@Res() res: Response) {
    const result = await this.lootrunService.getCurrentLootpool();
    return res.json(result);
  }

  @Get(':year/:week')
  async getLootrunByYearWeek(
    @Param('year') year: string,
    @Param('week') week: string,
    @Res() res: Response,
  ) {
    const result = await this.lootrunService.getLootpoolByYearWeek(
      parseInt(year, 10),
      parseInt(week, 10),
    );
    return res.json(result);
  }
}
