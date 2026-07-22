import { ApiError } from '../../api/http';

export function getPLTAErrorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) {
    return error instanceof Error
      ? error.message
      : 'Terjadi kesalahan saat memuat data PLTA';
  }

  if (error.status === 0) {
    return 'Tidak dapat terhubung ke server. Periksa VITE_API_BASE_URL dan pastikan backend sedang aktif.';
  }
  if (error.status === 403) return 'Anda tidak memiliki izin untuk mengakses data PLTA';
  if (error.status === 404) return 'Data PLTA tidak ditemukan';
  if (error.status === 422) return 'Filter data PLTA tidak lolos validasi server';

  return error.message;
}
