import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMonitoringStream } from './useMonitoringStream';
import { monitoringQueryKeys } from '../api/queries';
import type { PLTALatestMonitoring } from '../model';
import { getAccessToken, refreshAuthSession } from '../../../api/http';
import { reportError } from '../../../shared/lib/report-error';

// Modul api/http juga dipakai repository monitoring, jadi hanya bagian sesi
// yang diganti; sisanya tetap implementasi aslinya.
vi.mock('../../../api/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/http')>()),
  getAccessToken: vi.fn(() => 'token-uji'),
  refreshAuthSession: vi.fn(async () => null),
  subscribeToAuthSession: vi.fn(() => () => {}),
}));

vi.mock('../../../shared/lib/report-error', () => ({
  reportError: vi.fn(),
}));

const getAccessTokenMock = vi.mocked(getAccessToken);
const refreshAuthSessionMock = vi.mocked(refreshAuthSession);
const reportErrorMock = vi.mocked(reportError);

const PLTA_ID = '11111111-1111-4111-8111-111111111111';

/** WebSocket palsu yang bisa dikendalikan penuh dari kasus uji. */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  closeCode: number | null = null;
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  close(code?: number) {
    this.readyState = FakeWebSocket.CLOSED;
    this.closeCode = code ?? 1000;
  }

  private emit(type: string, event: unknown) {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  simulateOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open', {});
  }

  simulateMessage(data: unknown) {
    this.emit('message', { data: JSON.stringify(data) });
  }

  simulateRawMessage(data: string) {
    this.emit('message', { data });
  }

  simulateClose(code: number, reason = '') {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close', { code, reason });
  }

  static get latest(): FakeWebSocket {
    const socket = FakeWebSocket.instances.at(-1);
    if (!socket) throw new Error('belum ada koneksi WebSocket yang dibuat');
    return socket;
  }
}

