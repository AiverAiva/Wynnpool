import { Controller, Post, Get, Delete, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { SubscriptionService, CreateSubscriptionDto } from './subscription.service';

@Controller('world-event/subscription')
@UseGuards(InternalAuthGuard)
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSubscriptionDto) {
    try {
      await this.service.create(dto);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Query('type') type: 'user' | 'channel',
    @Query('discordUserId') discordUserId: string,
    @Query('eventInternalName') eventInternalName: string,
  ) {
    const deleted = await this.service.delete(type, discordUserId, eventInternalName);
    return { success: deleted };
  }

  @Get()
  async find(
    @Query('discordUserId') discordUserId?: string,
    @Query('eventInternalName') eventInternalName?: string,
    @Query('discordChannelId') discordChannelId?: string,
  ) {
    if (eventInternalName) {
      return this.service.findByEvent(eventInternalName);
    }
    if (discordUserId) {
      return this.service.findByUser(discordUserId);
    }
    if (discordChannelId) {
      return this.service.findByUser(discordChannelId);
    }
    return { error: 'Provide at least one query parameter' };
  }
}
