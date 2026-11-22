'use strict';
{
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const norm = s => String(s || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
const same = (a, b) => { a = norm(a); b = norm(b); return !!a && (a === b || a + 's' === b || a === b + 's' || a + 'es' === b || a === b + 'es'); };
const fmtT = ms => { const s = Math.round(ms / 1000); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const DAY = 864e5;
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function confirmBox(msg, yes = 'Delete') {
  return new Promise(res => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card pop" role="dialog" aria-modal="true"><p>${esc(msg)}</p><div class="row"><button class="alt" data-v="0">Cancel</button><button data-v="1">${esc(yes)}</button></div></div>`;
    m.addEventListener('click', e => { const v = e.target.dataset?.v; if (v != null || e.target === m) { m.remove(); res(v === '1'); } });
    document.body.append(m); $('button[data-v="0"]', m).focus();
  });
}

/* ---------- state ---------- */
const KEY = 'memgym.v1';
const fresh = () => ({ v: 1, streak: { last: null, count: 0 }, best: {}, hist: [], major: { ...MAJOR }, palaces: [structuredClone(SAMPLE_PALACE)], cards: [], opts: {} });
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
S = { ...fresh(), ...S };
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save. Export a backup from Stats.'); } }
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

function streakNow() { const y = dayKey(new Date(Date.now() - DAY)); return S.streak.last === dayKey() || S.streak.last === y ? S.streak.count : 0; }
function bump() {
  const t = dayKey(); if (S.streak.last === t) return;
  S.streak.count = S.streak.last === dayKey(new Date(Date.now() - DAY)) ? S.streak.count + 1 : 1; S.streak.last = t;
}
function record(g, score, total, ms, label) {
  bump();
  S.hist.unshift({ g, score, total, ms, label, d: Date.now() }); S.hist = S.hist.slice(0, 300);
  const k = g + ':' + total, b = S.best[k];
  const isBest = !b || score > b.score || (score === b.score && ms < b.ms);
  if (isBest) S.best[k] = { score, total, ms, d: Date.now() };
  save(); paintStreak(); return isBest && score > 0;
}
const due = () => S.cards.filter(c => c.due <= Date.now());
function paintStreak() { const n = streakNow(); $('#streakPill').textContent = n ? `🔥 ${n} day${n > 1 ? 's' : ''}` : 'No streak yet'; }

/* ---------- timer ---------- */
let tick = null;
function startTimer(el) { const t0 = Date.now(); stopTimer(); tick = setInterval(() => { if (el.isConnected) el.textContent = fmtT(Date.now() - t0); else stopTimer(); }, 250); return () => Date.now() - t0; }
function stopTimer() { clearInterval(tick); tick = null; }

/* ---------- faces ---------- */
function prng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function faceSVG(seed) {
  const r = prng(seed), pick = a => a[Math.floor(r() * a.length)];
  const skin = pick(['#f6d3b3', '#eab68f', '#cf9466', '#a8693f', '#734628', '#f1c27d']);
  const hair = pick(['#1b1b1b', '#3d2716', '#6b4423', '#b07a3a', '#d8b26a', '#a8401f', '#8d8d8d', '#e6e0d4']);
  const bg = pick(['#dbe7f6', '#f6dde3', '#dcefe6', '#f3ead6', '#e6e0f5', '#d9eef0']);
  const shirt = pick(['#2f4b7c', '#8c1c3a', '#0a7f86', '#5b5b5b', '#d98c2b', '#6d4c9e', '#2e7d32']);
  const style = Math.floor(r() * 6), glasses = r() < .3, beard = r() < .25, brow = 1.5 + r() * 2.5, smile = r(), ey = 58 + r() * 4, eg = 10 + r() * 3, earR = 5 + r() * 2;
  let s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Face"><rect width="120" height="120" fill="${bg}"/>`;
  s += `<path d="M14 120 Q18 92 60 90 Q102 92 106 120Z" fill="${shirt}"/><rect x="52" y="80" width="16" height="14" fill="${skin}"/>`;
  if (style === 1) s += `<path d="M30 58 Q28 22 60 22 Q92 22 90 58 L95 104 L25 104Z" fill="${hair}"/>`;
  if (style === 5) s += `<circle cx="60" cy="20" r="11" fill="${hair}"/>`;
  s += `<circle cx="${60 - 27}" cy="64" r="${earR}" fill="${skin}"/><circle cx="${60 + 27}" cy="64" r="${earR}" fill="${skin}"/>`;
  s += `<ellipse cx="60" cy="62" rx="27" ry="32" fill="${skin}"/>`;
  if (style === 0 || style === 1 || style === 5) s += `<path d="M32 56 Q32 27 60 27 Q88 27 88 56 Q80 40 64 41 Q46 40 32 56Z" fill="${hair}"/>`;
  if (style === 2) s += `<path d="M33 52 Q36 30 60 29 Q84 30 87 52 L84 46 Q60 34 36 46Z" fill="${hair}" opacity=".85"/>`;
  if (style === 3) for (let i = 0; i < 9; i++) { const a = Math.PI * (1 + i / 8); s += `<circle cx="${60 + 28 * Math.cos(a)}" cy="${52 + 24 * Math.sin(a)}" r="9" fill="${hair}"/>`; }
  if (style === 4) s += `<path d="M33 50 Q40 30 60 32 Q78 30 87 50 Q70 36 52 44 Q42 46 33 50Z" fill="${hair}"/>`;
  s += `<path d="M${60 - eg - 6} ${ey - 8} l12 ${r() < .5 ? -1 : 1}" stroke="${hair === '#e6e0d4' ? '#9a9080' : hair}" stroke-width="${brow}" stroke-linecap="round"/><path d="M${60 + eg - 6} ${ey - 8} l12 ${r() < .5 ? -1 : 1}" stroke="${hair === '#e6e0d4' ? '#9a9080' : hair}" stroke-width="${brow}" stroke-linecap="round"/>`;
  s += `<circle cx="${60 - eg}" cy="${ey}" r="2.6" fill="#1d1f27"/><circle cx="${60 + eg}" cy="${ey}" r="2.6" fill="#1d1f27"/>`;
  s += `<path d="M60 ${ey + 3} q-3 9 0 10" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (beard) s += `<path d="M34 66 Q36 96 60 96 Q84 96 86 66 Q80 84 60 84 Q40 84 34 66Z" fill="${hair}"/>`;
  s += `<path d="M${52} ${ey + 18} q8 ${smile * 8 - 1} 16 0" stroke="#7a2a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (glasses) s += `<g fill="none" stroke="#1d1f27" stroke-width="2"><circle cx="${60 - eg}" cy="${ey}" r="7"/><circle cx="${60 + eg}" cy="${ey}" r="7"/><path d="M${60 - eg + 7} ${ey} H${60 + eg - 7}"/></g>`;
  return s + '</svg>';
}

/* ---------- cards ---------- */
const SUITS = [['♠', 'blk'], ['♥', 'red'], ['♦', 'red'], ['♣', 'blk']];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DECK = SUITS.flatMap(([s, c]) => RANKS.map(r => ({ id: r + s, r, s, c })));
const cardById = id => DECK.find(c => c.id === id);
const chip = (id, cls = '') => { const c = cardById(id); return `<span class="chip ${cls}"><span class="${c.c}">${c.r}${c.s}</span></span>`; };

/* ---------- games ---------- */
const GAMES = {
  numbers: {
    title: 'Numbers', blurb: 'Random digits. Use the Major System and a palace.',
    fields: o => `<div class="row"><div class="field"><label for="f-count">Digits</label><select id="f-count">${[10, 20, 30, 40, 50, 80, 100, 200].map(n => `<option ${n == o.count ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label for="f-group">Group by</label><select id="f-group">${[1, 2, 3, 4].map(n => `<option ${n == o.group ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>`,
    defaults: { count: 20, group: 2 },
    read: () => ({ count: +$('#f-count').value, group: +$('#f-group').value }),
    gen: o => Array.from({ length: o.count }, () => rnd(10)).join(''),
    memo: (d, o) => { const g = d.match(new RegExp(`.{1,${o.group}}`, 'g')); return `<div class="digits mono">${g.map(x => `<span>${x}</span>`).join('')}</div><p class="small muted">${o.group === 2 ? 'Tip: each pair is one Major image.' : ''}</p>`; },
    recall: (d, o) => `<label for="r-num">Type the digits in order (${o.count})</label><textarea id="r-num" class="mono" inputmode="numeric" autocomplete="off" spellcheck="false" style="font-size:22px"></textarea>`,
    grade: d => { const a = $('#r-num').value.replace(/\D/g, ''); let sc = 0; const h = [...d].map((x, i) => { const ok = a[i] === x; sc += ok; return `<span class="d ${ok ? 'ok' : 'no'}" title="you: ${a[i] ?? '–'}">${x}</span>`; }).join(''); return { score: sc, total: d.length, detail: `<p class="small muted">Correct digits are green; missed ones are red (hover or long-press to see your answer).</p><div class="res mono" style="font-size:22px;overflow-wrap:anywhere">${h}</div><p class="small">You typed: <span class="mono">${esc(a) || '—'}</span></p>` }; },
  },
  words: {
    title: 'Words', blurb: 'A list of concrete words. Recall them in order.',
    fields: o => `<div class="row"><div class="field"><label for="f-count">Words</label><select id="f-count">${[5, 10, 15, 20, 30, 40, 50].map(n => `<option ${n == o.count ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label for="f-pal">Memory palace</label><select id="f-pal"><option value="">None</option>${S.palaces.map(p => `<option value="${esc(p.id)}" ${p.id === o.pal ? 'selected' : ''}>${esc(p.name)} (${p.loci.length})</option>`).join('')}</select></div></div>`,
    defaults: { count: 10, pal: '' },
    read: () => ({ count: +$('#f-count').value, pal: $('#f-pal').value }),
    check: o => { const p = S.palaces.find(p => p.id === o.pal); return p && p.loci.length < o.count ? `“${p.name}” has only ${p.loci.length} loci. Add more in Palaces or pick fewer words.` : ''; },
    gen: o => sample(WORDS, o.count),
    loci: o => S.palaces.find(p => p.id === o.pal)?.loci || [],
    memo(d, o) { const L = this.loci(o); return `<ol class="list">${d.map((w, i) => `<li><span class="n">${i + 1}</span><span><span class="w">${esc(w)}</span>${L[i] ? `<br><span class="loc">at ${esc(L[i])}</span>` : ''}</span></li>`).join('')}</ol>`; },
    recall(d, o) { const L = this.loci(o); return `<div class="recall">${d.map((_, i) => `<div class="ri"><span class="n">${i + 1}</span><input id="r${i}" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Word ${i + 1}">${L[i] ? `<small>${esc(L[i])}</small>` : ''}</div>`).join('')}</div>`; },
    grade: d => { let sc = 0; const rows = d.map((w, i) => { const a = $('#r' + i).value; const ok = same(a, w); sc += ok; return `<tr><td class="num">${i + 1}</td><td>${esc(w)}</td><td class="${ok ? 'ok' : 'bad'}">${esc(a) || '—'}</td></tr>`; }).join(''); return { score: sc, total: d.length, detail: `<table><thead><tr><th class="num">#</th><th>Word</th><th>You</th></tr></thead><tbody>${rows}</tbody></table>` }; },
  },
  cards: {
    title: 'Cards', blurb: 'A shuffled deck. Recall the order.',
    fields: o => `<label for="f-count">Cards</label><select id="f-count">${[5, 10, 13, 26, 39, 52].map(n => `<option ${n == o.count ? 'selected' : ''}>${n}</option>`).join('')}</select>`,
    defaults: { count: 13 },
    read: () => ({ count: +$('#f-count').value }),
    gen: o => sample(DECK, o.count).map(c => c.id),
    memo(d) {
      return `<p class="muted small" id="cpos"></p><div id="cbig"></div><div class="row" style="justify-content:center"><button class="alt" id="cprev">Prev</button><button class="teal" id="cnext">Next</button></div><p class="small muted" style="text-align:center">Tip: tap the card or use the arrow keys.</p>`;
    },
    bindMemo(d) {
      let i = 0; const show = () => { const c = cardById(d[i]); $('#cbig').innerHTML = `<div class="pcard pop ${c.c}"><span class="rk">${c.r}</span><span class="st">${c.s}</span></div>`; $('#cpos').textContent = `Card ${i + 1} of ${d.length}`; $('#cprev').disabled = !i; $('#cnext').disabled = i === d.length - 1; };
      const go = n => { i = Math.max(0, Math.min(d.length - 1, i + n)); show(); };
      $('#cprev').onclick = () => go(-1); $('#cnext').onclick = () => go(1); $('#cbig').onclick = () => go(1);
      const k = e => { if (!$('#cbig')) return document.removeEventListener('keydown', k); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
      document.addEventListener('keydown', k); show();
    },
    recall: d => `<p class="small muted">Tap the cards in order. <span id="ccount">0</span> / ${d.length}</p><div class="seq" id="seq"></div><div class="row" style="margin-bottom:10px"><button class="alt" id="cundo">Undo</button><button class="alt" id="cclear">Clear</button></div><div class="deck" id="deck">${DECK.map(c => `<button data-id="${c.id}" aria-label="${c.r} of ${c.s}"><span class="${c.c}">${c.r}</span><span class="${c.c}">${c.s}</span></button>`).join('')}</div>`,
    bindRecall(d, o, st) {
      st.pick = []; const paint = () => { $('#seq').innerHTML = st.pick.map(id => chip(id)).join(''); $('#ccount').textContent = st.pick.length; $$('#deck button').forEach(b => b.disabled = st.pick.includes(b.dataset.id) || st.pick.length >= d.length); };
      $('#deck').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) { st.pick.push(b.dataset.id); paint(); } };
      $('#cundo').onclick = () => { st.pick.pop(); paint(); }; $('#cclear').onclick = () => { st.pick = []; paint(); }; paint();
    },
    grade: (d, o, st) => { let sc = 0; const h = d.map((id, i) => { const ok = st.pick[i] === id; sc += ok; return chip(id, ok ? 'ok' : 'no'); }).join(''); return { score: sc, total: d.length, detail: `<p class="small muted">Correct order (green = you had it right):</p><div class="seq">${h}</div><p class="small muted">Your order:</p><div class="seq">${st.pick.map(id => chip(id)).join('') || '—'}</div>` }; },
  },
  names: {
    title: 'Names & Faces', blurb: 'Faces with names. Recall each name.',
    fields: o => `<label for="f-count">People</label><select id="f-count">${[3, 5, 8, 10, 15, 20].map(n => `<option ${n == o.count ? 'selected' : ''}>${n}</option>`).join('')}</select><label><input type="checkbox" id="f-last" style="width:auto;min-height:0" ${o.last ? 'checked' : ''}> Include last names</label>`,
    defaults: { count: 5, last: true },
    read: () => ({ count: +$('#f-count').value, last: $('#f-last').checked }),
    gen: o => { const f = sample(FIRST, o.count), l = sample(LAST, o.count); return f.map((n, i) => ({ seed: rnd(1e9), first: n, last: l[i] })); },
    memo: (d, o) => `<div class="faces">${d.map(p => `<div class="face">${faceSVG(p.seed)}<b>${esc(p.first)}${o.last ? ' ' + esc(p.last) : ''}</b></div>`).join('')}</div>`,
    recall(d, o, st) { st.order = shuffle(d.map((_, i) => i)); return `<div class="faces">${st.order.map((i, k) => `<div class="face">${faceSVG(d[i].seed)}<input id="rf${k}" placeholder="First" autocomplete="off" aria-label="First name">${o.last ? `<input id="rl${k}" placeholder="Last" autocomplete="off" aria-label="Last name">` : ''}</div>`).join('')}</div>`; },
    grade: (d, o, st) => { let sc = 0; const rows = st.order.map((i, k) => { const p = d[i], f = $('#rf' + k).value, l = o.last ? $('#rl' + k).value : ''; const of = norm(f) === norm(p.first), ol = o.last && norm(l) === norm(p.last); sc += of + ol; return `<div class="face">${faceSVG(p.seed)}<b>${esc(p.first)}${o.last ? ' ' + esc(p.last) : ''}</b><span class="${of ? 'ok' : 'bad'}">${esc(f) || '—'}</span>${o.last ? ` <span class="${ol ? 'ok' : 'bad'}">${esc(l) || '—'}</span>` : ''}</div>`; }).join(''); return { score: sc, total: d.length * (o.last ? 2 : 1), detail: `<div class="faces">${rows}</div>` }; },
  },
  majordrill: {
    title: 'Major drill', blurb: 'Flash your 00–99 images until they are instant.', noMemo: true,
    fields: o => `<div class="row"><div class="field"><label for="f-mode">Direction</label><select id="f-mode"><option value="n2i" ${o.mode === 'n2i' ? 'selected' : ''}>Number → image</option><option value="i2n" ${o.mode === 'i2n' ? 'selected' : ''}>Image → number</option></select></div>
      <div class="field"><label for="f-count">Items</label><select id="f-count">${[10, 20, 30, 50, 100].map(n => `<option ${n == o.count ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <label for="f-range">Range</label><select id="f-range">${['00-99', '00-19', '20-39', '40-59', '60-79', '80-99'].map(r => `<option ${r === o.range ? 'selected' : ''}>${r}</option>`).join('')}</select>`,
    defaults: { mode: 'n2i', count: 20, range: '00-99' },
    read: () => ({ mode: $('#f-mode').value, count: +$('#f-count').value, range: $('#f-range').value }),
    gen: o => { const [a, b] = o.range.split('-').map(Number); const pool = Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(2, '0')); const out = []; while (out.length < o.count) out.push(...shuffle(pool)); return out.slice(0, o.count); },
    recall: () => `<p class="muted small" id="mpos"></p><div class="big mono" id="mq"></div><form id="mform" class="row"><input id="ma" autocomplete="off" autocapitalize="none" spellcheck="false" style="flex:1 1 160px"><button>Enter</button><button type="button" class="alt" id="mskip">Show</button></form><p id="mfb" class="small" style="min-height:1.6em"></p>`,
    bindRecall(d, o, st, finish) {
      let i = 0; st.res = [];
      const q = () => { const n = d[i]; $('#mpos').textContent = `${i + 1} / ${d.length}`; $('#mq').textContent = o.mode === 'n2i' ? n : S.major[n]; const a = $('#ma'); a.value = ''; a.inputMode = o.mode === 'n2i' ? 'text' : 'numeric'; a.focus(); };
      const next = (ok, ans) => { const n = d[i]; st.res.push({ n, ok, ans }); $('#mfb').innerHTML = ok ? `<span class="ok">✓ ${esc(n)} = ${esc(S.major[n])}</span>` : `<span class="bad">✗ ${esc(n)} = ${esc(S.major[n])}</span>`; i++; if (i >= d.length) finish(); else q(); };
      $('#mform').onsubmit = e => { e.preventDefault(); const a = $('#ma').value, n = d[i]; next(o.mode === 'n2i' ? same(a, S.major[n]) : a.replace(/\D/g, '').padStart(2, '0') === n, a); };
      $('#mskip').onclick = () => next(false, ''); q();
    },
    autoFinish: true,
    grade: (d, o, st) => { const sc = st.res.filter(r => r.ok).length; const miss = st.res.filter(r => !r.ok); return { score: sc, total: d.length, detail: miss.length ? `<p class="small muted">Missed. Drill these again or change the image if it isn't clicking:</p><table><tbody>${miss.map(r => `<tr><td class="num mono">${r.n}</td><td>${esc(S.major[r.n])}</td><td class="bad">${esc(r.ans) || '—'}</td></tr>`).join('')}</tbody></table>` : '<p>Clean sweep.</p>' }; },
  },
};

/* ---------- game runner ---------- */
function runGame(id) {
  const G = GAMES[id], o = { ...G.defaults, ...(S.opts[id] || {}) }, st = {};
  const bestFor = n => S.best[id + ':' + n];
  const head = sub => `<a class="back" href="#home">← Home</a><div class="row spread"><h1>${G.title}</h1>${sub || ''}</div>`;
  const setup = () => {
    const b = Object.entries(S.best).filter(([k]) => k.startsWith(id + ':')).sort((a, b) => +a[0].split(':')[1] - +b[0].split(':')[1]);
    app.innerHTML = head() + `<p class="muted">${G.blurb}</p><form id="setup" class="card">${G.fields(o)}<p id="warn" class="bad small"></p><button style="width:100%;margin-top:6px">Start</button></form>
      ${b.length ? `<div class="card"><h3>Personal bests</h3><table><tbody>${b.map(([k, v]) => `<tr><td>${k.split(':')[1]} items</td><td class="num">${v.score}/${v.total}</td><td class="num">${fmtT(v.ms)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
    $('#setup').onsubmit = e => { e.preventDefault(); Object.assign(o, G.read()); const w = G.check?.(o); if (w) { $('#warn').textContent = w; return; } S.opts[id] = { ...o }; save(); st.data = G.gen(o); G.noMemo ? recall(0) : memo(); };
  };
  const memo = () => {
    app.innerHTML = head(`<span class="timer" id="t">0s</span>`) + `<p class="muted small">Memorize. Hit Done when ready.</p><div class="card">${G.memo(st.data, o)}</div><button id="done" style="width:100%">Done, recall</button>`;
    const el = startTimer($('#t')); G.bindMemo?.(st.data, o, st);
    $('#done').onclick = () => { const ms = el(); stopTimer(); recall(ms); }; window.scrollTo(0, 0);
  };
  const recall = memoMs => {
    app.innerHTML = head(`<span class="timer" id="t">0s</span>`) + `<p class="muted small">${G.noMemo ? 'Go as fast as you can.' : 'Recall.'}</p><div class="card">${G.recall(st.data, o, st)}</div>${G.autoFinish ? '<button class="alt" id="fin" style="width:100%">End early</button>' : '<button id="fin" style="width:100%">Check answers</button>'}`;
    const el = startTimer($('#t'));
    const finish = () => { const rMs = el(); stopTimer(); result(G.noMemo ? rMs : memoMs, rMs); };
    G.bindRecall?.(st.data, o, st, finish);
    $('#fin').onclick = () => { if (G.autoFinish) { st.data = st.data.slice(0, st.res.length); if (!st.data.length) return setup(); } finish(); };
    window.scrollTo(0, 0); $('input,textarea', app)?.focus();
  };
  const result = (ms, rMs) => {
    const r = G.grade(st.data, o, st), pct = r.total ? Math.round(100 * r.score / r.total) : 0;
    const prev = bestFor(r.total), isBest = record(id, r.score, r.total, ms, G.title);
    const tip = pct === 100 ? 'Perfect. Push it up a level next time.' : pct >= 70 ? 'Solid. Look at the misses: were the images vivid enough?' : 'Slow down the memorize phase. Make each image bigger, weirder and more active.';
    app.innerHTML = head() + `<div class="card pop" style="text-align:center"><div class="score ${pct >= 70 ? 'ok' : 'bad'}">${r.score}/${r.total}</div><p><b>${pct}%</b> · ${G.noMemo ? 'time' : 'memorized in'} ${fmtT(ms)}${G.noMemo ? '' : ` · recall ${fmtT(rMs)}`}</p>
      <p class="small">${isBest ? '🏆 New personal best for ' + r.total + ' items!' : prev ? `Best: ${prev.score}/${prev.total} in ${fmtT(prev.ms)}` : ''}</p><p class="muted small">${tip}</p>
      <div class="row" style="justify-content:center"><button id="again">Again</button><a class="btn alt" href="#home">Home</a></div></div><div class="card">${r.detail}</div>`;
    $('#again').onclick = setup; window.scrollTo(0, 0);
  };
  setup();
}

/* ---------- views ---------- */
const TILES = [
  ['numbers', 'Numbers', 'Digits in order'], ['words', 'Words', 'Lists, with your palace'], ['cards', 'Cards', 'Deck order'], ['names', 'Names & Faces', 'Put names to faces'],
  ['majordrill', 'Major drill', '00–99 image speed'],
];
function bestLine(id) { const b = Object.entries(S.best).filter(([k]) => k.startsWith(id + ':')).map(([, v]) => v).sort((a, b) => b.total - a.total || b.score - a.score)[0]; return b ? `Best ${b.score}/${b.total}` : 'Not tried yet'; }
function home() {
  const d = due().length, today = S.hist.filter(h => dayKey(new Date(h.d)) === dayKey()).length, sk = streakNow();
  const nextUp = d ? ['review', `Review ${d} due card${d > 1 ? 's' : ''}`, 'Spaced repetition first: it keeps old memories alive.']
    : !S.hist.length ? ['learn', 'Start with the 3-minute basics', 'Then try Words with the sample palace.']
    : today < 2 ? (() => { const g = TILES[(S.hist.length) % TILES.length]; return [g[0], `Train: ${g[1]}`, 'Today\'s rotation pick.']; })()
    : ['majordrill', 'Bonus: Major drill', 'You\'ve trained today. Extra reps make numbers instant.'];
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  app.innerHTML = `<section class="hero"><h1>Train your memory</h1><div class="stats"><div class="stat"><b>${sk}</b><span>day streak</span></div><div class="stat"><b>${today}</b><span>sessions today</span></div><div class="stat"><b>${d}</b><span>cards due</span></div></div>
    <div class="next"><div><b>${esc(nextUp[1])}</b><div class="small" style="color:#5f5a66">${esc(nextUp[2])}</div></div><a class="btn" href="#${nextUp[0]}">Go</a></div></section>
    ${!standalone && ios ? `<p class="tip">Install it: tap <b>Share</b> → <b>Add to Home Screen</b>. It then runs full-screen and offline.</p>` : ''}
    <div class="section">Train</div><div class="grid">${TILES.map(([id, t, s]) => `<a class="tile" href="#${id}"><b>${t}</b><small>${s}</small><span class="badge">${bestLine(id)}</span></a>`).join('')}</div>
    <div class="section">Build &amp; keep</div><div class="grid">
      <a class="tile" href="#review"><b>Review</b><small>Your own flashcards, spaced out</small><span class="badge">${S.cards.length} cards · ${d} due</span></a>
      <a class="tile" href="#palaces"><b>Palaces</b><small>Routes through places you know</small><span class="badge">${S.palaces.length} palace${S.palaces.length === 1 ? '' : 's'}</span></a>
      <a class="tile" href="#major"><b>Major System</b><small>Your 00–99 images</small><span class="badge">Edit list</span></a>
      <a class="tile" href="#learn"><b>Learn</b><small>Short technique guides</small><span class="badge">${LESSONS.length} lessons</span></a>
      <a class="tile" href="#stats"><b>Stats &amp; backup</b><small>History, bests, export</small><span class="badge">${S.hist.length} sessions</span></a></div>`;
}

function learn() {
  app.innerHTML = `<a class="back" href="#home">← Home</a><h1>Learn</h1><p class="muted">Read one, then go use it. Each guide links to the matching trainer.</p>` +
    LESSONS.map((l, i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(l.title)}<small>${l.mins} min</small></summary><div>${l.html}</div></details>`).join('');
}

function routeSVG(n) {
  const cols = Math.min(5, Math.max(2, n)), rows = Math.ceil(n / cols), W = 100 * cols, H = 70 * rows + 10;
  const pts = Array.from({ length: n }, (_, i) => { const r = Math.floor(i / cols), c = r % 2 ? cols - 1 - (i % cols) : i % cols; return [50 + c * 100, 40 + r * 70]; });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Route with ${n} stops"><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="6" stroke-linejoin="round" stroke-dasharray="2 10" stroke-linecap="round"/>${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="20" fill="${i ? 'var(--surf)' : 'var(--red)'}" stroke="var(--red)" stroke-width="3"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="800" fill="${i ? 'var(--ink)' : '#fff'}">${i + 1}</text>`).join('')}</svg>`;
}
function palaces(editId) {
  const ed = S.palaces.find(p => p.id === editId);
  if (ed || editId === 'new') {
    const p = ed || { id: 'p' + Date.now().toString(36), name: '', loci: [] };
    app.innerHTML = `<a class="back" href="#palaces">← Palaces</a><h1>${ed ? 'Edit palace' : 'New palace'}</h1>
      <form id="pf" class="card"><label for="pn">Name</label><input id="pn" value="${esc(p.name)}" placeholder="e.g. Work office" required>
      <label for="pl">Loci, one per line, in walking order</label><textarea id="pl" style="min-height:260px" placeholder="Front door&#10;Mailbox&#10;…">${esc(p.loci.join('\n'))}</textarea>
      <p class="small muted">Pick stops that are distinct and in a fixed order. Furniture and fixtures work best.</p>
      <div class="row spread"><button>Save</button>${ed ? '<button type="button" class="alt" id="pdel">Delete</button>' : ''}</div></form>`;
    $('#pf').onsubmit = e => { e.preventDefault(); p.name = $('#pn').value.trim(); p.loci = $('#pl').value.split('\n').map(s => s.trim()).filter(Boolean); if (!p.loci.length) return toast('Add at least one locus'); if (!ed) S.palaces.push(p); save(); toast('Saved'); location.hash = 'palaces'; };
    if (ed) $('#pdel').onclick = async () => { if (await confirmBox(`Delete “${p.name}”?`)) { S.palaces = S.palaces.filter(x => x !== p); save(); location.hash = 'palaces'; } };
    return;
  }
  app.innerHTML = `<a class="back" href="#home">← Home</a><div class="row spread"><h1>Palaces</h1><button id="pnew">New palace</button></div><p class="muted">A palace is a fixed route through a place you know. The Words trainer drops one word on each stop.</p>` +
    (S.palaces.length ? S.palaces.map(p => `<div class="card"><div class="row spread"><h2>${esc(p.name)}</h2><div class="row"><button class="alt" data-walk="${esc(p.id)}">Test route</button><button class="alt" data-ed="${esc(p.id)}">Edit</button></div></div>
      <div class="route">${routeSVG(p.loci.length)}</div>
      <ol class="small" style="columns:2 160px;margin:10px 0 0">${p.loci.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>`).join('') : '<p class="card">No palaces yet. Make one from your home.</p>');
  $('#pnew').onclick = () => palaces('new');
  app.onclick = e => { const b = e.target.closest('[data-ed],[data-walk]'); if (!b || !location.hash.startsWith('#palaces')) return; if (b.dataset.ed) palaces(b.dataset.ed); else walk(S.palaces.find(p => p.id === b.dataset.walk)); };
}
function walk(p) {
  let i = 0, sc = 0; const order = p.loci;
  const q = () => {
    if (i >= order.length) { app.innerHTML = `<a class="back" href="#palaces">← Palaces</a><h1>Route test</h1><div class="card" style="text-align:center"><div class="score ${sc === order.length ? 'ok' : 'bad'}">${sc}/${order.length}</div><p>${sc === order.length ? 'You know this route cold. Ready to use it.' : 'Walk it a few more times in your head before loading it up.'}</p><button id="again">Again</button></div>`; $('#again').onclick = () => walk(p); return; }
    app.innerHTML = `<a class="back" href="#palaces">← Palaces</a><h1>${esc(p.name)}</h1><div class="card flash"><p class="muted">What is stop number…</p><div class="big">${i + 1}</div><form id="wf" class="row"><input id="wa" autocomplete="off" style="flex:1 1 160px" aria-label="Locus name"><button>Check</button></form><p id="wfb" class="small"></p></div>`;
    $('#wa').focus();
    $('#wf').onsubmit = e => { e.preventDefault(); const ok = same($('#wa').value, order[i]) || norm(order[i]).includes(norm($('#wa').value)) && norm($('#wa').value).length > 2; sc += ok; toast(ok ? '✓ ' + order[i] : '✗ It was: ' + order[i]); i++; q(); };
  };
  q();
}

function major() {
  app.innerHTML = `<a class="back" href="#home">← Home</a><div class="row spread"><h1>Major System</h1><a class="btn teal" href="#majordrill">Drill</a></div>
    <details><summary>Digit → sound key<small>reference</small></summary><div><table class="key"><tbody>${MAJOR_KEY.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}</tbody></table></div></details>
    <p class="muted">Your images for 00–99. Change any that don't click: concrete nouns you can picture instantly work best. Saves as you type.</p>
    <div class="majorgrid card">${Object.keys(MAJOR).sort().map(n => `<label><span class="mono">${n}</span><input data-n="${n}" value="${esc(S.major[n])}" autocomplete="off" autocapitalize="none"></label>`).join('')}</div>
    <button class="alt" id="mreset">Reset to defaults</button>`;
  let t; app.oninput = e => { const n = e.target.dataset?.n; if (!n) return; S.major[n] = e.target.value.trim() || MAJOR[n]; clearTimeout(t); t = setTimeout(save, 300); };
  $('#mreset').onclick = async () => { if (await confirmBox('Reset all 100 images to the defaults?', 'Reset')) { S.major = { ...MAJOR }; save(); major(); } };
}

/* spaced repetition (SM-2 style) */
function schedule(c, q) {
  const now = Date.now();
  if (q === 0) { c.reps = 0; c.int = 0; c.ease = Math.max(1.3, c.ease - .2); c.due = now + 10 * 60e3; c.lapses = (c.lapses || 0) + 1; return; }
  c.reps++;
  if (c.reps === 1) c.int = q === 3 ? 4 : q === 1 ? 1 : 1;
  else if (c.reps === 2) c.int = q === 3 ? 7 : q === 1 ? 2 : 3;
  else c.int = Math.max(c.int + 1, Math.round(c.int * (q === 1 ? 1.2 : q === 2 ? c.ease : c.ease * 1.3)));
  if (q === 1) c.ease = Math.max(1.3, c.ease - .15); if (q === 3) c.ease += .15;
  c.due = now + c.int * DAY;
}
const preview = (c, q) => { if (q === 0) return '10m'; const x = { ...c }; schedule(x, q); return x.int + 'd'; };
function review(sub) {
  if (sub === 'session') return session();
  const d = due().length;
  app.innerHTML = `<a class="back" href="#home">← Home</a><div class="row spread"><h1>Review</h1>${d ? `<a class="btn" href="#review-session">Review ${d} due</a>` : ''}</div>
    <p class="muted">${S.cards.length ? (d ? `${d} card${d > 1 ? 's' : ''} due now.` : 'Nothing due. Nice. ' + nextDue()) : 'Add anything you want to keep for good: facts, vocab, numbers, speeches.'}</p>
    <form id="cf" class="card"><h3>Add a card</h3><label for="cq">Front (question / cue)</label><input id="cq" required autocomplete="off"><label for="ca">Back (answer)</label><textarea id="ca" style="min-height:70px"></textarea><button style="margin-top:8px">Add card</button></form>
    <details><summary>Bulk add<small>paste many</small></summary><div><p class="small muted">One card per line: <span class="mono">front | back</span></p><textarea id="bulk" placeholder="Capital of Peru | Lima&#10;Tim's phone | 805-555-0142"></textarea><button id="bulkb" style="margin-top:8px">Add all</button>
      <p class="small muted">Or add your Major images as cards:</p><button class="alt" id="majcards">Add 00–99 as cards</button></div></details>
    ${S.cards.length ? `<details><summary>All cards (${S.cards.length})<small>search, delete</small></summary><div><input id="cs" placeholder="Search…" autocomplete="off"><div class="scroll"><table><thead><tr><th>Front</th><th>Back</th><th class="num">Next</th><th></th></tr></thead><tbody id="clist"></tbody></table></div></div></details>` : ''}`;
  const add = (q, a) => S.cards.push({ id: Date.now().toString(36) + rnd(1e6), q, a, due: Date.now(), int: 0, ease: 2.5, reps: 0 });
  $('#cf').onsubmit = e => { e.preventDefault(); add($('#cq').value.trim(), $('#ca').value.trim()); save(); toast('Card added'); review(); };
  $('#bulkb').onclick = () => { const L = $('#bulk').value.split('\n').map(l => l.split('|')).filter(p => p[0]?.trim()); L.forEach(p => add(p[0].trim(), (p.slice(1).join('|') || '').trim())); save(); toast(`Added ${L.length} cards`); review(); };
  $('#majcards').onclick = () => { const have = new Set(S.cards.map(c => c.q)); let n = 0; Object.keys(S.major).sort().forEach(k => { if (!have.has('Major ' + k)) { add('Major ' + k, S.major[k]); n++; } }); save(); toast(`Added ${n} cards`); review(); };
  const list = () => { const f = norm($('#cs')?.value); const rows = S.cards.filter(c => !f || norm(c.q + ' ' + c.a).includes(f)).slice(0, 200); $('#clist').innerHTML = rows.map(c => `<tr><td>${esc(c.q)}</td><td>${esc(c.a)}</td><td class="num">${c.due <= Date.now() ? 'now' : Math.ceil((c.due - Date.now()) / DAY) + 'd'}</td><td><button class="alt" data-del="${c.id}" aria-label="Delete">✕</button></td></tr>`).join(''); };
  if ($('#clist')) { list(); $('#cs').oninput = list; $('#clist').onclick = async e => { const id = e.target.closest('[data-del]')?.dataset.del; if (id && await confirmBox('Delete this card?')) { S.cards = S.cards.filter(c => c.id !== id); save(); list(); } }; }
}
function nextDue() { const n = Math.min(...S.cards.map(c => c.due)); if (!isFinite(n)) return ''; const h = (n - Date.now()) / 36e5; return 'Next one in ' + (h < 24 ? Math.ceil(h) + 'h.' : Math.ceil(h / 24) + 'd.'); }
function session() {
  const q = shuffle(due()); let i = 0, done = 0; const t0 = Date.now();
  if (!q.length) { location.hash = 'review'; return; }
  const show = () => {
    if (i >= q.length) { const more = due().length; if (more) { q.push(...shuffle(due())); } else { bump(); save(); paintStreak(); app.innerHTML = `<a class="back" href="#home">← Home</a><h1>Review done</h1><div class="card" style="text-align:center"><div class="score ok">${done}</div><p>reviews in ${fmtT(Date.now() - t0)}. ${nextDue()}</p><a class="btn" href="#home">Home</a></div>`; return; } }
    const c = q[i];
    app.innerHTML = `<a class="back" href="#review">← Review</a><p class="muted small">${q.length - i} left</p><div class="card flash pop"><div class="q">${esc(c.q)}</div><div id="ans"></div><button id="reveal" style="width:100%;margin-top:10px">Show answer</button></div>`;
    $('#reveal').onclick = () => {
      $('#ans').innerHTML = `<div class="a">${esc(c.a) || '<span class="muted">(no back)</span>'}</div><div class="rate">${['Again', 'Hard', 'Good', 'Easy'].map((l, k) => `<button class="${k ? (k === 2 ? 'teal' : 'alt') : ''}" data-q="${k}">${l}<small>${preview(c, k)}</small></button>`).join('')}</div>`;
      $('#reveal').remove();
      $('#ans').onclick = e => { const b = e.target.closest('[data-q]'); if (!b) return; schedule(c, +b.dataset.q); done++; save(); i++; show(); };
    };
  };
  show();
}

function stats() {
  const by = {}; S.hist.forEach(h => { (by[h.g] ||= []).push(h); });
  const days = Array.from({ length: 28 }, (_, k) => { const d = dayKey(new Date(Date.now() - (27 - k) * DAY)); return { d, n: S.hist.filter(h => dayKey(new Date(h.d)) === d).length }; });
  const mx = Math.max(1, ...days.map(x => x.n));
  app.innerHTML = `<a class="back" href="#home">← Home</a><h1>Stats &amp; backup</h1>
    <div class="card"><h3>Last 28 days</h3><div style="display:grid;grid-template-columns:repeat(28,minmax(0,1fr));gap:3px;align-items:end;height:80px">${days.map(x => `<div title="${x.d}: ${x.n}" style="height:${x.n ? 15 + 85 * x.n / mx : 4}%;background:${x.n ? 'var(--red)' : 'var(--line)'};border-radius:3px"></div>`).join('')}</div><p class="small muted">Streak ${streakNow()} · ${S.hist.length} sessions logged · ${S.cards.length} flashcards</p></div>
    <div class="card"><h3>Personal bests</h3>${Object.keys(S.best).length ? `<table><thead><tr><th>Trainer</th><th class="num">Items</th><th class="num">Score</th><th class="num">Time</th></tr></thead><tbody>${Object.entries(S.best).sort().map(([k, v]) => `<tr><td>${esc(GAMES[k.split(':')[0]]?.title || k)}</td><td class="num">${k.split(':')[1]}</td><td class="num">${v.score}/${v.total}</td><td class="num">${fmtT(v.ms)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Train once to set a best.</p>'}</div>
    <div class="card"><h3>Recent sessions</h3>${S.hist.length ? `<table><tbody>${S.hist.slice(0, 15).map(h => `<tr><td>${esc(h.label)}</td><td class="num">${h.score}/${h.total}</td><td class="num">${fmtT(h.ms)}</td><td class="num muted">${new Date(h.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">None yet.</p>'}</div>
    <div class="card"><h3>Backup &amp; move devices</h3><p class="small muted">Progress lives on this device only. To move it to another phone or PC, export here and import there.</p>
      <div class="row"><button id="exf">Download backup</button><button class="alt" id="exc">Copy to clipboard</button></div>
      <label for="imt">Import: paste a backup or pick a file</label><textarea id="imt" class="mono small" placeholder='{"v":1,…}'></textarea>
      <div class="row" style="margin-top:8px"><input type="file" id="imf" accept=".json,application/json" style="flex:1 1 200px"><button class="alt" id="imb">Import pasted</button></div>
      <p class="small muted">Import replaces everything on this device.</p></div>
    <button class="alt" id="wipe">Erase all progress</button>`;
  const dump = () => JSON.stringify(S);
  $('#exf').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dump()], { type: 'application/json' })); a.download = `memory-gym-${dayKey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  $('#exc').onclick = async () => { try { await navigator.clipboard.writeText(dump()); toast('Copied'); } catch (e) { $('#imt').value = dump(); $('#imt').select(); toast('Copy blocked. Text is selected below.'); } };
  const imp = async txt => { try { const o = JSON.parse(txt); if (o?.v !== 1 || !o.major) throw 0; if (!await confirmBox('Replace all progress on this device with this backup?', 'Import')) return; S = { ...fresh(), ...o }; save(); toast('Imported'); paintStreak(); stats(); } catch (e) { toast('That isn\'t a Memory Gym backup'); } };
  $('#imb').onclick = () => imp($('#imt').value);
  $('#imf').onchange = async e => { const f = e.target.files[0]; if (f) imp(await f.text()); };
  $('#wipe').onclick = async () => { if (await confirmBox('Erase all scores, cards, palaces and Major edits on this device?', 'Erase')) { S = fresh(); save(); paintStreak(); location.hash = 'home'; } };
}

/* ---------- router ---------- */
function route() {
  stopTimer(); app.onclick = null; app.oninput = null;
  const h = (location.hash.slice(1) || 'home');
  if (GAMES[h]) runGame(h);
  else if (h === 'review-session') review('session');
  else ({ learn, palaces, major, review, stats }[h] || home)();
  app.focus({ preventScroll: true }); window.scrollTo(0, 0);
}
addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (!document.hidden && (location.hash || '#home') === '#home') home(); });
paintStreak(); route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
