# System Style & Design Guide

Panduan visual untuk dashboard telemetering PLTA. Dokumen ini menjelaskan token,
tipografi, spacing, dan aturan komponen yang berlaku di `src/`.

Sumber kebenarannya tetap kode: token didefinisikan di
[`src/styles/globals.css`](./src/styles/globals.css), komponen reusable ada di
`src/components/`. Kalau dokumen ini berbeda dengan kode, kodenya yang benar dan
dokumen ini yang harus diperbarui.

---

## 1. Prinsip

1. **Antarmuka operasional, bukan halaman marketing.** Kepadatan informasi
   diutamakan. Tidak ada hiasan yang tidak membawa informasi.
2. **Selalu pakai token, jangan warna mentah.** `text-text-muted`, bukan
   `text-slate-500`. Token membuat penyesuaian tema cukup di satu tempat.
3. **Satu tingkat kedalaman.** Konten hidup di dalam satu wadah, tidak lebih.
4. **Bahasa non-teknis.** Layar operasional tidak menampilkan istilah
   implementasi.

---

## 2. Token warna

Semua token didefinisikan dalam blok `@theme` dan otomatis tersedia sebagai
utility Tailwind (`bg-surface-base`, `text-text-muted`, `border-border-subtle`).

### Permukaan

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `surface-base` | `#f8fafc` | Latar halaman, tombol sekunder saat hover |
| `surface-raised` | `#ffffff` | Kartu, tabel, panel, dialog |
| `surface-overlay` | `#f1f5f9` | Header tabel, blok informasi di dalam kartu |

### Garis

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `border-subtle` | `#e2e8f0` | Batas kartu, tabel, pemisah baris |
| `border-strong` | `#cbd5e1` | Batas field input, area drop file |

### Teks

| Token | Nilai | Kontras di atas putih | Dipakai untuk |
| --- | --- | --- | --- |
| `text-primary` | `#0f172a` | 17,85 : 1 | Judul, nilai metrik |
| `text-strong` | `#1e293b` | 14,68 : 1 | Teks isi tegas, nilai di dalam field |
| `text-secondary` | `#334155` | 10,35 : 1 | Teks isi, label form |
| `text-subtle` | `#475569` | 7,44 : 1 | Teks sekunder, tombol ghost |
| `text-muted` | `#64748b` | 4,76 : 1 | Keterangan, satuan, header tabel |
| `text-placeholder` | `#94a3b8` | 2,56 : 1 | **Hanya placeholder input** |
| `disabled` | `#cbd5e1` | — | Teks, latar, dan jalur kontrol nonaktif |

`text-placeholder` tidak lolos WCAG AA untuk teks biasa. Jangan memakainya untuk
teks yang harus dibaca — gunakan `text-muted` sebagai warna teks paling redup.

### Permukaan gelap

Tooltip grafik dan lapisan peredup memakai pasangan token sendiri. Ini bukan
sekadar kerapian: `text-muted` yang lolos kontras di atas putih justru **gagal**
di atas permukaan gelap (3,75 : 1), sedangkan `text-on-inverse-muted` lolos
(6,96 : 1).

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `surface-inverse` | `#0f172a` | Latar tooltip, peredup di belakang overlay |
| `border-inverse` | `#334155` | Batas tooltip |
| `text-on-inverse` | `#cbd5e1` | Teks di atas permukaan gelap |
| `text-on-inverse-muted` | `#94a3b8` | Keterangan di atas permukaan gelap |

### Brand

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `brand-primary` | `#22d3ee` | Aksen terang, indikator |
| `brand-primary-strong` | `#0891b2` | Tombol primer, tautan, ring fokus |
| `brand-primary-pressed` | `#0e7490` | Keadaan ditekan |
| `brand-tint` | `#ecfeff` | Latar item navigasi aktif |
| `brand-tint-border` | `#a5f3fc` | Batas blok bertona brand |

### Status

