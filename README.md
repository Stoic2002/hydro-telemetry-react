# Tele Frontend V2

Dashboard monitoring dan telemetering PLTA berbasis React. Aplikasi mencakup
autentikasi, katalog PLTA, monitoring realtime, hidrologi, forecasting, tren,
laporan, serta upload data operasional.

## Tech stack

- React 19 + TypeScript
- Vite 8 + Tailwind CSS 4
- React Router untuk routing
- TanStack Query untuk server state
- Zustand untuk client/session state
- Zod untuk validasi kontrak API dan environment
- Vitest + React Testing Library untuk automated tests

## Menjalankan project

Pastikan Bun tersedia, lalu jalankan:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Aplikasi development akan tersedia pada URL yang dicetak Vite. Ubah
`VITE_API_BASE_URL` di `.env.local` apabila alamat backend berbeda.

## Environment variable

| Variable | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Tidak | `/` | Base URL backend. **Host saja, tanpa `/api/v1`** |
| `VITE_ERROR_REPORT_URL` | Tidak | kosong | Endpoint kolektor error internal. Kosong berarti laporan hanya disimpan di memori browser |
| `VITE_RAINVIEWER_API_URL` | Tidak | RainViewer publik | Sumber radar presipitasi. Kosongkan untuk mematikan overlay pada jaringan tanpa internet |
| `VITE_DEV_ALLOWED_HOSTS` | Tidak | kosong | Dev server saja. Host tambahan yang boleh mengakses `bun run dev`, dipisah koma |

Konfigurasi environment divalidasi saat aplikasi dimuat. Nilai yang tidak valid
akan menghasilkan error eksplisit dari `src/shared/lib/env.ts`.

### Base URL tidak boleh memuat `/api/v1`

Setiap endpoint di layer repository sudah menuliskan prefix-nya sendiri, misalnya
`/api/v1/plta`. Bila base URL ikut memuat prefix itu, path akan tergandakan
menjadi `/api/v1/api/v1/plta` dan seluruh request gagal. Validasi environment
menolak nilai semacam itu dengan pesan eksplisit.

| Tujuan | Nilai yang benar |
| --- | --- |
| Backend diakses langsung | `http://<backend-host>:8000` |
| Backend diproksikan pada origin yang sama | `/` |
| Salah | `http://<backend-host>:8000/api/v1` |

## Scripts

| Command | Kegunaan |
| --- | --- |
| `bun run dev` | Menjalankan development server |
| `bun run build` | Typecheck dan membuat bundle production (`.env.production`) |
| `bun run build:staging` | Typecheck dan membuat bundle staging (`.env.staging`) |
| `bun run preview` | Menjalankan hasil build production secara lokal |
| `bun run preview:staging` | Menjalankan hasil build staging secara lokal |
| `bun run typecheck` | Memeriksa TypeScript tanpa menghasilkan file |
| `bun run lint` | Menjalankan ESLint |
| `bun run test` | Menjalankan seluruh test satu kali |
| `bun run test:watch` | Menjalankan test dalam watch mode |
| `bun run test:coverage` | Membuat laporan coverage di `coverage/` |
| `bun run check` | Menjalankan seluruh quality gate: typecheck, lint, test, dan build |

Sebelum membuka pull request, jalankan:

```bash
bun run check
```

GitHub Actions menjalankan quality gate yang sama pada setiap pull request dan
push ke `main`.

## Arsitektur

Project menggunakan **feature-based modular frontend** dengan layer yang
terinspirasi Feature-Sliced Design dan Repository Pattern pada akses API.

```text
main
  └─ app (providers + router)
      └─ pages / layouts
          └─ features
              └─ query hooks
                  └─ repository
                      └─ api/http
                          └─ backend
```

Struktur utama:

```text
src/
├── api/http/       # transport HTTP, auth session, parsing error/response
├── app/            # root component, providers, query client, router
├── components/     # komponen UI lintas fitur
├── features/       # modul domain: auth, PLTA, hydrology, users, dst.
├── layouts/        # shell dan layout halaman
├── pages/          # komposisi route dan beberapa fitur
├── shared/         # library dan utility yang aman dipakai lintas layer
├── store/          # state global client/session
├── styles/         # global stylesheet
└── test/           # setup test global
```

Penjelasan dependency rule, pola repository, dan pedoman penempatan file ada di
[docs/architecture.md](./docs/architecture.md).

## Testing

Test ditempatkan berdekatan dengan source file menggunakan nama
`*.test.ts` atau `*.test.tsx`.

Prioritas testing:

1. Mapper, formatter, schema, dan business rule diuji sebagai unit test.
2. Komponen interaktif diuji dari sudut pandang pengguna menggunakan Testing Library.
3. Kontrak response API diuji pada boundary parser/repository.
4. Bug fix harus disertai regression test jika memungkinkan.

