import { ApiError } from '../../api/http';

export function getHydrologyErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    if (error.status === 404) return 'Data hidrologi belum tersedia';
    if (error.status === 410) return 'Berkas hidrologi sudah tidak tersedia';
    if (error.status === 422) return 'Parameter hidrologi tidak valid';
    if (error.status === 0) return 'Tidak dapat terhubung ke server hidrologi';
    return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan saat memuat data hidrologi';
}
