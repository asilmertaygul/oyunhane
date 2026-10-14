# Oyunhane

Her gün yeni bir mini oyunun eklendiği tarayıcı oyun sitesi. Oyun ekleme kuralları: `CLAUDE.md`. Liste: `public/games.json`.

Tarayıcıda oynanan oyunların toplandığı site. Oyunlar `public/` klasöründe durur. `server.js` hem sayfaları sunar hem de çok oyunculu oyunlar için oyuncular arasındaki mesajları iletir.

## Oyunlar

| Oyun | Adres | Açıklama |
|---|---|---|
| Bozkır Seferi | `/bozkir-seferi/` | 3D gerçek zamanlı strateji, tarihî seferler, en fazla 4 kişilik online oyun |

## Klasör yapısı

```
public/
  index.html          ana sayfa (oyun kartları)
  img/                kapak görselleri
  room.js             çok oyunculu oyunlar için ortak oda bağlantısı
  bozkir-seferi/      Bozkır Seferi
server.js             sunucu (statik dosyalar + /ws oda sunucusu)
```

## Yeni oyun eklemek

1. `public/oyun-adi/index.html` olarak oyunu koy.
2. Online olacaksa sayfaya `<script src="/room.js"></script>` ekle. Sayfa `window.claude.use('room')` ile lobiye bağlanır; her oyunun lobisi kendi adresine göre ayrıdır.
3. `public/index.html` içindeki "Oyunlar" bölümüne bir kart ekle.

## Railway

Depo Railway'e bağlıdır. `main` dalına gönderilen her değişiklik otomatik yayınlanır. Railway `npm install` ve `npm start` komutlarını kendisi çalıştırır ve `PORT` değişkenini kendisi verir.

## Kendi bilgisayarında çalıştırma

```
npm install
npm start
```

Sonra tarayıcıda `http://localhost:3000` adresini aç.
