'use strict';
// Oyun durumu, takvim, gün akışı, transferler, yönetim, sezon geçişi, kayıt.

let S = null;
const SAVE_KEY = 'sahaKenari.save.v1';
const STAGES = ['Son 16 Turu', 'Çeyrek Final', 'Yarı Final', 'Final'];
const TRAIN = { gen: 'Genel', att: 'Hücum', def: 'Savunma', fit: 'Kondisyon', rest: 'Dinlenme' };
const TRAIN_DESC = {
  gen: 'Dengeli gelişim. Özel bir etkisi yok.',
  att: 'Hücum özellikleri daha hızlı gelişir, maçlarda hücum hattı biraz daha etkili.',
  def: 'Savunma özellikleri daha hızlı gelişir, maçlarda savunma biraz daha sağlam.',
  fit: 'Fiziksel özellikler gelişir, maçlarda daha az yorulursunuz ama toparlanma yavaşlar.',
  rest: 'Kondisyon çok hızlı toparlanır, gelişim yarı hıza düşer.',
};
const TRAIN_ATTR = { att: ['bit', 'tas', 'dri', 'uza', 'tek', 'ort'], def: ['mar', 'tkl', 'poz', 'kaf'], fit: ['day', 'hiz', 'guc', 'cev'] };

function T(id) { return S.teams[id]; }
function P(id) { return S.players[id]; }
function userTeam() { return S.teams[S.uid]; }
function leagueTeams() { return S.league.map(T); }

// ---------- Yeni oyun ----------
function newGame(mgr, clubIdx) {
  S = {
    v: 1, mgr: mgr || 'Menajer', season: 2026, nid: 1, tid: 1, mid: 1,
    players: {}, teams: {}, league: [], fa: [], inbox: [], news: [], hist: [],
    uid: null, date: '2026-07-01', evi: 0, cal: [], fx: [], cup: null,
    board: null, fin: null, train: 'gen', autoXI: true, promoUsed: 0,
    phase: 'play', press: null, seasonEnd: null, offers: null, firedWhy: '',
    rec: { titles: 0, cups: 0, seasons: 0, clubs: [] },
  };
  for (const c of CLUBS) S.league.push(makeTeam(c, c.rep).id);
  addWonderkid();
  for (let i = 0; i < 45; i++) makeFreeAgent(ri(42, 66), ri(22, 33));
  S.uid = S.league[clamp(clubIdx, 0, S.league.length - 1)];
  S.fin = newFin(userTeam());
  setupSeason();
  S.rec.clubs.push(userTeam().name);
  const ut = userTeam();
  msg('Hoş geldiniz, ' + S.mgr + '!',
    ut.name + ' yönetim kurulu olarak sizi aramızda görmekten mutluluk duyuyoruz.\n\n' +
    'Bu sezonki hedefimiz: ' + S.board.label + '.\n' +
    'Transfer bütçeniz: ' + fmtMoney(S.fin.tb) + '. Haftalık maaş bütçeniz: ' + fmtMoney(S.fin.wb) + '.\n\n' +
    'Yaz transfer dönemi 31 Ağustos\'a kadar açık. Kadronuzu inceleyin, taktiğinizi belirleyin ve hazır olduğunuzda sağ üstteki DEVAM düğmesine basın.\n\nBol şans!');
}

// Ali Cerven: 16 yaşında, Türk, dünya yıldızı potansiyelli wonderkid.
// Oyuna tam potansiyelinde başlamaz ama ilk günden etkilidir ve çok hızlı gelişir.
function addWonderkid() {
  const t = leagueTeams().find((x) => x.name === 'Deportivo de la Mancha');
  if (!t) return;
  const p = makePlayer(60, 'AMR', 16, 'TUR', t.id);
  p.fn = 'Ali'; p.ln = 'Cerven';
  p.pos = ['AMR', 'ST', 'AMC'];
  Object.assign(p.a, {
    bit: 14, uza: 12, pas: 13, ort: 10, dri: 16, tek: 15, kaf: 6, mar: 4, tkl: 5,
    kar: 11, poz: 8, tas: 13, cal: 13, lid: 6, hiz: 15, day: 11, guc: 6, cev: 16,
    ref: 2, ele: 1, bir: 2, hav: 1,
  });
  p.h = { pot: 98, tut: 15, bmo: 18, sak: 6, pro: 18, miz: 14 };
  p.mor = 4; p.wk = true;
  p.ce = S.season + 2; p.wage = 1500;
  t.players.push(p.id);
  aiSetTactics(t);
}

function newFin(t) {
  const tb = t.tb;
  const wages = teamPlayers(t).reduce((s, p) => s + p.wage, 0);
  return { bal: Math.round(tb * 1.6 + 2e6), tb, wb: Math.round(wages * 1.12 / 1000) * 1000, h: newFinHist() };
}
function newFinHist() { return { gate: 0, tv: 0, sales: 0, buys: 0, wages: 0, prize: 0 }; }

function roundRobin(ids) {
  const n = ids.length, arr = ids.slice(), rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const ms = [];
    for (let i = 0; i < n / 2; i++) {
      let h = arr[i], a = arr[n - 1 - i];
      if (i === 0 ? r % 2 === 1 : (r + i) % 2 === 1) [h, a] = [a, h];
      ms.push({ h, a, hg: null, ag: null });
    }
    rounds.push(ms);
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}
function cupPairs(ids) {
  const out = [];
  for (let i = 0; i + 1 < ids.length; i += 2) out.push({ h: ids[i], a: ids[i + 1], hg: null, ag: null, pen: null, w: null });
  return out;
}
function buildCalendar(Y) {
  const cal = [];
  let d = Y + '-08-14';
  const cupAfter = { 5: 0, 10: 1, 19: 2, 27: 3 };
  for (let r = 0; r < 30; r++) {
    cal.push({ d, k: 'L', r });
    if (cupAfter[r] != null) cal.push({ d: addDays(d, 4), k: 'C', s: cupAfter[r] });
    if (r === 16) d = (Y + 1) + '-01-22';
    else d = addDays(d, r === 3 || r === 7 || r === 11 || r === 23 ? 14 : 7);
  }
  cal.push({ d: (Y + 1) + '-01-02', k: 'W' });
  cal.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return cal;
}

function setupSeason() {
  const ids = shuffle(S.league.slice());
  const rr = roundRobin(ids);
  S.fx = rr.concat(rr.map((rd) => rd.map((f) => ({ h: f.a, a: f.h, hg: null, ag: null }))));
  S.cup = { rounds: [cupPairs(shuffle(S.league.slice()))], winner: null };
  S.cal = buildCalendar(S.season);
  S.evi = 0;
  S.date = S.season + '-07-01';
  S.phase = 'play';
  S.press = null; S.seasonEnd = null; S.offers = null;
  for (const id in S.players) {
    const p = S.players[id];
    p.st = newStats(); p.yc = 0; p.sus = 0; p.bench = 0; p.promise = 0; p.bidOpen = false; p.form = [];
    p.cond = 100;
  }
  for (const t of leagueTeams()) {
    if (t.id !== S.uid) aiSetTactics(t);
    else if (!t.lineup.length || S.autoXI) { const pk = autoPick(t, t.tac.f); t.lineup = pk.xi; t.bench = pk.bench; }
  }
  S.board = newBoard();
}

function newBoard() {
  const ranked = leagueTeams().sort((a, b) => b.rep - a.rep);
  const rk = ranked.findIndex((t) => t.id === S.uid) + 1;
  let target, label;
  if (rk === 1) { target = 1; label = 'Şampiyonluk'; }
  else if (rk <= 3) { target = 3; label = 'İlk 3\'te bitirmek'; }
  else if (rk <= 6) { target = 6; label = 'İlk 6\'da bitirmek'; }
  else if (rk <= 10) { target = 10; label = 'İlk 10\'da bitirmek'; }
  else { target = 13; label = 'Ligde kalmak (13. veya daha iyi)'; }
  return { target, label, conf: 62, warned: false };
}

// ---------- Mesajlar ve haberler ----------
function msg(t, b, o) {
  o = o || {};
  S.inbox.unshift({ id: S.mid++, d: S.date, t, b, read: false, act: o.act || null, done: false, res: '' });
  today('📩 ' + t);
  if (S.inbox.length > 90) {
    // eski ve cevap beklemeyen mesajları at
    S.inbox = S.inbox.filter((m, i) => i < 70 || (m.act && !m.done));
  }
  if (o.stop) S._stop = true;
}
function news(t) {
  S.news.unshift({ d: S.date, t });
  today(t);
  if (S.news.length > 60) S.news.length = 60;
}
function unread() { return S.inbox.filter((m) => !m.read).length; }

