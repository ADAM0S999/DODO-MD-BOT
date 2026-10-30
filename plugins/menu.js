'use strict';

/**
 * ADAM Bot — plugins/menu.js
 * Shows the bot menu, help text, and command list.
 */

const { bot, getCommandsByCategory, getUptime, getRam, getPlatform } = require('../lib/');
const config = require('../config');

// ── Menu ──────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'menu|help|list',
    desc     : 'Show the bot command menu',
    category : 'general',
    usage    : '.menu',
  },
  async (sock, msg, { jid, reply }) => {
    const categories = getCommandsByCategory();
    const now        = new Date().toLocaleString('en-US', { timeZone: config.TIMEZONE });

    let text = `
╭═══ ⚡ ADAM BOT ⚡ ═══⊷
┃
┃  ⚡ *ADAM WhatsApp Bot*
┃  Version : ${config.VERSION}
┃  Prefix  : ${config.PREFIX}
┃  Uptime  : ${getUptime()}
┃  RAM     : ${getRam()}
┃  Time    : ${now}
┃
╰═══════════════════════⊷\n`;

    for (const [category, cmds] of Object.entries(categories)) {
      text += `\n╭──── ${category.toUpperCase()} ────\n`;
      for (const cmd of cmds) {
        const pat = typeof cmd.pattern === 'string' ? cmd.pattern : cmd.pattern.source;
        text += `┃  ${config.PREFIX}${pat} — ${cmd.desc}\n`;
      }
      text += `╰${'─'.repeat(20)}\n`;
    }

    text += `\n> ⚡ ADAM Bot v${config.VERSION}`;
    await reply(text);
  }
);

// ── Help (single command) ─────────────────────────────────────────────────────
bot(
  {
    pattern  : 'help',
    desc     : 'Get help for a specific command',
    category : 'general',
    usage    : '.help <command>',
    hidden   : true,
  },
  async (sock, msg, { args, reply }) => {
    const query = args[0]?.toLowerCase();
    if (!query) {
      return reply(`╭────────────────╮\n      ⚡ ADAM ⚡\n╰────────────────╯\n\nUse *${config.PREFIX}menu* to see all commands.\nUse *${config.PREFIX}help <command>* for command info.`);
    }

    const { commands } = require('../lib/events');
    const found = commands.find(c => {
      const pat = typeof c.pattern === 'string' ? c.pattern : c.pattern.source;
      return pat.toLowerCase().includes(query);
    });

    if (!found) return reply(`❌ No command found matching *${query}*.`);

    const pat = typeof found.pattern === 'string' ? found.pattern : found.pattern.source;
    await reply(
      `╭────────────────╮\n      ⚡ ADAM ⚡\n╰────────────────╯\n\n` +
      `*Command* : ${config.PREFIX}${pat}\n` +
      `*Category*: ${found.category}\n` +
      `*Desc*    : ${found.desc || 'No description.'}\n` +
      `*Usage*   : ${found.usage || `${config.PREFIX}${pat}`}\n` +
      `*Admin*   : ${found.adminOnly ? 'Yes' : 'No'}\n` +
      `*Group*   : ${found.isGroup ? 'Yes' : 'No'}`
    );
  }
);
