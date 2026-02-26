import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

interface SuggestionDoc {
  _id: any;
  weight_id: string;
  discord_id: string;
  content: string;
  anonymous: boolean;
  discord_username: string;
  discord_avatar: string;
  created_at: number;
}

@Injectable()
export class SuggestionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getSuggestionsForWeight(weightId: string) {
    const collection = this.connection.collection('weight_suggestions');
    const suggestions = await collection.find({ weight_id: weightId }).sort({ created_at: -1 }).toArray();
    
    return suggestions.map(s => ({
      _id: s._id.toString(),
      weight_id: s.weight_id,
      discord_id: s.anonymous ? null : s.discord_id,
      content: s.content,
      anonymous: s.anonymous,
      discord_username: s.anonymous ? 'Anonymous' : s.discord_username,
      discord_avatar: s.anonymous ? null : s.discord_avatar,
      created_at: s.created_at,
    }));
  }

  async getUserSuggestionForWeight(weightId: string, discordId: string) {
    const collection = this.connection.collection('weight_suggestions');
    const suggestion = await collection.findOne({ weight_id: weightId, discord_id: discordId });
    
    if (!suggestion) return null;
    
    return {
      _id: suggestion._id.toString(),
      weight_id: suggestion.weight_id,
      discord_id: suggestion.discord_id,
      content: suggestion.content,
      anonymous: suggestion.anonymous,
      discord_username: suggestion.anonymous ? 'Anonymous' : suggestion.discord_username,
      discord_avatar: suggestion.anonymous ? null : suggestion.discord_avatar,
      created_at: suggestion.created_at,
    };
  }

  async createSuggestion(
    weightId: string, 
    discordId: string, 
    content: string, 
    anonymous: boolean,
    discordProfile: { username: string; avatar: string }
  ) {
    if (!discordId) {
      throw new UnauthorizedException('User must be authenticated via Discord');
    }

    if (!content || content.trim().length === 0) {
      throw new ConflictException('Suggestion content cannot be empty');
    }

    if (content.length > 1000) {
      throw new ConflictException('Suggestion content must be less than 1000 characters');
    }

    const collection = this.connection.collection('weight_suggestions');
    const existing = await collection.findOne({ weight_id: weightId, discord_id: discordId });

    if (existing) {
      await collection.updateOne(
        { weight_id: weightId, discord_id: discordId },
        { 
          $set: { 
            content: content.trim(),
            anonymous,
            discord_username: discordProfile.username,
            discord_avatar: discordProfile.avatar,
            created_at: Date.now(),
          } 
        }
      );
      
      const updated = await collection.findOne({ weight_id: weightId, discord_id: discordId });
      if (!updated) {
        throw new ConflictException('Failed to update suggestion');
      }
      return {
        _id: updated._id.toString(),
        weight_id: updated.weight_id,
        discord_id: anonymous ? null : updated.discord_id,
        content: updated.content,
        anonymous: updated.anonymous,
        discord_username: anonymous ? 'Anonymous' : updated.discord_username,
        discord_avatar: anonymous ? null : updated.discord_avatar,
        created_at: updated.created_at,
      };
    }

    const result = await collection.insertOne({
      weight_id: weightId,
      discord_id: discordId,
      content: content.trim(),
      anonymous,
      discord_username: discordProfile.username,
      discord_avatar: discordProfile.avatar,
      created_at: Date.now(),
    });

    return {
      _id: result.insertedId.toString(),
      weight_id: weightId,
      discord_id: anonymous ? null : discordId,
      content: content.trim(),
      anonymous,
      discord_username: anonymous ? 'Anonymous' : discordProfile.username,
      discord_avatar: anonymous ? null : discordProfile.avatar,
      created_at: Date.now(),
    };
  }

  async deleteSuggestion(weightId: string, suggestionId: string, discordId: string) {
    const collection = this.connection.collection('weight_suggestions');
    
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(suggestionId);
    } catch {
      throw new NotFoundException('Suggestion not found');
    }
    
    const suggestion = await collection.findOne({ _id: objectId });
    
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (suggestion.discord_id !== discordId) {
      throw new UnauthorizedException('You can only delete your own suggestions');
    }

    await collection.deleteOne({ _id: objectId });
    return { success: true };
  }

  async getSuggestionCountForWeight(weightId: string): Promise<number> {
    const collection = this.connection.collection('weight_suggestions');
    return collection.countDocuments({ weight_id: weightId });
  }
}
