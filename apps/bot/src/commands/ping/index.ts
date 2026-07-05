import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')
  .setContexts([0, 1, 2]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Pong!');
}
