'use strict';

/**
 * ADAM Bot — lib/client.js
 * Creates and manages the Baileys WhatsApp client.
 * Loads all plugins, handles message routing, group event handling, etc.
 */

const path    = require('path');
const fs      = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const NodeCache = require('node-cache');

const config        = require('../config');
const { findCommands, commands } = require('./events');

// ── Load all plugins ──────────────────────────────────────────────────────────
const pluginsDir = path.join(__dirname, '../plugins');
const loadPlugins = () => {
  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      require(path.join(pluginsDir, file));
    } catch (err) {
      console.error(`[ADAM] Failed to load plugin ${file}:`, err.message);
    }
  }
  console.log(`[ADAM] ✅ Loaded ${files.length} plugin(s) — ${commands.length} command(s) registered.`);
};

// ── Rate Limiter (simple in-memory) ──────────────────────────────────────────
const cooldowns = new Map();
const COOLDOWN_MS = 2000; // 2 seconds per user per command

const isRateLimited = (jid, cmdName) => {
  const key = `${jid}:${cmdName}`;
  const now  = Date.now();
  const last = cooldowns.get(key) || 0;
  if (now - last < COOLDOWN_MS) return true;
  cooldowns.set(key, now);
  return false;
};

// ── Auth store ────────────────────────────────────────────────────────────────
const AUTH_DIR = path.join(__dirname, '../auth_info_baileys');

/**
 * Create and return a connected WhatsApp client.
 * @param {{ logger: import('pino').Logger }} opts
 */
const createClient = async ({ logger }) => {
  loadPlugins();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const msgRetryCache = new NodeCache();

  const sock = makeWASocket({
    version,
    logger          : logger.child({ module: 'baileys' }).child({ level: config.BAILEYS_LOG_LVL }),
    auth            : {
      creds : state.creds,
      keys  : makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache : msgRetryCache,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect            : config.ALWAYS_ONLINE,
    getMessage: async () => undefined,
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Connection ────────────────────────────────────────────────────────────
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      require('qrcode-terminal').generate(qr, { small: true });
      logger.info('📱 Scan the QR code above to connect ADAM bot.');
    }
    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      logger.warn(`Connection closed (code ${code}). Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) createClient({ logger });
    } else if (connection === 'open') {
      logger.info('⚡ WhatsApp connection established!');
      if (!config.DISABLE_START_MESSAGE) {
        logger.info('ADAM bot is live and ready.');
      }
    }
  });

  // ── Messages ──────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const raw of messages) {
      try {
        await handleMessage(sock, raw, logger);
      } catch (err) {
        logger.error({ err }, 'Error handling message');
      }
    }
  });

  // ── Call rejection ────────────────────────────────────────────────────────
  if (config.REJECT_CALL) {
    sock.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer') {
          await sock.rejectCall(call.id, call.from);
          logger.info(`📵 Rejected call from ${call.from}`);
        }
      }
    });
  }

  return sock;
};

// ── Message Handler ───────────────────────────────────────────────────────────
async function handleMessage(sock, raw, logger) {
  if (!raw.message) return;
  if (raw.key.remoteJid === 'status@broadcast') return;

  const jid     = raw.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const fromMe  = raw.key.fromMe;
  const sender  = fromMe ? sock.user.id : (raw.key.participant || jid);

  if (config.DISABLE_BOT && !config.SUDO.some(s => sender.startsWith(s))) return;

  // Extract text from various message types
  const text = (
    raw.message.conversation ||
    raw.message.extendedTextMessage?.text ||
    raw.message.imageMessage?.caption ||
    raw.message.videoMessage?.caption ||
    raw.message.documentMessage?.caption ||
    ''
  ).trim();

  if (config.LOG_MSG && text) {
    logger.info({ from: sender, jid, text: text.slice(0, 80) }, 'MSG');
  }

  if (!text.startsWith(config.PREFIX) && !config.MENTION) return;

  const matches = findCommands(text, config.PREFIX);
  if (!matches.length) return;

  for (const { cmd, match } of matches) {
    // Owner-only commands
    if (cmd.fromMe && !config.SUDO.some(s => sender.startsWith(s))) continue;
    // Group-only commands
    if (cmd.isGroup && !isGroup) {
      await sock.sendMessage(jid, { text: '❌ This command only works in groups.' }, { quoted: raw });
      continue;
    }

    // Rate limiting
    const cmdName = typeof cmd.pattern === 'string' ? cmd.pattern : cmd.pattern.source;
    if (isRateLimited(sender, cmdName)) {
      await sock.sendMessage(jid, { text: '⏳ You are sending commands too fast. Please slow down.' }, { quoted: raw });
      continue;
    }

    // Build context object passed to every handler
    const args = text.slice(config.PREFIX.length + cmdName.length).trim().split(/\s+/).filter(Boolean);
    const ctx  = {
      args,
      text    : args.join(' '),
      sender,
      jid,
      isGroup,
      fromMe,
      prefix  : config.PREFIX,
      match,
      raw,
      logger,
      config,
      reply   : (content) => sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, { quoted: raw }),
    };

    try {
      await cmd.handler(sock, raw, ctx);
    } catch (err) {
      logger.error({ err, cmd: cmdName }, 'Command handler error');
      await sock.sendMessage(jid, { text: `❌ An error occurred while running that command.\n\`${err.message}\`` }, { quoted: raw });
    }
  }
}

module.exports = { createClient };