const SNAPSHOT_PAYLOAD = {
  plta_id: PLTA_ID,
  parameters: [
    { parameter: 'water_level', station: 'ST-1', value: 231.5, unit: 'mdpl', time: '2026-08-20T07:00:00Z', quality: 'good' },
  ],
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderStream(options: Partial<Parameters<typeof useMonitoringStream>[0]> = {}) {
  return renderHook(
    () => useMonitoringStream({ scope: 'plta', id: PLTA_ID, bootstrapLatest: false, ...options }),
    { wrapper },
  );
}

/** Menjalankan timer terjadwal sekaligus menuntaskan promise yang tertunda. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
  getAccessTokenMock.mockReturnValue('token-uji');
  refreshAuthSessionMock.mockResolvedValue(null);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  queryClient.clear();
});

describe('siklus koneksi', () => {
  it('tidak menyambung saat dinonaktifkan', async () => {
    renderStream({ enabled: false });
    await advance(10);

    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('tidak menyambung saat sesi tidak tersedia', async () => {
    getAccessTokenMock.mockReturnValue(null);
    const { result } = renderStream();
    await advance(10);

    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(result.current.status).toBe('error');
  });

  it('menyambung dan menandai koneksi terbuka', async () => {
    const { result } = renderStream();
    await advance(10);

    expect(FakeWebSocket.instances).toHaveLength(1);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    expect(result.current.status).toBe('open');
  });

  it('menyertakan token dan lingkup pada URL koneksi', async () => {
    renderStream();
    await advance(10);

    const url = new URL(FakeWebSocket.latest.url);
    expect(url.protocol).toMatch(/^wss?:$/);
    expect(url.searchParams.get('token')).toBe('token-uji');
    expect(url.searchParams.get('plta_id')).toBe(PLTA_ID);
  });

  it('memakai ws_id saat lingkupnya wilayah sungai', async () => {
    renderStream({ scope: 'river-basin', id: '22222222-2222-4222-8222-222222222222' });
    await advance(10);

    expect(new URL(FakeWebSocket.latest.url).searchParams.get('ws_id')).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('menutup koneksi saat komponen dilepas', async () => {
    const { unmount } = renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    const socket = FakeWebSocket.latest;
    unmount();

    expect(socket.closeCode).toBe(1000);
  });
});

describe('pesan masuk', () => {
  it('menulis pembacaan terbaru ke cache query', async () => {
    const { result } = renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateMessage(SNAPSHOT_PAYLOAD); });

    const cached = queryClient.getQueryData<PLTALatestMonitoring>(
      monitoringQueryKeys.pltaLatest(PLTA_ID),
    );
    expect(cached?.parameters[0]?.value).toBe(231.5);
    expect(result.current.lastMessageAt).toBeInstanceOf(Date);
  });

  it('menggabungkan pembacaan baru tanpa menghapus parameter lain', async () => {
    renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });
    await act(async () => { FakeWebSocket.latest.simulateMessage(SNAPSHOT_PAYLOAD); });

    await act(async () => {
      FakeWebSocket.latest.simulateMessage({
        plta_id: PLTA_ID,
        parameters: [
          { parameter: 'inflow', station: 'ST-2', value: 12, unit: 'm3/s', time: '2026-08-20T07:05:00Z', quality: 'good' },
        ],
      });
    });

    const cached = queryClient.getQueryData<PLTALatestMonitoring>(
      monitoringQueryKeys.pltaLatest(PLTA_ID),
    );
    // Pesan realtime bersifat parsial; parameter lama harus bertahan.
    expect(cached?.parameters.map((p) => p.parameter).sort()).toEqual(['inflow', 'water_level']);
  });

  it('melaporkan pesan yang tidak sesuai kontrak', async () => {
    const { result } = renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateMessage({ tidak: 'dikenal' }); });

    expect(result.current.error).toMatch(/tidak sesuai kontrak/i);
    expect(reportErrorMock).toHaveBeenCalled();
  });

  it('tidak roboh saat pesan bukan JSON', async () => {
    const { result } = renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateRawMessage('bukan json'); });

    expect(result.current.error).toMatch(/tidak dapat dibaca/i);
  });
});

describe('pemulihan koneksi', () => {
  it('menyambung ulang setelah putus tidak normal', async () => {
    renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateClose(1006); });
    await advance(2_000);

    expect(FakeWebSocket.instances.length).toBeGreaterThan(1);
  });

  it('tidak menyambung ulang setelah penutupan normal', async () => {
    const { result } = renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateClose(1000); });
    await advance(60_000);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(result.current.status).toBe('closed');
  });

  it('memperbarui sesi lebih dulu saat ditutup karena autentikasi', async () => {
    renderStream();
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    await act(async () => { FakeWebSocket.latest.simulateClose(4401); });
    await advance(2_000);

    expect(refreshAuthSessionMock).toHaveBeenCalled();
  });

  it('menyerah setelah batas percobaan dan melaporkannya', async () => {
    const { result } = renderStream();
    await advance(10);

    // Setiap percobaan gagal langsung; jeda backoff maksimum 30 detik.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await act(async () => { FakeWebSocket.latest.simulateClose(1006); });
      await advance(31_000);
    }

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/gagal dipulihkan/i);
    expect(reportErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/menyerah/i) }),
      expect.objectContaining({ scope: 'realtime' }),
    );
  });

  it('menyambung ulang atas permintaan setelah menyerah', async () => {
    const { result } = renderStream();
    await advance(10);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await act(async () => { FakeWebSocket.latest.simulateClose(1006); });
      await advance(31_000);
    }
    const attemptsBefore = FakeWebSocket.instances.length;

    await act(async () => { result.current.reconnect(); });
    await advance(10);

    expect(FakeWebSocket.instances.length).toBeGreaterThan(attemptsBefore);
  });
});

describe('watchdog data basi', () => {
  it('menutup koneksi yang terbuka tetapi berhenti mengirim data', async () => {
    const { result } = renderStream({ staleAfterMs: 5_000 });
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    const socket = FakeWebSocket.latest;
    await advance(5_100);

    // Socket hidup tanpa data adalah kegagalan diam-diam: operator melihat
    // angka lama tanpa satu pun tanda.
    expect(socket.closeCode).toBe(4000);
    expect(result.current.error).toMatch(/berhenti diperbarui/i);
  });

  it('menunda watchdog setiap kali data baru datang', async () => {
    renderStream({ staleAfterMs: 5_000 });
    await advance(10);
    await act(async () => { FakeWebSocket.latest.simulateOpen(); });

    const socket = FakeWebSocket.latest;
    await advance(4_000);
    await act(async () => { socket.simulateMessage(SNAPSHOT_PAYLOAD); });
    await advance(4_000);

    expect(socket.closeCode).toBeNull();
  });
});
