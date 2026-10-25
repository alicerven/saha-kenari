// Node ile çalışan denge ve hata testi: node denge-testi.js [sezon] [kulüpIndex]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = __dirname;
const code = ['util.js', 'data.js', 'engine.js', 'game.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n');
const ctx = { console, Math, Date, JSON, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(code + `
;(function(){
  const seasons = ${+process.argv[2] || 3};
  newGame('Test', ${+process.argv[3] || 8});
  const st = { m: 0, g: 0, hw: 0, d: 0, aw: 0, cards: 0, reds: 0, shots: 0, pens: 0 };
  let done = 0, steps = 0;
  while (done < seasons && steps++ < 100000) {
    const r = advance();
    if (r.type === 'inbox') {
      for (const m of S.inbox) if (m.act && !m.done) {
        if (m.act.type === 'bid') resolveBid(m.id, Math.random() < 0.3);
        else resolveComplaint(m.id, ['promise', 'earn', 'list'][Math.floor(Math.random() * 3)]);
      }
      // ara sıra transfer dene
      if (windowOpen() && Math.random() < 0.3) {
        const c = S.fa[0]; if (c) offerPlayer(c, 0, wageDemand(P(c), userTeam()), 2);
      }
      continue;
    }
    if (r.type === 'prematch') {
      const u = makeUserMatch();
      u.m.run();
      const all = [{ f: u.uf, m: u.m }, ...u.others];
      for (const { m } of all) {
        st.m++; st.g += m.sc[0] + m.sc[1]; st.shots += m.stats.sh[0] + m.stats.sh[1];
        if (m.sc[0] > m.sc[1]) st.hw++; else if (m.sc[0] < m.sc[1]) st.aw++; else st.d++;
        st.cards += m.stats.yc[0] + m.stats.yc[1]; st.reds += m.stats.rc[0] + m.stats.rc[1];
        st.pens += m.goals.filter(g => g.pen).length;
      }
      finishEvent(u.ev, all);
      continue;
    }
    if (r.type === 'seasonEnd' || r.type === 'fired') {
      const tb = table();
      console.log('--- Sezon', S.season, 'kullanıcı:', userTeam().name, 'sıra', S.seasonEnd ? S.seasonEnd.pos : userPos(), 'güven', Math.round(S.board.conf), r.type);
      console.log(tb.map((x, i) => (i + 1) + '. ' + T(x.id).name.padEnd(22) + ' ' + String(x.pts).padStart(3) + 'p ' + x.gf + '-' + x.ga + ' rep' + T(x.id).rep + ' güç' + teamStrength(T(x.id)).toFixed(1)).join('\\n'));
      const ts = topList('g', 3).map(p => fullName(p) + ' ' + p.st.lg).join(', ');
      console.log('Gol krallığı:', ts, '| kupa:', S.cup.winner ? T(S.cup.winner).name : '-');
      if (r.type === 'fired') {
        if (S.seasonEnd) { continueAfterFired(S.offers[0]); done++; }
        else continueAfterFired(S.offers[0]);
      } else { newSeason(); done++; }
      // tutarlılık kontrolleri
      for (const tid of S.league) {
        const t = T(tid);
        for (const id of t.players) { if (!S.players[id]) throw new Error('kayıp oyuncu ' + id); if (S.players[id].team !== tid) throw new Error('takım uyumsuz'); }
        if (t.players.length < 16) console.log('UYARI az oyuncu', t.name, t.players.length);
      }
      console.log('kadro boyları', S.league.map(id => T(id).players.length).join(','), 'FA', S.fa.length);
    }
  }
  console.log('Maç', st.m, 'gol/maç', (st.g / st.m).toFixed(2), 'şut/maç', (st.shots / st.m).toFixed(1), 'ev %', (st.hw / st.m * 100).toFixed(0), 'beraberlik %', (st.d / st.m * 100).toFixed(0), 'dep %', (st.aw / st.m * 100).toFixed(0), 'sarı/maç', (st.cards / st.m).toFixed(1), 'kırmızı/maç', (st.reds / st.m).toFixed(2), 'pen/maç', (st.pens/st.m).toFixed(2));
  console.log('JSON boyutu KB', Math.round(JSON.stringify(S).length / 1024));
})();
`, ctx);
