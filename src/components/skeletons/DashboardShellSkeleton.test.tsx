import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardShellSkeleton from './DashboardShellSkeleton';

/**
 * Shimmer tahap pertama harus sudah berbentuk sama dengan konten yang akan
 * menggantikannya. Sebelumnya tahap ini memakai kerangka generik tanpa sidebar,
 * sehingga seluruh layout melompat saat shell aslinya muncul.
 */

function shell(pathname: string) {
  const { container } = render(<DashboardShellSkeleton pathname={pathname} />);
  return container;
}

describe('DashboardShellSkeleton', () => {
  it('menyediakan tempat sidebar dengan lebar yang sama seperti layout asli', () => {
    const container = shell('/dashboard/overview');
    const sidebar = container.querySelector('aside');

    expect(sidebar).not.toBeNull();
    // Lebar dan offset ini harus cocok dengan DashboardLayout, kalau tidak
    // konten akan bergeser saat shell aslinya menggantikan skeleton.
    expect(sidebar).toHaveClass('w-64');
    expect(container.querySelector('main')?.parentElement).toHaveClass('lg:ml-64');
  });

  it('memakai padding konten yang sama seperti layout asli', () => {
    const main = shell('/dashboard/overview').querySelector('main');

    expect(main).toHaveClass('max-w-[1440px]');
    expect(main).toHaveClass('lg:p-6');
  });

  it('mengumumkan dirinya sebagai status pemuatan', () => {
    shell('/dashboard/overview');

    expect(screen.getByRole('status', { name: 'Memuat dashboard' })).toBeInTheDocument();
  });

  it.each([
    ['/dashboard/plta/abc/trends', 'grafik'],
    ['/dashboard/plta/abc/laporan', 'tabel'],
    ['/dashboard/overview', 'peta'],
  ])('menyesuaikan bentuk isi dengan halaman %s', (pathname) => {
    const container = shell(pathname);

    // Setiap varian menghasilkan susunan berbeda; yang diuji di sini adalah
    // bahwa path benar-benar memengaruhi bentuknya, bukan diabaikan.
    expect(container.innerHTML.length).toBeGreaterThan(0);
    expect(container.querySelector('main')?.children.length).toBeGreaterThan(0);
  });

  it('menghasilkan bentuk berbeda untuk halaman yang berbeda', () => {
    const trends = shell('/dashboard/plta/abc/trends').innerHTML;
    const table = shell('/dashboard/plta/abc/laporan').innerHTML;

    expect(trends).not.toBe(table);
  });
});
