import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

import { data as subscribeData, execute as subscribeExecute } from './subscribe';
import { data as listData, execute as listExecute } from './list';
import { data as setupChannelData, execute as setupChannelExecute } from './setup-channel';
import { data as removeChannelData, execute as removeChannelExecute } from './remove-channel';

export const data = new SlashCommandBuilder()
  .setName('events')
  .setDescription('World event notification subscriptions')
  .setContexts([0, 1, 2])
  .addSubcommand(() => subscribeData)
  .addSubcommand(() => listData)
  .addSubcommand(() => setupChannelData)
  .addSubcommand(() => removeChannelData);

// Fallback handler if user runs /events without subcommand
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: 'Please use a subcommand: `/events subscribe`, `/events list`, `/events setup-channel`, or `/events remove-channel`.',
    ephemeral: true,
  });
}
