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
| `VITE_API_BASE_URL` | Tidak | `/api` | Base URL backend, dapat berupa path relatif atau URL HTTP(S) |

Konfigurasi environment divalidasi saat aplikasi dimuat. Nilai yang tidak valid
akan menghasilkan error eksplisit dari `src/shared/lib/env.ts`.

## Scripts

| Command | Kegunaan |
| --- | --- |
| `bun run dev` | Menjalankan development server |
| `bun run build` | Typecheck dan membuat production bundle |
| `bun run preview` | Menjalankan hasil production build secara lokal |
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

## Production build

```bash
bun run build
bun run preview
```

Output production dibuat di `dist/` dan tidak disimpan di Git.
