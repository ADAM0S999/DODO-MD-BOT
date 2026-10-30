'use strict';

/**
 * ADAM Bot — plugins/sticker.js
 * Create stickers from images/videos/GIFs.
 */

const { bot } = require('../lib/');
const config  = require('../config');
const { exec } = require('child_process');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);

const [PACK, AUTHOR] = config.STICKER_PACKNAME.split(',');

// ── Helpers ───────────────────────────────────────────────────────────────────
const tmpFile = (ext) => path.join(os.tmpdir(), `adam_sticker_${Date.now()}.${ext}`);

async function downloadMedia(sock, msg) {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  return downloadMediaMessage(msg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
}

// ── Sticker from image ────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'sticker|s',
    desc     : 'Create a sticker from an image, video, or GIF',
    category : 'media',
    usage    : '.sticker (reply to image/video)',
    isMedia  : true,
  },
  async (sock, msg, { jid, raw, reply }) => {
    const quoted  = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const target  = quoted
      ? { message: quoted, key: { remoteJid: jid, id: raw.message.extendedTextMessage.contextInfo.stanzaId, participant: raw.message.extendedTextMessage.contextInfo.participant } }
      : raw;

    const msgType = Object.keys(target.message || {})[0];
    const isImage = msgType === 'imageMessage';
    const isVideo = msgType === 'videoMessage';
    const isGif   = msgType === 'videoMessage' && target.message.videoMessage?.gifPlayback;

    if (!isImage && !isVideo && !isGif) {
      return reply('❌ Please reply to an image, video, or GIF to create a sticker.');
    }

    try {
      await reply('⏳ Creating sticker…');
      const buffer = await downloadMedia(sock, target);
      const inExt  = isImage ? 'jpg' : 'mp4';
      const inPath = tmpFile(inExt);
      const outPath = tmpFile('webp');

      fs.writeFileSync(inPath, buffer);

      if (isImage) {
        await execAsync(
          `ffmpeg -i "${inPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -quality 80 "${outPath}" -y`
        );
      } else {
        // Video → animated WebP (max 8 seconds, 15fps)
        await execAsync(
          `ffmpeg -i "${inPath}" -t 8 -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset picture -an -vsync 0 "${outPath}" -y`
        );
      }

      const stickerBuffer = fs.readFileSync(outPath);
      await sock.sendMessage(jid, {
        sticker: stickerBuffer,
        packname: PACK || '⚡',
        author  : AUTHOR || 'ADAM',
      }, { quoted: raw });

      // Clean up
      [inPath, outPath].forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
    } catch (err) {
      await reply(`❌ Failed to create sticker: ${err.message}`);
    }
  }
);

// ── Sticker to image ──────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'toimg|stickertoimg',
    desc     : 'Convert a sticker to an image',
    category : 'media',
    usage    : '.toimg (reply to sticker)',
  },
  async (sock, msg, { jid, raw, reply }) => {
    const quoted  = raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const target  = quoted || raw.message;
    const msgType = Object.keys(target || {})[0];

    if (msgType !== 'stickerMessage') {
      return reply('❌ Please reply to a sticker.');
    }

    try {
      const buffer  = await downloadMedia(sock, quoted ? { message: quoted, key: { remoteJid: jid, id: raw.message.extendedTextMessage.contextInfo.stanzaId } } : raw);
      const inPath  = tmpFile('webp');
      const outPath = tmpFile('png');
      fs.writeFileSync(inPath, buffer);
      await execAsync(`ffmpeg -i "${inPath}" "${outPath}" -y`);
      const imgBuffer = fs.readFileSync(outPath);
      await sock.sendMessage(jid, { image: imgBuffer, caption: '✅ Here is your image.' }, { quoted: raw });
      [inPath, outPath].forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
    } catch (err) {
      await reply(`❌ Failed to convert sticker: ${err.message}`);
    }
  }
);
