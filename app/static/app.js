'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rup = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
const dt = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

let token = sessionStorage.getItem('p2b_token') || '';
let user = null;
let current = 'beranda';
let sub = 'profil';
let mod = 'komersial';
let marketTab = 'belanja';
let internalPage = 'dashboard';
let rows = [];
let dash = {};
let poll = null;
let editing = null;
let formModule = '';
let formData = {};
let search = '';
let publicNewsList = [];

/* ==========================================================================
   DATA MASTER DARI KAJIAN DOKUMEN & LIBRARY P2B
   ========================================================================== */
const modules = [
  ['komersial', 'Komersial & Aset', '01', 'Pemanfaatan aset universitas, rumah singgah, laundry, kantin, persewaan serta kemitraan komersial.'],
  ['klinik', 'Klinik Pratama', '02', 'Pelayanan medis primer dokter umum dan gigi, BPJS Kesehatan, MCU civitas, dan homecare.'],
  ['press', 'UIN Maliki Press', '03', 'Penerbitan buku referensi, monograf, buku ajar, e-book, pencetakan, hak cipta (HKI) dan royalti.'],
  ['diklat', 'Pendidikan & Pelatihan', '04', 'Daycare ramah anak, Labschool PAUD, pelatihan profesi, kursus bahasa dan sertifikasi kompetensi BNSP.'],
  ['lph', 'Lembaga Pemeriksa Halal', '05', 'Jasa pemeriksaan teknis, audit kehalalan produk pangan, obat, dan kosmetik berstandar BPJPH.'],
  ['halal', 'Halal Center', '06', 'Pelatihan penyelia halal, pendampingan sertifikasi halal UMKM, edukasi dan inkubasi halal kampus.']
];

const people = [
  ['Kepala P2B', 'Dr. H. Suud Fuadi, S.HI., M.EI'],
  ['Sekretaris', 'Dr. Choirul Rozi, M.Pd'],
  ['Manajer Operasional', 'Dr. Diah Ambarumi Munawaroh, M.Pd'],
  ['Manajer Keuangan & Risiko', 'Dr. Sulis Rochayatun, M.Akun'],
  ['Manajer Marketing & IT', 'Akhmad Farroh Hasan, S.HI., M.Si'],
  ['Divisi Komersial & Aset', 'Dr. Nihayatu Aslamatis Solekah, S.E., M.M'],
  ['Divisi Klinik', 'dr. Ikrimah'],
  ['Divisi UIN Press', 'Benny Afwadzi, M.Hum'],
  ['Divisi Pendidikan & Pelatihan', 'Dessy Putri Wahyuningtyas, M.Pd'],
  ['Divisi LPH', 'Prilya Dewi Fitriasari, M.Sc'],
  ['Divisi Halal Center', 'Eny Yulianti, S.Si., M.Si']
];

const roadmap = [
  ['2025', 'Reformasi & Digitalisasi', 'Penyusunan baseline pendapatan dan aset, SOP, desain dashboard dan matriks kinerja.'],
  ['2026', 'Revitalisasi & Transformasi', 'Implementasi RBA divisi, peluncuran layanan baru, integrasi transaksi prioritas, dan payment gateway.'],
  ['2027', 'Ekspansi & Inovasi', 'Penguatan kemitraan industri, diversifikasi portofolio layanan, dan peningkatan aset produktif.'],
  ['2028', 'Integrasi Bisnis & Hilirisasi', 'Hilirisasi riset sains, model kerja sama aset skala besar, dan dashboard terintegrasi.'],
  ['2029', 'Kemandirian & Keberlanjutan', 'Operasional sistem kinerja real-time penuh, diversifikasi sumber pendapatan BLU, dan kemandirian institusi.']
];

const priorities = [
  'Penguatan tata kelola keuangan, RBA, KPI, dan manajemen mitigasi risiko BLU',
  'Kantin modern cashless (QRIS), PKS tenant, dan tata kelola usaha komersial',
  'Ekspansi layanan akreditasi LPH dan pendampingan UMKM Halal Center',
  'Pengembangan Klinik Pratama, fasilitas MCU berkala, BPJS, dan homecare civitas',
  'Labschool ramah anak, Daycare modern, dan pelatihan profesi bersertifikat BNSP',
  'Penerbitan buku cetak/digital UIN Maliki Press dan manajemen royalti penulis',
  'Optimalisasi gedung, ruang, lahan kampus, persewaan, dan produktivitas aset',
  'Digitalisasi dashboard terpusat dan hilirisasi produk hasil riset akademik'
];

const offerings = {
  klinik: [
    'Klinik Pratama & pelayanan dokter umum dan gigi',
    'Layanan faskes BPJS Kesehatan & rujukan medis',
    'Paket Medical Check-Up (MCU) berkala civitas',
    'Apotek penunjang, penyuluhan & homecare civitas'
  ],
  press: [
    'Penerbitan buku ajar, referensi cetak & e-book',
    'Pengelolaan naskah, editorial & tata letak ilmiah',
    'Pencatatan royalti penulis transparan & sistematis',
    'Distribusi nasional, pameran buku & pemasaran'
  ],
  diklat: [
    'Daycare modern & ramah anak bagi keluarga civitas',
    'Labschool pendidikan anak usia dini percontohan',
    'Pelatihan profesi, kursus bahasa & sertifikasi BNSP',
    'Workshop peningkatan kompetensi dosen & tenaga kependidikan'
  ],
  lph: [
    'Pemeriksaan teknis kehalalan produk pangan & kosmetika',
    'Pemberdayaan auditor halal teregistrasi BPJPH',
    'Uji laboratorium dan audit lapangan terakreditasi',
    'Kemitraan strategis dengan pelaku industri dan UMKM'
  ],
  halal: [
    'Pelatihan dan sertifikasi Penyelia Halal resmi',
    'Pendampingan sertifikasi halal gratis / self-declare UMKM',
    'Edukasi dan literasi kesadaran produk halal bagi masyarakat',
    'Inkubasi dan pengembangan ekosistem halal kampus'
  ]
};

const internalNames = {
  dashboard: 'Dashboard P2B',
  pks: 'Kendali PKS & Mitra',
  tagihan: 'Tagihan & Piutang',
  tugas: 'Kewajiban & Tugas PKS',
  laundry: 'Maliki Laundry',
  rumah_reservasi: 'Rumah Singgah • Reservasi',
  rumah_transaksi: 'Rumah Singgah • Keuangan',
  rumah_stok: 'Rumah Singgah • Persediaan',
  kantin: 'Kendali Kantin Kampus',
  persewaan: 'Kendali Persewaan Aset',
  kinerja_divisi: 'Kinerja & Program Divisi',
  berita: 'Info & Publikasi Berita',
  users: 'Hak Akses Pengguna',
  audit: 'Jejak Audit Aktivitas',
  migrasi: 'Migrasi Data Lama'
};

const DIVS = [
  ['komersial', 'Komersial & Aset'],
  ['klinik', 'Klinik Pratama'],
  ['uin_press', 'UIN Maliki Press'],
  ['pendidikan', 'Pendidikan & Pelatihan'],
  ['lph', 'LPH (Pemeriksa Halal)'],
  ['halal_center', 'Halal Center'],
  ['p2b', 'P2B / Umum']
];

const ROLES = [
  ['kepala', 'Kepala P2B'],
  ['sekretaris', 'Sekretaris'],
  ['manajer_operasional', 'Manajer Operasional'],
  ['manajer_keuangan', 'Manajer Keuangan & Risiko'],
  ['manajer_it', 'Manajer Marketing & IT'],
  ['kepala_divisi', 'Kepala Divisi'],
  ['operator', 'Operator Divisi'],
  ['viewer', 'Pembaca / Auditor']
];

const LOCS = [
  ['k1p', 'Ma’had Putera Kampus 1'],
  ['k3p', 'Ma’had Putra Kampus 3'],
  ['k3w', 'Ma’had Putri Kampus 3']
];

const ASSETS = [
  ...Array.from({ length: 12 }, (_, i) => ['K' + String(i + 1).padStart(2, '0'), 'Kamar ' + String(i + 1).padStart(2, '0')]),
  ['HB4', 'Hall Besar Lt. 4'],
  ['HK3A', 'Hall Kecil A Lt. 3'],
  ['HK3B', 'Hall Kecil B Lt. 3']
];

