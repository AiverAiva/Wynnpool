
export async function sendToWebhook(data: {
  action: 'created' | 'updated' | 'deleted';
  author: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  description?: string;
  diff?: Record<string, { old?: number; new?: number }>;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const { action, author, item_id, weight_name, weight_id, diff, description } = data;

  const fields =
    diff &&
    Object.entries(diff).map(([key, val]) => {
      const isNumber =
        (typeof val.old === 'number' || typeof val.new === 'number') &&
        (key !== 'description' && key !== 'weight_name');
      let value: string;
      if (isNumber) {
        if (action === 'deleted') {
          value = `**${(val.old! * 100).toFixed(1)}%**`;
        } else if (val.old != null && val.new != null) {
          value = `~~${(val.old * 100).toFixed(1)}%~~ → **${(val.new * 100).toFixed(1)}%**`;
        } else {
          value = `**${(val.new! * 100).toFixed(1)}%**`;
        }
      } else {
        // String diff (description, weight_name, etc)
        if (val.old != null && val.new != null) {
          value = `~~${val.old}~~ → **${val.new}**`;
        } else if (val.new != null) {
          value = `**${val.new}**`;
        } else {
          value = `~~${val.old}~~`;
        }
      }
      return {
        name: key.replace(/([A-Z])/g, ' $1'),
        value,
        inline: true,
      };
    });

  const payload = {
    embeds: [
      {
        title: `Weight ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `**${weight_name}** for *${item_id}* (${weight_id})` + (description ? `\n${description}` : ''),
        color: action === 'created' ? 0x57f287 : action === 'updated' ? 0xfaa61a : 0xed4245,
        fields: fields?.length ? fields : undefined,
        footer: { text: `By ${author}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
