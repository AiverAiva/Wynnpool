import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { fetchPoolData, buildPoolContainer, V2_FLAGS } from '@/utils/poolRenderer';
import logger from '@/utils/logger';

export const LOOTRUN_URL = 'https://api.wynnpool.com/lootrun';

export const LOOTRUN_ABBREVS: Record<string, string> = {
  'Canyon of the Lost': 'CotL',
  Corkus: 'Corkus',
  'Fruma Foray (East)': 'FFE',
  'Fruma Foray (West)': 'FFW',
  'Molten Heights': 'Molten',
  'Silent Expanse': 'SE',
  'Sky Islands': 'Sky',
};

export const data = new SlashCommandBuilder()
  .setName('lootpool')
  .setDescription('Show the current lootrun pool')
  .setContexts([0, 1, 2]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const poolData = await fetchPoolData(LOOTRUN_URL);
  if (!poolData || !poolData.regions.length) {
    await interaction.editReply('Failed to fetch lootrun pool data.');
    return;
  }

  const firstRegion = poolData.regions[0];
  const container = buildPoolContainer(
    firstRegion.region,
    firstRegion,
    poolData.regions,
    LOOTRUN_ABBREVS,
    'lootpool'
  );

  await interaction.editReply({ components: [container], flags: V2_FLAGS });
}
