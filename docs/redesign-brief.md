# Redesign Brief — Dashboard Monitoring & Telemetering PLTA

Dokumen ini adalah **prompt lengkap** untuk meredesain ulang antarmuka aplikasi
`tele-frontend-v2` di Claude (design). Isinya: konteks produk, inventori setiap
layar beserta data yang ditampilkan, komponen reusable yang ada, aturan desain
yang tidak boleh dilanggar, dan format keluaran yang diharapkan.

Sumber: kode aktual di `src/` per Agustus 2026 (React 19 + TypeScript + Tailwind 4).

---

## 1. Konteks produk

| Aspek | Isi |
| --- | --- |
| Nama produk | PLTA Monitoring (subjudul: Jawa Tengah) |
| Klien | PLN Indonesia Power — IP Mrica, wilayah Jawa Tengah |
| Fungsi | Monitoring & telemetering pembangkit listrik tenaga air (PLTA): kondisi hidrologi harian/bulanan, tren parameter, prediksi ML, laporan Excel, input data manual, katalog konfigurasi |
| Pengguna | Operator ruang kontrol & staf hidrologi PLTA, admin sistem |
| Perangkat | Desktop 1440–1920px sebagai layar utama; harus tetap terpakai di tablet dan mobile (drawer sidebar) |
| Kondisi pemakaian | Layar dipantau lama, siang hari, ruangan terang. Tema terang wajib. Tema gelap belum ada dan tidak diminta |
| Bahasa UI | Bahasa Indonesia, non-teknis |
| Zona waktu | WIB (Asia/Jakarta), format angka `id-ID` |

### Domain yang perlu dipahami

- **Wilayah Sungai (WS)** 1 : N **PLTA**. Satu PLTA hanya punya satu WS.
- Satu PLTA punya banyak **tag/parameter** monitoring (protokol `opcua`, `modbus`, `sql`, `rest`, `upload`).
- Alur air dibagi tiga zona: **Hulu (upstream) → Bendungan (dam) → Hilir (downstream)**.
- Nilai parameter punya **sumber** berbeda dan harus terbaca bedanya:

| Sumber | Label UI | Arti |
| --- | --- | --- |
| `measured` | Realtime | Datang dari sensor/stream |
| `derived` | Formulasi | Hasil perhitungan rumus |
| `plan` | Rencana / Input | Diisi manual operator |
| `constant` | Konstanta | Nilai tetap konfigurasi |
| — | Belum tersedia | Data tidak ada (tampil `N/A` atau `—`) |

### Role dan hak akses

| Role API | Label UI | Overview | Telemetering | Forecasting | Tren | Laporan | Input GHW | Katalog | User Mgmt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `admin` | Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| — | Admin UBP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `operator` | Operator PLTA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `viewer` | Viewer | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 2. Design system yang berlaku sekarang

Boleh dievolusikan, tapi hasil redesign harus tetap terasa satu sistem dan tetap
memakai token (bukan warna acak per halaman).

### Warna

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `surface/base` | `#F8FAFC` | Latar aplikasi |
| `surface/raised` | `#FFFFFF` | Kartu, tabel, kontrol |
| `surface/overlay` | `#F1F5F9` | Area sekunder, header tabel |
| `border/subtle` | `#E2E8F0` | Border kartu, kontrol, pemisah |
| `text/primary` | `#0F172A` | Judul dan nilai utama |
| `text/secondary` | `#334155` | Isi utama |
| `text/muted` | `#64748B` | Deskripsi, label sekunder |
| `brand/primary` | `#22D3EE` | Aksen ringan |
| `brand/primary-strong` | `#0891B2` | Tombol utama, state aktif, link |
| `status/success` | `#34D399` / `#22C55E` | Normal, aktif, selesai |
| `status/warning` | `#FBBF24` / `#F59E0B` | Peringatan, menunggu |
| `status/danger` | `#F87171` / `#EF4444` | Gangguan, gagal, destruktif |
| `status/info` | `#60A5FA` | Informasi |
| Seri grafik | `#22D3EE`, `#A78BFA`, `#34D399`, `#FBBF24` (+ `#0891B2`, `#2563EB`, `#7C3AED`, `#D97706`, `#059669` di Tren) | Garis/bar grafik |

