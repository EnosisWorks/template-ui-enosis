/* =====================================================================
   Ekrany logowania — minimalna logika demonstracyjna.
   Przy podpięciu backendu zostaw obsługę pól, a submit zamień na wywołanie API.
   ===================================================================== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* przełączanie ekranów: login → mfa → reset → sent */
  function screen(name) {
    $$('[data-screen]').forEach(s => s.hidden = s.dataset.screen !== name);
    const first = $(`[data-screen="${name}"] input`); first?.focus();
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-screen-go]');
    if (go) { e.preventDefault(); screen(go.dataset.screenGo); }
  });

  /* podgląd hasła */
  $('#togglePass')?.addEventListener('click', () => {
    const inp = $('#pass'), on = inp.type === 'password';
    inp.type = on ? 'text' : 'password';
    $('#togglePass').innerHTML = `<svg class="i i--sm"><use href="#i-eye${on ? '-off' : ''}"/></svg>`;
    $('#togglePass').setAttribute('aria-label', on ? 'Ukryj hasło' : 'Pokaż hasło');
    inp.focus();
  });

  /* podpowiedź o Caps Locku */
  $('#pass')?.addEventListener('keyup', e => {
    const caps = e.getModifierState && e.getModifierState('CapsLock');
    $('#capsHint').hidden = !caps;
  });

  /* logowanie: walidacja, stan zajętości, przejście do kodu */
  $('#loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const mail = $('#email').value.trim(), pass = $('#pass').value;
    const err = $('#loginErr');
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail) || pass.length < 3) { err.hidden = false; return; }
    err.hidden = true;
    const btn = $('#loginBtn');
    btn.classList.add('is-busy');
    btn.innerHTML = '<span class="spin"></span> Logowanie';
    setTimeout(() => {
      btn.classList.remove('is-busy'); btn.textContent = 'Zaloguj się';
      $('#mfaMail').textContent = mail;
      screen('mfa'); startTimer(42);
    }, 900);
  });

  /* kod jednorazowy: automatyczne przechodzenie między polami i wklejanie */
  const box = $('#codeBox');
  if (box) {
    const cells = $$('input', box);
    cells.forEach((c, i) => {
      c.addEventListener('input', () => {
        c.value = c.value.replace(/\D/g, '').slice(0, 1);
        if (c.value && cells[i + 1]) cells[i + 1].focus();
      });
      c.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !c.value && cells[i - 1]) cells[i - 1].focus();
        if (e.key === 'ArrowLeft' && cells[i - 1]) cells[i - 1].focus();
        if (e.key === 'ArrowRight' && cells[i + 1]) cells[i + 1].focus();
      });
      c.addEventListener('paste', e => {
        const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
        if (!t) return;
        e.preventDefault();
        cells.forEach((x, k) => x.value = t[k] || '');
        cells[Math.min(t.length, cells.length) - 1].focus();
      });
    });
  }
  $('#mfaForm')?.addEventListener('submit', e => { e.preventDefault(); window.location.href = 'index.html'; });

  /* odliczanie do ponownej wysyłki kodu */
  let tid;
  function startTimer(sec) {
    const el = $('#timer'), link = $('#resend');
    clearInterval(tid);
    const tick = () => {
      el.textContent = '(' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') + ')';
      link.style.pointerEvents = sec > 0 ? 'none' : '';
      link.style.opacity = sec > 0 ? '.5' : '';
      if (sec-- <= 0) { clearInterval(tid); el.textContent = ''; }
    };
    tick(); tid = setInterval(tick, 1000);
  }
  $('#resend')?.addEventListener('click', e => { e.preventDefault(); startTimer(42); });

  /* odzyskiwanie hasła */
  $('#resetForm')?.addEventListener('submit', e => {
    e.preventDefault();
    $('#sentMail').textContent = $('#resetMail').value.trim() || 'podany adres';
    screen('sent');
  });
})();