Setiap status punya pasangan: `-` untuk bidang isi, `-strong` untuk teks dan ikon.

| Token | Nilai | Arti |
| --- | --- | --- |
| `status-success` / `-strong` | `#34d399` / `#22c55e` | Normal, tervalidasi |
| `status-warning` / `-strong` | `#fbbf24` / `#f59e0b` | Perlu perhatian |
| `status-danger` / `-strong` | `#f87171` / `#ef4444` | Kritis, gagal |
| `status-info` | `#60a5fa` | Informasi netral |

### Zona hidrologi

Warna tetap per zona, dipakai peta bendungan dan penanda sumber data.

| Token | Nilai | Zona |
| --- | --- | --- |
| `zone-hulu` | `#22d3ee` | Hulu |
| `zone-dam` | `#f59e0b` | Bendungan |
| `zone-hilir` | `#34d399` | Hilir |

### Grafik

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `chart-series-1` … `-6` | `#0891b2`, `#2563eb`, `#7c3aed`, `#0e7490`, `#d97706`, `#059669` | Warna seri sesuai urutan parameter |
| `chart-grid` | `#e2e8f0` | Garis bantu |
| `chart-axis` | `#64748b` | Label sumbu |
| `chart-reference` | `#94a3b8` | Garis rata-rata |

Recharts menerima nilai CSS, jadi warnanya dirujuk sebagai
`var(--color-chart-series-1)`. Jangan menyambung alpha ke nilai warna
(`${color}0d`) karena `var()` bukan hex — pakai prop opacity tersendiri.

---

## 3. Tipografi

Tiga family: `font-sans` (Inter) untuk antarmuka, `font-display` (Space Grotesk)
untuk judul halaman, `font-mono` (JetBrains Mono) untuk angka dan identifier.

Kelas siap pakai di `@layer components`:

| Kelas | Ukuran | Dipakai untuk |
| --- | --- | --- |
| `.page-title` | 22px bold, display | Judul halaman |
| `.page-description` | 13px | Keterangan di bawah judul |
| `.section-title` | 16px semibold | Judul bagian |
| `.card-title` | 14px semibold | Judul kartu |
| `.field-label` | 12px semibold | Label field |
| `.table-head-cell` | 11px semibold, uppercase | Header kolom tabel |
| `.metric-value` | mono, tabular-nums | Angka telemetri |
| `.metric-unit` | 0.8em | Satuan di belakang angka |

Aturan:

- **Ukuran judul halaman harus sama di semua fitur.** Acuannya Overview. Tidak
  boleh ada halaman dengan judul lebih besar dari halaman lain.
- **Judul halaman tanpa ikon dekoratif.**
- Angka selalu `tabular-nums` agar kolom tabel tidak bergeser saat nilai berubah.
- Satuan selalu lebih redup daripada angkanya.

---

## 4. Spacing, radius, elevasi

- Jarak antar blok besar dalam satu halaman: `gap-6`.
- Padding kartu: `p-4` di layar kecil, `sm:p-6` di layar lebar.
- Padding sel tabel: `px-4 py-3`.

Radius:

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `rounded-sm` | 6px | Tombol kecil, badge |
| `rounded-md` | 10px | Kartu, field |
| `rounded-lg` | 14px | Dialog, panel mengambang |

Bayangan hanya untuk elemen yang benar-benar melayang:

| Token | Dipakai untuk |
| --- | --- |
| `shadow-overlay` | Dropdown |
| `shadow-panel` | Toast, panel mengambang |
| `shadow-dialog` | Dialog konfirmasi |

**Kartu tidak pernah punya bayangan.** Pemisahan visual memakai garis.

---

## 5. Aturan komponen

Aturan berikut berasal dari revisi berulang. Melanggarnya berarti mengulang
kesalahan yang sudah pernah diperbaiki.

### Larangan

- **Jangan ada wadah di dalam wadah.** Tabel dan kartu tidak dibungkus kartu lagi.
  Ini keluhan yang paling sering muncul.