Zona hidrologi punya warna tetap: **Hulu `#22D3EE`**, **Bendungan `#F59E0B`**, **Hilir `#34D399`**.

### Tipografi

| Elemen | Font | Ukuran / bobot |
| --- | --- | --- |
| Judul halaman (`.page-title`) | Space Grotesk | 22px / 700, tracking -0.55px |
| Deskripsi halaman (`.page-description`) | Inter | 13px / 400, line-height 20px |
| Judul bagian | Inter | 16px / 600 |
| Judul kartu | Inter | 13–15px / 600 |
| Label field | Inter | 12px / 600, warna muted |
| Header tabel | Inter | 11–12px / 600, uppercase, tracking 0.06em |
| Nilai telemetri / kode / koordinat | JetBrains Mono | 11–16px |

### Spacing, radius, ukuran kontrol

| Token | Nilai |
| --- | --- |
| space xs / sm / md / lg / xl | 4 / 8 / 16 / 24 / 32 px |
| radius sm / md / lg | 6 / 10 / 16 px (kartu besar sering 12–14px) |
| Tinggi kontrol standar | 44px (`h-11`) |
| Tinggi kontrol filter kompak | 36px (`h-9`) |
| Tinggi tombol tabel/aksi kecil | 32–40px |
| Jarak judul → deskripsi halaman | 4px |
| Jarak header → konten | 24px |

---

## 3. Aturan desain yang WAJIB dipatuhi

Ini kesalahan yang paling sering diulang dan paling sering dikeluhkan.

1. **Jangan ada container di dalam container.** Tabel atau kartu tidak boleh
   dibungkus card lagi. Pakai pemisah garis (`border-t` / `border-y`) sebagai
   pembatas antar bagian, bukan kartu bertumpuk.
2. **Jangan ada garis warna aksen di atas card.** Dianggap norak.
3. **Jangan ada kartu tanggal/jam.** Pengguna bisa melihat jam di OS-nya.
4. **Judul halaman tanpa ikon dekoratif.** Ukuran judul harus sama di semua
   halaman (acuan: Overview, 22px). Tidak boleh ada halaman yang judulnya lebih
   besar dari halaman lain.
5. **Bahasa UI non-teknis.** Tulis "realtime", bukan "WebSocket". Jangan
   menampilkan nama endpoint, payload, atau istilah REST/response di layar
   operasional. Istilah teknis hanya boleh di Katalog Monitoring (protokol tag).
   Keterangan parameter harus singkat: "belum tersedia", "konstanta",
   "formulasi", "realtime".
6. **Panel dropdown muncul di bawah field**, selebar field, jarak 8px, tidak
   menutupi field yang sedang dibuka.
7. **Skeleton/shimmer harus mengikuti bentuk konten aslinya**, dan hanya dipasang
   di area yang benar-benar memuat data. Jangan memasang shimmer di sidebar atau
   area statis.
8. **Form create/edit/query memakai dialog sheet** (panel geser dari kanan),
   bukan halaman terpisah.
9. **Aksi destruktif (hapus, logout) lewat confirm dialog reusable.**
10. **Toggle status aktif/nonaktif memakai komponen status toggle**, bukan checkbox.
11. **Bayangan hanya untuk elemen overlay** (dropdown, sheet, dialog, tooltip).
    Kartu memakai border tipis, tanpa shadow.
12. **Nilai kosong ditulis `N/A` atau `—`** secara konsisten.
13. Utamakan komponen reusable yang sudah ada sebelum membuat baru.

---

## 4. Kerangka aplikasi (App Shell)

### Sidebar kiri (desktop)

