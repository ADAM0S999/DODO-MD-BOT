'use strict';

/**
 * ADAM Bot — plugins/ping.js
 * Simple connectivity and latency check.
 */

const { bot } = require('../lib/');

bot(
  {
    pattern  : 'ping',
    desc     : 'Check bot latency',
    category : 'general',
    usage    : '.ping',
  },
  async (sock, msg, { jid, reply }) => {
    const start = Date.now();
    const sent  = await reply('⚡ Pinging…');
    const latency = Date.now() - start;
    await reply(`⚡ *ADAM is online!*\n📶 Latency: *${latency}ms*`);
  }
);
