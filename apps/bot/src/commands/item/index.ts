import { data as weightData, autocomplete as weightAutocomplete, execute as weightExecute } from './weight';
import { SlashCommandBuilder, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { data as analyzeData } from './analyze';

export const data = new SlashCommandBuilder()
  .setName('item')
  .setDescription('Item-related commands')
  .addSubcommand(() => analyzeData)
  .addSubcommand(() => weightData);

export const autocomplete = async (interaction: AutocompleteInteraction) => {
  if (interaction.options.getSubcommand() === 'weight') {
    return weightAutocomplete(interaction);
  }
};

// export async function execute(interaction: ChatInputCommandInteraction) {
//   const sub = interaction.options.getSubcommand();
//   if (sub === 'analyze') {
//     const { execute } = await import('./analyze');
//     return execute(interaction);
//   }
//   if (sub === 'weight') {
//     return weightExecute(interaction);
//   }
// }