| Bagian | Spesifikasi sekarang |
| --- | --- |
| Lebar | 264px; mode ciut 72px (hanya ikon), transisi 300ms |
| Header (72px) | Logo 36px + judul "PLTA Monitoring" (15px/700) + subjudul "Jawa Tengah" (11px muted) |
| Tombol ciut | Bulat 24px, mengambang di tepi kanan sidebar, tanpa shadow |
| Menu | Item 40px, radius 10px, ikon 18px + label 14px. Aktif: latar `#ECFEFF`, teks `#0891B2`, semibold |
| Urutan menu | Overview · Telemetering · Forecasting · Tren & Grafik · Laporan · Input GHW · Katalog Data · User Management |
| Footer (68px) | Avatar inisial 36px bulat + nama (13px) + role (11px muted) → klik menuju Profil Saya; ikon logout di kanan |

### Header mobile

Hanya tampil di bawah `lg`: tinggi 64px, sticky, berisi tombol hamburger, logo
32px, dan teks "PLTA Monitoring". Sidebar jadi drawer dengan overlay gelap.

### Area konten

`max-width` 1440px, padding 12px (mobile) → 24px (2xl), latar `surface/base`.
Setiap halaman memakai pola header: **judul + satu deskripsi ringkas** di kiri,
**filter/aksi** di kanan (`PlantSwitcher`, tombol utama).

### Struktur route

| Route | Layar |
| --- | --- |
| `/login` | Login |
| `/dashboard/overview` | Overview (peta Jawa Tengah) |
| `/dashboard/catalog?view=ws\|plta\|tags` | Katalog Monitoring |
| `/dashboard/plta/:pltaId/telemetering` | Telemetering |
| `/dashboard/plta/:pltaId/forecasting` | Forecasting |
| `/dashboard/plta/:pltaId/trends` | Tren & Grafik |
| `/dashboard/plta/:pltaId/laporan` | Laporan |
| `/dashboard/plta/:pltaId/input-ghw` | Input GHW |
| `/dashboard/plta/:pltaId/user-management` | User Management (admin) |
| `/dashboard/plta/:pltaId/account` | Profil Saya |

Sebagian besar halaman ter-scope ke satu PLTA; pemilih PLTA (`PlantSwitcher`)
ada di kanan header halaman. Overview dan Katalog tidak ter-scope.

---

## 5. Inventori layar

### 5.1 Login

- Layar penuh, latar `#F8FAFC` dengan pola grid cyan sangat samar (opacity 2%).
- Kolom tengah: logo 56px → judul "PLTA Monitoring" (Space Grotesk 20px/700) →
  subjudul "Telemetering · Forecasting · Reporting".
- Kartu form lebar 400px, radius 16px, padding 32px, border tipis:
  judul "Masuk ke akun Anda", deskripsi "Gunakan kredensial operator yang terdaftar",
  field **Username** (ikon user) dan **Password** (ikon gembok + toggle mata),
  tinggi field 48px radius 10px, tombol **Masuk** full width 48px,
  tautan "Lupa password?" di bawah.
- State: pesan error login sebagai banner merah lembut di dalam kartu; tombol
  disabled saat form belum valid; spinner saat proses.
- Footer: "PLN INDONESIA POWER © 2026" (11px, uppercase, tracking lebar).

### 5.2 Overview

- Header: judul "Overview" + deskripsi "Peta sebaran PLTA di Jawa Tengah beserta kapasitas energinya".
- **Isi utama satu-satunya: peta Jawa Tengah** (SVG, react-simple-maps), tinggi
  responsif `clamp(280px, 55vw, 560px)`, tanpa dibungkus card.
- Layer peta: batas provinsi, batas kabupaten/kota, jaringan sungai, penanda PLTA
  (marker dengan animasi denyut saat idle), dan overlay **radar hujan realtime**
  yang bisa dinyalakan/dimatikan.
- Overlay di atas peta:
  - Kanan atas: tombol toggle "Radar Hujan" + waktu frame radar.
  - Kiri atas (saat hover marker): kartu info PLTA — nama, badge status, Kode,
    Kapasitas (MW), Koordinat, dan ajakan klik untuk membuka detail.
  - Kanan bawah: legenda (Jawa Tengah, Batas Kab/Kota, Jaringan Sungai, Radar Hujan)
    + kredit sumber data kecil.
