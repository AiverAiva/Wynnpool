import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lootpool, LootpoolDocument } from './lootrun.schema';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class LootrunService {
  constructor(
    @InjectModel('Lootpool') private lootpoolModel: Model<LootpoolDocument>,
    private readonly httpService: HttpService,
  ) { }

  private lootpoolCache = new Map<
    string,
    { value: { regions: any[]; year: number; week: number }; expiresAt: number }
  >();

  async getCurrentLootpool(): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const { year: localYear, week: localWeek } = this.getLootpoolYearWeek(new Date());
    const id = `${localYear}-${localWeek}`;
    const now = Date.now();

    // 1. hit cache
    const cached = this.lootpoolCache.get(id);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // 2. db query
    const existing = await this.lootpoolModel.findOne({ _id: id }).exec();
    if (existing && existing.regions && existing.regions.length === 5) {
      const value = { regions: existing.regions, year: existing.year, week: existing.week };

      this.lootpoolCache.set(id, {
        value,
        expiresAt: this.getLootpoolExpireAt(existing.year, existing.week),
      });
      return value;
    }

    // 3. remote fetch
    const response = await this.httpService.axiosRef.get(
      'https://www.wynnventory.com/api/lootpool/current',
      {
        headers: { Authorization: `Api-Key ${apiKey}` },
      },
    );

    const regions = response.data?.regions ?? [];
    const year = response.data?.year ?? localYear;
    const week = response.data?.week ?? localWeek;
    const remoteId = `${year}-${week}`;

    if (regions.length === 5) {
      // Use remote year/week if available, otherwise fallback to local calculation
      await this.lootpoolModel.findOneAndUpdate(
        { _id: remoteId },
        { _id: remoteId, year, week, regions },
        { upsert: true, new: true }
      ).exec();
    }

    const result = { regions, year, week };
    this.lootpoolCache.set(remoteId, {
      value: result,
      expiresAt: this.getLootpoolExpireAt(year, week),
    });

    return result;
  }

  async getLootpoolByYearWeek(
    year: number,
    week: number,
  ): Promise<{ regions: any[]; year: number; week: number }> {
    const apiKey = process.env.WYNNVENTORY_API_KEY;
    if (!apiKey) {
      throw new Error('WYNNVENTORY_API_KEY is not configured');
    }

    const id = `${year}-${week}`;

    const existing = await this.lootpoolModel.findOne({ _id: id }).exec();
    if (existing && existing.regions && existing.regions.length === 5) {
      return { regions: existing.regions, year: existing.year, week: existing.week };
    }

    const response = await this.httpService.axiosRef.get(
      `https://www.wynnventory.com/api/lootpool/${year}/${week}`,
      {
        headers: {
          Authorization: `Api-Key ${apiKey}`,
        },
      },
    );

    const regions = response.data?.regions ?? [];
    const resYear = response.data?.year ?? year;
    const resWeek = response.data?.week ?? week;

    if (regions.length === 5) {
      await this.lootpoolModel.findOneAndUpdate(
        { _id: id },
        {
          _id: id,
          year: resYear,
          week: resWeek,
          regions,
        },
        { upsert: true }
      ).exec();
    }

    return { regions, year: resYear, week: resWeek };
  }

  private getFirstFriday19UTC(year: number): number {
    const jan1 = new Date(Date.UTC(year, 0, 1, 19, 0, 0));
    const day = jan1.getUTCDay(); // 0=Sun ... 5=Fri

    const diffToFriday = (5 - day + 7) % 7;
    jan1.setUTCDate(jan1.getUTCDate() + diffToFriday);

    return jan1.getTime();
  }

  private getLootpoolYearWeek(date: Date): { year: number; week: number } {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const REFERENCE_FRIDAY_UTC = Date.UTC(2024, 0, 5, 19, 0, 0);
    const nowUtc = date.getTime();

    const diffWeeks = Math.floor((nowUtc - REFERENCE_FRIDAY_UTC) / WEEK_MS);

    const weekStart = REFERENCE_FRIDAY_UTC + diffWeeks * WEEK_MS;
    const weekDate = new Date(weekStart);

    const year = weekDate.getUTCFullYear();

    const firstFriday = this.getFirstFriday19UTC(year);
    const week = Math.floor((weekStart - firstFriday) / WEEK_MS) + 1;

    return { year, week };
  }

  private getLootpoolExpireAt(year: number, week: number): number {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const firstFriday = this.getFirstFriday19UTC(year);
    const weekStart = firstFriday + (week - 1) * WEEK_MS;

    return weekStart + WEEK_MS;
  }
}
