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
        // .limit(100)
        .lean();
    }

    // Apply search filters
    return this.databaseItemModel
      .find({ $or: filters })
      .sort({ timestamp: -1 })
      .lean();
  }

  async deleteDatabaseItem(id: string, user?: any) {
    if (!id) throw new Error('Missing id')
    const res = await this.databaseItemModel.findByIdAndDelete(id).lean()
    if (!res) {
      return { success: false, message: 'Item not found' }
    }

    // Send Discord webhook with deleted item info (if configured)
    try {
      const webhookUrl = process.env.DISCORD_ITEM_DATABASE_WEBHOOK_URL
      if (webhookUrl) {
        const item = res as any
        const createdAt = item.timestamp ? new Date(item.timestamp).toISOString() : undefined
        const raw = JSON.stringify(item, null, 2)
        // Discord embed description has limits; truncate raw JSON if too long
        const maxDesc = 1900
        const rawForDesc = raw.length > maxDesc ? raw.slice(0, maxDesc) + '\n... (truncated)' : raw

        const deleter = (user && (user.discordProfile?.username || user.username || user.name)) || 'unknown'
        const embed: any = {
          title: `Item deleted from database: ${item.itemName || 'unknown'}`,
          color: 16711680, // red
          fields: [
            { name: 'Item Name', value: String(item.itemName || 'N/A'), inline: true },
            { name: 'Owner', value: String(item.owner || 'N/A'), inline: true },
            { name: 'UUID', value: String(item.uuid || 'N/A'), inline: true },
            { name: 'Deleted by', value: String(deleter), inline: true },
            { name: 'Timestamp', value: String(createdAt || 'N/A'), inline: false },
          ],
          description: `\n\`\`\`json\n${rawForDesc}\n\`\`\``,
          timestamp: new Date().toISOString(),
        }

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        }).catch((e) => {
          // swallow webhook errors but log
          console.error('Failed to send Discord webhook for deleted item:', e)
        })
      }
    } catch (e) {
      console.error('Error while attempting webhook send:', e)
    }

    return { success: true }
  }


}
