import { ApiError } from '../../api/http';

export function getTelemetryUploadErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    if (error.status === 400) {
      return 'Target upload atau data yang dikirim tidak valid';
    }
    if (error.status === 413) return 'Ukuran file melebihi batas 5 MB';
    if (error.status === 422) return 'Format data upload tidak valid';
    if (error.status === 0) {
      return 'Tidak dapat terhubung ke server telemetri';
    }
    return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan saat mengunggah data telemetri';
}
