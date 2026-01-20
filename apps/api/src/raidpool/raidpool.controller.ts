import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { RaidpoolService } from './raidpool.service';
import { HttpService } from '@nestjs/axios';
import { Inject } from '@nestjs/common';

@Controller('raidpool')
export class RaidpoolController {
  constructor(
    private readonly raidpoolService: RaidpoolService,
    private readonly httpService: HttpService,
  ) { }

  @Get()
  async getRaidpoolCurrent(@Res() res: Response) {
    const result = await this.raidpoolService.getCurrentRaidpool();
    return res.json(result);
  }

  @Get(':year/:week')
  async getRaidpoolByYearWeek(
    @Param('year') year: string,
    @Param('week') week: string,
    @Res() res: Response,
  ) {
    const result = await this.raidpoolService.getRaidpoolByYearWeek(
      parseInt(year, 10),
      parseInt(week, 10),
    );
    return res.json(result);
  }

  @Get('gambits')
  async getGambits(@Res() res: Response) {
    const result = await this.raidpoolService.getGambits();
    return res.json(result);
  }
}
