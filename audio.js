'use strict';
// Stadyum sesleri: tamamı Web Audio ile üretilir, dışarıdan ses dosyası yüklenmez.

const SFX = {
  ctx: null, on: true, master: null, noise: null,
  crowd: null, crowdGain: null, crowdBp: null, swell: null, chant: null,
  level: 0.32, paused: false,

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { this.ctx = new AC(); } catch (e) { return false; }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.on ? 0.8 : 0;
    this.master.connect(this.ctx.destination);
    // 2 sn'lik pembe gürültü (kalabalık uğultusu için)
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
    }
    this.noise = buf;
    return true;
  },
  unlock() {
    if (!this.on || !this.init()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  ok() { return this.on && this.init(); },
  setOn(v) {
    this.on = v;
    try { localStorage.setItem('sahaKenari.sound', v ? '1' : '0'); } catch (e) { /* yok */ }
    if (!v) this.crowdStop(true);
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.8 : 0, this.ctx.currentTime, 0.05);
    if (v) this.unlock();
  },
  src(loop) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise; s.loop = !!loop;
    return s;
  },

  // Sürekli kalabalık uğultusu + ritmik tezahürat
  crowdStart() {
    if (!this.ok()) return;
    this.unlock();
    this.crowdStop(true);
    const c = this.ctx;
    const n = this.src(true);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.5;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const g = c.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(this.level, c.currentTime, 0.8);
    n.connect(bp); bp.connect(lp); lp.connect(g); g.connect(this.master);
    n.start();
    this.crowd = n; this.crowdGain = g; this.crowdBp = bp; this.paused = false;
    this.swell = setInterval(() => {
      if (!this.crowdGain) return;
      const t = c.currentTime;
      const lv = this.paused ? this.level * 0.45 : this.level * (0.75 + Math.random() * 0.5);
      this.crowdGain.gain.setTargetAtTime(lv, t, 1.2);
      this.crowdBp.frequency.setTargetAtTime(700 + Math.random() * 500, t, 1.5);
    }, 1800);
    let beat = 0;
    const pat = [1, 0, 1, 0, 1, 1, 1, 0];
    this.chant = setInterval(() => {
      if (!this.on || this.paused || !this.crowd) return;
      const bar = Math.floor(beat / 8) % 6;
      if (bar < 3 && pat[beat % 8]) this.clap(beat % 8 === 0);
      beat++;
    }, 250);
  },
  clap(accent) {
    const c = this.ctx, t = c.currentTime;
    for (let k = 0; k < 4; k++) {
      const s = this.src(false);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300 + Math.random() * 600; bp.Q.value = 0.9;
      const g = c.createGain();
      const st = t + k * 0.011 + Math.random() * 0.012;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.07, st + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.09);
      s.connect(bp); bp.connect(g); g.connect(this.master);
      s.start(st, Math.random() * 1.6, 0.12);
    }
    // davul
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(accent ? 120 : 95, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    const g2 = c.createGain(); g2.gain.setValueAtTime(accent ? 0.3 : 0.18, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g2); g2.connect(this.master); o.start(t); o.stop(t + 0.25);
  },
  setPaused(v) {
    this.paused = v;
    if (this.crowdGain) this.crowdGain.gain.setTargetAtTime(v ? this.level * 0.45 : this.level, this.ctx.currentTime, 0.6);
  },
  crowdStop(now) {
    clearInterval(this.swell); clearInterval(this.chant);
    this.swell = null; this.chant = null;
    if (this.crowd) {
      const c = this.ctx, n = this.crowd, g = this.crowdGain;
      try {
        if (now) n.stop();
        else { g.gain.setTargetAtTime(0.0001, c.currentTime, 0.9); n.stop(c.currentTime + 4); }
      } catch (e) { /* zaten durmuş */ }
    }
    this.crowd = null; this.crowdGain = null;
  },

  // Hakem düdüğü: 'short' (faul/başlangıç), 'long' (devre), 'final' (maç sonu)
  whistle(kind) {
    if (!this.ok()) return;
    const c = this.ctx;
    const seq = kind === 'final' ? [[0, 0.22], [0.35, 0.22], [0.7, 0.95]] : kind === 'long' ? [[0, 0.22], [0.32, 0.75]] : [[0, 0.28]];
    for (const [st, du] of seq) {
      const t = c.currentTime + st;
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 2900;
      const lfo = c.createOscillator(); lfo.frequency.value = 36;
      const lg = c.createGain(); lg.gain.value = 170;
      lfo.connect(lg); lg.connect(o.frequency);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.setValueAtTime(0.14, t + du - 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + du);
      o.connect(g); g.connect(this.master);
      o.start(t); lfo.start(t); o.stop(t + du + 0.02); lfo.stop(t + du + 0.02);
    }
  },
  roar(dur, peak) {
    const c = this.ctx, t = c.currentTime, s = this.src(true);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.6;
    bp.frequency.setValueAtTime(600, t); bp.frequency.linearRampToValueAtTime(1350, t + 0.6);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.25);
    g.gain.setTargetAtTime(0.0001, t + 0.9, dur / 4);
    s.connect(bp); bp.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 1);
  },
  horn() {
    const c = this.ctx, t = c.currentTime;
    for (const f of [233, 294, 349]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
      g.gain.setValueAtTime(0.05, t + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(lp); lp.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 1.6);
    }
  },
  // Gol: kendi golümüzde büyük coşku + korna, rakip golünde kısa uğultu
  goal(mine) {
    if (!this.ok()) return;
    this.roar(mine ? 6 : 3, mine ? 0.9 : 0.4);
    if (mine) this.horn();
  },
  // Kaçan pozisyonda "ooo" sesi
  ooh() {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, s = this.src(true);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(480, t); bp.frequency.linearRampToValueAtTime(780, t + 0.35); bp.frequency.linearRampToValueAtTime(430, t + 1.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    s.connect(bp); bp.connect(g); g.connect(this.master);
    s.start(t, Math.random()); s.stop(t + 1.6);
  },
};
try { SFX.on = localStorage.getItem('sahaKenari.sound') !== '0'; } catch (e) { /* yok */ }
