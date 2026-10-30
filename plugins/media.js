'use strict';

/**
 * ADAM Bot — plugins/media.js
 * Media download and conversion commands.
 */

const { bot } = require('../lib/');
const config  = require('../config');
const ytdl    = require('ytdl-core');
const axios   = require('axios');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

const tmpFile = (ext) => path.join(os.tmpdir(), `adam_media_${Date.now()}.${ext}`);

// ── YouTube Audio (.play) ─────────────────────────────────────────────────────
bot(
  {
    pattern  : 'play|audio',
    desc     : 'Download and send a YouTube audio',
    category : 'media',
    usage    : '.play <song name or URL>',
  },
  async (sock, msg, { jid, text, raw, reply }) => {
    if (!text) return reply('❌ Please provide a song name or YouTube URL.\nUsage: `.play Bohemian Rhapsody`');

    await reply('🎵 Searching and downloading audio…');
    try {
      let url = text;
      if (!ytdl.validateURL(text)) {
        // Search YouTube
        const searchRes = await axios.get(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`
        );
        const match = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (!match) return reply('❌ Could not find that song on YouTube.');
        url = `https://www.youtube.com/watch?v=${match[1]}`;
      }

      const info    = await ytdl.getInfo(url);
      const title   = info.videoDetails.title;
      const outPath = tmpFile('mp3');

      await new Promise((resolve, reject) => {
        ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
          .pipe(fs.createWriteStream(outPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      const buffer = fs.readFileSync(outPath);
      await sock.sendMessage(jid, {
        audio   : buffer,
        mimetype: 'audio/mpeg',
        ptt     : false,
      }, { quoted: raw });

      await sock.sendMessage(jid, { text: `🎵 *${title}*\n🔗 ${url}` });
      fs.unlinkSync(outPath);
    } catch (err) {
      await reply(`❌ Failed to download audio: ${err.message}`);
    }
  }
);

// ── YouTube Video (.video) ────────────────────────────────────────────────────
bot(
  {
    pattern  : 'video|yt',
    desc     : 'Download and send a YouTube video',
    category : 'media',
    usage    : '.video <YouTube URL or search>',
  },
  async (sock, msg, { jid, text, raw, reply }) => {
    if (!text) return reply('❌ Please provide a YouTube URL or search term.\nUsage: `.video Rick Astley Never Gonna Give You Up`');

    await reply('📹 Searching and downloading video…');
    try {
      let url = text;
      if (!ytdl.validateURL(text)) {
        const searchRes = await axios.get(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`
        );
        const match = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (!match) return reply('❌ Could not find that video on YouTube.');
        url = `https://www.youtube.com/watch?v=${match[1]}`;
      }

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;

      // Only allow videos under MAX_UPLOAD MB
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
      if (!formats.length) return reply('❌ No downloadable format found for this video.');

      const outPath = tmpFile('mp4');
      await new Promise((resolve, reject) => {
        ytdl(url, { quality: 'lowestvideo' })
          .pipe(fs.createWriteStream(outPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      const stats = fs.statSync(outPath);
      if (stats.size > config.MAX_UPLOAD * 1024 * 1024) {
        fs.unlinkSync(outPath);
        return reply(`❌ Video is too large (limit: ${config.MAX_UPLOAD}MB). Try a shorter video.`);
      }

      const buffer = fs.readFileSync(outPath);
      await sock.sendMessage(jid, {
        video  : buffer,
        caption: `📹 *${title}*\n🔗 ${url}`,
      }, { quoted: raw });

      fs.unlinkSync(outPath);
    } catch (err) {
      await reply(`❌ Failed to download video: ${err.message}`);
    }
  }
);

// ── Image Search (.img) ───────────────────────────────────────────────────────
bot(
  {
    pattern  : 'img|image',
    desc     : 'Search and send an image',
    category : 'media',
    usage    : '.img <search term>',
  },
  async (sock, msg, { jid, text, raw, reply }) => {
    if (!text) return reply('❌ Please provide a search term.\nUsage: `.img sunset beach`');

    await reply('🔍 Searching for image…');
    try {
      // Uses DuckDuckGo image search API (no key required)
      const tokenRes  = await axios.get(`https://duckduckgo.com/?q=${encodeURIComponent(text)}&iax=images&ia=images`);
      const vqdMatch  = tokenRes.data.match(/vqd=([\d-]+)&/);
      if (!vqdMatch) return reply('❌ Could not initialise image search.');

      const vqd = vqdMatch[1];
      const imgRes = await axios.get(
        `https://duckduckgo.com/i.js?q=${encodeURIComponent(text)}&vqd=${vqd}&p=1`,
        { headers: { Referer: 'https://duckduckgo.com/' } }
      );

      const results = imgRes.data?.results;
      if (!results?.length) return reply('❌ No images found for that query.');

      const imgUrl  = results[Math.floor(Math.random() * Math.min(results.length, 5))].image;
      const imgData = await axios.get(imgUrl, { responseType: 'arraybuffer' });
      const buffer  = Buffer.from(imgData.data);

      await sock.sendMessage(jid, {
        image  : buffer,
        caption: `🖼️ *${text}*`,
      }, { quoted: raw });
    } catch (err) {
      await reply(`❌ Image search failed: ${err.message}`);
    }
  }
);

// ── Text to Speech (.tts) ─────────────────────────────────────────────────────
bot(
  {
    pattern  : 'tts',
    desc     : 'Convert text to speech',
    category : 'media',
    usage    : '.tts <text>',
  },
  async (sock, msg, { jid, text, raw, reply }) => {
    if (!text) return reply('❌ Please provide some text.\nUsage: `.tts Hello World`');
    if (text.length > 200) return reply('❌ Text is too long. Keep it under 200 characters.');

    await reply('🗣️ Generating speech…');
    try {
      const gtts    = new (require('node-gtts'))(config.BOT_LANG || 'en');
      const outPath = tmpFile('mp3');

      await new Promise((resolve, reject) => {
        gtts.save(outPath, text, (err) => err ? reject(err) : resolve());
      });

      const buffer = fs.readFileSync(outPath);
      await sock.sendMessage(jid, {
        audio   : buffer,
        mimetype: 'audio/mpeg',
        ptt     : true,
      }, { quoted: raw });

      fs.unlinkSync(outPath);
    } catch (err) {
      await reply(`❌ TTS failed: ${err.message}`);
    }
  }
);
