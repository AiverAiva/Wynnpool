import {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import logger from '@/utils/logger';

export type PoolFilter = 'aspects' | 'tomes' | 'everything';

export const FILTER_OPTIONS: { label: string; value: PoolFilter; description: string }[] = [
  { label: 'Show Aspects only', value: 'aspects', description: 'Only show Aspect items' },
  { label: 'Show Tomes only', value: 'tomes', description: 'Only show Tome items' },
  { label: 'Show Everything', value: 'everything', description: 'Show all items' },
];

export const RARITY_ORDER: Record<string, number> = {
  Mythic: 0,
  Fabled: 1,
  Legendary: 2,
  Rare: 3,
  Unique: 4,
  Set: 5,
  Common: 6,
};

export const RARITY_COLORS: Record<string, string> = {
  Mythic: '💜',
  Fabled: '❤️',
  Legendary: '💙',
  Rare: '💗',
  Unique: '💛',
  Set: '🩵',
  Common: '🤍',
};

interface ShinyStat {
  shinyRerolls: number;
  statType: { displayName: string; key: string };
  value: number;
}

interface PoolItem {
  name: string;
  rarity: string;
  amount: number;
  shiny?: boolean;
  shinyStat?: ShinyStat | null;
  itemType?: string;
}

interface PoolRegion {
  region: string;
  items: PoolItem[];
  timestamp: string;
  type: string;
}

export interface PoolData {
  regions: PoolRegion[];
}

export async function fetchPoolData(url: string): Promise<PoolData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return (await res.json()) as PoolData;
  } catch (e) {
    logger.error(`Failed to fetch pool data from ${url}:`, e);
    return null;
  }
}

function groupItemsByRarity(items: PoolItem[]): Map<string, PoolItem[]> {
  const grouped = new Map<string, PoolItem[]>();
  for (const item of items) {
    const rarity = item.rarity || 'Common';
    if (!grouped.has(rarity)) grouped.set(rarity, []);
    grouped.get(rarity)!.push(item);
  }

  const sorted = new Map<string, PoolItem[]>();
  const entries = [...grouped.entries()].sort(
    (a, b) => (RARITY_ORDER[a[0]] ?? 99) - (RARITY_ORDER[b[0]] ?? 99)
  );
  for (const [rarity, items] of entries) {
    sorted.set(rarity, items);
  }
  return sorted;
}

function formatItemList(items: PoolItem[]): string {
  const prefix = RARITY_COLORS[items[0]?.rarity] || '•';
  return items.map((item) => {
    const amountStr = item.amount > 1 ? ` x${item.amount}` : '';
    if (item.shiny && item.shinyStat) {
      const stat = item.shinyStat.statType.displayName;
      const value = item.shinyStat.value;
      return `${prefix} ✨ ${item.name}${amountStr} [${stat}: ${value}]`;
    }
    if (item.shiny) {
      return `${prefix} ✨ ${item.name}${amountStr}`;
    }
    return `${prefix} ${item.name}${amountStr}`;
  }).join('\n');
}

export function buildPoolContainer(
  regionName: string,
  regionData: PoolRegion,
  allRegions: PoolRegion[],
  abbrevMap: Record<string, string>,
  buttonPrefix: 'lootpool' | 'raidpool',
  accentColor: number = 0x00b0f4,
  filter?: PoolFilter,
  selectMenuConfig?: { region: string; filter: PoolFilter }
): ContainerBuilder {
  let items = regionData.items;
  if (filter === 'aspects') {
    items = items.filter(i => i.itemType === 'AspectItem');
  } else if (filter === 'tomes') {
    items = items.filter(i => i.itemType === 'TomeItem');
  }

  const grouped = groupItemsByRarity(items);

  let itemText = '';
  for (const [rarity, items] of grouped) {
    itemText += `**${rarity}**\n${formatItemList(items)}\n\n`;
  }
  if (!itemText) itemText = '*No items matching filter*';

  const regionAbbr = abbrevMap[regionName] || regionName;
  const header = `## ${regionAbbr} Pool`;
  const timestamp = `*Last updated: ${regionData.timestamp}*`;

  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(header)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(timestamp)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(itemText.trim())
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

  if (selectMenuConfig) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`raidpool_filter:${selectMenuConfig.region}`)
      .setPlaceholder(FILTER_OPTIONS.find(o => o.value === selectMenuConfig.filter)?.label || 'Filter items')
      .addOptions(
        FILTER_OPTIONS.map(opt => ({
          label: opt.label,
          value: opt.value,
          description: opt.description,
          default: opt.value === selectMenuConfig.filter,
        }))
      );
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    container.addActionRowComponents(selectRow);
  }

  const buttons = allRegions.map((r) => {
    const abbr = abbrevMap[r.region] || r.region;
    const isSelected = r.region === regionName;
    const customId = buttonPrefix === 'raidpool'
      ? `${buttonPrefix}:${r.region}:${filter || 'aspects'}`
      : `${buttonPrefix}:${r.region}`;
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(abbr)
      .setStyle(isSelected ? ButtonStyle.Secondary : ButtonStyle.Primary);
  });

  for (let i = 0; i < buttons.length; i += 5) {
    const chunk = buttons.slice(i, i + 5);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(chunk);
    container.addActionRowComponents(row);
  }

  return container;
}

export const V2_FLAGS = MessageFlags.IsComponentsV2;
