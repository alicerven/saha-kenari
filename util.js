'use strict';
// Genel yardımcılar (DOM'a dokunmaz; Node testlerinde de çalışır)

const R = Math.random;
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const rf = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const round1 = (x) => Math.round(x * 10) / 10;

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = R();
  while (v === 0) v = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wpick(items, wf) {
  if (!items.length) return undefined;
  let tot = 0;
  const ws = items.map((it) => { const w = Math.max(0, wf(it) || 0); tot += w; return w; });
  if (tot <= 0) return items[Math.floor(R() * items.length)];
  let r = R() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

function fmtMoney(v) {
  const s = v < 0 ? '-' : '';
  v = Math.abs(v);
  if (v >= 1e6) return s + '€' + (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
  if (v >= 1e3) return s + '€' + Math.round(v / 1e3) + 'K';
  return s + '€' + Math.round(v);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Tarihler 'YYYY-AA-GG' metni olarak tutulur, hesaplar UTC ile yapılır.
function toD(iso) { return new Date(iso + 'T00:00:00Z'); }
function fromD(d) { return d.toISOString().slice(0, 10); }
function addDays(iso, n) { const d = toD(iso); d.setUTCDate(d.getUTCDate() + n); return fromD(d); }
function daysBetween(a, b) { return Math.round((toD(b) - toD(a)) / 86400000); }
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function fmtDate(iso, withDay) {
  const d = toD(iso);
  const s = d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  return withDay ? WDAYS[d.getUTCDay()] + ', ' + s : s;
}
function monthOf(iso) { return toD(iso).getUTCMonth(); }
function dayOfWeek(iso) { return toD(iso).getUTCDay(); }
function dayOfMonth(iso) { return toD(iso).getUTCDate(); }
