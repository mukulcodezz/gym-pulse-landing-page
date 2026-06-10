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
      id: "lead-capture",
      script: [
        { side: "in", t: "Hi, are you open for new members?" },
        { side: "out", t: "Hey! Yes — I'm the FitZone assistant 👋 What's your main goal: weight loss, muscle gain or general fitness?" },
        { side: "in", t: "muscle gain" },
        { side: "out", t: "Got it 💪 What's your name and best time to train?" },
        { side: "in", t: "Aditi, evenings" },
        { side: "out", t: "Thanks Aditi — saved! A trainer will reach out, and I can book your free trial whenever you're ready." }
      ]
    },
    {
      id: "trial-booking",
      script: [
        { side: "in", t: "Can I try a class before joining?" },
        { side: "out", t: "Of course! Open trial slots:<br>1. " + demoDate(2) + " – 6:00 PM (3 spots)<br>2. " + demoDate(4) + " – 7:00 AM (5 spots)" },
        { side: "in", t: "2" },
        { side: "out", t: "Booked ✅ " + demoDate(4) + ", 7:00 AM. I'll remind you the day before — see you then!" }
      ]
    },
    {
      id: "trial-reminders",
      script: [
        { side: "out", t: "Hey Aditi — reminder: your free trial is tomorrow at 7:00 AM 🏋️ Bring water and a towel." },
        { side: "in", t: "got it, I'll be there" },
        { side: "out", t: "Perfect, see you then! Reply RESCHEDULE anytime if plans change." }
      ]
    },
    {
      id: "renewals",
      script: [
        { side: "out", t: "Hey Rohan — your membership expires in 7 days (" + demoDate(7) + "). Renew now and lock in your rate?" },
        { side: "in", t: "yes, renew me" },
        { side: "out", t: "Done ✅ Renewed for 1 month, charged to your saved method. Receipt sent — see you at the gym!" }
      ]
    },
    {
      id: "check-in",
      script: [
        { side: "in", t: "in" },
        { side: "out", t: "Checked in at 6:42 AM ✅ That's session 5 this week — you're on a streak 🔥" },
        { side: "in", t: "let's go" },
        { side: "out", t: "Two more this week and you hit your monthly goal 🎯" }
      ]
    },
    {
      id: "win-back",
      script: [
        { side: "out", t: "Hey Karan — haven't seen you at FitZone in 3 weeks 👀 Come back this week and your next PT session is on us." },
        { side: "in", t: "been swamped with work, but ok — saturday?" },
        { side: "out", t: "Saturday it is. I've blocked a slot and told your trainer — see you then!" }
      ]
    },
    {
      id: "trial-feedback",
      script: [
        { side: "out", t: "Hey Aditi — how did this morning's trial feel? Rate it 1–5 ⭐" },
        { side: "in", t: "5! loved the trainer" },
        { side: "out", t: "Love to hear it 🙌 Want to lock in your trial-week price before it expires Friday?" }
      ]
    },
    {
      id: "faq",
      script: [
        { side: "in", t: "what's the chain plan price, and is there parking?" },
        { side: "out", t: "Chain plan starts at ₹1,999/month for multi-branch access, and yes — free parking at every branch 🚗 Anything else — hours, trainers, facilities?" }
      ]
    },
    {
      id: "open-closed",
      script: [
        { side: "in", t: "are you open right now?" },
        { side: "out", t: "Yes — open till 10 PM today. Heads up: closed tomorrow for deep cleaning, back to normal hours Monday 6 AM." }
      ]
    },
    {
      id: "run-from-phone",
      script: [
        { side: "in", t: "/leads today" },
        { side: "out", t: "📋 4 new leads today:<br>• Aditi — muscle gain, evenings<br>• Karan — requested a trial<br>+2 more — send /leads all for the full list" },
        { side: "in", t: "/broadcast 20% off this week → members expiring soon" },
        { side: "out", t: "Queued to 18 members with memberships expiring this month ✅ Sending now…" }
      ]
    },
    {
      id: "digests",
      script: [
        { side: "out", t: "🌅 Morning digest — " + demoDate(0) + "<br>• 3 memberships expiring today<br>• 2 new leads overnight<br>• 11 check-ins so far" },
        { side: "in", t: "send renewal reminders to those 3" },
        { side: "out", t: "Sent to all three ✅ I'll follow up tomorrow if they haven't renewed yet." }
      ]
    },
    {
      id: "human-handoff",
      script: [
        { side: "in", t: "I want to cancel and get a refund on my membership" },
        { side: "out", t: "I hear you — that needs a person's call. I've flagged this to Priya at the front desk; she'll reach out within the hour. Anything else I can help with meanwhile?" }
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
