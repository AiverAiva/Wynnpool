import { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import logger from '@/utils/logger';
import {
  buildSubscriptionView,
  V2_FLAGS,
  parseToggleCustomId,
  parseAllCustomId,
  parseRegionValue,
} from '@/utils/eventSubscriptionView';
import { WORLD_EVENT_REGIONS } from '@/data/worldEventRegions';

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

/** Subscribe or unsubscribe a single event for a user. */
async function toggleSubscription(
  discordUserId: string,
  internalName: string,
  isSubscribed: boolean,
): Promise<void> {
  if (isSubscribed) {
    // Unsubscribe
    await fetch(
      `${API_BASE}/world-event/subscription?type=user&discordUserId=${discordUserId}&eventInternalName=${encodeURIComponent(internalName)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    );
  } else {
    // Subscribe
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
}

/** Handle event toggle button click. */
export async function handleEventToggleButton(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseToggleCustomId(interaction.customId);
  if (!parsed) return;

  const { regionIndex, internalName } = parsed;
  const userId = interaction.user.id;

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.reply({ content: '❌ Failed to load subscription data.', ephemeral: true });
      return;
    }

    const isSubscribed = userData.subscribed.has(internalName);
    await toggleSubscription(userId, internalName, isSubscribed);

    // Update local state for re-render
    if (isSubscribed) {
      userData.subscribed.delete(internalName);
    } else {
      userData.subscribed.add(internalName);
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.update({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling event toggle button:', err);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ content: '❌ Error updating subscription.', ephemeral: true });
    }
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

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.reply({ content: '❌ Failed to load subscription data.', ephemeral: true });
      return;
    }

    // Determine action: if all are subscribed → unsubscribe all; otherwise → subscribe all
    const regionInternalNames = region.events
      .map(name => userData.eventMap.get(name))
      .filter((n): n is string => !!n);

    const allSubscribed = regionInternalNames.every(n => userData.subscribed.has(n));

    for (const internalName of regionInternalNames) {
      const isSubscribed = userData.subscribed.has(internalName);
      if (allSubscribed && isSubscribed) {
        // Unsubscribe
        await fetch(
          `${API_BASE}/world-event/subscription?type=user&discordUserId=${userId}&eventInternalName=${encodeURIComponent(internalName)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${API_KEY}` },
          },
        );
        userData.subscribed.delete(internalName);
      } else if (!allSubscribed && !isSubscribed) {
        // Subscribe
        await fetch(`${API_BASE}/world-event/subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            type: 'user',
            discordUserId: userId,
            eventInternalName: internalName,
          }),
        });
        userData.subscribed.add(internalName);
      }
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.update({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling event all button:', err);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ content: '❌ Error updating subscriptions.', ephemeral: true });
    }
  }
}

/** Handle region select menu change. */
export async function handleRegionSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const regionIndex = parseRegionValue(interaction.values[0]);
  if (regionIndex === null) return;

  const userId = interaction.user.id;

  try {
    const userData = await fetchUserData(userId);
    if (!userData) {
      await interaction.reply({ content: '❌ Failed to load subscription data.', ephemeral: true });
      return;
    }

    const container = buildSubscriptionView(regionIndex, userData.subscribed, userData.eventMap);
    await interaction.update({ components: [container], flags: V2_FLAGS });
  } catch (err) {
    logger.error('Error handling region select:', err);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ content: '❌ Error changing region.', ephemeral: true });
    }
  }
}
