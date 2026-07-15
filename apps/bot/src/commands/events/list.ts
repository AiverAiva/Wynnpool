import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getRegionForEvent } from '@wynnpool/shared';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('list')
  .setDescription('Show your subscribed world events');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch subscriptions + all events in parallel to resolve display names
    const [subsRes, eventsRes] = await Promise.all([
      fetch(
        `${API_BASE}/world-event/subscription?discordUserId=${interaction.user.id}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } },
      ),
      fetch(`${API_BASE}/world-event`),
    ]);

    if (!subsRes.ok || !eventsRes.ok) throw new Error('Failed to fetch data');

    const json = (await subsRes.json()) as any;
    const allEvents = (await eventsRes.json()) as any[];

    // Build internalName → displayName map
    const nameMap = new Map<string, string>();
    for (const event of allEvents) {
      nameMap.set(event.internalName, event.name || event.internalName);
    }

    // Helper to format a single event line with region
    const formatEvent = (internalName: string): string => {
      const displayName = nameMap.get(internalName) || internalName;
      const region = getRegionForEvent(displayName);
      return region ? `• **${displayName}** *(${region})*` : `• **${displayName}**`;
    };

    const userEvents = json.user?.events || [];
    const channels = json.channels || [];

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'World Event Subscriptions' })
      .setColor(0x00b0f4);

    if (userEvents.length === 0 && channels.length === 0) {
      embed.setDescription('You have no subscriptions. Use `/events subscribe` to add one.');
    } else {
      if (userEvents.length > 0) {
        embed.addFields({
          name: '📩 DM Notifications',
          value: userEvents.map(formatEvent).join('\n') || 'None',
        });
      }
      if (channels.length > 0) {
        for (const ch of channels) {
          embed.addFields({
            name: `📢 <#${ch.channelId}>`,
            value: ch.events.map(formatEvent).join('\n') || 'None',
          });
        }
      }
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
