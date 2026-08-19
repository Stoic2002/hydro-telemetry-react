import { describe, expect, it } from 'vitest';
import type { User, UserRole } from '../../types';
import { canAccessDataTools, canManageUsers } from './permissions';

function userWithRole(role: UserRole): User {
  return {
    id: 'user-1',
    name: 'Budi Santoso',
    username: 'budi.santoso',
    email: 'budi@example.com',
    role,
    accessPLTA: [],
    status: 'Aktif',
  };
}

describe('permissions', () => {
  it('hanya mengizinkan admin mengelola user', () => {
    expect(canManageUsers(userWithRole('Super Admin'))).toBe(true);
    expect(canManageUsers(userWithRole('Admin UBP'))).toBe(true);
    expect(canManageUsers(userWithRole('Operator PLTA'))).toBe(false);
    expect(canManageUsers(userWithRole('Viewer'))).toBe(false);
  });

  it('menutup Input GHW dan Katalog Data untuk Viewer saja', () => {
    expect(canAccessDataTools(userWithRole('Super Admin'))).toBe(true);
    expect(canAccessDataTools(userWithRole('Operator PLTA'))).toBe(true);
    expect(canAccessDataTools(userWithRole('Viewer'))).toBe(false);
  });

  it('menolak akses saat profil sesi belum tersedia', () => {
    expect(canManageUsers(null)).toBe(false);
    expect(canAccessDataTools(null)).toBe(false);
  });
});
