import { Client, Events, GatewayIntentBits, Interaction, Partials } from 'discord.js';
import { DISCORD_TOKEN } from '@/config';
import { getCommandHandler, getAutocompleteHandler } from '@/handlers/commandHandler';
import logger from '@/utils/logger';
import { initEmojis } from './utils/emojiFactory';
import { fetchPoolData, buildPoolContainer, V2_FLAGS } from '@/utils/poolRenderer';
import type { PoolFilter } from '@/utils/poolRenderer';
import { LOOTRUN_URL, LOOTRUN_ABBREVS } from '@/commands/lootpool';
import { RAIDPOOL_URL, RAID_ABBREVS, DEFAULT_RAID_FILTER } from '@/commands/raidpool';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages // DM support
  ],
  partials: [Partials.Channel] // Required to receive DMs
});
client.once(Events.ClientReady, async () => {
  logger.info(`Logged in as ${client.user?.tag}`);
  await initEmojis(client);
  logger.info(`Emojis initialized`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    const subcommand = interaction.options.getSubcommand(false) ?? undefined;
    const autocompleteHandler = getAutocompleteHandler(commandName, subcommand);
    if (autocompleteHandler) {
      try {
        await autocompleteHandler(interaction);
      } catch (err) {
        logger.error('Error in autocomplete handler:', err);
      }
    }
    return;
  }
  if (interaction.isButton()) {
    const [prefix, ...rest] = interaction.customId.split(':');

    if (prefix === 'lootpool' || prefix === 'raidpool') {
      let regionName: string;
      let filter: PoolFilter | undefined;

      if (prefix === 'raidpool') {
        const lastColon = interaction.customId.lastIndexOf(':');
        filter = interaction.customId.substring(lastColon + 1) as PoolFilter;
        regionName = interaction.customId.substring(prefix.length + 1, lastColon);
      } else {
        regionName = rest.join(':');
      }

      const url = prefix === 'lootpool' ? LOOTRUN_URL : RAIDPOOL_URL;
      const abbrevs = prefix === 'lootpool' ? LOOTRUN_ABBREVS : RAID_ABBREVS;

      try {
        const poolData = await fetchPoolData(url);
        if (!poolData) {
          await interaction.reply({ content: 'Failed to fetch pool data.', ephemeral: true });
          return;
        }

        const regionData = poolData.regions.find(r => r.region === regionName);
        if (!regionData) {
          await interaction.reply({ content: 'Region not found.', ephemeral: true });
          return;
        }

        const container = buildPoolContainer(
          regionName,
          regionData,
          poolData.regions,
          abbrevs,
          prefix as 'lootpool' | 'raidpool',
          0x00b0f4,
          filter,
          prefix === 'raidpool' ? { region: regionName, filter: filter || DEFAULT_RAID_FILTER } : undefined
        );

        await interaction.update({ components: [container], flags: V2_FLAGS });
      } catch (err) {
        logger.error('Error handling pool button:', err);
        await interaction.reply({ content: 'Error updating pool view.', ephemeral: true });
      }
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    const [prefix, ...regionParts] = interaction.customId.split(':');

    if (prefix === 'raidpool_filter') {
      const regionName = regionParts.join(':');
      const filter = interaction.values[0] as PoolFilter;

      try {
        const poolData = await fetchPoolData(RAIDPOOL_URL);
        if (!poolData) {
          await interaction.reply({ content: 'Failed to fetch pool data.', ephemeral: true });
          return;
        }

        const regionData = poolData.regions.find(r => r.region === regionName);
        if (!regionData) {
          await interaction.reply({ content: 'Region not found.', ephemeral: true });
          return;
        }

        const container = buildPoolContainer(
          regionName,
          regionData,
          poolData.regions,
          RAID_ABBREVS,
          'raidpool',
          0x00b0f4,
          filter,
          { region: regionName, filter }
        );

        await interaction.update({ components: [container], flags: V2_FLAGS });
      } catch (err) {
        logger.error('Error handling raidpool filter:', err);
        await interaction.reply({ content: 'Error updating pool view.', ephemeral: true });
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const subcommand = interaction.options.getSubcommand(false) ?? undefined;
  const handler = getCommandHandler(commandName, subcommand);

  if (!handler) return interaction.reply({ content: 'Command not found.', ephemeral: true });

  try {
    await handler(interaction);
  } catch (err) {
    logger.error('Error executing command:', err);
    const content = 'Error executing command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(content);
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

(async () => {
  await client.login(DISCORD_TOKEN)
    .then(() => logger.info('Bot login successful'))
    .catch(err => logger.error('Login failed', err));
})();
