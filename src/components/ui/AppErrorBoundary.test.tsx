import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppErrorBoundary from './AppErrorBoundary';
import {
  resetErrorReportThrottle,
  setErrorReporter,
  type ErrorReport,
} from '../../shared/lib/report-error';

function Exploding({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('render gagal');
  return <p>Konten halaman</p>;
}

function Harness() {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <AppErrorBoundary scope="test" onReset={() => setShouldThrow(false)}>
      <Exploding shouldThrow={shouldThrow} />
    </AppErrorBoundary>
  );
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    resetErrorReportThrottle();
    // React menuliskan error yang tertangkap boundary ke console; itu ekspektasi.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setErrorReporter(null);
  });

  it('menampilkan fallback dan melaporkan error, bukan layar kosong', () => {
    const reports: ErrorReport[] = [];
    setErrorReporter((report) => reports.push(report));

    render(
      <AppErrorBoundary scope="dashboard-page">
        <Exploding shouldThrow />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Halaman ini gagal ditampilkan')).toBeInTheDocument();
    expect(reports).toHaveLength(1);
    expect(reports[0].scope).toBe('dashboard-page');
    expect(reports[0].severity).toBe('fatal');
  });

  it('memakai penjelasan khusus bila error dikenali', () => {
    render(
      <AppErrorBoundary
        scope="test"
        describeError={() => ({
          title: 'PLTA ini belum bisa dibuka',
          description: 'Pilih PLTA lain dari sidebar.',
        })}
      >
        <Exploding shouldThrow />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('PLTA ini belum bisa dibuka')).toBeInTheDocument();
  });

  it('memulihkan tampilan lewat tombol coba lagi', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Konten halaman')).toBeInTheDocument();
  });

  it('pulih sendiri saat operator pindah halaman', () => {
    const view = render(
      <AppErrorBoundary scope="test" resetKey="/dashboard/trends">
        <Exploding shouldThrow />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Halaman ini gagal ditampilkan')).toBeInTheDocument();

    view.rerender(
      <AppErrorBoundary scope="test" resetKey="/dashboard/overview">
        <Exploding shouldThrow={false} />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Konten halaman')).toBeInTheDocument();
  });
});