// ---------- Fikstür yardımcıları ----------
function matchesOf(ev) {
  if (!ev) return [];
  if (ev.k === 'L') return S.fx[ev.r] || [];
  if (ev.k === 'C') return S.cup.rounds[ev.s] || [];
  return [];
}
function isUserFx(f) { return f.h === S.uid || f.a === S.uid; }
function nextUserEvent() {
  for (let i = S.evi; i < S.cal.length; i++) {
    const ev = S.cal[i];
    const f = matchesOf(ev).find(isUserFx);
    if (f) return { ev, f, i };
    if (ev.k === 'C' && !S.cup.rounds[ev.s]) {
      // kupa turu henüz kurulmadı; kullanıcı hâlâ kupadaysa bu turda oynar
      if (userInCup()) return { ev, f: null, i };
    }
  }
  return null;
}
function userInCup() {
  const rs = S.cup.rounds;
  const last = rs[rs.length - 1];
  if (S.cup.winner) return false;
  const inLast = last.some(isUserFx);
  if (!inLast) return false;
  const f = last.find(isUserFx);
  return f.w == null || f.w === S.uid;
}
function compName(ev) { return ev.k === 'L' ? 'Lig ' + (ev.r + 1) + '. hafta' : ev.k === 'C' ? 'Kupa - ' + STAGES[ev.s] : 'Transfer dönemi'; }

// ---------- Gün akışı ----------
function windowOpen() { const m = monthOf(S.date); return m === 6 || m === 7 || m === 0; }

// Bugüne kadar gelmiş takvim olaylarını işler. Kullanıcı maçı varsa durur.
function processDue() {
  for (let guard = 0; guard < 50; guard++) {
    const ev = S.cal[S.evi];
    if (!ev) { endSeason(); return { type: S.phase }; }
    if (ev.d > S.date) return null;
    if (ev.k === 'W') { S.evi++; winterWindowMsg(); return { type: 'inbox' }; }
    const fxs = matchesOf(ev);
    if (fxs.some(isUserFx)) { preparePress(); return { type: 'prematch' }; }
    finishEvent(ev, fxs.map((f) => ({ f, m: playFixture(f, ev) })));
    if (S.phase === 'fired') return { type: 'fired' };
  }
  return null;
}
function nextDay() {
  S.date = addDays(S.date, 1);
  S.today = [];
  S._stop = false;
  dailyTick();
  const st = S._stop;
  S._stop = false;
  return st;
}
// mode 'day': bir gün ilerle. mode 'match': sıradaki maça (veya önemli bir mesaja) kadar ilerle.
function advance(mode) {
  if (S.phase === 'seasonEnd') return { type: 'seasonEnd' };
  if (S.phase === 'fired') return { type: 'fired' };
  let r = processDue();
  if (r) return r;
  if (mode === 'day') {
    const stop = nextDay();
    r = processDue();
    if (r) return r;
    return { type: stop ? 'inbox' : 'day' };
  }
  for (let guard = 0; guard < 400; guard++) {
    if (nextDay()) return { type: 'inbox' };
    r = processDue();
    if (r) return r;
  }
  return { type: 'home' };
}
function today(t) { if (!S.today) S.today = []; S.today.push(t); }

function dailyTick() {
  const d = S.date;
  const restBonus = S.train === 'rest' ? 4 : S.train === 'fit' ? -1.5 : 0;
  for (const tid of S.league) {
    const t = T(tid);
    const mine = tid === S.uid;
    for (const id of t.players) {
      const p = S.players[id];
      if (!p) continue;
      if (p.inj > 0) {
        p.inj--;
        if (p.inj === 0) { p.injN = ''; if (mine) msg(fullName(p) + ' sakatlığını atlattı', fullName(p) + ' tedavisini tamamladı ve takımla çalışmalara başladı.'); }
      }
      p.cond = Math.min(100, p.cond + 6 + p.a.day / 4 + (mine ? restBonus : 0));
      if (mine && p.inj === 0 && R() < (S.train === 'fit' ? 0.0009 : 0.0005)) {
        const inj = wpick(INJURIES.slice(0, 4), (x) => x.w);
        p.inj = ri(inj.d[0], inj.d[1]); p.injN = inj.n;
        msg('Antrenmanda sakatlık: ' + fullName(p), fullName(p) + ' antrenmanda sakatlandı. Teşhis: ' + inj.n + '. Tahmini dönüş: ' + p.inj + ' gün.');
      }
    }
  }
  // Günlük antrenman raporu
  const ut = userTeam();
  const ev = S.cal[S.evi];
  const matchDay = ev && ev.d === d && matchesOf(ev).some(isUserFx);
  if (matchDay) today('Maç günü! Rakip analizi ve son hazırlıklar tamamlandı.');
  else {
    const pl = teamPlayers(ut).filter(eligible);
    if (pl.length && R() < 0.6) {
      const p = wpick(pl, (q) => q.h.pro + q.mor * 2 + (formAvg(q) || 6.5));
      p.mor = clamp(p.mor + 0.05, 1, 5);
      today('Antrenman: ' + fullName(p) + ' ' + pick(['göz doldurdu.', 'çok istekliydi.', 'teknik ekibin övgüsünü aldı.', 'şut çalışmasında harikalar yarattı.', 'antrenman sonrası ekstra mesai yaptı.', 'taktik çalışmasında öne çıktı.']));
    } else today('Takım ' + TRAIN[S.train].toLocaleLowerCase('tr') + ' ağırlıklı antrenman yaptı.');
  }
  if (dayOfWeek(d) === 1) weeklyTick();
  if (dayOfMonth(d) === 1) monthlyTick();
  const m = monthOf(d), dm = dayOfMonth(d);
  if ((m === 8 || m === 1) && dm === 1) closeWindow();
  if (windowOpen()) {
    if (R() < 0.13) aiTransfer();
    genBids();
  }
}

function weeklyTick() {
  let bestP = null, bestG = 0;
  for (const tid of S.league) {
    const t = T(tid);
    const focus = tid === S.uid ? S.train : 'gen';
    for (const id of t.players) {
      const p = S.players[id];
      if (!p) continue;
      const g = developWeek(p, focus);
      if (tid === S.uid && g > bestG) { bestG = g; bestP = p; }
      p.mor += (3 - p.mor) * 0.06;
    }
  }
  if (bestP) today('Haftalık rapor: en çok gelişen oyuncu ' + fullName(bestP) + ' (+' + bestG + ' özellik puanı).');
  const w = userWages();
  S.fin.bal -= w; S.fin.h.wages += w;
  complaintsCheck();
  if (S.fin.bal < -5e6 && R() < 0.25) msg('Yönetim: mali durum', 'Kulübün kasası ciddi şekilde ekside (' + fmtMoney(S.fin.bal) + '). Yönetim harcamaların kısılmasını bekliyor.');
}
function monthlyTick() {
  const inc = Math.round(25000 * Math.exp(0.045 * userTeam().rep));
  S.fin.bal += inc; S.fin.h.tv += inc;
}
function userWages() { return teamPlayers(userTeam()).reduce((s, p) => s + p.wage, 0); }

function developWeek(p, focus) {
  const r = ovr(p);
  const gap = p.h.pot - r;
  if (gap > 0 && p.age <= 28) {
    const ageK = p.age <= 19 ? 1.3 : p.age <= 21 ? 1.1 : p.age <= 23 ? 0.85 : p.age <= 25 ? 0.55 : 0.3;
    p.prog += gap * 0.016 * ageK * (0.65 + p.h.pro / 30) * (focus === 'rest' ? 0.5 : 1) * (p.bench < 3 ? 1.15 : 0.85) * (p.wk ? 0.45 : 1);
  }
  let n = 0;
  while (p.prog >= 1 && n < 5) { p.prog -= 1; bumpAttr(p, focus); n++; }
  return n;
}
function bumpAttr(p, focus) {
  const key = RW[p.pos[0]];
  const pool = Object.keys(key).map((k) => [k, key[k]]);
  if (TRAIN_ATTR[focus]) for (const k of TRAIN_ATTR[focus]) if (p.pos[0] !== 'GK' || !['bit', 'tas', 'dri', 'uza', 'ort'].includes(k)) pool.push([k, 4]);
  for (const k of UNIVERSAL) pool.push([k, 0.6]);
  for (let i = 0; i < 4; i++) {
    const [k] = wpick(pool, (x) => x[1]);
    if (p.a[k] < 20) { p.a[k]++; return; }
  }
}

// ---------- Basın toplantısı ----------
function preparePress() {
  if (S.press && S.press.evi === S.evi) return;
  S.press = R() < 0.5 ? { evi: S.evi, q: ri(0, PRESS.length - 1), ans: null } : { evi: S.evi, q: -1, ans: null };
}
function answerPress(i) {
  if (!S.press || S.press.q < 0 || S.press.ans != null) return;
  const a = PRESS[S.press.q].a[i];
  if (!a) return;
  S.press.ans = i;
  for (const p of teamPlayers(userTeam())) p.mor = clamp(p.mor + a.mor, 1, 5);
}

