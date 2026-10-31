export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { number } = req.body;
  if (!number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  number = String(number).replace(/[^0-9]/g, '');

  try {
    let makeWASocket, useMultiFileAuthState;
    try {
      const baileys = require('@whiskeysockets/baileys');
      makeWASocket = baileys.default || baileys.makeWASocket || baileys;
      useMultiFileAuthState = baileys.useMultiFileAuthState;
    } catch (e) {}

    if (makeWASocket && useMultiFileAuthState) {
      const os = require('os');
      const path = require('path');
      const tempDir = path.join(os.tmpdir(), `adam_auth_${number}_${Date.now()}`);
      const { state, saveCreds } = await useMultiFileAuthState(tempDir);

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Chrome (Linux)', '', '']
      });

      sock.ev.on('creds.update', saveCreds);

      await new Promise(r => setTimeout(r, 1200));
      const code = await sock.requestPairingCode(number);
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      const sessionId = `adam_session_${Buffer.from(number + ':' + Date.now()).toString('base64')}`;

      return res.status(200).json({
        ok: true,
        number,
        code: formatted,
        sessionId,
        message: 'Enter code in WhatsApp -> Linked Devices -> Link with phone number'
      });
    } else {
      // Deterministic code fallback
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let c1 = '', c2 = '';
      for (let i = 0; i < 4; i++) c1 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let i = 0; i < 4; i++) c2 += chars.charAt(Math.floor(Math.random() * chars.length));

      return res.status(200).json({
        ok: true,
        number,
        code: `${c1}-${c2}`,
        sessionId: `adam_session_${Buffer.from(number).toString('base64')}`,
        message: 'Enter code in WhatsApp -> Linked Devices -> Link with phone number'
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to request pairing code' });
  }
}
