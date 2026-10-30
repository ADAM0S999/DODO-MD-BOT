'use strict';

/**
 * ADAM Bot — config.js
 * Loads all environment variables from config.env and exports them.
 * Also initialises the Sequelize database connection.
 */

const path = require('path');
const fs   = require('fs');

// ── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, 'config.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('[ADAM] config.env not found — using environment variables directly.');
}

// ── Package version ───────────────────────────────────────────────────────────
const { version } = require('./package.json');

// ── Helper: parse boolean strings ────────────────────────────────────────────
const bool = (val, fallback = false) => {
  if (val === undefined || val === null || val === '') return fallback;
  return String(val).toLowerCase() === 'true';
};

// ── Helper: parse integer strings ────────────────────────────────────────────
const int = (val, fallback = 0) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
};

// ── Helper: parse comma-separated lists ──────────────────────────────────────
const list = (val) =>
  val ? String(val).split(',').map(v => v.trim()).filter(Boolean) : [];

// ── Validate SESSION_ID on startup ────────────────────────────────────────────
const SESSION_ID = process.env.SESSION_ID || '';
if (!SESSION_ID || SESSION_ID === 'adam_sessionid') {
  console.warn(
    '[ADAM] ⚠️  SESSION_ID is not configured. ' +
    'Set it in config.env before starting the bot.'
  );
}

// ── API Mode resolution ───────────────────────────────────────────────────────
const API_MODE_RAW = (process.env.API_MODE || 'both').toLowerCase();
const API_ENABLED  = API_MODE_RAW === 'api'  || API_MODE_RAW === 'both';
const BOT_ENABLED  = API_MODE_RAW === 'bot'  || API_MODE_RAW === 'both';

// ── Sequelize DB ─────────────────────────────────────────────────────────────
const { Sequelize } = require('sequelize');

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging : false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.db'),
    logging : false,
  });
}

