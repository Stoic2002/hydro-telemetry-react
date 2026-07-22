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

const environmentSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .default('/api')
    .refine(isValidApiBaseUrl, {
      message: 'Harus berupa path relatif atau URL HTTP(S) yang valid',
    }),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
}

const rawApiBaseUrl = parsedEnvironment.data.VITE_API_BASE_URL;

export const env = Object.freeze({
  apiBaseUrl: rawApiBaseUrl === '/'
    ? rawApiBaseUrl
    : rawApiBaseUrl.replace(/\/+$/, ''),
});
