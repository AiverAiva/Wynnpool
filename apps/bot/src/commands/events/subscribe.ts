import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildSubscriptionView, V2_FLAGS } from '@/utils/eventSubscriptionView';

const API_BASE = process.env.API_BASE_URL || 'https://api.wynnpool.com';
const API_KEY = process.env.API_INTERNAL_KEY || '';

export const data = new SlashCommandSubcommandBuilder()
  .setName('subscribe')
  .setDescription('Manage your world event subscriptions (DM or channel)')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Channel to manage (admin only). Omit for personal DM subscriptions.')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel');

  // If a channel is specified, require admin permission
  if (channel) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: 'You need Administrator permission to manage channel subscriptions.', ephemeral: true });
      return;
    }
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch subscriptions + all events in parallel
    const subsQuery = channel
      ? `discordChannelId=${channel.id}`
      : `discordUserId=${interaction.user.id}`;

    const [subsRes, eventsRes] = await Promise.all([
      fetch(
        `${API_BASE}/world-event/subscription?${subsQuery}`,
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

    // Determine subscribed events set
    let subscribedEvents: Set<string>;
    if (channel) {
      // Channel subscriptions come back under channels[0].events
      subscribedEvents = new Set<string>(subsData.channels?.[0]?.events || subsData.user?.events || []);
    } else {
      subscribedEvents = new Set<string>(subsData.user?.events || []);
    }

    // Build displayName → internalName map
    const eventMap = new Map<string, string>();
    for (const event of eventsData) {
      eventMap.set(event.name || event.internalName, event.internalName);
    }

    // Build and send the subscription view
    const container = buildSubscriptionView(
      0,
      subscribedEvents,
      eventMap,
      channel ? channel.id : undefined,
      channel ? (channel as any).name : undefined,
    );

    await interaction.editReply({ components: [container], flags: V2_FLAGS });
  } catch (err: any) {
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
