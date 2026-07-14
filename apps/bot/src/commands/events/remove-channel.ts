import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('remove-channel')
  .setDescription('Remove world event notifications from this server (admin only)');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: 'You need Administrator permission.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Find channel subscriptions for this guild
    const res = await fetch(
      `${API_BASE}/world-event/subscription?discordUserId=${interaction.user.id}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    );
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    const json = await res.json() as any;

    const channelSubs = (json.channels || []).filter(
      (ch: any) => ch.guildId === interaction.guild!.id,
    );

    if (channelSubs.length === 0) {
      await interaction.editReply('❌ No channel notifications set up for this server.');
      return;
    }

    // Delete each channel subscription
    let deletedCount = 0;
    for (const sub of channelSubs) {
      for (const eventName of sub.events) {
        const delRes = await fetch(
          `${API_BASE}/world-event/subscription?type=channel&discordUserId=${sub.channelId}&eventInternalName=${encodeURIComponent(eventName)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${API_KEY}` },
          },
        );
        const delJson = await delRes.json() as any;
        if (delJson.success) deletedCount++;
      }
    }

    await interaction.editReply(`✅ Removed channel notifications (${deletedCount} subscriptions deleted).`);
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
