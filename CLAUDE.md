# tele-frontend-v2

Dashboard monitoring & telemetering PLTA (klien: IP Mrica, wilayah Jawa Tengah).
React 19 + TypeScript + Vite + Tailwind 4, TanStack Query untuk server state,
Zustand untuk session state, Zod untuk validasi kontrak API.

Dokumen yang sudah ada — baca dulu sebelum mengubah apa pun:

- `README.md` — tech stack, env var, cara jalan
- `docs/architecture.md` — layer, dependency direction, struktur feature (WAJIB dibaca sebelum menambah folder/file baru)
- `system-style-design-guide.md` — token warna, tipografi, spacing, aturan komponen (WAJIB dibaca sebelum menyentuh UI)

File ini hanya berisi hal yang tidak tertulis di ketiga dokumen itu.

## Cara kerja & komunikasi

- Bahasa Indonesia.
- Runtime & package manager: **Bun**, bukan npm/yarn. `bun install`, `bun dev`, `bun run check`.
- **Jangan menjalankan dev server sendiri.** User menjalankannya di `localhost:5173`
  dan akan bilang "gunakan localhost:5173" ketika sudah siap. Verifikasi lewat URL itu.
- Untuk pekerjaan besar: buat rencana ber-phase, kerjakan **2 phase per request**,
  bukan sekaligus. User ingin melihat hasil bertahap.
- Kalau membandingkan/menganalisis banyak item (mis. daftar endpoint yang mau dihapus),
  **sajikan dalam tabel**, bukan paragraf. User kesulitan membaca teks panjang.
- Sebelum menghapus/mengubah sesuatu yang berdampak, beri opsi + alasan, lalu tunggu keputusan user.

## Perintah

```bash
bun run check      # typecheck + lint + test + build — jalankan sebelum menyatakan selesai
bun run typecheck
bun run lint
bun run test
```

## Aturan desain yang sering dilanggar

User menilai estetika seketat fungsi. Kesalahan yang paling sering diulang:

- **Jangan ada container di dalam container.** Tabel/kartu jangan dibungkus card lagi.
  Ini keluhan yang paling sering muncul.
- Jangan ada garis warna aksen di atas card — dianggap norak.
- Jangan ada card tanggal/jam. User bisa lihat tanggal di OS-nya.
- Judul halaman tanpa ikon dekoratif. Ukuran judul harus konsisten antar fitur
  (acuan: Overview). Jangan ada judul yang lebih besar dari yang lain.
- Bahasa UI non-teknis: tulis "realtime", bukan "WebSocket". Jangan tampilkan
  nama endpoint/payload di layar operasional. Keterangan parameter singkat
  ("belum tersedia", "konstanta", "formulasi", "realtime"), bukan kalimat panjang.
- Panel dropdown muncul **di bawah** field dan tidak menutupinya.
- Skeleton/shimmer harus mengikuti bentuk konten aslinya, dan hanya dipasang
  di tempat yang benar-benar memuat data (dulu pernah salah: shimmer di sidebar
  yang tidak memuat apa pun).
- Form create/edit/query pakai **dialog sheet**, bukan halaman terpisah.
  Pola ini dipakai di Laporan lalu diseragamkan ke User Management.
- Aksi destruktif (hapus, logout) lewat confirm dialog reusable.
- Toggle status aktif/nonaktif pakai komponen status toggle, **bukan checkbox**.
- Utamakan komponen reusable; kalau membuat yang baru, cek dulu `src/components/ui`
  dan `src/components/skeletons`.

## Domain

- **Wilayah Sungai (WS) 1 : N PLTA. Satu PLTA hanya punya satu `ws_id`.**
  Ini pernah salah dimodelkan sebagai many-to-many.
- Role: `admin`, `operator`, `viewer`. Role `viewer` tidak boleh melihat menu
  Input GHW dan Katalog Monitoring.
- Menu: Overview (peta Jawa Tengah), Telemetering, Tren & Grafik, Laporan,
  Input GHW, Forecasting, User Management.

## Backend & integrasi

- Base URL lewat `VITE_API_BASE_URL`. Alamat backend **sering berganti**
  (tunnel trycloudflare / IP LAN seperti `192.168.105.99:8000`). Kalau host baru
  perlu diakses dev server, tambahkan ke `server.allowedHosts` di `vite.config.ts`.
- Swagger backend ada di `<base>/docs`. Kalau user bilang "ada update dari backend",
  cek Swagger dan bandingkan query param / request body / response dengan schema Zod.
- Auth: `POST /api/v1/auth/login` dengan **`x-www-form-urlencoded`** (username, password),
  `/auth/refresh`, `/auth/me`. **Tidak ada API logout** — logout murni sisi klien
  (hapus token + bersihkan cache query). Ini keputusan tim, bukan kekurangan.
- Realtime: `wss://<host>/api/v1/ws/monitoring?token=${accessToken}&plta_id=${pltaId}`.
- Upload Excel: kirim file mentah ke server. **Jangan parsing Excel di frontend** —
  ini perubahan dari implementasi awal yang parsing di klien.
- Endpoint yang sudah diputuskan **tidak dipakai**: legacy, auth LDAP, opc-tools,
  alerts, report-ROH, dan upload RTOW. Fitur "monitoring" lama sudah diganti "telemetering".

## Perilaku fitur yang sudah diputuskan

- **Telemetering**: kondisi hidrologi harian selalu ambil hari ini (tanpa pemilih tanggal);
  tabel tahunan tidak bisa diklik per bulan dan menampilkan nilai prediksi/aktual hidrologi;
  tombol "Input data" berubah jadi "Edit data" bila datanya sudah ada;
  ada citra satelit bendungan dengan overlay SVG penanda hulu / dam / hilir.
- **Tren & Grafik**: hanya **satu** grafik dengan pemilih parameter (bukan 4 grafik).
  Rentang default 24 jam. Daftar parameter diambil dari API tags. Garis grafik
  menampilkan nilai saat di-hover.
- **Laporan**: alur = pilih laporan → masuk daftar tabel → status `completed` → download.
  Hanya periode bulanan (pilih bulan & tahun) dan hanya parameter time series.
  Daftar laporan pakai paginasi + search, tanpa tombol "Perbarui".
- **Forecasting**: khusus PLTA Soedirman, tanpa pemilih PLTA.
- **User Management**: limit paginasi 10 item.
- **Overview**: peta Jawa Tengah dengan batas kabupaten/kota, garis aliran sungai,
  dan overlay presipitasi realtime (memakai layanan tier gratis).

## Catatan

Riwayat pengerjaan project ini (45 sesi) berasal dari Codex dan disarikan ke file ini;
korpus mentahnya tidak disimpan di repo.
