import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseItem } from './item-database.schema';

@Injectable()
export class DatabaseItemService {
  constructor(
    @InjectModel(DatabaseItem.name) private readonly databaseItemModel: Model<DatabaseItem>,
  ) { }

  async getVerifyItems(itemName?: string) {
    const query = itemName ? { itemName } : {};
    return this.databaseItemModel.find(query).sort({ timestamp: -1 }).lean();
  }

  async addVerifyItem(data: { itemName: string; originalString: string; owner: string }) {
    if (!data.itemName || !data.originalString || !data.owner) {
      throw new Error('Missing required fields.');
    }
    // If owner is a name, fetch UUID from Mojang API
    if (typeof data.owner === 'string') {
      try {
        const resp = await fetch(`https://api.mojang.com/users/profiles/minecraft/${data.owner}`);
        if (resp.ok) {
          const mojang = await resp.json();
          if (mojang && mojang.id) {
            data.owner = mojang.name;
            (data as any).uuid = mojang.id;
          }
        }
      } catch (e) {
        throw new Error('unknown owner');
      }
    }
    await this.databaseItemModel.create(data);
    return { success: true };
  }

  async searchDatabaseItems(query: { itemName?: string; owner?: string }) {
    const filters: any[] = [];

    if (query.itemName) {
      filters.push({ itemName: { $regex: query.itemName, $options: 'i' } });
    }

    if (query.owner) {
      filters.push({ owner: { $regex: query.owner, $options: 'i' } });
    }

    if (filters.length === 0) {
      // No search filters → return last 100 entries
      return this.databaseItemModel
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
    }

    // Apply search filters
    return this.databaseItemModel
      .find({ $or: filters })
      .sort({ timestamp: -1 })
      .lean();
  }


}
