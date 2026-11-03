# Portal P2B UIN Malang — aplikasi terintegrasi

Satu aplikasi web untuk publik dan internal, backend FastAPI, basis data PostgreSQL, autentikasi bearer JWT, peran pengguna, dashboard agregat, impor data aplikasi HTML lama, audit perubahan dan HTTPS via Caddy.

## Uji lokal

Python 3.11+:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export BOOTSTRAP_ADMIN_USERNAME='kepala.p2b'
export BOOTSTRAP_ADMIN_PASSWORD='GANTI_PASSWORD_UNIK_MINIMAL_12'
export APP_SECRET="$(python -c 'import secrets;print(secrets.token_urlsafe(48))')"
uvicorn app.main:app --reload
```

Buka http://localhost:8000 — database SQLite lokal disimpan pada `p2b.db` (mode pengembangan saja). Akun bootstrap dibuat **hanya saat basis data belum memiliki pengguna**.

## Deploy ke server dengan HTTPS

Prasyarat: Linux VPS/VM lembaga, Docker Engine + Compose, domain/subdomain yang DNS-nya diarahkan ke IP publik server, akses port 80/443, prosedur persetujuan IT dan kebijakan keamanan/data universitas.

1. Salin `.env.example` menjadi `.env`, isi variabel dengan domain sah dan password/kunci acak. **Jangan commit `.env`.** Password DB contoh hindari simbol yang perlu URL-encoding.
2. Pastikan DNS A/AAAA menuju server. Konfigurasi HTTPS menggunakan Caddy (sertifikat TLS otomatis, jika validasi domain berhasil).
3. Jalankan `docker compose up -d --build`, lalu `docker compose ps` dan periksa `docker compose logs -f app caddy`.
4. Kunjungi `https://DOMAIN_ANDA/`, login akun bootstrap, buat akun untuk staf menurut divisi, lalu **ubah password akun bootstrap** pada layar pengguna (Reset Password).
5. Jalankan backup PostgreSQL terjadwal; contoh manual: `docker compose exec -T db pg_dump -U p2b -d p2b -Fc > backup_p2b.dump`. Simpan secara terenkripsi di lokasi luar server dan uji pemulihan berkala.
6. Konfigurasikan monitoring uptime, keamanan, patching OS/Docker, rotasi rahasia, dan recovery database.

## Migrasi dari 3 aplikasi lama

Menu internal **Migrasi Data Lama** menerima file JSON backup dari aplikasi PKS, Maliki Laundry, Rumah Singgah. Bisa juga membaca `localStorage` browser lama hanya bila **origin sama**. Bila browser lama dibuka dari file:// atau domain berbeda, ekspor backup JSON dari aplikasi lama dan impor ke portal baru. Proses impor tidak otomatis, dan dapat melaporkan konflik reservasi/entri yang dilewati. Lakukan migrasi ke salinan database uji dahulu, lakukan rekonsiliasi dengan laporan resmi sebelum go-live.

Catatan: pada aplikasi Rumah Singgah yang lama, persediaan menggunakan model item dan mutasi stok; migrasi awal hanya mengambil item dan kuantitas yang eksplisit tersedia. Mutasi dan sebagian atribut lanjutan perlu pemetaan rekonsiliasi tambahan. Pencatatan DP/angsuran Rumah Singgah tetap berada pada transaksi linked booking; tampilannya belum merekonsiliasi secara otomatis total piutang reservasi. Tidak ada klaim bahwa semua semantik data legacy telah berpindah sempurna.

## Hak akses

- `kepala`: seluruh data dan administrasi pengguna + audit.
- `sekretaris`: PKS, tugas dan berita; baca data operasional.
- `manajer_operasional`: membaca/menulis data operasional lintas divisi.
- `manajer_keuangan`: melihat data keuangan/PKS dan menulis transaksi serta tagihan; tidak mengubah reservasi atau stok.
- `manajer_it`: publikasi berita, baca operasional untuk pemantauan teknis.
- `kepala_divisi`/`operator`: data operasional dari divisinya saja, sesuai penugasan. Beberapa modul Komersial tersedia karena modul aktivitas detail baru dikembangkan untuk Komersial.
- `viewer`: hanya baca data operasional divisinya.

Akses dipaksa di backend pada setiap permintaan; UI internal bukan satu-satunya pembatas.

## Lingkup versi awal

Aplikasi ini sudah berfungsi sebagai sistem satu database, bukan hanya kumpulan tautan HTML. Halaman publik tanpa login; seluruh operasi internal melalui API dengan autentikasi. Dashboard membaca data server dan menyegarkan otomatis setiap 10 detik saat terbuka (**near real-time**, bukan WebSocket push). Perubahan tercatat dalam audit append-only aplikasi (database admin tetap dapat melakukan perubahan langsung). Kontrak, tagihan, laundry, rumah singgah, kantin, persewaan, publikasi berita dan pengguna punya formulir.

**Hal yang wajib diselesaikan sebelum produksi resmi:** persetujuan pengelola/TIK UIN; uji keamanan eksternal dan pentest; kebijakan privasi/retensi data dan persetujuan pengumpulan data; MFA/SSO kampus; penguatan autentikasi (rate-limiting terdistribusi, token revocation, rotasi kredensial); proses approval perubahan transaksi, pencatatan jurnal BLU terpisah, backup otomatis/offsite, SLA, logging tanpa data pribadi; file upload dokumen PKS aman; migrasi dan rekonsiliasi penuh; skalabilitas/pagination; review akses detail per divisi dan uji beban. Pembuatan akun awal, perubahan role, dan status akses harus melalui pejabat berwenang.

**Belum dideploy** ke infrastruktur UIN; paket ini siap diinstal dan diuji setelah akses server/domain tersedia. Jangan langsung menempatkan data rahasia nyata pada prototipe tanpa kontrol operasional.

## Asal muatan kelembagaan

Profil, struktur jabatan, roadmap dan program prioritas diadaptasi dari Buku Profil P2B 2025–2029 serta Renstra P2B 2025–2029. Rumusan visi ringkas portal harus diverifikasi terhadap versi final yang disahkan. Target dalam road map bukan realisasi pendapatan.
