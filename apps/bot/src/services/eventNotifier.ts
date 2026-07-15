import { Client, EmbedBuilder } from 'discord.js';
import logger from '@/utils/logger';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

interface ScheduleEntry {
  internalName: string;
  schedule: string | null;
  polledAt: string;
}

export class EventNotifier {
  private previousSchedules = new Map<string, string | null>();
  private notifiedKeys = new Set<string>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private client: Client | null = null;
  private initialized = false;

  start(client: Client): void {
    this.client = client;
    logger.info('Event notifier started (polling every 30s)');
    this.poll();
    this.intervalId = setInterval(() => this.poll(), 30_000);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    logger.info('Event notifier stopped');
  }

  private async poll(): Promise<void> {
    try {
      const schedule = await this.fetchSchedule();
      if (!schedule) return;

      // First poll: establish baseline without notifying
      // (prevents spamming all existing schedules on bot restart)
      if (!this.initialized) {
        for (const entry of schedule) {
          this.previousSchedules.set(entry.internalName, entry.schedule);
          if (entry.schedule) {
            this.notifiedKeys.add(`${entry.internalName}:${entry.schedule}`);
          }
        }
        this.initialized = true;
        logger.info('Event notifier baseline established');
        return;
      }

      for (const entry of schedule) {
        const prev = this.previousSchedules.get(entry.internalName);

        if (entry.schedule !== null && prev !== entry.schedule) {
          const notifyKey = `${entry.internalName}:${entry.schedule}`;
          if (!this.notifiedKeys.has(notifyKey)) {
            this.notifiedKeys.add(notifyKey);
            await this.notify(entry.internalName, entry.schedule);
          }
        }
      }

      // Update cache
      for (const entry of schedule) {
        this.previousSchedules.set(entry.internalName, entry.schedule);
      }
    } catch (err) {
      logger.error('Event notifier poll error:', err);
    }
  }

  private async fetchSchedule(): Promise<ScheduleEntry[] | null> {
    const res = await fetch(`${API_BASE}/world-event/schedule`);
    if (!res.ok) {
      logger.error(`Schedule API error: ${res.status}`);
      return null;
    }
    return res.json() as Promise<ScheduleEntry[]>;
  }

  private async notify(eventInternalName: string, schedule: string): Promise<void> {
    if (!this.client) return;

    logger.info(`New event schedule detected: ${eventInternalName}`);

    try {
      // Get subscribers
      const subsRes = await fetch(
        `${API_BASE}/world-event/subscription?eventInternalName=${encodeURIComponent(eventInternalName)}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } },
      );
      if (!subsRes.ok) {
        logger.error(`Failed to fetch subscribers: ${subsRes.status}`);
        return;
      }
      const subs = await subsRes.json() as any;

      // Fetch event details for embed
      const eventRes = await fetch(`${API_BASE}/world-event`);
      let event: any = null;
      if (eventRes.ok) {
        const events = await eventRes.json() as any[];
        event = events.find((e: any) => e.internalName === eventInternalName) || null;
      }

      const embed = this.buildEmbed(event, schedule);

      // Send DMs
      for (const userId of (subs.userSubscriptions || [])) {
        try {
          const user = await this.client.users.fetch(userId);
          await user.send({ embeds: [embed] });
        } catch (err) {
          logger.warn(`Failed to DM ${userId}:`, err);
        }
      }

      // Send channel messages
      for (const ch of (subs.channelSubscriptions || [])) {
        try {
          const channel = await this.client.channels.fetch(ch.channelId);
          if (channel && 'send' in channel) {
            await (channel as any).send({ embeds: [embed] });
          }
        } catch (err) {
          logger.warn(`Failed to notify channel ${ch.channelId}:`, err);
        }
      }
    } catch (err) {
      logger.error(`Notification error for ${eventInternalName}:`, err);
    }
  }

  private buildEmbed(event: any, schedule: string): EmbedBuilder {
    const name = event?.name || event?.internalName || 'Unknown Event';

    // Parse schedule ISO timestamp to Unix seconds for Discord dynamic timestamp
    const ts = Math.floor(new Date(schedule).getTime() / 1000);
    // <t:TIMESTAMP:R> = relative ("in 12 minutes"), <t:TIMESTAMP:F> = full date/time
    const timeDisplay = isNaN(ts)
      ? 'Soon'
      : `<t:${ts}:F> (<t:${ts}:R>)`;

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'World Event Notification' })
      .setTitle(`🌍 ${name}`)
      .setDescription(`**Starts:** ${timeDisplay}`)
      .setColor(0x00b0f4)
      .setTimestamp()
      .setURL('https://www.wynnpool.com/events');

    return embed;
  }
}
