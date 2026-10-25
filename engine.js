'use strict';
// Oyuncu modeli, kadro seçimi ve maç motoru. Global S (oyun durumu) üzerinden çalışır.

const POS_TR = { GK: 'KL', DR: 'SĞB', DC: 'STP', DL: 'SLB', DM: 'DOS', MR: 'SĞO', MC: 'MOS', ML: 'SLO', AMR: 'SĞK', AMC: 'OOS', AML: 'SLK', ST: 'SNT' };
const POS_LONG = { GK: 'Kaleci', DR: 'Sağ Bek', DC: 'Stoper', DL: 'Sol Bek', DM: 'Defansif Orta Saha', MR: 'Sağ Orta Saha', MC: 'Merkez Orta Saha', ML: 'Sol Orta Saha', AMR: 'Sağ Kanat', AMC: 'Ofansif Orta Saha', AML: 'Sol Kanat', ST: 'Santrfor' };
const POS_GROUP = { GK: 'G', DR: 'D', DC: 'D', DL: 'D', DM: 'M', MR: 'M', MC: 'M', ML: 'M', AMR: 'A', AMC: 'A', AML: 'A', ST: 'A' };
const POS_ORDER = { GK: 0, DR: 1, DC: 2, DL: 3, DM: 4, MR: 5, MC: 6, ML: 7, AMR: 8, AMC: 9, AML: 10, ST: 11 };
const GROUP_TR = { G: 'Kaleci', D: 'Defans', M: 'Orta Saha', A: 'Hücum' };
const NEIGH = {
  GK: [], DR: ['DC', 'MR'], DL: ['DC', 'ML'], DC: ['DR', 'DL', 'DM'], DM: ['MC', 'DC'],
  MC: ['DM', 'AMC', 'MR', 'ML'], MR: ['AMR', 'MC', 'DR'], ML: ['AML', 'MC', 'DL'],
  AMR: ['MR', 'AML', 'AMC', 'ST'], AML: ['ML', 'AMR', 'AMC', 'ST'], AMC: ['MC', 'ST', 'AMR', 'AML'], ST: ['AMC', 'AMR', 'AML'],
};

const ATTR_TR = { bit: 'Bitiricilik', uza: 'Uzaktan Şut', pas: 'Pas', ort: 'Orta', dri: 'Top Sürme', tek: 'Teknik', kaf: 'Kafa', mar: 'Markaj', tkl: 'Top Kapma', kar: 'Karar', poz: 'Pozisyon', tas: 'Topsuz Oyun', cal: 'Çalışkanlık', lid: 'Liderlik', hiz: 'Hız', day: 'Dayanıklılık', guc: 'Güç', cev: 'Çeviklik', ref: 'Refleks', ele: 'Elle Kontrol', bir: 'Bire Bir', hav: 'Hava Topu' };
const ATTR_GROUPS = [
  ['Teknik', ['bit', 'uza', 'pas', 'ort', 'dri', 'tek', 'kaf', 'mar', 'tkl']],
  ['Zihinsel', ['kar', 'poz', 'tas', 'cal', 'lid']],
  ['Fiziksel', ['hiz', 'day', 'guc', 'cev']],
];
const GK_ATTRS = ['ref', 'ele', 'bir', 'hav'];
const ALL_ATTRS = ['bit', 'uza', 'pas', 'ort', 'dri', 'tek', 'kaf', 'mar', 'tkl', 'kar', 'poz', 'tas', 'cal', 'lid', 'hiz', 'day', 'guc', 'cev', 'ref', 'ele', 'bir', 'hav'];
const UNIVERSAL = ['kar', 'cal', 'day', 'hiz', 'cev', 'guc', 'lid', 'poz', 'tas'];

// Mevki başına özellik ağırlıkları (oyuncunun o mevkideki gücü)
const RW = {
  GK: { ref: 5, ele: 4, bir: 4, hav: 3, poz: 3, kar: 2, cev: 2 },
  DC: { mar: 5, tkl: 5, kaf: 4, poz: 4, guc: 3, kar: 2, hiz: 2, pas: 1 },
  DR: { mar: 3, tkl: 4, hiz: 4, ort: 3, poz: 3, day: 3, pas: 2, dri: 1 },
  DL: { mar: 3, tkl: 4, hiz: 4, ort: 3, poz: 3, day: 3, pas: 2, dri: 1 },
  DM: { tkl: 4, mar: 3, poz: 4, pas: 3, kar: 3, cal: 3, day: 2, guc: 2 },
  MC: { pas: 5, kar: 4, tek: 3, cal: 3, day: 2, tas: 2, uza: 2, tkl: 1 },
  MR: { ort: 4, hiz: 4, dri: 3, pas: 3, day: 3, tek: 2, cal: 2 },
  ML: { ort: 4, hiz: 4, dri: 3, pas: 3, day: 3, tek: 2, cal: 2 },
  AMC: { pas: 4, tek: 4, dri: 3, tas: 4, uza: 3, kar: 3, bit: 2 },
  AMR: { dri: 5, hiz: 5, ort: 3, tek: 3, tas: 2, bit: 2 },
  AML: { dri: 5, hiz: 5, ort: 3, tek: 3, tas: 2, bit: 2 },
  ST: { bit: 6, tas: 4, kaf: 3, hiz: 3, guc: 2, tek: 2, dri: 2, cev: 1 },
};
const RW_SUM = {};
for (const k in RW) RW_SUM[k] = Object.values(RW[k]).reduce((a, b) => a + b, 0);

