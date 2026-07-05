import path from 'path';
import fs from 'fs';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { CLIENT_ID, DISCORD_TOKEN } from '@/config';
import logger from '@/utils/logger';

const commandsMap = new Map<string, Function>();
const autocompleteMap = new Map<string, Function>();
const slashCommands: any[] = [];

/**
 * Recursively loads command modules.
 * - If module.data is a SlashCommandBuilder, register it for push.
 * - If module.execute exists, register its handler under key.
 */
function loadCommandsRecursively(dir: string, baseCmd?: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadCommandsRecursively(fullPath, file);
      continue;
    }
    // Skip declaration files and non-ts/js files
if (file.endsWith('.d.ts') || (!file.endsWith('.ts') && !file.endsWith('.js'))) continue;

    const commandModule = require(fullPath);
    const isIndex = path.parse(file).name === 'index';

    // Registration: push parent builders
    if (commandModule.data instanceof SlashCommandBuilder) {
      if (isIndex) {
        slashCommands.push(commandModule.data.toJSON());
        logger.silly(`➕ Queued for registration: ${commandModule.data.name}`, {
          // definition: commandModule.data.toJSON()
        });
      }
    }

    // Execution: map handlers for all commands & subcommands
    if (typeof commandModule.execute === 'function') {
      const base = baseCmd ?? path.parse(file).name;
      const key = isIndex
        ? base
        : `${baseCmd}.${path.parse(file).name}`;

      commandsMap.set(key, commandModule.execute);
      logger.silly(`🗂️  Registered handler key="${key}" for module ${file}`);
    }
    // Autocomplete: map handlers for all commands & subcommands
    if (typeof commandModule.autocomplete === 'function') {
      const base = baseCmd ?? path.parse(file).name;
      const key = isIndex
        ? base
        : `${baseCmd}.${path.parse(file).name}`;
      autocompleteMap.set(key, commandModule.autocomplete);
      logger.silly(`🔎 Registered autocomplete key="${key}" for module ${file}`);
    }
  }
}

loadCommandsRecursively(path.join(__dirname, '../commands'));

export function getCommandHandler(commandName: string, subcommandName?: string) {
  const key = subcommandName ? `${commandName}.${subcommandName}` : commandName;
  return commandsMap.get(key);
}

export function getAutocompleteHandler(commandName: string, subcommandName?: string) {
  const key = subcommandName ? `${commandName}.${subcommandName}` : commandName;
  return autocompleteMap.get(key);
}

async function registerSlashCommands() {
  if (!DISCORD_TOKEN || !CLIENT_ID) {
    logger.error('Missing DISCORD_TOKEN or CLIENT_ID in config');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    logger.info('🔄 Registering slash commands...');
    // logger.debug('Full command payloads:', slashCommands);

    const response = await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: slashCommands,
    });

    const names = slashCommands.map(cmd => cmd.name);
    logger.info(`✅ Registered ${names.length} slash commands module.`, {
      ...names,
      // details: slashCommands
    });
  } catch (err) {
    logger.error('Error registering slash commands:', err);
  }
}

registerSlashCommands();
