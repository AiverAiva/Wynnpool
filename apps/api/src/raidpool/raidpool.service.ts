import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaidpoolGambits } from './raidpool.schema';
import { HttpService } from '@nestjs/axios';
import { getDailyResetKey, getDailyExpireAt, RAIDPOOL_RESET_HOUR } from '@wynnpool/shared';

const UPSTREAM_BASE = 'https://www.wynnventory.com/api/raidpool';

@Injectable()
export class RaidpoolService {
  constructor(
    @InjectModel('RaidpoolGambits') private raidpoolGambitsModel: Model<RaidpoolGambits>,
    private readonly httpService: HttpService,
  ) {}

  private gambitsCache = new Map<
    string,
    { value: any; expiresAt: number }
  >();

  async getCurrentRaidpool(): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const response = await this.httpService.axiosRef.get(
      `${UPSTREAM_BASE}/current`,
      { headers: { Authorization: `Api-Key ${apiKey}` } },
    );

    return {
      regions: response.data?.regions ?? [],
      year: response.data?.year,
      week: response.data?.week,
    };
  }


  async getRaidpoolByYearWeek(
    year: number,
    week: number,
  ): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const response = await this.httpService.axiosRef.get(
      `${UPSTREAM_BASE}/${year}/${week}`,
      { headers: { Authorization: `Api-Key ${apiKey}` } },
    );

    return {
      regions: response.data?.regions ?? [],
      year: response.data?.year ?? year,
      week: response.data?.week ?? week,
    };
  }

  async getGambits(): Promise<any> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const now = Date.now();
    const { year, month, day, key } = getDailyResetKey(new Date(), RAIDPOOL_RESET_HOUR);

    // //1 hit cache
    const cached = this.gambitsCache.get(key);
    if (cached && cached.expiresAt > now && cached.value.gambits?.length === 4) {
      return cached.value;
    }

    // 2 db query
    const existing = await this.raidpoolGambitsModel
      .findOne({ _id: key }, { _id: 0, __v: 0 })
      .exec();

    if (existing?.gambits?.length === 4) {
      this.gambitsCache.set(key, {
        value: existing,
        expiresAt: getDailyExpireAt(new Date(), RAIDPOOL_RESET_HOUR),
      });

      return existing;
    }

    // 3 remote fetch
    const response = await this.httpService.axiosRef.get(
      'https://www.wynnventory.com/api/raidpool/gambits/current',
      {
        headers: { Authorization: `Api-Key ${apiKey}` },
      },
    );

    const gambits = response.data.gambits;

    if (gambits.length === 4) {
      await new this.raidpoolGambitsModel({
        _id: key,
        year,
        month,
        day,
        gambits,
      }).save();
    }

    return response.data;
  }
}