// ---------- Maç oynatma ----------
function prepareAI(t, opp, home) {
  if (t.id === S.uid) return;
  const pk = autoPick(t, t.tac.f);
  t.lineup = pk.xi; t.bench = pk.bench;
  const diff = teamStrength(t) - teamStrength(opp) + (home ? 2 : -2);
  aiTactics(t, diff);
}
// YZ maç taktiği: kadro profiline ve rakibe göre
function aiTactics(t, diff) {
  const tc = normTac(t);
  const xi = t.lineup.map((id) => (id != null ? S.players[id] : null)).filter(Boolean);
  const avg = (f, filt) => { const l = xi.filter(filt); return l.length ? l.reduce((x, p) => x + f(p), 0) / l.length : 10; };
  const tech = avg((p) => (p.a.pas + p.a.tek + p.a.kar) / 3, (p) => p.pos[0] !== 'GK');
  const spd = avg((p) => p.a.hiz, (p) => POS_GROUP[p.pos[0]] === 'A');
  const air = avg((p) => p.a.kaf, (p) => p.pos[0] === 'ST');
  const crs = avg((p) => p.a.ort, (p) => ['DR', 'DL', 'MR', 'ML', 'AMR', 'AML'].includes(p.pos[0]));
  tc.m = diff < -5 ? 0 : diff > 5 ? 2 : 1;
  tc.st = diff < -4 && spd >= 12 ? 3 : tech >= 12.5 ? 0 : air >= 13 ? 2 : 1;
  tc.ln = diff < -5 ? 0 : diff > 6 ? 2 : 1;
  tc.wd = crs >= 13 ? 2 : crs <= 9 ? 0 : 1;
  tc.tm = diff > 6 ? 2 : diff < -6 ? 0 : 1;
  tc.pr = diff > 3 && R() < 0.6 ? 2 : R() < 0.15 ? 0 : 1;
}
function playFixture(f, ev) {
  const h = T(f.h), a = T(f.a);
  prepareAI(h, a, true); prepareAI(a, h, false);
  return new Match(h, a, { cup: ev.k === 'C' }).run();
}

function makeUserMatch() {
  const ev = S.cal[S.evi];
  const fxs = matchesOf(ev);
  const uf = fxs.find(isUserFx);
  if (!uf) return null;
  const ut = userTeam();
  if (S.autoXI) { const pk = autoPick(ut, ut.tac.f); ut.lineup = pk.xi; ut.bench = pk.bench; }
  const notes = validateLineup(ut);
  const side = uf.h === S.uid ? 0 : 1;
  const opp = T(side === 0 ? uf.a : uf.h);
  prepareAI(opp, ut, side === 1);
  const boost = [{}, {}];
  boost[side] = { att: S.train === 'att', def: S.train === 'def', fit: S.train === 'fit' };
  const big = opp.rep >= 80 || (ev.k === 'C' && ev.s >= 2);
  const m = new Match(T(uf.h), T(uf.a), { cup: ev.k === 'C', user: side, boost, big });
  const others = fxs.filter((f) => f !== uf).map((f) => ({ f, m: playFixture(f, ev) }));
  return { ev, uf, m, side, others, notes };
}

function finishEvent(ev, list) {
  for (const { f, m } of list) applyMatch(f, m, ev);
  if (ev.k === 'C') cupProgress(ev.s);
  S.evi++;
  if (ev.k === 'L') boardRoundCheck(ev.r);
  S.press = null;
}

function applyMatch(f, m, ev) {
  f.hg = m.sc[0]; f.ag = m.sc[1];
  f.goals = m.goals.map((g) => [g.side, g.pid, g.min, g.pen ? 1 : 0]);
  if (ev.k === 'C') { f.pen = m.pens; f.w = m.winner() === 0 ? f.h : f.a; }
  if (m.motm) { const mp = S.players[m.motm.pid]; if (mp) { mp.st.motm++; f.motm = mp.id; } }
  for (const i of [0, 1]) {
    const t = m.t[i], sd = m.sd[i];
    const w = m.winner();
    const res = w === -1 ? 0 : w === i ? 1 : -1;
    const mine = t.id === S.uid;
    // Diziliş uyumu: oynanan dizilişe alışılır, diğerleri unutulur
    const tc = normTac(t);
    for (const fk of FORM_KEYS) {
      const v = t.fam[fk] == null ? 50 : t.fam[fk];
      t.fam[fk] = fk === tc.f ? Math.min(100, v + 12) : Math.max(25, v - 1);
    }
    for (const p of teamPlayers(t)) {
      if (p.sus > 0 && !sd.ps[p.id]) p.sus--;
    }
    for (const p of teamPlayers(t)) {
      const x = sd.ps[p.id];
      if (x) {
        p.st.app++; p.car.app++;
        p.st.g += x.g; p.car.g += x.g; if (ev.k === 'L') p.st.lg += x.g;
        p.st.a += x.a; p.car.a += x.a;
        p.st.rs += x.rat;
        p.form.push(x.rat); if (p.form.length > 5) p.form.shift();
        p.bench = 0;
        if (x.rc) { p.st.rc++; p.sus += x.yc === 2 ? 1 : 2; if (mine) msg(fullName(p) + ' cezalı', fullName(p) + ' gördüğü kırmızı kart nedeniyle ' + p.sus + ' maç forma giyemeyecek.'); }
        else if (x.yc) { p.st.yc++; p.yc++; if (p.yc % 4 === 0) { p.sus += 1; if (mine) msg(fullName(p) + ' kart cezalısı', fullName(p) + ' sarı kart sınırına ulaştı ve bir sonraki maçta oynayamayacak.'); } }
        if (mine && p.bon) {
          const c = p.bon.app + p.bon.goal * x.g;
          S.fin.bal -= c; S.fin.h.wages += c;
        }
        if (x.inj) {
          p.inj = Math.max(p.inj, x.inj.d); p.injN = x.inj.n;
          if (mine) msg('Sakatlık: ' + fullName(p), fullName(p) + ' maçta sakatlandı. Teşhis: ' + x.inj.n + '. Tahmini dönüş: ' + x.inj.d + ' gün.');
        }
        p.mor += res > 0 ? 0.25 : res < 0 ? -0.25 : 0.05;
        if (x.rat >= 7.5) p.mor += 0.25; else if (x.rat <= 5.5) p.mor -= 0.2;
        if (p.promise > 0) { p.promise = 0; p.mor += 0.3; }
      } else {
        p.bench++;
        if (res > 0) p.mor += 0.05;
        if (mine && p.promise > 0 && eligible(p)) {
          p.promise--;
          if (p.promise === 0) {
            p.mor -= 1.5; p.listed = true;
            msg(fullName(p) + ' öfkeli', fullName(p) + ' kendisine verilen forma sözünün tutulmadığını düşünüyor ve transfer listesine konulmayı talep etti. Oyuncu artık listede.');
          }
        }
      }
      p.mor = clamp(p.mor, 1, 5);
    }
    if (mine) {
      // Gişe geliri
      if (i === 0) {
        const fill = clamp(0.35 + t.rep / 180 + (ev.k === 'C' ? 0.1 : 0) + (S.board ? (S.board.conf - 50) / 400 : 0), 0.25, 1);
        const att = Math.round(t.cap * fill);
        const gate = Math.round(att * (8 + t.rep * 0.3));
        f.att = att;
        S.fin.bal += gate; S.fin.h.gate += gate;
      }
      if (S.press && S.press.q >= 0 && S.press.ans != null && PRESS[S.press.q].a[S.press.ans].risk) {
        if (res < 0) { for (const p of teamPlayers(t)) p.mor = clamp(p.mor - 0.3, 1, 5); S.board.conf = clamp(S.board.conf - 2, 0, 100); }
        else if (res > 0) S.board.conf = clamp(S.board.conf + 1, 0, 100);
      }
      if (ev.k === 'L') boardAfterMatch(m, i, res);
      else if (res > 0) S.board.conf = clamp(S.board.conf + (ev.s === 3 ? 10 : 1.5), 0, 100);
    }
  }
}

function cupProgress(s) {
  const rd = S.cup.rounds[s];
  const ws = rd.map((f) => f.w);
  const ut = S.uid;
  const uf = rd.find(isUserFx);
  if (s === STAGES.length - 1) {
    S.cup.winner = ws[0];
    news(T(ws[0]).name + ' kupanın sahibi oldu!');
    if (ws[0] === ut) msg('KUPA ŞAMPİYONU!', 'Tebrikler! ' + userTeam().name + ' kupayı müzesine götürüyor. Yönetim ve taraftarlar sizinle gurur duyuyor.');
  } else {
    S.cup.rounds[s + 1] = cupPairs(ws);
    if (uf) {
      const nf = S.cup.rounds[s + 1].find(isUserFx);
      if (uf.w === ut && nf) msg('Kupada tur atladık', userTeam().name + ' kupada ' + STAGES[s + 1] + ' turuna yükseldi. Rakip: ' + T(nf.h === ut ? nf.a : nf.h).name + '.');
      else msg('Kupaya veda', userTeam().name + ' kupaya ' + STAGES[s] + ' turunda veda etti.');
    }
  }
}