// Diziliş: her slot mevki + saha koordinatı (x: soldan sağa %, y: kendi kalemizden %)
const FORM = {
  '4-4-2': [['GK', 50, 6], ['DR', 86, 26], ['DC', 62, 20], ['DC', 38, 20], ['DL', 14, 26], ['MR', 86, 52], ['MC', 62, 48], ['MC', 38, 48], ['ML', 14, 52], ['ST', 62, 80], ['ST', 38, 80]],
  '4-3-3': [['GK', 50, 6], ['DR', 86, 26], ['DC', 62, 20], ['DC', 38, 20], ['DL', 14, 26], ['MC', 70, 50], ['DM', 50, 40], ['MC', 30, 50], ['AMR', 84, 74], ['ST', 50, 82], ['AML', 16, 74]],
  '4-2-3-1': [['GK', 50, 6], ['DR', 86, 26], ['DC', 62, 20], ['DC', 38, 20], ['DL', 14, 26], ['DM', 62, 40], ['DM', 38, 40], ['AMR', 84, 64], ['AMC', 50, 62], ['AML', 16, 64], ['ST', 50, 84]],
  '4-1-4-1': [['GK', 50, 6], ['DR', 86, 26], ['DC', 62, 20], ['DC', 38, 20], ['DL', 14, 26], ['DM', 50, 36], ['MR', 86, 56], ['MC', 62, 54], ['MC', 38, 54], ['ML', 14, 56], ['ST', 50, 82]],
  '3-5-2': [['GK', 50, 6], ['DC', 72, 22], ['DC', 50, 18], ['DC', 28, 22], ['MR', 88, 50], ['DM', 50, 38], ['MC', 67, 54], ['MC', 33, 54], ['ML', 12, 50], ['ST', 62, 80], ['ST', 38, 80]],
  '5-3-2': [['GK', 50, 6], ['DR', 88, 32], ['DC', 70, 20], ['DC', 50, 17], ['DC', 30, 20], ['DL', 12, 32], ['MC', 70, 50], ['MC', 50, 45], ['MC', 30, 50], ['ST', 62, 78], ['ST', 38, 78]],
};
const FORM_KEYS = Object.keys(FORM);
const MENT_TR = ['Savunma', 'Dengeli', 'Hücum'];
const PRESS_TR = ['Düşük', 'Normal', 'Yüksek'];
const TEMPO_TR = ['Yavaş', 'Normal', 'Hızlı'];
const LINE_TR = ['Derin', 'Normal', 'Yüksek'];
const WIDTH_TR = ['Dar', 'Normal', 'Geniş'];
const STYLE_TR = ['Pas oyunu', 'Dengeli', 'Direkt', 'Kontra'];
const TAC_DEF = { f: '4-4-2', m: 1, pr: 1, tm: 1, ln: 1, wd: 1, st: 1 };
const TAC_HELP = {
  m: ['Geride kalabalık, az risk. Hücum zayıflar.', 'Dengeli yaklaşım.', 'Daha çok oyuncu hücuma çıkar, arkada boşluk kalır.'],
  pr: ['Az yorulursunuz ama orta sahada daha az top kazanırsınız.', 'Normal baskı.', 'Rakibin pas oyununu bozar (özellikle tekniği zayıf takımlarda), oyuncular çok yorulur.'],
  tm: ['Topu tutar, daha az ama kontrollü atak. Az yorulma.', 'Normal tempo.', 'Daha çok pozisyon, daha çok yorgunluk. Rakibe de alan açar.'],
  ln: ['Savunma sağlam, arkaya atılan toplar etkisiz. Rakip uzaktan şut dener.', 'Normal çizgi.', 'Orta saha sıkışır ama hızlı forvetlere karşı arkada büyük risk.'],
  wd: ['Merkezden, ara paslarla oynar.', 'Normal genişlik.', 'Kanatlar ve ortalar öne çıkar. Ortacı kanatlar ve kafa vuran forvet ister.'],
  st: ['Kısa paslarla topa sahip olur, daha az ama daha net pozisyon. Teknik ister.', 'Karışık oyun.', 'Orta sahayı hızlı geçer, çok şut ama düşük isabet. Uzun boylu forvet ister.', 'Topu rakibe bırakır, top kapınca hızlı çıkar. Hızlı forvet ister, hücumcu rakiplere karşı etkili.'],
};
function normTac(t) { t.tac = Object.assign({}, TAC_DEF, t.tac || {}); if (!t.fam) t.fam = {}; return t.tac; }

// Slotların savunma / orta saha / hücum katkıları
const LW = {
  GK: [0, 0, 0], DC: [1.0, 0.15, 0.02], DR: [0.75, 0.35, 0.2], DL: [0.75, 0.35, 0.2], DM: [0.6, 0.8, 0.1],
  MC: [0.2, 1.0, 0.35], MR: [0.15, 0.75, 0.55], ML: [0.15, 0.75, 0.55], AMC: [0.05, 0.55, 0.9],
  AMR: [0.05, 0.45, 0.95], AML: [0.05, 0.45, 0.95], ST: [0.02, 0.15, 1.15],
};

const defR = (p) => (p.a.mar * 3 + p.a.tkl * 3 + p.a.poz * 3 + p.a.kaf * 2 + p.a.guc + p.a.hiz) / 13;
const midR = (p) => (p.a.pas * 3 + p.a.kar * 2 + p.a.tek * 2 + p.a.cal * 2 + p.a.day + p.a.tas) / 11;
const attR = (p) => (p.a.bit * 3 + p.a.tas * 2 + p.a.dri * 2 + p.a.hiz * 2 + p.a.tek + p.a.uza + p.a.kaf) / 12;
const gkR = (p) => (p.a.ref * 3 + p.a.ele * 2 + p.a.bir * 2 + p.a.hav + p.a.poz * 2) / 10;

// ---------- Oyuncu değerlendirme ----------
function posRating(p, slot) {
  const w = RW[slot];
  let s = 0;
  for (const k in w) s += w[k] * p.a[k];
  return (s / RW_SUM[slot]) * 5;
}
function ovr(p) { return Math.round(posRating(p, p.pos[0])); }
function fitOf(p, slot) {
  if (p.pos.includes(slot)) return 1;
  if (slot === 'GK' || p.pos[0] === 'GK') return 0.25;
  for (const q of p.pos) if (NEIGH[q].includes(slot)) return 0.9;
  if (p.pos.some((q) => POS_GROUP[q] === POS_GROUP[slot])) return 0.82;
  return 0.65;
}
function slotScore(p, slot) { return posRating(p, slot) * fitOf(p, slot) * (0.62 + 0.38 * p.cond / 100); }
function stars(r) { return clamp(Math.round((r - 40) / 5) / 2, 0.5, 5); }
function avgRating(p) { return p.st.app ? p.st.rs / p.st.app : 0; }
function formAvg(p) { return p.form.length ? p.form.reduce((a, b) => a + b, 0) / p.form.length : 0; }
function fullName(p) { return p.fn + ' ' + p.ln; }
function eligible(p) { return p.inj === 0 && p.sus === 0; }

