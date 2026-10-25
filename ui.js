'use strict';
// Arayüz: ekranlar, modallar, maç ekranı ve olay yönetimi.

const $ = (s, r) => (r || document).querySelector(s);
const UI = {
  scr: 'title', sq: { k: 'pos', d: 1 }, tsel: null,
  trf: { g: '', age: '', maxv: '', q: '', fa: false, listed: false, sort: 'ovr', d: -1, tab: 'search' },
  lg: 'table', lgRound: null, inboxSel: null, lastRes: null, mc: null,
  ng: { name: '', club: null }, autoNote: false, speed: 1,
};

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  inbox: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  squad: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tactics: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3"/>',
  league: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  fixtures: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  cup: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  transfer: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  club: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  swap: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
  vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
};
function icon(n) { return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }

const NAV = [
  ['home', 'Ana Sayfa', 'home'], ['inbox', 'Gelen Kutusu', 'inbox'], ['squad', 'Kadro', 'squad'], ['tactics', 'Taktik', 'tactics'],
  ['league', 'Lig', 'league'], ['fixtures', 'Fikstür', 'fixtures'], ['cup', 'Kupa', 'cup'], ['transfer', 'Transfer', 'transfer'], ['club', 'Kulüp', 'club'],
];

// ---------- Küçük bileşenler ----------
function crest(t, cls) { return t ? '<span class="crest ' + (cls || '') + '" style="--c1:' + t.c1 + ';--c2:' + t.c2 + '">' + esc(t.short) + '</span>' : ''; }
function teamLink(t, short) { return t ? '<a class="lnk" data-act="team" data-id="' + t.id + '">' + esc(short ? t.short : t.name) + '</a>' : '-'; }
function pLink(p, short) { return p ? '<a class="lnk" data-act="player" data-id="' + p.id + '">' + esc(short ? p.ln : fullName(p)) + '</a>' : '<span class="muted">(ayrıldı)</span>'; }
function starsH(v) { return '<span class="stars" title="' + v + ' yıldız"><span style="width:' + (v / 5 * 100) + '%"></span></span>'; }
function posB(pos) { return '<span class="pos g' + POS_GROUP[pos] + '">' + POS_TR[pos] + '</span>'; }
function condH(c) { const v = Math.round(c); return '<span class="cond ' + (v < 60 ? 'bad' : v < 80 ? 'mid' : '') + '"><i style="width:' + v + '%"></i></span>'; }
function morH(m) { const r = clamp(Math.round(m), 1, 5); return '<span class="mor m' + r + '" title="Moral: ' + moraleLabel(m) + '">' + moraleLabel(m) + '</span>'; }
function ratH(r) { if (!r) return '<span class="muted">-</span>'; return '<span class="rat ' + (r >= 7.5 ? 'hi' : r >= 6.8 ? 'ok' : r >= 6 ? 'mid' : 'lo') + '">' + r.toFixed(1) + '</span>'; }
function attrC(v) { return v >= 16 ? 'a4' : v >= 13 ? 'a3' : v >= 9 ? 'a2' : v >= 5 ? 'a1' : 'a0'; }
function resChip(r) { return '<span class="chip r' + r + '">' + r + '</span>'; }
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
function statusH(p) {
  let s = '';
  if (p.inj) s += '<span class="tag red" title="' + esc(p.injN) + ', ' + p.inj + ' gün">Sakat ' + p.inj + 'g</span>';
  if (p.sus) s += '<span class="tag amber" title="Cezalı">Ceza ' + p.sus + '</span>';
  if (p.listed) s += '<span class="tag blue">Listede</span>';
  if (p.promise) s += '<span class="tag">Söz</span>';
  return s;
}
function contractStr(p) { return p.team ? 'Haz ' + (p.ce + 1) : '-'; }
function seasonStr(y) { return y + '/' + String(y + 1).slice(2); }

function toast(text, kind) {
  const el = $('#toast');
  const d = document.createElement('div');
  d.className = 'toast ' + (kind || '');
  d.textContent = text;
  el.appendChild(d);
  setTimeout(() => d.classList.add('out'), 3200);
  setTimeout(() => d.remove(), 3700);
}
function openModal(html, cls) {
  const m = $('#modal');
  m.innerHTML = '<div class="mback" data-act="closeModal"></div><div class="mbox ' + (cls || '') + '" role="dialog" aria-modal="true"><button class="mclose" data-act="closeModal" aria-label="Kapat">' + icon('x') + '</button>' + html + '</div>';
  m.classList.add('on');
}
function closeModal() { const m = $('#modal'); m.classList.remove('on'); m.innerHTML = ''; }
function persist() { if (S) saveGame(); }

// ---------- Ana çizim ----------
function render() {
  const app = $('#app');
  if (UI.mc) return;
  if (UI.scr === 'new') { app.innerHTML = newGameHtml(); return; }
  if (!S || UI.scr === 'title') { app.innerHTML = titleHtml(); return; }
  if (S.phase === 'seasonEnd' && !['season', 'squad', 'league', 'player'].includes(UI.scr)) UI.scr = 'season';
  if (S.phase === 'fired') UI.scr = 'fired';
  app.innerHTML = shellHtml();
  const main = $('#main');
  main.innerHTML = screenHtml();
  main.scrollTop = 0;
  if (UI.scr === 'transfer') renderTransferResults();
}
function go(scr) { UI.scr = scr; UI.tsel = null; render(); window.scrollTo(0, 0); }

function shellHtml() {
  const t = userTeam();
  const nu = unread();
  const label = UI.scr === 'prematch' ? 'MAÇA ÇIK' : S.phase === 'seasonEnd' ? 'SEZON ÖZETİ' : 'DEVAM';
  return '<header class="top" style="--c1:' + t.c1 + ';--c2:' + t.c2 + '">' +
    '<div class="brand" data-act="nav" data-s="home">' + crest(t) + '<div><b>' + esc(t.name) + '</b><small>' + esc(S.mgr) + ' · ' + seasonStr(S.season) + '</small></div></div>' +
    '<div class="date"><small>' + (windowOpen() ? '<span class="dot green"></span>Transfer açık' : '') + '</small><b>' + fmtDate(S.date, true) + '</b></div>' +
    (UI.scr === 'prematch' || S.phase !== 'play' ? '' : '<button class="btn skipb" data-act="toMatch" title="Sıradaki maça kadar ilerle">' + icon('next') + '<span>Maça git</span></button>') +
    '<button class="btn cont" data-act="continue" title="' + (UI.scr === 'prematch' ? 'Maça çık' : 'Bir gün ilerle') + '">' + label + ' ' + icon('play') + '</button>' +
    '</header>' +
    '<nav class="nav">' + NAV.map(([k, n, ic]) => '<button class="' + (UI.scr === k ? 'on' : '') + '" data-act="nav" data-s="' + k + '">' + icon(ic) + '<span>' + n + '</span>' + (k === 'inbox' && nu ? '<em>' + nu + '</em>' : '') + '</button>').join('') + '</nav>' +
    '<main id="main"></main>';
}

function screenHtml() {
  switch (UI.scr) {
    case 'inbox': return inboxHtml();
    case 'squad': return squadHtml();
    case 'tactics': return tacticsHtml();
    case 'league': return leagueHtml();
    case 'fixtures': return fixturesHtml();
    case 'cup': return cupHtml();
    case 'transfer': return transferHtml();
    case 'club': return clubHtml();
    case 'prematch': return prematchHtml();
    case 'result': return resultHtml();
    case 'season': return seasonHtml();
    case 'fired': return firedHtml();
    default: return homeHtml();
  }
}

// ---------- Başlık ve yeni oyun ----------
function titleHtml() {
  const has = hasSave();
  return '<div class="title"><div class="tcard">' +
    '<div class="logo"><span class="ball"></span>SAHA<b>KENARI</b></div>' +
    '<p class="tag1">Kurgusal bir ligde, tek bir hedef: kulübünü zirveye taşı.</p>' +
    '<div class="tbtns">' +
    (has ? '<button class="btn primary big" data-act="loadGame">Kariyere Devam Et</button>' : '') +
    '<button class="btn ' + (has ? '' : 'primary ') + 'big" data-act="newScreen">Yeni Kariyer</button>' +
    '<button class="btn ghost" data-act="importFile">Kayıt dosyası yükle</button>' +
    '</div>' +
    '<ul class="feat"><li>16 kulüplü lig + eleme usulü kupa</li><li>Canlı anlatımlı maç motoru, oyun içi taktik ve oyuncu değişikliği</li><li>Transferler, sözleşmeler, yönetim baskısı, altyapı</li><li>Bir sezon yaklaşık 40-60 dakika</li></ul>' +
    '<p class="credit">Tüm kulüp ve oyuncu isimleri kurgusaldır</p>' +
    '</div></div>';
}
function boardFor(rank) {
  if (rank === 1) return ['Şampiyonluk', 'Zor', 'red'];
  if (rank <= 3) return ['İlk 3', 'Zor', 'red'];
  if (rank <= 6) return ['İlk 6', 'Orta', 'amber'];
  if (rank <= 10) return ['İlk 10', 'Orta', 'amber'];
  return ['Ligde kalmak', rank >= 15 ? 'Çok Zor' : 'Zor', 'red'];
}
function newGameHtml() {
  const sel = UI.ng.club;
  return '<div class="newg"><div class="ncard">' +
    '<button class="btn ghost sm back" data-act="toTitle">← Geri</button>' +
    '<h1>Yeni Kariyer</h1>' +
    '<label class="fld"><span>Menajer adınız</span><input id="mgrName" maxlength="28" placeholder="ör. Hüsnü Kaptan" value="' + esc(UI.ng.name) + '" data-inp="mgr"></label>' +
    '<h2>Kulübünü seç</h2>' +
    '<div class="clubs">' + CLUBS.map((c, i) => {
      const [goal, diff, dc] = boardFor(i + 1);
      const tb = Math.round(600000 * Math.exp(0.08 * (c.rep - 50)) / 50000) * 50000;
      return '<button class="club ' + (sel === i ? 'sel' : '') + '" data-act="pickClub" data-i="' + i + '">' +
        crest({ c1: c.c[0], c2: c.c[1], short: c.s }, 'lg') +
        '<div class="cinfo"><b>' + esc(c.n) + '</b><small>' + esc(c.city) + ' · ' + esc(c.st) + '</small>' +
        '<div class="crow">' + starsH(clamp(Math.round((c.rep - 40) / 5) / 2, 0.5, 5)) + '<span class="tag ' + dc + '">' + diff + '</span></div>' +
        '<small>Hedef: <b>' + goal + '</b> · Bütçe: <b>' + fmtMoney(tb) + '</b></small></div></button>';
    }).join('') + '</div>' +
    '<div class="nfoot"><button class="btn primary big" data-act="startGame" ' + (sel == null ? 'disabled' : '') + '>Kariyere Başla</button></div>' +
    '</div></div>';
}

