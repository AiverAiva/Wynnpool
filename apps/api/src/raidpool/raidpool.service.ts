import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaidpoolGambits } from './raidpool.schema';
import { HttpService } from '@nestjs/axios';

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
    const { year, month, day, key } = this.getGambitsDateKey(new Date());

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
        expiresAt: this.getGambitsExpireAt(new Date()),
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

  private getGambitsDateKey(date: Date): { year: number; month: number; day: number; key: string } {
    const adjusted = new Date(date.getTime() - 18 * 60 * 60 * 1000);

    const year = adjusted.getUTCFullYear();
    const month = adjusted.getUTCMonth() + 1; // 1-12
    const day = adjusted.getUTCDate();

    const key = `${year}-${month}-${day}`;

    return { year, month, day, key };
  }

  private getGambitsExpireAt(date: Date): number {
    const adjusted = new Date(date.getTime() - 18 * 60 * 60 * 1000);
    adjusted.setUTCDate(adjusted.getUTCDate() + 1);
    adjusted.setUTCHours(18, 0, 0, 0);

    return adjusted.getTime();
  }
}