function valueOf(p) {
  const r = ovr(p);
  let v = 650 * Math.exp(0.122 * r);
  const g = Math.max(0, p.h.pot - r);
  const am = p.age <= 21 ? 1 + g / 25 : p.age <= 24 ? 1.15 + g / 40 : p.age <= 28 ? 1.0 : p.age <= 30 ? 0.75 : p.age <= 32 ? 0.5 : 0.3;
  v *= am;
  if (p.team && p.ce <= S.season) v *= 0.7;
  return roundNice(v);
}
function roundNice(v) {
  if (v < 1e5) return Math.max(10000, Math.round(v / 5000) * 5000);
  if (v < 1e6) return Math.round(v / 25000) * 25000;
  if (v < 1e7) return Math.round(v / 100000) * 100000;
  return Math.round(v / 500000) * 500000;
}
function wageFor(p) {
  const w = 600 * Math.exp(0.115 * ovr(p)) * 0.0024;
  return Math.max(1000, Math.round(w / 500) * 500);
}

// ---------- Üretim ----------
function pickNat(foreignP, home) { return R() < foreignP ? pick(FOREIGN) : home || 'TUR'; }
function genAge() {
  return wpick([19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34], (a) => (a <= 21 ? 3 : a <= 23 ? 5 : a <= 28 ? 7 : a <= 30 ? 5 : a <= 32 ? 3 : 1.5));
}
function genAttrs(level, pos) {
  const b = level / 5;
  const key = RW[pos];
  const a = {};
  for (const k of ALL_ATTRS) {
    let v;
    if (key[k]) v = b + 0.4 + gauss() * 1.5 + (key[k] >= 5 ? 0.6 : 0);
    else if (GK_ATTRS.includes(k)) v = pos === 'GK' ? b - 2 + gauss() * 2 : ri(1, 4);
    else if (pos === 'GK') v = ['lid', 'guc', 'day'].includes(k) ? b - 2 + gauss() * 2 : b - 7 + gauss() * 2;
    else if (UNIVERSAL.includes(k)) v = b - 1.5 + gauss() * 2.2;
    else v = b - 3.5 + gauss() * 2.2;
    a[k] = clamp(Math.round(v), 1, 20);
  }
  return a;
}
function tuneTo(p, level) {
  // Ana özellikleri hedef güce yaklaştır
  for (let i = 0; i < 6; i++) {
    const diff = level - posRating(p, p.pos[0]);
    if (Math.abs(diff) < 1.2) break;
    const step = diff > 0 ? 1 : -1;
    for (const k in RW[p.pos[0]]) if (R() < 0.6) p.a[k] = clamp(p.a[k] + step, 1, 20);
  }
}
function genPot(level, age) {
  let pot = level;
  if (age <= 18) pot += ri(6, 34);
  else if (age <= 21) pot += ri(3, 24);
  else if (age <= 24) pot += ri(0, 12);
  else if (age <= 26) pot += ri(0, 4);
  return clamp(pot, level, 93);
}
function newStats() { return { app: 0, g: 0, a: 0, rs: 0, yc: 0, rc: 0, motm: 0, lg: 0 }; }

function makePlayer(level, pos, age, nat, teamId) {
  const N = NATS[nat];
  level = clamp(level, 25, 92);
  const p = {
    id: S.nid++, fn: pick(N.f), ln: pick(N.l), nat, age, pos: [pos],
    a: genAttrs(level, pos),
    h: { pot: 0, tut: ri(4, 20), bmo: ri(3, 20), sak: clamp(Math.round(9 + gauss() * 4), 1, 20), pro: ri(3, 20), miz: ri(3, 20) },
    cond: 100, mor: 3, form: [], inj: 0, injN: '', sus: 0, yc: 0,
    team: teamId, listed: false, st: newStats(), car: { app: 0, g: 0, a: 0 }, prog: 0,
    wage: 0, ce: 0, bench: 0, promise: 0, cc: '', bidOpen: false,
  };
  if (pos !== 'GK' && R() < 0.45) p.pos.push(pick(NEIGH[pos]));
  tuneTo(p, level);
  p.h.pot = genPot(ovr(p), age);
  p.wage = wageFor(p);
  p.ce = S.season + ri(0, 3);
  S.players[p.id] = p;
  return p;
}

// Kadro şablonu: [mevki, seviye farkı, genç mi]
const SQUAD_T = [
  ['GK', 0], ['GK', -8], ['GK', -16, 1], ['DR', 0], ['DR', -7], ['DC', 0], ['DC', 0], ['DC', -6], ['DC', -13, 1],
  ['DL', 0], ['DL', -7], ['DM', 0], ['DM', -6], ['MC', 0], ['MC', -1], ['MC', -7], ['MC', -14, 1], ['MR', -1], ['ML', -1],
  ['AMR', -3], ['AML', -3], ['AMC', 0], ['ST', 0], ['ST', -4], ['ST', -14, 1],
];
function teamLevel(rep) { return 32 + rep * 0.47; }

function makeTeam(c, rep) {
  const id = 't' + S.tid++;
  const t = {
    id, name: c.n, short: c.s, c1: c.c[0], c2: c.c[1], rep, city: c.city, st: c.st, cap: c.cap, nat: c.nat || 'TUR',
    players: [], tac: Object.assign({}, TAC_DEF), fam: {}, lineup: [], bench: [],
    tb: Math.round(600000 * Math.exp(0.08 * (rep - 50)) / 50000) * 50000,
  };
  S.teams[id] = t;
  const L = teamLevel(rep);
  const fp = 0.18 + rep / 400;
  for (const [pos, off, young] of SQUAD_T) {
    const age = young ? ri(17, 19) : genAge();
    const lvl = young ? L + off + gauss() * 3 : L + off + gauss() * 3.5 - (age >= 32 ? 2 : 0);
    const p = makePlayer(lvl, pos, age, pickNat(young ? 0.08 : fp, t.nat), id);
    t.players.push(p.id);
  }
  aiSetTactics(t);
  return t;
}

