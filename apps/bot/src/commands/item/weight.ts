import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  AutocompleteInteraction
} from 'discord.js';
import logger from '@/utils/logger';

let mythicItems: string[] = [];
let mythicItemsLoaded = false;

async function fetchMythicItems() {
  try {
    const res = await fetch('https://api.wynnpool.com/item/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "$and": [
          {
            "tier": {
              "$in": [
                "mythic"
              ]
            }
          },
          {
            "$or": [
              {
                "type": "weapon"
              },
              {
                "type": "armour"
              }
            ]
          }
        ]
      })
    });
    if (!res.ok) throw new Error('Failed to fetch mythic items');
    const data = (await res.json()) as Array<{ id: string }>;
    mythicItems = data.map(item => item.id);
    mythicItemsLoaded = true;
  } catch (e) {
    logger.error('Failed to fetch mythic items', e);
    mythicItems = [];
    mythicItemsLoaded = false;
  }
}

// Fetch on startup
fetchMythicItems();

export const data = new SlashCommandSubcommandBuilder()
  .setName('weight')
  .setDescription('Get Wynnpool weights for a mythic item')
  .addStringOption(opt =>
    opt.setName('item')
      .setDescription('Mythic item name')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (!mythicItemsLoaded) await fetchMythicItems();
  const focused = interaction.options.getFocused();
  const filtered = mythicItems.filter(name =>
    name.toLowerCase().includes(focused.toLowerCase())
  ).slice(0, 25);
  await interaction.respond(filtered.map(name => ({ name, value: name })));
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemName = interaction.options.getString('item', true);
  if (!mythicItemsLoaded) await fetchMythicItems();
  if (!mythicItems.includes(itemName)) {
    await interaction.reply({
      content: `❌ Invalid item name. Please select an item from the autocomplete list.`,
      ephemeral: true
    });
    return;
  }
  await interaction.deferReply();
  try {
    const res = await fetch(`https://api.wynnpool.com/item/${encodeURIComponent(itemName)}/weight`);
    if (!res.ok) throw new Error('Failed to fetch weight data');
    const data = (await res.json()) as Array<{ weight_name: string; identifications?: Record<string, number> }>;
    if (!Array.isArray(data) || data.length === 0) {
      await interaction.editReply('No weight data found for this item.');
      return;
    }
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wynnpool Weight System' })
      .setTitle(`**${itemName} Weight**`)
      .setDescription(
        '[Full Weights List](https://www.wynnpool.com/item/weight)\n\n' +
        data.map(scale => {
          const stats = Object.entries(scale.identifications || {})
            .map(([stat, value]) => `     ${stat}:  ${((value as number) * 100).toFixed(1)}%`).join('\n');
          return `**${scale.weight_name}**\n${stats}`;
        }).join('\n\n')
      )
      .setColor('#00b0f4')
      .setFooter({
        text: 'Website',
        iconURL: 'https://www.wynnpool.com/'
      })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (e: any) {
    logger.error(e);
    await interaction.editReply(`❌ Error: ${e.message}`);
  }
}
