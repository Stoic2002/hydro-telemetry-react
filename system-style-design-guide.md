# PLTA Monitoring — Panduan Konsistensi UI

Panduan ini menjadi acuan untuk seluruh fitur dashboard: Overview, Telemetering, Forecasting, Tren & Grafik, Laporan, Input GHW, Katalog Monitoring, serta halaman pengguna.

## 1. Warna

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `surface/base` | `#F8FAFC` | Latar aplikasi |
| `surface/raised` | `#FFFFFF` | Kartu dan kontrol |
| `surface/overlay` | `#F1F5F9` | Area sekunder |
| `border/subtle` | `#E2E8F0` | Border kartu dan kontrol |
| `text/primary` | `#0F172A` | Judul dan nilai utama |
| `text/secondary` | `#334155` | Isi utama |
| `text/muted` | `#64748B` | Deskripsi |
| `brand/primary` | `#22D3EE` | Aksen ringan |
| `brand/primary-strong` | `#0891B2` | Tombol dan state aktif |

Status menggunakan hijau untuk normal, amber untuk peringatan, dan merah untuk gangguan atau bahaya.

## 2. Hierarki tipografi

| Elemen | Font | Ukuran / bobot |
| --- | --- | --- |
| Judul halaman | Space Grotesk | `22px / 700` |
| Deskripsi halaman | Inter | `13px / 400`, line-height `20px` |
| Judul bagian | Inter | `16px / 600` |
| Judul kartu | Inter | `13–15px / 600` |
| Label field | Inter | `12px / 600` |
| Nilai telemetri | JetBrains Mono | `16px / 700` |

Gunakan kelas bersama `page-title` dan `page-description` untuk header halaman. Judul halaman tidak memakai ikon dekoratif. Tombol kembali tetap boleh ditempatkan terpisah di sebelah kiri karena merupakan aksi navigasi.

## 3. Spacing dan radius

| Token | Nilai |
| --- | --- |
| `space/xs` | `4px` |
| `space/sm` | `8px` |
| `space/md` | `16px` |
| `space/lg` | `24px` |
| `space/xl` | `32px` |
| `radius/sm` | `6px` |
| `radius/md` | `10px` |
| `radius/lg` | `16px` |

Jarak antara judul dan deskripsi halaman adalah `4px`; jarak header ke konten utama adalah `24px`.

## 4. Kontrol form

- Tinggi kontrol standar: `44px`; kontrol filter kompak: `36px`.
- Input dan dropdown standar menggunakan radius `12px`, border `#E2E8F0`, dan focus ring cyan.
- Label field berukuran `12px`, semibold, warna muted.
- Daftar opsi dropdown muncul `8px` di bawah field, selebar field, berada di layer overlay, dan tidak menutupi field yang sedang dibuka.
- Tombol dalam satu baris filter harus setinggi kontrol di sebelahnya.

## 5. Bahasa antarmuka

- Tampilkan manfaat dan kondisi yang dipahami operator, bukan detail implementasi.
- Istilah seperti WebSocket, REST, response, payload, dan nama endpoint tidak ditampilkan pada layar operasional.
- Contoh status yang benar: `Data diperbarui otomatis`, `Memulihkan koneksi`, dan `Pembaruan terhenti`.
- Istilah teknis tetap boleh muncul pada fitur konfigurasi khusus admin, misalnya protokol tag di Katalog Monitoring.

## 6. Pola komponen

- Header halaman: judul, satu deskripsi ringkas, lalu aksi atau filter di sisi kanan bila diperlukan.
- Kartu: border tipis dan permukaan putih; bayangan hanya dipakai untuk overlay seperti dropdown atau dialog.
- Ikon dipakai untuk aksi, status, atau navigasi. Hindari ikon dekoratif di samping judul halaman.
- Nilai kosong ditulis `N/A` atau `—` secara konsisten sesuai jenis data.