function makeFreeAgent(level, age) {
  const pos = pick(['GK', 'DR', 'DC', 'DC', 'DL', 'DM', 'MC', 'MC', 'MR', 'ML', 'AMR', 'AML', 'AMC', 'ST', 'ST']);
  const p = makePlayer(level, pos, age, pickNat(0.35), null);
  p.ce = 0;
  S.fa.push(p.id);
  return p;
}

// ---------- Kadro seçimi ----------
function teamPlayers(t) { return t.players.map((id) => S.players[id]).filter(Boolean); }

function autoPick(t, f) {
  const slots = FORM[f].map((s) => s[0]);
  const pl = teamPlayers(t).filter(eligible);
  const pairs = [];
  slots.forEach((s, i) => pl.forEach((p) => pairs.push([slotScore(p, s), i, p.id])));
  pairs.sort((a, b) => b[0] - a[0]);
  const xi = new Array(slots.length).fill(null);
  const used = new Set();
  let filled = 0;
  for (const [, i, id] of pairs) {
    if (xi[i] !== null || used.has(id)) continue;
    xi[i] = id; used.add(id);
    if (++filled === slots.length) break;
  }
  const rest = pl.filter((p) => !used.has(p.id)).sort((a, b) => ovr(b) * (0.6 + 0.4 * b.cond / 100) - ovr(a) * (0.6 + 0.4 * a.cond / 100));
  const bench = [];
  const gk = rest.find((p) => p.pos[0] === 'GK');
  if (gk) bench.push(gk.id);
  // Her bölgeden en az bir yedek
  for (const g of ['D', 'M', 'A']) {
    const q = rest.find((p) => POS_GROUP[p.pos[0]] === g && !bench.includes(p.id));
    if (q) bench.push(q.id);
  }
  for (const p of rest) { if (bench.length >= 9) break; if (!bench.includes(p.id)) bench.push(p.id); }
  return { xi, bench };
}
function xiScore(t, f) {
  const { xi } = autoPick(t, f);
  const slots = FORM[f];
  let s = 0;
  xi.forEach((id, i) => { if (id != null) s += slotScore(S.players[id], slots[i][0]); });
  return s;
}
function aiSetTactics(t) {
  let best = '4-4-2', bs = -1;
  for (const f of FORM_KEYS) {
    const sc = xiScore(t, f) * (1 + R() * 0.02);
    if (sc > bs) { bs = sc; best = f; }
  }
  t.tac.f = best;
  if (!t.fam) t.fam = {};
  if (t.fam[best] == null) t.fam[best] = 100;
  const pk = autoPick(t, best);
  t.lineup = pk.xi; t.bench = pk.bench;
}
// Takım gücü: en iyi 11'in ortalaması
function teamStrength(t) {
  const { xi } = autoPick(t, t.tac.f);
  const slots = FORM[t.tac.f];
  let s = 0, n = 0;
  xi.forEach((id, i) => { if (id != null) { s += posRating(S.players[id], slots[i][0]) * fitOf(S.players[id], slots[i][0]); n++; } });
  return n ? s / 11 : 0;
}

// Kullanıcı kadrosunu doğrula: uygun olmayanları çıkar, boşlukları doldur
function validateLineup(t) {
  const notes = [];
  const slots = FORM[t.tac.f].map((s) => s[0]);
  const own = new Set(t.players);
  const seen = new Set();
  let xi = (t.lineup || []).slice(0, slots.length);
  while (xi.length < slots.length) xi.push(null);
  xi = xi.map((id) => {
    if (id == null || !own.has(id) || seen.has(id)) return null;
    const p = S.players[id];
    if (!p) return null;
    if (!eligible(p)) { notes.push(p.ln + (p.inj ? ' sakat' : ' cezalı') + ' olduğu için ilk 11\'den çıkarıldı.'); return null; }
    seen.add(id);
    return id;
  });
  let bench = (t.bench || []).filter((id) => own.has(id) && !seen.has(id) && S.players[id] && eligible(S.players[id]));
  bench = [...new Set(bench)];
  // boş slotları doldur
  for (let i = 0; i < slots.length; i++) {
    if (xi[i] != null) continue;
    let best = null, bs = -1;
    for (const p of teamPlayers(t)) {
      if (!eligible(p) || xi.includes(p.id)) continue;
      const sc = slotScore(p, slots[i]);
      if (sc > bs) { bs = sc; best = p; }
    }
    if (best) {
      xi[i] = best.id;
      bench = bench.filter((id) => id !== best.id);
      notes.push(best.ln + ' boş kalan ' + POS_TR[slots[i]] + ' mevkisine yerleştirildi.');
    }
  }
  // yedekleri tamamla
  if (bench.length < 9) {
    const rest = teamPlayers(t).filter((p) => eligible(p) && !xi.includes(p.id) && !bench.includes(p.id)).sort((a, b) => ovr(b) - ovr(a));
    if (!bench.some((id) => S.players[id].pos[0] === 'GK')) {
      const gk = rest.find((p) => p.pos[0] === 'GK');
      if (gk) bench.unshift(gk.id);
    }
    for (const p of rest) { if (bench.length >= 9) break; if (!bench.includes(p.id)) bench.push(p.id); }
  }
  t.lineup = xi; t.bench = bench.slice(0, 9);
  return notes;
}

// Diziliş değiştiğinde mevcut oyuncuları yeni slotlara dağıt
function reslot(players, f) {
  const slots = FORM[f].map((s) => s[0]);
  const pairs = [];
  slots.forEach((s, i) => players.forEach((p) => pairs.push([posRating(p, s) * fitOf(p, s), i, p])));
  pairs.sort((a, b) => b[0] - a[0]);
  const res = new Array(slots.length).fill(null);
  const used = new Set();
  for (const [, i, p] of pairs) {
    if (res[i] || used.has(p.id)) continue;
    res[i] = p; used.add(p.id);
  }
  // Kalecinin daima kaleye geçmesini sağla
  return res;
}

