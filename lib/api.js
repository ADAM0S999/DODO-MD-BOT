'use strict';

/**
 * ADAM Bot — lib/api.js
 * Express REST API server. Exposes endpoints to send messages,
 * receive webhooks, and query bot status.
 */

const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios      = require('axios');

const config = require('../config');

/**
 * Build and return the Express app.
 * @param {{ logger: import('pino').Logger, getClient: () => any }} opts
 * @returns {import('express').Application}
 */
module.exports = ({ logger, getClient }) => {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // ── API key middleware ──────────────────────────────────────────────────────
  const requireApiKey = (req, res, next) => {
    if (!config.API_KEY) return next(); // No key set → open
    const key = req.headers['x-api-key'] || req.query.apiKey;
    if (key !== config.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized — invalid API key.' });
    }
    next();
  };

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    const client = getClient();
    res.json({
      bot     : 'ADAM',
      version : config.VERSION,
      status  : client ? 'connected' : 'disconnected',
      uptime  : process.uptime(),
    });
  });

  // ── Send a text message ────────────────────────────────────────────────────
  app.post('/send', requireApiKey, async (req, res) => {
    const { jid, message } = req.body;
    if (!jid || !message) {
      return res.status(400).json({ error: '`jid` and `message` are required.' });
    }
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Bot client is not connected.' });

    try {
      await client.sendMessage(jid, { text: message });
      logger.info({ jid, message: message.slice(0, 60) }, 'API: message sent');
      res.json({ ok: true, id: uuidv4() });
    } catch (err) {
      logger.error({ err }, 'API: failed to send message');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Send a media message ───────────────────────────────────────────────────
  app.post('/send/media', requireApiKey, async (req, res) => {
    const { jid, url, type, caption } = req.body;
    if (!jid || !url || !type) {
      return res.status(400).json({ error: '`jid`, `url`, and `type` (image/video/audio/document) are required.' });
    }
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Bot client is not connected.' });

    try {
      const payload = { [type]: { url }, caption: caption || '' };
      await client.sendMessage(jid, payload);
      res.json({ ok: true, id: uuidv4() });
    } catch (err) {
      logger.error({ err }, 'API: failed to send media');
      res.status(500).json({ error: err.message });
    }
  });

  // ── Incoming webhook relay ─────────────────────────────────────────────────
  // This endpoint can be registered with a third-party service to push
  // messages into the bot for processing.
  app.post('/webhook', requireApiKey, async (req, res) => {
    const payload = req.body;
    logger.info({ payload }, 'API: webhook received');

    if (config.API_WEBHOOK_URL) {
      try {
        await axios.post(config.API_WEBHOOK_URL, payload, { timeout: 5000 });
      } catch (err) {
        logger.warn({ err }, 'API: failed to forward webhook');
      }
    }

    res.json({ ok: true });
  });

  // ── Bot info ───────────────────────────────────────────────────────────────
  app.get('/info', requireApiKey, (req, res) => {
    res.json({
      name    : 'ADAM',
      version : config.VERSION,
      prefix  : config.PREFIX,
      lang    : config.BOT_LANG,
      apiMode : config.API_MODE,
    });
  });

  return app;
};
