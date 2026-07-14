import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('list')
  .setDescription('Show your subscribed world events');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const res = await fetch(
      `${API_BASE}/world-event/subscription?discordUserId=${interaction.user.id}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    );
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = (await res.json()) as any;

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
          value: userEvents.map((e: string) => `• ${e}`).join('\n') || 'None',
        });
      }
      if (channels.length > 0) {
        for (const ch of channels) {
          embed.addFields({
            name: `📢 <#${ch.channelId}>`,
            value: ch.events.map((e: string) => `• ${e}`).join('\n') || 'None',
          });
        }
      }
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
