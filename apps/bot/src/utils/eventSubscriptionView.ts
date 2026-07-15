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
import { WORLD_EVENT_REGIONS } from '@wynnpool/shared';

export const V2_FLAGS = MessageFlags.IsComponentsV2;

// customId prefixes — 'u' suffix = user subscriptions, 'c' suffix = channel subscriptions
export const CUSTOM_ID_REGION_SELECT = 'weu_region';
export const CUSTOM_ID_TOGGLE_PREFIX = 'weu_toggle';
export const CUSTOM_ID_ALL_PREFIX = 'weu_all';

export const CUSTOM_ID_CH_REGION_SELECT = 'wec_region';
export const CUSTOM_ID_CH_TOGGLE_PREFIX = 'wec_toggle';
export const CUSTOM_ID_CH_ALL_PREFIX = 'wec_all';

/**
 * Build the full subscription management container for a given region.
 *
 * @param regionIndex     Index into WORLD_EVENT_REGIONS
 * @param subscribedEvents Set of internalNames currently subscribed to
 * @param eventMap        Map of displayName -> internalName (from API)
 * @param channelId       If set, this is a channel subscription view
 * @param channelName     Channel display name for the header (optional)
 */
export function buildSubscriptionView(
  regionIndex: number,
  subscribedEvents: Set<string>,
  eventMap: Map<string, string>,
  channelId?: string,
  channelName?: string,
): ContainerBuilder {
  const isChannel = !!channelId;
  const region = WORLD_EVENT_REGIONS[regionIndex] ?? WORLD_EVENT_REGIONS[0];
  const safeIndex = WORLD_EVENT_REGIONS.indexOf(region);

  const regionSelectId = isChannel
    ? `${CUSTOM_ID_CH_REGION_SELECT}:${channelId}`
    : CUSTOM_ID_REGION_SELECT;
  const togglePrefix = isChannel ? CUSTOM_ID_CH_TOGGLE_PREFIX : CUSTOM_ID_TOGGLE_PREFIX;
  const allPrefix = isChannel ? CUSTOM_ID_CH_ALL_PREFIX : CUSTOM_ID_ALL_PREFIX;

  // --- Region select dropdown ---
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(regionSelectId)
    .setPlaceholder('Select a region')
    .addOptions(
      WORLD_EVENT_REGIONS.map((r, i) => ({
        label: r.name,
        value: i.toString(),
        default: i === safeIndex,
      })),
    );
  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  // --- Event buttons ---
  const buttons: ButtonBuilder[] = [];
  let subscribedCount = 0;
  let totalCount = 0;

  for (const displayName of region.events) {
    const internalName = eventMap.get(displayName);
    if (!internalName) continue;

    totalCount++;
    const isSubscribed = subscribedEvents.has(internalName);
    if (isSubscribed) subscribedCount++;

    const customId = isChannel
      ? `${togglePrefix}:${safeIndex}:${channelId}:${internalName}`
      : `${togglePrefix}:${safeIndex}:${internalName}`;

    buttons.push(
      new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(displayName)
        .setStyle(isSubscribed ? ButtonStyle.Success : ButtonStyle.Secondary),
    );
  }

  // --- Subscribe/Unsubscribe All button ---
  const allCustomId = isChannel
    ? `${allPrefix}:${safeIndex}:${channelId}`
    : `${allPrefix}:${safeIndex}`;

  const allButton = new ButtonBuilder()
    .setCustomId(allCustomId)
    .setLabel(
      subscribedCount === totalCount && totalCount > 0
        ? `✅ Unsubscribe All (${subscribedCount}/${totalCount})`
        : `Subscribe All (${subscribedCount}/${totalCount})`,
    )
    .setStyle(
      subscribedCount === totalCount && totalCount > 0
        ? ButtonStyle.Danger
        : ButtonStyle.Primary,
    );

  // --- Build container ---
  const title = isChannel && channelName
    ? `## 🌍 World Event Subscriptions — #${channelName}`
    : '## 🌍 World Event Subscriptions';

  const container = new ContainerBuilder()
    .setAccentColor(0x00b0f4)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        isChannel
          ? `Editing channel subscriptions for <#${channelId}>. Toggle buttons to subscribe/unsubscribe.`
          : 'Toggle buttons to subscribe/unsubscribe. Green = subscribed. Select a region below.',
      ),
    )
    .addActionRowComponents(selectRow)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${region.name}`));

  for (let i = 0; i < buttons.length; i += 5) {
    const chunk = buttons.slice(i, i + 5);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(chunk);
    container.addActionRowComponents(row);
  }

  if (buttons.length > 0) {
    const allRow = new ActionRowBuilder<ButtonBuilder>().addComponents(allButton);
    container.addActionRowComponents(allRow);
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('*No events found for this region.*'),
    );
  }

  return container;
}

// --- Parsing helpers ---

/** Parse user toggle: weu_toggle:<regionIndex>:<internalName> */
export function parseUserToggleCustomId(
  customId: string,
): { regionIndex: number; internalName: string } | null {
  const parts = customId.split(':');
  if (parts.length < 3 || parts[0] !== CUSTOM_ID_TOGGLE_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  const internalName = parts.slice(2).join(':');
  return { regionIndex, internalName };
}

/** Parse channel toggle: wec_toggle:<regionIndex>:<channelId>:<internalName> */
export function parseChannelToggleCustomId(
  customId: string,
): { regionIndex: number; channelId: string; internalName: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4 || parts[0] !== CUSTOM_ID_CH_TOGGLE_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  const channelId = parts[2];
  const internalName = parts.slice(3).join(':');
  return { regionIndex, channelId, internalName };
}

/** Parse user all: weu_all:<regionIndex> */
export function parseUserAllCustomId(customId: string): { regionIndex: number } | null {
  const parts = customId.split(':');
  if (parts.length !== 2 || parts[0] !== CUSTOM_ID_ALL_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  return { regionIndex };
}

/** Parse channel all: wec_all:<regionIndex>:<channelId> */
export function parseChannelAllCustomId(
  customId: string,
): { regionIndex: number; channelId: string } | null {
  const parts = customId.split(':');
  if (parts.length !== 3 || parts[0] !== CUSTOM_ID_CH_ALL_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  return { regionIndex, channelId: parts[2] };
}

/** Parse region select value (shared by user and channel). */
export function parseRegionValue(value: string): number | null {
  const idx = parseInt(value, 10);
  if (isNaN(idx) || idx < 0 || idx >= WORLD_EVENT_REGIONS.length) return null;
  return idx;
}
