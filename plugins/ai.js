'use strict';

/**
 * ADAM Bot — plugins/ai.js
 * AI chat commands using Gemini, Groq, or OpenRouter.
 * Falls back through providers in order: Gemini → Groq → OpenRouter.
 */

const { bot } = require('../lib/');
const config  = require('../config');
const axios   = require('axios');

// ── Provider: Gemini ──────────────────────────────────────────────────────────
async function askGemini(prompt) {
  if (!config.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Provider: Groq ────────────────────────────────────────────────────────────
async function askGroq(prompt) {
  if (!config.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured.');

  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: config.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    messages : [{ role: 'user', content: prompt }],
    model    : config.GROQ_MODEL,
  });
  return completion.choices[0]?.message?.content || '(No response)';
}

// ── Provider: OpenRouter ──────────────────────────────────────────────────────
async function askOpenRouter(prompt) {
  if (!config.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured.');

  const res = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model   : config.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        Authorization : `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/adam-bot',
        'X-Title'     : 'ADAM Bot',
      },
    }
  );
  return res.data?.choices?.[0]?.message?.content || '(No response)';
}

// ── Fallback AI (tries providers in order) ────────────────────────────────────
async function askAI(prompt) {
  if (config.GEMINI_API_KEY)       return askGemini(prompt);
  if (config.GROQ_API_KEY)         return askGroq(prompt);
  if (config.OPENROUTER_API_KEY)   return askOpenRouter(prompt);
  throw new Error('No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in config.env.');
}

// ── .ai / .ask ────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : ['ai', 'ask', 'chat'],
    desc     : 'Ask the AI a question (uses best available provider)',
    category : 'ai',
    usage    : '.ai <question>',
  },
  async (sock, msg, { text, reply }) => {
    if (!text) return reply('❌ Please provide a question.\nUsage: `.ai What is the capital of France?`');
    await reply('🤖 Thinking…');
    try {
      const answer = await askAI(text);
      await reply(`🤖 *ADAM AI*\n\n${answer}`);
    } catch (err) {
      await reply(`❌ AI error: ${err.message}`);
    }
  }
);

// ── .gemini ───────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'gemini',
    desc     : 'Ask Google Gemini a question',
    category : 'ai',
    usage    : '.gemini <question>',
  },
  async (sock, msg, { text, reply }) => {
    if (!text) return reply('❌ Please provide a question.\nUsage: `.gemini <question>`');
    if (!config.GEMINI_API_KEY) return reply('❌ GEMINI_API_KEY is not set in config.env.');
    await reply('✨ Asking Gemini…');
    try {
      const answer = await askGemini(text);
      await reply(`✨ *Gemini (${config.GEMINI_MODEL})*\n\n${answer}`);
    } catch (err) {
      await reply(`❌ Gemini error: ${err.message}`);
    }
  }
);

// ── .groq ─────────────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'groq',
    desc     : 'Ask Groq (Llama) a question',
    category : 'ai',
    usage    : '.groq <question>',
  },
  async (sock, msg, { text, reply }) => {
    if (!text) return reply('❌ Please provide a question.\nUsage: `.groq <question>`');
    if (!config.GROQ_API_KEY) return reply('❌ GROQ_API_KEY is not set in config.env.');
    await reply('⚡ Asking Groq…');
    try {
      const answer = await askGroq(text);
      await reply(`⚡ *Groq (${config.GROQ_MODEL})*\n\n${answer}`);
    } catch (err) {
      await reply(`❌ Groq error: ${err.message}`);
    }
  }
);

// ── .openrouter ───────────────────────────────────────────────────────────────
bot(
  {
    pattern  : 'openrouter|or',
    desc     : 'Ask via OpenRouter',
    category : 'ai',
    usage    : '.openrouter <question>',
  },
  async (sock, msg, { text, reply }) => {
    if (!text) return reply('❌ Please provide a question.\nUsage: `.openrouter <question>`');
    if (!config.OPENROUTER_API_KEY) return reply('❌ OPENROUTER_API_KEY is not set in config.env.');
    await reply('🌐 Asking OpenRouter…');
    try {
      const answer = await askOpenRouter(text);
      await reply(`🌐 *OpenRouter (${config.OPENROUTER_MODEL})*\n\n${answer}`);
    } catch (err) {
      await reply(`❌ OpenRouter error: ${err.message}`);
    }
  }
);