- Klik marker → menuju Telemetering PLTA tersebut.
- **Masalah yang ingin diperbaiki:** legenda dan panel radar terasa berat dan
  saling bertabrakan di layar kecil; kartu hover masih memakai gaya lama.

### 5.3 Telemetering (layar paling kompleks)

Header: judul "Telemetering", deskripsi "Pantau kondisi hidrologi harian dan
bulanan PLTA <nama>", `PlantSwitcher` di kanan.

**Bagian A — Hidrologi Bulanan**
- Judul bagian + tahun berjalan di kanan.
- Tabel 12 bulan (Jan–Des sebagai kolom), 2 baris: **Prediksi** dan **Aktual**.
  Kolom pertama sticky. Kolom bulan berjalan disorot cyan. Nilai berupa label
  status dengan titik warna: Normal (hijau), Basah (cyan), Kering (amber), `—` (abu).
  **Tabel ini tidak bisa diklik per bulan.**
- Di bawahnya dua kolom:
  - Kiri: "Ringkasan <Bulan>" + tombol **Input Data Bulanan** (jadi "Edit data"
    kalau data sudah ada) → membuka sheet. Isi: daftar parameter produksi
    (prediksi produksi, target produksi, pencapaian bulan sebelumnya, prediksi
    pencapaian, target pencapaian, persentase pencapaian) dengan pola
    `label + keterangan sumber` di kiri dan `nilai + satuan` di kanan.
  - Kanan: "Prakiraan Hujan" — dua kartu gambar (Prakiraan Curah Hujan,
    Prakiraan Sifat Hujan), tinggi gambar 220px, footer "Sumber gambar BMKG" +
    status ketersediaan. Kalau gambar belum ada, seluruh kartu jadi tombol unggah.
- Catatan kecil (ikon info): "Prediksi hidrologi belum mempertimbangkan kebutuhan
  alokasi air, kesiapan unit pembangkit, dan kebutuhan sistem kelistrikan."

**Bagian B — Hidrologi Harian**
- Judul bagian + tanggal hari ini (**selalu hari ini, tanpa pemilih tanggal**).
- Baris legenda status di kanan: "Realtime aktif / belum aktif", "Input",
  "Formulasi", "Konstanta", "Belum tersedia", plus tombol "Hubungkan ulang"
  bila koneksi realtime terputus.
- Banner peringatan bila ada formula yang masih menunggu data.
- **Tata letak spasial hidrologi** — ini fitur khas produk ini:
  - Tiga kartu parameter berdampingan: **Hulu**, **Bendungan**, **Hilir**.
    Tiap baris parameter: label + keterangan sumber di kiri, nilai + satuan di
    kanan, dan tautan "Input data"/"Edit data" bila parameter itu diisi manual.
    Kartu hanya menampilkan 5 baris, sisanya di balik tombol "Lihat semua (n)".
  - Di bawahnya: **citra satelit bendungan** dengan penanda SVG untuk titik
    hulu / dam / hilir. Hover atau klik penanda akan menyorot kartu terkait.
  - **Garis konektor melengkung** menghubungkan tiap kartu ke penanda di citra
    satelit, dengan warna zona masing-masing; garis aktif jadi solid dan tebal,
    yang lain jadi putus-putus dan redup.
  - Jika citra satelit gagal dimuat, diganti **skema hidrologi SVG generik**
    (Hulu → Waduk → Dam → Powerhouse → Hilir dengan panah aliran).
- **Masalah yang ingin diperbaiki:** halaman ini sangat padat; hierarki antara
  bulanan dan harian kurang tegas; konektor SVG rapuh di layar sempit dan hilang
  di bawah breakpoint xl.

### 5.4 Tren & Grafik

