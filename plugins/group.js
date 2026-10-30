'use strict';

/**
 * ADAM Bot — plugins/group.js
 * Group management commands: kick, add, promote, demote, mute, unmute,
 * invite, join, revoke, group info.
 *
 * All commands require the bot to be a group admin unless noted.
 */

const { bot, isAdmin, parsedJid, jidToNum } = require('../lib/');
const config = require('../config');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fetch the current group metadata safely */
async function getGroup(sock, jid) {
  try { return await sock.groupMetadata(jid); }
  catch { return null; }
}

/** Assert the sender is a group admin */
async function assertAdmin(sock, jid, sender, reply) {
  const meta = await getGroup(sock, jid);
  if (!meta) { await reply('❌ Could not fetch group metadata.'); return false; }
  if (!isAdmin(meta.participants, sender)) {
    await reply('❌ Only group admins can use this command.');
    return false;
  }
  return true;
}

/** Assert the bot is a group admin */
async function assertBotAdmin(sock, jid, reply) {
  const meta = await getGroup(sock, jid);
  if (!meta) { await reply('❌ Could not fetch group metadata.'); return false; }
  const botJid = sock.user.id.replace(/:.*@/, '@');
  if (!isAdmin(meta.participants, botJid)) {
    await reply('❌ I need to be an admin to perform this action.');
    return false;
  }
  return true;
}

// ── Kick ──────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'kick',
    desc     : 'Remove a member from the group',
    category : 'group',
    usage    : '.kick @user',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, args, raw, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ? [raw.message.extendedTextMessage.contextInfo.participant]
      : [];
    const targets   = [...new Set([...mentioned, ...quoted, ...parsedJid(args.join(' '))])];

    if (!targets.length) return reply('❌ Please mention or reply to the user(s) you want to kick.\nUsage: `.kick @user`');

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'remove');
      const names = targets.map(t => `@${jidToNum(t)}`).join(', ');
      await sock.sendMessage(jid, { text: `✅ Kicked: ${names}`, mentions: targets });
    } catch (err) {
      await reply(`❌ Failed to kick: ${err.message}`);
    }
  }
);

// ── Add ───────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'add',
    desc     : 'Add a member to the group',
    category : 'group',
    usage    : '.add 263XXXXXXXXX',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, args, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;

    const numbers = args.map(a => a.replace(/[^0-9]/g, '')).filter(Boolean);
    if (!numbers.length) return reply('❌ Please provide a phone number.\nUsage: `.add 263XXXXXXXXX`');

    const targets = numbers.map(n => `${n}@s.whatsapp.net`);
    try {
      const result = await sock.groupParticipantsUpdate(jid, targets, 'add');
      const added  = result.filter(r => r.status === '200').map(r => `@${jidToNum(r.jid)}`).join(', ');
      const failed = result.filter(r => r.status !== '200').map(r => jidToNum(r.jid)).join(', ');

      let text = '';
      if (added)  text += `✅ Added: ${added}\n`;
      if (failed) text += `⚠️ Failed to add: ${failed}`;
      await reply(text.trim() || '⚠️ No changes were made.');
    } catch (err) {
      await reply(`❌ Failed to add: ${err.message}`);
    }
  }
);

// ── Promote ───────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'promote',
    desc     : 'Promote a member to group admin',
    category : 'group',
    usage    : '.promote @user',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, args, raw, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ? [raw.message.extendedTextMessage.contextInfo.participant] : [];
    const targets   = [...new Set([...mentioned, ...quoted, ...parsedJid(args.join(' '))])];

    if (!targets.length) return reply('❌ Please mention or reply to the user(s) to promote.\nUsage: `.promote @user`');

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'promote');
      const names = targets.map(t => `@${jidToNum(t)}`).join(', ');
      await sock.sendMessage(jid, { text: `⬆️ Promoted to admin: ${names}`, mentions: targets });
    } catch (err) {
      await reply(`❌ Failed to promote: ${err.message}`);
    }
  }
);

