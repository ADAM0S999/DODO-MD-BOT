'use strict';

/**
 * ADAM Bot — index.js
 * Main entry point. Initialises the database, starts the bot client
 * and/or the REST API server based on API_MODE, then handles graceful shutdown.
 */

const pino = require('pino');
const { sequelize, BOT_ENABLED, API_ENABLED, PORT, SESSION_ID, BOT_NAME } = require('./config');

// ── Logger ───────────────────────────────────────────────────────────────────
const logger = pino({
  level: 'info',
  transport: {
    target   : 'pino-pretty',
    options  : { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
  },
});

// ── Startup banner ────────────────────────────────────────────────────────────
const { VERSION } = require('./config');
console.log(`
╔══════════════════════════════════════╗
║   ⚡  ADAM WhatsApp Bot  ⚡          ║
║   Version: ${VERSION.padEnd(26)}║
╚══════════════════════════════════════╝
`);

if (!SESSION_ID || SESSION_ID === 'adam_sessionid') {
  logger.warn('SESSION_ID is not set — the bot will generate a QR code for scanning.');
}

// ── Database ──────────────────────────────────────────────────────────────────
async function connectDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    logger.info('✅ Database connected and synced.');
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed.');
    process.exit(1);
  }
}

// ── Bot client ────────────────────────────────────────────────────────────────
let botClient = null;
async function startBot() {
  if (!BOT_ENABLED) {
    logger.info('Bot mode disabled (API_MODE=api). Skipping WhatsApp client.');
    return;
  }
  const { createClient } = require('./lib/client');
  botClient = await createClient({ logger });
  logger.info('⚡ ADAM Bot is running!');
}

// ── REST API server ───────────────────────────────────────────────────────────
let apiServer = null;
async function startAPI() {
  if (!API_ENABLED) {
    logger.info('API mode disabled (API_MODE=bot). Skipping REST API server.');
    return;
  }
  const app = require('./lib/api')({ logger, getClient: () => botClient });
  apiServer = app.listen(PORT, () => {
    logger.info(`🌐 REST API listening on port ${PORT}`);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`Received ${signal} — shutting down gracefully…`);

  if (apiServer) {
    await new Promise(resolve => apiServer.close(resolve));
    logger.info('REST API server closed.');
  }

  if (botClient && typeof botClient.logout === 'function') {
    try { await botClient.logout(); } catch (_) { /* ignore */ }
    logger.info('WhatsApp client disconnected.');
  }

  try { await sequelize.close(); logger.info('Database connection closed.'); }
  catch (_) { /* ignore */ }

  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException',  err => logger.error({ err }, 'Uncaught exception'));
process.on('unhandledRejection', err => logger.error({ err }, 'Unhandled rejection'));

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  await connectDB();
  await startBot();
  await startAPI();
})();
