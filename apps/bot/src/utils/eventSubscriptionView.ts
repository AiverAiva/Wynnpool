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

// customId prefixes
export const CUSTOM_ID_REGION_SELECT = 'we_region';
export const CUSTOM_ID_TOGGLE_PREFIX = 'we_toggle';
export const CUSTOM_ID_ALL_PREFIX = 'we_all';

/**
 * Build the full subscription management container for a given region.
 *
 * @param regionIndex     Index into WORLD_EVENT_REGIONS
 * @param subscribedEvents Set of internalNames the user is currently subscribed to
 * @param eventMap        Map of displayName -> internalName (from API)
 */
export function buildSubscriptionView(
  regionIndex: number,
  subscribedEvents: Set<string>,
  eventMap: Map<string, string>,
): ContainerBuilder {
  const region = WORLD_EVENT_REGIONS[regionIndex] ?? WORLD_EVENT_REGIONS[0];
  const safeIndex = WORLD_EVENT_REGIONS.indexOf(region);

  // --- Region select dropdown ---
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_ID_REGION_SELECT)
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
    if (!internalName) continue; // skip if API doesn't have this event

    totalCount++;
    const isSubscribed = subscribedEvents.has(internalName);
    if (isSubscribed) subscribedCount++;

    // customId: we_toggle:<regionIndex>:<internalName>
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${CUSTOM_ID_TOGGLE_PREFIX}:${safeIndex}:${internalName}`)
        .setLabel(displayName)
        .setStyle(isSubscribed ? ButtonStyle.Success : ButtonStyle.Secondary),
    );
  }

  // --- Subscribe/Unsubscribe All button ---
  const allButton = new ButtonBuilder()
    .setCustomId(`${CUSTOM_ID_ALL_PREFIX}:${safeIndex}`)
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
  const container = new ContainerBuilder()
    .setAccentColor(0x00b0f4)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 🌍 World Event Subscriptions'),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        'Toggle buttons to subscribe/unsubscribe. Green = subscribed. Select a region below.',
      ),
    )
    .addActionRowComponents(selectRow)
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${region.name}`),
    );

  // Chunk event buttons into rows of 5
  for (let i = 0; i < buttons.length; i += 5) {
    const chunk = buttons.slice(i, i + 5);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(chunk);
    container.addActionRowComponents(row);
  }

  // "All" button in its own row
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

/**
 * Parse a customId like "we_toggle:3:The_Anomaly" into its parts.
 * Returns null if the format doesn't match.
 */
export function parseToggleCustomId(
  customId: string,
): { regionIndex: number; internalName: string } | null {
  const parts = customId.split(':');
  if (parts.length < 3 || parts[0] !== CUSTOM_ID_TOGGLE_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  const internalName = parts.slice(2).join(':');
  return { regionIndex, internalName };
}

/**
 * Parse a customId like "we_all:3" into its parts.
 */
export function parseAllCustomId(customId: string): { regionIndex: number } | null {
  const parts = customId.split(':');
  if (parts.length !== 2 || parts[0] !== CUSTOM_ID_ALL_PREFIX) return null;
  const regionIndex = parseInt(parts[1], 10);
  if (isNaN(regionIndex)) return null;
  return { regionIndex };
}

/**
 * Parse region select customId value (e.g., "3" from the dropdown).
 */
export function parseRegionValue(value: string): number | null {
  const idx = parseInt(value, 10);
  if (isNaN(idx) || idx < 0 || idx >= WORLD_EVENT_REGIONS.length) return null;
  return idx;
}
