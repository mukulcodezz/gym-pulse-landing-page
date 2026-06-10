/* GymPulse landing chatbot widget — self-contained IIFE, no dependencies */
(function () {
  'use strict';

  var MAX_MSGS = 10;
  var SESSION_KEY = 'gp_demo_sid';
  var COUNT_KEY = 'gp_demo_cnt';

  function store(key, val) { try { localStorage.setItem(key, val); } catch (_) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }

  function getSessionId() {
    var id = load(SESSION_KEY);
    if (!id || !/^gp-[a-z0-9]+-[a-z0-9]+$/.test(id)) {
      id = ('gp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11)).toLowerCase();
      store(SESSION_KEY, id);
    }
    return id;
  }

  function getCount() { return Math.min(parseInt(load(COUNT_KEY) || '0', 10), MAX_MSGS); }
  function incCount() { var n = getCount() + 1; store(COUNT_KEY, n); return n; }

  var SID = getSessionId();
  var isOpen = false;
  var busy = false;

  /* ── Build widget DOM ── */
  var btn = document.createElement('button');
  btn.className = 'cb-btn';
  btn.setAttribute('aria-label', 'Open GymPulse demo chat');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML =
    '<span class="cb-btn-ic" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">' +
        '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
      '</svg>' +
    '</span>';

  var panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'GymPulse demo assistant');
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML =
    '<div class="cb-head">' +
      '<div class="cb-av" aria-hidden="true">GP</div>' +
      '<div class="cb-meta">' +
        '<strong>GymPulse Demo</strong>' +
        '<span>Ask me anything <em>(try Hinglish!)</em></span>' +
      '</div>' +
      '<button class="cb-x" aria-label="Close chat">&times;</button>' +
    '</div>' +
    '<div class="cb-body" id="cb-body" aria-live="polite" aria-relevant="additions"></div>' +
    '<div class="cb-quota" id="cb-quota"></div>' +
    '<div class="cb-foot" id="cb-foot">' +
      '<input class="cb-in" id="cb-in" type="text"' +
        ' placeholder="e.g. features kya hain? / what\'s the price?"' +
        ' autocomplete="off" maxlength="300" />' +
      '<button class="cb-go" id="cb-go" type="button" aria-label="Send">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">' +
          '<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var bodyEl  = document.getElementById('cb-body');
  var quotaEl = document.getElementById('cb-quota');
  var footEl  = document.getElementById('cb-foot');
  var inputEl = document.getElementById('cb-in');
  var sendEl  = document.getElementById('cb-go');
  var closeEl = panel.querySelector('.cb-x');

  /* ── Helpers ── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    removeBadge();
    if (!bodyEl.hasChildNodes()) greet();
    setTimeout(function () { inputEl.focus(); }, 60);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
  }

  function addBadge() {
    if (btn.querySelector('.cb-badge')) return;
    var b = document.createElement('span');
    b.className = 'cb-badge';
    b.setAttribute('aria-hidden', 'true');
    b.textContent = '1';
    btn.appendChild(b);
  }

  function removeBadge() {
    var b = btn.querySelector('.cb-badge');
    if (b) b.remove();
  }

  function updateQuota() {
    var left = Math.max(0, MAX_MSGS - getCount());
    if (left <= 0) { quotaEl.textContent = ''; return; }
    quotaEl.innerHTML =
      '<strong>' + left + '</strong> demo question' + (left === 1 ? '' : 's') + ' left';
  }

  function bubble(text, side) {
    var d = document.createElement('div');
    d.className = 'cb-msg cb-msg--' + side;
    d.textContent = text;
    bodyEl.appendChild(d);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return d;
  }

  function typing() {
    var d = document.createElement('div');
    d.className = 'cb-dots';
    d.setAttribute('aria-label', 'Thinking…');
    d.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(d);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return d;
  }

  function lockFoot(phone) {
    var cta = document.createElement('div');
    cta.className = 'cb-cta';
    cta.textContent = 'Demo limit reached.';
    if (phone) {
      cta.appendChild(document.createTextNode(' For a full walkthrough: '));
      var a = document.createElement('a');
      a.href = 'https://wa.me/' + phone.replace(/[^0-9]/g, '');
      a.textContent = phone;
      cta.appendChild(a);
    }
    footEl.textContent = '';
    footEl.appendChild(cta);
    quotaEl.textContent = '';
  }

  function greet() {
    if (getCount() >= MAX_MSGS) {
      bubble('You\'ve already used the demo limit. Contact the owner for a live walkthrough!', 'bot');
      lockFoot(null);
      return;
    }
    bubble(
      'Hi! I\'m the GymPulse demo assistant. ' +
      'Ask about features, pricing, or how it works. ' +
      'Hinglish works too — try "price kya hai?" 💪',
      'bot'
    );
    updateQuota();
  }

  /* ── Send flow ── */
  async function send() {
    var text = inputEl.value.trim();
    if (!text || busy) return;
    if (getCount() >= MAX_MSGS) { lockFoot(null); return; }

    inputEl.value = '';
    sendEl.disabled = true;
    busy = true;

    bubble(text, 'user');
    var dots = typing();

    try {
      var resp = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': SID,
        },
        body: JSON.stringify({ message: text }),
      });

      var data = await resp.json();
      dots.remove();

      if (data.reply) {
        incCount();
        bubble(data.reply, 'bot');
        updateQuota();
        if (data.limitReached || getCount() >= MAX_MSGS) {
          lockFoot(data.ownerPhone || null);
        }
        if (!isOpen) addBadge();
      } else {
        bubble('Something went wrong — please try again.', 'bot');
      }
    } catch (_) {
      dots.remove();
      bubble(
        'Could not reach the demo server. ' +
        'Make sure it is running: npm run landing',
        'bot'
      );
    }

    sendEl.disabled = false;
    busy = false;
    if (document.activeElement !== inputEl) inputEl.focus();
  }

  /* ── Events ── */
  btn.addEventListener('click', function () { isOpen ? closePanel() : openPanel(); });
  closeEl.addEventListener('click', closePanel);
  sendEl.addEventListener('click', send);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closePanel();
  });
  document.addEventListener('click', function (e) {
    if (isOpen && !panel.contains(e.target) && !btn.contains(e.target)) closePanel();
  });

  /* Nudge badge after 3 s if user hasn't opened */
  setTimeout(function () { if (!isOpen) addBadge(); }, 3000);
  updateQuota();
})();
