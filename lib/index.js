'use strict';

/**
 * ADAM Bot — lib/index.js
 * Shared utility helpers exported to all plugins.
 */

const os   = require('os');
const { addCommand, commands, findCommands, getCommandsByCategory } = require('./events');

// ── Time ─────────────────────────────────────────────────────────────────────

/** Sleep for `ms` milliseconds */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format seconds into HH:MM:SS string.
 * @param {number} seconds
 * @returns {string}
 */
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

/**
 * Return [Date object, locale time string] for now.
 * @returns {[Date, string]}
 */
const getDate = () => {
  const d = new Date();
  return [d, d.toLocaleTimeString()];
};

// ── Uptime ────────────────────────────────────────────────────────────────────

const _startTime = Date.now();

/**
 * Get bot uptime.
 * @param {'seconds'|'formatted'} [type='formatted']
 * @returns {number|string}
 */
const getUptime = (type = 'formatted') => {
  const seconds = Math.floor((Date.now() - _startTime) / 1000);
  return type === 'seconds' ? seconds : formatTime(seconds);
};

// ── System ────────────────────────────────────────────────────────────────────

/**
 * Return a human-readable RAM usage string.
 * @returns {string}
 */
const getRam = () => {
  const total = os.totalmem();
  const free  = os.freemem();
  const used  = total - free;
  const mb    = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  return `${mb(used)} MB / ${mb(total)} MB`;
};

/** Return the current platform identifier */
const getPlatform = () => process.platform;

// ── JID Helpers ───────────────────────────────────────────────────────────────

/**
 * Strip the @s.whatsapp.net / @g.us suffix from a JID.
 * @param {string} jid
 * @returns {string}
 */
const jidToNum = (jid) => jid.replace(/@.*/, '');

/**
 * Extract all WhatsApp JIDs from a text string.
 * @param {string} text
 * @returns {string[]}
 */
const parsedJid = (text) =>
  text.match(/\d+@[sg]\.whatsapp\.net/g) || [];

// ── Group Helpers ─────────────────────────────────────────────────────────────

/**
 * Check if a JID is an admin in a participants list.
 * @param {Array<{id: string, admin: string|null}>} participants
 * @param {string} jid
 * @returns {boolean}
 */
const isAdmin = (participants, jid) =>
  participants.some(p => p.id === jid && (p.admin === 'admin' || p.admin === 'superadmin'));

// ── String / Display Helpers ──────────────────────────────────────────────────

/**
 * Pad a number with leading spaces so all numbers align to the same width.
 * @param {number} i     - Current number
 * @param {number} total - Maximum number
 * @returns {string}
 */
const addSpace = (i, total) =>
  ' '.repeat(String(total).length - String(i).length);

/**
 * Apply a simple Unicode style transform to text.
 * Extend with proper maps as needed.
 * @param {string} text
 * @param {'bold'|'italic'|'mono'|string} [style='bold']
 * @returns {string}
 */
const textToStylist = (text, style = 'bold') => {
  if (style === 'mono') return `\`\`\`${text}\`\`\``;
  return text; // placeholder — add full Unicode char-map transforms here
};

// ── Array Helpers ─────────────────────────────────────────────────────────────

/**
 * Find common elements across multiple arrays.
 * @param {any[][]} arrays
 * @param {boolean} [isAny=false] - true = union, false = intersection
 * @returns {any[]}
 */
const getCommon = (arrays, isAny = false) => {
  if (!arrays || arrays.length === 0) return [];
  if (isAny) {
    return [...new Set(arrays.flat())];
  }
  return arrays.reduce((a, b) => a.filter(v => b.includes(v)));
};

// ── Lang (minimal inline strings — full strings live in lang/*.json) ──────────
const lang = {
  plugins: {
    noReply       : '❌ Please reply to a message.',
    noText        : '❌ Please provide text.',
    groupOnly     : '❌ This command only works in groups.',
    adminOnly     : '❌ This command is for group admins only.',
    botAdminReq   : '❌ I need to be an admin to do that.',
    ownerOnly     : '❌ This command is restricted to the bot owner.',
    error         : '❌ An error occurred. Please try again.',
    cooldown      : '⏳ You are sending commands too fast. Please wait.',
  },
};

module.exports = {
  // Time
  sleep,
  formatTime,
  getDate,
  getUptime,

  // System
  getRam,
  getPlatform,

  // JID
  jidToNum,
  parsedJid,

  // Group
  isAdmin,

  // String / Display
  addSpace,
  textToStylist,

  // Array
  getCommon,

  // Lang
  lang,

  // Command registry (re-exported for convenience)
  bot            : addCommand,
  addCommand,
  commands,
  findCommands,
  getCommandsByCategory,
};