// ---------- Maç motoru ----------
class Match {
  constructor(home, away, o = {}) {
    this.t = [home, away];
    this.cup = !!o.cup;
    this.user = o.user == null ? -1 : o.user;
    this.big = !!o.big;
    this.boost = o.boost || [{}, {}];
    this.sd = [this.mkSide(home, 0), this.mkSide(away, 1)];
    this.sc = [0, 0];
    this.half = 1; this.m = 0; this.add = [ri(0, 3), ri(2, 6)];
    this.done = false; this.started = false; this.htPending = false;
    this.log = []; this.goals = [];
    this.stats = { pos: [0, 0], sh: [0, 0], sot: [0, 0], yc: [0, 0], rc: [0, 0], fo: [0, 0], cor: [0, 0] };
    this.pens = null;
  }
  newPs(slot, inMin) { return { slot, in: inMin, out: null, g: 0, a: 0, sh: 0, sot: 0, sv: 0, yc: 0, rc: 0, r: 0, inj: null, rat: 0 }; }
  mkSide(team, i) {
    const slots = FORM[team.tac.f];
    const on = [], ps = {}, df = {};
    const seen = new Set();
    (team.lineup || []).forEach((id, k) => {
      const p = id != null ? S.players[id] : null;
      if (p && k < slots.length && !seen.has(p.id)) { seen.add(p.id); on.push({ p, slot: slots[k][0] }); }
    });
    const bench = (team.bench || []).map((id) => S.players[id]).filter((p) => p && !seen.has(p.id) && eligible(p));
    for (const e of on) { ps[e.p.id] = this.newPs(e.slot, 0); df[e.p.id] = this.dayForm(e.p); }
    const tc = normTac(team);
    const fam = team.fam[tc.f] == null ? 50 : team.fam[tc.f];
    const sd = { team, on, bench, subs: 5, men: tc.m, pr: tc.pr, tm: tc.tm, ln: tc.ln, wd: tc.wd, st: tc.st, f: tc.f, fam, ps, df, mb: 0 };
    return sd;
  }
  dayForm(p) { return 1 + gauss() * 0.035 * (21 - p.h.tut) / 10; }
  absMin() { return this.half === 1 ? Math.min(this.m, 45) : Math.min(this.m, 90); }
  clock() {
    if (this.half === 1) return this.m > 45 ? '45+' + (this.m - 45) : String(this.m);
    return this.m > 90 ? '90+' + (this.m - 90) : String(this.m);
  }
  mk(type, side, text, extra) { return Object.assign({ type, side, text, min: this.clock(), half: this.half, m: this.m }, extra || {}); }
  name(i) { return this.t[i].name; }

  str(i) {
    const s = this.sd[i];
    let d = 0, m = 0, a = 0, gk = 3;
    const bm = this.big;
    for (const e of s.on) {
      const p = e.p;
      let k = fitOf(p, e.slot) * (0.72 + 0.28 * p.cond / 100) * (0.94 + p.mor * 0.024 + s.mb) * (s.df[p.id] || 1);
      if (p.form.length) k *= clamp(1 + (formAvg(p) - 6.7) * 0.04, 0.95, 1.05);
      if (bm) k *= 1 + (p.h.bmo - 10) * 0.004;
      if (e.slot === 'GK') { gk = gkR(p) * k; continue; }
      const w = LW[e.slot];
      d += w[0] * defR(p) * k; m += w[1] * midR(p) * k; a += w[2] * attR(p) * k;
    }
    d /= 4.3; m /= 4.8; a /= 4.5;
    const MEN = [[1.1, 0.98, 0.86], [1, 1, 1], [0.9, 1.02, 1.13]][s.men];
    d *= MEN[0]; m *= MEN[1]; a *= MEN[2];
    m *= [0.96, 1, 1.05][s.pr];
    // Taktik uyumu: dizilişe ne kadar alışık
    const fam = 0.93 + 0.07 * s.fam / 100;
    d *= fam; m *= fam; a *= fam;
    // Oyun stili
    if (s.st === 0) m *= 1.03 + clamp((this.tech(i) - 11) * 0.012, -0.07, 0.06);
    else if (s.st === 2) { m *= 0.94; a *= 1.03; }
    else if (s.st === 3) { m *= 0.92; d *= 1.04; }
    // Savunma çizgisi, tempo, genişlik
    if (s.ln === 0) { d *= 1.06; m *= 0.97; } else if (s.ln === 2) { m *= 1.04; d *= 0.98; }
    if (s.tm === 0) { m *= 1.03; a *= 0.97; } else if (s.tm === 2) { a *= 1.04; m *= 0.99; }
    if (s.wd === 2) a *= 1 + clamp((this.cross(i) - 11) * 0.007, -0.05, 0.05); else if (s.wd === 0) { m *= 1.02; a *= 0.99; }
    // Rakibin yüksek presi tekniği zayıf takımı bozar
    if (this.sd[1 - i].pr === 2) m *= clamp(1 - (13 - this.tech(i)) * 0.012, 0.92, 1.03);
    const b = this.boost[i] || {};
    if (b.att) a *= 1.025;
    if (b.def) d *= 1.025;
    if (i === 0) { d *= 1.04; m *= 1.04; a *= 1.04; }
    return { d: Math.max(d, 1), m: Math.max(m, 1), a: Math.max(a, 0.5), gk: Math.max(gk, 2) };
  }

