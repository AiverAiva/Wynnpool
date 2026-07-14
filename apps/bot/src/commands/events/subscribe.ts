import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { buildSubscriptionView, V2_FLAGS } from '@/utils/eventSubscriptionView';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('subscribe')
  .setDescription('Manage your world event subscriptions');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch user's current subscriptions + all events in parallel
    const [subsRes, eventsRes] = await Promise.all([
      fetch(
        `${API_BASE}/world-event/subscription?discordUserId=${interaction.user.id}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } },
      ),
      fetch(`${API_BASE}/world-event`),
    ]);

    if (!subsRes.ok || !eventsRes.ok) {
      await interaction.editReply('❌ Failed to load subscription data. Please try again later.');
      return;
    }

    const subsData = (await subsRes.json()) as any;
    const eventsData = (await eventsRes.json()) as any[];

    // Build subscribed events set (internalNames)
    const subscribedEvents = new Set<string>(subsData.user?.events || []);

    // Build displayName → internalName map from API data
    const eventMap = new Map<string, string>();
    for (const event of eventsData) {
      const displayName = event.name || event.internalName;
      eventMap.set(displayName, event.internalName);
    }

    // Build and send the subscription view (defaults to first region)
    const container = buildSubscriptionView(0, subscribedEvents, eventMap);

    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
