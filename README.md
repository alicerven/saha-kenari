# Saha Kenarı

Tarayıcıda oynanan, metin anlatımlı bir futbol menajerliği oyunu. Kurgusal 16 kulüplü bir ligde bir kulübü seçip sezonu yönetirsin. Bir sezon yaklaşık 40-60 dakika sürer.

**Oyna:** https://alicerven.github.io/saha-kenari/

## Neler var

- 16 kulüplü lig (30 hafta) ve tek maç eleme usulü kupa
- Gün gün ilerleyen takvim: antrenman raporları, haberler, gelen teklifler. İstersen tek tuşla maç gününe geç
- Canlı anlatımlı maç motoru ve stadyum sesleri (tezahürat, düdük, gol coşkusu; tamamı tarayıcıda üretilir)
- Taktikler maçı gerçekten etkiler: diziliş, oyun anlayışı, pres, tempo, savunma çizgisi, genişlik, oyun stili (pas oyunu, direkt, kontra). Kadroya uygunluk analizi ve diziliş uyumu
- Oyuncu formu, morali, kondisyonu, mevki uyumu ve gizli özellikleri maç performansına yansır
- Transfer pazarlığı: kulüple karşılıklı teklifler, takas, sonraki satıştan pay; oyuncuyla maaş, süre, imza parası, maç ve gol primi pazarlığı. Gelen tekliflere karşı teklif verilebilir
- Yönetim hedefi ve güveni, kovulma, iş teklifleri, basın toplantısı, forma isteyen oyuncular
- Sezon sonu ödülleri, küme düşme/yükselme, altyapı; kariyer sezonlarca devam eder
- Otomatik kayıt ve kaydı dosya olarak indirme/yükleme. Masaüstü ve mobil uyumlu

Tüm kulüp ve oyuncu isimleri kurgusaldır, rastgele üretilir.

## Yerelde çalıştırma

Derleme adımı yok. Klasörü bir statik sunucuyla açman yeterli:

```bash
python -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresine git.

## GitHub Pages'te yayınlama

1. Bu klasörün içeriğini yeni bir GitHub deposunun köküne yükle (`index.html` kökte olmalı).
2. Depoda **Settings → Pages** bölümünde kaynak olarak `main` dalını ve `/ (root)` klasörünü seç.
3. Birkaç dakika sonra oyun `https://<kullanıcı-adın>.github.io/<depo-adı>/` adresinde yayında olur.

## Denge testi

`denge-testi.js` arayüz olmadan sezonlar simüle eder ve puan durumunu, gol ortalamalarını ve kadro tutarlılığını yazdırır:

```bash
node denge-testi.js 5
```

## Dosya yapısı

| Dosya | İçerik |
| --- | --- |
| `data.js` | Kurgusal kulüpler, isim listeleri, anlatım metinleri |
| `engine.js` | Oyuncu modeli, kadro seçimi, maç motoru |
| `game.js` | Takvim, gün akışı, transfer, yönetim, sezon geçişi, kayıt |
| `ui.js` | Ekranlar ve etkileşim |
| `audio.js` | Stadyum sesleri (Web Audio) |
| `style.css` | Görünüm |
