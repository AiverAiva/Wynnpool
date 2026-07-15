import { ButtonInteraction, StringSelectMenuInteraction, MessageFlags } from 'discord.js';
import logger from '@/utils/logger';
import {
  buildSubscriptionView,
  V2_FLAGS,
  parseUserToggleCustomId,
  parseChannelToggleCustomId,
  parseUserAllCustomId,
  parseChannelAllCustomId,
  parseRegionValue,
  CUSTOM_ID_REGION_SELECT,
  CUSTOM_ID_CH_REGION_SELECT,
} from '@/utils/eventSubscriptionView';
import { WORLD_EVENT_REGIONS } from '@wynnpool/shared';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

// --- API helpers ---

/** Fetch subscriptions for a user (personal DM subscriptions). */
async function fetchUserSubscriptions(
  discordUserId: string,
): Promise<{ subscribed: Set<string>; eventMap: Map<string, string> } | null> {
  const [subsRes, eventsRes] = await Promise.all([
    fetch(
      `${API_BASE}/world-event/subscription?discordUserId=${discordUserId}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    ),
    fetch(`${API_BASE}/world-event`),
  ]);
  if (!subsRes.ok || !eventsRes.ok) return null;

  const subsData = (await subsRes.json()) as any;
  const eventsData = (await eventsRes.json()) as any[];

  const subscribed = new Set<string>(subsData.user?.events || []);
  const eventMap = new Map<string, string>();
  for (const event of eventsData) {
    eventMap.set(event.name || event.internalName, event.internalName);
  }
  return { subscribed, eventMap };
}

/** Fetch subscriptions for a channel. */
async function fetchChannelSubscriptions(
  channelId: string,
): Promise<{ subscribed: Set<string>; eventMap: Map<string, string> } | null> {
  const [subsRes, eventsRes] = await Promise.all([
    fetch(
      `${API_BASE}/world-event/subscription?discordChannelId=${channelId}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    ),
    fetch(`${API_BASE}/world-event`),
  ]);
  if (!subsRes.ok || !eventsRes.ok) return null;

  const subsData = (await subsRes.json()) as any;
  const eventsData = (await eventsRes.json()) as any[];

  // findByUser returns { user: {events:[]}, channels: [{channelId, events:[]}] }
  // For channel query, the events are under channels[0].events
  const channelEvents = subsData.channels?.[0]?.events || subsData.user?.events || [];
  const subscribed = new Set<string>(channelEvents);
  const eventMap = new Map<string, string>();
  for (const event of eventsData) {
    eventMap.set(event.name || event.internalName, event.internalName);
  }
  return { subscribed, eventMap };
}

async function subscribeUser(discordUserId: string, internalName: string): Promise<void> {
  await fetch(`${API_BASE}/world-event/subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ type: 'user', discordUserId, eventInternalName: internalName }),
  });
}

async function unsubscribeUser(discordUserId: string, internalName: string): Promise<void> {
  await fetch(
    `${API_BASE}/world-event/subscription?type=user&discordUserId=${discordUserId}&eventInternalName=${encodeURIComponent(internalName)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${API_KEY}` } },
  );
}

async function subscribeChannel(
  discordUserId: string,
  guildId: string,
  channelId: string,
  internalName: string,
): Promise<void> {
  await fetch(`${API_BASE}/world-event/subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      type: 'channel',
      discordUserId,
      discordGuildId: guildId,
      discordChannelId: channelId,
      eventInternalName: internalName,
    }),
  });
}

async function unsubscribeChannel(channelId: string, internalName: string): Promise<void> {
  await fetch(
    `${API_BASE}/world-event/subscription?type=channel&discordUserId=${channelId}&eventInternalName=${encodeURIComponent(internalName)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${API_KEY}` } },
  );
}

// --- Button handlers ---

