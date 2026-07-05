import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { fetchPoolData, buildPoolContainer, V2_FLAGS } from '@/utils/poolRenderer';
import type { PoolFilter } from '@/utils/poolRenderer';
import logger from '@/utils/logger';

export const RAIDPOOL_URL = 'https://api.wynnpool.com/raidpool';
export const DEFAULT_RAID_FILTER: PoolFilter = 'aspects';

export const RAID_ABBREVS: Record<string, string> = {
  'Nest of the Grootslangs': 'NOTG',
  "Orphion's Nexus of Light": 'NOL',
  'The Canyon Colossus': 'TCC',
  'The Nameless Anomaly': 'TNA',
  'The Wartorn Palace': 'TWP',
};

export const data = new SlashCommandBuilder()
  .setName('raidpool')
  .setDescription('Show the current raid pool')
  .setContexts([0, 1, 2]);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const poolData = await fetchPoolData(RAIDPOOL_URL);
  if (!poolData || !poolData.regions.length) {
    await interaction.editReply('Failed to fetch raid pool data.');
    return;
  }

  const firstRegion = poolData.regions[0];
  const filter = DEFAULT_RAID_FILTER;
  const container = buildPoolContainer(
    firstRegion.region,
    firstRegion,
    poolData.regions,
    RAID_ABBREVS,
    'raidpool',
    0x00b0f4,
    filter,
    { region: firstRegion.region, filter }
  );

  await interaction.editReply({ components: [container], flags: V2_FLAGS });
}