  step() {
    if (this.done) return [];
    const out = [];
    if (!this.started) { this.started = true; out.push(this.mk('ko', -1, 'Hakemin düdüğüyle maç başladı!')); }
    if (this.htPending) { this.htPending = false; out.push(this.mk('ko', -1, 'İkinci yarı başladı!')); }
    this.m++;
    this.minute(out);
    if (this.half === 1 && this.m >= 45 + this.add[0]) {
      out.push(this.mk('ht', -1, 'İlk yarı sona erdi. ' + this.name(0) + ' ' + this.sc[0] + '-' + this.sc[1] + ' ' + this.name(1)));
      this.half = 2; this.m = 45; this.htPending = true;
    } else if (this.half === 2 && this.m >= 90 + this.add[1]) {
      out.push(this.mk('ft', -1, 'Maç sona erdi! ' + this.name(0) + ' ' + this.sc[0] + '-' + this.sc[1] + ' ' + this.name(1)));
      if (this.cup && this.sc[0] === this.sc[1]) this.shootout(out);
      this.done = true;
      this.finish();
    }
    for (const e of out) this.log.push(e);
    return out;
  }
  run() { let g = 0; while (!this.done && g++ < 400) this.step(); return this; }
  avgOf(list, f) { return list.length ? list.reduce((x, e) => x + f(e), 0) / list.length : 10; }
  tech(i) { return this.avgOf(this.sd[i].on.filter((e) => e.slot !== 'GK'), (e) => (e.p.a.pas + e.p.a.tek + e.p.a.kar) / 3); }
  speed(i) { return this.avgOf(this.sd[i].on.filter((e) => POS_GROUP[e.slot] === 'A'), (e) => e.p.a.hiz); }
  dspeed(i) { return this.avgOf(this.sd[i].on.filter((e) => POS_GROUP[e.slot] === 'D'), (e) => e.p.a.hiz); }
  cross(i) { return this.avgOf(this.sd[i].on.filter((e) => ['DR', 'DL', 'MR', 'ML', 'AMR', 'AML'].includes(e.slot)), (e) => e.p.a.ort); }
  aerial(i) { return this.avgOf(this.sd[i].on.filter((e) => ['ST', 'AMC'].includes(e.slot)), (e) => e.p.a.kaf); }
  setTac(i, k, v) { this.sd[i][k] = v; }

  minute(out) {
    const s = [this.str(0), this.str(1)];
    const m0 = Math.pow(s[0].m, 1.4), m1 = Math.pow(s[1].m, 1.4);
    const pA = m0 / (m0 + m1);
    const t = R() < pA ? 0 : 1, o = 1 - t;
    this.stats.pos[t]++;
    const A = this.sd[t], D = this.sd[o];
    const ratio = s[t].a / s[o].d;
    const mul = [0.9, 1, 1.12][A.tm] * [0.92, 1, 1.1, 0.95][A.st] * (D.tm === 2 ? 1.04 : 1);
    const pShot = clamp(0.215 * Math.pow(ratio, 1.15) * mul, 0.04, 0.6);
    if (R() < pShot) this.shot(t, o, s, out);
    else if (D.st === 3 && R() < 0.032 * (this.speed(o) / 12) * (A.men === 2 ? 1.35 : 1) * [0.8, 1, 1.3][A.ln]) this.shot(o, t, s, out, true);
    else if (R() < 0.09) this.flavor(t, out);
    this.fouls(0, out); this.fouls(1, out);
    if (R() < 0.0012) this.injury(R() < 0.5 ? 0 : 1, out);
    this.fatigue();
    if (this.user !== 0) this.ai(0, out);
    if (this.user !== 1) this.ai(1, out);
  }

