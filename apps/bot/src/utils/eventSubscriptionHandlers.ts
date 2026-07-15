import { ButtonInteraction, StringSelectMenuInteraction, MessageFlags } from 'discord.js';
import logger from '@/utils/logger';
import {
  buildSubscriptionView,
  V2_FLAGS,
  parseToggleCustomId,
  parseAllCustomId,
  parseRegionValue,
} from '@/utils/eventSubscriptionView';
import { WORLD_EVENT_REGIONS } from '@wynnpool/shared';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

/** Fetch the user's subscribed events (internalNames) + all events from API. */
async function fetchUserData(
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
    const displayName = event.name || event.internalName;
    eventMap.set(displayName, event.internalName);
  }

  return { subscribed, eventMap };
}

/** Subscribe a user to an event via API. */
async function subscribeEvent(discordUserId: string, internalName: string): Promise<void> {
  await fetch(`${API_BASE}/world-event/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      type: 'user',
      discordUserId,
      eventInternalName: internalName,
    }),
  });
}

/** Unsubscribe a user from an event via API. */
async function unsubscribeEvent(discordUserId: string, internalName: string): Promise<void> {
  await fetch(
    `${API_BASE}/world-event/subscription?type=user&discordUserId=${discordUserId}&eventInternalName=${encodeURIComponent(internalName)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
  );
}

/** Handle event toggle button click. */
export async function handleEventToggleButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseToggleCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex, internalName } = parsed;
  const userId = interaction.user.id;

  // Defer immediately — Discord interactions expire in 3s
  await interaction.deferUpdate();

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.followUp({ content: '❌ Failed to load subscription data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const isSubscribed = userData.subscribed.has(internalName);
    if (isSubscribed) {
      await unsubscribeEvent(userId, internalName);
      userData.subscribed.delete(internalName);
    } else {
      await subscribeEvent(userId, internalName);
      userData.subscribed.add(internalName);
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling event toggle button:', err);
  }
}

/** Handle Subscribe All / Unsubscribe All button click. */
export async function handleEventAllButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseAllCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex } = parsed;
  const userId = interaction.user.id;
  const region = WORLD_EVENT_REGIONS[regionIndex];
  if (!region) return;

  // Defer immediately — bulk operations take time
  await interaction.deferUpdate();

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.followUp({ content: '❌ Failed to load subscription data.', flags: MessageFlags.Ephemeral });
      return;
    }

    // Determine action: if all are subscribed → unsubscribe all; otherwise → subscribe all
    const regionInternalNames = region.events
      .map(name => userData.eventMap.get(name))
      .filter((n): n is string => !!n);

    const allSubscribed = regionInternalNames.every(n => userData.subscribed.has(n));

    // Parallelize all API calls for speed
    if (allSubscribed) {
      // Unsubscribe all
      await Promise.all(
        regionInternalNames
          .filter(n => userData.subscribed.has(n))
          .map(n => {
            userData.subscribed.delete(n);
            return unsubscribeEvent(userId, n);
          }),
      );
    } else {
      // Subscribe all that aren't subscribed
      await Promise.all(
        regionInternalNames
          .filter(n => !userData.subscribed.has(n))
          .map(n => {
            userData.subscribed.add(n);
            return subscribeEvent(userId, n);
          }),
      );
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling event all button:', err);
  }
}

/** Handle region select menu change. */
export async function handleRegionSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const regionIndex = parseRegionValue(interaction.values[0]);
  if (regionIndex === null) return;

  const userId = interaction.user.id;

  // Defer immediately
  await interaction.deferUpdate();

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.followUp({ content: '❌ Failed to load subscription data.', flags: MessageFlags.Ephemeral });
      return;
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling region select:', err);
  }
}