- Header + `PlantSwitcher`.
- Baris filter (dibatasi garis atas-bawah, bukan card): **Parameter grafik**
  (opsi berasal dari daftar tag aktif PLTA) dan **Periode** (24 Jam Terakhir /
  7 Hari Terakhir / 30 Hari Terakhir, default 24 jam). Filter tersimpan di URL.
- **Hanya satu grafik** (bukan 4 grafik). Kartu grafik berisi:
  - Kiri atas: nama parameter + subjudul ("n stasiun aktif").
  - Kanan atas: "Nilai terkini" besar + satuan + waktu pengambilan.
  - Baris statistik 4 kolom dipisah garis: Rata-rata, Minimum, Maksimum,
    Perubahan periode (dengan panah naik/turun berwarna).
  - Area chart (atau bar chart untuk parameter curah hujan) tinggi 330px,
    grid horizontal putus-putus, garis referensi rata-rata, gradien isian.
  - **Tooltip menampilkan nilai saat kursor di atas garis** — panel gelap
    (slate-950) dengan waktu dan nilai besar.
  - Footer: "Arahkan kursor ke grafik untuk melihat detail nilai." + jumlah titik,
    resolusi, dan keterangan agregasi.

### 5.5 Forecasting

- Khusus **PLTA Soedirman**, **tanpa pemilih PLTA**.
- Filter: **Parameter** (Inflow / TMA Waduk) dan **Horizon** (24 Jam / 7 Hari).
- Empat kartu KPI: Prediksi awal, Prediksi maksimum, Prediksi minimum,
  Rata-rata — masing-masing nilai besar + satuan + baris detail waktu.
- Kartu grafik gabungan: garis **Aktual** (abu) + garis **Prediksi P50** (cyan) +
  pita **P10–P90** (area cyan transparan). Header kartu memuat nama model dan
  waktu prediksi dibuat. Legenda di bawah grafik.
- Banner peringatan amber bila akurasi model belum layak jadi acuan tunggal.
- Dua panel bawah: **Kelayakan Prediksi** (Status, Skill, Sampel, Jendela) dan
  **Detail Prediksi** (tabel Waktu / P50 / P10 / P90, header sticky, scroll internal).

### 5.6 Laporan

Alur: pilih laporan → daftar tabel → status `completed` → download.

- Header + `PlantSwitcher` + tombol utama **Buat Laporan**.
- Tabel **Daftar Laporan** dengan search (tanpa tombol "Perbarui"):
  kolom Laporan (judul + jenis & parameter), Periode, Dibuat, Status, Aksi.
- Badge status: Menunggu (amber), Diproses (cyan, ikon berputar), Selesai
  (hijau), Gagal (merah).
- Aksi: tombol **Unduh Excel** — hanya aktif saat status Selesai.
- Paginasi 10 item: "Menampilkan x–y dari n laporan" + tombol prev/next.
- Sheet **Buat Laporan Bulanan**: ringkasan jenis laporan + PLTA, pilihan
  **Bulan** dan **Tahun** (**hanya periode bulanan**), dan daftar **Parameter**
  berupa checkbox dari tag aktif PLTA (**hanya parameter time series**);
  kosongkan berarti semua parameter.
- State kosong: ikon spreadsheet + "Belum ada laporan" / "Laporan tidak ditemukan".

### 5.7 Input GHW

- Header + `PlantSwitcher`.
- Kartu **Elevasi & Volume Waduk** dua kolom:
  - Kiri: dropzone drag-and-drop besar (min 240px) — ikon awan unggah, teks
    "Tarik file Excel ke area ini", "atau klik untuk memilih file", chip
    ".xlsx · maksimum 5 MB". Setelah file dipilih, dropzone berganti jadi kartu
    ringkas file (nama, ukuran, tahun, tombol hapus) berwarna hijau bila valid /
    merah bila tidak, plus tombol **Unggah ke Server**.
  - Kanan (sidebar abu): pilihan **Tahun data**, checkbox **Publikasikan kurva**,
    catatan kolom wajib (Elevasi, Volume; Area opsional), tombol **Unduh Template**.
