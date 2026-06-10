/* ============================================================
   GymPulse - demo page chat players
   Same WhatsApp-bubble player as the homepage hero (script.js),
   generalized to run N independent self-playing convos, one
   per scenario phone, each starting when it scrolls into view.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function demoDate(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  var DEMOS = [
    {
      // Exact onboarding flow: numbered goal menu → name → age skip → time menu → summary
      id: "lead-capture",
      script: [
        { side: "in", t: "Hi, are you open for new members?" },
        { side: "out", t: "Welcome to FitZone Gym! 💪 I'm your virtual assistant.<br><br>First, what's your main fitness goal?<br>1. Weight loss<br>2. Muscle gain<br>3. General fitness<br>4. Something else<br><br>Reply with a number (1-4)." },
        { side: "in", t: "2" },
        { side: "out", t: "Got it -- Muscle gain! What's your name?" },
        { side: "in", t: "Aditi" },
        { side: "out", t: "Nice to meet you, Aditi! What's your age? (You can reply *skip* if you'd rather not say.)" },
        { side: "in", t: "skip" },
        { side: "out", t: "Almost done! When do you usually prefer to train?<br>1. Morning<br>2. Evening<br>3. Flexible / either<br><br>Reply with a number (1-3)." },
        { side: "in", t: "2" },
        { side: "out", t: "Thanks, Aditi! Here's what I noted:<br>- Goal: Muscle gain<br>- Preferred time: Evening<br><br>Want to try us out with a *FREE trial session*? Just reply *trial* and I'll show you available slots!<br>You can also ask me about pricing, location, hours, or anything else about FitZone Gym." }
      ]
    },
    {
      // Slot listing → numbered pick → yes/no confirm → confirmed
      id: "trial-booking",
      script: [
        { side: "in", t: "trial" },
        { side: "out", t: "Here are our upcoming free trial slots:<br>1. " + demoDate(2) + ", 6:00 AM (3 spots left)<br>2. " + demoDate(4) + ", 7:00 PM (2 spots left)<br><br>Reply with the slot number to book it." },
        { side: "in", t: "1" },
        { side: "out", t: "Confirm your free trial for *" + demoDate(2) + ", 6:00 AM*?<br><br>Reply *yes* to confirm or *no* to pick another slot." },
        { side: "in", t: "yes" },
        { side: "out", t: "You're all set! ✅ Your free trial is booked for *" + demoDate(2) + ", 6:00 AM*.<br>We'll send you a reminder before your session. See you at the gym!" }
      ]
    },
    {
      // Actual scheduler text from jobs.js trialReminders()
      id: "trial-reminders",
      script: [
        { side: "out", t: "⏰ Reminder: your free trial at FitZone Gym is coming up today at 7:00 AM. We're at 123 MG Road, Your City - 110001 -- see you soon!" },
        { side: "in", t: "thanks, on my way!" },
        { side: "out", t: "See you shortly! 💪 Arrive a few minutes early to get set up." }
      ]
    },
    {
      // Actual expiry reminder text from jobs.js expiryMemberReminders() + actual renewal.js reply
      id: "renewals",
      script: [
        { side: "out", t: "Hi Rohan, your *Monthly* membership at FitZone Gym expires in 7 days, on " + demoDate(7) + ". Reply *renew* and our team will get you sorted -- no gap in your training!" },
        { side: "in", t: "renew" },
        { side: "out", t: "Awesome -- we've noted that you'd like to renew! 🎉 Our team will reach out shortly to sort out the details and payment." }
      ]
    },
    {
      // Actual checkin.js responses — also shows the duplicate-check branch
      id: "check-in",
      script: [
        { side: "in", t: "in" },
        { side: "out", t: "Checked in! 🏋️ Have a great workout, Aditi!" },
        { side: "in", t: "in" },
        { side: "out", t: "You're already checked in for today. Keep crushing it! 💪" }
      ]
    },
    {
      // Actual inactivityCheck() text from jobs.js
      id: "win-back",
      script: [
        { side: "out", t: "We miss you at FitZone Gym, Karan! 👋 It's been a while since your last visit. Need a hand getting back on track? Just reply and we'll have a trainer check in with you." },
        { side: "in", t: "yeah been swamped, want to come back" },
        { side: "out", t: "Great to hear — your membership is still active. Just text *in* when you arrive and we'll get you back on track! 💪" }
      ]
    },
    {
      // Actual feedback.js requestFeedback() + finish() on score ≥ 3 with real plan list
      id: "trial-feedback",
      script: [
        { side: "out", t: "Hey Aditi! How did your free trial go? Reply with a rating from 1 (not for me) to 5 (loved it!)." },
        { side: "in", t: "5" },
        { side: "out", t: "Awesome, glad you enjoyed it! 🎉 Ready to make it official? Here are our membership plans:<br>- Monthly: Rs. 1500 (30 days)<br>- Quarterly: Rs. 4000 (90 days)<br>- Annual: Rs. 14000 (365 days)<br><br>Reply with the plan name you'd like, or *talk to staff* and our team will reach out to help you join." }
      ]
    },
    {
      // Actual FAQ replies from gymInfo.js (price keyword → pricing reply, parking keyword → parking reply)
      id: "faq",
      script: [
        { side: "in", t: "membership cost kitna hai?" },
        { side: "out", t: "Our membership plans:<br>- Monthly: Rs. 1500<br>- Quarterly: Rs. 4000<br>- Annual: Rs. 14000<br><br>Want a free trial session first? Just reply *trial* to book one!" },
        { side: "in", t: "parking hai kya?" },
        { side: "out", t: "Yes! Free parking is available on-site." }
      ]
    },
    {
      // Actual statusHandler.js reply() — open branch
      id: "open-closed",
      script: [
        { side: "in", t: "are you open right now?" },
        { side: "out", t: "Yes, we're open right now! Today's hours: Mon-Sat 06:00-21:00, Sun 07:00-20:00.<br>FitZone Gym is at 123 MG Road, Your City - 110001." },
        { side: "in", t: "kya kal band hoga?" },
        { side: "out", t: "We're closed right now. Our hours are Mon-Sat 06:00-21:00, Sun 07:00-20:00. We open again at 06:00." }
      ]
    },
    {
      // Admin commands use ! prefix. Shows !leads (actual format) + !broadcast (actual throttled-send reply)
      id: "run-from-phone",
      script: [
        { side: "in", t: "!leads" },
        { side: "out", t: "*Today's new leads (4)*<br>- Aditi (919876000001) -- goal: muscle_gain<br>- Karan (919876000002) -- goal: weight_loss<br>- Priya (919876000003) -- goal: general_fitness<br>- Ravi (919876000004) -- goal: n/a" },
        { side: "in", t: "!addmember 919876000010 Monthly" },
        { side: "out", t: "Added 919876000010 as a *Monthly* member. Active until " + demoDate(30) + ". Recorded payment of Rs 1,500." },
        { side: "in", t: "!broadcast We added a new strength area — come check it out this week!" },
        { side: "out", t: "Broadcasting to 24 member(s)... this will take a few minutes (throttled sends)." }
      ]
    },
    {
      // Actual weeklySummary() + expiryAdminDigest() text from jobs.js
      id: "digests",
      script: [
        { side: "out", t: "*FitZone Gym -- weekly summary*<br>New leads: 8<br>Trials booked: 5<br>New members: 3<br>Check-ins logged: 67<br>Expiring in next 7 days: 4" },
        { side: "out", t: "*Expiring this week (3)*<br>- Rohan (91987600001) -- Monthly, expires " + demoDate(3) + "<br>- Priya (91987600002) -- Quarterly, expires " + demoDate(5) + "<br>- Iqbal (91987600003) -- Annual, expires " + demoDate(6) }
      ]
    },
    {
      // Actual handoffHandler.js handle() — staff-request branch + join-intent branch
      id: "human-handoff",
      script: [
        { side: "in", t: "I want to cancel my membership" },
        { side: "out", t: "No problem -- I've let our team know you'd like to talk to a person. Someone will reach out to you shortly. You can also call us directly at +91 90000 00000." },
        { side: "in", t: "Monthly" },
        { side: "out", t: "Great choice -- the *Monthly* plan (Rs. 1500)! 🎉 Our team will reach out shortly to set up your membership and payment. Welcome aboard!" }
      ]
    },
    {
      // Actual !revenue and !analytics output format from adminHandler.js
      id: "revenue",
      script: [
        { side: "in", t: "!revenue" },
        { side: "out", t: "*FitZone Gym -- revenue*<br>Today: Rs 4,500 (3)<br>Last 7 days: Rs 21,000 (9)<br>This month: Rs 86,500 (41)<br>Last month: Rs 78,000 (36)<br>All-time: Rs 1,20,000 (78)<br><br>This month by plan:<br>- Annual: Rs 42,000 (3x)<br>- Quarterly: Rs 28,000 (7x)<br>- Monthly: Rs 16,500 (11x)<br><br>Tip: *!revenue YYYY-MM* for any month's breakdown." },
        { side: "in", t: "!analytics 30" },
        { side: "out", t: "*FitZone Gym -- last 30 days*<br><br>*Funnel*<br>New leads: 27<br>Trials booked: 14<br>Trials completed: 11<br>Avg trial rating: 4.2<br><br>*Revenue*<br>Collected: Rs 86,500 (41 payments)<br><br>*Attendance*<br>Check-ins: 412 (38 unique members)<br>Avg per day: 13.7<br><br>*Membership*<br>Active members: 183<br>Past expiry (need renewal follow-up): 6" }
      ]
    }
  ];

  function clock() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + (m < 10 ? "0" + m : m) + " " + ap;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function makeBubble(m) {
    var b = document.createElement("div");
    b.className = "bubble bubble--" + m.side;
    b.innerHTML = m.t + '<span class="bubble__meta">' + clock() + (m.side === "out" ? " &#10003;&#10003;" : "") + "</span>";
    return b;
  }
  function makeTyping() {
    var t = document.createElement("div");
    t.className = "typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    return t;
  }

  async function playChat(chat, script) {
    while (true) {
      chat.innerHTML = "";
      for (var i = 0; i < script.length; i++) {
        var m = script[i];
        if (m.side === "out") {
          var dots = makeTyping();
          chat.appendChild(dots);
          requestAnimationFrame(function () { dots.classList.add("in-view"); });
          chat.scrollTop = chat.scrollHeight;
          await wait(950);
          dots.remove();
        }
        var b = makeBubble(m);
        chat.appendChild(b);
        void b.offsetWidth;
        b.classList.add("in-view");
        chat.scrollTop = chat.scrollHeight;
        await wait(m.side === "in" ? 750 : 1150);
      }
      await wait(2800);
    }
  }

  function renderStaticChat(chat, script) {
    chat.innerHTML = "";
    script.forEach(function (m) {
      var b = makeBubble(m);
      b.classList.add("in-view");
      chat.appendChild(b);
    });
  }

  DEMOS.forEach(function (demo) {
    var chat = document.getElementById("chat-" + demo.id);
    if (!chat) return;

    if (reduce) {
      renderStaticChat(chat, demo.script);
    } else if ("IntersectionObserver" in window) {
      var started = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; playChat(chat, demo.script); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(chat);
    } else {
      playChat(chat, demo.script);
    }
  });
})();