Jangan menguji detail implementasi React seperti nama state atau urutan hook.
Uji output, aksesibilitas, dan perilaku yang terlihat pengguna.

## Static files dan mock data

- File di `public/` disajikan apa adanya dari root URL, misalnya `/logo.png`.
- Asset yang perlu di-import dan diproses Vite dapat ditempatkan di `src/assets/`.
- `src/mocks/plta.mock.ts` menyediakan fixture simulasi dashboard untuk adapter
  PLTA; file tersebut bukan pengganti test fixture.

## Environment dan deployment

Aplikasi berjalan di jaringan internal, bukan di internet publik.

| Environment | File env | Backend | Perintah build | Output |
| --- | --- | --- | --- | --- |
| Development | `.env.local` | diisi masing-masing developer | `bun run dev` | — |
| Staging | `.env.staging` | `http://<backend-host>:18000` | `bun run build:staging` | `dist-staging/` |
| Production | `.env.production` | `http://<backend-host>:8000` | `bun run build` | `dist/` |

Ketiga file env berada **di luar Git** karena memuat alamat host internal. Repo
ini publik, jadi alamat sebenarnya tidak dipublikasikan; yang tercantum di sini
hanya placeholder `<backend-host>`.

`.env.staging` dan `.env.production` dibuat sekali secara manual di server:

```bash
cd /var/www/frontend-telemetering/hydro-telemetry-react && cp .env.example .env.production && cp .env.example .env.staging
```

lalu isi `VITE_API_BASE_URL` masing-masing dengan alamat backend yang sesuai
(host saja, tanpa `/api/v1`). Keduanya bertahan saat `git pull` berikutnya.

**Alamat backend ikut ter-bundle saat build.** Satu hasil build tidak bisa
dipindah antar environment; staging dan production harus dibangun terpisah dan
disimpan di direktori berbeda. Keduanya ada di `.gitignore`.

GitHub Actions menaikkan kedua bundle sebagai artefak pada setiap jalannya.

### Deployment di server

Satu checkout melayani kedua environment dari dua direktori build:

```text
/var/www/frontend-telemetering/hydro-telemetry-react/
├── dist/           <- production
└── dist-staging/   <- staging
```

Berkas konfigurasinya ada di [`deploy/`](./deploy).

#### Cara yang dipakai sekarang: `vite preview` lewat systemd

| Environment | Service | Port |
| --- | --- | --- |
| Production | `hydro-telemetry-frontend` | 4173 |
| Staging | `hydro-telemetry-frontend-staging` | 4174 |

```bash
sudo cp deploy/hydro-telemetry-frontend.service deploy/hydro-telemetry-frontend-staging.service /etc/systemd/system/ && sudo systemctl daemon-reload
```

```bash
sudo systemctl enable --now hydro-telemetry-frontend hydro-telemetry-frontend-staging
```

Server preview Vite sudah menangani fallback SPA, jadi refresh browser pada
route dalam seperti `/dashboard/plta/<id>/trends` tetap bekerja. Responsnya juga
sudah dikompresi gzip.

Dua catatan pada unit yang dipakai:

- **`--strictPort` wajib.** Tanpa itu, bila port sudah terpakai Vite diam-diam
  pindah ke port berikutnya dan bertabrakan dengan service satunya, sehingga
  operator bisa membuka build yang salah tanpa satu pun pesan error.
- **`--outDir` wajib.** Default `vite preview` adalah `dist/`, jadi service
  staging harus menunjuk `dist-staging/` secara eksplisit.

#### Alternatif: nginx