- Tabel **Riwayat sesi** (maks. 5): Nama File, Jenis Data, Tahun, Waktu, Baris, Status.
- **Excel tidak diparsing di browser** — file dikirim mentah ke server.

### 5.8 Katalog Monitoring

- Header + **tab segmented** di kanan: Wilayah Sungai · PLTA · Tag & Parameter
  (tab tersimpan di URL, pil di dalam track abu).
- Ketiganya memakai satu komponen tabel katalog yang sama: baris search + filter,
  tabel, state loading/empty/error, dan paginasi.

| Tab | Kolom |
| --- | --- |
| Wilayah Sungai | Kode · Wilayah Sungai · Deskripsi · Jumlah PLTA |
| PLTA | PLTA (nama + kode mono) · Wilayah Sungai · Kapasitas · Koordinat · Status · Aksi ("Lihat Parameter") |
| Tag & Parameter | Parameter · Stasiun · Protokol · Alamat · Scale/Offset · Satuan · Status |

- Filter khusus tab Tag: pemilih PLTA, protokol, dan status tag (kontrol kompak 36px).
- Ini satu-satunya layar yang boleh menampilkan istilah teknis (protokol, alamat tag).

### 5.9 User Management

- Header + tombol **Tambah User**.
- Panel daftar: baris search, header kolom (User · Role · Status · Aksi),
  lalu baris pengguna: avatar inisial 36px, nama + `@username · email`,
  badge role berwarna (Super Admin cyan, Operator amber, Viewer abu),
  status dengan titik hijau/abu (klik untuk mengubah), ikon edit dan hapus.
- Akun sendiri: status dan hapus dinonaktifkan; edit mengarahkan ke Profil Saya.
- Paginasi **10 item**.
- Sheet **Tambah/Edit Pengguna**: Nama Lengkap, Email, Username, Password Awal
  (khusus tambah), Peran, dan **status toggle** (bukan checkbox).
- Hapus lewat **confirm dialog** dengan label "Hapus Permanen".

### 5.10 Profil Saya

- Dua kartu berdampingan:
  - **Informasi Profil**: blok abu berisi Username dan Role (read-only, dikelola
    admin), lalu form Nama Lengkap + Email + tombol Simpan Profil.
  - **Ganti Password**: Password Saat Ini, Password Baru, Konfirmasi Password Baru,
    tombol Ubah Password. Setelah berhasil, pengguna dikeluarkan dan harus masuk lagi.
- Kedua kartu punya ikon dalam kotak berwarna di header kartu (cyan / amber).

---

## 6. Komponen reusable yang sudah ada

| Komponen | Peran | Catatan bentuk sekarang |
| --- | --- | --- |
| `Button` | Tombol | Varian primary / secondary / ghost / danger / success; ukuran sm / md / lg; slot ikon kiri-kanan; state loading |
| `Input` | Field teks | Tinggi 44px, radius 12px, label 12px semibold, slot ikon, pesan error/helper |
| `Select` | Dropdown kustom | Trigger 44px (kompak 36px), panel **muncul 8px di bawah field**, selebar field, item tercentang, navigasi keyboard penuh |
| `StatusToggle` | Aktif/Nonaktif | Switch dengan label teks, bukan checkbox |
| `Skeleton` | Placeholder | Shimmer bergerak, mengikuti bentuk konten |
| `Sheet` | Panel geser kanan | Lebar maks 480px, header (judul + deskripsi + tombol tutup), isi scroll, footer aksi, focus trap |
| `ConfirmDialog` | Konfirmasi | Varian danger / warning / primary, ikon dalam lingkaran, dua tombol |
| `Toast` | Notifikasi | Kanan atas, 4 tipe (success/error/warning/info), bisa ditutup |
| `PlantSwitcher` | Pemilih PLTA | Select 44px dengan ikon gedung; punya state loading, error, dan kosong |
| `JavaMap` | Peta Jawa Tengah | Marker PLTA, sungai, batas wilayah, radar hujan |
| `SatelliteHydrologyMap` | Citra satelit bendungan | Penanda SVG hulu/dam/hilir yang interaktif |
| `HydrologyMetricCard` | Kartu parameter zona | Daftar parameter dengan ringkas/lihat semua |
| `CatalogTable` | Tabel katalog | Search, filter, loading, empty, error, paginasi dalam satu pola |
| Skeleton per halaman | `AppShellSkeleton`, `DashboardPageSkeleton` (varian overview/telemetering/trends/forecasting/table/upload/form), `MapSkeleton`, `ResourceTableSkeleton`, `UserTableSkeleton` |

