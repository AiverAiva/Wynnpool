import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Guild } from './guild.schema';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel('Guild') private readonly guildModel: Model<Guild>,
  ) {}

  async getGuildByPlayerUuid(playerUuid: string) {
    const guild = await this.guildModel.findOne({
      $or: [
        { [`members.owner.${playerUuid}`]: { $exists: true } },
        { [`members.chief.${playerUuid}`]: { $exists: true } },
        { [`members.strategist.${playerUuid}`]: { $exists: true } },
        { [`members.captain.${playerUuid}`]: { $exists: true } },
        { [`members.recruiter.${playerUuid}`]: { $exists: true } },
        { [`members.recruit.${playerUuid}`]: { $exists: true } },
      ],
    });

    if (!guild) {
      return null;
    }

    let playerRank = '';
    for (const rank of ['owner', 'chief', 'strategist', 'captain', 'recruiter', 'recruit']) {
      if (guild.members[rank] && guild.members[rank][playerUuid]) {
        playerRank = rank;
        break;
      }
    }

    return {
      guild_uuid: guild.uuid,
      guild_name: guild.name,
      guild_prefix: guild.prefix,
      player_uuid: playerUuid,
      player_rank: playerRank,
    };
  }
}
