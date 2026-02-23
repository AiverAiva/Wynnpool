import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Raidpool, RaidpoolDocument, RaidpoolGambits } from './raidpool.schema';
import { HttpService } from '@nestjs/axios';
import { Inject } from '@nestjs/common';

@Injectable()
export class RaidpoolService {
  constructor(
    @InjectModel('Raidpool') private raidpoolModel: Model<RaidpoolDocument>,
    @InjectModel('RaidpoolGambits') private raidpoolGambitsModel: Model<RaidpoolGambits>,
    private readonly httpService: HttpService,
  ) { }

  private raidpoolCache = new Map<
    string,
    { value: { regions: any[]; year: number; week: number }; expiresAt: number }
  >();

  private gambitsCache = new Map<
    string,
    { value: any; expiresAt: number }
  >();

  async getCurrentRaidpool(): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const { year, week } = this.getRaidpoolYearWeek(new Date());
    const id = `${year}-${week}`;
    const now = Date.now();
    //1 hit cache
    const cached = this.raidpoolCache.get(id);
    if (cached && cached.expiresAt > now && cached.value.regions.length === 4) {
      return cached.value;
    }

    //2 db query
    const existing = await this.raidpoolModel.findOne({ _id: id }).exec();
    if (existing?.regions?.length === 4) {
      const value = { regions: existing.regions, year, week };

      this.raidpoolCache.set(id, {
        value,
        expiresAt: this.getRaidpoolExpireAt(year, week),
      });
      return value;
    }

    //3 remote fetch
    const response = await this.httpService.axiosRef.get(
      'https://www.wynnventory.com/api/raidpool/current',
      {
        headers: { Authorization: `Api-Key ${apiKey}` },
      },
    );

    const regions = response.data?.regions ?? [];

    if (regions.length === 4) {
      await new this.raidpoolModel({ _id: id, year, week, regions }).save();
    }

    return { regions, year, week };
  }


  async getRaidpoolByYearWeek(
    year: number,
    week: number,
  ): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const id = `${year}-${week}`;

    const existing = await this.raidpoolModel.findOne({ _id: id }).exec();
    if (existing?.regions?.length === 4) {
      return { regions: existing.regions, year, week };
    }

    const response = await this.httpService.axiosRef.get(
      `https://www.wynnventory.com/api/raidpool/${year}/${week}`,
      {
        headers: {
          Authorization: `Api-Key ${apiKey}`,
        },
      },
    );

    const regions = response.data?.regions ?? [];

    if (regions.length === 4) {
      await new this.raidpoolModel({
        _id: id,
        year,
        week,
        regions,
      }).save();
    }

    return { regions, year, week };
  }

  async getGambits(): Promise<any> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const now = Date.now();
    const { year, month, day, key } = this.getGambitsDateKey(new Date());

    //1 hit cache
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

  private getFirstFriday18UTC(year: number): number {
    const jan1 = new Date(Date.UTC(year, 0, 1, 18, 0, 0));
    const day = jan1.getUTCDay(); // 0=Sun ... 5=Fri

    const diffToFriday = (5 - day + 7) % 7;
    jan1.setUTCDate(jan1.getUTCDate() + diffToFriday);

    return jan1.getTime();
  }

  private getRaidpoolYearWeek(date: Date): { year: number; week: number } {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const REFERENCE_FRIDAY_UTC = Date.UTC(2024, 0, 5, 18, 0, 0);
    const nowUtc = date.getTime();

    const diffWeeks = Math.floor((nowUtc - REFERENCE_FRIDAY_UTC) / WEEK_MS);

    const weekStart = REFERENCE_FRIDAY_UTC + diffWeeks * WEEK_MS;
    const weekDate = new Date(weekStart);

    const year = weekDate.getUTCFullYear();

    const firstFriday = this.getFirstFriday18UTC(year);
    const week = Math.floor((weekStart - firstFriday) / WEEK_MS) + 1;

    return { year, week };
  }

  private getRaidpoolExpireAt(year: number, week: number): number {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const firstFriday = this.getFirstFriday18UTC(year);
    const weekStart = firstFriday + (week - 1) * WEEK_MS;

    return weekStart + WEEK_MS;
  }

  private getGambitsExpireAt(date: Date): number {
    const adjusted = new Date(date.getTime() - 18 * 60 * 60 * 1000);
    adjusted.setUTCDate(adjusted.getUTCDate() + 1);
    adjusted.setUTCHours(18, 0, 0, 0);

    return adjusted.getTime();
  }
}
