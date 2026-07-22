import { ApiError } from '../../api/http';

export function getUserManagementErrorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) {
    return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba kembali';
  }

  if (error.status === 0) return 'Tidak dapat terhubung ke server';
  if (error.status === 403) return 'Anda tidak memiliki izin untuk mengelola pengguna';
  if (error.status === 409) return 'Username atau email sudah digunakan';
  if (error.status === 422) return 'Data pengguna tidak lolos validasi server';
  return error.message;
}