/** Handle user event toggle button click (weu_toggle). */
export async function handleUserToggleButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseUserToggleCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex, internalName } = parsed;
  const userId = interaction.user.id;

  await interaction.deferUpdate();

  try {
    const data = await fetchUserSubscriptions(userId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const isSubscribed = data.subscribed.has(internalName);
    if (isSubscribed) {
      await unsubscribeUser(userId, internalName);
      data.subscribed.delete(internalName);
    } else {
      await subscribeUser(userId, internalName);
      data.subscribed.add(internalName);
    }

    const container = buildSubscriptionView(regionIndex, data.subscribed, data.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling user toggle button:', err);
  }
}

/** Handle channel event toggle button click (wec_toggle). */
export async function handleChannelToggleButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseChannelToggleCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex, channelId, internalName } = parsed;
  const userId = interaction.user.id;

  await interaction.deferUpdate();

  try {
    const data = await fetchChannelSubscriptions(channelId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Need guildId for channel subscribe
    const guildId = interaction.guild?.id;
    if (!guildId) return;

    const isSubscribed = data.subscribed.has(internalName);
    if (isSubscribed) {
      await unsubscribeChannel(channelId, internalName);
      data.subscribed.delete(internalName);
    } else {
      await subscribeChannel(userId, guildId, channelId, internalName);
      data.subscribed.add(internalName);
    }

    // Get channel name for display
    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    const channelName = (channel as any)?.name;

    const container = buildSubscriptionView(
      regionIndex,
      data.subscribed,
      data.eventMap,
      channelId,
      channelName,
    );
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling channel toggle button:', err);
  }
}

/** Handle user Subscribe All / Unsubscribe All (weu_all). */
export async function handleUserAllButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseUserAllCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex } = parsed;
  const userId = interaction.user.id;
  const region = WORLD_EVENT_REGIONS[regionIndex];
  if (!region) return;

  await interaction.deferUpdate();

  try {
    const data = await fetchUserSubscriptions(userId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const regionInternalNames = region.events
      .map(name => data.eventMap.get(name))
      .filter((n): n is string => !!n);

    const allSubscribed = regionInternalNames.every(n => data.subscribed.has(n));

    if (allSubscribed) {
      await Promise.all(
        regionInternalNames.filter(n => data.subscribed.has(n)).map(n => {
          data.subscribed.delete(n);
          return unsubscribeUser(userId, n);
        }),
      );
    } else {
      await Promise.all(
        regionInternalNames.filter(n => !data.subscribed.has(n)).map(n => {
          data.subscribed.add(n);
          return subscribeUser(userId, n);
        }),
      );
    }

    const container = buildSubscriptionView(regionIndex, data.subscribed, data.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling user all button:', err);
  }
}

/** Handle channel Subscribe All / Unsubscribe All (wec_all). */
export async function handleChannelAllButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseChannelAllCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex, channelId } = parsed;
  const userId = interaction.user.id;
  const region = WORLD_EVENT_REGIONS[regionIndex];
  if (!region) return;

  const guildId = interaction.guild?.id;
  if (!guildId) return;

  await interaction.deferUpdate();

  try {
    const data = await fetchChannelSubscriptions(channelId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const regionInternalNames = region.events
      .map(name => data.eventMap.get(name))
      .filter((n): n is string => !!n);

    const allSubscribed = regionInternalNames.every(n => data.subscribed.has(n));

    if (allSubscribed) {
      await Promise.all(
        regionInternalNames.filter(n => data.subscribed.has(n)).map(n => {
          data.subscribed.delete(n);
          return unsubscribeChannel(channelId, n);
        }),
      );
    } else {
      await Promise.all(
        regionInternalNames.filter(n => !data.subscribed.has(n)).map(n => {
          data.subscribed.add(n);
          return subscribeChannel(userId, guildId, channelId, n);
        }),
      );
    }

    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    const channelName = (channel as any)?.name;

    const container = buildSubscriptionView(
      regionIndex,
      data.subscribed,
      data.eventMap,
      channelId,
      channelName,
    );
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling channel all button:', err);
  }
}

// --- Select menu handlers ---

/** Handle user region select (weu_region). */
export async function handleUserRegionSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const regionIndex = parseRegionValue(interaction.values[0]);
  if (regionIndex === null) return;

  const userId = interaction.user.id;
  await interaction.deferUpdate();

  try {
    const data = await fetchUserSubscriptions(userId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const container = buildSubscriptionView(regionIndex, data.subscribed, data.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling user region select:', err);
  }
}

/** Handle channel region select (wec_region:<channelId>). */
export async function handleChannelRegionSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const customIdParts = interaction.customId.split(':');
  if (customIdParts.length < 2) return;
  const channelId = customIdParts[1];

  const regionIndex = parseRegionValue(interaction.values[0]);
  if (regionIndex === null) return;

  await interaction.deferUpdate();

  try {
    const data = await fetchChannelSubscriptions(channelId);
    if (!data) {
      await interaction.followUp({ content: '❌ Failed to load data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    const channelName = (channel as any)?.name;

    const container = buildSubscriptionView(
      regionIndex,
      data.subscribed,
      data.eventMap,
      channelId,
      channelName,
    );
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling channel region select:', err);
  }
}
