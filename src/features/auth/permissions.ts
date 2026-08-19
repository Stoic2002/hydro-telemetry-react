import type { User } from '../../types';

/**
 * Satu sumber aturan role untuk guard route dan visibilitas menu. Sebelumnya
 * kedua tempat itu menuliskan perbandingan role sendiri-sendiri, sehingga menu
 * bisa disembunyikan tanpa route-nya ikut terjaga.
 *
 * Catatan: backend hanya mengenal `admin`, `operator`, dan `viewer`
 * (`features/auth/api/schemas.ts`). Nilai `Admin UBP` masih diikutkan agar
 * perilaku persis sama seperti sebelumnya, walau tidak ada mapper yang bisa
 * menghasilkannya. Pembersihannya menyusul bersama konsolidasi `types/index.ts`.
 */

export function canManageUsers(user: User | null): boolean {
  return user?.role === 'Super Admin' || user?.role === 'Admin UBP';
}

/** Input GHW dan Katalog Data: seluruh role kecuali Viewer. */
export function canAccessDataTools(user: User | null): boolean {
  return user !== null && user.role !== 'Viewer';
}