  fill(tpl, v) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));
  }
  shot(t, o, s, out, counter) {
    const sd = this.sd[t], D = this.sd[o];
    const outf = sd.on.filter((e) => e.slot !== 'GK');
    if (!outf.length) return;
    // Şut tipi taktiklere göre değişir
    let pPen = 0.022, pOne = 0.078, pHead = 0.17, pLong = 0.21;
    if (sd.wd === 2) { pHead += 0.08; pOne -= 0.01; } else if (sd.wd === 0) { pHead -= 0.06; pOne += 0.03; }
    if (sd.st === 2) { pHead += 0.05; pLong += 0.03; } else if (sd.st === 0) { pLong -= 0.05; pOne += 0.02; }
    if (D.ln === 2) pOne += clamp(0.05 + (this.speed(t) - this.dspeed(o)) * 0.012, 0.01, 0.12);
    else if (D.ln === 0) { pOne -= 0.03; pLong += 0.06; }
    if (counter) { pPen = 0; pOne = 0.35; pHead = 0.05; pLong = 0.1; }
    const r = R();
    const type = r < pPen ? 'pen' : r < pPen + pOne ? 'one' : r < pPen + pOne + pHead ? 'head' : r < pPen + pOne + pHead + pLong ? 'long' : 'norm';
    let q = sd.st === 0 ? 1.07 : sd.st === 2 ? 0.95 : 1;
    if (type === 'head' && sd.wd === 2) q *= clamp(1 + (this.aerial(t) - 11) * 0.02, 0.9, 1.15);
    let sh;
    if (type === 'pen') sh = outf.reduce((b, e) => (e.p.a.bit > b.p.a.bit ? e : b), outf[0]);
    else sh = wpick(outf, (e) => {
      const w = LW[e.slot][2] + 0.04, a = e.p.a;
      const v = type === 'long' ? a.uza * (LW[e.slot][1] + w) : type === 'head' ? (a.kaf + (e.slot === 'DC' ? 5 : 0)) * (w + (e.slot === 'DC' ? 0.25 : 0)) : (a.bit + a.tas) * w;
      return v;
    });
    let as = null;
    if (type !== 'pen' && type !== 'long' && R() < 0.75) {
      const cand = sd.on.filter((e) => e !== sh && e.slot !== 'GK');
      if (cand.length) as = wpick(cand, (e) => type === 'head'
        ? e.p.a.ort * (['MR', 'ML', 'DR', 'DL', 'AMR', 'AML'].includes(e.slot) ? 2 : 0.6)
        : e.p.a.pas * (LW[e.slot][1] + LW[e.slot][2]));
    }
    const gkE = this.sd[o].on.find((e) => e.slot === 'GK');
    const sp = sh.p;
    const k = fitOf(sp, sh.slot) * (0.75 + 0.25 * sp.cond / 100);
    const a = sp.a;
    const skill = (type === 'long' ? a.uza : type === 'head' ? a.kaf : type === 'one' ? (a.bit * 2 + a.hiz + a.kar) / 4 : type === 'pen' ? (a.bit + a.kar) / 2 : (a.bit * 2 + a.tek + a.kar) / 4) * k;
    const base = { norm: [0.42, 0.31], long: [0.3, 0.16], head: [0.36, 0.29], one: [0.66, 0.46], pen: [0.84, 0.92] }[type];
    const onT = R() < base[0] * (0.72 + skill / 36);
    const pg = clamp(base[1] * Math.pow(skill / s[o].gk, 0.6) * q, 0.05, 0.93);
    const v = { p: sp.ln, a: as ? as.p.ln : sd.team.short, gk: gkE ? gkE.p.ln : 'kaleci', t: sd.team.name };
    this.stats.sh[t]++;
    const ps = sd.ps[sp.id];
    ps.sh++;
    if (counter) out.push(this.mk('build', t, 'Kontra atak! ' + sd.team.name + ' topu kaptı ve hızla çıkıyor!'));
    if (type === 'pen') out.push(this.mk('chance', t, this.fill(pick(TX.pen.award), v)));
    else if (R() < 0.35) out.push(this.mk('build', t, this.fill(pick(TX.build), { t: sd.team.name, a: as ? as.p.ln : sp.ln })));
    const T = TX[type];
    if (onT) {
      this.stats.sot[t]++; ps.sot++; ps.r += 0.1;
      if (R() < pg) {
        this.sc[t]++; ps.g++; ps.r += 1.0;
        if (as) { sd.ps[as.p.id].a++; sd.ps[as.p.id].r += 0.5; }
        for (const e of this.sd[o].on) {
          if (e.slot === 'GK') this.sd[o].ps[e.p.id].r -= 0.35;
          else if (POS_GROUP[e.slot] === 'D' || e.slot === 'DM') this.sd[o].ps[e.p.id].r -= 0.12;
        }
        this.goals.push({ side: t, pid: sp.id, aid: as ? as.p.id : null, min: this.clock(), half: this.half, m: this.m, pen: type === 'pen' });
        out.push(this.mk('goal', t, this.fill(pick(T.goal), v), { pid: sp.id, aid: as ? as.p.id : null, score: this.sc.slice() }));
      } else {
        if (gkE) { this.sd[o].ps[gkE.p.id].sv++; this.sd[o].ps[gkE.p.id].r += 0.22; }
        out.push(this.mk('save', t, this.fill(pick(T.save), v)));
        if (R() < 0.3) this.stats.cor[t]++;
      }
    } else {
      ps.r -= 0.05;
      out.push(this.mk('miss', t, this.fill(pick(T.miss), v)));
      if (R() < 0.25) this.stats.cor[t]++;
    }
  }
  flavor(t, out) {
    const sd = this.sd[t];
    if (!sd.on.length) return;
    const e = pick(sd.on);
    out.push(this.mk('flavor', t, this.fill(pick(TX.flavor), { t: sd.team.name, p: e.p.ln })));
  }
  fouls(i, out) {
    const sd = this.sd[i];
    if (!sd.on.length || R() > 0.16) return;
    this.stats.fo[i]++;
    const red = R() < 0.0025;
    if (!red && R() > 0.11) return;
    const e = wpick(sd.on, (x) => (24 - x.p.h.miz) * (LW[x.slot][0] + LW[x.slot][1] * 0.6 + 0.15));
    const ps = sd.ps[e.p.id];
    if (!red && ps.yc && R() < 0.6) return; // hakem uyarıyla yetindi
    const v = { p: e.p.ln, t: sd.team.name };
    if (red) {
      ps.rc = 1; ps.r -= 1.2; this.stats.rc[i]++;
      out.push(this.mk('red', i, this.fill(pick(TX.red), v), { pid: e.p.id }));
      this.sendOff(i, e, out);
    } else if (ps.yc) {
      ps.yc = 2; ps.rc = 1; ps.r -= 1.0; this.stats.yc[i]++; this.stats.rc[i]++;
      out.push(this.mk('red', i, this.fill(pick(TX.red2), v), { pid: e.p.id }));
      this.sendOff(i, e, out);
    } else {
      ps.yc = 1; ps.r -= 0.2; this.stats.yc[i]++;
      out.push(this.mk('yellow', i, this.fill(pick(TX.yellow), v), { pid: e.p.id }));
    }
  }
  sendOff(i, e, out) {
    const sd = this.sd[i];
    sd.on = sd.on.filter((x) => x !== e);
    sd.ps[e.p.id].out = this.absMin();
    if (e.slot === 'GK') this.fixGK(i, out);
  }
  fixGK(i, out) {
    const sd = this.sd[i];
    if (sd.on.some((e) => e.slot === 'GK') || !sd.on.length) return;
    const bgk = sd.bench.find((p) => p.pos[0] === 'GK');
    if (bgk && sd.subs > 0) {
      const victim = sd.on.slice().sort((a, b) => LW[b.slot][2] - LW[a.slot][2])[0];
      this.sub(i, victim.p.id, bgk.id, out, 'GK');
    } else {
      const e = sd.on.reduce((b, x) => (gkR(x.p) > gkR(b.p) ? x : b), sd.on[0]);
      e.slot = 'GK';
      sd.ps[e.p.id].slot = 'GK';
      out.push(this.mk('info', i, e.p.ln + ' kaleye geçiyor!'));
    }
  }
  sub(i, outId, inId, out, forceSlot) {
    const sd = this.sd[i];
    if (sd.subs <= 0) return false;
    const idx = sd.on.findIndex((e) => e.p.id === outId);
    const bp = sd.bench.find((p) => p.id === inId);
    if (idx < 0 || !bp) return false;
    const old = sd.on[idx];
    const slot = forceSlot || old.slot;
    sd.on[idx] = { p: bp, slot };
    sd.bench = sd.bench.filter((p) => p !== bp);
    sd.subs--;
    sd.ps[old.p.id].out = this.absMin();
    sd.ps[bp.id] = this.newPs(slot, this.absMin());
    sd.df[bp.id] = this.dayForm(bp);
    const ev = this.mk('sub', i, 'Oyuncu değişikliği, ' + sd.team.name + ': ' + bp.ln + ' oyuna giriyor, ' + old.p.ln + ' çıkıyor.', { pin: bp.id, pout: old.p.id });
    if (out) out.push(ev); else this.log.push(ev);
    return true;
  }
  bestBenchFor(i, slot) {
    const sd = this.sd[i];
    let best = null, bs = -1;
    for (const p of sd.bench) {
      if (slot !== 'GK' && p.pos[0] === 'GK') continue;
      const sc = slotScore(p, slot);
      if (sc > bs) { bs = sc; best = p; }
    }
    return best;
  }
  injury(i, out) {
    const sd = this.sd[i];
    if (!sd.on.length) return;
    const e = wpick(sd.on, (x) => x.p.h.sak + 2);
    const ps = sd.ps[e.p.id];
    if (ps.inj) return;
    const inj = wpick(INJURIES, (x) => x.w);
    ps.inj = { n: inj.n, d: ri(inj.d[0], inj.d[1]) };
    out.push(this.mk('inj', i, this.fill(pick(TX.inj), { p: e.p.ln }), { pid: e.p.id }));
    const rep = this.bestBenchFor(i, e.slot);
    if (sd.subs > 0 && rep) this.sub(i, e.p.id, rep.id, out);
    else { e.p.cond = Math.min(e.p.cond, 15); }
  }
  fatigue() {
    for (const sd of this.sd) {
      const pm = [0.85, 1, 1.25][sd.pr] * [0.92, 1, 1.12][sd.tm] * (sd.ln === 2 ? 1.04 : 1) * (this.boost[this.sd.indexOf(sd)].fit ? 0.9 : 1);
      for (const e of sd.on) e.p.cond = Math.max(10, e.p.cond - (0.19 + (20 - e.p.a.day) * 0.011) * pm);
    }
  }
  ai(i, out) {
    if (this.half !== 2 || this.m < 55 || this.m % 5 !== 0) return;
    const sd = this.sd[i];
    const diff = this.sc[i] - this.sc[1 - i];
    if (diff < 0 && this.m >= 65) sd.men = 2;
    else if (diff > 0 && this.m >= 78) sd.men = 0;
    if (sd.subs <= 2 || !sd.bench.length) return; // YZ en fazla 3 değişiklik yapar
    const cands = sd.on.filter((e) => e.slot !== 'GK').sort((a, b) => a.p.cond - b.p.cond);
    const tired = cands[0];
    if (!tired) return;
    if (tired.p.cond < 72 || (this.m >= 70 && R() < 0.35)) {
      const rep = this.bestBenchFor(i, tired.slot);
      if (rep && slotScore(rep, tired.slot) > slotScore(tired.p, tired.slot) * 0.85) this.sub(i, tired.p.id, rep.id, out);
    }
  }
  setMentality(i, m) { this.sd[i].men = m; }
  setPress(i, p) { this.sd[i].pr = p; }
  setFormation(i, f) {
    const sd = this.sd[i];
    const ps = sd.on.map((e) => e.p);
    const gkE = sd.on.find((e) => e.slot === 'GK');
    const res = reslot(ps, f);
    const on = [];
    const slots = FORM[f];
    res.forEach((p, k) => { if (p) on.push({ p, slot: slots[k][0] }); });
    // Kaleci sahadaysa kalede kalsın
    if (gkE && !on.some((e) => e.p === gkE.p && e.slot === 'GK')) {
      const cur = on.find((e) => e.slot === 'GK');
      const mine = on.find((e) => e.p === gkE.p);
      if (cur && mine) { const s0 = mine.slot; mine.slot = 'GK'; cur.slot = s0; }
    }
    sd.on = on;
    sd.f = f;
    for (const e of on) sd.ps[e.p.id].slot = e.slot;
  }
  shootout(out) {
    out.push(this.mk('info', -1, 'Eşitlik bozulmadı, seri penaltı atışlarına geçiliyor!'));
    const tk = [0, 0];
    const takers = [0, 1].map((i) => this.sd[i].on.slice().sort((a, b) => b.p.a.bit - a.p.a.bit));
    let round = 0;
    while (round < 40) {
      for (const i of [0, 1]) {
        if (!takers[i].length) continue;
        const sh = takers[i][round % takers[i].length];
        const gk = this.sd[1 - i].on.find((e) => e.slot === 'GK');
        const prob = clamp(0.6 + sh.p.a.bit * 0.012 + sh.p.a.kar * 0.006 - (gk ? gkR(gk.p) * 0.008 : 0), 0.5, 0.92);
        const ok = R() < prob;
        if (ok) tk[i]++;
        out.push(this.mk('pen', i, sh.p.ln + (ok ? ' penaltıyı gole çevirdi. ' : ' penaltıyı kaçırdı! ') + '(' + tk[0] + '-' + tk[1] + ')'));
      }
      round++;
      if (round < 5) { const rem = 5 - round; if (tk[0] > tk[1] + rem || tk[1] > tk[0] + rem) break; }
      else if (tk[0] !== tk[1]) break;
    }
    if (tk[0] === tk[1]) tk[R() < 0.5 ? 0 : 1]++;
    this.pens = tk;
    out.push(this.mk('info', -1, 'Seri penaltıları ' + (tk[0] > tk[1] ? this.name(0) : this.name(1)) + ' kazandı! (' + tk[0] + '-' + tk[1] + ')'));
  }
  winner() {
    if (this.sc[0] !== this.sc[1]) return this.sc[0] > this.sc[1] ? 0 : 1;
    if (this.pens) return this.pens[0] > this.pens[1] ? 0 : 1;
    return -1;
  }
  finish() {
    const endAbs = 90;
    let best = null, bv = -1;
    for (const i of [0, 1]) {
      const o = 1 - i;
      const res = Math.sign(this.sc[i] - this.sc[o]);
      const cs = this.sc[o] === 0;
      for (const id in this.sd[i].ps) {
        const x = this.sd[i].ps[id];
        let r = 6.4 + x.r + gauss() * 0.3 + (res > 0 ? 0.35 : res < 0 ? -0.3 : 0);
        if (cs && (x.slot === 'GK' || POS_GROUP[x.slot] === 'D')) r += 0.45;
        const mins = (x.out == null ? endAbs : x.out) - x.in;
        if (mins < 20) r = 6.3 + (r - 6.3) * 0.5;
        x.rat = clamp(round1(r), 3, 10);
        x.mins = Math.max(1, mins);
        if (x.rat > bv) { bv = x.rat; best = { side: i, pid: +id }; }
      }
    }
    this.motm = best;
  }
}

function moraleLabel(m) { return ['', 'Çok Düşük', 'Düşük', 'Normal', 'İyi', 'Çok İyi'][clamp(Math.round(m), 1, 5)]; }