const S = {
  pks: [
    ['number', 'Nomor PKS'],
    ['title', 'Judul / Objek PKS'],
    ['partner', 'Nama Mitra'],
    ['division', 'Divisi', 'select', DIVS],
    ['start', 'Tanggal Mulai', 'date'],
    ['end', 'Tanggal Akhir', 'date'],
    ['value', 'Nilai PKS (Rp)', 'number'],
    ['stage', 'Tahap', 'select', [['active', 'Aktif'], ['draft', 'Draft'], ['terminated', 'Dihentikan']]],
    ['pic', 'PIC Penanggung Jawab'],
    ['terms', 'Klausul / Catatan Penting', 'textarea'],
    ['doc', 'URL / Berkas Dokumen']
  ],
  tagihan: [
    ['number', 'Nomor Tagihan'],
    ['contractId', 'ID PKS terkait (opsional)'],
    ['division', 'Divisi', 'select', DIVS],
    ['amount', 'Jumlah Tagihan (Rp)', 'number'],
    ['due', 'Jatuh Tempo', 'date'],
    ['note', 'Keterangan'],
    ['payments', 'Riwayat Pembayaran (JSON)', 'json']
  ],
  tugas: [
    ['title', 'Uraian Kewajiban / Tugas'],
    ['contractId', 'ID PKS'],
    ['division', 'Divisi', 'select', DIVS],
    ['due', 'Batas Waktu', 'date'],
    ['pic', 'PIC Penanggung Jawab'],
    ['status', 'Status', 'select', [['open', 'Belum Selesai'], ['done', 'Selesai']]],
    ['priority', 'Prioritas', 'select', [['Tinggi', 'Tinggi'], ['Sedang', 'Sedang'], ['Rendah', 'Rendah']]]
  ],
  laundry: [
    ['date', 'Tanggal', 'date'],
    ['site', 'Lokasi Cabang', 'select', LOCS],
    ['type', 'Jenis Transaksi', 'select', [['income', 'Pendapatan'], ['expense', 'Pengeluaran']]],
    ['category', 'Kategori Layanan'],
    ['amount', 'Nominal (Rp)', 'number'],
    ['method', 'Metode Pembayaran', 'select', [['Tunai', 'Tunai'], ['Transfer', 'Transfer Bank'], ['QRIS', 'QRIS']]],
    ['note', 'Keterangan']
  ],
  rumah_reservasi: [
    ['assetId', 'Kamar / Hall', 'select', ASSETS],
    ['guest', 'Penyewa / Nama Tamu'],
    ['contact', 'Kontak / No. HP'],
    ['start', 'Check-in / Mulai', 'date'],
    ['end', 'Check-out / Selesai', 'date'],
    ['status', 'Status', 'select', [['Dipesan', 'Terpesan (Booked)'], ['Check-in', 'Terisi (Check-in)'], ['Selesai', 'Selesai'], ['Dibatalkan', 'Dibatalkan']]],
    ['total', 'Total Tagihan (Rp)', 'number'],
    ['note', 'Catatan Tambahan']
  ],
  rumah_transaksi: [
    ['date', 'Tanggal', 'date'],
    ['type', 'Jenis Transaksi', 'select', [['Pendapatan', 'Pendapatan'], ['Pengeluaran', 'Pengeluaran']]],
    ['category', 'Kategori'],
    ['bookingId', 'ID Reservasi Terkait'],
    ['amount', 'Nominal (Rp)', 'number'],
    ['stage', 'Tahap Pembayaran', 'select', [['DP', 'DP (Uang Muka)'], ['Lunas', 'Lunas'], ['Tidak terkait', 'Operasional Rutin']]],
    ['note', 'Keterangan']
  ],
  rumah_stok: [
    ['name', 'Nama Barang / Linen'],
    ['unit', 'Satuan (Pcs/Set/Box)'],
    ['quantity', 'Jumlah Stok Tersedia', 'number'],
    ['min', 'Batas Stok Minimum', 'number'],
    ['note', 'Catatan']
  ],
  kantin: [
    ['date', 'Tanggal', 'date'],
    ['tenant', 'Nama Tenant / Gerai'],
    ['type', 'Jenis Transaksi', 'select', [['income', 'Pendapatan / Bagi Hasil'], ['expense', 'Pengeluaran / Biaya']]],
    ['category', 'Kategori'],
    ['amount', 'Nominal (Rp)', 'number'],
    ['method', 'Metode Pembayaran', 'select', [['Tunai', 'Tunai'], ['Transfer', 'Transfer'], ['QRIS', 'QRIS']]],
    ['note', 'Keterangan']
  ],
  persewaan: [
    ['asset', 'Kode / Nama Fasilitas Aset'],
    ['category', 'Kategori', 'select', [['Gedung', 'Gedung Serbaguna'], ['Ruang', 'Ruang Pertemuan / Kelas'], ['Lahan', 'Lahan / Area Terbuka'], ['Kendaraan', 'Kendaraan Operasional'], ['Peralatan', 'Peralatan / Sound System']]],
    ['tenant', 'Nama Penyewa / Lembaga'],
    ['start', 'Tanggal Mulai', 'date'],
    ['end', 'Tanggal Selesai (Eksklusif)', 'date'],
    ['amount', 'Nilai Sewa (Rp)', 'number'],
    ['paid', 'Total Terbayar (Rp)', 'number'],
    ['status', 'Status', 'select', [['Dipesan', 'Dipesan'], ['Berjalan', 'Berjalan'], ['Selesai', 'Selesai'], ['Batal', 'Batal']]],
    ['note', 'Keterangan']
  ],
  kinerja_divisi: [
    ['division', 'Divisi', 'select', DIVS],
    ['date', 'Tanggal Laporan', 'date'],
    ['program', 'Program / Kegiatan Strategis'],
    ['indicator', 'Indikator Kinerja Utama (IKU)'],
    ['target', 'Target Capaian'],
    ['realization', 'Realisasi / Progress Lapangan'],
    ['status', 'Status Capaian', 'select', [['Rencana', 'Rencana'], ['Berjalan', 'Sedang Berjalan'], ['Selesai', 'Selesai'], ['Tertunda', 'Tertunda']]],
    ['pic', 'PIC Penanggung Jawab'],
    ['note', 'Kendala & Rencana Tindak Lanjut', 'textarea']
  ],
  berita: [
    ['title', 'Judul Berita'],
    ['date', 'Tanggal Publikasi', 'date'],
    ['summary', 'Ringkasan Berita', 'textarea'],
    ['link', 'Tautan Berita Lengkap'],
    ['published', 'Tampilkan ke Publik', 'checkbox']
  ]
};

const moneyFields = new Set(['value', 'amount', 'paid', 'total']);

/* ==========================================================================
   API & AUTHENTICATION
   ========================================================================== */
async function api(path, method = 'GET', body) {
  let res = await fetch('/api' + path, {
    method,
    headers: {
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  let out = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      signout();
      throw Error('Sesi telah berakhir. Silakan masuk kembali.');
    }
    throw Error(typeof out.detail === 'string' ? out.detail : 'Permintaan gagal (' + res.status + ')');
  }
  return out;
}

function toast(t) {
  const el = $('toast');
  if (!el) return;
  el.textContent = t;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3400);
}

/* ==========================================================================
   ROUTING & NAVIGASI DINAMIS
   ========================================================================== */
function nav(to, tab) {
  current = to;
  if (to === 'beranda' && tab) sub = tab;
  if (to === 'divisi' && tab) mod = tab;
  if (to === 'marketplace' && tab) marketTab = tab;
  location.hash = to + (tab ? '/' + tab : '');
  if (to !== 'dashboard') {
    if ($('publicSite')) $('publicSite').hidden = false;
    if ($('internalApp')) $('internalApp').hidden = true;
    const f = document.querySelector('footer');
    if (f) f.hidden = false;
    updateAccessBtn();
  }
  draw();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindNav() {
  document.querySelectorAll('[data-go]').forEach(b => {
    b.onclick = () => nav(b.dataset.go);
  });
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = e => {
      e.preventDefault();
      nav(b.dataset.nav);
    };
  });
  document.querySelectorAll('.navbtn').forEach(b => {
    b.classList.toggle('active', b.dataset.go === current);
  });
  document.querySelectorAll('.dropdown-item[data-tab-nav]').forEach(b => {
    const [to, tab] = b.dataset.tabNav.split('|');
    b.classList.toggle('active', current === to && marketTab === tab);
    b.onclick = e => {
      e.preventDefault();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      nav(to, tab);
    };
  });
  if ($('publicNav')) $('publicNav').classList.remove('open');
}

function draw() {
  bindNav();
  updateAccessBtn();
  const v = $('view');
  if (!v) return;

  if (current === 'beranda') v.innerHTML = homeView();
  else if (current === 'divisi') v.innerHTML = divisionView();
  else if (current === 'marketplace') v.innerHTML = marketplaceView();
  else if (current === 'berita') v.innerHTML = newsView();
  else if (current === 'kerjasama') v.innerHTML = cooperationView();
  else if (current === 'kontak') v.innerHTML = contactView();
  else if (current === 'dashboard') {
    if (user) internal();
    else {
      $('authOverlay').hidden = false;
      nav('beranda');
    }
    return;
  }

  attachViewListeners();
}

function head(k, title, desc) {
  return `<div class="kicker">${esc(k)}</div><h2 class="sectiontitle">${esc(title)}</h2><p class="sectiondesc">${esc(desc)}</p>`;
}

function tile(t) {
  return `
    <div class="card divisionbox">
      <div>
        <div class="glyph">${t[2]}</div>
        <h3>${esc(t[1])}</h3>
        <p>${esc(t[3])}</p>
      </div>
      <a class="arrowlink" href="#divisi/${t[0]}" data-tab-nav="divisi|${t[0]}">Lihat layanan &rarr;</a>
    </div>
  `;
}

/* ==========================================================================
   HALAMAN 1: BERANDA (PROFIL, VISI-MISI, ROADMAP, PROGRAM, STRUKTUR)
   ========================================================================== */
