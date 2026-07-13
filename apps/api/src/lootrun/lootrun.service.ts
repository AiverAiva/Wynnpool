import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

const UPSTREAM_BASE = 'https://www.wynnventory.com/api/lootpool';

@Injectable()
export class LootrunService {
  constructor(private readonly httpService: HttpService) {}

  async getCurrentLootpool(): Promise<{ regions: any[]; year: number; week: number }> {
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

  async getLootpoolByYearWeek(
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
}