// ---------- Puan durumu & istatistik ----------
function table() {
  const rows = {};
  for (const id of S.league) rows[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
  for (const rd of S.fx) for (const f of rd) {
    if (f.hg == null) continue;
    const h = rows[f.h], a = rows[f.a];
    if (!h || !a) continue;
    h.p++; a.p++; h.gf += f.hg; h.ga += f.ag; a.gf += f.ag; a.ga += f.hg;
    if (f.hg > f.ag) { h.w++; a.l++; h.pts += 3; h.form.push('G'); a.form.push('M'); }
    else if (f.hg < f.ag) { a.w++; h.l++; a.pts += 3; a.form.push('G'); h.form.push('M'); }
    else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('B'); a.form.push('B'); }
  }
  return Object.values(rows).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || T(x.id).name.localeCompare(T(y.id).name, 'tr'));
}
function userPos() { return table().findIndex((r) => r.id === S.uid) + 1; }
function leaguePlayers() { const out = []; for (const tid of S.league) for (const p of teamPlayers(T(tid))) out.push(p); return out; }
function topList(kind, n) {
  const pl = leaguePlayers();
  if (kind === 'g') return pl.filter((p) => p.st.lg > 0).sort((a, b) => b.st.lg - a.st.lg || a.st.app - b.st.app).slice(0, n);
  if (kind === 'a') return pl.filter((p) => p.st.a > 0).sort((a, b) => b.st.a - a.st.a || a.st.app - b.st.app).slice(0, n);
  const minApp = Math.max(3, Math.floor(S.evi / 4));
  return pl.filter((p) => p.st.app >= minApp).sort((a, b) => avgRating(b) - avgRating(a)).slice(0, n);
}

// ---------- Yönetim ----------
function boardAfterMatch(m, side, res) {
  const ut = m.t[side], opp = m.t[1 - side];
  const diff = teamStrength(ut) - teamStrength(opp) + (side === 0 ? 2 : -2);
  const exp = clamp(1.4 + diff * 0.09, 0.3, 2.7);
  const pts = res > 0 ? 3 : res === 0 ? 1 : 0;
  S.board.conf = clamp(S.board.conf + (pts - exp) * 3.2, 0, 100);
}
function boardRoundCheck(r) {
  if (S.phase !== 'play') return;
  const pos = userPos();
  if ((r + 1) % 5 === 0) {
    if (pos > S.board.target + 3) S.board.conf = clamp(S.board.conf - 5, 0, 100);
    else if (pos <= S.board.target) S.board.conf = clamp(S.board.conf + 3, 0, 100);
  }
  if (S.board.conf < 25 && !S.board.warned) {
    S.board.warned = true;
    msg('Yönetimden uyarı', 'Yönetim kurulu son sonuçlardan ciddi rahatsızlık duyuyor. Hedefimiz: ' + S.board.label + '. Durum düzelmezse yollarımızı ayırmak zorunda kalacağız.');
  }
  if (S.board.conf >= 40) S.board.warned = false;
  if (S.board.conf <= 3 && r >= 7) fire('Yönetim kurulu, kötü gidişat nedeniyle sözleşmenizi feshetti.');
}
function fire(why) {
  S.phase = 'fired';
  S.firedWhy = why;
  S.offers = jobOffers(false);
}
function jobOffers(good) {
  const ut = userTeam();
  const pos = {};
  table().forEach((r, i) => (pos[r.id] = i + 1));
  const rel = S.phase === 'seasonEnd' || S.seasonEnd ? new Set(table().slice(-3).map((r) => r.id)) : new Set();
  let c = leagueTeams().filter((t) => t.id !== S.uid && !rel.has(t.id));
  if (good) c = c.filter((t) => t.rep > ut.rep + 2).sort((a, b) => b.rep - a.rep).slice(0, 4);
  else {
    const lower = c.filter((t) => t.rep <= ut.rep - 4);
    c = (lower.length ? lower : c).sort((a, b) => a.rep - b.rep).slice(0, 6);
  }
  shuffle(c);
  return c.slice(0, good ? 2 : 3).map((t) => t.id);
}
function takeJob(tid) {
  if (!S.teams[tid]) return;
  S.uid = tid;
  const t = userTeam();
  S.fin = newFin(t);
  S.board = newBoard();
  S.autoXI = true;
  const pk = autoPick(t, t.tac.f); t.lineup = pk.xi; t.bench = pk.bench;
  for (const p of teamPlayers(t)) { p.listed = false; p.promise = 0; p.bidOpen = false; }
  S.rec.clubs.push(t.name);
  S.offers = null;
  // açık teklifleri geçersiz kıl
  for (const m of S.inbox) if (m.act && !m.done) { m.done = true; m.res = 'Geçersiz (kulüp değişti)'; }
  msg(t.name + ' sizi bekliyor', t.name + ' yönetimi sizi yeni teknik direktörleri olarak duyurdu. Hedef: ' + S.board.label + '. Transfer bütçesi: ' + fmtMoney(S.fin.tb) + '.');
}
function continueAfterFired(tid) {
  const atSeasonEnd = !!S.seasonEnd;
  takeJob(tid);
  if (atSeasonEnd) newSeason();
  else S.phase = 'play';
}

// ---------- Transfer ----------
function isKey(p) {
  const t = T(p.team);
  if (!t) return false;
  const rs = teamPlayers(t).map(ovr).sort((a, b) => b - a);
  return ovr(p) >= rs[Math.min(10, rs.length - 1)];
}
function askingPrice(p) {
  if (!p.team) return 0;
  const t = T(p.team);
  if (t.players.length <= 18) return Infinity;
  let v = valueOf(p) * (isKey(p) ? 1.35 : 1.05);
  if (p.listed) v *= 0.85;
  return roundNice(v);
}
function wageDemand(p, buyer) {
  const from = p.team ? T(p.team).rep : 45;
  let w = wageFor(p) * (1 + clamp((from - buyer.rep) / 80, -0.1, 0.4));
  if (p.team) w = Math.max(w, p.wage * 1.1);
  return Math.max(1000, Math.round(w / 500) * 500);
}
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761); return h >>> 0; }
function pseudo(a, b) { let h = Math.imul(a ^ 0x9e3779b9, 2246822519) ^ Math.imul(b, 3266489917); h ^= h >>> 15; return ((h >>> 0) % 10000) / 10000; }
function refusesMove(p, buyer) {
  if (!p.team) return false;
  const diff = T(p.team).rep - buyer.rep;
  if (diff <= 10) return false;
  return pseudo(p.id, hashStr(buyer.id)) < clamp((diff - 10) / 30, 0, 0.85);
}
function moveP(p, to, wage, yrs) {
  if (p.team) {
    const from = T(p.team);
    if (from) {
      from.players = from.players.filter((id) => id !== p.id);
      from.lineup = from.lineup.map((id) => (id === p.id ? null : id));
      from.bench = from.bench.filter((id) => id !== p.id);
      if (from.id === S.uid) { validateLineup(from); p.bon = null; p.sellOn = null; }
    }
  } else S.fa = S.fa.filter((id) => id !== p.id);
  if (to) {
    p.team = to.id; to.players.push(p.id);
    p.wage = wage; p.ce = S.season + Math.max(1, yrs) - 1;
  } else {
    p.team = null; S.fa.push(p.id); p.ce = 0;
  }
  p.listed = false; p.bidOpen = false; p.bench = 0; p.promise = 0;
  p.mor = Math.max(p.mor, 3.5);
}

function offerPlayer(pid, fee, wage, yrs) { return makeOffer(pid, { fee, wage, yrs }); }

