# GymPulse — WhatsApp Automation for Gyms

**Live:** [gympulse-bot.vercel.app](https://gympulse-bot.vercel.app/)

Landing page for **GymPulse**, a WhatsApp bot that runs a gym's entire lead and member pipeline — on the number the gym already uses. No app for members to install.

---

## What the bot does

### Lead capture
Every new enquiry triggers an onboarding flow. The bot asks for fitness goal, name, age, and preferred training time — building a qualified lead record before a human ever gets involved.

### Trial booking
Members can book a free trial session end-to-end over WhatsApp. The bot shows available slots, confirms the booking, and sends a reminder before the session. Follow-up feedback is collected automatically.

### Renewal reminders
7 days out and 1 day before expiry, members get a personalised reminder with their plan and expiry date. One reply — `renew` — kicks off the renewal flow.

### Check-in tracking
Members text `in` when they arrive. Attendance is logged with a timestamp. Inactivity detection flags members who haven't checked in for a configurable number of days and sends a re-engagement nudge.

### AI-powered FAQ
Anything outside the scripted flows — facility questions, pricing queries, trainer info — goes to a multi-provider AI fallback (Groq → Gemini → OpenRouter, all free tier). Answers are cached for 7 days to avoid repeat API calls.

### Admin commands
Gym owners send commands directly from WhatsApp to see daily digests, expiry summaries, weekly performance recaps, and override gym open/closed status.

### Human handoff
When a user asks to speak to staff, or signals intent to join after a trial, the bot escalates to the team instead of pretending to be a person.

---

## Transport modes

| Mode | How | Cost | Ban risk |
|------|-----|------|----------|
| **Baileys** | Unofficial WhatsApp Web client, QR scan | Free | Low (reactive-only, rate-limited) |
| **Meta Cloud API** | Official Meta Business API | Free for reactive messages | Zero |

Switched via a single `TRANSPORT=` env variable. Same bot logic runs on both.

---

## Pricing plans (sold to gyms)

- **Studio** — single-location gyms: lead capture, trial booking, renewal tracking, check-ins, 24/7 FAQ
- **Chain** — multi-branch operators: everything in Studio + broadcasts, weekly performance recaps, priority handoff

---

## Landing page stack

- Vanilla HTML / CSS / JS — no build step, no framework
- Fontshare (Clash Display) + Google Fonts (Plus Jakarta Sans)
- Animated hero phone mockup with a live self-playing WhatsApp demo (`demo.html`)
- Scroll-triggered entrance animations
- Modal lead capture forms (trial + quote)
- Fully responsive, mobile-first

---

## Live demo

Open `demo.html` for an interactive walkthrough of the bot conversation flow.