// ── Demote ────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'demote',
    desc     : 'Demote a group admin to member',
    category : 'group',
    usage    : '.demote @user',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, args, raw, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;

    const mentioned = raw.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted    = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ? [raw.message.extendedTextMessage.contextInfo.participant] : [];
    const targets   = [...new Set([...mentioned, ...quoted, ...parsedJid(args.join(' '))])];

    if (!targets.length) return reply('❌ Please mention or reply to the admin(s) to demote.\nUsage: `.demote @user`');

    try {
      await sock.groupParticipantsUpdate(jid, targets, 'demote');
      const names = targets.map(t => `@${jidToNum(t)}`).join(', ');
      await sock.sendMessage(jid, { text: `⬇️ Demoted to member: ${names}`, mentions: targets });
    } catch (err) {
      await reply(`❌ Failed to demote: ${err.message}`);
    }
  }
);

// ── Mute ──────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'mute',
    desc     : 'Mute the group (admins only can send)',
    category : 'group',
    usage    : '.mute',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;
    try {
      await sock.groupSettingUpdate(jid, 'announcement');
      await reply('🔇 Group muted — only admins can send messages.');
    } catch (err) {
      await reply(`❌ Failed to mute: ${err.message}`);
    }
  }
);

// ── Unmute ────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'unmute|open',
    desc     : 'Unmute the group (everyone can send)',
    category : 'group',
    usage    : '.unmute',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;
    try {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await reply('🔊 Group unmuted — everyone can send messages.');
    } catch (err) {
      await reply(`❌ Failed to unmute: ${err.message}`);
    }
  }
);

// ── Invite Link ───────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'invite|link',
    desc     : 'Get the group invite link',
    category : 'group',
    usage    : '.invite',
    isGroup  : true,
    adminOnly: true,
  },
  async (sock, msg, { jid, sender, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    try {
      const code = await sock.groupInviteCode(jid);
      await reply(`🔗 *Invite Link*\nhttps://chat.whatsapp.com/${code}`);
    } catch (err) {
      await reply(`❌ Failed to get invite link: ${err.message}`);
    }
  }
);

// ── Revoke Invite ─────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'revoke',
    desc     : 'Revoke the current group invite link',
    category : 'group',
    usage    : '.revoke',
    isGroup  : true,
    adminOnly: true,
    botAdmin : true,
  },
  async (sock, msg, { jid, sender, reply }) => {
    if (!(await assertAdmin(sock, jid, sender, reply))) return;
    if (!(await assertBotAdmin(sock, jid, reply))) return;
    try {
      await sock.groupRevokeInvite(jid);
      await reply('🔒 Group invite link has been revoked.');
    } catch (err) {
      await reply(`❌ Failed to revoke: ${err.message}`);
    }
  }
);

// ── Join Group ────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'join',
    desc     : 'Join a group via invite link (owner only)',
    category : 'group',
    usage    : '.join <invite-link>',
    fromMe   : true,
  },
  async (sock, msg, { args, reply }) => {
    const link = args[0];
    if (!link) return reply('❌ Please provide a group invite link.\nUsage: `.join https://chat.whatsapp.com/XXX`');

    const code = link.split('chat.whatsapp.com/').pop();
    if (!code) return reply('❌ Invalid invite link format.');

    try {
      await sock.groupAcceptInvite(code);
      await reply(`✅ Joined the group successfully!`);
    } catch (err) {
      await reply(`❌ Failed to join: ${err.message}`);
    }
  }
);

// ── Group Info ────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'ginfo|groupinfo',
    desc     : 'Show group information',
    category : 'group',
    usage    : '.ginfo',
    isGroup  : true,
  },
  async (sock, msg, { jid, reply }) => {
    const meta = await getGroup(sock, jid);
    if (!meta) return reply('❌ Could not fetch group metadata.');

    const admins  = meta.participants.filter(p => p.admin).map(p => `• @${jidToNum(p.id)}`).join('\n');
    const created = new Date(meta.creation * 1000).toLocaleDateString();

    await sock.sendMessage(jid, {
      text:
        `📋 *Group Info*\n\n` +
        `*Name*       : ${meta.subject}\n` +
        `*Description*: ${meta.desc || 'None'}\n` +
        `*Members*    : ${meta.participants.length}\n` +
        `*Created*    : ${created}\n` +
        `*Owner*      : @${jidToNum(meta.owner || 'unknown')}\n\n` +
        `*Admins*\n${admins}`,
      mentions: meta.participants.filter(p => p.admin).map(p => p.id),
    });
  }
);