function homeView() {
  return `
    <div class="hero">
      <div class="container">
        <div class="heroinner">
          <div class="eyebrow">P2B • MALIKI ISLAMIC UNIVERSITY</div>
          <h1>Bisnis kampus yang <em>profesional, inovatif,</em> dan berkelanjutan.</h1>
          <p>Mewujudkan ekosistem usaha universitas yang produktif melalui optimalisasi aset, layanan unggulan penunjang tridharma, tata kelola digital terpadu, dan kemitraan strategis BLU PTKIN.</p>
          <div class="heroactions">
            <button class="btn alt" data-tab-nav="divisi|komersial">Jelajahi 6 Divisi &rarr;</button>
            <button class="btn outline" data-tab-nav="beranda|roadmap">Roadmap 2025–2029</button>
          </div>
        </div>
      </div>
    </div>

    <div class="page container">
      <!-- Quick Nav Chips untuk sub-menu Beranda -->
      <div class="quicknav">
        ${[
          ['profil', 'Profil Lembaga'],
          ['visi', 'Visi & Misi'],
          ['roadmap', 'Roadmap 2025–2029'],
          ['prioritas', 'Program Prioritas'],
          ['struktur', 'Struktur Organisasi']
        ].map(([k, v]) => `
          <button class="chip ${sub === k ? 'active' : ''}" data-home-sub="${k}">${v}</button>
        `).join('')}
      </div>

      <!-- Konten Sub-menu Beranda yang Berubah Dinamis -->
      <div id="homecontent">
        ${homeTab()}
      </div>

      <!-- Unit Layanan 6 Divisi -->
      <section class="sectiongap">
        ${head('Unit Layanan Terpadu', 'Enam Divisi, Satu Ekosistem Bisnis', 'Jelajahi portofolio layanan P2B yang melayani kebutuhan civitas akademika, instansi, dunia usaha, dan masyarakat luas.')}
        <div class="grid three">
          ${modules.map(tile).join('')}
        </div>
      </section>

      <!-- Fokus Transformasi -->
      <section class="sectiongap">
        ${head('Fokus Transformasi BLU', 'Arah Strategis Transformasi 2025–2029', 'Fondasi kinerja berbasis produktivitas aset, diversifikasi usaha, akuntabilitas, dan tata kelola digital terpadu.')}
        <div class="grid four">
          ${[
            ['Revenue Optimization', 'Optimalisasi pendapatan unit usaha existing dan layanan kampus.'],
            ['New Revenue Streams', 'Penciptaan sumber penerimaan baru berbasis inovasi & kepakaran.'],
            ['Asset Productivity', 'Peningkatan produktivitas gedung, ruang, lahan, dan fasilitas.'],
            ['Performance & Risk', 'Perencanaan berbasis RBA, KPI berkala, dan mitigasi risiko BLU.']
          ].map(([a, b]) => `
            <div class="card tagline">
              <h3>${esc(a)}</h3>
              <p>${esc(b)}</p>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function homeTab() {
  if (sub === 'visi') {
    return `
      ${head('Arah Kelembagaan', 'Visi & Misi P2B UIN Malang', 'Arah pengembangan bisnis universitas untuk mendukung kemandirian finansial Badan Layanan Umum (BLU).')}
      <div class="grid two">
        <div class="card">
          <div class="kicker">Visi P2B 2025–2029</div>
          <h3>Profesional • Produktif • Akuntabel • Inovatif • Berkelanjutan</h3>
          <p>Menjadi pusat pengembangan bisnis universitas yang profesional, produktif, akuntabel, inovatif, dan berkelanjutan dalam mendukung kemandirian BLU serta pencapaian visi UIN Maulana Malik Ibrahim Malang sebagai perguruan tinggi Islam unggul dan bereputasi internasional.</p>
        </div>
        <div class="card">
          <div class="kicker">Fokus 5 Misi Strategis</div>
          <ol class="bullets">
            <li><strong>Optimalisasi Pendapatan:</strong> Mengoptimalkan sumber pendapatan existing dari unit bisnis dan aset produktif.</li>
            <li><strong>Inovasi Usaha Baru:</strong> Mengembangkan sumber pendapatan baru berbasis inovasi, kepakaran dosen, dan tridharma.</li>
            <li><strong>Komersialisasi & Hilirisasi:</strong> Mendorong hilirisasi riset terapan dan komersialisasi kekayaan intelektual (HKI).</li>
            <li><strong>Kemitraan Luas:</strong> Memperkuat kemitraan strategis dengan pemerintah, BUMN, industri, dan masyarakat.</li>
            <li><strong>Tata Kelola Digital:</strong> Mewujudkan tata kelola bisnis transparan, efisien, digital, dan berlandaskan Good University Governance.</li>
          </ol>
        </div>
      </div>
    `;
  }

  if (sub === 'roadmap') {
    return `
      ${head('Perencanaan Strategis', 'Roadmap P2B (2025–2029)', 'Tahapan langkah strategis pengembangan bisnis sesuai Buku Profil dan Renstra P2B UIN Malang.')}
      <div class="road">
        ${roadmap.map(x => `
          <div class="card ${x[0] === '2026' ? 'active-year' : ''}">
            <h3>${esc(x[0])}</h3>
            <strong>${esc(x[1])} ${x[0] === '2026' ? '(Tahun Berjalan)' : ''}</strong>
            <p>${esc(x[2])}</p>
          </div>
        `).join('')}
      </div>
      <p class="smallnote">Roadmap ini merupakan peta jalan strategis jangka menengah kelembagaan P2B UIN Malang.</p>
    `;
  }

  if (sub === 'prioritas') {
    return `
      ${head('Rencana Kerja', 'Program Prioritas P2B', 'Fokus inisiatif utama yang diadaptasi dari Rencana Strategis (Renstra) P2B 2025–2029.')}
      <div class="grid two">
        ${priorities.map((x, i) => `
          <div class="card badgeicon">
            <span class="glyph" style="flex:none">${String(i + 1).padStart(2, '0')}</span>
            <strong>${esc(x)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (sub === 'struktur') {
    return `
      ${head('Tata Kelola Organisasi', 'Struktur Kepemimpinan P2B', 'Sekretaris dan seluruh manajer berada langsung di bawah Kepala P2B; divisi beroperasi dalam koordinasi terpadu.')}
      <div class="card orgtop">
        <div class="chief-photo-wrap">
          <img src="/static/kepala-p2b.jpg" alt="Foto ${esc(people[0][1])}" class="chief-photo">
        </div>
        <div class="role">${esc(people[0][0])}</div>
        <div class="name" style="font-size:17.5px; margin-top:4px;">${esc(people[0][1])}</div>
        <small class="smallnote" style="display:block; margin-top:4px; color:var(--green); font-weight:600;">Pusat Pengembangan Bisnis UIN Malang</small>
      </div>
      <div class="orgsub">
        ${people.slice(1, 5).map(x => `
          <div class="card">
            <div class="role">${esc(x[0])}</div>
            <div class="name">${esc(x[1])}</div>
          </div>
        `).join('')}
      </div>
      <div class="grid three" style="margin-top:20px;">
        ${people.slice(5).map(x => `
          <div class="card">
            <div class="role">${esc(x[0])}</div>
            <div class="name">${esc(x[1])}</div>
          </div>
        `).join('')}
      </div>
      <p class="smallnote centered">Pejabat dan koordinator divisi ditetapkan berdasarkan Surat Keputusan Rektor UIN Maulana Malik Ibrahim Malang.</p>
    `;
  }

  // Default: Profil
  return `
    ${head('Profil Lembaga', 'Pusat Pengembangan Bisnis UIN Malang', 'Unit kerja strategis pengelola usaha, kemitraan, dan layanan penunjang nonakademik universitas.')}
    <div class="intro">
      <div class="grid two">
        <div>
          <div class="kicker">Landasan Kelembagaan</div>
          <h2 style="font-size:25px; line-height:1.35; color:var(--green-dark); margin:10px 0 16px;">Meningkatkan kemandirian BLU dan produktivitas aset universitas.</h2>
          <p>P2B bertugas mengoordinasikan pengelolaan usaha, pemasaran, inovasi bisnis, optimalisasi fasilitas, serta kemitraan produktif di seluruh kampus UIN Maulana Malik Ibrahim Malang.</p>
        </div>
        <div>
          <p>Cakupan portofolio mencakup 6 pilar: Divisi Komersial & Aset (Rumah Singgah, Maliki Laundry, Kantin, Persewaan), Klinik Pratama, UIN Maliki Press, Pendidikan & Pelatihan, Lembaga Pemeriksa Halal (LPH), dan Halal Center.</p>
          <p>Seluruh unit usaha diarahkan pada peningkatan mutu pelayanan kepada mahasiswa, dosen, serta masyarakat luas dengan kepatuhan tata kelola BLU PTKIN yang akuntabel.</p>
          <button class="btn" data-home-sub="visi">Lihat Visi &amp; Misi &rarr;</button>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   HALAMAN 2: DIVISI (KOMERSIAL, KLINIK, PRESS, DIKLAT, LPH, HALAL)
   ========================================================================== */
function divisionView() {
  let m = modules.find(x => x[0] === mod) || modules[0];
  return `
    <main class="page container">
      ${head('Portofolio Layanan', 'Enam Divisi Usaha Terintegrasi', 'Pilih divisi untuk melihat ruang lingkup layanan, koordinator bidang, serta membuka modul kendali internal.')}
      
      <!-- Quick Nav Chips untuk 6 Divisi -->
      <div class="quicknav">
        ${modules.map(x => `
          <button class="chip ${mod === x[0] ? 'active' : ''}" data-div-mod="${x[0]}">${x[1]}</button>
        `).join('')}
      </div>

      <!-- Banner Info Divisi Aktif -->
      <div class="card" style="background:linear-gradient(110deg,#eaf5f0 0%,#ffffff 100%); margin-bottom:24px; border-left:4px solid var(--green);">
        <div style="display:flex; align-items:center; gap:16px;">
          <div>
            <h2 class="sectiontitle" style="margin:0 0 6px 0; font-size:26px;">${esc(m[1])}</h2>
            <p style="margin:0; color:var(--muted);">${esc(m[3])}</p>
          </div>
        </div>
      </div>

      <!-- Konten Spesifik Divisi -->
      ${mod === 'komersial' ? commercialView() : otherDivisionView(mod)}
    </main>
  `;
}

const merchandiseWa = '6281217122934'; // CP Komersial
const rumahSinggahWa = '6281288335532'; // CP Rumah Singgah

// Format: [nama, harga, deskripsi singkat, nama file foto (kosongkan '' kalau belum ada)]
const merchandiseList = [
  ['Kaos UIN Maliki', 95000, 'Kaos katun dengan sablon logo UIN Maliki Malang, tersedia berbagai warna.', 'Kaos.jpeg'],
  ['Mug Maliki Islamic University', 35000, 'Mug keramik dengan desain Maliki Islamic University dan The Ulul Albab Journey.', 'Mug.jpeg'],
  ['Lanyard Ulul Albab', 15000, 'Lanyard dengan motif khas UIN Maliki, tersedia warna hijau, putih, dan biru.', 'Lanyard.jpeg'],
  ['Songkok Exclusive', 75000, 'Songkok hitam eksklusif dengan logo Maliki Islamic University.', 'Songkok.jpeg'],
  ['Tote Bag UIN Maliki', 45000, 'Tote bag dengan logo UIN Maliki Malang, tersedia bahan kanvas, spunbond, dan denim.', 'Tote bag.jpeg'],
  ['Korek UIN Maliki', 10000, 'Korek api dengan logo UIN Maliki Malang.', 'Korek.jpeg']
];

const marketplaceTabs = [
  ['belanja', 'Belanja', 'Mart & Merchandise Resmi Kampus'],
  ['rumah_singgah', 'Pesan Rumah Singgah', 'Reservasi Kamar Tamu & Penginapan'],
  ['sewa_ruang', 'Sewa Ruang', 'Hall Pertemuan, Ruang Rapat & Kelas'],
  ['sewa_gedung', 'Sewa Gedung & Lahan', 'Gedung Serbaguna, Aula & Area Terbuka']
];

const rumahSinggahList = [
  ['Kamar Tamu Reguler (K01 – K08)', 250000, 'per malam', 'Kamar nyaman untuk tamu akademik, wali mahasiswa, dan umum. Tersedia 8 unit kamar terstandarisasi.', ['AC & TV LED', 'Kamar Mandi Dalam (Water Heater)', 'Wi-Fi Kampus Cepat', '2 Tempat Tidur / Twin Bed', 'Air Mineral & Perlengkapan Mandi']],
  ['Kamar Tamu VIP / Family (K09 – K12)', 350000, 'per malam', 'Kamar lebih luas dengan fasilitas ekstra untuk tamu kehormatan, narasumber, atau keluarga civitas.', ['AC, Smart TV & Meja Kerja', 'Kamar Mandi Dalam + Water Heater', 'Double / King Bed Nyaman', 'Area Duduk & Sofa Tamu', 'Layanan Kebersihan Harian']],
  ['Paket Menginap Rombongan / Kegiatan', 225000, 'per kamar / malam (min. 5 kamar)', 'Harga khusus untuk rombongan studi banding, peserta konferensi, atau kegiatan resmi fakultas/lembaga.', ['Akses Parkir Bus & Kendaraan Luas', 'Dekat Masjid & Kantin Kampus', 'Opsi Tambahan Konsumsi / Catering', 'Check-in Fleksibel Sesuai Jadwal']]
];

const sewaRuangList = [
  ['Hall Besar Lt. 4 (Kode: HB4)', 1500000, 'per sesi / hari', 'Ruang pertemuan representatif berkapasitas besar untuk seminar, workshop, rapat kerja, dan pelatihan.', 'Kapasitas ±150–200 Orang', ['Full AC Sentral', 'Sound System & Wireless Mic', 'Proyektor LCD / Layar Lebar', 'Kursi & Meja Konferensi', 'Akses Lift & Lobby']],
  ['Hall Kecil A Lt. 3 (Kode: HK3A)', 750000, 'per sesi / hari', 'Ruang rapat menengah yang ideal untuk diskusi panel, FGD, ujian terbuka, atau bimbingan teknis.', 'Kapasitas ±50–75 Orang', ['AC & Tata Suara Standar', 'Smart TV / Proyektor', 'Papan Tulis / Flipchart', 'Wi-Fi Dedicated', 'Meja & Kursi Modular']],
  ['Hall Kecil B Lt. 3 (Kode: HK3B)', 750000, 'per sesi / hari', 'Ruang pertemuan nyaman untuk rapat koordinasi mitra, pelatihan singkat, dan kegiatan organisasi.', 'Kapasitas ±50–75 Orang', ['AC & Sound System', 'Proyektor & Layar', 'Konfigurasi Kursi Fleksibel', 'Koneksi Internet Cepat', 'Area Transit Tamu']],
  ['Ruang Kelas & Pelatihan Profesi', 450000, 'per sesi / hari', 'Ruang kelas berstandar akademik untuk kursus bahasa, sertifikasi kompetensi BNSP, dan bimbel.', 'Kapasitas ±30–40 Orang', ['AC & Pencahayaan Optimal', 'LCD Proyektor & Whiteboard', 'Kursi Kuliah / Meja Lipat', 'Lingkungan Kondusif']]
];

const sewaGedungList = [
  ['Gedung Serbaguna / Auditorium Kampus', 7500000, 'per hari', 'Gedung berkapasitas besar untuk acara wisuda, konferensi internasional, simposium, dan resepsi.', 'Kapasitas ±800–1.500 Orang', ['Panggung Utama & Backstage', 'Tata Suara & Lighting Profesional', 'Ruang VIP Transit', 'Area Parkir Luas & Keamanan', 'Dukungan Kebersihan & Teknisi']],
  ['Aula Sport Center & Gelanggang', 4500000, 'per hari', 'Fasilitas indoor serbaguna untuk turnamen olahraga, expo pendidikan, bursa kerja (job fair), dan gathering.', 'Kapasitas ±500–1.000 Orang', ['Tribun Penonton', 'Lapangan Indoor Standar', 'Ruang Ganti & Toilet Lengkap', 'Akses Loading Barang Mudah']],
  ['Lahan Terbuka & Area Bazar / Event', 1500000, 'per hari / zona', 'Area terbuka strategis di lingkungan kampus untuk pameran UMKM, bazar mahasiswa, dan festival.', 'Zona Strategis Kampus', ['Akses Listrik & Air', 'Titik Strategis Lalu Lintas Civitas', 'Izin Keramaian Internal Kampus', 'Opsi Sewa Tenda & Booth']],
  ['Kios Komersial & Space Tenant Kampus', 12000000, 'per tahun / kontrak PKS', 'Penyewaan ruang usaha, gerai kantin, layanan perbankan/ATM, dan kemitraan ritel di Kampus 1, 2, & 3.', 'Mitra Usaha & UMKM', ['Kontrak Resmi PKS BLU', 'Pasar Aktif Ribuan Mahasiswa', 'Ekosistem Transaksi Cashless QRIS', 'Fasilitas Listrik & Keamanan 24 Jam']]
];

function commercialView() {
  return `
    ${head('Modul Kendali Operasional', 'Pusat Kendali Divisi Komersial & Aset', 'Empat aplikasi operasional utama terintegrasi untuk mengelola layanan penunjang dan aset produktif.')}
    <p class="smallnote" style="margin-bottom:14px;">Modul di bawah ini khusus staf P2B dan memerlukan login untuk dibuka.</p>
    
    <div class="grid four">
      ${[
        ['rumah_reservasi', '', 'Rumah Singgah', 'Reservasi 12 kamar tamu & 3 hall pertemuan, okupansi, kas dan stok.', 'Buka Reservasi'],
        ['laundry', '', 'Maliki Laundry', 'Catatan transaksi harian dan 3 cabang laundry kampus (Kampus 1 & 3).', 'Buka Laundry'],
        ['kantin', '', 'Kendali Kantin', 'Daftar tenant, skema bagi hasil/sewa, omset, setoran dan tagihan.', 'Buka Kantin'],
        ['persewaan', '', 'Persewaan Aset', 'Penyewaan gedung serbaguna, ruang pertemuan, lahan, dan peralatan.', 'Buka Persewaan']
      ].map(x => `
        <div class="card">
          <h3>${esc(x[2])}</h3>
          <p>${esc(x[3])}</p>
          <button class="btn sm" data-open-module="${x[0]}" style="width:100%; margin-top:8px;">${x[4]} &rarr;</button>
        </div>
      `).join('')}
    </div>

    <div class="sectiongap">
      ${head('Layanan Pendukung Komersial', 'Pemanfaatan Aset & Peluang Usaha', 'Optimalisasi properti kampus dengan prinsip kepatuhan BLU dan pelayanan profesional.')}
      <div class="grid three">
        ${[
          'Catering & Pemesanan Konsumsi Kegiatan',
          'Ticketing Perjalanan Dinas & Kegiatan Tamu',
          'Mart & Penjualan Merchandise Resmi Kampus',
          'Pemanfaatan Lahan, Kios & Properti Strategis',
          'Persewaan Ruang Kerja Bersama & Event',
          'Inkubasi Peluang Usaha & Kemitraan Komersial'
        ].map(x => `
          <div class="card" style="display:flex; align-items:center; gap:12px;">
            <strong style="color:var(--green-dark); font-size:14px;">${esc(x)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function marketplaceView() {
  if (!marketplaceTabs.some(x => x[0] === marketTab)) marketTab = 'belanja';
  return `
    <main class="page container">
      ${head('Ekosistem Komersial & Aset', 'Marketplace P2B UIN Malang', 'Pusat pemesanan merchandise resmi, reservasi rumah singgah, penyewaan ruang pertemuan, serta sewa gedung dan lahan kampus.')}

      <!-- Sub-menu Marketplace -->
      <div class="quicknav market-tabs">
        ${marketplaceTabs.map(([k, label]) => `
          <button class="chip ${marketTab === k ? 'active' : ''}" data-market-tab="${k}">${esc(label)}</button>
        `).join('')}
      </div>

      <div id="marketContent">
        ${marketplaceTabContent()}
      </div>
    </main>
  `;
}

function marketplaceTabContent() {
  if (marketTab === 'rumah_singgah') {
    return `
      <div class="card market-banner">
        <div>
          <span class="pill">Penginapan Resmi Kampus • 12 Kamar Tamu</span>
          <h3 style="font-size:22px; margin:8px 0 6px;">Pesan Rumah Singgah P2B UIN Malang</h3>
          <p style="margin:0;">Layanan penginapan bersih, nyaman, dan islami di lingkungan kampus bagi tamu universitas, wali mahasiswa, peserta kegiatan, dan masyarakat umum.</p>
        </div>
        <div class="market-banner-actions">
          <a class="cp-wa" target="_blank" rel="noopener noreferrer"
             href="https://wa.me/${rumahSinggahWa}?text=${encodeURIComponent('Halo Admin Rumah Singgah P2B UIN Malang, saya ingin menanyakan ketersediaan kamar.')}">Chat CP Rumah Singgah</a>
          <button class="ghost" data-open-module="rumah_reservasi">Kalender Okupansi (Staf)</button>
        </div>
      </div>

      <div class="grid three">
        ${rumahSinggahList.map(([name, price, unit, desc, perks]) => `
          <div class="card rental-card">
            <div class="rental-head">
              <span class="pill">Tersedia Reservasi</span>
            </div>
            <h3>${esc(name)}</h3>
            <p>${esc(desc)}</p>
            <ul class="rental-perks">
              ${perks.map(p => `<li>${esc(p)}</li>`).join('')}
            </ul>
            <div class="rental-foot">
              <div>
                <small style="color:var(--muted); display:block;">Mulai dari</small>
                <div class="merch-price">${rup(price)} <span style="font-size:12px; font-weight:600; color:var(--muted);">${esc(unit)}</span></div>
              </div>
              <a class="cp-wa" target="_blank" rel="noopener noreferrer"
                 href="https://wa.me/${rumahSinggahWa}?text=${encodeURIComponent('Halo Admin Rumah Singgah P2B, saya ingin memesan ' + name + ' untuk tanggal ...')}">Pesan Kamar</a>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:20px; background:var(--mint); border-color:var(--green);">
        <strong style="color:var(--green-dark); display:block; margin-bottom:8px;">Ketentuan &amp; Cara Reservasi Rumah Singgah</strong>
        <ol class="bullets">
          <li>Pilih tipe kamar dan klik tombol <strong>Pesan Kamar</strong> untuk terhubung ke WhatsApp CP Rumah Singgah (<strong>+62 812-8833-5532</strong>).</li>
          <li>Informasikan tanggal <em>Check-in</em>, <em>Check-out</em>, jumlah tamu, dan identitas pemesan.</li>
          <li>Konfirmasi ketersediaan kamar dan lakukan pembayaran uang muka (DP) atau pelunasan sesuai petunjuk admin.</li>
          <li>Waktu <em>Check-in</em> mulai pukul 14.00 WIB dan <em>Check-out</em> maksimal pukul 12.00 WIB.</li>
        </ol>
      </div>
    `;
  }

  if (marketTab === 'sewa_ruang') {
    return `
      <div class="card market-banner">
        <div>
          <span class="pill">Fasilitas Ruang Pertemuan &amp; Kelas</span>
          <h3 style="font-size:22px; margin:8px 0 6px;">Sewa Ruang Pertemuan, Hall &amp; Kelas</h3>
          <p style="margin:0;">Solusi ruang rapat, hall seminar, ruang pelatihan, dan ujian dengan fasilitas penunjang lengkap di lingkungan UIN Maulana Malik Ibrahim Malang.</p>
        </div>
        <div class="market-banner-actions">
          <a class="cp-wa" target="_blank" rel="noopener noreferrer"
             href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo Admin Komersial P2B, saya ingin menanyakan ketersediaan sewa ruang pertemuan.')}">Hubungi CP Komersial</a>
          <button class="ghost" data-open-module="persewaan">Modul Persewaan (Staf)</button>
        </div>
      </div>

      <div class="grid two">
        ${sewaRuangList.map(([name, price, unit, desc, cap, perks]) => `
          <div class="card rental-card">
            <div class="rental-head">
              <span class="pill">${esc(cap)}</span>
            </div>
            <h3>${esc(name)}</h3>
            <p>${esc(desc)}</p>
            <ul class="rental-perks">
              ${perks.map(p => `<li>${esc(p)}</li>`).join('')}
            </ul>
            <div class="rental-foot">
              <div>
                <small style="color:var(--muted); display:block;">Estimasi Tarif BLU</small>
                <div class="merch-price">${rup(price)} <span style="font-size:12px; font-weight:600; color:var(--muted);">${esc(unit)}</span></div>
              </div>
              <a class="cp-wa" target="_blank" rel="noopener noreferrer"
                 href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo Admin P2B, saya ingin menyewa ruang ' + name + ' untuk kegiatan pada tanggal ...')}">Sewa Ruang</a>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:20px; background:var(--mint); border-color:var(--green);">
        <strong style="color:var(--green-dark); display:block; margin-bottom:8px;">Prosedur Penyewaan Ruang</strong>
        <ol class="bullets">
          <li>Pilih ruangan yang sesuai dengan kapasitas acara Anda, lalu klik <strong>Sewa Ruang</strong>.</li>
          <li>Konsultasikan jadwal ketersediaan tanggal, durasi penggunaan, serta kebutuhan tambahan (konsumsi/catering P2B) dengan CP Komersial.</li>
          <li>Ajukan surat permohonan atau formulir pemesanan dan selesaikan administrasi pembayaran sesuai tarif resmi BLU.</li>
        </ol>
      </div>
    `;
  }

  if (marketTab === 'sewa_gedung') {
    return `
      <div class="card market-banner">
        <div>
          <span class="pill">Optimalisasi Aset Gedung &amp; Lahan BLU</span>
          <h3 style="font-size:22px; margin:8px 0 6px;">Sewa Gedung Serbaguna, Aula &amp; Lahan Kampus</h3>
          <p style="margin:0;">Penyewaan fasilitas gedung kapasitas besar, gelanggang olahraga, area pameran/bazar terbuka, hingga ruang usaha tenant dan kemitraan komersial.</p>
        </div>
        <div class="market-banner-actions">
          <a class="cp-wa" target="_blank" rel="noopener noreferrer"
             href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo Admin Komersial P2B, saya ingin berkonsultasi mengenai penyewaan gedung/lahan kampus.')}">Konsultasi Sewa Aset</a>
          <button class="ghost" data-open-module="persewaan">Modul Persewaan (Staf)</button>
        </div>
      </div>

      <div class="grid two">
        ${sewaGedungList.map(([name, price, unit, desc, cap, perks]) => `
          <div class="card rental-card">
            <div class="rental-head">
              <span class="pill">${esc(cap)}</span>
            </div>
            <h3>${esc(name)}</h3>
            <p>${esc(desc)}</p>
            <ul class="rental-perks">
              ${perks.map(p => `<li>${esc(p)}</li>`).join('')}
            </ul>
            <div class="rental-foot">
              <div>
                <small style="color:var(--muted); display:block;">Estimasi Tarif BLU</small>
                <div class="merch-price">${rup(price)} <span style="font-size:12px; font-weight:600; color:var(--muted);">${esc(unit)}</span></div>
              </div>
              <a class="cp-wa" target="_blank" rel="noopener noreferrer"
                 href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo Admin P2B, saya ingin mengajukan sewa ' + name + ' untuk tanggal/periode ...')}">Ajukan Sewa</a>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:20px; background:var(--mint); border-color:var(--green);">
        <strong style="color:var(--green-dark); display:block; margin-bottom:8px;">Ketentuan Sewa Gedung &amp; Lahan Kampus</strong>
        <ol class="bullets">
          <li>Klik tombol <strong>Ajukan Sewa</strong> pada fasilitas gedung atau lahan yang diinginkan untuk menghubungi CP Komersial P2B.</li>
          <li>Untuk penggunaan gedung skala besar atau sewa lahan/tenant jangka panjang, dapat dilanjutkan dengan penerbitan Perjanjian Kerja Sama (PKS).</li>
          <li>Seluruh kegiatan wajib mematuhi tata tertib, norma ketertiban, dan ketentuan Badan Layanan Umum (BLU) UIN Maulana Malik Ibrahim Malang.</li>
        </ol>
      </div>
    `;
  }

  // Default: belanja (Mart & Merchandise)
  return `
    <div class="card market-banner">
      <div>
        <span class="pill">Mart &amp; Merchandise Resmi</span>
        <h3 style="font-size:22px; margin:8px 0 6px;">Belanja Produk &amp; Merchandise UIN Maliki</h3>
        <p style="margin:0;">Koleksi atribut, cendera mata, dan produk resmi kampus untuk civitas akademika, alumni, tamu, dan masyarakat umum.</p>
      </div>
      <div class="market-banner-actions">
        <a class="cp-wa" target="_blank" rel="noopener noreferrer"
           href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo admin P2B, saya ingin bertanya tentang katalog merchandise UIN Maliki.')}">Hubungi CP Mart &amp; Merch</a>
      </div>
    </div>

    <div class="merch-grid">
      ${merchandiseList.map(([name, price, desc, img]) => `
        <div class="card merch-card">
          ${img
            ? `<img class="merch-img" src="/static/merch/${esc(img)}" alt="${esc(name)}">`
            : `<div class="merch-img merch-noimg">Foto produk</div>`}
          <h4>${esc(name)}</h4>
          <p>${esc(desc)}</p>
          <div class="merch-price">${rup(price)}</div>
          <a class="cp-wa" target="_blank" rel="noopener noreferrer"
             href="https://wa.me/${merchandiseWa}?text=${encodeURIComponent('Halo admin P2B, saya ingin memesan ' + name)}">Pesan via WhatsApp</a>
        </div>
      `).join('')}
    </div>

    <!-- Panduan Cara Pemesanan -->
    <div class="card" style="margin-top:20px; background:var(--mint); border-color:var(--green);">
      <strong style="color:var(--green-dark); display:block; margin-bottom:8px;">Cara Pemesanan Merchandise</strong>
      <ol class="bullets">
        <li>Pilih produk, lalu klik tombol <strong>Pesan via WhatsApp</strong>.</li>
        <li>Konfirmasi ketersediaan stok, ukuran, dan jumlah pesanan dengan admin.</li>
        <li>Lakukan pembayaran sesuai arahan admin.</li>
        <li>Ambil pesanan di Kantor P2B (Kampus 1, Gedung Rektorat) atau sesuai kesepakatan.</li>
      </ol>
      <small style="color:var(--muted);">Harga dan ketersediaan produk dapat berubah sewaktu-waktu.</small>
    </div>
  `;
}

function otherDivisionView(k) {
  let list = offerings[k] || [];
  let divPerson = people.find(p => p[0].toLowerCase().includes(k)) || ['Koordinator', 'Pengelola Divisi P2B'];
  return `
    <div class="grid two">
      ${list.map((x, i) => `
        <div class="card">
          <span class="pill">Layanan Unggulan ${i + 1}</span>
          <h3 style="margin-top:12px;">${esc(x)}</h3>
          <p>Layanan terstandarisasi untuk mendukung kebutuhan civitas akademika, instansi mitra, maupun masyarakat luas.</p>
        </div>
      `).join('')}
    </div>

    <div class="card" style="margin-top:24px; background:var(--mint); border-color:var(--green);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div>
          <strong style="color:var(--green-dark); font-size:15px; display:block;">Koordinator Bidang: ${esc(divPerson[1])}</strong>
          <small style="color:var(--muted);">Untuk pengajuan kerja sama atau informasi operasional divisi ini, silakan hubungi kontak sekretariat P2B.</small>
        </div>
        <button class="btn" data-tab-nav="kontak|">Hubungi Layanan &rarr;</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   HALAMAN 3: INFO & BERITA
   ========================================================================== */
function newsView() {
  return `
    <main class="page container">
      ${head('Publikasi & Informasi', 'Info & Berita Resmi P2B', 'Kanal publikasi kegiatan, pengumuman layanan, kemitraan strategis, dan perkembangan bisnis P2B UIN Malang.')}
      
      <div id="newsGrid" class="grid three">
        ${publicNewsList.length ? publicNewsList.map(x => `
          <article class="card">
            <span class="pill">Publikasi P2B</span>
            <p class="smallnote" style="margin-top:12px;">${esc(x.date || '')}</p>
            <h3>${esc(x.title || 'Informasi')}</h3>
            <p>${esc(x.summary || '')}</p>
            ${x.link && /^https?:\/\//.test(x.link) ? `<a class="arrowlink" target="_blank" rel="noopener noreferrer" href="${esc(x.link)}">Baca selengkapnya &rarr;</a>` : ''}
          </article>
        `).join('') : `
          <div class="card" style="grid-column:1/-1; text-align:center; padding:48px 24px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin:0 auto 12px; display:block; color:var(--muted);"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
            <h3 style="margin-top:0;">Belum Ada Berita Diterbitkan</h3>
            <p>Pengumuman resmi dan liputan kegiatan P2B akan ditampilkan di sini setelah dipublikasikan melalui Dashboard.</p>
            <a class="arrowlink" target="_blank" rel="noopener" href="https://uin-malang.ac.id/">Kunjungi Berita Universitas ↗</a>
          </div>
        `}
      </div>
    </main>
  `;
}

/* ==========================================================================
   HALAMAN 4: KERJA SAMA (KENDALI PKS)
   ========================================================================== */
function cooperationView() {
  return `
    <main class="page container">
      ${head('Kemitraan Strategis', 'Kerja Sama & Kendali PKS', 'Pengembangan kemitraan industri, BUMN, perbankan, register perjanjian kerja sama (PKS), dan pengendalian tagihan piutang.')}
      
      <div class="grid two">
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="glyph">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a2 2 0 0 0 0-2.8l-3.4-3.4a2 2 0 0 0-2.8 0L9 12"></path><path d="m3 7 3-3a2 2 0 0 1 2.8 0l3.4 3.4a2 2 0 0 1 0 2.8L8 14.4"></path><path d="m6 10-3 3a2 2 0 0 0 0 2.8l3.4 3.4a2 2 0 0 0 2.8 0l2.8-2.8"></path></svg>
            </div>
            <h3 style="font-size:20px;">Pengembangan Kemitraan &amp; Kolaborasi</h3>
            <p>P2B membuka pintu kemitraan seluas-luasnya dengan BUMN, korporasi swasta, perbankan nasional, lembaga keagamaan, dan UMKM untuk pemanfaatan aset bersama, hilirisasi produk inovasi, dan peningkatan layanan kampus.</p>
          </div>
          <button class="btn" data-tab-nav="kontak|" style="width:fit-content; margin-top:14px;">Ajukan Proposal Kerja Sama &rarr;</button>
        </div>

        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--gold);">
          <div>
            <div class="glyph">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            </div>
            <h3 style="font-size:20px;">Aplikasi Kendali PKS &amp; Tagihan</h3>
            <p>Modul kendali digital untuk memantau siklus dokumen PKS, batas waktu kontrak mitra, jadwal tagihan termin, rekonsiliasi piutang, dan penugasan PIC operasional.</p>
          </div>
          <button class="btn alt" data-open-module="pks" style="width:fit-content; margin-top:14px;">Buka Modul Kendali PKS &rarr;</button>
        </div>
      </div>

      <div class="notice ok">
        <strong>Kepatuhan Regulasi BLU:</strong> Setiap naskah kerja sama operasional dan pemanfaatan aset kampus tunduk pada peraturan perundang-undangan BLU PTKIN dan disahkan oleh pimpinan UIN Maulana Malik Ibrahim Malang.
      </div>
    </main>
  `;
}

/* ==========================================================================
   HALAMAN 5: KONTAK
   ========================================================================== */
const divisionContacts = [
  ['CP Klinik', '+62 895-3392-36000', '62895339236000'],
  ['CP LPH', '+62 858-1100-0565', '6285811000565'],
  ['CP Penerbitan', '+62 851-6869-4146', '6285168694146'],
  ['CP Komersil', '+62 812-1712-2934', '6281217122934'],
  ['CP Pendidikan & Pelatihan', '+62 857-3250-4095', '6285732504095'],
  ['CP Rumah Singgah', '+62 812-8833-5532', '6281288335532']
];

function contactView() {
  return `
    <main class="page container">
      ${head('Hubungi Kami', 'Kontak & Informasi Layanan P2B', 'Informasi alamat kantor, kanal resmi universitas, jam operasional, dan formulir pengajuan informasi.')}
      
      <div class="grid two">
        <div class="card">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--line);">
            <img src="/static/emblem-uin.png" alt="UIN Malang" width="48" height="48">
            <div>
              <strong style="color:var(--green-dark); font-size:16px; display:block;">Pusat Pengembangan Bisnis (P2B)</strong>
              <small style="color:var(--muted);">UIN Maulana Malik Ibrahim Malang</small>
            </div>
          </div>
          <p><strong>Alamat Kantor:</strong><br>Jl. Gajayana No. 50, Dinoyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144</p>
          <p><strong>Lokasi Kantor P2B:</strong><br>Kampus 1, Gedung Rektorat / Kantor Layanan Bisnis Terpadu</p>
          <p><strong>Telepon Resmi:</strong><br><a href="tel:+62341551354" style="color:var(--green); font-weight:700;">(0341) 551354</a></p>
          <p><strong>Portal Utama Kampus:</strong><br><a href="https://uin-malang.ac.id/" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">https://uin-malang.ac.id/</a></p>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">Kirim Pesan / Pengajuan Informasi</h3>
          <p class="smallnote" style="margin-bottom:16px;">Sampaikan permohonan informasi sewa aset, layanan klinik, penerbitan, atau penawaran kerja sama.</p>
          <form id="contactForm" class="formgrid">
            <label class="field"><span class="input-label-text">Nama Lengkap</span><input name="name" required placeholder="Nama Anda"></label>
            <label class="field"><span class="input-label-text">Alamat Email</span><input name="email" type="email" required placeholder="email@contoh.com"></label>
            <label class="field full"><span class="input-label-text">Perihal / Subjek</span><input name="subject" required placeholder="contoh: Permohonan Sewa Gedung Serbaguna"></label>
            <label class="field full"><span class="input-label-text">Isi Pesan</span><textarea name="message" required placeholder="Tuliskan rincian kebutuhan Anda..."></textarea></label>
            <div class="full">
              <button class="btn" type="submit">Kirim Pesan</button>
            </div>
          </form>
        </div>
      </div>

      <section class="cp-section">
        <div class="kicker">Kontak Divisi</div>
        <h3 class="cp-title">Contact Person Divisi P2B</h3>
        <div class="cp-grid">
          ${divisionContacts.map(([name, phone, wa]) => `
            <div class="card cp-card">
              <h4>${esc(name)}</h4>
              <a class="cp-phone" href="tel:+${wa}">${esc(phone)}</a>
              <a class="cp-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>
            </div>
          `).join('')}
        </div>
      </section>
    </main>
  `;
}

/* ==========================================================================
   EVENT LISTENER HALAMAN PUBLIK
   ========================================================================== */
function attachViewListeners() {
  // Sub-nav Beranda chips
  document.querySelectorAll('[data-home-sub]').forEach(b => {
    b.onclick = () => {
      sub = b.dataset.homeSub;
      location.hash = 'beranda/' + sub;
      const el = $('homecontent');
      if (el) el.innerHTML = homeTab();
      document.querySelectorAll('[data-home-sub]').forEach(x => x.classList.toggle('active', x.dataset.homeSub === sub));
      attachViewListeners();
    };
  });

  // Divisi mod chips
  document.querySelectorAll('[data-div-mod]').forEach(b => {
    b.onclick = () => {
      mod = b.dataset.divMod;
      location.hash = 'divisi/' + mod;
      draw();
    };
  });

  // Marketplace tab chips
  document.querySelectorAll('[data-market-tab]').forEach(b => {
    b.onclick = () => {
      marketTab = b.dataset.marketTab;
      location.hash = 'marketplace/' + marketTab;
      draw();
    };
  });

  // Links via data-tab-nav
  document.querySelectorAll('[data-tab-nav]').forEach(b => {
    b.onclick = e => {
      e.preventDefault();
      const [to, tab] = b.dataset.tabNav.split('|');
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      nav(to, tab);
    };
  });

  // Open internal module buttons
  document.querySelectorAll('[data-open-module]').forEach(b => {
    b.onclick = () => {
      const targetMod = b.dataset.openModule;
      if (user) {
        internal();
        navigate(targetMod);
      } else {
        $('authOverlay').hidden = false;
        toast('Silakan masuk dengan akun staf/pejabat untuk membuka modul.');
      }
    };
  });

  // Contact form submission
  const cf = $('contactForm');
  if (cf) {
    cf.onsubmit = e => {
      e.preventDefault();
      toast('Terima kasih! Pesan Anda telah dicatat oleh sistem P2B.');
      cf.reset();
    };
  }
}

/* ==========================================================================
   INTERNAL CONTROL CENTER (WORKSPACE STAF & KEPALA P2B)
   ========================================================================== */
if ($('menuToggle')) {
  $('menuToggle').onclick = () => $('publicNav').classList.toggle('open');
}

function updateAccessBtn() {
  const btn = $('accessBtn');
  if (!btn) return;
  if (!user) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span>Dashboard Kepala P2B</span>`;
    btn.onclick = () => {
      $('authOverlay').hidden = false;
    };
    return;
  }

  const isInternal = $('internalApp') && !$('internalApp').hidden;
  if (isInternal) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> <span>Lihat Beranda Publik</span>`;
    btn.onclick = () => {
      nav('beranda');
    };
  } else {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> <span>Kembali ke Dashboard</span>`;
    btn.onclick = () => {
      internal();
    };
  }
}

if ($('accessBtn')) {
  updateAccessBtn();
}

if ($('closeAuth')) {
  $('closeAuth').onclick = () => ($('authOverlay').hidden = true);
}

if ($('loginForm')) {
  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    $('authError').textContent = '';
    let d = Object.fromEntries(new FormData(e.target));
    try {
      let r = await api('/login', 'POST', d);
      token = r.access_token;
      user = r.user;
      sessionStorage.setItem('p2b_token', token);
      e.target.reset();
      $('authOverlay').hidden = true;
      internal();
      toast('Selamat datang, ' + user.name);
    } catch (err) {
      $('authError').textContent = err.message;
    }
  };
}

if ($('logoutBtn')) {
  $('logoutBtn').onclick = signout;
}

function signout() {
  token = '';
  user = null;
  sessionStorage.removeItem('p2b_token');
  if (poll) clearInterval(poll);
  $('publicSite').hidden = false;
  $('internalApp').hidden = true;
  document.querySelector('footer').hidden = false;
  updateAccessBtn();
  nav('beranda');
}

function internal() {
  $('publicSite').hidden = true;
  $('internalApp').hidden = false;
  document.querySelector('footer').hidden = true;
  updateAccessBtn();

  const roleName = ROLES.find(x => x[0] === user.role)?.[1] || user.role;
  const divName = DIVS.find(x => x[0] === user.division)?.[1] || user.division;

  $('identity').innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
      ${user.role === 'kepala' ? `
        <img src="/static/kepala-p2b.jpg" alt="Foto Kepala P2B" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--gold); flex-shrink:0;">
      ` : `
        <div style="width:36px; height:36px; border-radius:50%; background:var(--green); color:#fff; display:grid; place-items:center; font-weight:800; font-size:15px; border:2px solid var(--gold); flex-shrink:0;">
          ${esc(user.name.charAt(0).toUpperCase())}
        </div>
      `}
      <div>
        <b style="color:#ffffff; font-size:13.5px; display:block;">${esc(user.name)}</b>
        <span style="font-size:11px; color:#a7f3d0;">@${esc(user.username)}</span>
      </div>
    </div>
    <div style="font-size:11.5px; line-height:1.45; color:#d1fae5; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
      <div><strong>Peran:</strong> ${esc(roleName)}</div>
      <div><strong>Divisi:</strong> ${esc(divName)}</div>
    </div>
  `;

  const sections = [
    'dashboard', 'pks', 'tagihan', 'tugas', 'laundry',
    'rumah_reservasi', 'rumah_transaksi', 'rumah_stok',
    'kantin', 'persewaan', 'kinerja_divisi', 'berita', 'migrasi'
  ];
  if (user.role === 'kepala') sections.push('users', 'audit');

  $('sideLinks').innerHTML = sections.map(x => `
    <button class="sidelink" data-internal-page="${x}">
      <span>${esc(internalNames[x] || x)}</span>
    </button>
  `).join('');

  document.querySelectorAll('[data-internal-page]').forEach(b => {
    b.onclick = () => navigate(b.dataset.internalPage);
  });

  navigate('dashboard');
  if (poll) clearInterval(poll);
  poll = setInterval(() => {
    if (user && internalPage === 'dashboard') navigate('dashboard', true);
  }, 10000);
}

if ($('reloadBtn')) {
  $('reloadBtn').onclick = () => navigate(internalPage, true);
}

async function navigate(p, quiet = false) {
  internalPage = p;
  search = '';
  document.querySelectorAll('[data-internal-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.internalPage === p);
  });

  if ($('workTitle')) $('workTitle').textContent = internalNames[p] || p;
  if ($('syncState')) {
    $('syncState').innerHTML = `<span class="sync-pulse"></span><span class="sync-text">● Memuat...</span>`;
  }

  try {
    if (p === 'dashboard') {
      dash = await api('/dashboard');
      renderDashboard();
    } else if (p === 'users') {
      rows = await api('/users');
      renderUsers();
    } else if (p === 'audit') {
      rows = await api('/audit');
      renderAudit();
    } else if (p === 'migrasi') {
      renderMigration();
    } else {
      rows = await api('/records/' + p);
      renderRecords();
    }
    if ($('syncState')) {
      $('syncState').innerHTML = `<span class="sync-pulse"></span><span class="sync-text">● Tersinkron ` + new Date().toLocaleTimeString('id-ID') + `</span>`;
    }
  } catch (e) {
    if ($('syncState')) {
      $('syncState').innerHTML = `<span style="color:var(--red);font-weight:700;">● Kesalahan</span>`;
    }
    if ($('workBody')) {
      $('workBody').innerHTML = `<div class="alert late">${esc(e.message)}</div>`;
    }
    if (!quiet) toast(e.message);
  }
}

function stat(label, value, note = '') {
  return `<div class="stat"><small>${label}</small><div class="value">${value}</div><small>${note}</small></div>`;
}

function renderDashboard() {
  let d = dash;
  const c = d.counts || {};
  let alerts = [
    ...(d.contracts_due || []).map(x => ({ t: 'PKS: ' + (x.title || '') + ' — ' + (x.partner || ''), when: x.end })),
    ...(d.bills_due || []).map(x => ({ t: 'Tagihan ' + (x.number || '') + ' • ' + rup(x.amount), when: x.due }))
  ].sort((a, b) => a.when.localeCompare(b.when));

  $('workBody').innerHTML = `
    <div class="statgrid">
      ${stat('PKS Terdaftar', c.pks || 0, 'Semua divisi berwenang')}
      ${stat('Piutang Terdata', rup(d.receivables), 'Tagihan PKS tercatat')}
      ${stat('Piutang Terlambat', rup(d.overdue), 'Melewati jatuh tempo')}
      ${stat('Rumah Singgah Hari Ini', d.rooms_occupied + ' Terisi / ' + d.rooms_booked + ' Dipesan', 'Kamar & Hall aktif')}
      ${stat('Pendapatan Tercatat', rup(d.income), 'Laundry, Rumah Singgah, Kantin')}
      ${stat('Pengeluaran Tercatat', rup(d.expense), 'Biaya operasional')}
      ${stat('Surplus Kas', rup(d.income - d.expense), 'Saldo kas operasional')}
      ${stat('Unit Terintegrasi', '6 Divisi P2B', 'Komersial, Klinik, Press, Diklat, LPH, Halal')}
    </div>

    <div class="workgrid">
      <div class="workpanel">
        <h3>Pengingat Jatuh Tempo (30 Hari / Terlambat)</h3>
        ${alerts.length ? alerts.slice(0, 10).map(a => `
          <div class="alert ${a.when < dt() ? 'late' : ''}">
            <strong>${esc(a.t)}</strong><br>
            <span style="font-size:12px;color:var(--muted);">Jatuh Tempo: <b>${esc(a.when)}</b></span>
          </div>
        `).join('') : '<p class="subtle">Tidak ada pengingat tagihan atau kontrak mendesak saat ini.</p>'}
      </div>

      <div class="workpanel">
        <h3>Kinerja Maliki Laundry per Cabang</h3>
        ${Object.entries(d.laundry_by_site || {}).map(([k, x]) => `
          <div class="minirow">
            <span><strong>${esc(LOCS.find(z => z[0] === k)?.[1] || k)}</strong></span>
            <span>Surplus: <b style="color:var(--green);">${rup(x.income - x.expense)}</b></span>
          </div>
        `).join('') || '<p class="subtle">Belum ada transaksi laundry tercatat.</p>'}
        <p class="help">Nilai = pendapatan dikurangi pengeluaran operasional.</p>
      </div>
    </div>

    <div class="workpanel">
      <h3>Rekap Data &amp; Keuangan per Divisi</h3>
      <div class="tablewrap">
        <table class="table">
          <thead>
            <tr>
              <th>Divisi Layanan</th>
              <th>Entri</th>
              <th>Pendapatan</th>
              <th>Pengeluaran</th>
              <th>Piutang</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(d.division_summary || {}).map(([k, v]) => `
              <tr>
                <td><strong>${esc(DIVS.find(z => z[0] === k)?.[1] || k)}</strong></td>
                <td>${v.records}</td>
                <td>${rup(v.income)}</td>
                <td>${rup(v.expense)}</td>
                <td>${rup(v.receivables)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function formatValue(k, v) {
  if (v == null || v === '') return '—';
  if (moneyFields.has(k)) return rup(v);
  if (k === 'payments') return Array.isArray(v) ? rup(v.reduce((a, x) => a + Number(x.amount || 0), 0)) : '—';
  if (typeof v === 'object') return esc(JSON.stringify(v).slice(0, 150));
  return esc(String(v).slice(0, 140));
}

function renderRecords() {
  if (!S[internalPage]) return;
  $('workBody').innerHTML = `
    <div class="workpanel">
      <div class="sectionButtons">
        <button class="btn" id="addRow">+ Tambah Data</button>
        <button class="ghost" id="csvBtn">Ekspor CSV</button>
        <button class="ghost" id="reloadRows">Muat Ulang</button>
      </div>
      <div class="tabletools">
        <input id="rowSearch" class="input" placeholder="Cari data pada modul ini..." value="${esc(search)}">
      </div>
      <div class="tablewrap" id="tableRows"></div>
    </div>

    ${internalPage === 'rumah_reservasi' ? `
      <div class="workpanel">
        <h3>Kalender Okupansi Bulanan Rumah Singgah</h3>
        <label style="max-width:240px; margin-bottom:12px;">Pilih Bulan: 
          <input type="month" id="calMonth">
        </label>
        <div style="display:flex; gap:16px; margin-bottom:12px; font-size:12px;">
          <span><span style="display:inline-block;width:12px;height:12px;background:#bbf7d0;border-radius:2px;vertical-align:middle;margin-right:4px;"></span> Tersedia</span>
          <span><span style="display:inline-block;width:12px;height:12px;background:#fef08a;border-radius:2px;vertical-align:middle;margin-right:4px;"></span> Dipesan</span>
          <span><span style="display:inline-block;width:12px;height:12px;background:#fecaca;border-radius:2px;vertical-align:middle;margin-right:4px;"></span> Terisi</span>
        </div>
        <div class="calendar" id="calBody"></div>
      </div>
    ` : ''}
  `;

  $('addRow').onclick = () => openEditor();
  $('csvBtn').onclick = exportCsv;
  $('reloadRows').onclick = () => navigate(internalPage);
  $('rowSearch').oninput = e => { search = e.target.value; drawTable(); };
  drawTable();

  if (internalPage === 'rumah_reservasi') {
    $('calMonth').value = dt().slice(0, 7);
    $('calMonth').onchange = drawCalendar;
    drawCalendar();
  }
}

function drawTable() {
  let list = rows.filter(r => JSON.stringify(r.data).toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id')));
  let schema = S[internalPage], cols = schema.slice(0, 7);

  $('tableRows').innerHTML = `
    <table class="table">
      <thead>
        <tr>
          ${cols.map(x => `<th>${esc(x[1])}</th>`).join('')}
          <th style="text-align:right;">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(r => `
          <tr>
            ${cols.map(([key]) => `<td>${formatValue(key, r.data[key])}</td>`).join('')}
            <td style="text-align:right; white-space:nowrap;">
              <button class="ghost" data-edit="${r.id}">Edit</button>
              <button class="ghost" style="color:var(--red);" data-delete="${r.id}">Hapus</button>
            </td>
          </tr>
        `).join('') || `<tr><td colspan="${cols.length + 1}" style="text-align:center; padding:28px; color:var(--muted);">Belum ada data pada modul ini.</td></tr>`}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openEditor(rows.find(r => r.id === b.dataset.edit));
  });
  document.querySelectorAll('[data-delete]').forEach(b => {
    b.onclick = () => removeRow(b.dataset.delete);
  });
}

function fieldHtml(f, v) {
  let [key, label, type = 'text', options] = f;
  if (type === 'json') return `<label class="full"><span class="input-label-text">${esc(label)}</span><textarea data-key="${key}" data-kind="json" placeholder="[]">${esc(JSON.stringify(v || []))}</textarea></label>`;
  if (type === 'textarea') return `<label class="full"><span class="input-label-text">${esc(label)}</span><textarea data-key="${key}">${esc(v || '')}</textarea></label>`;
  if (type === 'checkbox') return `<label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" data-key="${key}" ${v ? 'checked' : ''} style="width:auto; margin:0;"> <span>${esc(label)}</span></label>`;
  if (type === 'select') return `<label><span class="input-label-text">${esc(label)}</span><select data-key="${key}">${(options || []).map(([a, b]) => `<option value="${esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`;
  return `<label><span class="input-label-text">${esc(label)}</span><input data-key="${key}" type="${type}" value="${esc(v ?? (type === 'date' ? dt() : ''))}" ${type === 'number' ? 'min="0" step="1"' : ''}></label>`;
}

function openEditor(r) {
  editing = r || null;
  formModule = internalPage;
  formData = r ? structuredClone(r.data) : {};

  if (internalPage === 'kinerja_divisi' && !formData.division) formData.division = user.division === 'p2b' ? 'komersial' : user.division;
  if (internalPage === 'tagihan' && !formData.payments) formData.payments = [];
  if (internalPage === 'pks' && !formData.division) formData.division = user.division === 'p2b' ? 'komersial' : user.division;
  if (['tagihan', 'tugas'].includes(internalPage) && !formData.division) formData.division = user.division === 'p2b' ? 'komersial' : user.division;

  $('editTitle').textContent = (r ? 'Ubah Data — ' : 'Tambah Data — ') + (internalNames[internalPage] || internalPage);
  $('editFields').innerHTML = S[internalPage].map(f => fieldHtml(f, formData[f[0]])).join('');
  $('editError').textContent = '';
  $('editOverlay').hidden = false;
}

if ($('closeEdit')) $('closeEdit').onclick = () => ($('editOverlay').hidden = true);
if ($('cancelEdit')) $('cancelEdit').onclick = () => ($('editOverlay').hidden = true);

if ($('editForm')) {
  $('editForm').onsubmit = async e => {
    e.preventDefault();
    let data = { ...formData };
    try {
      for (let field of $('editFields').querySelectorAll('[data-key]')) {
        let k = field.dataset.key;
        let t = S[formModule].find(x => x[0] === k)?.[2] || 'text';
        if (t === 'checkbox') data[k] = field.checked;
        else if (t === 'json') data[k] = JSON.parse(field.value || '[]');
        else if (t === 'number') data[k] = Number(field.value || 0);
        else data[k] = field.value.trim();
      }
      if (editing) {
        await api('/records/' + formModule + '/' + editing.id, 'PUT', { data });
      } else {
        await api('/records/' + formModule, 'POST', { data });
      }
      $('editOverlay').hidden = true;
      toast('Data tersimpan di server P2B.');
      navigate(formModule);
    } catch (err) {
      $('editError').textContent = err.message;
    }
  };
}

async function removeRow(id) {
  if (!confirm('Hapus permanen data ini? Tindakan dicatat pada jejak audit.')) return;
  try {
    await api('/records/' + internalPage + '/' + id, 'DELETE');
    toast('Data dihapus.');
    navigate(internalPage);
  } catch (err) {
    toast(err.message);
  }
}

function exportCsv() {
  let cols = S[internalPage].map(x => x[0]);
  let text = [
    cols.join(','),
    ...rows.map(r => cols.map(k => '"' + String(typeof r.data[k] === 'object' ? JSON.stringify(r.data[k]) : r.data[k] ?? '').replaceAll('"', '""') + '"').join(','))
  ].join('\r\n');
  download(`${internalPage}_${dt()}.csv`, '\ufeff' + text, 'text/csv;charset=utf-8');
}

function download(name, s, type) {
  let a = document.createElement('a'), blob = new Blob([s], { type });
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 400);
}