`vite preview` adalah server Node satu proses yang memang tidak ditujukan untuk
produksi. Untuk skala jaringan internal ini hal itu memadai, tetapi nginx
memberi header cache per jenis aset, log akses, dan penyajian yang tidak putus
saat proses di-restart. Konfigurasinya sudah siap di
[`deploy/nginx.conf`](./deploy/nginx.conf) (production pada port 80, staging
pada 8080):

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/telemetering && sudo ln -sf /etc/nginx/sites-available/telemetering /etc/nginx/sites-enabled/telemetering && sudo nginx -t && sudo systemctl reload nginx
```

### Runbook rilis

Rilis di server dijalankan lewat satu skrip. Selalu lewat staging lebih dulu:
production tetap menyajikan build lama sebagai jaring pengaman sampai staging
terbukti benar.

```bash
./deploy/deploy.sh staging
```

```bash
./deploy/deploy.sh production
```

Skrip itu menarik perubahan, memasang dependency, membangun, memuat ulang
service, lalu memeriksa portnya merespons. Ia berhenti dengan pesan jelas bila
file env belum ada — tanpa pemeriksaan itu build tidak error, melainkan diam-diam
menunjuk backend yang salah. Untuk production ia juga meminta konfirmasi dan
memperingatkan bila revisi yang sama belum pernah dirilis ke staging.

| Opsi | Kegunaan |
| --- | --- |
| `--yes` | Lewati konfirmasi production, untuk pemakaian non-interaktif |
| `--skip-pull` | Bangun ulang kode yang sudah ada, tanpa `git pull` |
| `--ref <sha>` | Rilis revisi tertentu; inilah cara rollback |

Rollback production ke revisi sebelumnya:

```bash
./deploy/deploy.sh production --ref <sha> --yes
```

Perintah `git log --oneline -5` menampilkan pilihan sha-nya. Kembali ke versi
terbaru cukup dengan `git checkout main` lalu jalankan skrip tanpa `--ref`.

#### Langkah manualnya

Bila perlu dikerjakan tanpa skrip:

**1. Di laptop — pastikan lolos quality gate, lalu push**

```bash
bun run check && git add -A && git commit -m "<ringkasan perubahan>" && git push origin main
```

**2. Di server — tarik perubahan**

```bash
cd /var/www/frontend-telemetering/hydro-telemetry-react && git pull && bun install --frozen-lockfile
```

Sampai titik ini production belum tersentuh sama sekali.

**3. Rilis ke staging, lalu periksa**

```bash
bun run build:staging && sudo systemctl restart hydro-telemetry-frontend-staging
```

Buka `http://<host-server>:4174` dan **login** — itu request pertama ke backend,
dan satu-satunya cara membuktikan aplikasinya benar-benar hidup. Respons `200`
dari server statis tidak membuktikan apa pun. Lanjutkan ke Overview, Telemetering,
Tren & Grafik, dan Laporan.

**4. Rilis ke production, hanya bila langkah 3 bersih**

```bash
bun run build && sudo systemctl restart hydro-telemetry-frontend
```

**Rollback bila production bermasalah**

```bash
git log --oneline -5
```

```bash
git checkout <sha-sebelumnya> && bun run build && sudo systemctl restart hydro-telemetry-frontend
```

Kembali ke versi terbaru dengan `git checkout main`.

#### Kapan ada langkah tambahan

| Perubahan | Langkah tambahan |
| --- | --- |
| Menambah variabel `VITE_*` baru | Tambahkan ke `.env.production` dan `.env.staging` di server sebelum build; keduanya di luar Git |
| Mengubah berkas di `deploy/` | Salin ulang ke `/etc/systemd/system/` lalu `sudo systemctl daemon-reload` |
| Alamat backend berganti | Ubah `VITE_API_BASE_URL` di file env terkait, lalu build ulang — nilainya ikut ter-bundle |
| Tidak ada perubahan dependency | `bun install` boleh dilewati, tapi menjalankannya tidak merugikan |

`restart` diperlukan karena `vite preview` membaca daftar file saat start. Bila
nanti pindah ke nginx, langkah itu hilang — nginx membaca langsung dari disk.

Bila staging perlu mengikuti branch yang berbeda dari production, gandakan
checkout-nya (`hydro-telemetry-react-staging`) dan arahkan `root` server block
staging ke `dist/` milik checkout itu.

### CORS

Dengan base URL absolut, browser mengakses backend lintas origin sambil
mengirim credentials, jadi backend wajib mengembalikan
`Access-Control-Allow-Origin` berisi origin frontend secara **eksplisit** —
wildcard `*` ditolak browser saat credentials disertakan — beserta
`Access-Control-Allow-Credentials: true`. Dengan dua environment, kedua origin
harus terdaftar di backend:

| Frontend | Origin yang harus diizinkan | Backend yang diakses |
| --- | --- | --- |
| Production | `http://<host-server>:4173` | `http://<backend-host>:8000` |
| Staging | `http://<host-server>:4174` | `http://<backend-host>:18000` |

Bila nanti pindah ke nginx, port pada origin berubah menjadi `80` dan `8080`.

Bila lebih praktis menghindari CORS, proksikan backend pada origin yang sama
lalu isi `VITE_API_BASE_URL` dengan `/`; blok proxy-nya sudah disiapkan dalam
keadaan nonaktif di `nginx.conf`.

### Catatan dependency

`prop-types` dan `react-is` terdaftar sebagai dependency langsung tetapi tidak
diimpor kode aplikasi. Keduanya ada untuk memenuhi peer dependency
`react-simple-maps`, yang rentang peer-nya berhenti di React 18. Jangan dihapus
tanpa mengganti pustaka petanya lebih dulu.
