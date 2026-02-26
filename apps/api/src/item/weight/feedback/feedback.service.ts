import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getFeedbackForWeight(weightId: string) {
    const collection = this.connection.collection('weight_feedback');
    const feedbacks = await collection.find({ weight_id: weightId }).toArray();
    
    const upvotes = feedbacks.filter(f => f.vote === 'upvote').length;
    const downvotes = feedbacks.filter(f => f.vote === 'downvote').length;
    
    return {
      weight_id: weightId,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      total: feedbacks.length,
    };
  }

  async getUserVoteForWeight(weightId: string, discordId: string) {
    const collection = this.connection.collection('weight_feedback');
    const feedback = await collection.findOne({ weight_id: weightId, discord_id: discordId });
    return feedback?.vote || null;
  }

  async submitVote(weightId: string, discordId: string, vote: 'upvote' | 'downvote') {
    if (!discordId) {
      throw new UnauthorizedException('User must be authenticated via Discord');
    }

    const collection = this.connection.collection('weight_feedback');
    const existing = await collection.findOne({ weight_id: weightId, discord_id: discordId });

    if (existing) {
      if (existing.vote === vote) {
        // Revoke the vote if the same vote type is submitted again
        await collection.deleteOne({ weight_id: weightId, discord_id: discordId });
        return { success: true, action: 'revoked', vote };
      }
      await collection.updateOne(
        { weight_id: weightId, discord_id: discordId },
        { $set: { vote, created_at: Date.now() } }
      );
      return { success: true, action: 'updated', vote };
    }

    await collection.insertOne({
      weight_id: weightId,
      discord_id: discordId,
      vote,
      created_at: Date.now(),
    });

    return { success: true, action: 'created', vote };
  }

  async removeVote(weightId: string, discordId: string) {
    const collection = this.connection.collection('weight_feedback');
    const result = await collection.deleteOne({ weight_id: weightId, discord_id: discordId });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Vote not found');
    }
    
    return { success: true };
  }

  async getAllFeedbackForWeights(weightIds: string[], discordId?: string) {
    const collection = this.connection.collection('weight_feedback');
    const feedbacks = await collection.find({ weight_id: { $in: weightIds } }).toArray();
    
    const result: Record<string, { upvotes: number; downvotes: number; score: number; total: number; userVote: string | null }> = {};
    
    for (const weightId of weightIds) {
      const weightFeedbacks = feedbacks.filter(f => f.weight_id === weightId);
      const upvotes = weightFeedbacks.filter(f => f.vote === 'upvote').length;
      const downvotes = weightFeedbacks.filter(f => f.vote === 'downvote').length;
      const userVote = discordId 
        ? weightFeedbacks.find(f => f.discord_id === discordId)?.vote || null 
        : null;
      
      result[weightId] = {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        total: weightFeedbacks.length,
        userVote,
      };
    }
    
    return result;
  }
}
