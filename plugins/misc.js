'use strict';

/**
 * ADAM Bot — plugins/misc.js
 * Miscellaneous informational commands.
 */

const { bot, getUptime, getRam, getPlatform } = require('../lib/');
const config = require('../config');
const os     = require('os');

// ── Alive ─────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'alive',
    desc     : 'Check if the bot is alive',
    category : 'general',
    usage    : '.alive',
  },
  async (sock, msg, { reply }) => {
    await reply(
      `╭══ ⚡ ADAM BOT ══╮\n` +
      `┃ Status  : 🟢 Online\n` +
      `┃ Version : ${config.VERSION}\n` +
      `┃ Uptime  : ${getUptime()}\n` +
      `┃ RAM     : ${getRam()}\n` +
      `┃ Platform: ${getPlatform()}\n` +
      `╰═════════════════╯`
    );
  }
);

// ── Uptime ────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'uptime',
    desc     : 'Show bot uptime',
    category : 'general',
    usage    : '.uptime',
  },
  async (sock, msg, { reply }) => {
    await reply(`⏱️ *Uptime:* ${getUptime()}`);
  }
);

// ── Owner ─────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'owner',
    desc     : 'Show bot owner info',
    category : 'general',
    usage    : '.owner',
  },
  async (sock, msg, { reply }) => {
    const owners = config.SUDO;
    if (!owners.length) return reply('No owner configured.');
    const text = owners.map(n => `📱 wa.me/${n}`).join('\n');
    await reply(`👑 *ADAM Bot Owner(s)*\n\n${text}`);
  }
);

// ── Speed / System Info ───────────────────────────────────────────────────────
bot(
  {
    pattern  : 'speed|sysinfo',
    desc     : 'Show system information',
    category : 'general',
    usage    : '.speed',
  },
  async (sock, msg, { reply }) => {
    const cpus   = os.cpus();
    const cpuName = cpus[0]?.model || 'Unknown';
    const load   = os.loadavg().map(l => l.toFixed(2)).join(', ');

    await reply(
      `🖥️ *System Info*\n\n` +
      `CPU    : ${cpuName}\n` +
      `Cores  : ${cpus.length}\n` +
      `Load   : ${load}\n` +
      `RAM    : ${getRam()}\n` +
      `OS     : ${os.type()} ${os.release()}\n` +
      `Node   : ${process.version}\n` +
      `Uptime : ${getUptime()}`
    );
  }
);
