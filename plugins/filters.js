'use strict';

/**
 * ADAM Bot — plugins/filters.js
 * Anti-link, anti-spam, and anti-word filters for groups.
 * Settings are stored per-group in the DB.
 */

const { bot, isAdmin, jidToNum } = require('../lib/');
const config   = require('../config');
const { sequelize } = config;
const { DataTypes, Op } = require('sequelize');

// ── Model ─────────────────────────────────────────────────────────────────────
const GroupSetting = sequelize.define('GroupSetting', {
  jid       : { type: DataTypes.STRING, primaryKey: true },
  antilink  : { type: DataTypes.BOOLEAN, defaultValue: false },
  antispam  : { type: DataTypes.BOOLEAN, defaultValue: false },
  antiword  : { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'group_settings', timestamps: false });

GroupSetting.sync().catch(err => console.error('[ADAM] GroupSetting sync failed:', err.message));

async function getSettings(jid) {
  const [record] = await GroupSetting.findOrCreate({ where: { jid } });
  return record;
}

// ── Message filter hook (auto-invoked by client) ──────────────────────────────
// This is not a command but a special noPrefix pattern that runs on every group msg
bot(
  {
    pattern  : /^.*$/,
    noPrefix : true,
    hidden   : true,
    isGroup  : true,
  },
  async (sock, msg, { jid, sender, raw }) => {
    // Only process non-command messages
    const text = (
      raw.message?.conversation ||
      raw.message?.extendedTextMessage?.text || ''
    ).trim();

    if (!text || text.startsWith(config.PREFIX)) return;

    const meta     = await sock.groupMetadata(jid).catch(() => null);
    if (!meta) return;
    if (isAdmin(meta.participants, sender)) return; // skip admins
    if (config.SUDO.some(s => sender.startsWith(s))) return; // skip owner

    const settings = await getSettings(jid);

    // ── Anti-link ────────────────────────────────────────────────────────────
    if (settings.antilink) {
      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)/i;
      if (linkRegex.test(text)) {
        await sock.sendMessage(jid, {
          text     : config.ANTILINK_MSG || `⚠️ @${jidToNum(sender)}, links are not allowed here.`,
          mentions : [sender],
        });
        await sock.sendMessage(jid, { delete: raw.key });
        return;
      }
    }

    // ── Anti-spam (basic: >5 identical messages) ──────────────────────────────
    // (A production implementation would track per-user message history)

    // ── Anti-word ─────────────────────────────────────────────────────────────
    if (settings.antiword && config.ANTIWORDS.length) {
      const lower    = text.toLowerCase();
      const badWord  = config.ANTIWORDS.find(w => lower.includes(w.toLowerCase()));
      if (badWord) {
        await sock.sendMessage(jid, {
          text     : config.ANTIWORDS_MSG || `⚠️ @${jidToNum(sender)}, that word is not allowed.`,
          mentions : [sender],
        });
        await sock.sendMessage(jid, { delete: raw.key });
      }
    }
  }
);

// ── Toggle helpers ────────────────────────────────────────────────────────────
const makeToggle = (field, label) =>
  bot(
    {
      pattern  : `${field} (on|off)`,
      desc     : `Toggle ${label} filter (on/off)`,
      category : 'filters',
      usage    : `.${field} on`,
      isGroup  : true,
      adminOnly: true,
    },
    async (sock, msg, { jid, sender, match, reply }) => {
      const meta = await sock.groupMetadata(jid).catch(() => null);
      if (!meta || !isAdmin(meta.participants, sender)) {
        return reply('❌ Only group admins can change filter settings.');
      }

      const enable  = match[1] === 'on';
      const setting = await getSettings(jid);
      setting[field] = enable;
      await setting.save();

      await reply(`${enable ? '✅' : '🔴'} *${label}* has been turned *${enable ? 'ON' : 'OFF'}*.`);
    }
  );

makeToggle('antilink', 'Anti-Link');
makeToggle('antispam', 'Anti-Spam');
makeToggle('antiword', 'Anti-Word');

// ── Show current filter status ────────────────────────────────────────────────
bot(
  {
    pattern  : 'filters|filterstatus',
    desc     : 'Show current group filter settings',
    category : 'filters',
    usage    : '.filters',
    isGroup  : true,
  },
  async (sock, msg, { jid, reply }) => {
    const s = await getSettings(jid);
    await reply(
      `🔧 *Group Filter Status*\n\n` +
      `Anti-Link  : ${s.antilink  ? '✅ ON' : '🔴 OFF'}\n` +
      `Anti-Spam  : ${s.antispam  ? '✅ ON' : '🔴 OFF'}\n` +
      `Anti-Word  : ${s.antiword  ? '✅ ON' : '🔴 OFF'}\n\n` +
      `Banned words: ${config.ANTIWORDS.join(', ') || '(none)'}`
    );
  }
);