- **Jangan ada garis warna aksen di atas kartu.**
- **Jangan ada kartu tanggal/jam.** Tanggal sudah ada di sistem operasi pengguna.
- **Jangan menampilkan nama endpoint atau payload** di layar operasional.

### Keharusan

- Form buat/ubah/query memakai **dialog sheet**, bukan halaman terpisah.
- Aksi destruktif (hapus, keluar) lewat `ConfirmDialog`.
- Status aktif/nonaktif memakai `StatusToggle`, **bukan checkbox**.
- Panel dropdown muncul **di bawah** field dan tidak menutupinya.
- Skeleton mengikuti bentuk konten aslinya, dan hanya dipasang di tempat yang
  benar-benar memuat data.

### Komponen yang tersedia

Cek daftar ini sebelum membuat komponen baru.

| Kebutuhan | Komponen |
| --- | --- |
| Aksi | `atoms/Button` |
| Field | `atoms/Input`, `atoms/Select`, `atoms/SegmentedControl` |
| Status | `atoms/Badge`, `atoms/StatusToggle`, `atoms/SourceMarker` |
| Judul halaman | `ui/PageHeader` |
| Form panel | `ui/Sheet` |
| Konfirmasi | `ui/ConfirmDialog` |
| Pesan tempel | `ui/Banner` |
| Keadaan kosong | `ui/EmptyState` |
| Keadaan gagal | `ui/ErrorState` |
| Kegagalan render | `ui/AppErrorBoundary` |
| Notifikasi | `ui/Toast` |
| Paginasi | `ui/TablePagination` |
| Muat ulang latar | `ui/RefetchBar` |
| Placeholder muat | `atoms/Skeleton`, `skeletons/*` |

---

## 6. Keadaan layar

Setiap layar yang memuat data harus menangani empat keadaan. Melewatkan salah
satunya berarti operator menatap layar kosong tanpa penjelasan.

| Keadaan | Tampilan |
| --- | --- |
| Memuat | `Skeleton` berbentuk konten aslinya, dengan `role="status"` |
| Kosong | `EmptyState` — ikon, judul, satu kalimat penjelas |
| Gagal | `ErrorState` — kalimat non-teknis + tombol coba lagi |
| Gagal sebagian | `Banner` bertona `warning`, layar tetap berguna |
| Muat ulang latar | `RefetchBar`, isi tabel tetap tampil |

Pesan error ke operator memakai kalimat biasa. Pesan mentah dari server tidak
ditampilkan langsung.

---

## 7. Aksesibilitas

- Overlay memakai `useFocusTrap`: fokus terkunci, Escape menutup, fokus kembali
  ke pemicu.
- Setiap kontrol ikon punya `aria-label`.
- Ring fokus: `focus:ring-2 focus:ring-brand-primary-strong/40`. Jangan menghapus
  indikator fokus tanpa menggantinya.
- Teks terkecil yang boleh dibaca operator memakai `text-muted`, bukan
  `text-placeholder`.
- Elemen yang terlihat bisa diklik harus benar-benar bisa diklik dan dapat
  dijangkau keyboard. Jangan memakai `<span className="cursor-pointer">` sebagai
  tombol.
- Animasi dimatikan otomatis pada `prefers-reduced-motion: reduce`.

---

## 8. Responsivitas

Breakpoint yang dipakai: `sm` (640px), `lg` (1024px), `xl` (1280px).

- Sidebar berubah jadi panel geser di bawah `lg`.
- Grid dua kolom memakai `lg:grid-cols-2` atau `xl:grid-cols-2`, menumpuk di
  bawahnya.
- Tabel lebar dibungkus `overflow-x-auto` dengan `min-w-[...]` pada tabelnya,
  sehingga halaman tidak pernah menggeser secara horizontal.
- Toolbar filter menumpuk vertikal di bawah `sm`.
