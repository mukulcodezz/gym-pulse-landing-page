/* ============================================================
   GymPulse - interactions
   GSAP (CDN) drives entry + scroll choreography.
   Graceful fallback if GSAP missing or reduced-motion is set.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";

  /* ---------- year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===========================================================
     SCROLL PROGRESS BAR  (rAF, no scroll-handler reflow loops)
     =========================================================== */
  var progBar = document.getElementById("progBar");
  if (progBar) {
    var ticking = false;
    function updateProg() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || window.scrollY) / max : 0;
      progBar.style.width = (p * 100).toFixed(2) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProg); }
    }, { passive: true });
    updateProg();
  }

  /* ===========================================================
     NAV: condense on scroll
     =========================================================== */
  var nav = document.querySelector(".nav");
  if (nav) {
    var navTick = false;
    window.addEventListener("scroll", function () {
      if (navTick) return;
      navTick = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("is-tight", (window.scrollY || 0) > 80);
        navTick = false;
      });
    }, { passive: true });
  }

  /* ===========================================================
     MOBILE MENU
     =========================================================== */
  var burger = document.querySelector("[data-burger]");
  var menu = document.getElementById("menu");
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    if (nav) nav.classList.remove("is-menu");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      nav.classList.toggle("is-menu", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ===========================================================
     ENTRY + SCROLL CHOREOGRAPHY (GSAP)
     =========================================================== */
  if (hasGSAP && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    /* hero intro timeline */
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero .eyebrow-pill", { y: 20, opacity: 0, duration: 0.6 })
      .from(".hero__title .line > span", { yPercent: 115, rotate: 3, duration: 0.9, stagger: 0.12 }, "-=0.25")
      .from(".hero__sub", { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".hero__actions", { y: 24, opacity: 0, duration: 0.6 }, "-=0.45")
      .from(".hero__points li", { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.4")
      .from(".hero .phone-shell", { y: 60, opacity: 0, scale: 0.94, duration: 1, ease: "power4.out" }, "-=0.9")
      .from(".float-badge", { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.7)" }, "-=0.4");

    /* gentle perpetual float on the phone + badges */
    gsap.to(".phone-shell", { y: -14, duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.4 });
    gsap.to(".float-badge--a", { y: 10, duration: 4, ease: "sine.inOut", repeat: -1, yoyo: true });
    gsap.to(".float-badge--b", { y: -12, duration: 4.6, ease: "sine.inOut", repeat: -1, yoyo: true });

    /* generic fade-up on scroll */
    gsap.utils.toArray('[data-anim="fade"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 86%" },
        y: 34, opacity: 0, duration: 0.8, ease: "power3.out"
      });
    });

    /* tiles: stagger per container (batch) */
    ScrollTrigger.batch('[data-anim="tile"]', {
      start: "top 88%",
      onEnter: function (els) {
        gsap.from(els, { y: 48, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, overwrite: true });
      }
    });

    /* how-it-works steps slide from right + drive progress fill */
    gsap.utils.toArray('[data-anim="step"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%" },
        x: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });
    });
    var howFill = document.getElementById("howFill");
    var howSteps = document.querySelector(".how__steps");
    if (howFill && howSteps) {
      gsap.to(howFill, {
        width: "100%", ease: "none",
        scrollTrigger: { trigger: howSteps, start: "top 70%", end: "bottom 60%", scrub: true }
      });
    }

    /* subtle parallax on orbs */
    gsap.to(".orb--1", { yPercent: 18, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });
    gsap.to(".orb--2", { yPercent: -14, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });

  } else {
    /* no GSAP or reduced motion: reveal everything, no transforms */
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      el.style.opacity = "1"; el.style.transform = "none";
    });
    document.querySelectorAll(".hero__title .line > span").forEach(function (s) { s.style.transform = "none"; });
  }

  /* ===========================================================
     ANIMATED WHATSAPP CHAT  (the product, playing itself)
     =========================================================== */
  var chat = document.getElementById("chat");

  function demoDate(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  var SCRIPT = [
    { side: "in",  t: "Hi, do you have a free trial?" },
    { side: "out", t: "Welcome to FitZone! Of course. What is your main goal?<br>1. Weight loss  2. Muscle gain  3. General fitness" },
    { side: "in",  t: "2" },
    { side: "out", t: "Great choice. Here are our open trial slots:<br>1. " + demoDate(2) + " - 6:00 PM (3 spots)<br>2. " + demoDate(3) + " - 7:00 AM (5 spots)" },
    { side: "in",  t: "1" },
    { side: "out", t: "Booked for " + demoDate(2) + " 6:00 PM. I will remind you before. See you then 💪" }
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

  var playing = false;
  async function playChat() {
    if (!chat || playing) return;
    playing = true;
    while (true) {
      chat.innerHTML = "";
      for (var i = 0; i < SCRIPT.length; i++) {
        var m = SCRIPT[i];
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
        // force reflow then animate in
        void b.offsetWidth;
        b.classList.add("in-view");
        chat.scrollTop = chat.scrollHeight;
        await wait(m.side === "in" ? 750 : 1150);
      }
      await wait(2800);
    }
  }

  function renderStaticChat() {
    if (!chat) return;
    chat.innerHTML = "";
    SCRIPT.forEach(function (m) {
      var b = makeBubble(m);
      b.classList.add("in-view");
      chat.appendChild(b);
    });
  }

  if (chat) {
    if (reduce) {
      renderStaticChat();
    } else if ("IntersectionObserver" in window) {
      var started = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; playChat(); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(chat);
    } else {
      playChat();
    }
  }

  /* ===========================================================
     COUNT-UP STATS
     =========================================================== */
  function countUp(el, to, suffix, dur) {
    dur = dur || 1500;
    if (reduce || to === 0) { el.textContent = to + (suffix || ""); return; }
    var t0 = performance.now();
    (function frame(t) {
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased) + (p === 1 ? (suffix || "") : "");
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }
  var stats = document.querySelectorAll(".stat__num[data-count]");
  if (stats.length && "IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          countUp(el, parseInt(el.dataset.count, 10), el.dataset.suffix || "");
          sio.unobserve(el);
        }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (s) { sio.observe(s); });
  } else {
    stats.forEach(function (s) { s.textContent = s.dataset.count + (s.dataset.suffix || ""); });
  }

  /* ===========================================================
     SPOTLIGHT (cursor-follow glow on bento tiles)
     =========================================================== */
  if (finePointer && !reduce) {
    document.querySelectorAll(".spotlight").forEach(function (tile) {
      tile.addEventListener("pointermove", function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", (e.clientX - r.left) + "px");
        tile.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ===========================================================
     MAGNETIC BUTTONS
     =========================================================== */
  if (finePointer && !reduce) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.22 + "px," + y * 0.32 + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ===========================================================
     MODAL  (quote / trial) + focus trap
     =========================================================== */
  var modal = document.getElementById("modal");
  var modalEyebrow = document.getElementById("modalEyebrow");
  var modalTitle = document.getElementById("modalTitle");
  var modalSub = document.getElementById("modalSub");
  var formIntent = document.getElementById("formIntent");
  var formSubmit = document.getElementById("formSubmit");
  var lastFocused = null;

  var COPY = {
    quote: { eyebrow: "Get a quote", title: "Tell us about your gym", sub: "We will reply with a plan and price built around your size and goals.", submit: "Send request" },
    trial: { eyebrow: "Free trial", title: "Start your free trial", sub: "Share your details and we will set the bot up on your number. No card needed.", submit: "Start free trial" }
  };

  function setEyebrowText(node, text) {
    node.innerHTML = '<span class="dot"></span> ' + text;
  }

  function openModal(intent) {
    var c = COPY[intent] || COPY.quote;
    formIntent.value = intent;
    setEyebrowText(modalEyebrow, c.eyebrow);
    modalTitle.textContent = c.title;
    modalSub.textContent = c.sub;
    formSubmit.textContent = c.submit;
    resetForm();
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var first = document.getElementById("f-name");
    if (first) setTimeout(function () { first.focus(); }, 80);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-open-quote]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); closeMenu(); openModal("quote"); });
  });
  document.querySelectorAll("[data-open-trial]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); closeMenu(); openModal("trial"); });
  });
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = modal.querySelectorAll('input,select,textarea,button,[href]');
      var list = Array.prototype.filter.call(f, function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("is-open")) closeModal();
      else if (menu && menu.classList.contains("is-open")) closeMenu();
    }
  });

  /* empty social links: stop page reload until real hrefs are added */
  document.querySelectorAll('.social__link[href=""]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ===========================================================
     FORM (front-end only; wire a backend / wa.me link to go live)
     =========================================================== */
  var form = document.getElementById("leadForm");
  var statusEl = document.getElementById("formStatus");

  function resetForm() {
    form.reset();
    statusEl.textContent = "";
    statusEl.className = "form__status";
    form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("is-invalid"); });
    formSubmit.classList.remove("is-loading");
  }
  function setInvalid(name, bad) {
    var input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    var field = input.closest(".field");
    if (field) field.classList.toggle("is-invalid", bad);
  }
  function validate() {
    var ok = true;
    var name = form.name.value.trim();
    var gym = form.gym.value.trim();
    var phone = form.phone.value.trim();
    setInvalid("name", !name); if (!name) ok = false;
    setInvalid("gym", !gym); if (!gym) ok = false;
    var phoneOk = /[0-9]{7,}/.test(phone.replace(/[\s\-()+]/g, ""));
    setInvalid("phone", !phoneOk); if (!phoneOk) ok = false;
    return ok;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = ""; statusEl.className = "form__status";
      if (!validate()) {
        statusEl.textContent = "Please fix the highlighted fields.";
        statusEl.classList.add("is-err");
        return;
      }
      formSubmit.classList.add("is-loading");
      formSubmit.textContent = "Sending...";

      /* ----------------------------------------------------------------
         NO BACKEND YET. This simulates success so the form shows real
         loading + success states. TO GO LIVE replace the setTimeout with:

         A) WhatsApp deep link (fastest):
            var WA_NUMBER = "919000000000"; // country code, no +, no spaces
            var msg = encodeURIComponent(
              "New " + formIntent.value + " request\n" +
              "Name: " + form.name.value + "\nGym: " + form.gym.value +
              "\nPhone: " + form.phone.value + "\nMembers: " + form.size.value +
              "\nNotes: " + form.message.value);
            window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");

         B) A form endpoint (Formspree / Web3Forms / your API):
            fetch("https://your-endpoint", { method:"POST", body:new FormData(form) })
              .then(...).catch(...)
         ---------------------------------------------------------------- */
      setTimeout(function () {
        formSubmit.classList.remove("is-loading");
        var verb = formIntent.value === "trial" ? "trial request" : "quote request";
        statusEl.textContent = "Thanks! Your " + verb + " is in. We will reach out shortly.";
        statusEl.classList.add("is-ok");
        formSubmit.textContent = "Sent";
        setTimeout(closeModal, 2200);
      }, 900);
    });
  }
})();
