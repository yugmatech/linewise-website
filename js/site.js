// Linewise website. Sheets, answers and syntax colours come from js/data.js, made by the real Linewise engine (tools/demo-data).
(() => {
  const D = window.LW;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** A line's text as HTML, coloured by the engine's spans, cut off after `upto` characters. */
  function colour(text, spans, upto = text.length) {
    let out = '', pos = 0;
    for (const [start, len, kind] of [...spans].sort((a, b) => a[0] - b[0])) {
      if (start >= upto) break;
      if (start < pos) continue;
      const end = Math.min(start + len, upto);
      out += esc(text.slice(pos, start)) + `<span class="k-${kind}">${esc(text.slice(start, end))}</span>`;
      pos = end;
    }
    return out + esc(text.slice(pos, upto));
  }

  // Answers that depend on today's date or the visitor's time zone are worked out here, live.
  const dateFmt = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  function live(text) {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plusDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
    switch (text) {
      case 'days until Dec 25': {
        let x = new Date(today.getFullYear(), 11, 25);
        if (x < today) x = new Date(today.getFullYear() + 1, 11, 25);
        return Math.round((x - today) / 864e5) + ' d';
      }
      case 'today + 2 weeks': return dateFmt(plusDays(14));
      case '2 weeks ago': return dateFmt(plusDays(-14));
      case 'next friday + 3 days': return dateFmt(plusDays(((5 - today.getDay() + 7) % 7 || 7) + 3));
      case '3pm in Tokyo': {
        const x = new Date(today); x.setHours(15);
        return x.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', minute: '2-digit' }) + ' Tokyo';
      }
      case 'time in New York':
        return now.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: '2-digit' }) + ' New York';
    }
    return null;
  }
  const answer = line => live(line.t) ?? line.r;

  function rowEl(line, empty) {
    const row = document.createElement('div');
    row.className = 'row' + (line.t.startsWith('# ') ? ' h' : '');
    row.innerHTML = `<div class="src">${empty ? '' : colour(line.t, line.s)}</div><div class="ans" title="Click to copy">${empty ? '' : esc(answer(line))}</div>`;
    row.dataset.t = line.t;
    return row;
  }
  const render = (el, lines) => el.replaceChildren(...lines.map(l => rowEl(l)));

  // ---------- Example sheets ----------
  for (const el of $$('[data-sheet]')) {
    let lines = D[el.dataset.sheet].lines;
    if ('skipHeader' in el.dataset) lines = lines.filter(l => !l.t.startsWith('# '));
    render(el, lines.filter(l => l.t !== ''));
  }
  // Number formats are a setting, not a phrase: show one amount in each.
  render($('#formats'), [['Lakh and crore', 'en-IN'], ['US and UK', 'en-US'], ['Germany and much of Europe', 'de-DE'], ['France', 'fr-FR'], ['Switzerland', 'de-CH']]
    .map(([name, loc]) => ({ t: name, s: [], r: new Intl.NumberFormat(loc, { minimumFractionDigits: 2 }).format(1234567.89) })));
  $('#pad-date').textContent = dateFmt(new Date());
  setInterval(() => { for (const row of $$('.row[data-t]')) { const v = live(row.dataset.t); if (v) $('.ans', row).textContent = v; } }, 30000);

  // ---------- Click an answer to copy it, as in the app ----------
  document.addEventListener('click', e => {
    const ans = e.target.closest('.ans');
    if (!ans || !ans.textContent || ans.classList.contains('copied')) return;
    const value = ans.textContent;
    navigator.clipboard?.writeText(value).catch(() => {});
    ans.classList.add('copied'); ans.textContent = 'Copied';
    setTimeout(() => { if (ans.textContent === 'Copied') ans.textContent = value; ans.classList.remove('copied'); }, 1200);
  });

  // ---------- Hero: the first sheet is there on load, then the next ones are typed out with answers as you'd see them ----------
  const demo = { sheet: $('#demo-sheet'), total: $('#demo-total'), token: 0, auto: !reduce, visible: true };
  const order = $$('.examples [data-demo]').map(b => b.dataset.demo);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function select(name) {
    for (const b of $$('.examples [data-demo]')) b.setAttribute('aria-selected', b.dataset.demo === name);
    demo.total.textContent = '';
  }
  async function next(name, token) {
    if (!demo.auto) return;
    await wait(4800);
    while (!demo.visible) await wait(800);
    if (token === demo.token && demo.auto) type(order[(order.indexOf(name) + 1) % order.length]);
  }
  function show(name) {
    const token = ++demo.token;
    select(name);
    render(demo.sheet, D[name].lines);
    demo.total.textContent = D[name].total;
    next(name, token);
  }
  async function type(name) {
    const token = ++demo.token, lines = D[name].lines;
    select(name);
    demo.sheet.replaceChildren();
    for (const line of lines) {
      const row = rowEl(line, true), src = $('.src', row), ans = $('.ans', row);
      demo.sheet.append(row);
      for (let typed = 1; typed <= line.t.length; typed++) {
        src.innerHTML = colour(line.t, line.s, typed) + '<span class="caret"></span>';
        const now = (line.f || []).filter(([k]) => k <= typed).pop()?.[1] ?? '';
        if (now !== ans.textContent) { ans.textContent = now; ans.classList.remove('pop'); void ans.offsetWidth; ans.classList.add('pop'); }
        await wait(line.t[typed - 1] === ' ' ? 50 + Math.random() * 50 : 22 + Math.random() * 32);
        if (token !== demo.token) return;
      }
      src.innerHTML = colour(line.t, line.s);
      ans.textContent = answer(line);
      await wait(line.t.startsWith('# ') ? 380 : 260);
      if (token !== demo.token) return;
    }
    demo.total.textContent = D[name].total;
    next(name, token);
  }
  for (const b of $$('.examples [data-demo]')) b.addEventListener('click', () => { demo.auto = false; reduce ? show(b.dataset.demo) : type(b.dataset.demo); });
  new IntersectionObserver(([e]) => { demo.visible = e.isIntersecting; }).observe(demo.sheet);
  // Keep the hero as tall as its longest example, so typing never pushes the page around.
  const fitDemo = () => {
    demo.sheet.style.minHeight = '';
    demo.sheet.style.minHeight = Math.max(...order.map(n => { render(demo.sheet, D[n].lines); return demo.sheet.offsetHeight; })) + 'px';
  };
  fitDemo();
  addEventListener('resize', fitDemo);
  show(order[0]);

  // ---------- Guide ----------
  const topics = [];
  for (const l of D.guide.lines) {
    if (l.t.startsWith('# ')) topics.push({ name: l.t.slice(2), lines: [] });
    else if (l.t && topics.length) topics.at(-1).lines.push(l);
  }
  const tabs = $('#guide-tabs'), guideSheet = $('#guide-sheet');
  tabs.innerHTML = topics.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(t.name)}<small>${t.lines.length}</small></button>`).join('');
  const showTopic = i => {
    $$('button', tabs).forEach(b => b.setAttribute('aria-selected', b.dataset.i == i));
    render(guideSheet, topics[i].lines);
  };
  // Hold the sheet at the tallest topic's height, so switching topics doesn't move the page.
  const fitGuide = () => {
    guideSheet.style.minHeight = '';
    guideSheet.style.minHeight = Math.max(...topics.map(t => { render(guideSheet, t.lines); return guideSheet.offsetHeight; })) + 'px';
  };
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showTopic(+b.dataset.i); });
  fitGuide(); showTopic(0);
  addEventListener('resize', () => { const on = $('[aria-selected="true"]', tabs).dataset.i; fitGuide(); showTopic(on); });

  // ---------- Themes window ----------
  const themeSheet = $('#theme-sheet'), themeWin = $('#theme-window'), modeSeg = $('#mode-seg');
  $('#theme-total').textContent = D.theme.total;
  const pick = (group, attr, apply) => {
    const buttons = $$('button', group);
    const set = b => { buttons.forEach(x => x.setAttribute('aria-checked', x === b)); apply(b.getAttribute(attr)); };
    group.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b); });
    set(buttons.find(b => b.getAttribute('aria-checked') === 'true') || buttons[0]);
  };
  pick($('#theme-picker'), 'data-theme', v => { themeSheet.dataset.theme = v; });
  pick(modeSeg, 'data-mode', v => { themeWin.dataset.mode = v; });
  pick($('#font-seg'), 'data-font', v => themeSheet.classList.toggle('mono-font', v === 'mono'));

  // ---------- Light and dark: the system decides until the visitor picks; picking the system's own mode forgets the pick ----------
  const system = matchMedia('(prefers-color-scheme: dark)');
  const scheme = () => root.dataset.scheme || (system.matches ? 'dark' : 'light');
  const matchWindow = () => $(`[data-mode="${scheme()}"]`, modeSeg).click();  // the example window starts in the page's mode
  matchWindow();
  system.addEventListener('change', () => { if (!root.dataset.scheme) matchWindow(); });
  $('#scheme-btn').addEventListener('click', () => {
    const want = scheme() === 'dark' ? 'light' : 'dark', isSystem = want === (system.matches ? 'dark' : 'light');
    const apply = () => {
      if (isSystem) delete root.dataset.scheme; else root.dataset.scheme = want;
      try { isSystem ? localStorage.removeItem('lw-scheme') : localStorage.setItem('lw-scheme', want); } catch {}
      matchWindow();
    };
    document.startViewTransition && !reduce ? document.startViewTransition(apply) : apply();
  });
})();