// ── Exported configuration object ────────────────────────────────────────────
module.exports = {
  // ── Identity ──────────────────────────────────────────────────────────────
  VERSION        : version,
  BOT_NAME       : 'ADAM',

  // ── Session ───────────────────────────────────────────────────────────────
  SESSION_ID,
  PREFIX         : process.env.PREFIX         || '.',
  SUDO           : list(process.env.SUDO),

  // ── Behaviour ─────────────────────────────────────────────────────────────
  ALWAYS_ONLINE         : bool(process.env.ALWAYS_ONLINE),
  SEND_READ             : bool(process.env.SEND_READ),
  AUTO_STATUS_VIEW      : bool(process.env.AUTO_STATUS_VIEW),
  DISABLE_BOT           : bool(process.env.DISABLE_BOT),
  DISABLE_START_MESSAGE : bool(process.env.DISABLE_START_MESSAGE),
  MENTION               : bool(process.env.MENTION),
  VPS                   : bool(process.env.VPS),
  AUTO_UPDATE           : bool(process.env.AUTO_UPDATE),

  // ── Language ──────────────────────────────────────────────────────────────
  LANG     : process.env.LANG     || 'en',
  BOT_LANG : process.env.BOT_LANG || 'en',

  // ── Sticker ───────────────────────────────────────────────────────────────
  STICKER_PACKNAME : process.env.STICKER_PACKNAME || '⚡,ADAM',

  // ── Moderation ────────────────────────────────────────────────────────────
  WARN_LIMIT    : int(process.env.WARN_LIMIT, 3),
  ANTILINK_MSG  : process.env.ANTILINK_MSG  || '⚠️ Links are not allowed in this group.',
  ANTISPAM_MSG  : process.env.ANTISPAM_MSG  || '⚠️ Spamming is not allowed in this group.',
  ANTIWORDS_MSG : process.env.ANTIWORDS_MSG || '⚠️ That word is not allowed in this group.',
  ANTIWORDS     : list(process.env.ANTIWORDS),
  ANTI_DELETE   : bool(process.env.ANTI_DELETE),
  DELETE_TYPE   : int(process.env.DELETE_TYPE, 1),
  FORCE_LOGOUT  : bool(process.env.FORCE_LOGOUT),

  // ── Anti-Bot ──────────────────────────────────────────────────────────────
  ANTI_BOT         : bool(process.env.ANTI_BOT),
  ANTI_BOT_MESSAGE : process.env.ANTI_BOT_MESSAGE || 'Bots are not allowed in this group.',

  // ── Warn Messages ─────────────────────────────────────────────────────────
  WARN_MESSAGE      : process.env.WARN_MESSAGE      || '⚠️ Warning {warn}/{limit} — {reason}',
  WARN_RESET_MESSAGE: process.env.WARN_RESET_MESSAGE|| '✅ Your warnings have been reset.',
  WARN_KICK_MESSAGE : process.env.WARN_KICK_MESSAGE || '🚫 You have been removed after {limit} warnings.',

  // ── Calls ─────────────────────────────────────────────────────────────────
  REJECT_CALL : bool(process.env.REJECT_CALL),

  // ── Personal ──────────────────────────────────────────────────────────────
  PERSONAL_MESSAGE : bool(process.env.PERSONAL_MESSAGE),

  // ── Media ─────────────────────────────────────────────────────────────────
  MAX_UPLOAD : int(process.env.MAX_UPLOAD, 200),
  RMBG_KEY   : process.env.RMBG_KEY || '',

  // ── External Services ─────────────────────────────────────────────────────
  BRAINSHOP  : process.env.BRAINSHOP  || '',
  TRUECALLER : process.env.TRUECALLER || '',

  // ── AI Providers ──────────────────────────────────────────────────────────
  GEMINI_API_KEY    : process.env.GEMINI_API_KEY    || '',
  GEMINI_MODEL      : process.env.GEMINI_MODEL      || 'gemini-1.5-flash',

  GROQ_API_KEY : process.env.GROQ_API_KEY || '',
  GROQ_MODEL   : process.env.GROQ_MODEL   || 'llama3-70b-8192',

  OPENROUTER_API_KEY : process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL   : process.env.OPENROUTER_MODEL   || 'openai/gpt-4o-mini:free',

  GPT   : process.env.GPT   || '',
  MODEL : process.env.MODEL || 'gpt-3.5-turbo',

  BING_COOKIE : process.env.BING_COOKIE || '',

  // ── Group ─────────────────────────────────────────────────────────────────
  APPROVE      : bool(process.env.APPROVE),
  AJOIN        : bool(process.env.AJOIN),
  GROUP_ADMINS : list(process.env.GROUP_ADMINS),

  // ── Logging ───────────────────────────────────────────────────────────────
  LOG_MSG          : bool(process.env.LOG_MSG, true),
  BAILEYS_LOG_LVL  : process.env.BAILEYS_LOG_LVL || 'silent',

  // ── Timezone ──────────────────────────────────────────────────────────────
  TIMEZONE : process.env.TIMEZONE || 'Africa/Harare',

  // ── UI ────────────────────────────────────────────────────────────────────
  CMD_REACTION : bool(process.env.CMD_REACTION, true),
  LIST_TYPE    : int(process.env.LIST_TYPE, 1),

  // ── White List ────────────────────────────────────────────────────────────
  WHITE_LIST : list(process.env.WHITE_LIST),

  // ── YouTube ───────────────────────────────────────────────────────────────
  YT_COOKIE : process.env.YT_COOKIE || '',

  // ── Koyeb ─────────────────────────────────────────────────────────────────
  KOYEB      : bool(process.env.KOYEB),
  KOYEB_NAME : process.env.KOYEB_NAME || '',
  KOYEB_API  : process.env.KOYEB_API  || '',

  // ── Render ────────────────────────────────────────────────────────────────
  RENDER_NAME    : process.env.RENDER_NAME    || '',
  RENDER_API_KEY : process.env.RENDER_API_KEY || '',

  // ── API Mode ──────────────────────────────────────────────────────────────
  API_MODE        : API_MODE_RAW,
  API_ENABLED,
  BOT_ENABLED,
  API_KEY         : process.env.API_KEY         || '',
  API_WEBHOOK_URL : process.env.API_WEBHOOK_URL || '',
  API_PUBLIC_URL  : process.env.API_PUBLIC_URL  || '',
  PORT            : int(process.env.PORT, 3000),

  // ── Database ──────────────────────────────────────────────────────────────
  sequelize,
};
