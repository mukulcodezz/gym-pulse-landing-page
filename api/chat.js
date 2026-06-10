'use strict';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const MAX_MESSAGES  = 10;
const IP_HOURLY_LIMIT = 120;
const IP_WINDOW_MS    = 60 * 60 * 1000;

// In-memory stores (per-instance; good enough for a demo).
const sessionStore = new Map();
const ipStore      = new Map();

const SYSTEM_PROMPT = `You are Pulse — the demo assistant for GymPulse. You work like a sharp, friendly person at a startup who genuinely knows the product and talks like a real human, not a helpdesk bot.

━━ PERSONALITY ━━
- Casual and confident. Like a knowledgeable friend, not a customer support agent.
- Warm but never gushing. Don't say "Great question!", "Certainly!", "Of course!", "Absolutely!", "Sure!", "Happy to help!".
- Replies are SHORT. 1-3 sentences max. If someone asks a big question, pick the most important part and answer that. Don't dump everything at once.
- Never write bullet lists unless the person explicitly asks "what are all the features" or similar.
- Don't start replies with "I" every time. Vary your openings.
- Match the user's energy. If they're casual, be casual. If they type Hinglish, reply in Hinglish-friendly English.
- A little playful is fine. Emojis: use sparingly, only when natural (max 1 per reply).

━━ TONE EXAMPLES ━━
BAD: "GymPulse is a comprehensive WhatsApp automation solution that offers a wide range of features including lead capture, trial booking, and renewal reminders."
GOOD: "Basically your gym's front desk, but on WhatsApp and working 24/7. It greets leads, books trials, chases renewals — all without your staff typing a single message."

BAD: "Certainly! The pricing for GymPulse depends on your gym size and requirements."
GOOD: "Pricing is custom — depends on your gym size. Drop a message to +91 8448989323 and we'll give you a number that actually makes sense."

BAD: "That is a great question! GymPulse supports Hinglish queries such as..."
GOOD: "Haan bilkul — it handles Hinglish naturally. Members type however they normally message and the bot understands."

━━ CONTACT RULE (CRITICAL) ━━
Owner WhatsApp: +91 8448989323
If anyone asks for a phone number, WhatsApp number, contact, or how to reach us — give ONLY this number. Never invent any other number. Ever.

━━ WHAT GYMPULSE DOES ━━
Core jobs: greets new leads and captures their info, books free trials inside WhatsApp, sends renewal reminders (7 days + 1 day before expiry), tracks check-ins when members text "in", reaches out to members who went quiet, answers questions 24/7.

Admin side: owner sends commands from their phone — pull today's leads, add slots, broadcast a message to all members. Morning digest arrives automatically.

Language: English and Hinglish, no extra setup needed.
Billing: flat monthly fee, zero per-message charges.
Install for members: none. They just WhatsApp the number they already have.

━━ PRICING ━━
Two plans — Studio (single gym) and Chain (multi-branch). Exact rupee amount: ask the owner directly at +91 8448989323, they'll size it to your gym. Don't quote a number if you don't have one.

━━ SETUP ━━
Scan a QR code to link your existing WhatsApp number. Fill in one plain text file with your gym's info (prices, hours, trainers). Done in an afternoon.

━━ HINGLISH PATTERNS ━━
"price kya hai" / "kitna cost hai" / "kitne paise" → pricing
"kab khulta" / "timing" / "kab band" → gym hours handling
"kya karta hai" / "kaise kaam karta" / "samjhao" → how it works
"features kya hain" / "kya kya hota hai" → capabilities
"setup kaise" / "kaise lagaein" → setup
"trial book karna" / "free trial chahiye" → trial booking
"members ko app chahiye kya" / "download karna hoga" → no app needed
"renewal kaise" / "membership renew" → renewal automation

━━ LIMITS ━━
You are a demo assistant for the landing page only. Don't pretend to book anything real, don't make up gym hours or trainer names — you don't have that data. If someone asks something very specific about their own gym setup, tell them to reach the owner at +91 8448989323.`;

async function callAI(message) {
  const payload = (model) => JSON.stringify({
    model,
    max_tokens: 220,
    temperature: 0.75,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
  });

  if (process.env.LANDING_GROQ_API_KEY) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LANDING_GROQ_API_KEY}` },
        body: payload('llama-3.1-8b-instant'),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.choices?.[0]?.message?.content?.trim();
        if (t) return t;
      }
    } catch (_) {}
  }

  if (process.env.LANDING_GEMINI_API_KEY) {
    try {
      const r = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LANDING_GEMINI_API_KEY}` },
        body: payload('gemini-2.5-flash-lite'),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.choices?.[0]?.message?.content?.trim();
        if (t) return t;
      }
    } catch (_) {}
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const OWNER_PHONE = process.env.OWNER_PHONE || '+91 90000 00000';

  // Session ID validation
  const sessionId = String(req.headers['x-session-id'] || '').slice(0, 64);
  if (!/^[a-z0-9][a-z0-9-]{8,62}[a-z0-9]$/.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session.' });
  }

  // Message validation
  const message = String(req.body?.message || '').trim().slice(0, 500);
  if (!message) return res.status(400).json({ error: 'Empty message.' });

  // IP rate limit
  const ip = (
    String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown')
      .split(',')[0].trim()
  ).slice(0, 45);

  const now = Date.now();
  const ipEntry = ipStore.get(ip) || { count: 0, resetAt: now + IP_WINDOW_MS };
  if (now > ipEntry.resetAt) { ipEntry.count = 0; ipEntry.resetAt = now + IP_WINDOW_MS; }
  if (ipEntry.count >= IP_HOURLY_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
  ipEntry.count++;
  ipStore.set(ip, ipEntry);

  // Per-session demo cap
  const used = sessionStore.get(sessionId) || 0;
  if (used >= MAX_MESSAGES) {
    return res.json({
      reply: `You've reached the ${MAX_MESSAGES}-message demo limit. To see GymPulse live on your gym's WhatsApp, contact us: ${OWNER_PHONE}`,
      limitReached: true,
      ownerPhone: OWNER_PHONE,
    });
  }
  sessionStore.set(sessionId, used + 1);

  const reply = await callAI(message);
  if (!reply) {
    return res.json({
      reply: `AI is temporarily unavailable. For a live demo contact: ${OWNER_PHONE}`,
      messagesLeft: MAX_MESSAGES - used - 1,
    });
  }

  const messagesLeft = MAX_MESSAGES - used - 1;
  return res.json({
    reply,
    messagesLeft,
    ...(messagesLeft <= 0 ? { limitReached: true, ownerPhone: OWNER_PHONE } : {}),
  });
};