// ---------- Transfer pazarlığı ----------
function clubValuation(p) {
  const left = p.ce - S.season;
  let v = valueOf(p) * (isKey(p) ? 1.35 : 1.05) * (left >= 3 ? 1.1 : 1);
  if (p.listed) v *= 0.85;
  return roundNice(v);
}
function negOf(p) {
  if (!S.neg) S.neg = {};
  let n = S.neg[p.id];
  if (n && (daysBetween(n.d, S.date) > 30 || n.team !== p.team)) n = null;
  if (!n) {
    const min = p.team ? clubValuation(p) : 0;
    n = S.neg[p.id] = { d: S.date, team: p.team, min, ask: roundNice(min * rf(1.12, 1.3)), rounds: 0, mood: 0, until: '', log: [], agreed: null, pr: 0 };
  }
  return n;
}
function swapValue(sp, club) {
  if (!sp || !club) return 0;
  const g = POS_GROUP[sp.pos[0]];
  const need = { G: 1, D: 4, M: 4, A: 2 }[g];
  const rs = teamPlayers(club).filter((q) => POS_GROUP[q.pos[0]] === g).map(ovr).sort((a, b) => b - a);
  const bar = rs.length >= need ? rs[need - 1] : 0;
  let k = ovr(sp) >= bar ? 0.9 : ovr(sp) >= bar - 6 ? 0.6 : 0.3;
  if (sp.age >= 31) k *= 0.6;
  return Math.round(valueOf(sp) * k);
}
function goalsPerMatch(p) { return { A: 0.38, M: 0.12, D: 0.04, G: 0 }[POS_GROUP[p.pos[0]]]; }
function playerDemand(p, yrs) {
  const ut = userTeam();
  let dem = wageDemand(p, ut);
  let note = '';
  const g = POS_GROUP[p.pos[0]];
  const need = { G: 1, D: 4, M: 4, A: 2 }[g];
  const better = teamPlayers(ut).filter((q) => POS_GROUP[q.pos[0]] === g && ovr(q) > ovr(p)).length;
  if (better >= need) { dem *= 1.15; note = ' Kadronuzda forma garantisi olmadığı için daha fazlasını istiyor.'; }
  if (p.age >= 30 && yrs < 2) dem *= 1.1;
  if (refusesMove(p, ut)) { dem *= 1.6; note += ' Kulübünüze gelmeye isteksiz; ancak çok yüksek bir maaşla ikna olabilir.'; }
  return { dem: Math.round(dem / 500) * 500, note };
}
// o: { fee, sellOn, swap, wage, yrs, signOn, app, goal }
function makeOffer(pid, o) {
  const p = P(pid);
  const ut = userTeam();
  if (!p) return { ok: false, msg: 'Oyuncu bulunamadı.' };
  if (p.team === S.uid) return { ok: false, msg: 'Bu oyuncu zaten kadronuzda.' };
  if (!windowOpen()) return { ok: false, msg: 'Transfer dönemi kapalı. Yaz dönemi: Temmuz–Ağustos, kış dönemi: Ocak.' };
  if (ut.players.length >= 32) return { ok: false, msg: 'Kadronuz dolu (en fazla 32 oyuncu).' };
  const fee = Math.max(0, Math.round(+o.fee || 0));
  const sellOn = clamp(Math.round(+o.sellOn || 0), 0, 30);
  const swap = o.swap ? P(+o.swap) : null;
  const wage = Math.max(0, Math.round(+o.wage || 0));
  const yrs = clamp(+o.yrs || 2, 1, 5);
  const signOn = Math.max(0, Math.round(+o.signOn || 0));
  const app = Math.max(0, Math.round(+o.app || 0));
  const goal = Math.max(0, Math.round(+o.goal || 0));
  const from = p.team ? T(p.team) : null;
  const n = negOf(p);
  const L = (t) => { n.log.push(t); if (n.log.length > 14) n.log.shift(); return t; };
  if (swap && (swap.team !== S.uid || swap.id === p.id)) return { ok: false, msg: 'Takas oyuncusu geçersiz.' };
  if (swap && ut.players.length <= 16) return { ok: false, msg: 'Kadronuz takas için çok dar.' };
  if (fee + signOn > S.fin.tb) return { ok: false, msg: 'Transfer bütçeniz yetersiz (bonservis + imza parası). Kalan: ' + fmtMoney(S.fin.tb) + '.' };
  // 1) Kulüple pazarlık
  if (from) {
    if (n.until && n.until > S.date) return { ok: false, msg: from.name + ', ' + fmtDate(n.until) + ' tarihine kadar sizinle görüşmeyecek.' };
    if (from.players.length <= 18 && !swap) return { ok: false, msg: L(from.name + ' kadrosu dar olduğu için oyuncuyu satmıyor. Takas teklif etmeyi deneyin.') };
    const sv = swap ? swapValue(swap, from) : 0;
    const soV = n.min * sellOn / 100 * 0.6;
    const total = fee + sv + soV;
    const ag = n.agreed;
    const agreedOk = ag && fee >= ag.fee && sellOn <= ag.sellOn && (ag.swap || null) === (swap ? swap.id : null);
    if (!agreedOk) {
      n.rounds++;
      if (swap && sv < valueOf(swap) * 0.4) L(from.name + ': "' + fullName(swap) + ' bizim için öncelik değil."');
      if (total >= n.ask * 0.995 || (total >= n.min && n.rounds >= 3)) {
        n.agreed = { fee, sellOn, swap: swap ? swap.id : null };
        L(from.name + ' teklifi kabul etti (' + fmtMoney(fee) + (swap ? ' + ' + fullName(swap) : '') + (sellOn ? ' + %' + sellOn + ' satıştan pay' : '') + '). Sıra oyuncuyla görüşmede.');
      } else if (total < n.min * 0.5) {
        n.mood--;
        if (n.mood <= -2) { n.until = addDays(S.date, 14); return { ok: false, msg: L(from.name + ' teklifleri hakaret olarak gördü, 14 gün görüşmeyecek.') }; }
        return { ok: false, msg: L(from.name + ': "Bu teklif ciddi değil." Talepleri: ' + fmtMoney(Math.max(0, n.ask - sv - soV)) + '.') };
      } else {
        n.ask = Math.max(n.min, roundNice(n.ask - (n.ask - total) * (n.rounds >= 4 ? 1 : 0.35)));
        const needFee = Math.max(0, n.ask - sv - soV);
        const cf = needFee > 0 ? roundNice(needFee) : 0;
        return { ok: false, counter: cf, msg: L(from.name + ' reddetti. Karşı teklif: ' + fmtMoney(cf) + (swap ? ' + takas' : '') + (sellOn ? ' + %' + sellOn + ' pay' : '') + (n.rounds >= 4 ? ' (son söz)' : '') + '.') };
      }
    }
  }
  // 2) Oyuncuyla sözleşme
  const { dem, note } = playerDemand(p, yrs);
  const target = dem * Math.max(0.9, 1 - 0.03 * n.pr);
  const val = wage + signOn / (yrs * 40) + app * 0.75 + goal * goalsPerMatch(p);
  if (val < target * 0.97) {
    n.pr++;
    if (val < target * 0.7) return { ok: false, msg: L(fullName(p) + ' menajeri: "Bu teklifi müvekkilime götüremem." Beklenti: haftalık ~' + fmtMoney(target) + ' değerinde paket.' + note) };
    return { ok: false, wageCounter: Math.round(target / 500) * 500, msg: L(fullName(p) + ' haftalık ~' + fmtMoney(target) + ' değerinde paket istiyor (maaş + primler + imza parası).' + note) };
  }
  const room = S.fin.wb - userWages() + (swap ? swap.wage : 0);
  if (wage + app * 0.75 > room) return { ok: false, msg: 'Maaş bütçesi yetersiz. Haftalık boş alan: ' + fmtMoney(Math.max(0, room)) + '.' };
  // 3) Transfer tamam
  moveP(p, ut, wage, yrs);
  p.bon = app || goal ? { app, goal } : null;
  if (from) {
    if (swap) moveP(swap, from, swap.wage, ri(2, 4));
    S.fin.tb -= fee; S.fin.bal -= fee; S.fin.h.buys += fee;
    from.tb += fee;
    if (sellOn) p.sellOn = { tid: from.id, pct: sellOn };
    aiSetTactics(from);
  }
  if (signOn) { S.fin.tb -= signOn; S.fin.bal -= signOn; S.fin.h.buys += signOn; }
  delete S.neg[p.id];
  news(fullName(p) + ', ' + (from ? from.name + ' takımından ' + fmtMoney(fee) + (swap ? ' + ' + fullName(swap) + ' takası' : '') + ' karşılığında' : 'serbest oyuncu olarak') + ' ' + ut.name + ' kadrosuna katıldı.');
  return { ok: true, msg: fullName(p) + ' kadronuza katıldı! ' + (from ? 'Bonservis: ' + fmtMoney(fee) + (swap ? ' + ' + fullName(swap) : '') + '. ' : '') + 'Sözleşme: ' + yrs + ' yıl, haftalık ' + fmtMoney(wage) + (signOn ? ', imza parası ' + fmtMoney(signOn) : '') + '.' };
}
function genBids() {
  const ut = userTeam();
  if (ut.players.length <= 17) return;
  if (S.lastBid && daysBetween(S.lastBid, S.date) < 6) return;
  const pl = teamPlayers(ut);
  const top = pl.slice().sort((a, b) => ovr(b) - ovr(a)).slice(0, 7);
  for (const p of shuffle(pl.slice())) {
    if (p.bidOpen || (p.bidCd && p.bidCd > S.date)) continue;
    const prob = p.listed ? 0.06 : top.includes(p) ? 0.004 : 0.001;
    if (R() >= prob) continue;
    const fee = roundNice(valueOf(p) * (p.listed ? rf(0.7, 1.0) : rf(1.0, 1.35)));
    const buyers = leagueTeams().filter((t) => t.id !== S.uid && t.tb >= fee && t.players.length < 28 && t.rep >= ut.rep - 25);
    if (!buyers.length) continue;
    const b = pick(buyers);
    p.bidOpen = true;
    S.lastBid = S.date;
    msg('Transfer teklifi: ' + fullName(p),
      b.name + ', ' + fullName(p) + ' (' + POS_TR[p.pos[0]] + ', ' + p.age + ') için ' + fmtMoney(fee) + ' bonservis teklif etti.\n\nOyuncunun tahmini değeri: ' + fmtMoney(valueOf(p)) + '.' + (p.listed ? '\nOyuncu transfer listesinde.' : ''),
      { act: { type: 'bid', pid: p.id, tid: b.id, fee, max: Math.min(b.tb, roundNice(fee * (p.listed ? rf(1.05, 1.25) : rf(1.12, 1.45)))), rounds: 0 }, stop: true });
    return;
  }
}
function resolveBid(mid, accept) {
  const m = S.inbox.find((x) => x.id === mid);
  if (!m || !m.act || m.done) return { ok: false, msg: 'Bu teklif artık geçerli değil.' };
  const a = m.act, p = P(a.pid), b = T(a.tid);
  m.done = true;
  if (p) p.bidOpen = false;
  if (!accept) {
    m.res = 'Reddedildi';
    if (p) p.bidCd = addDays(S.date, p.listed ? 12 : 30);
    if (p && !p.listed && b && b.rep > userTeam().rep + 5 && R() < 0.5) {
      p.mor = clamp(p.mor - 0.6, 1, 5);
      msg(fullName(p) + ' hayal kırıklığında', fullName(p) + ', ' + b.name + ' teklifinin reddedilmesinden memnun değil.');
    }
    return { ok: true, msg: 'Teklif reddedildi.' };
  }
  if (!p || p.team !== S.uid || !b || !S.league.includes(b.id)) { m.res = 'Geçersiz'; return { ok: false, msg: 'Teklif geçersiz hale geldi.' }; }
  if (!windowOpen()) { m.res = 'Süre doldu'; return { ok: false, msg: 'Transfer dönemi kapandığı için transfer gerçekleşemedi.' }; }
  if (userTeam().players.length <= 16) { m.done = false; return { ok: false, msg: 'Kadronuz çok dar (en az 16 oyuncu kalmalı).' }; }
  if (b.tb < a.fee) { m.res = 'Geçersiz'; return { ok: false, msg: b.name + ' artık bu bedeli ödeyemiyor.' }; }
  let cut = 0;
  if (p.sellOn && T(p.sellOn.tid)) {
    cut = Math.round(a.fee * p.sellOn.pct / 100);
    T(p.sellOn.tid).tb += cut;
    msg('Satıştan pay ödendi', fullName(p) + ' satışından ' + T(p.sellOn.tid).name + ' kulübüne %' + p.sellOn.pct + ' pay (' + fmtMoney(cut) + ') ödendi.');
  }
  moveP(p, b, wageDemand(p, b), ri(2, 4));
  b.tb -= a.fee;
  S.fin.tb += a.fee - cut; S.fin.bal += a.fee - cut; S.fin.h.sales += a.fee - cut;
  aiSetTactics(b);
  m.res = 'Kabul edildi (' + fmtMoney(a.fee) + ')';
  news(fullName(p) + ', ' + fmtMoney(a.fee) + ' bedelle ' + userTeam().name + ' takımından ' + b.name + ' takımına transfer oldu.');
  return { ok: true, msg: fullName(p) + ' ' + fmtMoney(a.fee) + ' bedelle ' + b.name + ' takımına satıldı.' };
}
// Gelen teklife karşı teklif: alıcı kabul eder, artırır veya masadan kalkar
function counterBid(mid, amount) {
  const m = S.inbox.find((x) => x.id === mid);
  if (!m || !m.act || m.done) return { ok: false, msg: 'Bu teklif artık geçerli değil.' };
  const a = m.act, b = T(a.tid), p = P(a.pid);
  amount = Math.round(+amount || 0);
  if (!a.max) a.max = Math.round(a.fee * 1.2);
  if (!b || !p) { m.done = true; m.res = 'Geçersiz'; return { ok: false, msg: 'Teklif geçersiz hale geldi.' }; }
  if (amount <= a.fee) return resolveBid(mid, true);
  if (amount <= a.max && b.tb >= amount) {
    a.fee = amount;
    const r = resolveBid(mid, true);
    if (r.ok) r.msg = b.name + ' karşı teklifinizi kabul etti! ' + r.msg;
    return r;
  }
  a.rounds = (a.rounds || 0) + 1;
  if (amount > a.max * 1.3 || a.rounds >= 3) {
    m.done = true; m.res = 'Alıcı vazgeçti';
    p.bidOpen = false; p.bidCd = addDays(S.date, 20);
    return { ok: false, msg: b.name + ' istediğiniz bedeli fazla buldu ve masadan kalktı.' };
  }
  a.fee = Math.min(a.max, roundNice(a.fee + (a.max - a.fee) * rf(0.4, 0.7)));
  m.b += '\n\n↪ Karşı teklifiniz (' + fmtMoney(amount) + ') sonrası ' + b.name + ' teklifini ' + fmtMoney(a.fee) + ' seviyesine yükseltti.';
  return { ok: false, msg: b.name + ' teklifini ' + fmtMoney(a.fee) + ' olarak yükseltti.' };
}
function closeWindow() {
  for (const m of S.inbox) if (m.act && m.act.type === 'bid' && !m.done) {
    m.done = true; m.res = 'Süre doldu';
    const p = P(m.act.pid); if (p) p.bidOpen = false;
  }
  msg('Transfer dönemi kapandı', 'Transfer dönemi sona erdi. Bir sonraki dönem: ' + (monthOf(S.date) === 8 ? 'Ocak' : 'Temmuz') + '. Serbest oyuncularla da ancak transfer döneminde anlaşabilirsiniz.');
}
function winterWindowMsg() {
  const exp = teamPlayers(userTeam()).filter((p) => p.ce <= S.season);
  msg('Ara transfer dönemi açıldı', 'Ocak transfer dönemi açıldı ve ay sonuna kadar sürecek. Transfer bütçeniz: ' + fmtMoney(S.fin.tb) + '.' +
    (exp.length ? '\n\nSezon sonunda sözleşmesi bitecek oyuncular: ' + exp.map(fullName).join(', ') + '. Kalmalarını istiyorsanız oyuncu ekranından sözleşme yenileyin.' : ''));
}

