/* =====================================================================
   ADMIN UI — minimalna warstwa zachowań (bez zależności).
   Każdy blok odpowiada jednemu zachowaniu; przy przejściu na React
   zamień je na stan komponentu, a klasy CSS zostaw bez zmian.
   ===================================================================== */
(function () {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------------------------------------- przełączanie widoków */
  function goto(view, el) {
    $$('[data-view]').forEach(v => v.hidden = v.dataset.view !== view);
    // aktywna jest kliknięta pozycja menu, a gdy wejście było skądinąd — pierwsza pasująca
    const nav = $$('.sidebar .nav__item[data-goto]');
    const current = (el && el.closest('.sidebar .nav__item')) || nav.find(b => b.dataset.goto === (view === 'detail' ? 'table' : view));
    nav.forEach(b => b === current ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
    const names = {
      dashboard:['Przegląd','Pulpit'], reports:['Przegląd','Raporty'], inbox:['Przegląd','Skrzynka zadań'],
      table:['Operacje','Zlecenia'], detail:['Operacje','ZL-2481'], documents:['Operacje','Dokumenty'],
      products:['Katalog','Produkty'], variants:['Katalog','Warianty'], pricelists:['Katalog','Cenniki'],
      users:['Administracja','Użytkownicy'], roles:['Administracja','Role i uprawnienia'],
      settings:['Administracja','Ustawienia'], components:['Administracja','Komponenty']
    };
    const [section, title] = names[view] || ['', view];
    const crumb = $('#crumbNow'); if (crumb) crumb.textContent = title;
    const crumbSection = $('#crumbSection'); if (crumbSection) crumbSection.textContent = section;
    // podmenu z aktywną pozycją zostaje rozwinięte
    current?.closest('.nav__sub')?.previousElementSibling?.setAttribute('aria-expanded', 'true');
    document.querySelector('.main').scrollTo?.(0, 0);
    window.scrollTo(0, 0);
    $('#app').classList.remove('app--nav-open');
  }

  /* --------------------------------------------- menu boczne: zwijanie */
  $('#collapseToggle')?.addEventListener('click', () => $('#app').classList.toggle('app--collapsed'));
  $('#navToggle')?.addEventListener('click', () => $('#app').classList.toggle('app--nav-open'));

  /* ------------------------------------------------------- tryb ciemny */
  const applyTheme = t => { document.documentElement.dataset.theme = t; try { localStorage.setItem('admin-theme', t); } catch (e) {} };
  try { const t = localStorage.getItem('admin-theme'); if (t) applyTheme(t); } catch (e) {}
  const toggleTheme = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#themeToggle')?.addEventListener('click', toggleTheme);
  $('#cmdkTheme')?.addEventListener('click', toggleTheme);

  /* --------------------------------------------------- wysuwane menu */
  function closeMenus(except) { $$('.menu[data-open]').forEach(m => { if (m !== except) delete m.dataset.open; }); }

  /* --------------------------------------- okna: modal, szuflada, toast */
  const openOverlay = el => { el.dataset.open = ''; const f = el.querySelector('input,button'); f?.focus(); };
  const closeOverlay = el => delete el.dataset.open;
  function toast(text, kind) {
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.innerHTML = '<svg class="i"><use href="#i-check"/></svg><div>' + text + '</div>';
    box.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /* ------------------------------------------- jeden listener na klik */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-goto],[data-menu],[data-modal],[data-drawer],[data-close],[data-toast],[data-parent],[data-tab],.segment button,.btn-group .btn,[data-sort],.chip__x');
    if (!t) { closeMenus(); return; }

    // nawigacja
    if (t.dataset.goto) { e.preventDefault(); goto(t.dataset.goto, t); }

    // menu wysuwane (topbar, wiersze tabeli)
    if (t.dataset.menu) {
      e.preventDefault(); e.stopPropagation();
      const m = document.getElementById(t.dataset.menu);
      const wasOpen = 'open' in m.dataset;
      closeMenus(); if (wasOpen) { delete m.dataset.open; return; }
      if (m.style.position === 'absolute' && !m.closest('.menu-wrap')) {  // menu wiersza
        const r = t.getBoundingClientRect(), p = m.offsetParent.getBoundingClientRect();
        m.style.top = (r.bottom - p.top + 4) + 'px';
        m.style.left = (r.right - p.left - m.offsetWidth) + 'px';
      }
      m.dataset.open = '';
    }

    // podmenu w menu bocznym
    if (t.dataset.parent !== undefined && t.classList.contains('nav__item--parent'))
      t.setAttribute('aria-expanded', t.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');

    // okna
    if (t.dataset.modal) { e.preventDefault(); openOverlay(document.getElementById(t.dataset.modal)); }
    if (t.dataset.drawer) { e.preventDefault(); document.getElementById(t.dataset.drawer).dataset.open = ''; }
    if (t.dataset.close !== undefined) {
      const o = t.closest('.overlay, .drawer'); if (o) { closeOverlay(o); }
    }
    if (t.dataset.toast !== undefined) toast(t.dataset.toast, 'ok');

    // zakładki
    if (t.dataset.tab) {
      const scope = t.closest('.card') || document;
      $$('.tab', scope).forEach(x => x.setAttribute('aria-selected', String(x === t)));
      $$('[data-tabpanel]', scope).forEach(p => p.hidden = p.dataset.tabpanel !== t.dataset.tab);
    }

    // przełączniki segmentowe
    if (t.matches('.segment button, .btn-group .btn')) {
      t.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
    }

    // chip: usuń filtr
    if (t.classList.contains('chip__x')) { e.preventDefault(); t.closest('.chip').remove(); }

    // sortowanie kolumny
    if (t.closest('[data-sort]')) sortTable(t.closest('th'));
  });

  // kliknięcie poza oknem zamyka overlay
  $$('.overlay').forEach(o => o.addEventListener('mousedown', e => { if (e.target === o) closeOverlay(o); }));

  /* --------------------------------------------------------- klawisze */
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openOverlay($('#cmdkOverlay')); }
    if (e.key === 'Escape') { $$('.overlay[data-open], .drawer[data-open]').forEach(closeOverlay); closeMenus(); }
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $('#globalSearch')?.focus(); }
  });

  /* ------------------------------------------- tabela: zaznaczanie wierszy */
  function refreshBulk(table) {
    const rows = $$('tbody [data-check-row]', table);
    const sel = rows.filter(c => c.checked);
    rows.forEach(c => c.closest('tr').toggleAttribute('data-selected', c.checked));
    const bar = $('#bulkbar');
    if (bar) { bar.hidden = sel.length === 0; $('#bulkCount').textContent = sel.length; }
    const all = $('[data-check-all]', table);
    if (all) { all.checked = sel.length === rows.length && rows.length > 0; all.indeterminate = sel.length > 0 && sel.length < rows.length; }
  }
  document.addEventListener('change', e => {
    const table = e.target.closest('table');
    if (!table) return;
    if (e.target.matches('[data-check-all]')) $$('tbody [data-check-row]', table).forEach(c => c.checked = e.target.checked);
    if (e.target.matches('[data-check-all],[data-check-row]')) refreshBulk(table);
  });

  /* ------------------------------------ tabela: szukanie i filtr kolumny */
  function applyFilters(table) {
    const search = $(`[data-table-search="${table.id}"]`);
    const q = (search?.value || '').trim().toLowerCase();
    const filters = $$(`[data-table-filter="${table.id}"]`).map(f => ({ col: +f.dataset.col, val: f.value.trim().toLowerCase() })).filter(f => f.val);
    $$('tbody tr', table).forEach(tr => {
      const cells = Array.from(tr.cells).map(td => td.textContent.trim().toLowerCase());
      const okSearch = !q || cells.some(c => c.includes(q));
      const okFilter = filters.every(f => (cells[f.col] || '').includes(f.val));
      tr.hidden = !(okSearch && okFilter);
    });
  }
  document.addEventListener('input', e => {
    if (e.target.dataset.tableSearch) applyFilters(document.getElementById(e.target.dataset.tableSearch));
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.tableFilter) applyFilters(document.getElementById(e.target.dataset.tableFilter));
  });

  /* ------------------------------------------------ tabela: sortowanie */
  function sortTable(th) {
    const table = th.closest('table'), tbody = table.tBodies[0];
    const idx = Array.from(th.parentElement.children).indexOf(th);
    const dir = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
    $$('th', table).forEach(h => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
    const num = th.dataset.type === 'num';
    const val = tr => {
      const s = tr.cells[idx].textContent.trim();
      return num ? parseFloat(s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0 : s.toLowerCase();
    };
    Array.from(tbody.rows).sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * dir)
      .forEach(tr => tbody.appendChild(tr));
  }

  /* ---------------------------------------- wybór w kartach typu choice */
  document.addEventListener('change', e => {
    if (e.target.matches('.choice input[type="radio"]')) {
      const name = e.target.name;
      $$(`.choice input[name="${name}"]`).forEach(i => i.closest('.choice').classList.toggle('choice--on', i.checked));
    }
  });

  window.adminUI = { goto, toast };   // przydatne w konsoli i przy testach
})();
