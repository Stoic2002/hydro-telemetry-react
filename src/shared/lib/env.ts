import { z } from 'zod';

function isValidApiBaseUrl(value: string): boolean {
  if (value.startsWith('/')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Setiap repository sudah menuliskan `/api/v1/...` pada endpoint-nya, jadi base
 * URL cukup berisi host. Menyertakan `/api/v1` di sini membuat path tergandakan
 * menjadi `/api/v1/api/v1/...` dan seluruh request gagal 404 tanpa petunjuk.
 */
export function hasDuplicateApiPrefix(value: string): boolean {
  const normalized = value.replace(/\/+$/, '');
  return /\/api(\/v\d+)?$/i.test(normalized);
}

const environmentSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .default('/')
    .refine(isValidApiBaseUrl, {
      message: 'Harus berupa path relatif atau URL HTTP(S) yang valid',
    })
    .refine((value) => !hasDuplicateApiPrefix(value), {
      message:
        'Jangan sertakan /api atau /api/v1 pada base URL. Endpoint sudah memuat prefix itu, jadi path akan tergandakan. Isi host saja (mis. http://host:port) atau / bila backend diproksikan pada origin yang sama',
    }),
  /** Kolektor error di jaringan lokal. Kosong berarti pelaporan hanya di memori. */
  VITE_ERROR_REPORT_URL: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === '' || isValidApiBaseUrl(value),
      { message: 'Harus berupa path relatif atau URL HTTP(S) yang valid' },
    ),
  /**
   * Sumber radar presipitasi peta Overview. Layanan ini berada di internet,
   * jadi pada jaringan tertutup nilainya dapat dikosongkan untuk mematikan
   * overlay sekaligus menghentikan percobaan request yang pasti gagal.
   */
  VITE_RAINVIEWER_API_URL: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === '' || isValidApiBaseUrl(value),
      { message: 'Harus berupa URL HTTP(S) yang valid atau dikosongkan' },
    ),
});

const DEFAULT_RAINVIEWER_API_URL = 'https://api.rainviewer.com/public/weather-maps.json';

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
}

const rawApiBaseUrl = parsedEnvironment.data.VITE_API_BASE_URL;

const rawErrorReportUrl = parsedEnvironment.data.VITE_ERROR_REPORT_URL?.trim();
const rawRainviewerUrl = parsedEnvironment.data.VITE_RAINVIEWER_API_URL?.trim();

export const env = Object.freeze({
  apiBaseUrl: rawApiBaseUrl === '/'
    ? rawApiBaseUrl
    : rawApiBaseUrl.replace(/\/+$/, ''),
  errorReportUrl: rawErrorReportUrl ? rawErrorReportUrl : null,
  rainviewerApiUrl: rawRainviewerUrl === undefined
    ? DEFAULT_RAINVIEWER_API_URL
    : (rawRainviewerUrl || null),
});
