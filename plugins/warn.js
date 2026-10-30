'use strict';

/**
 * ADAM Bot — plugins/warn.js
 * Warning system for group moderation.
 * Stores warnings in the Sequelize DB.
 */

const { bot, isAdmin, jidToNum } = require('../lib/');
const config  = require('../config');
const { sequelize } = config;
const { DataTypes } = require('sequelize');

// ── Model ─────────────────────────────────────────────────────────────────────
const Warning = sequelize.define('Warning', {
  jid   : { type: DataTypes.STRING, allowNull: false },
  group : { type: DataTypes.STRING, allowNull: false },
  count : { type: DataTypes.INTEGER, defaultValue: 0 },
  reasons: { type: DataTypes.TEXT, defaultValue: '[]' },
}, { tableName: 'warnings', timestamps: true });

// Sync the model on load
Warning.sync().catch(err => console.error('[ADAM] Warning model sync failed:', err.message));

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getWarning(jid, group) {
  const [record] = await Warning.findOrCreate({
    where: { jid, group },
    defaults: { count: 0, reasons: '[]' },
  });
  return record;
}

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replace(new RegExp(`{${k}}`, 'g'), v), template);
}

// ── .warn ─────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'warn',
    desc     : 'Warn a group member',
    category : 'group',
    usage    : '.warn @user <reason>',
    isGroup  : true,
    adminOnly: true,
  },
  async (sock, msg, { jid, sender, args, raw, reply }) => {
    if (!isAdmin) return; // handled by client.js

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = raw.message?.extendedTextMessage?.contextInfo?.participant;
    const target = mentioned[0] || quotedParticipant;

    if (!target) return reply('❌ Please mention or reply to the user to warn.\nUsage: `.warn @user <reason>`');

    // Check sender is admin
    const meta = await sock.groupMetadata(jid);
    if (!isAdmin(meta.participants, sender)) return reply('❌ Only admins can warn members.');

    const reason = args.slice(mentioned.length ? 0 : 0).join(' ') || 'No reason given';
    const record = await getWarning(target, jid);
    const reasons = JSON.parse(record.reasons || '[]');
    reasons.push(reason);
    record.count += 1;
    record.reasons = JSON.stringify(reasons);
    await record.save();

    const warnMsg = fillTemplate(config.WARN_MESSAGE, {
      warn : record.count,
      limit: config.WARN_LIMIT,
      reason,
      user : `@${jidToNum(target)}`,
    });

    await sock.sendMessage(jid, { text: warnMsg, mentions: [target] });

    // Auto-kick if limit reached
    if (record.count >= config.WARN_LIMIT) {
      const kickMsg = fillTemplate(config.WARN_KICK_MESSAGE, {
        limit: config.WARN_LIMIT,
        user : `@${jidToNum(target)}`,
      });
      await sock.sendMessage(jid, { text: kickMsg, mentions: [target] });
      try {
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        // Reset warnings after kick
        record.count   = 0;
        record.reasons = '[]';
        await record.save();
      } catch (err) {
        await reply(`⚠️ Could not kick — make sure I am an admin. Error: ${err.message}`);
      }
    }
  }
);

// ── .resetwarn ────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'resetwarn|clearwarn',
    desc     : 'Reset a member\'s warnings',
    category : 'group',
    usage    : '.resetwarn @user',
    isGroup  : true,
    adminOnly: true,
  },
  async (sock, msg, { jid, sender, args, raw, reply }) => {
    const meta = await sock.groupMetadata(jid);
    if (!isAdmin(meta.participants, sender)) return reply('❌ Only admins can reset warnings.');

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = raw.message?.extendedTextMessage?.contextInfo?.participant;
    const target    = mentioned[0] || quoted;

    if (!target) return reply('❌ Please mention or reply to the user.\nUsage: `.resetwarn @user`');

    const record = await getWarning(target, jid);
    record.count   = 0;
    record.reasons = '[]';
    await record.save();

    await sock.sendMessage(jid, {
      text     : fillTemplate(config.WARN_RESET_MESSAGE, { user: `@${jidToNum(target)}` }),
      mentions : [target],
    });
  }
);

// ── .warnlist ─────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'warnlist|warns',
    desc     : 'List all warnings in this group',
    category : 'group',
    usage    : '.warnlist',
    isGroup  : true,
    adminOnly: true,
  },
  async (sock, msg, { jid, reply }) => {
    const records = await Warning.findAll({ where: { group: jid, count: { [require('sequelize').Op.gt]: 0 } } });
    if (!records.length) return reply('✅ No active warnings in this group.');

    const lines = records.map(r => `• @${jidToNum(r.jid)} — ${r.count}/${config.WARN_LIMIT} warning(s)`);
    const mentions = records.map(r => r.jid);
    await sock.sendMessage(jid, { text: `⚠️ *Active Warnings*\n\n${lines.join('\n')}`, mentions });
  }
);

// ── .delwarn ──────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'delwarn',
    desc     : 'Remove one warning from a member',
    category : 'group',
    usage    : '.delwarn @user',
    isGroup  : true,
    adminOnly: true,
  },
  async (sock, msg, { jid, sender, raw, reply }) => {
    const meta = await sock.groupMetadata(jid);
    if (!isAdmin(meta.participants, sender)) return reply('❌ Only admins can delete warnings.');

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = raw.message?.extendedTextMessage?.contextInfo?.participant;
    const target    = mentioned[0] || quoted;

    if (!target) return reply('❌ Please mention or reply to the user.\nUsage: `.delwarn @user`');

    const record = await getWarning(target, jid);
    if (record.count === 0) return reply(`ℹ️ @${jidToNum(target)} has no warnings.`);

    record.count = Math.max(0, record.count - 1);
    const reasons = JSON.parse(record.reasons || '[]');
    reasons.pop();
    record.reasons = JSON.stringify(reasons);
    await record.save();

    await sock.sendMessage(jid, {
      text     : `✅ Removed 1 warning from @${jidToNum(target)}. Now at ${record.count}/${config.WARN_LIMIT}.`,
      mentions : [target],
    });
  }
);