// ---------- Ana sayfa ----------
function homeHtml() {
  const t = userTeam();
  const nx = nextUserEvent();
  const tb = table();
  const pos = tb.findIndex((r) => r.id === S.uid) + 1;
  let nextH;
  if (nx && nx.f) {
    const home = nx.f.h === S.uid;
    const o = T(home ? nx.f.a : nx.f.h);
    const opos = tb.findIndex((r) => r.id === o.id) + 1;
    nextH = '<div class="nextm"><small>' + esc(compName(nx.ev)) + ' · ' + fmtDate(nx.ev.d, true) + '</small>' +
      '<div class="nmv">' + crest(T(nx.f.h), 'lg') + '<div class="nmt"><b>' + teamLink(T(nx.f.h)) + '</b><span>vs</span><b>' + teamLink(T(nx.f.a)) + '</b></div>' + crest(T(nx.f.a), 'lg') + '</div>' +
      '<small>' + (home ? 'İç saha · ' + esc(t.st) : 'Deplasman · ' + esc(o.st)) + (tb.some((r) => r.p > 0) ? ' · Rakip ligde ' + opos + '. sırada' : '') + '</small></div>';
  } else if (nx) nextH = '<div class="nextm"><small>' + esc(compName(nx.ev)) + ' · ' + fmtDate(nx.ev.d) + '</small><p>Kura bekleniyor.</p></div>';
  else nextH = '<p class="muted">Sezonun kalan maçı yok. Devam ederek sezonu tamamlayın.</p>';
  const lastRes = userResults().slice(-5);
  const around = tableMini(tb, pos);
  const inj = teamPlayers(t).filter((p) => p.inj || p.sus);
  const best = teamPlayers(t).filter((p) => p.st.app >= 2).sort((a, b) => avgRating(b) - avgRating(a)).slice(0, 4);
  return '<div class="grid g3">' +
    '<section class="card span2 todayc"><h3>' + fmtDate(S.date, true) + (nx && nx.ev ? ' <small class="muted">' + (daysBetween(S.date, nx.ev.d) > 0 ? 'Maça ' + daysBetween(S.date, nx.ev.d) + ' gün' : 'Bugün maç günü!') + '</small>' : '') + '</h3>' +
    (S.today && S.today.length ? '<ul class="news">' + S.today.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">Yeni bir gün. DEVAM ile günü işletin; Maça git ile doğrudan maç gününe geçin.</p>') + '</section>' +
    '<section class="card"><h3>Yönetim</h3>' + boardCard() + '</section>' +
    '<section class="card span2"><h3>Sıradaki Maç</h3>' + nextH + '<div class="row gap mt"><button class="btn primary" data-act="continue">Devam (1 gün) ' + icon('play') + '</button><button class="btn" data-act="toMatch">' + icon('next') + ' Maça git</button><button class="btn" data-act="nav" data-s="tactics">Taktik</button></div></section>' +
    '<section class="card"><h3>Puan Durumu <a class="lnk sm" data-act="nav" data-s="league">tümü →</a></h3>' + around + '</section>' +
    '<section class="card"><h3>Son Maçlar</h3>' + (lastRes.length ? '<div class="lres">' + lastRes.map((r) => '<div class="lr" data-act="fxinfo" data-k="' + r.key + '">' + resChip(r.r) + '<span>' + (r.home ? '' : '@ ') + esc(r.opp.name) + '</span><b>' + r.score + '</b></div>').join('') + '</div>' : '<p class="muted">Henüz maç oynanmadı.</p>') + '</section>' +
    '<section class="card"><h3>Gelen Kutusu <a class="lnk sm" data-act="nav" data-s="inbox">tümü →</a></h3>' + S.inbox.slice(0, 4).map((m) => '<div class="mi ' + (m.read ? '' : 'unread') + '" data-act="openMsg" data-id="' + m.id + '"><b>' + esc(m.t) + '</b><small>' + fmtDate(m.d) + '</small></div>').join('') + '</section>' +
    '<section class="card"><h3>Kadro Durumu</h3>' +
    (inj.length ? inj.map((p) => '<div class="li">' + posB(p.pos[0]) + pLink(p) + statusH(p) + '</div>').join('') : '<p class="muted">Sakat veya cezalı oyuncu yok.</p>') +
    (best.length ? '<h4>Formda olanlar</h4>' + best.map((p) => '<div class="li">' + posB(p.pos[0]) + pLink(p) + ratH(avgRating(p)) + '</div>').join('') : '') + '</section>' +
    '<section class="card span2"><h3>Haberler</h3>' + (S.news.length ? '<ul class="news">' + S.news.slice(0, 7).map((n) => '<li><small>' + fmtDate(n.d) + '</small> ' + esc(n.t) + '</li>').join('') + '</ul>' : '<p class="muted">Henüz haber yok.</p>') + '</section>' +
    '</div>';
}
function boardCard() {
  const b = S.board, pos = userPos();
  const c = Math.round(b.conf);
  return '<div class="kv"><span>Hedef</span><b>' + esc(b.label) + '</b></div>' +
    '<div class="kv"><span>Lig sırası</span><b>' + (S.evi > 0 && table().some((r) => r.p > 0) ? pos + '.' : '-') + '</b></div>' +
    '<div class="kv"><span>Yönetim güveni</span><b>' + c + '%</b></div>' +
    '<div class="bar ' + (c < 30 ? 'bad' : c < 55 ? 'mid' : 'good') + '"><i style="width:' + c + '%"></i></div>' +
    '<div class="kv mt"><span>Transfer bütçesi</span><b>' + fmtMoney(S.fin.tb) + '</b></div>';
}
function tableMini(tb, pos) {
  const n = tb.length;
  let a = Math.max(0, pos - 3), b = Math.min(n, a + 5);
  a = Math.max(0, b - 5);
  return '<table class="tbl mini"><tbody>' + tb.slice(a, b).map((r, k) => {
    const i = a + k;
    return '<tr class="' + (r.id === S.uid ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + teamLink(T(r.id)) + '</td><td>' + r.p + '</td><td><b>' + r.pts + '</b></td></tr>';
  }).join('') + '</tbody></table>';
}
function userResults() {
  const out = [];
  for (const ev of S.cal) {
    const f = matchesOf(ev).find(isUserFx);
    if (!f || f.hg == null) continue;
    const home = f.h === S.uid;
    const my = home ? f.hg : f.ag, op = home ? f.ag : f.hg;
    let r = my > op ? 'G' : my < op ? 'M' : 'B';
    if (ev.k === 'C' && my === op) r = f.w === S.uid ? 'G' : 'M';
    out.push({ ev, f, home, opp: T(home ? f.a : f.h), r, score: f.hg + '-' + f.ag + (f.pen ? ' (p ' + f.pen[0] + '-' + f.pen[1] + ')' : ''), key: fxKey(ev, f) });
  }
  return out;
}
function fxKey(ev, f) {
  const arr = matchesOf(ev);
  return ev.k + ':' + (ev.k === 'L' ? ev.r : ev.s) + ':' + arr.indexOf(f);
}
function fxFromKey(k) {
  const [kind, a, b] = k.split(':');
  const arr = kind === 'L' ? S.fx[+a] : S.cup.rounds[+a];
  return arr ? arr[+b] : null;
}

// ---------- Gelen kutusu ----------
function inboxHtml() {
  const sel = S.inbox.find((m) => m.id === UI.inboxSel) || null;
  const list = S.inbox.map((m) => '<div class="mi ' + (m.read ? '' : 'unread') + (sel && sel.id === m.id ? ' sel' : '') + (m.act && !m.done ? ' act' : '') + '" data-act="openMsg" data-id="' + m.id + '"><b>' + esc(m.t) + '</b><small>' + fmtDate(m.d) + '</small></div>').join('');
  let det = '<p class="muted pad">Okumak için bir mesaj seçin.</p>';
  if (sel) {
    det = '<div class="msg"><button class="btn ghost sm onlym" data-act="msgBack">← Mesajlar</button><h2>' + esc(sel.t) + '</h2><small class="muted">' + fmtDate(sel.d, true) + '</small><p>' + nl2br(sel.b) + '</p>' + msgActions(sel) + '</div>';
  }
  return '<div class="inbox ' + (sel ? 'has-sel' : '') + '"><div class="ilist card">' + (list || '<p class="muted pad">Mesaj yok.</p>') + '</div><div class="idet card">' + det + '</div></div>';
}
function msgActions(m) {
  if (!m.act) return '';
  const a = m.act;
  const p = P(a.pid);
  let h = '<div class="mact">';
  if (p) h += '<p>Oyuncu: ' + pLink(p) + ' ' + posB(p.pos[0]) + ' ' + starsH(stars(ovr(p))) + '</p>';
  if (m.done) return h + '<p class="tag">' + esc(m.res || 'Sonuçlandı') + '</p></div>';
  if (a.type === 'bid') h += '<div class="row gap wrap"><button class="btn primary" data-act="bid" data-id="' + m.id + '" data-v="1">Kabul Et (' + fmtMoney(a.fee) + ')</button><button class="btn" data-act="bid" data-id="' + m.id + '" data-v="0">Reddet</button></div>' +
    '<div class="cbid mt"><label class="fld sm"><span>Karşı teklif (bin €)</span><input type="number" id="cb' + m.id + '" min="0" step="50" value="' + Math.round(a.fee * 1.3 / 1000) + '"></label><button class="btn" data-act="cbid" data-id="' + m.id + '">Pazarlık et</button></div>' +
    '<p class="hint">Alıcının bir üst sınırı var: makul bir karşı teklifi kabul eder ya da teklifini artırır, aşırı isterseniz masadan kalkar.</p>';
  if (a.type === 'compl') h += '<div class="col gap"><button class="btn" data-act="compl" data-id="' + m.id + '" data-v="promise">"Önümüzdeki maçlarda şans vereceğim."</button><button class="btn" data-act="compl" data-id="' + m.id + '" data-v="earn">"Formayı antrenmanda hak etmelisin."</button><button class="btn" data-act="compl" data-id="' + m.id + '" data-v="list">"Gitmek istiyorsan seni transfer listesine koyarım."</button></div>';
  return h + '</div>';
}

// ---------- Kadro ----------
const SQ_COLS = [
  ['pos', 'Mvk', (p) => POS_ORDER[p.pos[0]]], ['name', 'Oyuncu', (p) => p.ln], ['age', 'Yaş', (p) => p.age], ['nat', 'Uyr', (p) => p.nat],
  ['ovr', 'Güç', (p) => ovr(p)], ['cond', 'Kond.', (p) => p.cond], ['mor', 'Moral', (p) => p.mor], ['form', 'Form', (p) => formAvg(p)],
  ['app', 'M', (p) => p.st.app], ['g', 'G', (p) => p.st.g], ['a', 'A', (p) => p.st.a], ['avg', 'Ort', (p) => avgRating(p)],
  ['val', 'Değer', (p) => valueOf(p)], ['wage', 'Maaş', (p) => p.wage], ['ce', 'Sözl.', (p) => p.ce],
];
function squadHtml() {
  const t = userTeam();
  const col = SQ_COLS.find((c) => c[0] === UI.sq.k) || SQ_COLS[0];
  const pl = teamPlayers(t).sort((a, b) => {
    const x = col[2](a), y = col[2](b);
    const c = typeof x === 'string' ? x.localeCompare(y, 'tr') : x - y;
    return (c || ovr(b) - ovr(a)) * UI.sq.d;
  });
  const xi = new Set(t.lineup), bench = new Set(t.bench);
  return '<div class="card"><div class="row between"><h3>' + esc(t.name) + ' Kadrosu <small class="muted">(' + pl.length + ' oyuncu)</small></h3><div class="row gap"><button class="btn sm" data-act="nav" data-s="tactics">Taktik</button></div></div>' +
    '<div class="tw"><table class="tbl sq"><thead><tr><th></th>' + SQ_COLS.map((c) => '<th data-act="sqSort" data-k="' + c[0] + '" class="' + (UI.sq.k === c[0] ? 'sorted' : '') + '">' + c[1] + '</th>').join('') + '<th></th></tr></thead><tbody>' +
    pl.map((p) => '<tr data-act="player" data-id="' + p.id + '" class="' + (p.inj ? 'inj' : '') + '"><td>' + (xi.has(p.id) ? '<span class="xi" title="İlk 11">11</span>' : bench.has(p.id) ? '<span class="xi b" title="Yedek">Y</span>' : '') + '</td>' +
      '<td>' + posB(p.pos[0]) + '</td><td class="nm"><b>' + esc(fullName(p)) + '</b></td><td>' + p.age + '</td><td><span class="nat">' + p.nat + '</span></td>' +
      '<td>' + starsH(stars(ovr(p))) + '</td><td>' + condH(p.cond) + '</td><td>' + morH(p.mor) + '</td><td>' + ratH(formAvg(p)) + '</td>' +
      '<td>' + p.st.app + '</td><td>' + p.st.g + '</td><td>' + p.st.a + '</td><td>' + ratH(avgRating(p)) + '</td>' +
      '<td>' + fmtMoney(valueOf(p)) + '</td><td>' + fmtMoney(p.wage) + '</td><td class="' + (p.ce <= S.season ? 'warn' : '') + '">' + contractStr(p) + '</td><td>' + statusH(p) + '</td></tr>').join('') +
    '</tbody></table></div></div>';
}

// ---------- Taktik ----------
function tacticsHtml() {
  const t = userTeam();
  const f = FORM[t.tac.f];
  while (t.lineup.length < f.length) t.lineup.push(null);
  if (t.lineup.length > f.length) t.lineup.length = f.length;
  const sel = UI.tsel;
  const isSel = (k, key) => sel && sel.kind === k && String(sel.key) === String(key);
  const toks = f.map(([pos, x, y], i) => {
    const p = t.lineup[i] != null ? P(t.lineup[i]) : null;
    const fit = p ? fitOf(p, pos) : 0;
    const fc = !p ? 'empty' : fit >= 1 ? 'f1' : fit >= 0.88 ? 'f2' : 'f3';
    return '<button class="tok ' + fc + (isSel('xi', i) ? ' sel' : '') + (p && !eligible(p) ? ' bad' : '') + '" style="left:' + x + '%;top:' + (100 - y) + '%" data-act="tsel" data-kind="xi" data-key="' + i + '">' +
      '<span class="tp">' + POS_TR[pos] + '</span><span class="tn">' + (p ? esc(p.ln) : 'Boş') + '</span>' + (p ? '<span class="tc"><i style="width:' + Math.round(p.cond) + '%"></i></span>' : '') + '</button>';
  }).join('');
  const benchRows = [];
  for (let i = 0; i < 9; i++) {
    const id = t.bench[i];
    const p = id != null ? P(id) : null;
    benchRows.push(rowTac('bench', i, p, isSel('bench', i)));
  }
  const used = new Set([...t.lineup, ...t.bench]);
  const res = teamPlayers(t).filter((p) => !used.has(p.id)).sort((a, b) => POS_ORDER[a.pos[0]] - POS_ORDER[b.pos[0]] || ovr(b) - ovr(a));
  return '<div class="tac">' +
    '<div class="card tleft">' +
    '<div class="tctl">' +
    '<label class="fld sm"><span>Diziliş</span><select data-chg="form">' + FORM_KEYS.map((k) => '<option ' + (k === t.tac.f ? 'selected' : '') + '>' + k + '</option>').join('') + '</select></label>' +
    tacSegs(normTac(t), 'tacK') +
    '</div>' + tacHelp(t.tac) + tacAnalysis(t) +
    '<div class="row between wrap gap"><label class="chk"><input type="checkbox" data-chg="autoxi" ' + (S.autoXI ? 'checked' : '') + '> Asistan her maç en iyi 11\'i seçsin</label><button class="btn sm" data-act="bestXI">En iyi 11\'i seç</button></div>' +
    '<p class="hint">Değiştirmek için iki oyuncuya sırayla dokunun (saha, yedek veya kadro dışı). Renk: <span class="fdot f1"></span> doğal mevki <span class="fdot f2"></span> idare eder <span class="fdot f3"></span> uygun değil</p>' +
    '<div class="pitch"><div class="pl-lines"></div>' + toks + '</div>' +
    '</div>' +
    '<div class="card tright"><h3>Yedekler <small class="muted">(9)</small></h3><div class="tlist">' + benchRows.join('') + '</div>' +
    '<h3 class="mt">Kadro dışı</h3><div class="tlist">' + (res.map((p) => rowTac('res', p.id, p, isSel('res', p.id))).join('') || '<p class="muted">Herkes kadroda.</p>') + '</div></div>' +
    '</div>';
}
function tacSegs(tc, act) {
  const row = (lbl, k, arr) => '<div class="fld sm"><span>' + lbl + '</span><div class="seg">' + arr.map((n, i) => '<button class="' + (tc[k] === i ? 'on' : '') + '" data-act="' + act + '" data-k="' + k + '" data-v="' + i + '" title="' + esc(TAC_HELP[k][i]) + '">' + n + '</button>').join('') + '</div></div>';
  return row('Oyun anlayışı', 'm', MENT_TR) + row('Pres', 'pr', PRESS_TR) + row('Tempo', 'tm', TEMPO_TR) + row('Savunma çizgisi', 'ln', LINE_TR) + row('Genişlik', 'wd', WIDTH_TR) + row('Oyun stili', 'st', STYLE_TR);
}
function tacHelp(tc) {
  const names = { m: 'Anlayış', pr: 'Pres', tm: 'Tempo', ln: 'Çizgi', wd: 'Genişlik', st: 'Stil' };
  const items = Object.keys(names).filter((k) => tc[k] !== 1).map((k) => '<li><b>' + names[k] + ':</b> ' + esc(TAC_HELP[k][tc[k]]) + '</li>');
  return items.length ? '<ul class="tachelp">' + items.join('') + '</ul>' : '';
}
// Seçilen taktiğin kadroya uygunluğu
function tacAnalysis(t) {
  const tc = normTac(t);
  const slots = FORM[tc.f];
  const xi = t.lineup.map((id, i) => (id != null && P(id) ? { p: P(id), slot: slots[i] ? slots[i][0] : 'MC' } : null)).filter(Boolean);
  const avg = (f, filt) => { const l = xi.filter(filt); return l.length ? l.reduce((x, e) => x + f(e.p), 0) / l.length : 10; };
  const tech = avg((p) => (p.a.pas + p.a.tek + p.a.kar) / 3, (e) => e.slot !== 'GK');
  const spd = avg((p) => p.a.hiz, (e) => POS_GROUP[e.slot] === 'A');
  const dspd = avg((p) => p.a.hiz, (e) => POS_GROUP[e.slot] === 'D');
  const crs = avg((p) => p.a.ort, (e) => ['DR', 'DL', 'MR', 'ML', 'AMR', 'AML'].includes(e.slot));
  const air = avg((p) => p.a.kaf, (e) => ['ST', 'AMC'].includes(e.slot));
  const fam = t.fam[tc.f] == null ? 50 : t.fam[tc.f];
  const good = [], bad = [];
  if (fam < 70) bad.push('Takım ' + tc.f + ' dizilişine henüz alışmadı (%' + fam + '). Her maçla uyum artar.');
  if (tc.st === 0) (tech >= 12.5 ? good : tech < 11 ? bad : []).push('Pas oyunu için takım tekniği: ' + tech.toFixed(1) + (tech >= 12.5 ? ' (çok uygun)' : ' (yetersiz)'));
  if (tc.st === 3) (spd >= 13 ? good : spd < 11.5 ? bad : []).push('Kontra için hücumcu hızı: ' + spd.toFixed(1) + (spd >= 13 ? ' (çok uygun)' : ' (yetersiz)'));
  if (tc.st === 2 || tc.wd === 2) (air >= 13 ? good : air < 11 ? bad : []).push('Hava toplarında forvet kafa gücü: ' + air.toFixed(1) + (air >= 13 ? ' (çok uygun)' : ' (zayıf)'));
  if (tc.wd === 2) (crs >= 13 ? good : crs < 11 ? bad : []).push('Kanat oyunu için orta kalitesi: ' + crs.toFixed(1) + (crs >= 13 ? ' (çok uygun)' : ' (zayıf)'));
  if (tc.ln === 2) (dspd >= 13 ? good : dspd < 12 ? bad : []).push('Önde savunma için defans hızı: ' + dspd.toFixed(1) + (dspd >= 13 ? ' (güvenli)' : ' (hızlı forvetlere karşı riskli)'));
  if (tc.pr === 2 || tc.tm === 2) bad.push('Yüksek pres / hızlı tempo kondisyonu hızla düşürür. Rotasyon yapın.');
  return '<div class="tacan"><div class="kv"><span>Diziliş uyumu</span><b>%' + fam + '</b></div><div class="bar ' + (fam < 50 ? 'bad' : fam < 80 ? 'mid' : 'good') + '"><i style="width:' + fam + '%"></i></div>' +
    good.map((x) => '<p class="ok">✔ ' + esc(x) + '</p>').join('') + bad.map((x) => '<p class="warn">⚠ ' + esc(x) + '</p>').join('') +
    (!good.length && !bad.length ? '<p class="muted">Taktiğiniz kadronuzla uyumlu görünüyor.</p>' : '') + '</div>';
}
function rowTac(kind, key, p, sel) {
  if (!p) return '<button class="trow empty' + (sel ? ' sel' : '') + '" data-act="tsel" data-kind="' + kind + '" data-key="' + key + '"><span class="muted">Boş yedek yeri</span></button>';
  return '<button class="trow' + (sel ? ' sel' : '') + (eligible(p) ? '' : ' bad') + '" data-act="tsel" data-kind="' + kind + '" data-key="' + key + '">' + posB(p.pos[0]) + '<span class="nm">' + esc(fullName(p)) + '</span>' + starsH(stars(ovr(p))) + condH(p.cond) + statusH(p) + '</button>';
}
function tacSelect(kind, key) {
  const t = userTeam();
  if (!UI.tsel) { UI.tsel = { kind, key }; render(); return; }
  const a = UI.tsel, b = { kind, key };
  UI.tsel = null;
  if (a.kind === b.kind && String(a.key) === String(b.key)) { render(); return; }
  const getId = (s) => (s.kind === 'xi' ? t.lineup[+s.key] : s.kind === 'bench' ? t.bench[+s.key] : +s.key);
  const ida = getId(a), idb = getId(b);
  if (ida == null && idb == null) { render(); return; }
  const into = (s, id) => {
    if (id == null || s.kind === 'res') return true;
    const p = P(id);
    if (!eligible(p)) { toast(fullName(p) + (p.inj ? ' sakat.' : ' cezalı.'), 'bad'); return false; }
    return true;
  };
  if (!into(a, idb) || !into(b, ida)) { render(); return; }
  const set = (s, id) => {
    if (s.kind === 'xi') t.lineup[+s.key] = id == null ? null : id;
    else if (s.kind === 'bench') t.bench[+s.key] = id == null ? null : id;
  };
  set(a, idb); set(b, ida);
  t.bench = t.bench.filter((x) => x != null);
  if (S.autoXI) { S.autoXI = false; toast('Kadroyu siz belirlediniz; asistanın otomatik seçimi kapatıldı.'); }
  persist();
  render();
}

// ---------- Lig, fikstür, kupa ----------
function leagueHtml() {
  const tabs = [['table', 'Puan Durumu'], ['results', 'Sonuçlar'], ['g', 'Gol Krallığı'], ['a', 'Asist'], ['r', 'Reyting']];
  let body = '';
  if (UI.lg === 'table') body = fullTable();
  else if (UI.lg === 'results') body = resultsHtml();
  else {
    const list = topList(UI.lg, 20);
    body = '<div class="tw"><table class="tbl"><thead><tr><th>#</th><th>Oyuncu</th><th>Kulüp</th><th>M</th><th>' + (UI.lg === 'g' ? 'Gol' : UI.lg === 'a' ? 'Asist' : 'Ort') + '</th></tr></thead><tbody>' +
      (list.map((p, i) => '<tr class="' + (p.team === S.uid ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + posB(p.pos[0]) + ' ' + pLink(p) + '</td><td>' + teamLink(T(p.team)) + '</td><td>' + p.st.app + '</td><td><b>' + (UI.lg === 'g' ? p.st.lg : UI.lg === 'a' ? p.st.a : avgRating(p).toFixed(2)) + '</b></td></tr>').join('') || '<tr><td colspan="5" class="muted">Henüz veri yok.</td></tr>') +
      '</tbody></table></div>';
  }
  return '<div class="card"><div class="tabs">' + tabs.map(([k, n]) => '<button class="' + (UI.lg === k ? 'on' : '') + '" data-act="lgTab" data-v="' + k + '">' + n + '</button>').join('') + '</div>' + body + '</div>';
}
function fullTable() {
  const tb = table();
  const n = tb.length;
  return '<div class="tw"><table class="tbl lt"><thead><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th><th>Av</th><th>P</th><th class="hide-s">Form</th></tr></thead><tbody>' +
    tb.map((r, i) => '<tr class="' + (r.id === S.uid ? 'me ' : '') + (i === 0 ? 'z1' : i < 3 ? 'z2' : i >= n - 3 ? 'z4' : '') + '"><td>' + (i + 1) + '</td><td class="tn">' + crest(T(r.id), 'xs') + teamLink(T(r.id)) + '</td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td><td>' + r.gf + '</td><td>' + r.ga + '</td><td>' + (r.gf - r.ga > 0 ? '+' : '') + (r.gf - r.ga) + '</td><td><b>' + r.pts + '</b></td><td class="hide-s">' + r.form.slice(-5).map(resChip).join('') + '</td></tr>').join('') +
    '</tbody></table></div><p class="hint"><span class="zl z1"></span> Şampiyon <span class="zl z2"></span> Avrupa <span class="zl z4"></span> Küme düşme</p>';
}
function resultsHtml() {
  let played = 0;
  S.fx.forEach((rd, i) => { if (rd[0] && rd[0].hg != null) played = i + 1; });
  if (UI.lgRound == null) UI.lgRound = Math.max(0, played - 1);
  const r = clamp(UI.lgRound, 0, S.fx.length - 1);
  const rd = S.fx[r] || [];
  return '<div class="row between mt"><button class="btn sm" data-act="lgRound" data-v="' + (r - 1) + '" ' + (r <= 0 ? 'disabled' : '') + '>←</button><b>' + (r + 1) + '. Hafta</b><button class="btn sm" data-act="lgRound" data-v="' + (r + 1) + '" ' + (r >= S.fx.length - 1 ? 'disabled' : '') + '>→</button></div>' +
    '<div class="fxl">' + rd.map((f, i) => fxRow(f, 'L:' + r + ':' + i)).join('') + '</div>';
}
function fxRow(f, key, compact) {
  const h = T(f.h), a = T(f.a);
  const played = f.hg != null;
  const nm = (t) => esc(t ? (compact ? t.short : t.name) : '?');
  const click = played && key;
  return '<div class="fxr ' + (isUserFx(f) ? 'me' : '') + (click ? ' click' : '') + '" ' + (click ? 'data-act="fxinfo" data-k="' + key + '"' : '') + '>' +
    '<span class="fh">' + nm(h) + ' ' + crest(h, 'xs') + '</span><b class="fs">' + (played ? f.hg + ' - ' + f.ag : 'v') + '</b><span class="fa">' + crest(a, 'xs') + ' ' + nm(a) + '</span>' +
    (f.pen ? '<small class="fp">Pen: ' + f.pen[0] + '-' + f.pen[1] + '</small>' : '') + '</div>';
}
function fixturesHtml() {
  const rows = [];
  for (const ev of S.cal) {
    if (ev.k === 'W') continue;
    const arr = matchesOf(ev);
    const f = arr.find(isUserFx);
    if (!f) {
      if (ev.k === 'C' && !S.cup.rounds[ev.s] && userInCup()) rows.push('<tr><td>' + fmtDate(ev.d) + '</td><td>Kupa · ' + STAGES[ev.s] + '</td><td></td><td class="muted">Kura bekleniyor</td><td></td></tr>');
      continue;
    }
    const home = f.h === S.uid;
    const o = T(home ? f.a : f.h);
    let res = '';
    if (f.hg != null) {
      const my = home ? f.hg : f.ag, op = home ? f.ag : f.hg;
      let r = my > op ? 'G' : my < op ? 'M' : 'B';
      if (ev.k === 'C' && my === op) r = f.w === S.uid ? 'G' : 'M';
      res = resChip(r) + ' <b>' + f.hg + '-' + f.ag + '</b>' + (f.pen ? ' <small>(p ' + f.pen[0] + '-' + f.pen[1] + ')</small>' : '');
    }
    rows.push('<tr class="' + (f.hg != null ? 'click' : '') + '" ' + (f.hg != null ? 'data-act="fxinfo" data-k="' + fxKey(ev, f) + '"' : '') + '><td>' + fmtDate(ev.d) + '</td><td>' + (ev.k === 'L' ? 'Lig · ' + (ev.r + 1) + '. hf' : 'Kupa · ' + STAGES[ev.s]) + '</td><td>' + (home ? 'İç' : 'Dış') + '</td><td>' + crest(o, 'xs') + ' ' + teamLink(o) + '</td><td>' + res + '</td></tr>');
  }
  return '<div class="card"><h3>' + seasonStr(S.season) + ' Fikstürü</h3><div class="tw"><table class="tbl fx"><thead><tr><th>Tarih</th><th>Organizasyon</th><th>Saha</th><th>Rakip</th><th>Sonuç</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div></div>';
}
function cupHtml() {
  let h = '<div class="card"><h3>Kupa ' + seasonStr(S.season) + (S.cup.winner ? ' · Şampiyon: ' + teamLink(T(S.cup.winner)) : '') + '</h3><p class="hint">Tek maç eleme. Beraberlikte seri penaltılar.</p>';
  STAGES.forEach((st, s) => {
    const rd = S.cup.rounds[s];
    const ev = S.cal.find((e) => e.k === 'C' && e.s === s);
    h += '<h4>' + st + ' <small class="muted">' + (ev ? fmtDate(ev.d) : '') + '</small></h4>';
    h += rd ? '<div class="fxl">' + rd.map((f, i) => fxRow(f, 'C:' + s + ':' + i)).join('') + '</div>' : '<p class="muted">Kura önceki tur sonunda çekilecek.</p>';
  });
  return h + '</div>';
}

// ---------- Transfer ----------
function transferHtml() {
  const f = UI.trf;
  const open = windowOpen();
  const room = S.fin.wb - userWages();
  return '<div class="card"><div class="tbanner ' + (open ? 'open' : 'closed') + '"><b>' + (open ? 'Transfer dönemi AÇIK' : 'Transfer dönemi kapalı') + '</b><span>' + (open ? (monthOf(S.date) === 0 ? '31 Ocak\'a kadar' : '31 Ağustos\'a kadar') : 'Sonraki dönem: ' + (monthOf(S.date) >= 8 ? 'Ocak' : 'Temmuz') + '. Oyuncuları şimdiden inceleyebilirsiniz.') + '</span></div>' +
    '<div class="kvs"><div class="kv"><span>Transfer bütçesi</span><b>' + fmtMoney(S.fin.tb) + '</b></div><div class="kv"><span>Maaş alanı / hafta</span><b class="' + (room < 0 ? 'neg' : '') + '">' + fmtMoney(room) + '</b></div><div class="kv"><span>Kadro</span><b>' + userTeam().players.length + '/32</b></div></div>' +
    '<div class="tabs"><button class="' + (f.tab === 'search' ? 'on' : '') + '" data-act="trTab" data-v="search">Oyuncu Ara</button><button class="' + (f.tab === 'mine' ? 'on' : '') + '" data-act="trTab" data-v="mine">Satış Listem</button></div>' +
    (f.tab === 'search' ? '<div class="filters">' +
      '<input type="search" placeholder="İsim ara" value="' + esc(f.q) + '" data-inp="trq">' +
      '<select data-chg="trg"><option value="">Tüm mevkiler</option>' + ['G', 'D', 'M', 'A'].map((g) => '<option value="' + g + '" ' + (f.g === g ? 'selected' : '') + '>' + GROUP_TR[g] + '</option>').join('') + POS_LIST_OPTS(f.g) + '</select>' +
      '<select data-chg="trage"><option value="">Her yaş</option>' + [21, 23, 25, 28, 31].map((a) => '<option value="' + a + '" ' + (+f.age === a ? 'selected' : '') + '>≤ ' + a + ' yaş</option>').join('') + '</select>' +
      '<select data-chg="trmaxv"><option value="">Her bedel</option>' + [250000, 500000, 1e6, 2e6, 5e6, 1e7, 2e7].map((v) => '<option value="' + v + '" ' + (+f.maxv === v ? 'selected' : '') + '>≤ ' + fmtMoney(v) + '</option>').join('') + '</select>' +
      '<label class="chk"><input type="checkbox" data-chg="trfa" ' + (f.fa ? 'checked' : '') + '> Serbest</label>' +
      '<label class="chk"><input type="checkbox" data-chg="trlisted" ' + (f.listed ? 'checked' : '') + '> Satılık</label>' +
      '</div>' : '') +
    '<div id="trres"></div></div>';
}
function POS_LIST_OPTS(sel) { return Object.keys(POS_TR).map((k) => '<option value="' + k + '" ' + (sel === k ? 'selected' : '') + '>' + POS_LONG[k] + '</option>').join(''); }
function transferPool() {
  const f = UI.trf;
  if (f.tab === 'mine') return teamPlayers(userTeam()).filter((p) => p.listed);
  let pl = [];
  if (!f.fa) for (const tid of S.league) if (tid !== S.uid) pl.push(...teamPlayers(T(tid)));
  pl.push(...S.fa.map(P).filter(Boolean));
  const q = f.q.trim().toLocaleLowerCase('tr');
  return pl.filter((p) => {
    if (f.g) { if (f.g.length === 1 ? POS_GROUP[p.pos[0]] !== f.g : !p.pos.includes(f.g)) return false; }
    if (f.age && p.age > +f.age) return false;
    if (f.maxv && valueOf(p) > +f.maxv) return false;
    if (f.listed && !p.listed && p.team) return false;
    if (q && !fullName(p).toLocaleLowerCase('tr').includes(q)) return false;
    return true;
  });
}
const TR_COLS = [['name', 'Oyuncu', (p) => p.ln], ['pos', 'Mvk', (p) => POS_ORDER[p.pos[0]]], ['age', 'Yaş', (p) => p.age], ['club', 'Kulüp', (p) => (p.team ? T(p.team).name : 'zzz')], ['ovr', 'Güç', (p) => ovr(p)], ['pot', 'Pot.', (p) => p.h.pot], ['val', 'Değer', (p) => valueOf(p)], ['wage', 'Maaş', (p) => p.wage]];
function renderTransferResults() {
  const box = $('#trres');
  if (!box) return;
  const f = UI.trf;
  const col = TR_COLS.find((c) => c[0] === f.sort) || TR_COLS[4];
  const pl = transferPool().sort((a, b) => {
    const x = col[2](a), y = col[2](b);
    const c = typeof x === 'string' ? x.localeCompare(y, 'tr') : x - y;
    return c * f.d;
  });
  const shown = pl.slice(0, 80);
  box.innerHTML = '<p class="hint">' + pl.length + ' oyuncu bulundu' + (pl.length > 80 ? ' (ilk 80 gösteriliyor)' : '') + '. Detay ve teklif için oyuncuya dokunun.</p>' +
    '<div class="tw"><table class="tbl tr"><thead><tr>' + TR_COLS.map((c) => '<th data-act="trSort" data-k="' + c[0] + '" class="' + (f.sort === c[0] ? 'sorted' : '') + '">' + c[1] + '</th>').join('') + '</tr></thead><tbody>' +
    (shown.map((p) => '<tr data-act="player" data-id="' + p.id + '"><td class="nm"><b>' + esc(fullName(p)) + '</b> ' + (p.listed ? '<span class="tag blue">Satılık</span>' : '') + '</td><td>' + posB(p.pos[0]) + '</td><td>' + p.age + '</td><td>' + (p.team ? crest(T(p.team), 'xs') + ' ' + esc(T(p.team).short) : '<span class="tag green">Serbest</span>') + '</td><td>' + starsH(stars(ovr(p))) + '</td><td>' + starsH(stars(p.h.pot)) + '</td><td>' + fmtMoney(valueOf(p)) + '</td><td>' + fmtMoney(p.team ? p.wage : wageFor(p)) + '</td></tr>').join('') || '<tr><td colspan="8" class="muted">Sonuç yok.</td></tr>') +
    '</tbody></table></div>';
}

// ---------- Kulüp ----------
function clubHtml() {
  const t = userTeam();
  const f = S.fin;
  const w = userWages();
  return '<div class="grid g2">' +
    '<section class="card"><h3>' + crest(t) + ' ' + esc(t.name) + '</h3><div class="kv"><span>Şehir</span><b>' + esc(t.city) + '</b></div><div class="kv"><span>Stadyum</span><b>' + esc(t.st) + ' (' + t.cap.toLocaleString('tr-TR') + ')</b></div><div class="kv"><span>İtibar</span><b>' + starsH(clamp(Math.round((t.rep - 40) / 5) / 2, 0.5, 5)) + '</b></div><div class="kv"><span>Menajer</span><b>' + esc(S.mgr) + '</b></div></section>' +
    '<section class="card"><h3>Yönetim</h3>' + boardCard() + '</section>' +
    '<section class="card"><h3>Finans</h3><div class="kv"><span>Kasa</span><b class="' + (f.bal < 0 ? 'neg' : '') + '">' + fmtMoney(f.bal) + '</b></div><div class="kv"><span>Transfer bütçesi</span><b>' + fmtMoney(f.tb) + '</b></div><div class="kv"><span>Haftalık maaşlar</span><b>' + fmtMoney(w) + ' / ' + fmtMoney(f.wb) + '</b></div>' +
    '<div class="bar ' + (w > f.wb ? 'bad' : 'good') + '"><i style="width:' + clamp(w / f.wb * 100, 0, 100) + '%"></i></div>' +
    '<h4>Bu sezon</h4><div class="kv"><span>Gişe</span><b>' + fmtMoney(f.h.gate) + '</b></div><div class="kv"><span>Yayın + sponsor</span><b>' + fmtMoney(f.h.tv) + '</b></div><div class="kv"><span>Satışlar</span><b>' + fmtMoney(f.h.sales) + '</b></div><div class="kv"><span>Alımlar</span><b>-' + fmtMoney(f.h.buys) + '</b></div><div class="kv"><span>Ödenen maaşlar</span><b>-' + fmtMoney(f.h.wages) + '</b></div></section>' +
    '<section class="card"><h3>Antrenman</h3><div class="train">' + Object.keys(TRAIN).map((k) => '<button class="tr-o ' + (S.train === k ? 'on' : '') + '" data-act="train" data-v="' + k + '"><b>' + TRAIN[k] + '</b><small>' + TRAIN_DESC[k] + '</small></button>').join('') + '</div></section>' +
    '<section class="card"><h3>Kariyer</h3><div class="kv"><span>Sezon</span><b>' + S.rec.seasons + '</b></div><div class="kv"><span>Lig şampiyonluğu</span><b>' + S.rec.titles + '</b></div><div class="kv"><span>Kupa</span><b>' + S.rec.cups + '</b></div>' +
    (S.hist.length ? '<div class="tw"><table class="tbl mt"><thead><tr><th>Sezon</th><th>Kulüp</th><th>Sıra</th><th>Kupa</th><th>Şampiyon</th></tr></thead><tbody>' + S.hist.slice().reverse().map((h) => '<tr><td>' + seasonStr(h.season) + '</td><td>' + esc(h.team) + '</td><td>' + h.pos + '.</td><td>' + esc(h.cupRes) + '</td><td>' + esc(h.champ) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">İlk sezonunuz devam ediyor.</p>') + '</section>' +
    '<section class="card"><h3>Oyun</h3><p class="hint">Oyun her adımda tarayıcınıza otomatik kaydedilir. Kaydı dosya olarak da saklayabilirsiniz.</p><div class="col gap"><button class="btn" data-act="sound">' + icon(SFX.on ? 'vol' : 'mute') + ' Stadyum sesi: ' + (SFX.on ? 'Açık' : 'Kapalı') + '</button><button class="btn" data-act="exportSave">Kaydı dosyaya indir</button><button class="btn" data-act="importFile">Kayıt dosyası yükle</button><button class="btn ghost" data-act="toTitle">Ana menü</button><button class="btn danger" data-act="resetGame">Kariyeri sil ve yeniden başla</button></div></section>' +
    '</div>';
}

// ---------- Maç öncesi ----------
function prematchHtml() {
  const ev = S.cal[S.evi];
  const uf = matchesOf(ev).find(isUserFx);
  if (!uf) { UI.scr = 'home'; return homeHtml(); }
  const ut = userTeam();
  const side = uf.h === S.uid ? 0 : 1;
  const opp = T(side === 0 ? uf.a : uf.h);
  if (S.autoXI) { const pk = autoPick(ut, ut.tac.f); ut.lineup = pk.xi; ut.bench = pk.bench; }
  const notes = validateLineup(ut);
  prepareAI(opp, ut, side === 1);
  const m = new Match(T(uf.h), T(uf.a), { cup: ev.k === 'C' });
  const s0 = m.str(side), s1 = m.str(1 - side);
  const tb = table();
  const anyPlayed = tb.some((r) => r.p > 0);
  const rk = (id) => (anyPlayed ? tb.findIndex((r) => r.id === id) + 1 + '. sıra' : '');
  const oform = (tb.find((r) => r.id === opp.id) || { form: [] }).form.slice(-5);
  const danger = teamPlayers(opp).filter((p) => opp.lineup.includes(p.id)).sort((a, b) => ovr(b) - ovr(a)).slice(0, 3);
  const cmp = (n, a, b) => { const tot = a + b; const pa = Math.round(a / tot * 100); return '<div class="cmp"><span>' + n + '</span><div class="cbar"><i style="width:' + pa + '%"></i></div><small>' + (a > b * 1.04 ? 'Üstünüz' : b > a * 1.04 ? 'Rakip üstün' : 'Denk') + '</small></div>'; };
  const slots = FORM[ut.tac.f];
  const xi = ut.lineup.map((id, i) => {
    const p = id != null ? P(id) : null;
    if (!p) return '<div class="li"><span class="muted">' + POS_TR[slots[i][0]] + ' boş</span></div>';
    const fit = fitOf(p, slots[i][0]);
    return '<div class="li">' + posB(slots[i][0]) + pLink(p) + (fit < 0.88 ? '<span class="tag amber" title="Mevkisi değil">Mevki dışı</span>' : '') + condH(p.cond) + '</div>';
  }).join('');
  let press = '';
  if (S.press && S.press.q >= 0) {
    const q = PRESS[S.press.q];
    press = '<section class="card"><h3>Basın Toplantısı</h3><p class="q">"' + esc(q.q) + '"</p>' +
      (S.press.ans == null ? '<div class="col gap">' + q.a.map((a, i) => '<button class="btn left" data-act="pressAns" data-v="' + i + '">' + esc(a.tx) + '</button>').join('') + '</div><p class="hint">Cevabınız oyuncuların moralini etkileyebilir. İddialı sözler kaybedilirse pahalıya patlar.</p>'
        : '<p class="ans">Cevabınız: <b>' + esc(q.a[S.press.ans].tx) + '</b></p>') + '</section>';
  }
  return '<div class="pm">' +
    '<section class="card pmh"><small>' + esc(compName(ev)) + ' · ' + fmtDate(ev.d, true) + ' · ' + esc(T(uf.h).st) + '</small>' +
    '<div class="nmv">' + crest(T(uf.h), 'xl') + '<div class="nmt"><b>' + esc(T(uf.h).name) + '</b><span>' + (ev.k === 'L' ? rk(uf.h) : '') + '</span></div><span class="vs">VS</span><div class="nmt"><b>' + esc(T(uf.a).name) + '</b><span>' + (ev.k === 'L' ? rk(uf.a) : '') + '</span></div>' + crest(T(uf.a), 'xl') + '</div>' +
    '<button class="btn primary big" data-act="startMatch">Maça Çık ' + icon('play') + '</button></section>' +
    '<div class="grid g3">' +
    '<section class="card"><h3>İlk 11 <small class="muted">' + ut.tac.f + ' · ' + MENT_TR[ut.tac.m] + '</small></h3>' + (notes.length ? '<div class="notes">' + notes.map((n) => '<p>• ' + esc(n) + '</p>').join('') + '</div>' : '') + xi + '<div class="row gap mt"><button class="btn sm" data-act="nav" data-s="tactics">Taktiği düzenle</button></div></section>' +
    '<section class="card"><h3>Rakip: ' + teamLink(opp) + '</h3><div class="kv"><span>Diziliş</span><b>' + opp.tac.f + ' · ' + MENT_TR[opp.tac.m] + '</b></div><div class="kv"><span>Oyun stili</span><b>' + STYLE_TR[opp.tac.st] + ' · çizgi ' + LINE_TR[opp.tac.ln].toLocaleLowerCase('tr') + ' · pres ' + PRESS_TR[opp.tac.pr].toLocaleLowerCase('tr') + '</b></div><div class="kv"><span>Son form</span><b>' + (oform.length ? oform.map(resChip).join('') : '-') + '</b></div>' +
    (opp.tac.m === 2 || opp.tac.ln === 2 ? '<p class="hint">Scout: Rakip önde ve hücumcu oynayacak; hızlı forvetlerle kontra atak etkili olabilir.</p>' : opp.tac.m === 0 ? '<p class="hint">Scout: Rakip geride kapanacak; geniş oyun ve ortalar savunmayı açabilir.</p>' : '') +
    '<h4>Güç karşılaştırması</h4>' + cmp('Savunma', s0.d, s1.a) + cmp('Orta saha', s0.m, s1.m) + cmp('Hücum', s0.a, s1.d) +
    '<h4>Tehlikeli oyuncular</h4>' + danger.map((p) => '<div class="li">' + posB(p.pos[0]) + pLink(p) + starsH(stars(ovr(p))) + '</div>').join('') + '</section>' +
    (press || '<section class="card"><h3>Antrenman</h3><p>Haftalık odak: <b>' + TRAIN[S.train] + '</b></p><p class="hint">' + TRAIN_DESC[S.train] + '</p><button class="btn sm" data-act="nav" data-s="club">Değiştir</button></section>') +
    '</div></div>';
}

// ---------- Maç ekranı ----------
function startMatch() {
  const ev = S.cal[S.evi];
  if (S.phase !== 'play' || !ev || S.date < ev.d || !matchesOf(ev).some(isUserFx)) { UI.scr = 'home'; onContinue(); return; }
  const u = makeUserMatch();
  if (!u) { toast('Maç bulunamadı.', 'bad'); return; }
  closeModal();
  UI.mc = { ...u, paused: false, timer: null, feedN: 0, over: false };
  if (u.notes.length) for (const n of u.notes) toast(n);
  const m = u.m;
  const h = m.t[0], a = m.t[1];
  $('#app').innerHTML = '<div class="match" style="--h1:' + h.c1 + ';--h2:' + h.c2 + ';--a1:' + a.c1 + ';--a2:' + a.c2 + '">' +
    '<div class="mhead"><small class="mcomp">' + esc(compName(u.ev)) + ' · ' + esc(h.st) + '</small>' +
    '<div class="msb"><div class="mteam h">' + crest(h, 'lg') + '<b>' + esc(h.name) + '</b></div><div class="msc"><span id="sc0">0</span><i>-</i><span id="sc1">0</span><em id="mclk">0\'</em></div><div class="mteam a"><b>' + esc(a.name) + '</b>' + crest(a, 'lg') + '</div></div>' +
    '<div class="mscorers"><div id="gs0"></div><div id="gs1"></div></div>' +
    '<div class="mpitch"><div class="mp-half"></div><div class="mp-circle"></div><div class="mball" id="mball"></div></div></div>' +
    '<div class="mbody"><div class="mfeed" id="mfeed"></div><div class="mside"><div class="mstats" id="mstats"></div><div class="mtick" id="mtick"></div></div></div>' +
    '<div class="mctl" id="mctl"></div>' +
    '<div class="gflash" id="gflash"></div></div>';
  renderMatchCtl();
  updateMatchSide();
  SFX.crowdStart();
  scheduleTick(400);
}
const SPEEDS = [650, 300, 90];
function scheduleTick(d) {
  const mc = UI.mc;
  if (!mc) return;
  clearTimeout(mc.timer);
  mc.timer = setTimeout(matchTick, d == null ? SPEEDS[UI.speed] : d);
}
function matchTick() {
  const mc = UI.mc;
  if (!mc || mc.paused || mc.over) return;
  const evs = mc.m.step();
  addFeed(evs);
  updateMatchSide();
  if (mc.m.done) { matchOver(); return; }
  if (evs.some((e) => e.type === 'ht')) { mc.paused = true; renderMatchCtl(); toast('Devre arası. Taktik değişikliği yapabilirsiniz.'); return; }
  const g = evs.some((e) => e.type === 'goal' || e.type === 'red');
  scheduleTick(g ? Math.max(1200, SPEEDS[UI.speed] * 3) : SPEEDS[UI.speed]);
}
function playSfx(e, mine) {
  if (e.type === 'ko' || e.type === 'yellow' || e.type === 'red' || (e.type === 'chance' && /Penaltı|penaltı/.test(e.text))) SFX.whistle('short');
  else if (e.type === 'ht') SFX.whistle('long');
  else if (e.type === 'ft') SFX.whistle('final');
  else if (e.type === 'goal') SFX.goal(mine);
  else if ((e.type === 'miss' || e.type === 'save') && R() < 0.7) SFX.ooh();
}
function addFeed(evs, quiet) {
  const mc = UI.mc;
  const feed = $('#mfeed');
  if (!feed) return;
  let html = '';
  for (const e of evs) {
    if (!e.text) continue;
    const s = e.side === -1 ? 'n' : e.side === 0 ? 'h' : 'a';
    const mine = e.side === mc.side;
    if (!quiet) playSfx(e, mine);
    html = '<div class="fe ' + e.type + ' s' + s + (mine ? ' mine' : '') + '"><span class="fm">' + e.min + '\'</span><span class="ft">' + esc(e.text) + '</span></div>' + html;
    if (e.type === 'goal') flashGoal(e.side);
    if (e.type === 'goal' || e.type === 'save' || e.type === 'miss' || e.type === 'chance') moveBall(e.side, e.type === 'goal' ? 96 : 84);
    else if (e.type === 'build') moveBall(e.side, 66);
  }
  if (html) {
    feed.insertAdjacentHTML('afterbegin', html);
    while (feed.children.length > 140) feed.lastChild.remove();
  }
  if (!evs.some((e) => ['goal', 'save', 'miss', 'chance', 'build'].includes(e.type))) {
    const sp = mc.m.stats.pos;
    const tot = sp[0] + sp[1] || 1;
    moveBall(sp[0] / tot >= 0.5 ? 0 : 1, 50 + Math.abs(sp[0] / tot - 0.5) * 40 + (R() * 16 - 8));
  }
}
function moveBall(side, depth) {
  const b = $('#mball');
  if (!b) return;
  const x = side === 0 ? depth : 100 - depth;
  b.style.left = clamp(x, 3, 97) + '%';
  b.style.top = (30 + R() * 40) + '%';
}
function flashGoal(side) {
  const el = $('#gflash');
  const mc = UI.mc;
  if (!el || !mc) return;
  const t = mc.m.t[side];
  el.innerHTML = '<div style="--c1:' + t.c1 + ';--c2:' + t.c2 + '"><b>GOL!</b><span>' + esc(t.name) + '</span></div>';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  const sc = $('#sc' + side);
  if (sc) { sc.classList.remove('pulse'); void sc.offsetWidth; sc.classList.add('pulse'); }
}
function updateMatchSide() {
  const mc = UI.mc;
  if (!mc) return;
  const m = mc.m;
  $('#sc0').textContent = m.sc[0];
  $('#sc1').textContent = m.sc[1];
  $('#mclk').textContent = m.done ? 'MS' : !m.started ? '0\'' : m.htPending ? 'İY' : m.clock() + '\'';
  for (const i of [0, 1]) {
    const gs = m.goals.filter((g) => g.side === i).map((g) => { const p = P(g.pid); return esc(p ? p.ln : '?') + ' ' + g.min + '\'' + (g.pen ? ' (p)' : ''); });
    const reds = m.log.filter((e) => e.type === 'red' && e.side === i).map((e) => '<span class="rc"></span>' + esc(P(e.pid) ? P(e.pid).ln : '') + ' ' + e.min + '\'');
    $('#gs' + i).innerHTML = gs.concat(reds).join(' · ');
  }
  const st = m.stats;
  const pt = st.pos[0] + st.pos[1] || 1;
  const row = (n, a, b, pct) => { const tot = a + b || 1; return '<div class="srow"><b>' + a + (pct ? '%' : '') + '</b><div class="sb"><i style="width:' + (a / tot * 100) + '%"></i></div><span>' + n + '</span><div class="sb r"><i style="width:' + (b / tot * 100) + '%"></i></div><b>' + b + (pct ? '%' : '') + '</b></div>'; };
  const p0 = Math.round(st.pos[0] / pt * 100);
  $('#mstats').innerHTML = '<h4>İstatistik</h4>' + row('Topla oynama', p0, 100 - p0, true) + row('Şut', st.sh[0], st.sh[1]) + row('İsabetli şut', st.sot[0], st.sot[1]) + row('Korner', st.cor[0], st.cor[1]) + row('Faul', st.fo[0], st.fo[1]) + row('Sarı kart', st.yc[0], st.yc[1]) + row('Kırmızı kart', st.rc[0], st.rc[1]);
  // Diğer maçlar
  const cur = m.done ? { h: 9, m: 999 } : { h: m.half, m: m.m };
  const tick = mc.others.map(({ f, m: om }) => {
    let a = 0, b = 0;
    for (const g of om.goals) if (g.half < cur.h || (g.half === cur.h && g.m <= cur.m)) { if (g.side === 0) a++; else b++; }
    return '<div class="otk"><span>' + esc(om.t[0].short) + '</span><b>' + a + '-' + b + '</b><span>' + esc(om.t[1].short) + '</span></div>';
  }).join('');
  $('#mtick').innerHTML = mc.others.length ? '<h4>Diğer maçlar</h4>' + tick : '';
}
function renderMatchCtl() {
  const mc = UI.mc;
  if (!mc) return;
  const el = $('#mctl');
  if (mc.over) {
    el.innerHTML = '<button class="btn primary big" data-act="matchReport">Maç Raporu ' + icon('play') + '</button>';
    return;
  }
  SFX.setPaused(mc.paused || mc.over);
  const ht = mc.m.htPending && mc.paused;
  el.innerHTML = '<button class="btn icon ' + (mc.paused ? 'primary' : '') + '" data-act="mPause" aria-label="' + (mc.paused ? 'Devam' : 'Duraklat') + '">' + icon(mc.paused ? 'play' : 'pause') + (ht ? '<span>2. Yarı</span>' : '') + '</button>' +
    '<div class="seg">' + ['Yavaş', 'Normal', 'Hızlı'].map((n, i) => '<button class="' + (UI.speed === i ? 'on' : '') + '" data-act="mSpeed" data-v="' + i + '">' + n + '</button>').join('') + '</div>' +
    '<button class="btn" data-act="mTac">' + icon('swap') + '<span>Taktik</span><small class="subs">' + mc.m.sd[mc.side].subs + '</small></button>' +
    '<button class="btn ghost" data-act="mSkip">' + icon('next') + '<span>Sonuca geç</span></button>' +
    '<button class="btn icon ghost" data-act="sound" aria-label="Ses" title="Stadyum sesi">' + icon(SFX.on ? 'vol' : 'mute') + '</button>';
}
function matchOver() {
  const mc = UI.mc;
  if (!mc || mc.over) return;
  mc.over = true;
  clearTimeout(mc.timer);
  finishEvent(mc.ev, [{ f: mc.uf, m: mc.m }, ...mc.others]);
  UI.lastRes = { ev: mc.ev, uf: mc.uf, m: mc.m, side: mc.side, others: mc.others };
  SFX.crowdStop(false);
  persist();
  updateMatchSide();
  renderMatchCtl();
}
function skipMatch() {
  const mc = UI.mc;
  if (!mc || mc.over) return;
  clearTimeout(mc.timer);
  const keep = [];
  let g = 0;
  while (!mc.m.done && g++ < 400) for (const e of mc.m.step()) if (['goal', 'red', 'sub', 'inj', 'ht', 'ft', 'pen', 'info'].includes(e.type)) keep.push(e);
  mc.paused = false;
  addFeed(keep, true);
  SFX.whistle("final");
  matchOver();
}
function matchTacHtml() {
  const mc = UI.mc;
  const sd = mc.m.sd[mc.side];
  const sel = mc.subSel || {};
  const on = sd.on.map((e) => {
    const x = sd.ps[e.p.id];
    return '<button class="trow ' + (sel.out === e.p.id ? 'sel' : '') + '" data-act="mSubOut" data-id="' + e.p.id + '">' + posB(e.slot) + '<span class="nm">' + esc(fullName(e.p)) + '</span>' + condH(e.p.cond) + ratH(clamp(round1(6.4 + x.r), 3, 10)) + (x.yc ? '<span class="yc"></span>' : '') + '</button>';
  }).join('');
  const bench = sd.bench.map((p) => '<button class="trow ' + (sel.in === p.id ? 'sel' : '') + '" data-act="mSubIn" data-id="' + p.id + '">' + posB(p.pos[0]) + '<span class="nm">' + esc(fullName(p)) + '</span>' + starsH(stars(ovr(p))) + condH(p.cond) + '</button>').join('');
  return '<h2>Maç İçi Taktik</h2>' +
    '<div class="tctl"><label class="fld sm"><span>Diziliş</span><select data-chg="mForm">' + FORM_KEYS.map((k) => '<option ' + (k === sd.f ? 'selected' : '') + '>' + k + '</option>').join('') + '</select></label>' +
    tacSegs({ m: sd.men, pr: sd.pr, tm: sd.tm, ln: sd.ln, wd: sd.wd, st: sd.st }, 'mTacK') + '</div>' +
    '<h3>Oyuncu değişikliği <small class="muted">(kalan hak: ' + sd.subs + ')</small></h3><p class="hint">Önce çıkacak oyuncuyu, sonra girecek oyuncuyu seçin.</p>' +
    '<div class="subs2"><div><h4>Sahada</h4><div class="tlist">' + on + '</div></div><div><h4>Yedekler</h4><div class="tlist">' + (bench || '<p class="muted">Yedek kalmadı.</p>') + '</div></div></div>' +
    '<div class="row end mt"><button class="btn primary" data-act="mTacClose">Maça dön ' + icon('play') + '</button></div>';
}
function openMatchTac() {
  const mc = UI.mc;
  if (!mc || mc.over) return;
  mc.paused = true;
  clearTimeout(mc.timer);
  mc.subSel = {};
  renderMatchCtl();
  openModal(matchTacHtml(), 'wide');
}
function refreshMatchTac() { const b = $('#modal .mbox'); if (b && UI.mc) { openModal(matchTacHtml(), 'wide'); } }
function trySub() {
  const mc = UI.mc;
  const s = mc.subSel;
  if (!s.out || !s.in) return;
  const out = [];
  const ok = mc.m.sub(mc.side, s.out, s.in, out);
  mc.subSel = {};
  if (ok) { mc.m.log.push(...out); addFeed(out); updateMatchSide(); toast('Değişiklik yapıldı.'); }
  else toast('Değişiklik yapılamadı.', 'bad');
  refreshMatchTac();
  renderMatchCtl();
}

// ---------- Maç sonu ----------
function resultHtml() {
  const r = UI.lastRes;
  if (!r) { UI.scr = 'home'; return homeHtml(); }
  const m = r.m;
  const h = m.t[0], a = m.t[1];
  const my = m.sc[r.side], op = m.sc[1 - r.side];
  const w = m.winner();
  const verdict = w === r.side ? 'Galibiyet!' : w === -1 ? 'Beraberlik' : 'Mağlubiyet';
  const ratings = (i) => {
    const sd = m.sd[i];
    return Object.keys(sd.ps).map((id) => ({ p: P(+id), x: sd.ps[id] })).filter((o) => o.p).sort((x, y) => (x.x.in - y.x.in) || POS_ORDER[x.x.slot] - POS_ORDER[y.x.slot])
      .map((o) => '<div class="li">' + posB(o.x.slot) + pLink(o.p) + (o.x.g ? '<span class="tag green">' + o.x.g + ' gol</span>' : '') + (o.x.a ? '<span class="tag">' + o.x.a + ' asist</span>' : '') + (o.x.rc ? '<span class="rc"></span>' : o.x.yc ? '<span class="yc"></span>' : '') + (o.x.inj ? '<span class="tag red">Sakat</span>' : '') + (o.x.in > 0 ? '<small class="muted">' + o.x.in + '\'</small>' : '') + ratH(o.x.rat) + '</div>').join('');
  };
  const motm = m.motm ? P(m.motm.pid) : null;
  const goals = (i) => m.goals.filter((g) => g.side === i).map((g) => esc(P(g.pid) ? P(g.pid).ln : '?') + ' ' + g.min + '\'' + (g.pen ? ' (p)' : '')).join('<br>');
  return '<div class="res">' +
    '<section class="card rhead ' + (w === r.side ? 'win' : w === -1 ? 'draw' : 'loss') + '"><small>' + esc(compName(r.ev)) + '</small><h2>' + verdict + '</h2>' +
    '<div class="nmv">' + crest(h, 'xl') + '<div class="nmt"><b>' + esc(h.name) + '</b><small>' + goals(0) + '</small></div><span class="fsc">' + m.sc[0] + ' - ' + m.sc[1] + '</span><div class="nmt"><b>' + esc(a.name) + '</b><small>' + goals(1) + '</small></div>' + crest(a, 'xl') + '</div>' +
    (m.pens ? '<p>Penaltılar: ' + m.pens[0] + '-' + m.pens[1] + '</p>' : '') +
    (motm ? '<p class="motm">Maçın oyuncusu: ' + pLink(motm) + ' (' + m.sd[m.motm.side].ps[motm.id].rat.toFixed(1) + ')</p>' : '') +
    (r.uf.att ? '<p class="muted">Seyirci: ' + r.uf.att.toLocaleString('tr-TR') + '</p>' : '') +
    '<button class="btn primary big" data-act="continue">Devam ' + icon('play') + '</button></section>' +
    '<div class="grid g3"><section class="card"><h3>' + esc(h.name) + '</h3>' + ratings(0) + '</section><section class="card"><h3>' + esc(a.name) + '</h3>' + ratings(1) + '</section>' +
    '<section class="card"><h3>Diğer sonuçlar</h3><div class="fxl">' + r.others.map(({ f }) => fxRow(f, null, true)).join('') + '</div>' +
    (r.ev.k === 'L' ? '<h4>Puan durumu</h4>' + tableMini(table(), userPos()) : '') +
    '<h4>Yönetim güveni</h4><div class="bar ' + (S.board.conf < 30 ? 'bad' : S.board.conf < 55 ? 'mid' : 'good') + '"><i style="width:' + Math.round(S.board.conf) + '%"></i></div></section></div></div>';
}

// ---------- Sezon sonu / kovulma ----------
function shareUrl(text) { return 'https://x.com/intent/tweet?text=' + encodeURIComponent(text); }
function seasonShareText() {
  const e = S.seasonEnd;
  const t = userTeam();
  const base = location.href.split('#')[0];
  let s = 'Saha Kenarı\'nda ' + t.name + ' ile ' + seasonStr(e.season) + ' sezonunu ' + e.pos + '. sırada bitirdim';
  if (e.pos === 1) s += ' ve ŞAMPİYON oldum! 🏆';
  else s += '!';
  if (e.cupW === S.uid) s += ' Kupayı da kaldırdık! 🏆';
  return s + ' ⚽\n' + base;
}
function seasonHtml() {
  const e = S.seasonEnd;
  if (!e) { UI.scr = 'home'; return homeHtml(); }
  const tb = table();
  const aw = (lbl, o, v) => { const p = o ? P(o.id) : null; return p ? '<div class="kv"><span>' + lbl + '</span><b>' + pLink(p) + ' <small class="muted">' + esc(T(p.team) ? T(p.team).short : '') + ' · ' + v + '</small></b></div>' : ''; };
  const offers = S.offers || [];
  return '<div class="season">' +
    '<section class="card shead ' + (e.pos === 1 ? 'champ' : '') + '"><small>' + seasonStr(e.season) + ' sezonu sona erdi</small><h1>' + (e.pos === 1 ? '🏆 ŞAMPİYON!' : e.pos + '. sıra') + '</h1>' +
    '<p>' + esc(e.verdict) + '</p><p class="muted">Hedef: ' + esc(e.target) + ' · Kupa: ' + esc(e.cupRes) + ' · Ödül: ' + fmtMoney(e.prize) + '</p>' +
    '<div class="row gap center wrap"><button class="btn primary big" data-act="nextSeason">Yeni sezona başla ' + icon('play') + '</button><a class="btn big share" target="_blank" rel="noopener" href="' + shareUrl(seasonShareText()) + '">' + icon('share') + ' X\'te paylaş</a></div></section>' +
    (offers.length ? '<section class="card"><h3>İş teklifleri</h3><p class="hint">Başarınız dikkat çekti. Kulübünüzde kalabilir veya bir teklifi kabul edebilirsiniz.</p>' + offers.map((id) => offerCard(T(id), 'acceptOffer')).join('') + '</section>' : '') +
    '<div class="grid g2"><section class="card"><h3>Final puan durumu</h3>' + fullTable() + '</section>' +
    '<section class="card"><h3>Ödüller</h3>' + '<div class="kv"><span>Şampiyon</span><b>' + teamLink(T(e.champ)) + '</b></div>' + (e.cupW && T(e.cupW) ? '<div class="kv"><span>Kupa</span><b>' + teamLink(T(e.cupW)) + '</b></div>' : '') +
    aw('Gol kralı', e.top, e.top ? e.top.g + ' gol' : '') + aw('Yılın oyuncusu', e.best, e.best ? e.best.r : '') + aw('Yılın genci', e.young, e.young ? e.young.r : '') +
    '<div class="kv"><span>Küme düşenler</span><b>' + e.rel.map((id) => esc(T(id) ? T(id).name : '')).join(', ') + '</b></div></section></div></div>';
}
function offerCard(t, act) {
  if (!t) return '';
  return '<div class="offer">' + crest(t, 'lg') + '<div><b>' + esc(t.name) + '</b><small>' + esc(t.city) + ' · Bütçe ~' + fmtMoney(t.tb) + '</small>' + starsH(clamp(Math.round((t.rep - 40) / 5) / 2, 0.5, 5)) + '</div><button class="btn primary" data-act="' + act + '" data-id="' + t.id + '">Kabul et</button></div>';
}
function firedHtml() {
  const offers = S.offers || [];
  return '<div class="season"><section class="card shead fired"><small>' + fmtDate(S.date) + '</small><h1>Görevinize son verildi</h1><p>' + esc(S.firedWhy) + '</p>' +
    (S.seasonEnd ? '<p class="muted">' + seasonStr(S.seasonEnd.season) + ' sezonunu ' + S.seasonEnd.pos + '. sırada bitirdiniz.</p>' : '') + '</section>' +
    '<section class="card"><h3>İş teklifleri</h3>' + (offers.length ? '<p class="hint">Futbol dünyası sizi unutmadı. Bir teklifi kabul ederek kariyerinize devam edin.</p>' + offers.map((id) => offerCard(T(id), 'takeFiredJob')).join('') : '<p class="muted">Şu an teklif yok.</p>') +
    '<div class="row gap mt"><button class="btn danger" data-act="resetGame">Yeni kariyere başla</button></div></section></div>';
}

// ---------- Oyuncu / takım / maç detay modalları ----------
function scoutNotes(p) {
  const h = p.h, n = [];
  if (h.pro >= 16) n.push('Son derece profesyonel'); else if (h.pro <= 6) n.push('Profesyonelliği sorgulanır');
  if (h.bmo >= 16) n.push('Büyük maç oyuncusu'); else if (h.bmo <= 5) n.push('Büyük maçlarda kayboluyor');
  if (h.tut >= 16) n.push('İstikrarlı'); else if (h.tut <= 7) n.push('İstikrarsız');
  if (h.sak >= 15) n.push('Sakatlığa yatkın'); else if (h.sak <= 4) n.push('Sağlam yapılı');
  if (h.miz <= 6) n.push('Sinirli, kart görmeye yatkın');
  const g = h.pot - ovr(p);
  if (p.age <= 23 && g >= 15) n.push('Çok parlak bir gelecek vadediyor'); else if (p.age <= 23 && g >= 7) n.push('Gelişime açık');
  return n.length ? n : ['Özel bir not yok'];
}
function playerHtml(p) {
  const t = p.team ? T(p.team) : null;
  const mine = p.team === S.uid;
  const gk = p.pos[0] === 'GK';
  const groups = gk ? [['Kalecilik', GK_ATTRS], ['Zihinsel', ['kar', 'poz', 'tas', 'cal', 'lid']], ['Fiziksel', ['hiz', 'day', 'guc', 'cev']], ['Teknik', ['pas', 'tek', 'kaf']]] : ATTR_GROUPS;
  const attrs = groups.map(([n, ks]) => '<div class="ag"><h4>' + n + '</h4>' + ks.map((k) => '<div class="at"><span>' + ATTR_TR[k] + '</span><b class="' + attrC(p.a[k]) + '">' + p.a[k] + '</b></div>').join('') + '</div>').join('');
  let actions = '';
  if (mine) {
    actions = '<button class="btn" data-act="toggleList" data-id="' + p.id + '">' + (p.listed ? 'Transfer listesinden çıkar' : 'Transfer listesine koy') + '</button>' +
      (canRenew(p) ? '<button class="btn" data-act="renewForm" data-id="' + p.id + '">Sözleşme yenile</button>' : '') +
      '<button class="btn danger" data-act="release" data-id="' + p.id + '">Serbest bırak (' + fmtMoney(releaseCost(p)) + ')</button>';
  } else actions = '<button class="btn primary" data-act="offerForm" data-id="' + p.id + '">' + (p.team ? 'Transfer teklifi yap' : 'Sözleşme teklif et') + '</button>';
  return '<div class="ph"><div class="phl">' + posB(p.pos[0]) + '<div><h2>' + esc(fullName(p)) + '</h2><small>' + p.age + ' yaş · ' + esc(NATS[p.nat].n) + ' · ' + p.pos.map((x) => POS_LONG[x]).join(', ') + '</small></div></div>' +
    (t ? '<div class="phr">' + crest(t) + teamLink(t) + '</div>' : '<span class="tag green">Serbest oyuncu</span>') + '</div>' +
    '<div class="pinfo"><div><span>Güç</span>' + starsH(stars(ovr(p))) + '</div><div><span>Potansiyel</span>' + starsH(stars(p.h.pot)) + '</div><div><span>Değer</span><b>' + fmtMoney(valueOf(p)) + '</b></div><div><span>Maaş</span><b>' + fmtMoney(p.team ? p.wage : wageFor(p)) + '/hf</b></div>' +
    '<div><span>Sözleşme</span><b>' + contractStr(p) + '</b></div><div><span>Kondisyon</span>' + condH(p.cond) + '</div><div><span>Moral</span>' + morH(p.mor) + '</div><div><span>Durum</span><b>' + (statusH(p) || 'Hazır') + '</b></div></div>' +
    '<div class="attrs">' + attrs + '</div>' +
    '<div class="pbot"><div><h4>Scout raporu</h4><ul class="scout">' + scoutNotes(p).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></div>' +
    '<div><h4>Bu sezon</h4><div class="pst"><div><b>' + p.st.app + '</b><small>Maç</small></div><div><b>' + p.st.g + '</b><small>Gol</small></div><div><b>' + p.st.a + '</b><small>Asist</small></div><div><b>' + (p.st.app ? avgRating(p).toFixed(2) : '-') + '</b><small>Ort.</small></div><div><b>' + p.st.motm + '</b><small>MVP</small></div></div>' +
    '<p class="muted">Son maçlar: ' + (p.form.length ? p.form.map((r) => ratH(r)).join(' ') : '-') + '</p><p class="muted">Kariyer: ' + p.car.app + ' maç, ' + p.car.g + ' gol</p></div></div>' +
    '<div class="pact" id="pact">' + actions + '</div>';
}
function openPlayer(id) {
  const p = P(id);
  if (!p) { toast('Oyuncu bulunamadı.', 'bad'); return; }
  openModal(playerHtml(p), 'wide');
}
function offerFormHtml(p, res) {
  const ut = userTeam();
  const n = S.neg && S.neg[p.id] && S.neg[p.id].team === p.team ? S.neg[p.id] : null;
  if (!UI.offer || UI.offer.pid !== p.id) {
    UI.offer = { pid: p.id, fee: p.team ? Math.max(0, Math.min(roundNice(valueOf(p) * 0.8), S.fin.tb)) : 0, sellOn: 0, swap: '', wage: Math.round(wageDemand(p, ut) * 0.85 / 500) * 500, yrs: 3, signOn: 0, app: 0, goal: 0 };
  }
  const d = UI.offer;
  if (res && res.counter != null) d.fee = res.counter;
  if (res && res.wageCounter) d.wage = res.wageCounter;
  const K = (v) => Math.round(v / 100) / 10;
  const num = (id, lbl, v, step) => '<label class="fld"><span>' + lbl + '</span><input type="number" id="' + id + '" min="0" step="' + step + '" value="' + K(v) + '"></label>';
  const swaps = teamPlayers(ut).sort((a, b) => valueOf(b) - valueOf(a));
  const club = p.team ? '<h4>1 · Kulüple pazarlık <small class="muted">' + esc(T(p.team).name) + '</small></h4>' +
    (n && n.agreed ? '<p class="ores ok">✔ Kulüple anlaşıldı: ' + fmtMoney(n.agreed.fee) + (n.agreed.swap && P(n.agreed.swap) ? ' + ' + esc(fullName(P(n.agreed.swap))) : '') + (n.agreed.sellOn ? ' + %' + n.agreed.sellOn + ' satıştan pay' : '') + '</p>' : '') +
    '<div class="ofl">' + num('ofFee', 'Bonservis (bin €)', d.fee, 50) +
    '<label class="fld"><span>Sonraki satıştan pay</span><select id="ofSell">' + [0, 10, 20, 30].map((v) => '<option value="' + v + '" ' + (+d.sellOn === v ? 'selected' : '') + '>' + (v ? '%' + v : 'Yok') + '</option>').join('') + '</select></label>' +
    '<label class="fld"><span>Takas oyuncusu</span><select id="ofSwap"><option value="">Yok</option>' + swaps.map((q) => '<option value="' + q.id + '" ' + (String(d.swap) === String(q.id) ? 'selected' : '') + '>' + esc(q.ln + ' (' + POS_TR[q.pos[0]] + ', ' + fmtMoney(valueOf(q)) + ')') + '</option>').join('') + '</select></label></div>' : '';
  const reluct = refusesMove(p, ut) ? '<p class="tag amber">Oyuncu kulübünüze gelmeye isteksiz: ancak çok yüksek bir maaş paketiyle ikna olabilir.</p>' : '';
  const log = n && n.log.length ? '<div class="neglog">' + n.log.slice(-6).map((x) => '<p>' + esc(x) + '</p>').join('') + '</div>' : '';
  return '<div class="oform"><h3>' + esc(fullName(p)) + ' için teklif</h3>' +
    (windowOpen() ? '' : '<p class="tag amber">Transfer dönemi kapalı; teklif yapamazsınız.</p>') +
    (res && res.msg ? '<p class="ores ' + (res.ok ? 'ok' : 'no') + '">' + esc(res.msg) + '</p>' : '') + reluct + log + club +
    '<h4>' + (p.team ? '2 · ' : '') + 'Oyuncuyla sözleşme</h4><div class="ofl">' + num('ofWage', 'Haftalık maaş (bin €)', d.wage, 0.5) +
    '<label class="fld"><span>Süre</span><select id="ofYrs">' + [1, 2, 3, 4, 5].map((y) => '<option value="' + y + '" ' + (+d.yrs === y ? 'selected' : '') + '>' + y + ' yıl</option>').join('') + '</select></label>' +
    num('ofSign', 'İmza parası (bin €)', d.signOn, 50) + num('ofApp', 'Maç başı prim (bin €)', d.app, 0.5) + num('ofGoal', 'Gol primi (bin €)', d.goal, 0.5) + '</div>' +
    '<p class="hint">Bütçe: ' + fmtMoney(S.fin.tb) + ' · Maaş alanı: ' + fmtMoney(S.fin.wb - userWages()) + '/hf · Tahmini değer: ' + fmtMoney(valueOf(p)) + '. İmza parası ve primler maaş beklentisini düşürür; takas ve satıştan pay bonservisi düşürür.</p>' +
    '<div class="row gap"><button class="btn primary" data-act="sendOffer" data-id="' + p.id + '" ' + (windowOpen() ? '' : 'disabled') + '>Teklifi gönder</button><button class="btn ghost" data-act="player" data-id="' + p.id + '">Geri</button></div></div>';
}
function renewFormHtml(p, res) {
  const dem = res && res.wageCounter ? res.wageCounter : renewDemand(p);
  return '<div class="oform"><h3>' + esc(fullName(p)) + ' sözleşme yenileme</h3>' +
    (res && res.msg ? '<p class="ores ' + (res.ok ? 'ok' : 'no') + '">' + esc(res.msg) + '</p>' : '') +
    '<div class="ofl"><label class="fld"><span>Haftalık maaş (bin €)</span><input type="number" id="ofWage" min="0" step="0.5" value="' + (dem / 1000) + '"></label>' +
    '<label class="fld"><span>Ek süre</span><select id="ofYrs">' + [1, 2, 3, 4].map((y) => '<option value="' + y + '" ' + (y === 2 ? 'selected' : '') + '>' + y + ' yıl</option>').join('') + '</select></label></div>' +
    '<p class="hint">Şu anki maaş: ' + fmtMoney(p.wage) + ' · Maaş alanı: ' + fmtMoney(S.fin.wb - userWages()) + '/hf</p>' +
    '<div class="row gap"><button class="btn primary" data-act="sendRenew" data-id="' + p.id + '">Teklif et</button><button class="btn ghost" data-act="player" data-id="' + p.id + '">Geri</button></div></div>';
}
function teamHtml(t) {
  const tb = table();
  const pos = tb.findIndex((r) => r.id === t.id) + 1;
  const pl = teamPlayers(t).sort((a, b) => POS_ORDER[a.pos[0]] - POS_ORDER[b.pos[0]] || ovr(b) - ovr(a));
  return '<div class="ph"><div class="phl">' + crest(t, 'xl') + '<div><h2>' + esc(t.name) + '</h2><small>' + esc(t.city) + ' · ' + esc(t.st) + ' (' + t.cap.toLocaleString('tr-TR') + ')</small></div></div></div>' +
    '<div class="pinfo"><div><span>İtibar</span>' + starsH(clamp(Math.round((t.rep - 40) / 5) / 2, 0.5, 5)) + '</div><div><span>Lig sırası</span><b>' + (pos || '-') + '.</b></div><div><span>Diziliş</span><b>' + t.tac.f + '</b></div><div><span>Kadro</span><b>' + pl.length + ' oyuncu</b></div></div>' +
    '<div class="tw"><table class="tbl"><thead><tr><th>Mvk</th><th>Oyuncu</th><th>Yaş</th><th>Güç</th><th>Değer</th><th></th></tr></thead><tbody>' +
    pl.map((p) => '<tr data-act="player" data-id="' + p.id + '"><td>' + posB(p.pos[0]) + '</td><td class="nm"><b>' + esc(fullName(p)) + '</b></td><td>' + p.age + '</td><td>' + starsH(stars(ovr(p))) + '</td><td>' + fmtMoney(valueOf(p)) + '</td><td>' + statusH(p) + '</td></tr>').join('') +
    '</tbody></table></div>';
}
function fxInfoHtml(f) {
  const h = T(f.h), a = T(f.a);
  const goals = (f.goals || []).map(([side, pid, min, pen]) => { const p = P(pid); return '<div class="li ' + (side === 0 ? '' : 'away') + '"><small>' + min + '\'</small>' + (p ? pLink(p) : '<span class="muted">?</span>') + (pen ? ' (p)' : '') + ' <span class="muted">' + esc(side === 0 ? (h ? h.short : '') : (a ? a.short : '')) + '</span></div>'; }).join('');
  const motm = f.motm ? P(f.motm) : null;
  return '<div class="nmv">' + crest(h, 'xl') + '<div class="nmt"><b>' + esc(h ? h.name : '?') + '</b></div><span class="fsc">' + f.hg + ' - ' + f.ag + '</span><div class="nmt"><b>' + esc(a ? a.name : '?') + '</b></div>' + crest(a, 'xl') + '</div>' +
    (f.pen ? '<p class="center">Penaltılar: ' + f.pen[0] + '-' + f.pen[1] + '</p>' : '') +
    '<h4>Goller</h4>' + (goals || '<p class="muted">Gol yok.</p>') + (motm ? '<p class="motm">Maçın oyuncusu: ' + pLink(motm) + '</p>' : '');
}

// ---------- Akış ----------
function onContinue(mode) {
  SFX.unlock();
  if (UI.scr === 'prematch') { startMatch(); return; }
  if (S.phase === 'seasonEnd') { go('season'); return; }
  if (S.phase === 'fired') { go('fired'); return; }
  const r = advance(mode || 'day');
  persist();
  if (r.type === 'day') {
    if (['result', 'season', 'fired'].includes(UI.scr)) UI.scr = 'home';
    render();
    if (UI.scr !== 'home') toast(fmtDate(S.date, true) + (S.today && S.today.length ? ' · ' + S.today[S.today.length - 1] : ''));
    return;
  }
  if (r.type === 'inbox') { const m = S.inbox.find((x) => !x.read) || S.inbox[0]; UI.inboxSel = m ? m.id : null; if (m) m.read = true; go('inbox'); }
  else if (r.type === 'prematch') go('prematch');
  else if (r.type === 'seasonEnd') go('season');
  else if (r.type === 'fired') go('fired');
  else go('home');
}

const ACT = {
  nav: (d) => go(d.s),
  continue: () => onContinue('day'),
  toMatch: () => onContinue('match'),
  tacK: (d) => { const t = userTeam(); normTac(t)[d.k] = +d.v; persist(); render(); },
  mTacK: (d) => { const mc = UI.mc; if (!mc) return; if (d.k === 'm') mc.m.setMentality(mc.side, +d.v); else mc.m.setTac(mc.side, d.k, +d.v); refreshMatchTac(); },
  cbid: (d) => { const el = $('#cb' + d.id); const r = counterBid(+d.id, (+(el && el.value) || 0) * 1000); toast(r.msg, r.ok ? 'good' : ''); persist(); render(); },
  sound: () => { SFX.setOn(!SFX.on); if (SFX.on && UI.mc && !UI.mc.over) SFX.crowdStart(); renderMatchCtl(); if (!UI.mc) render(); },
  closeModal: () => { if (UI.mc && !UI.mc.over && UI.mc.paused && $('#modal .mbox') && $('#mctl')) { closeModal(); resumeMatch(); return; } closeModal(); },
  newScreen: () => { UI.scr = 'new'; UI.ng = { name: '', club: null }; render(); },
  toTitle: () => { UI.scr = 'title'; closeModal(); render(); },
  pickClub: (d) => { UI.ng.club = +d.i; UI.ng.name = ($('#mgrName') || {}).value || UI.ng.name; render(); const b = $('.nfoot .btn'); if (b && window.innerWidth < 760) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  startGame: () => {
    const name = (($('#mgrName') || {}).value || '').trim() || 'Menajer';
    if (UI.ng.club == null) return;
    newGame(name, UI.ng.club);
    persist();
    UI.inboxSel = S.inbox[0].id; S.inbox[0].read = true;
    go('inbox');
  },
  loadGame: () => { if (loadGame()) go('home'); else toast('Kayıt okunamadı.', 'bad'); },
  importFile: () => { const i = $('#importInp'); if (i) { i.value = ''; i.click(); } },
  exportSave: () => {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saha-kenari-' + userTeam().short + '-' + S.date + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  resetGame: () => {
    openModal('<h2>Emin misiniz?</h2><p>Mevcut kariyeriniz silinecek ve yeni bir kariyere başlayacaksınız.</p><div class="row gap"><button class="btn danger" data-act="resetYes">Evet, sil</button><button class="btn" data-act="closeModal">Vazgeç</button></div>');
  },
  resetYes: () => { deleteSave(); S = null; closeModal(); UI.scr = 'new'; UI.ng = { name: '', club: null }; render(); },
  openMsg: (d) => { const m = S.inbox.find((x) => x.id === +d.id); if (m) m.read = true; UI.inboxSel = +d.id; persist(); go('inbox'); },
  msgBack: () => { UI.inboxSel = null; render(); },
  bid: (d) => { const r = resolveBid(+d.id, d.v === '1'); toast(r.msg, r.ok ? 'good' : 'bad'); persist(); render(); },
  compl: (d) => { const s = resolveComplaint(+d.id, d.v); if (s) toast(s); persist(); render(); },
  player: (d) => openPlayer(+d.id),
  team: (d) => { const t = T(d.id); if (t) openModal(teamHtml(t), 'wide'); },
  sqSort: (d) => { if (UI.sq.k === d.k) UI.sq.d *= -1; else { UI.sq.k = d.k; UI.sq.d = ['name', 'pos', 'nat'].includes(d.k) ? 1 : -1; } render(); },
  tsel: (d) => tacSelect(d.kind, d.key),
  ment: (d) => { userTeam().tac.m = +d.v; persist(); render(); },
  press: (d) => { userTeam().tac.pr = +d.v; persist(); render(); },
  bestXI: () => { const t = userTeam(); const pk = autoPick(t, t.tac.f); t.lineup = pk.xi; t.bench = pk.bench; persist(); toast('Asistan en iyi 11\'i seçti.'); render(); },
  lgTab: (d) => { UI.lg = d.v; render(); },
  lgRound: (d) => { UI.lgRound = +d.v; render(); },
  fxinfo: (d) => { const f = fxFromKey(d.k); if (f && f.hg != null) openModal(fxInfoHtml(f)); },
  trTab: (d) => { UI.trf.tab = d.v; render(); },
  trSort: (d) => { if (UI.trf.sort === d.k) UI.trf.d *= -1; else { UI.trf.sort = d.k; UI.trf.d = ['name', 'club', 'pos'].includes(d.k) ? 1 : -1; } renderTransferResults(); },
  train: (d) => { S.train = d.v; persist(); render(); toast('Antrenman odağı: ' + TRAIN[d.v]); },
  pressAns: (d) => { answerPress(+d.v); persist(); render(); },
  startMatch: () => startMatch(),
  mPause: () => { const mc = UI.mc; if (!mc) return; if (mc.paused) resumeMatch(); else { mc.paused = true; clearTimeout(mc.timer); renderMatchCtl(); } },
  mSpeed: (d) => { UI.speed = +d.v; try { localStorage.setItem('sahaKenari.speed', d.v); } catch (e) { /* yok */ } renderMatchCtl(); if (UI.mc && !UI.mc.paused) scheduleTick(); },
  mTac: () => openMatchTac(),
  mTacClose: () => { closeModal(); resumeMatch(); },
  mSkip: () => skipMatch(),
  mMent: (d) => { UI.mc.m.setMentality(UI.mc.side, +d.v); refreshMatchTac(); },
  mPress: (d) => { UI.mc.m.setPress(UI.mc.side, +d.v); refreshMatchTac(); },
  mSubOut: (d) => { UI.mc.subSel.out = +d.id; if (UI.mc.subSel.in) trySub(); else refreshMatchTac(); },
  mSubIn: (d) => { UI.mc.subSel.in = +d.id; if (UI.mc.subSel.out) trySub(); else refreshMatchTac(); },
  matchReport: () => { closeModal(); SFX.crowdStop(true); UI.mc = null; go('result'); },
  toggleList: (d) => { toggleList(+d.id); persist(); render(); openPlayer(+d.id); },
  renewForm: (d) => { const p = P(+d.id); if (p) openModal(renewFormHtml(p), 'wide'); },
  sendRenew: (d) => {
    const p = P(+d.id);
    const r = renewContract(p.id, (+$('#ofWage').value || 0) * 1000, +$('#ofYrs').value);
    persist();
    if (r.ok) { toast(r.msg, 'good'); render(); openPlayer(p.id); }
    else openModal(renewFormHtml(p, r), 'wide');
  },
  release: (d) => {
    const p = P(+d.id);
    openModal('<h2>' + esc(fullName(p)) + ' serbest bırakılsın mı?</h2><p>Sözleşme feshi için ' + fmtMoney(releaseCost(p)) + ' tazminat ödenecek. Bu işlem geri alınamaz.</p><div class="row gap"><button class="btn danger" data-act="releaseYes" data-id="' + p.id + '">Serbest bırak</button><button class="btn" data-act="player" data-id="' + p.id + '">Vazgeç</button></div>');
  },
  releaseYes: (d) => { const r = releasePlayer(+d.id); toast(r.msg, r.ok ? 'good' : 'bad'); persist(); closeModal(); render(); },
  offerForm: (d) => { const p = P(+d.id); openModal(offerFormHtml(p), 'wide'); },
  sendOffer: (d) => {
    const p = P(+d.id);
    const v = (id) => ($(id) ? (+$(id).value || 0) : 0);
    const o = UI.offer && UI.offer.pid === p.id ? UI.offer : (UI.offer = { pid: p.id });
    Object.assign(o, { fee: v('#ofFee') * 1000, sellOn: v('#ofSell'), swap: $('#ofSwap') ? $('#ofSwap').value : '', wage: v('#ofWage') * 1000, yrs: v('#ofYrs') || 3, signOn: v('#ofSign') * 1000, app: v('#ofApp') * 1000, goal: v('#ofGoal') * 1000 });
    const r = makeOffer(p.id, o);
    persist();
    if (r.ok) { UI.offer = null; toast(r.msg, 'good'); closeModal(); render(); }
    else openModal(offerFormHtml(p, r), 'wide');
  },
  nextSeason: () => { newSeason(); persist(); UI.inboxSel = S.inbox[0] ? S.inbox[0].id : null; if (S.inbox[0]) S.inbox[0].read = true; go('inbox'); },
  acceptOffer: (d) => { takeJob(d.id); newSeason(); persist(); UI.inboxSel = S.inbox[0] ? S.inbox[0].id : null; go('inbox'); },
  takeFiredJob: (d) => { continueAfterFired(d.id); persist(); UI.inboxSel = S.inbox[0] ? S.inbox[0].id : null; go('inbox'); },
};
function resumeMatch() {
  const mc = UI.mc;
  if (!mc || mc.over) return;
  mc.paused = false;
  renderMatchCtl();
  scheduleTick(250);
}

const CHG = {
  form: (el) => {
    const t = userTeam();
    const f = el.value;
    if (!FORM[f]) return;
    t.tac.f = f;
    if (S.autoXI) { const pk = autoPick(t, f); t.lineup = pk.xi; t.bench = pk.bench; }
    else {
      const pl = t.lineup.filter((id) => id != null).map(P).filter(Boolean);
      t.lineup = reslot(pl, f).map((p) => (p ? p.id : null));
    }
    persist(); render();
  },
  autoxi: (el) => { S.autoXI = el.checked; if (S.autoXI) ACT.bestXI(); else persist(); },
  trg: (el) => { UI.trf.g = el.value; renderTransferResults(); },
  trage: (el) => { UI.trf.age = el.value; renderTransferResults(); },
  trmaxv: (el) => { UI.trf.maxv = el.value; renderTransferResults(); },
  trfa: (el) => { UI.trf.fa = el.checked; renderTransferResults(); },
  trlisted: (el) => { UI.trf.listed = el.checked; renderTransferResults(); },
  mForm: (el) => { UI.mc.m.setFormation(UI.mc.side, el.value); refreshMatchTac(); },
};
const INP = {
  trq: (el) => { UI.trf.q = el.value; clearTimeout(INP._t); INP._t = setTimeout(renderTransferResults, 150); },
  mgr: (el) => { UI.ng.name = el.value; },
};

function boot() {
  try { const sp = localStorage.getItem('sahaKenari.speed'); if (sp != null) UI.speed = clamp(+sp, 0, 2); } catch (e) { /* yok */ }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href')) return;
    e.preventDefault();
    try { fn(el.dataset, el, e); } catch (err) { console.error(err); toast('Bir hata oluştu: ' + err.message, 'bad'); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-chg]');
    if (el && CHG[el.dataset.chg]) { try { CHG[el.dataset.chg](el, e); } catch (err) { console.error(err); toast('Bir hata oluştu: ' + err.message, 'bad'); } }
    if (e.target.id === 'importInp' && e.target.files[0]) {
      const r = new FileReader();
      r.onload = () => { if (importSave(String(r.result))) { UI.mc = null; toast('Kayıt yüklendi.', 'good'); go('home'); } else toast('Geçersiz kayıt dosyası.', 'bad'); };
      r.readAsText(e.target.files[0]);
    }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-inp]');
    if (el && INP[el.dataset.inp]) INP[el.dataset.inp](el, e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modal').classList.contains('on')) ACT.closeModal();
  });
  window.addEventListener('error', (e) => { console.error(e.error || e.message); });
  UI.scr = 'title';
  render();
}
document.addEventListener('DOMContentLoaded', boot);
