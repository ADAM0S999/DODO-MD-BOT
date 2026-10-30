'use strict';

/**
 * ADAM Bot — lib/events.js
 * Central command registry. All plugins call addCommand() to register handlers.
 */

/** @type {Array<CommandDef>} */
const commands = [];

/**
 * Register a command with the bot.
 *
 * @param {object}   options
 * @param {string|RegExp|string[]} options.pattern  - Command pattern(s)
 * @param {string}   [options.alias]                - Additional aliases
 * @param {string}   [options.desc]                 - Short description shown in menu
 * @param {string}   [options.category]             - Menu category (group, media, ai, …)
 * @param {string}   [options.usage]                - Usage hint, e.g. ".kick @user"
 * @param {boolean}  [options.fromMe=false]         - Only respond to the bot owner
 * @param {boolean}  [options.isGroup=false]        - Only works inside groups
 * @param {boolean}  [options.adminOnly=false]      - Group admins only
 * @param {boolean}  [options.botAdmin=false]       - Requires bot to be group admin
 * @param {boolean}  [options.isMedia=false]        - Requires a media message
 * @param {boolean}  [options.isQuoted=false]       - Requires a quoted message
 * @param {boolean}  [options.hidden=false]         - Hide from menu
 * @param {boolean}  [options.noPrefix=false]       - Pattern is matched without prefix
 * @param {Function} handler                        - Async handler (client, message, { args, text, … })
 */
const addCommand = (options, handler) => {
  if (!options || !handler) throw new Error('addCommand requires options and a handler function.');

  const patterns = Array.isArray(options.pattern)
    ? options.pattern
    : [options.pattern];

  for (const pattern of patterns) {
    commands.push({
      pattern,
      alias      : options.alias      || null,
      desc       : options.desc       || '',
      category   : options.category   || 'misc',
      usage      : options.usage      || '',
      fromMe     : options.fromMe     || false,
      isGroup    : options.isGroup    || false,
      adminOnly  : options.adminOnly  || false,
      botAdmin   : options.botAdmin   || false,
      isMedia    : options.isMedia    || false,
      isQuoted   : options.isQuoted   || false,
      hidden     : options.hidden     || false,
      noPrefix   : options.noPrefix   || false,
      handler,
    });
  }
};

/**
 * Find all commands matching a given text input.
 * @param {string} text - Raw message text
 * @param {string} prefix - Configured prefix character
 * @returns {Array<{cmd: CommandDef, match: RegExpMatchArray}>}
 */
const findCommands = (text, prefix = '.') => {
  const results = [];
  for (const cmd of commands) {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex;

    if (cmd.pattern instanceof RegExp) {
      regex = cmd.pattern;
    } else if (typeof cmd.pattern === 'string') {
      const pat = cmd.noPrefix
        ? `^${cmd.pattern}(\\s+.*)?$`
        : `^${escapedPrefix}${cmd.pattern}(\\s+.*)?$`;
      regex = new RegExp(pat, 'i');
    } else {
      continue;
    }

    const match = text.match(regex);
    if (match) results.push({ cmd, match });
  }
  return results;
};

/**
 * Get all commands grouped by category.
 * @returns {Record<string, CommandDef[]>}
 */
const getCommandsByCategory = () => {
  const categories = {};
  for (const cmd of commands) {
    if (cmd.hidden) continue;
    if (!categories[cmd.category]) categories[cmd.category] = [];
    categories[cmd.category].push(cmd);
  }
  return categories;
};

module.exports = { addCommand, commands, findCommands, getCommandsByCategory };
