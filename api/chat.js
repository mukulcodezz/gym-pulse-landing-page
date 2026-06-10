'use strict';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const MAX_MESSAGES  = 10;
const IP_HOURLY_LIMIT = 120;
const IP_WINDOW_MS    = 60 * 60 * 1000;

// In-memory stores (per-instance; good enough for a demo).
const sessionStore = new Map();
const ipStore      = new Map();

const SYSTEM_PROMPT = `You are a friendly demo assistant for GymPulse, a WhatsApp automation system for gyms.
Help visitors understand what GymPulse does, its features, pricing tiers, and how to get started.
You understand Hinglish (Hindi mixed with English). Common patterns you recognize:
- "price kya hai?" / "kitna cost hai?" → pricing info
- "kab khulta hai?" / "timing kya hai?" → how it handles gym hours
- "kya karta hai?" / "kaise kaam karta hai?" → how it works
- "features kya hain?" → full capability list
- "setup kaise karein?" → setup steps
- "trial kaise book karein?" → trial booking feature
- "renewal kaise hoti hai?" → renewal automation
- "members ko app chahiye kya?" → no-app-needed answer
Always respond clearly in English. Keep answers concise (2-4 sentences max). Be warm and direct.

GymPulse capabilities:
1. Instant lead capture — auto-greets new contacts, asks goal/name/age/preferred time, files the lead
2. Free trial booking — shows open slots, books the seat, confirms inside WhatsApp chat
3. Trial & renewal reminders — 7-day and 1-day nudges automatically
4. Check-in tracking — members text "in" to log attendance; spot who went quiet
5. Win-back nudges — notices members who stopped showing and reaches out automatically
6. 24/7 FAQ answers — price, hours, location, trainers, facilities; AI fallback for off-script questions
7. Live open/closed status — knows your hours and any closed-day overrides
8. Daily & weekly admin digests — morning expiry list, Monday performance recap
9. Broadcast messages — send offers and announcements to all members (Chain plan)
10. Human escalation — recognizes real buying signals and notifies staff immediately
11. Admin commands from your phone — add slots, pull leads, broadcast offers via WhatsApp
12. Speaks Hinglish & English — understands mixed Hindi-English queries naturally
13. Zero per-message billing — flat plan, not pay-per-message

Pricing:
- Studio plan: single-location gyms. Lead capture, trials, renewals, check-ins, 24/7 FAQ, daily digest.
- Chain plan: multi-branch operators. Everything in Studio + broadcasts, weekly recap, priority human handoff.
- Exact price: contact the owner for a quote tailored to your gym size.

Setup: Scan one QR code to link WhatsApp, fill in your gym details in one plain file — done in an afternoon. No app for members to install.`;

async function callAI(message) {
  const payload = (model) => JSON.stringify({
    model,
    max_tokens: 220,
    temperature: 0.3,
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