function drawCalendar() {
  let m = $('calMonth').value, year = +m.slice(0, 4), month = +m.slice(5, 7), days = new Date(year, month, 0).getDate();
  let table = '<table><thead><tr><th>Kamar / Hall</th>' + Array.from({ length: days }, (_, i) => '<th>' + (i + 1) + '</th>').join('') + '</tr></thead><tbody>';
  for (let [id, label] of ASSETS) {
    table += '<tr><th>' + esc(label) + '</th>';
    for (let i = 1; i <= days; i++) {
      let day = m + '-' + String(i).padStart(2, '0');
      let rs = rows.filter(r => r.data.assetId === id && r.data.start <= day && day < r.data.end && r.data.status !== 'Dibatalkan');
      let cls = rs.some(r => r.data.status === 'Check-in') ? 'occupied' : rs.some(r => r.data.status === 'Dipesan') ? 'booked' : 'free';
      table += `<td class="${cls}" title="${esc(label)} • ${day} • ${cls}">${cls === 'free' ? '·' : cls === 'booked' ? '●' : '■'}</td>`;
    }
    table += '</tr>';
  }
  table += '</tbody></table>';
  $('calBody').innerHTML = table;
}

function renderUsers() {
  $('workBody').innerHTML = `
    <div class="workpanel">
      <h3>Manajemen Pengguna &amp; Hak Akses Staf</h3>
      <p class="help">Hanya Kepala P2B yang berwenang membuat dan mengatur akun staf. Gunakan password minimal 12 karakter.</p>
      <form id="userForm" class="formgrid">
        <label class="field"><span class="input-label-text">Username</span><input name="username" required minlength="3"></label>
        <label class="field"><span class="input-label-text">Nama Lengkap</span><input name="name" required></label>
        <label class="field"><span class="input-label-text">Password Awal</span><input name="password" type="password" required minlength="12"></label>
        <label class="field"><span class="input-label-text">Peran</span><select name="role">${ROLES.map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label class="field"><span class="input-label-text">Divisi</span><select name="division">${DIVS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <div style="display:flex; align-items:flex-end;">
          <button class="btn" style="width:100%;">+ Tambah Akun</button>
        </div>
      </form>
    </div>

    <div class="workpanel">
      <h3>Daftar Pengguna Sistem</h3>
      <div class="tablewrap">
        <table class="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Nama</th>
              <th>Peran</th>
              <th>Divisi</th>
              <th>Status</th>
              <th style="text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(u => `
              <tr>
                <td><strong>${esc(u.username)}</strong></td>
                <td>${esc(u.name)}</td>
                <td>${esc(ROLES.find(x => x[0] === u.role)?.[1] || u.role)}</td>
                <td>${esc(DIVS.find(x => x[0] === u.division)?.[1] || u.division)}</td>
                <td><span class="pill ${u.active ? '' : 'bad'}">${u.active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td style="text-align:right; white-space:nowrap;">
                  <button class="ghost" data-pw="${u.id}">Reset Sandi</button>
                  <button class="ghost" data-active="${u.id}">${u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  $('userForm').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/users', 'POST', Object.fromEntries(new FormData(e.target)));
      toast('Akun berhasil dibuat.');
      navigate('users');
    } catch (err) {
      toast(err.message);
    }
  };

  document.querySelectorAll('[data-pw]').forEach(b => {
    b.onclick = async () => {
      let pwd = prompt('Password baru (minimal 12 karakter):');
      if (!pwd) return;
      try {
        await api('/users/' + b.dataset.pw, 'PATCH', { password: pwd });
        toast('Password berhasil diperbarui.');
      } catch (err) {
        toast(err.message);
      }
    };
  });

  document.querySelectorAll('[data-active]').forEach(b => {
    b.onclick = async () => {
      let u = rows.find(x => x.id === b.dataset.active);
      if (!confirm((u.active ? 'Nonaktifkan akun ' : 'Aktifkan kembali akun ') + u.username + '?')) return;
      try {
        await api('/users/' + u.id, 'PATCH', { active: !u.active });
        navigate('users');
      } catch (err) {
        toast(err.message);
      }
    };
  });
}

