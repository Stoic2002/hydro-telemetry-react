import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import {
  AdminOnlyRoute,
  DataToolsRoute,
  GuestOnlyRoute,
  ProtectedRoute,
} from './router';
import { useAuthStore } from '../store/auth-store';
import type { User, UserRole } from '../types';

/**
 * Guard route adalah satu-satunya penegak aturan akses di sisi klien. Aturan
 * yang sama dipakai untuk menyembunyikan menu, jadi bila guard-nya salah, menu
 * yang tersembunyi tetap bisa dibuka lewat URL langsung.
 */

const INITIAL_AUTH_STATE = useAuthStore.getState();

function userWithRole(role: UserRole): User {
  return {
    id: 'user-1',
    name: 'Budi Santoso',
    username: 'budi',
    email: 'budi@example.com',
    role,
    accessPLTA: [],
    status: 'Aktif',
  };
}

function signIn(role: UserRole) {
  useAuthStore.setState({ user: userWithRole(role), isAuthenticated: true });
}

function signOut() {
  useAuthStore.setState({ user: null, isAuthenticated: false });
}

/** Merender guard pada `/rahasia` dan menampilkan tujuan akhirnya. */
function renderGuarded(guard: (children: ReactNode) => ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/rahasia']}>
      <Routes>
        <Route path="/rahasia" element={guard(<p>Halaman terlindungi</p>)} />
        <Route path="/login" element={<p>Halaman login</p>} />
        <Route path="/dashboard" element={<p>Beranda dashboard</p>} />
        <Route path="/dashboard/overview" element={<p>Overview</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useAuthStore.setState(INITIAL_AUTH_STATE, true);
});

describe('ProtectedRoute', () => {
  it('mengalihkan tamu ke halaman login', () => {
    signOut();
    renderGuarded((children) => <ProtectedRoute>{children}</ProtectedRoute>);

    expect(screen.getByText('Halaman login')).toBeInTheDocument();
  });

  it('meloloskan pengguna yang sudah masuk', () => {
    signIn('Operator PLTA');
    renderGuarded((children) => <ProtectedRoute>{children}</ProtectedRoute>);

    expect(screen.getByText('Halaman terlindungi')).toBeInTheDocument();
  });
});

describe('GuestOnlyRoute', () => {
  it('menjauhkan pengguna yang sudah masuk dari halaman login', () => {
    signIn('Viewer');
    renderGuarded((children) => <GuestOnlyRoute>{children}</GuestOnlyRoute>);

    expect(screen.getByText('Beranda dashboard')).toBeInTheDocument();
  });

  it('meloloskan tamu', () => {
    signOut();
    renderGuarded((children) => <GuestOnlyRoute>{children}</GuestOnlyRoute>);

    expect(screen.getByText('Halaman terlindungi')).toBeInTheDocument();
  });
});

describe('AdminOnlyRoute', () => {
  it.each<[UserRole, boolean]>([
    ['Super Admin', true],
    ['Admin UBP', true],
    ['Operator PLTA', false],
    ['Viewer', false],
  ])('role %s boleh mengelola user: %s', (role, allowed) => {
    signIn(role);
    renderGuarded((children) => <AdminOnlyRoute>{children}</AdminOnlyRoute>);

    expect(screen.getByText(allowed ? 'Halaman terlindungi' : 'Overview')).toBeInTheDocument();
  });

  it('menolak saat profil sesi belum tersedia', () => {
    useAuthStore.setState({ user: null, isAuthenticated: true });
    renderGuarded((children) => <AdminOnlyRoute>{children}</AdminOnlyRoute>);

    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});

describe('DataToolsRoute', () => {
  it.each<[UserRole, boolean]>([
    ['Super Admin', true],
    ['Admin UBP', true],
    ['Operator PLTA', true],
    ['Viewer', false],
  ])('role %s boleh membuka Input GHW dan Katalog: %s', (role, allowed) => {
    signIn(role);
    renderGuarded((children) => <DataToolsRoute>{children}</DataToolsRoute>);

    expect(screen.getByText(allowed ? 'Halaman terlindungi' : 'Overview')).toBeInTheDocument();
  });

  it('menolak Viewer yang mengetik URL langsung', () => {
    // Regresi yang dijaga: sebelumnya aturan ini hanya menyembunyikan menu,
    // sehingga membuka /dashboard/catalog secara langsung tetap tembus.
    signIn('Viewer');
    renderGuarded((children) => <DataToolsRoute>{children}</DataToolsRoute>);

    expect(screen.queryByText('Halaman terlindungi')).not.toBeInTheDocument();
  });
});
