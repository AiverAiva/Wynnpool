import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('setup-channel')
  .setDescription('Set a channel for world event notifications (admin only)')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('The channel to send notifications to')
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'You need Administrator permission to set up channel notifications.', ephemeral: true });
    return;
  }

  const channel = interaction.options.getChannel('channel', true);
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch all events and subscribe this channel to each
    const eventsRes = await fetch(`${API_BASE}/world-event`);
    if (!eventsRes.ok) throw new Error('Failed to fetch events');
    const events: any[] = await eventsRes.json() as any[];

    let successCount = 0;
    for (const event of events) {
      const res = await fetch(`${API_BASE}/world-event/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          type: 'channel',
          discordUserId: interaction.user.id,
          discordGuildId: interaction.guild.id,
          discordChannelId: channel.id,
          eventInternalName: event.internalName,
        }),
      });
      const json = await res.json() as any;
      if (json.success) successCount++;
    }

    await interaction.editReply(
      `✅ Channel notifications set up in <#${channel.id}>! Subscribed to ${successCount} events.`,
    );
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