function aiTransfer() {
  const buyers = leagueTeams().filter((t) => t.id !== S.uid && t.tb > 250000 && t.players.length < 27);
  if (!buyers.length) return;
  const b = pick(buyers);
  const g = pick(['D', 'M', 'A', 'D', 'M', 'A', 'G']);
  const mine = teamPlayers(b).filter((p) => POS_GROUP[p.pos[0]] === g).map(ovr).sort((x, y) => y - x);
  const bar = mine.length ? mine[Math.min(g === 'G' ? 0 : 1, mine.length - 1)] : 0;
  const cands = [];
  for (const id of S.league) {
    if (id === S.uid || id === b.id) continue;
    const s = T(id);
    if (s.players.length <= 20 || s.rep > b.rep + 3) continue;
    for (const p of teamPlayers(s)) {
      if (POS_GROUP[p.pos[0]] !== g || ovr(p) <= bar + 1 || p.age > 31 || p.wk) continue;
      const ask = askingPrice(p);
      if (ask <= b.tb) cands.push([p, ask]);
    }
  }
  for (const id of S.fa) {
    const p = S.players[id];
    if (p && POS_GROUP[p.pos[0]] === g && ovr(p) > bar + 1) cands.push([p, 0]);
  }
  if (!cands.length) return;
  cands.sort((x, y) => ovr(y[0]) - ovr(x[0]));
  const [p, ask] = pick(cands.slice(0, 4));
  const from = p.team ? T(p.team) : null;
  moveP(p, b, wageDemand(p, b), ri(2, 4));
  b.tb -= ask;
  if (from) { from.tb += Math.round(ask * 0.8); aiSetTactics(from); }
  news(fullName(p) + (from ? ', ' + from.name + ' takımından ' + fmtMoney(ask) + ' bedelle ' : ' serbest oyuncu olarak ') + b.name + ' kadrosuna katıldı.');
  if (b.players.length > 26) aiRelease(b);
  aiSetTactics(b);
}
function aiRelease(t) {
  const pl = teamPlayers(t).sort((a, b) => (ovr(a) - (a.age > 30 ? 5 : 0)) - (ovr(b) - (b.age > 30 ? 5 : 0)));
  const worst = pl.find((p) => p.age > 21);
  if (worst) moveP(worst, null, worst.wage, 1);
}

