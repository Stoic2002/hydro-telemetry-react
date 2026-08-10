# Frontend Architecture

## Ringkasan keputusan

Arsitektur project adalah **feature-based modular frontend**. Pembagian layer
terinspirasi Feature-Sliced Design, tetapi tidak mengikuti nomenklatur FSD secara
strict. Di dalam feature, akses data menggunakan Repository Pattern dan adapter
HTTP.

Tujuannya:

- perubahan pada satu domain tetap terlokalisasi;
- page fokus pada komposisi, bukan detail transport atau parsing;
- kontrak backend divalidasi pada boundary;
- logic murni dapat diuji tanpa merender seluruh aplikasi;
- UI lintas domain dapat dipakai ulang tanpa circular dependency.

## Dependency direction

Dependency mengalir dari layer yang lebih spesifik menuju layer yang lebih umum:

```text
app
 ├─ layouts
 └─ pages
     ├─ features
     │   ├─ feature components
     │   ├─ query/mutation hooks
     │   ├─ repository interface + implementation
     │   └─ model/schema
     ├─ components
     ├─ store
     ├─ api/http
     └─ shared
```

Aturan praktis:

1. `shared` tidak boleh mengimpor `features`, `pages`, atau `app`.
2. `api/http` tidak mengetahui model UI suatu feature.
3. Feature tidak boleh mengimpor page.
4. Page boleh menggabungkan beberapa feature untuk memenuhi kebutuhan route.
5. Komponen yang hanya digunakan satu page disimpan dekat page tersebut.
6. Komponen dipindahkan ke `components/` hanya setelah benar-benar reusable lintas fitur.

## Tanggung jawab folder

### `src/app`

Composition root aplikasi: provider global, Query Client, dan router. Folder ini
tidak berisi business logic.

### `src/pages`

Entry point setiap route dan orkestrasi lintas fitur. Jika sebuah page mulai
besar, pecah menjadi folder page-specific seperti:

```text
pages/dashboard/
├── Telemetering.tsx
└── telemetering/
    ├── presentation.ts
    ├── MonthlyHydrologyPanels.tsx
    └── HydrologySpatialLayout.tsx
```

`presentation.ts` berisi transformasi data murni dan harus dapat diuji tanpa DOM.

### `src/features`

Satu folder per kapabilitas domain. Struktur feature dapat berisi:

```text
features/forecasting/
├── api/
│   ├── forecasting-repository.ts       # port/interface
│   ├── http-forecasting-repository.ts  # HTTP adapter
│   ├── repository.ts                   # adapter aktif
│   ├── queries.ts                      # React Query boundary
│   └── schemas.ts                      # kontrak response API
├── components/
├── model.ts
└── error.ts
```

Tidak semua feature wajib memiliki semua folder. Hindari membuat folder kosong
hanya untuk mengikuti template.

### `src/api/http`

Infrastruktur transport lintas fitur:

- penyusunan URL dan query string;
- header/auth session;
- refresh token;
- parsing response dan normalisasi `ApiError`.

Mapping payload backend menuju model domain tetap menjadi tanggung jawab HTTP
repository pada feature terkait.

### `src/components`

Komponen presentasional yang digunakan lintas fitur/page. `atoms` berisi primitive
UI; `ui` berisi komponen dengan perilaku lebih lengkap seperti dialog dan sheet.

### `src/shared`

- `shared/lib`: konfigurasi atau integrasi fundamental, misalnya environment dan timezone.
- `shared/utils`: fungsi kecil, pure, dan bebas state, misalnya formatter angka.

Utility khusus domain jangan ditempatkan di sini; simpan dekat feature atau page
yang memilikinya.

### `src/store`

State global client/session dengan Zustand. Data server yang memiliki lifecycle
fetching, stale state, dan invalidation harus tetap berada di TanStack Query.

### `public` dan `src/assets`

- `public`: file yang harus mempertahankan nama/path dan diakses melalui URL root.
- `src/assets`: asset yang di-import dari TS/CSS dan diproses oleh Vite.

### `data`, `hooks`, dan `mocks`

- Buat folder global `data` hanya untuk data statis lintas domain.
- Custom hook khusus domain ditempatkan dekat feature/page, bukan otomatis di folder global `hooks`.
- `mocks` digunakan untuk fixture simulasi/development. Test fixture kecil sebaiknya berada dekat test.

## Data flow API

Contoh forecasting:

```text
Forecasting page
  → useForecastQuery
  → ForecastingRepository
  → httpForecastingRepository
  → apiRequest
  → backend
```

Response backend melewati Zod schema, kemudian dipetakan dari format transport
seperti `snake_case` ke model UI. Komponen tidak boleh menerima payload mentah
backend jika repository sudah menyediakan model domain.

## State management

Gunakan TanStack Query untuk:

- hasil endpoint REST;
- caching dan deduplication;
- loading/error state;
- invalidation setelah mutation.

Gunakan Zustand untuk:

- auth/session state;
- notifikasi global;
- client state yang perlu diakses lintas route.

Gunakan local state untuk state yang hanya dimiliki satu komponen atau page,
seperti dialog terbuka, filter input sementara, dan selection.

## Testing strategy

Test runner: Vitest. DOM environment: JSDOM. Component test: React Testing Library.

Piramida yang diharapkan:

1. Banyak unit test untuk mapper, parser, schema, formatter, dan selector.
2. Sejumlah component/integration test untuk interaksi kritis.
3. E2E test untuk happy path utama dapat ditambahkan saat environment backend test stabil.

Setiap perubahan harus lulus:

```bash
bun run check
```

## Checklist modul baru

- Apakah code ditempatkan di domain yang memilikinya?
- Apakah response eksternal divalidasi sebelum digunakan?
- Apakah page hanya melakukan komposisi dan orkestrasi?
- Apakah helper murni memiliki unit test?
- Apakah komponen interaktif tetap accessible melalui keyboard?
- Apakah tidak ada dependency dari layer umum menuju layer yang lebih spesifik?

