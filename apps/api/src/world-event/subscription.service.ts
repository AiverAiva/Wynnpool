import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface CreateSubscriptionDto {
  type: 'user' | 'channel';
  discordUserId: string;
  discordGuildId?: string;
  discordChannelId?: string;
  eventInternalName: string;
}

@Injectable()
export class SubscriptionService {
  private readonly COLLECTION = 'world_event_subscriptions';

  constructor(@InjectConnection() private connection: Connection) {}

  async create(dto: CreateSubscriptionDto): Promise<void> {
    const coll = this.connection.collection(this.COLLECTION);

    // Validate event exists
    const event = await this.connection
      .collection('world_events')
      .findOne({ internalName: dto.eventInternalName });
    if (!event) {
      throw new Error(`Event "${dto.eventInternalName}" not found`);
    }

    // Validate channel type requires guild+channel
    if (dto.type === 'channel' && (!dto.discordGuildId || !dto.discordChannelId)) {
      throw new Error('Channel subscription requires discordGuildId and discordChannelId');
    }

    // Check duplicate
    const dupFilter: Record<string, any> = {
      type: dto.type,
      eventInternalName: dto.eventInternalName,
    };
    if (dto.type === 'user') {
      dupFilter.discordUserId = dto.discordUserId;
    } else {
      dupFilter.discordChannelId = dto.discordChannelId;
    }
    const existing = await coll.findOne(dupFilter);
    if (existing) {
      throw new Error('Subscription already exists');
    }

    await coll.insertOne({
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async delete(type: 'user' | 'channel', discordUserId: string, eventInternalName: string): Promise<boolean> {
    const coll = this.connection.collection(this.COLLECTION);
    const filter: Record<string, any> = { type, eventInternalName };
    if (type === 'user') {
      filter.discordUserId = discordUserId;
    } else {
      filter.discordChannelId = discordUserId; // parameter overload: discordUserId holds channelId for channel type
    }
    const result = await coll.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async findByUser(discordUserId: string) {
    const coll = this.connection.collection(this.COLLECTION);
    const docs = await coll.find({ discordUserId }).toArray();
    const userEvents: string[] = [];
    const channels: Map<string, { guildId: string; channelId: string; events: string[] }> = new Map();

    for (const doc of docs) {
      if (doc.type === 'user') {
        userEvents.push(doc.eventInternalName);
      } else {
        const key = doc.discordChannelId;
        if (!channels.has(key)) {
          channels.set(key, {
            guildId: doc.discordGuildId,
            channelId: doc.discordChannelId,
            events: [],
          });
        }
        channels.get(key)!.events.push(doc.eventInternalName);
      }
    }

    return {
      user: { discordUserId, events: userEvents },
      channels: Array.from(channels.values()),
    };
  }

  async findByEvent(eventInternalName: string) {
    const coll = this.connection.collection(this.COLLECTION);
    const docs = await coll.find({ eventInternalName }).toArray();

    const userSubscriptions: string[] = [];
    const channelSubscriptions: { guildId: string; channelId: string }[] = [];

    for (const doc of docs) {
      if (doc.type === 'user') {
        userSubscriptions.push(doc.discordUserId);
      } else {
        channelSubscriptions.push({
          guildId: doc.discordGuildId,
          channelId: doc.discordChannelId,
        });
      }
    }

    return { eventInternalName, userSubscriptions, channelSubscriptions };
  }
}