function renewDemand(p) { return Math.max(Math.round(p.wage * 1.12 / 500) * 500, wageFor(p)); }
function canRenew(p) { return p.team === S.uid && p.ce - S.season <= 1; }
function renewContract(pid, wage, yrs) {
  const p = P(pid);
  if (!p || p.team !== S.uid) return { ok: false, msg: 'Oyuncu kadronuzda değil.' };
  if (!canRenew(p)) return { ok: false, msg: 'Sözleşmesinin bitmesine daha çok var.' };
  if (p.mor < 2) return { ok: false, msg: fullName(p) + ' mutsuz olduğu için sözleşme yenilemek istemiyor.' };
  wage = Math.round(+wage || 0); yrs = clamp(+yrs || 2, 1, 5);
  const dem = renewDemand(p);
  if (wage < dem * 0.97) return { ok: false, wageCounter: dem, msg: fullName(p) + ' haftalık en az ' + fmtMoney(dem) + ' istiyor.' };
  if (userWages() - p.wage + wage > S.fin.wb) return { ok: false, msg: 'Maaş bütçesi bu artışa izin vermiyor.' };
  p.wage = wage; p.ce = S.season + yrs; p.mor = clamp(p.mor + 0.3, 1, 5);
  return { ok: true, msg: fullName(p) + ' sözleşmesini uzattı (' + yrs + ' yıl, haftalık ' + fmtMoney(wage) + ').' };
}
function releaseCost(p) { return Math.round(p.wage * 20 * Math.max(1, p.ce - S.season + 1)); }
function releasePlayer(pid) {
  const p = P(pid);
  if (!p || p.team !== S.uid) return { ok: false, msg: 'Oyuncu kadronuzda değil.' };
  if (userTeam().players.length <= 16) return { ok: false, msg: 'Kadronuz çok dar (en az 16 oyuncu kalmalı).' };
  const c = releaseCost(p);
  S.fin.bal -= c;
  moveP(p, null, p.wage, 1);
  return { ok: true, msg: fullName(p) + ' serbest bırakıldı. Tazminat: ' + fmtMoney(c) + '.' };
}
function toggleList(pid) {
  const p = P(pid);
  if (!p || p.team !== S.uid) return;
  p.listed = !p.listed;
}

// ---------- Oyuncu memnuniyeti ----------
function complaintsCheck() {
  const ut = userTeam();
  const pl = teamPlayers(ut);
  const order = pl.map(ovr).sort((a, b) => b - a);
  const bar = order[Math.min(13, order.length - 1)];
  const cands = pl.filter((p) => p.bench >= 3 && eligible(p) && p.age >= 20 && !p.promise && !p.listed && (!p.cc || p.cc <= S.date) && ovr(p) >= bar);
  if (!cands.length || R() > 0.5) return;
  const p = pick(cands);
  p.cc = addDays(S.date, 45);
  msg(fullName(p) + ' forma istiyor', fullName(p) + ' son maçlarda süre alamamaktan şikayetçi ve sizinle görüşmek istiyor.\n\n"Bu kulüpte oynamak için buradayım hocam. Kenarda oturmaya devam edersem geleceğimi düşünmek zorunda kalacağım."',
    { act: { type: 'compl', pid: p.id }, stop: true });
}
function resolveComplaint(mid, choice) {
  const m = S.inbox.find((x) => x.id === mid);
  if (!m || !m.act || m.done) return '';
  const p = P(m.act.pid);
  m.done = true;
  if (!p || p.team !== S.uid) { m.res = 'Geçersiz'; return 'Oyuncu artık kadroda değil.'; }
  if (choice === 'promise') { p.promise = 3; p.mor = clamp(p.mor + 0.5, 1, 5); m.res = 'Forma sözü verildi'; return fullName(p) + ' sözünüzden memnun. Önümüzdeki 3 maç içinde forma vermelisiniz.'; }
  if (choice === 'earn') { p.mor = clamp(p.mor - (p.h.pro >= 14 ? 0.3 : 0.8), 1, 5); m.res = 'Formayı hak etmeli dendi'; return fullName(p) + (p.h.pro >= 14 ? ' cevabınızı profesyonelce karşıladı.' : ' cevabınızdan hoşlanmadı.'); }
  p.listed = true; p.mor = clamp(p.mor - 0.2, 1, 5); m.res = 'Transfer listesine kondu';
  return fullName(p) + ' transfer listesine kondu.';
}

// ---------- Sezon sonu ----------
function endSeason() {
  const tb = table();
  const pos = tb.findIndex((r) => r.id === S.uid) + 1;
  const champ = tb[0].id;
  const top = topList('g', 1)[0];
  const best = leaguePlayers().filter((p) => p.st.app >= 12).sort((a, b) => avgRating(b) - avgRating(a))[0];
  const young = leaguePlayers().filter((p) => p.st.app >= 8 && p.age <= 21 && p !== best).sort((a, b) => avgRating(b) - avgRating(a))[0];
  const ut = userTeam();
  const prize = Math.round((17 - pos) * 220000 * (0.6 + ut.rep / 100) + (pos === 1 ? 5e6 : 0) + (S.cup.winner === S.uid ? 2e6 : 0));
  S.fin.bal += prize; S.fin.tb += Math.round(prize * 0.5); S.fin.h.prize += prize;
  const relegated = pos >= S.league.length - 2;
  const tgt = S.board.target;
  let verdict, fired = false;
  if (relegated) { verdict = 'Takım küme düştü. Yönetim kurulu sözleşmenizi feshetti.'; fired = true; }
  else if (pos > tgt + 3) { verdict = 'Hedefin (' + S.board.label + ') çok gerisinde kalındı. Yönetim yollarınızı ayırma kararı aldı.'; fired = true; }
  else if (pos <= tgt) verdict = pos === 1 ? 'ŞAMPİYON! Yönetim kurulu ve taraftarlar sizi bağrına bastı.' : 'Hedef gerçekleşti! Yönetim kurulu çalışmalarınızdan çok memnun.';
  else verdict = 'Hedefin biraz gerisinde kalındı. Yönetim size bir sezon daha şans veriyor.';
  S.rec.seasons++;
  if (pos === 1) S.rec.titles++;
  if (S.cup.winner === S.uid) S.rec.cups++;
  const cupRes = S.cup.winner === S.uid ? 'Şampiyon' : cupExit();
  S.hist.push({ season: S.season, team: ut.name, pos, champ: T(champ).name, cup: S.cup.winner ? T(S.cup.winner).name : '-', cupRes });
  S.seasonEnd = {
    season: S.season, pos, champ, cupW: S.cup.winner, prize, verdict, fired, relegated, target: S.board.label,
    top: top ? { id: top.id, g: top.st.lg } : null, best: best ? { id: best.id, r: round1(avgRating(best)) } : null,
    young: young ? { id: young.id, r: round1(avgRating(young)) } : null, cupRes,
    rel: tb.slice(-3).map((r) => r.id),
  };
  S.phase = fired ? 'fired' : 'seasonEnd';
  if (fired) S.firedWhy = verdict;
  S.offers = fired ? jobOffers(false) : (pos <= Math.max(1, tgt - 2) || pos === 1) ? jobOffers(true) : [];
}
function cupExit() {
  for (let s = S.cup.rounds.length - 1; s >= 0; s--) {
    const f = S.cup.rounds[s].find(isUserFx);
    if (f) return f.w === S.uid ? STAGES[s] : STAGES[s] + ' (elendi)';
  }
  return '-';
}

function seasonAge(p) {
  p.age++;
  const gk = p.pos[0] === 'GK';
  const a0 = gk ? 32 : 29;
  if (p.age >= a0) {
    for (const k of ['hiz', 'day', 'cev', 'guc']) {
      if (R() < (p.age - a0 + 1) * 0.2) p.a[k] = clamp(p.a[k] - 1 - (p.age >= a0 + 4 && R() < 0.5 ? 1 : 0), 1, 20);
    }
    if (p.age >= a0 + 2) for (let i = 0; i < 3; i++) { const k = pick(Object.keys(RW[p.pos[0]])); if (R() < 0.5) p.a[k] = clamp(p.a[k] - 1, 1, 20); }
  }
  if (p.age >= 27) p.h.pot = Math.min(p.h.pot, ovr(p));
  p.prog = 0;
}
function retires(p) {
  if (p.age >= 38) return true;
  if (p.age < 33) return false;
  return R() < (p.age - 32) * 0.22;
}

