// Oyunhane kontrolü: games.json ve oyun klasörleri tutarlı mı?
// Kullanım: node scripts/kontrol.js   (hata varsa çıkış kodu 1)
const fs = require('fs');
const path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const hatalar = [];
const uyarilar = [];

let games;
try {
  games = JSON.parse(fs.readFileSync(path.join(PUB, 'games.json'), 'utf8'));
} catch (e) {
  console.error('games.json okunamadı ya da geçerli JSON değil: ' + e.message);
  process.exit(1);
}
if (!Array.isArray(games)) { console.error('games.json bir dizi olmalı.'); process.exit(1); }

const slugs = new Set();
const gunluk = new Map();
for (const [i, g] of games.entries()) {
  const yer = `games.json[${i}] (${g && g.slug})`;
  for (const k of ['slug', 'ad', 'tarih', 'aciklama', 'tur', 'oyuncu']) {
    if (!g[k] || typeof g[k] !== 'string') hatalar.push(`${yer}: "${k}" alanı eksik`);
  }
  if (g.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) hatalar.push(`${yer}: slug sadece küçük harf, rakam ve tire içermeli`);
  if (slugs.has(g.slug)) hatalar.push(`${yer}: aynı slug iki kez var`);
  slugs.add(g.slug);
  if (g.tarih && !/^\d{4}-\d{2}-\d{2}$/.test(g.tarih)) hatalar.push(`${yer}: tarih YYYY-AA-GG olmalı`);
  if (g.oyuncu && !['tek', 'online'].includes(g.oyuncu)) hatalar.push(`${yer}: oyuncu "tek" ya da "online" olmalı`);
  if (g.renk && !/^#[0-9a-fA-F]{6}$/.test(g.renk)) hatalar.push(`${yer}: renk #RRGGBB olmalı`);
  if (!g.buyuk) {
    if (gunluk.has(g.tarih)) uyarilar.push(`${g.tarih} tarihinde birden fazla günlük oyun var (${gunluk.get(g.tarih)}, ${g.slug})`);
    gunluk.set(g.tarih, g.slug);
  }
  const dir = path.join(PUB, g.slug || '_');
  const html = path.join(dir, 'index.html');
  if (!fs.existsSync(html)) { hatalar.push(`${yer}: public/${g.slug}/index.html yok`); continue; }
  const src = fs.readFileSync(html, 'utf8');
  if (!/<meta[^>]+name=["']viewport/i.test(src)) hatalar.push(`${yer}: viewport meta etiketi yok`);
  if (!g.buyuk && !/href=["']\/["']/.test(src)) hatalar.push(`${yer}: ana sayfaya dönüş bağlantısı (href="/") yok`);
  if (!g.buyuk && g.oyuncu === 'online' && !src.includes('/room.js')) hatalar.push(`${yer}: online oyun ama /room.js yüklenmiyor`);
  if (g.kapak) {
    const kp = path.join(PUB, g.kapak.replace(/^\//, ''));
    if (!fs.existsSync(kp)) hatalar.push(`${yer}: kapak dosyası yok (${g.kapak})`);
  } else if (!g.buyuk) uyarilar.push(`${yer}: kapak yok, harf gösterilecek`);
  if (!g.buyuk) {
    const kb = Buffer.byteLength(src) / 1024;
    if (kb > 300) uyarilar.push(`${yer}: index.html ${kb.toFixed(0)} KB, mini oyun için büyük`);
  }
}

for (const u of uyarilar) console.log('uyarı: ' + u);
if (hatalar.length) {
  for (const h of hatalar) console.error('HATA: ' + h);
  process.exit(1);
}
console.log(`Tamam: ${games.length} oyun kontrol edildi.`);