---

## 7. State yang wajib dirancang untuk setiap layar

Setiap layar yang memuat data harus punya empat keadaan, dan semuanya sudah ada
di kode — jangan hilang saat redesign:

| State | Ketentuan |
| --- | --- |
| Loading | Skeleton yang bentuknya mengikuti konten asli (baris tabel, kartu KPI, area grafik, peta). Bukan spinner tengah layar |
| Kosong | Ikon netral dalam lingkaran abu + judul singkat + satu kalimat penjelasan. Bedakan "belum ada data" dan "tidak ditemukan (hasil pencarian)" |
| Error | Pesan ramah non-teknis + tombol "Coba lagi". Untuk error sebagian (mis. katalog input gagal tapi monitoring jalan) pakai banner amber, bukan menghapus seluruh konten |
| Refetch | Indikator halus (garis shimmer tipis di atas tabel), bukan mengosongkan tabel |

Selain itu: status koneksi realtime harus terbaca sebagai kalimat manusia
("Data diperbarui otomatis", "Memulihkan koneksi", "Pembaruan terhenti"),
bukan istilah teknis.

---

## 8. Yang ingin dicapai dari redesign

1. **Hierarki lebih tegas**, terutama di Telemetering yang menumpuk bulanan +
   harian + spasial dalam satu halaman.
2. **Kepadatan informasi yang nyaman dipantau lama** — banyak angka, sedikit
   dekorasi, kontras cukup untuk ruangan terang.
3. **Konsistensi lintas halaman**: ukuran judul, tinggi kontrol, pola header
   halaman, pola tabel, pola state kosong/error harus sama persis di 10 layar.
4. **Perbedaan sumber data (realtime / formulasi / input / konstanta / belum
   tersedia) langsung terbaca** tanpa harus membaca legenda tiap kali.
5. **Responsif jujur**: tabel lebar boleh scroll horizontal, tapi kontrol dan
   header tidak boleh pecah; peta dan konektor SVG harus punya fallback yang rapi.
6. **Tetap tanpa container bertumpuk** — gunakan garis pemisah dan whitespace.

---

## 9. Keluaran yang diharapkan dari Claude (design)

Susun hasil dalam urutan ini:

1. **Fondasi**: palet final (light), skala tipografi, skala spacing/radius,
   spesifikasi kontrol form (default/hover/focus/disabled/error), pola elevasi.
2. **App shell**: sidebar (lebar penuh + ciut), header mobile, area konten,
   pola header halaman.
3. **Pustaka komponen**: seluruh komponen di bagian 6, lengkap dengan semua state.
4. **Sepuluh layar** sesuai bagian 5, masing-masing dalam tiga ukuran:
   desktop 1440px, tablet 768px, mobile 375px.
5. **Katalog state**: loading, kosong, error, refetch untuk pola tabel, grafik,
   peta, dan formulir.
6. **Catatan penerapan**: pemetaan setiap keputusan desain ke token, agar bisa
   langsung diterjemahkan ke Tailwind 4 (`@theme`) tanpa nilai hardcode baru.

Batasan teknis yang tidak boleh dilanggar: hanya tema terang, Inter +
Space Grotesk + JetBrains Mono, ikon lucide, grafik Recharts, peta SVG
(react-simple-maps). Jangan mengusulkan komponen yang butuh library baru.