function newSeason() {
  S.today = [];
  const tb = table();
  const ut0 = S.uid;
  const rel = tb.slice(-3).map((r) => r.id).filter((id) => id !== ut0);
  // itibar güncellemesi
  const byRep = leagueTeams().sort((a, b) => b.rep - a.rep).map((t) => t.id);
  tb.forEach((r, i) => {
    const t = T(r.id);
    const expRank = byRep.indexOf(r.id) + 1;
    t.rep = clamp(Math.round(t.rep + (expRank - (i + 1)) * 0.7 + (i === 0 ? 2 : 0)), 35, 95);
  });
  // düşenler ligden çıkar
  for (const id of rel) {
    const t = T(id);
    // En değerli 5 oyuncu serbest kalır, kalanlar oyundan çıkar
    const keep = new Set(teamPlayers(t).sort((a, b) => (b.wk ? 1e12 : valueOf(b)) - (a.wk ? 1e12 : valueOf(a))).slice(0, 5).map((p) => p.id));
    for (const pid of t.players) {
      const p = S.players[pid];
      if (p && keep.has(pid)) { p.team = null; p.ce = 0; p.listed = false; p.bidOpen = false; S.fa.push(pid); }
      else delete S.players[pid];
    }
    delete S.teams[id];
    S.league = S.league.filter((x) => x !== id);
    news(t.name + ' küme düştü.');
  }
  // yükselenler
  const names = new Set(leagueTeams().map((t) => t.name));
  let guard = 0;
  while (S.league.length < 16 && guard++ < 50) {
    const c = PROMO_CLUBS[S.promoUsed++ % PROMO_CLUBS.length];
    if (names.has(c.n)) continue;
    const t = makeTeam(c, ri(48, 54));
    S.league.push(t.id); names.add(c.n);
    news(t.name + ' lige yükseldi.');
  }
  S.season++;
  const ut = userTeam();
  const gone = [], retired = [];
  // yaşlanma, emeklilik, sözleşmeler
  for (const tid of S.league) {
    const t = T(tid);
    for (const pid of t.players.slice()) {
      const p = S.players[pid];
      if (!p) continue;
      seasonAge(p);
      if (retires(p)) {
        t.players = t.players.filter((x) => x !== pid);
        delete S.players[pid];
        if (tid === S.uid) retired.push(fullName(p));
        continue;
      }
      if (p.ce < S.season) {
        if (tid === S.uid) { gone.push(fullName(p)); moveP(p, null, p.wage, 1); }
        else if (R() < 0.7) { p.ce = S.season + ri(1, 3); p.wage = wageFor(p); }
        else moveP(p, null, p.wage, 1);
      }
    }
    t.lineup = t.lineup.map((id) => (id != null && S.players[id] && S.players[id].team === tid ? id : null));
    t.bench = t.bench.filter((id) => S.players[id] && S.players[id].team === tid);
  }
  // serbest oyuncular
  for (const pid of S.fa.slice()) {
    const p = S.players[pid];
    if (!p) { S.fa = S.fa.filter((x) => x !== pid); continue; }
    seasonAge(p);
    if (p.age >= 34 || retires(p) || R() < 0.25) { S.fa = S.fa.filter((x) => x !== pid); delete S.players[pid]; }
  }
  while (S.fa.length < 45) makeFreeAgent(ri(42, 66), ri(22, 32));
  // YZ kadroları: gençler, eksik tamamlama, fazlalık
  for (const t of leagueTeams()) {
    if (t.id === S.uid) continue;
    const L = teamLevel(t.rep);
    for (let i = 0; i < 2 && t.players.length < 28; i++) {
      const p = makePlayer(L - 16 + gauss() * 4, pick(['DC', 'MC', 'ST', 'DR', 'DL', 'AMR', 'AML', 'GK', 'DM']), ri(17, 18), pickNat(0.05, t.nat), t.id);
      p.ce = S.season + 2; t.players.push(p.id);
    }
    let g2 = 0;
    while (t.players.length < 22 && g2++ < 10) {
      const need = neededPos(t);
      const fa = S.fa.map(P).filter((p) => p && POS_GROUP[p.pos[0]] === POS_GROUP[need] && ovr(p) >= L - 12).sort((a, b) => ovr(b) - ovr(a))[0];
      if (fa) moveP(fa, t, wageFor(fa), ri(1, 3));
      else { const p = makePlayer(L - 4 + gauss() * 4, need, genAge(), pickNat(0.3, t.nat), t.id); t.players.push(p.id); }
    }
    while (t.players.length > 28) aiRelease(t);
    t.tb = Math.round(600000 * Math.exp(0.08 * (t.rep - 50)) / 50000) * 50000;
  }
  // kullanıcıya altyapı
  const youth = [];
  const L = teamLevel(ut.rep);
  for (let i = 0; i < 3 && ut.players.length < 34; i++) {
    const p = makePlayer(L - 20 + gauss() * 5, pick(['DC', 'MC', 'ST', 'DR', 'DL', 'AMR', 'AML', 'GK', 'DM', 'AMC']), ri(16, 17), pickNat(0.04, ut.nat), ut.id);
    p.ce = S.season + 2; p.wage = 1000;
    if (R() < 0.35) p.h.pot = clamp(p.h.pot + ri(5, 15), ovr(p), 93);
    ut.players.push(p.id); youth.push(p);
  }
  // kadro çok daralmışsa yönetim takviye yapar
  while (ut.players.length < 18) {
    const need = neededPos(ut);
    const p = makePlayer(L - 10 + gauss() * 3, need, ri(19, 23), pickNat(0.1, ut.nat), ut.id);
    p.ce = S.season + 1; p.wage = wageFor(p);
    ut.players.push(p.id); youth.push(p);
  }
  // bütçeler
  const base = Math.round(600000 * Math.exp(0.08 * (ut.rep - 50)) / 50000) * 50000;
  S.fin.tb = Math.round((base + Math.max(0, S.fin.tb) * 0.4) / 50000) * 50000;
  S.fin.wb = Math.max(Math.round(userWages() * 1.1 / 1000) * 1000, Math.round(S.fin.wb * 1.03 / 1000) * 1000);
  S.fin.h = newFinHist();
  setupSeason();
  if (youth.length) msg('Altyapıdan yeni yetenekler', 'Altyapı sorumlumuz A takıma çıkmaya hazır gençleri bildirdi:\n\n' + youth.map((p) => '• ' + fullName(p) + ' (' + POS_TR[p.pos[0]] + ', ' + p.age + ')').join('\n') + '\n\nKadro ekranından inceleyebilirsiniz.');
  msg(S.season + '/' + String(S.season + 1).slice(2) + ' sezonu başlıyor',
    'Yönetim kurulunun bu sezonki hedefi: ' + S.board.label + '.\nTransfer bütçesi: ' + fmtMoney(S.fin.tb) + '. Haftalık maaş bütçesi: ' + fmtMoney(S.fin.wb) + '.' +
    (retired.length ? '\n\nFutbolu bırakanlar: ' + retired.join(', ') + '.' : '') +
    (gone.length ? '\n\nSözleşmesi bittiği için ayrılanlar: ' + gone.join(', ') + '.' : ''));
}
function neededPos(t) {
  const cnt = { G: 0, D: 0, M: 0, A: 0 };
  for (const p of teamPlayers(t)) cnt[POS_GROUP[p.pos[0]]]++;
  if (cnt.G < 2) return 'GK';
  const want = { D: 8, M: 8, A: 5 };
  let best = 'MC', gap = -99;
  const rep = { D: 'DC', M: 'MC', A: 'ST' };
  for (const g of ['D', 'M', 'A']) { const d = want[g] - cnt[g]; if (d > gap) { gap = d; best = rep[g]; } }
  return best;
}

// ---------- Kayıt ----------
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function validState(o) {
  return o && o.v === 1 && o.teams && o.players && Array.isArray(o.league) && o.uid && o.teams[o.uid] && Array.isArray(o.cal) && Array.isArray(o.fx);
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw);
    if (!validState(o)) return false;
    S = migrate(o); return true;
  } catch (e) { return false; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ } }
function importSave(text) {
  try { const o = JSON.parse(text); if (!validState(o)) return false; S = migrate(o); saveGame(); return true; } catch (e) { return false; }
}
// Eski kayıtları yeni alanlarla uyumlu hale getir
function migrate(o) {
  for (const id in o.teams) { const t = o.teams[id]; t.tac = Object.assign({}, TAC_DEF, t.tac || {}); if (!t.fam) t.fam = { [t.tac.f]: 100 }; }
  if (!o.today) o.today = [];
  if (!o.neg) o.neg = {};
  for (const m of o.inbox) if (m.act && m.act.type === 'bid' && !m.act.max) m.act.max = Math.round(m.act.fee * 1.2);
  return o;
}