function renderAudit() {
  $('workBody').innerHTML = `
    <div class="workpanel">
      <h3>Jejak Audit Aktivitas (200 Entri Terakhir)</h3>
      <p class="help">Pencatatan riwayat perubahan untuk transparansi dan kepatuhan akuntabilitas BLU.</p>
      <div class="tablewrap">
        <table class="table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Aksi</th>
              <th>Modul</th>
              <th>ID Data</th>
              <th>Pelaku</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(x => `
              <tr>
                <td>${esc(x.at)}</td>
                <td><span class="pill">${esc(x.action)}</span></td>
                <td><strong>${esc(internalNames[x.module] || x.module)}</strong></td>
                <td><code>${esc(x.record_id)}</code></td>
                <td>${esc(x.actor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

const legacyKeys = [
  ['pks', 'p2b-kendali-pks-v1'],
  ['laundry', 'maliki-laundry-transactions-v1'],
  ['rumah', 'p2b_rumah_singgah_v2']
];

function legacyMapping(source, blob) {
  let entries = [];
  const add = (m, rs) => {
    for (let d of rs || []) {
      if (!d || typeof d !== 'object') continue;
      const v = { ...d, _legacy_id: source + ':' + (d.id || JSON.stringify(d).slice(0, 120)) };
      delete v.id;
      if (['pks', 'tagihan', 'tugas'].includes(m) && !['komersial', 'klinik', 'uin_press', 'pendidikan', 'lph', 'halal_center', 'p2b'].includes(v.division)) {
        const x = String(v.division || '').toLowerCase();
        v.division = x.includes('klinik') ? 'klinik' : x.includes('halal') ? 'halal_center' : x.includes('lph') ? 'lph' : x.includes('press') ? 'uin_press' : x.includes('pendidik') || x.includes('tsa') ? 'pendidikan' : 'komersial';
      }
      entries.push({ module: m, data: v });
    }
  };

  if (source === 'pks') {
    add('pks', blob.contracts);
    add('tagihan', blob.bills);
    add('tugas', blob.tasks);
  } else if (source === 'laundry') {
    add('laundry', blob);
  } else if (source === 'rumah') {
    add('rumah_reservasi', blob.bookings);
    add('rumah_transaksi', (blob.transactions || []).map(x => ({ ...x, amount: Number(x.amount || 0) })));
    add('rumah_stok', (blob.items || []).map(x => ({ ...x, quantity: Number(x.quantity || x.stock || 0) })));
  }
  return entries;
}

function renderMigration() {
  $('workBody').innerHTML = `
    <div class="workpanel">
      <h3>Migrasi Data dari 3 Aplikasi HTML Mandiri Lama</h3>
      <p class="help">Prosedur satu kali untuk memindahkan data dari aplikasi lama ke basis data terpusat P2B.</p>
      
      <div class="sectionButtons" style="margin-top:16px;">
        <button class="btn" id="localImport">Baca Data Browser Lama (localStorage)</button>
        <label class="ghost" style="display:inline-flex; align-items:center; cursor:pointer;">
          <span>Unggah File Cadangan JSON</span>
          <input type="file" id="legacyFile" accept=".json,application/json" style="display:none;">
        </label>
      </div>

      <div id="legacyResult" class="alert" style="margin-top:16px;">Belum ada migrasi yang dijalankan pada sesi ini.</div>
    </div>
  `;

  $('localImport').onclick = async () => {
    for (let [source, key] of legacyKeys) {
      let raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        await pushLegacy(source, JSON.parse(raw));
      } catch (e) {
        toast(e.message);
      }
    }
  };

  $('legacyFile').onchange = async e => {
    let f = e.target.files[0];
    if (!f) return;
    try {
      let blob = JSON.parse(await f.text());
      let source = Array.isArray(blob) ? 'laundry' : blob.contracts ? 'pks' : blob.bookings ? 'rumah' : null;
      if (!source) throw Error('Format berkas tidak dikenali');
      await pushLegacy(source, blob);
    } catch (err) {
      toast(err.message);
    }
  };
}

async function pushLegacy(source, blob) {
  let entries = legacyMapping(source, blob);
  if (!entries.length) {
    toast('Tidak ada data ditemukan');
    return;
  }
  if (!confirm('Impor ' + entries.length + ' entri data dari ' + source + ' ke server P2B?')) return;

  let groups = {};
  for (let e of entries) (groups[e.module] ??= []).push(e.data);
  let summary = [];
  for (let [module, rs] of Object.entries(groups)) {
    try {
      let out = await api('/import', 'POST', { module, rows: rs });
      summary.push(`${internalNames[module] || module}: ${out.imported} masuk, ${out.skipped} dilewati`);
    } catch (err) {
      summary.push(`${internalNames[module] || module}: GAGAL (${err.message})`);
    }
  }
  $('legacyResult').textContent = summary.join(' | ');
}

/* ==========================================================================
   INITIALIZATION & HASH ROUTING
   ========================================================================== */
async function fetchNews() {
  try {
    let res = await api('/public');
    publicNewsList = res.news || [];
    if (current === 'berita') {
      const g = $('newsGrid');
      if (g) g.innerHTML = newsView();
    }
  } catch (e) {
    console.warn(e);
  }
}

window.addEventListener('hashchange', () => {
  const [to, tab] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (['beranda', 'divisi', 'marketplace', 'berita', 'kerjasama', 'kontak', 'dashboard'].includes(to)) {
    current = to;
    if (to === 'beranda' && tab) sub = tab;
    if (to === 'divisi' && tab) mod = tab;
    if (to === 'marketplace' && tab) marketTab = tab;
    draw();
  }
});

// Initial hash parse
const [initial, initialTab] = decodeURIComponent(location.hash.slice(1)).split('/');
if (['beranda', 'divisi', 'marketplace', 'berita', 'kerjasama', 'kontak', 'dashboard'].includes(initial)) {
  current = initial;
  if (initial === 'beranda' && initialTab) sub = initialTab;
  if (initial === 'divisi' && initialTab) mod = initialTab;
  if (initial === 'marketplace' && initialTab) marketTab = initialTab;
}

draw();
fetchNews();

if (token) {
  api('/me').then(u => {
    user = u;
    internal();
  }).catch(() => signout());
}
