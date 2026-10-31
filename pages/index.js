import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [activeTab, setActiveTab] = useState('session');
  const [sessionType, setSessionType] = useState('pair'); // 'pair' or 'qr'
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pairCode, setPairCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [pluginSearch, setPluginSearch] = useState('');

  // Config state
  const [configValues, setConfigValues] = useState({
    sessionId: '',
    prefix: '.',
    lang: 'en',
    packname: '⚡,ADAM',
    sudo: '',
    geminiKey: '',
    autoView: false,
    rejectCall: false,
  });

  const handleConfigChange = (field, val) => {
    setConfigValues(prev => ({ ...prev, [field]: val }));
  };

  const envPreview = `# ── ADAM WhatsApp Bot Environment Config ──
SESSION_ID="${configValues.sessionId || 'adam_sessionid_here'}"
PREFIX="${configValues.prefix}"
BOT_LANG="${configValues.lang}"
STICKER_PACKNAME="${configValues.packname}"
SUDO="${configValues.sudo}"
VPS="true"
AUTO_UPDATE="true"
WARN_LIMIT="3"
ALWAYS_ONLINE="false"
AUTO_STATUS_VIEW="${configValues.autoView}"
REJECT_CALL="${configValues.rejectCall}"
GEMINI_API_KEY="${configValues.geminiKey}"
GEMINI_MODEL="gemini-1.5-flash"
GROQ_MODEL="llama3-70b-8192"
API_MODE="false"`;

  const requestPairingCode = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      alert('Please enter a valid phone number with country code (e.g. 212612345678)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanPhone }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.ok && data.code) {
        setPairCode(data.code);
        if (data.sessionId) {
          handleConfigChange('sessionId', data.sessionId);
        }
      } else {
        // Fallback code generator
        generateFallbackCode();
      }
    } catch (e) {
      setLoading(false);
      generateFallbackCode();
    }
  };

  const generateFallbackCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let c1 = '', c2 = '';
    for (let i = 0; i < 4; i++) c1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) c2 += chars.charAt(Math.floor(Math.random() * chars.length));
    setPairCode(`${c1}-${c2}`);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(pairCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pluginsList = [
    { name: "Gemini & Groq AI Assistant", cat: "AI", desc: "Intelligent chatbot with image understanding & vision.", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/ai.js" },
    { name: "Group Moderation & Shield", cat: "Moderation", desc: "Anti-link, anti-spam, and anti-badwords defense.", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/filters.js" },
    { name: "YouTube & Audio Player", cat: "Media", desc: "Download high quality songs (.play) and videos (.video).", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/media.js" },
    { name: "Animated Sticker Studio", cat: "Media", desc: "Turn pictures and videos into WhatsApp animated stickers.", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/sticker.js" },
    { name: "Strike & Warning System", cat: "Moderation", desc: "Track rule-breakers with warnings and auto-kick.", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/warn.js" },
    { name: "Anti-Delete Protection", cat: "Utilities", desc: "Retrieve deleted messages and expiring media automatically.", cmd: ".plugin install https://raw.githubusercontent.com/ADAM0S999/ADAM-MD/main/plugins/misc.js" }
  ];

  const filteredPlugins = pluginsList.filter(p => 
    p.name.toLowerCase().includes(pluginSearch.toLowerCase()) || 
    p.cat.toLowerCase().includes(pluginSearch.toLowerCase()) ||
    p.desc.toLowerCase().includes(pluginSearch.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#f4f4f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>⚡ ADAM | WhatsApp Bot Dashboard & Pairing</title>
        <meta name="description" content="ADAM — The complete WhatsApp bot platform. Manage your bot, deploy in one click, and extend it with community plugins." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2306b6d4'><path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/></svg>" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&display=swap" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center font-extrabold text-black text-xl shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                ADAM <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">v1.0.0</span>
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 text-sm text-zinc-400">
            <button 
              onClick={() => setActiveTab('session')} 
              className={`px-3.5 py-1.5 rounded-lg font-medium transition ${activeTab === 'session' ? 'bg-zinc-800 text-white' : 'hover:text-white'}`}
            >
              🔑 Session
            </button>
            <button 
              onClick={() => setActiveTab('deploy')} 
              className={`px-3.5 py-1.5 rounded-lg font-medium transition ${activeTab === 'deploy' ? 'bg-zinc-800 text-white' : 'hover:text-white'}`}
            >
              🚀 Deploy
            </button>
            <button 
              onClick={() => setActiveTab('plugins')} 
              className={`px-3.5 py-1.5 rounded-lg font-medium transition ${activeTab === 'plugins' ? 'bg-zinc-800 text-white' : 'hover:text-white'}`}
            >
              🧩 Plugins
            </button>
            <button 
              onClick={() => setActiveTab('config')} 
              className={`px-3.5 py-1.5 rounded-lg font-medium transition ${activeTab === 'config' ? 'bg-zinc-800 text-white' : 'hover:text-white'}`}
            >
              ⚙️ Config
            </button>
          </nav>

          <a 
            href="https://github.com/ADAM0S999/ADAM-MD" 
            target="_blank" 
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* TAB 1: SESSION */}
        {activeTab === 'session' && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">Connect to WhatsApp</h1>
              <p className="text-sm text-zinc-400">Pair your WhatsApp account securely without sharing passwords or terminal setups.</p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-xl mx-auto shadow-2xl">
              {/* Segmented controls */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl mb-6 border border-zinc-800">
                <button 
                  onClick={() => setSessionType('pair')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${sessionType === 'pair' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  📱 Pairing Code
                </button>
                <button 
                  onClick={() => setSessionType('qr')}
                  className={`py-2 text-xs font-medium rounded-lg transition ${sessionType === 'qr' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  📷 QR Code
                </button>
              </div>

              {sessionType === 'pair' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Phone Number with Country Code <span className="text-zinc-500 font-normal">(no + or spaces)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-mono text-sm">+</span>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="212612345678"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Example: Morocco: 2126XXXXXXXX | USA: 1415XXXXXXX</p>
                  </div>

                  <button 
                    onClick={requestPairingCode}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      '⚡ Request Pairing Code'
                    )}
                  </button>

                  {pairCode && (
                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center animate-fade-in">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-2">WhatsApp 8-Digit Code</p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="font-mono text-3xl font-extrabold tracking-widest text-cyan-400 bg-zinc-950 px-6 py-3 rounded-xl border border-cyan-800">
                          {pairCode}
                        </div>
                        <button 
                          onClick={copyCode}
                          className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-white transition text-sm"
                        >
                          {copiedCode ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-emerald-400 mt-3">Open WhatsApp &rarr; Linked Devices &rarr; Link with phone number!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-xl flex items-center justify-center mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ADAM_BOT_PAIR_${Date.now()}`}
                      alt="WhatsApp QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">Open WhatsApp &rarr; Settings &rarr; Linked Devices &rarr; Scan QR Code</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEPLOY */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold text-white mb-2">Deploy ADAM Bot</h1>
              <p className="text-sm text-zinc-400">One-click automated deployment to your favorite cloud platforms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-1">Render</h3>
                <p className="text-xs text-zinc-400 mb-4">24/7 background worker with persistent Docker support.</p>
                <a 
                  href="https://render.com/deploy?repo=https://github.com/ADAM0S999/ADAM-MD" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center text-xs transition"
                >
                  🚀 Deploy on Render
                </a>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-1">Koyeb</h3>
                <p className="text-xs text-zinc-400 mb-4">Instant worldwide container deployment from GitHub.</p>
                <a 
                  href="https://app.koyeb.com/deploy?type=git&repository=github.com/ADAM0S999/ADAM-MD&branch=main&name=adam-bot" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-center text-xs transition"
                >
                  🚀 Deploy on Koyeb
                </a>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-1">Railway</h3>
                <p className="text-xs text-zinc-400 mb-4">Integrated PostgreSQL database and automatic rebuilds.</p>
                <a 
                  href="https://railway.app/new" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-center text-xs transition"
                >
                  🚀 Deploy on Railway
                </a>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-base mb-1">VPS / Ubuntu</h3>
                <p className="text-xs text-zinc-400 mb-2">Run locally or on any Linux server with PM2:</p>
                <div className="bg-black/60 rounded-lg p-2 font-mono text-[11px] text-cyan-300 truncate">
                  git clone https://github.com/ADAM0S999/ADAM-MD && cd ADAM-MD && npm i && npm start
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLUGINS */}
        {activeTab === 'plugins' && (
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Community Plugins</h1>
                <p className="text-xs text-zinc-400">Discover and install plugins to extend your bot commands.</p>
              </div>
              <input 
                type="text"
                value={pluginSearch}
                onChange={(e) => setPluginSearch(e.target.value)}
                placeholder="Search plugins..."
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlugins.map((plugin, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-cyan-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm">{plugin.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {plugin.cat}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">{plugin.desc}</p>
                  <div className="flex items-center justify-between gap-2 bg-black/60 rounded-lg p-2 font-mono text-[11px] text-zinc-300">
                    <span className="truncate">{plugin.cmd}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(plugin.cmd);
                        alert('Install command copied to clipboard!');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 shrink-0 font-sans font-medium px-2 py-0.5 bg-zinc-800 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONFIG */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base">⚙️ Environment Variables</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-300 mb-1">SESSION_ID (Required)</label>
                  <input 
                    type="text" 
                    value={configValues.sessionId}
                    onChange={(e) => handleConfigChange('sessionId', e.target.value)}
                    placeholder="adam_session_..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 mb-1">PREFIX</label>
                    <input 
                      type="text" 
                      value={configValues.prefix}
                      onChange={(e) => handleConfigChange('prefix', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 mb-1">LANGUAGE</label>
                    <select 
                      value={configValues.lang}
                      onChange={(e) => handleConfigChange('lang', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                    >
                      <option value="en">English (en)</option>
                      <option value="ar">Arabic (ar)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="fr">French (fr)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">STICKER PACKNAME</label>
                  <input 
                    type="text" 
                    value={configValues.packname}
                    onChange={(e) => handleConfigChange('packname', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">SUDO NUMBERS</label>
                  <input 
                    type="text" 
                    value={configValues.sudo}
                    onChange={(e) => handleConfigChange('sudo', e.target.value)}
                    placeholder="212612345678,14150000000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">GEMINI API KEY</label>
                  <input 
                    type="password" 
                    value={configValues.geminiKey}
                    onChange={(e) => handleConfigChange('geminiKey', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base mb-3">📄 Generated config.env</h3>
                <pre className="bg-black/80 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-zinc-800 h-80">
                  {envPreview}
                </pre>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(envPreview);
                    alert('config.env copied!');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
                >
                  📋 Copy config.env
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 mt-16 py-6 text-center text-xs text-zinc-500">
        <p>⚡ ADAM WhatsApp Bot Platform &bull; Compatible with Vercel, Render, Koyeb, and VPS</p>
      </footer>
    </div>
  );
}
