import { Client, ApplicationEmoji } from 'discord.js';

let _emojis: Record<string, string> = {};

/**
 * Fetches all application emojis and builds a name→string map.
 * Call this once after client is ready.
 */
export async function initEmojis(client: Client) {
  // Fetch the full Collection<Snowflake, ApplicationEmoji>
  const appEmojis = await client.application!.emojis.fetch();

  // Build our lookup map: name => "<:name:id>"
  _emojis = appEmojis.reduce<Record<string,string>>((map, emoji) => {
    map[emoji.name!] = emoji.toString();
    return map;
  }, {});
}

/**
 * Returns the map of emoji strings by name.
 * e.g. getEmojis('bean') === "<:bean:1234567890>"
 */
export function getEmojis(name: string) {
  return _emojis[name];
}