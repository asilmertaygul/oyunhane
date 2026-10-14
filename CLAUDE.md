# Oyunhane

Her gün yeni bir küçük tarayıcı oyununun eklendiği site. Canlı adres: https://oyunhane-production.up.railway.app
`main` dalına gelen her commit Railway'de otomatik yayınlanır, yani main'e giden her şey birkaç dakika içinde canlıdadır.

## Yapı

```
public/
  index.html        ana sayfa; oyunları games.json'dan okuyup çizer (elle kart ekleme yok)
  games.json        oyun listesi
  room.js           online oyunlar için ortak oda bağlantısı
  img/              Bozkır Seferi görselleri
  bozkir-seferi/    büyük oyun (ayrı sohbette geliştiriliyor, DOKUNMA)
  <slug>/           her günlük oyun kendi klasöründe
server.js           statik dosyalar + /ws oda sunucusu
scripts/kontrol.js  games.json ve klasörleri doğrular
```

## Günlük oyun ekleme kuralları

1. **Klasör:** `public/<slug>/index.html` ve `public/<slug>/kapak.svg`. Slug küçük harf, Türkçe karakter yok, tireli (ör. `balon-patlat`). Mevcut bir slug'ı kullanma.
2. **Tek dosya:** Oyun tek bir `index.html` içinde, saf HTML/CSS/JS. Derleme adımı yok, npm paketi yok. Dış kaynak gerekiyorsa sadece Google Fonts. Görseller kodla (canvas/SVG) çizilir, ses gerekiyorsa Web Audio ile üretilir.
3. **Küçük ve hızlı:** Bir oyun turu 1–5 dakika. Dosya 300 KB altında. Açılır açılmaz oynanabilir, yükleme ekranı yok.
4. **Her cihazda:** Hem fare/klavye hem dokunmatik ile tam oynanır. Telefon ekranında (375 px genişlik) taşma yok. `<meta name="viewport">` şart.
5. **Türkçe:** Bütün metinler Türkçe. Başlangıçta kısa "Nasıl oynanır" (en fazla 2 cümle), bitince skor ve "Tekrar oyna" düğmesi.
6. **En iyi skor:** `localStorage` ile saklanır; erişim try/catch içinde olmalı.
7. **Ana sayfaya dönüş:** Sol üstte `<a href="/">← Oyunhane</a>` bağlantısı.
8. **Online oyun (isteğe bağlı):** `<script src="/room.js"></script>` ekle; `const room = await window.claude.use('room')` ile oda alınır. API: `room.emit(topic, data)`, `room.on(topic, fn)`, `room.presence(obj)`, `room.onPeers(fn)`, `room.peers()`. Oda adı sayfanın yoluna göre otomatik verilir. Online oyunlar tek başına da oynanabilir olmalı.
9. **Kapak:** `kapak.svg`, 400×300 viewBox, oyunun içinden tanınır bir sahne. Yazı koyma (başlık sitede zaten görünüyor).
10. **games.json:** Dizinin sonuna bir kayıt ekle:
    ```json
    {"slug":"balon-patlat","ad":"Balon Patlat","tarih":"2026-10-15","aciklama":"Tek cümlelik, oyunu anlatan açıklama.","tur":"Refleks","oyuncu":"tek","renk":"#e8505b","kapak":"/balon-patlat/kapak.svg"}
    ```
    `tarih` İstanbul saatine göre bugünün tarihi. `oyuncu` "tek" ya da "online". `renk` kapağın arka plan rengiyle uyumlu.
11. **Çeşitlilik:** Önceki oyunların türlerine bak (games.json). Arka arkaya aynı türü yapma. Türler: refleks, bulmaca, kelime (Türkçe), hafıza, nişan, platform, yarış, strateji, ritim, fizik, kart, arcade klasiği yorumu.
12. **Başka dosyaya dokunma:** Sadece yeni oyunun klasörü ve games.json değişir. index.html, server.js, room.js, bozkir-seferi değişmez.

## Yayından önce kontrol

- `node scripts/kontrol.js` hatasız geçmeli.
- Oyunu gerçek bir tarayıcıda (headless Chromium/Playwright varsa onunla) aç: konsol hatası yok, bir tur baştan sona oynanabiliyor, bitiş ekranı ve tekrar oyna çalışıyor, 375 px genişlikte düzgün.
- Commit mesajı: `Günün oyunu: <Ad> (<tarih>)`.
