/**
 * Server Preview Ringan untuk P2B Portal Terintegrasi
 * Menjalankan antarmuka web lokal secara instan tanpa perlu instalasi tambahan.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const STATIC_DIR = path.join(__dirname, 'app', 'static');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS & No-cache
  res.setHeader('Access-Control-Allow-Origin', '*');

  let urlPath = req.url.split('?')[0];

  // Mock API fallback saat dijalankan dalam mode preview lokal tanpa backend Python
  if (urlPath === '/api/public') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      news: [
        {
          id: '1',
          title: 'Sosialisasi Roadmap Transformasi Bisnis P2B 2025–2029',
          date: new Date().toLocaleDateString('id-ID'),
          summary: 'Pusat Pengembangan Bisnis UIN Maliki Malang mematangkan integrasi 6 divisi layanan BLU berbasis tata kelola digital terpadu.',
          link: 'https://uin-malang.ac.id'
        },
        {
          id: '2',
          title: 'Peningkatan Fasilitas Rumah Singgah & Layanan Maliki Laundry',
          date: new Date().toLocaleDateString('id-ID'),
          summary: 'Modernisasi sistem reservasi dan fasilitas kamar tamu serta penambahan kapasitas mesin cuci di Ma’had Kampus 1 & 3.',
          link: 'https://uin-malang.ac.id'
        }
      ]
    }));
    return;
  }

  // File resolver
  let relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/static\//, '');
  let filePath = path.join(STATIC_DIR, relativePath);

  // Security check: cegah path traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Akses Ditolak');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Berkas tidak ditemukan: ' + urlPath);
      return;
    }

    let ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`  🌟 Portal P2B UIN Malang Berhasil Dijalankan!`);
  console.log(`  🔗 Buka di browser: ${url}`);
  console.log(`  🛑 Tekan Ctrl + C di terminal untuk menghentikan.`);
  console.log(`======================================================\n`);

  // Buka browser secara otomatis di Windows
  exec(`start ${url}`);
});
