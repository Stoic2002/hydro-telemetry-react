import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './fetcher';
import { getAccessToken, refreshAuthSession } from './auth-session';
import { reportError, type ErrorReportContext } from '../../shared/lib/report-error';

vi.mock('./auth-session', () => ({
  getAccessToken: vi.fn(() => null),
  refreshAuthSession: vi.fn(async () => null),
}));

vi.mock('../../shared/lib/report-error', () => ({
  reportError: vi.fn(),
}));

const getAccessTokenMock = vi.mocked(getAccessToken);
const refreshAuthSessionMock = vi.mocked(refreshAuthSession);
const reportErrorMock = vi.mocked(reportError);

interface ResponseOptions {
  status?: number;
  contentType?: string | null;
  contentLength?: string | null;
  body?: unknown;
  statusText?: string;
}

function makeResponse({
  status = 200,
  contentType = 'application/json',
  contentLength = null,
  body = {},
  statusText = 'OK',
}: ResponseOptions = {}): Response {
  const headers = new Headers();
  if (contentType) headers.set('content-type', contentType);
  if (contentLength !== null) headers.set('content-length', contentLength);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers,
    url: '/api/v1/test',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    blob: () => Promise.resolve(new Blob(['biner'])),
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(makeResponse());
  vi.stubGlobal('fetch', fetchMock);
  getAccessTokenMock.mockReturnValue(null);
  refreshAuthSessionMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastRequestHeaders(callIndex = 0): Headers {
  return fetchMock.mock.calls[callIndex][1].headers as Headers;
}

describe('penyusunan request', () => {
  it('meminta JSON dan mengirim credentials secara default', async () => {
    await apiRequest('/api/v1/plta');

    expect(lastRequestHeaders().get('Accept')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });

  it('melampirkan token saat sesi tersedia', async () => {
    getAccessTokenMock.mockReturnValue('token-abc');
    await apiRequest('/api/v1/plta');

    expect(lastRequestHeaders().get('Authorization')).toBe('Bearer token-abc');
  });

  it('tidak melampirkan token pada request tanpa autentikasi', async () => {
    getAccessTokenMock.mockReturnValue('token-abc');
    await apiRequest('/api/v1/auth/login', { auth: false });

    expect(lastRequestHeaders().get('Authorization')).toBeNull();
  });

  it('menyerialkan opsi json beserta Content-Type-nya', async () => {
    await apiRequest('/api/v1/plta', { method: 'POST', json: { nama: 'Soedirman' } });

    expect(fetchMock.mock.calls[0][1].body).toBe('{"nama":"Soedirman"}');
    expect(lastRequestHeaders().get('Content-Type')).toBe('application/json');
  });

  it('menolak pemakaian json dan body sekaligus', async () => {
    await expect(
      apiRequest('/api/v1/plta', { json: {}, body: 'x' }),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('tidak menyetel Content-Type untuk FormData agar boundary tetap benar', async () => {
    const formData = new FormData();
    formData.set('file', new Blob(['x']));
    await apiRequest('/api/v1/upload', { method: 'POST', body: formData });

    expect(lastRequestHeaders().get('Content-Type')).toBeNull();
  });
});

describe('pembacaan respons', () => {
  it.each([204, 205])('mengembalikan undefined untuk status %i', async (status) => {
    fetchMock.mockResolvedValue(makeResponse({ status, contentType: null }));

    await expect(apiRequest('/api/v1/plta')).resolves.toBeUndefined();
  });

  it('mengembalikan undefined saat content-length nol', async () => {
    fetchMock.mockResolvedValue(makeResponse({ contentLength: '0' }));

    await expect(apiRequest('/api/v1/plta')).resolves.toBeUndefined();
  });

  it('mengembalikan blob untuk berkas Excel', async () => {
    fetchMock.mockResolvedValue(makeResponse({
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));

    await expect(apiRequest('/api/v1/reports/1/download')).resolves.toBeInstanceOf(Blob);
  });

  it('mengembalikan teks untuk tipe konten lain', async () => {
    fetchMock.mockResolvedValue(makeResponse({ contentType: 'text/plain', body: 'halo' }));

    await expect(apiRequest('/api/v1/ping')).resolves.toBe('halo');
  });

  it('tidak roboh saat body JSON ternyata rusak', async () => {
    const broken = makeResponse();
    (broken as unknown as { json: () => Promise<unknown> }).json = () => Promise.reject(new Error('rusak'));
    fetchMock.mockResolvedValue(broken);

    await expect(apiRequest('/api/v1/plta')).resolves.toBeUndefined();
  });
});

describe('pesan error', () => {
  it('memakai field message dari server bila ada', async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 400, body: { message: 'Tahun wajib diisi' } }));

    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({
      message: 'Tahun wajib diisi',
      status: 400,
    });
  });

  it('memakai field detail bila message tidak ada', async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 400, body: { detail: 'Format salah' } }));

    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({ message: 'Format salah' });
  });

  it.each([
    [401, 'Sesi tidak valid atau telah berakhir'],
    [403, 'Anda tidak memiliki akses untuk aksi ini'],
  ])('memberi kalimat baku untuk status %i tanpa pesan server', async (status, message) => {
    fetchMock.mockResolvedValue(makeResponse({ status, body: {} }));

    await expect(
      apiRequest('/api/v1/plta', { retryOnUnauthorized: false }),
    ).rejects.toMatchObject({ message });
  });
});

describe('pemulihan sesi pada 401', () => {
  it('mengulang request dengan token baru setelah refresh berhasil', async () => {
    getAccessTokenMock.mockReturnValue('token-lama');
    refreshAuthSessionMock.mockResolvedValue({
      access_token: 'token-baru',
      refresh_token: 'refresh',
      token_type: 'bearer',
    });
    fetchMock
      .mockResolvedValueOnce(makeResponse({ status: 401, body: {} }))
      .mockResolvedValueOnce(makeResponse({ body: { id: 'plta-1' } }));

    await expect(apiRequest('/api/v1/plta')).resolves.toEqual({ id: 'plta-1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastRequestHeaders(1).get('Authorization')).toBe('Bearer token-baru');
  });

  it('menyerah tanpa mengulang bila refresh gagal', async () => {
    refreshAuthSessionMock.mockResolvedValue(null);
    fetchMock.mockResolvedValue(makeResponse({ status: 401, body: {} }));

    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hanya mengulang satu kali, tidak berputar', async () => {
    refreshAuthSessionMock.mockResolvedValue({
      access_token: 'token-baru',
      refresh_token: 'refresh',
      token_type: 'bearer',
    });
    fetchMock.mockResolvedValue(makeResponse({ status: 401, body: {} }));

    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshAuthSessionMock).toHaveBeenCalledTimes(1);
  });

  it('tidak mencoba refresh saat opsi itu dimatikan', async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 401, body: {} }));

    await expect(
      apiRequest('/api/v1/plta', { retryOnUnauthorized: false }),
    ).rejects.toMatchObject({ status: 401 });
    expect(refreshAuthSessionMock).not.toHaveBeenCalled();
  });
});

describe('kegagalan jaringan', () => {
  it('membungkus kegagalan koneksi sebagai ApiError status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({
      status: 0,
      message: 'Tidak dapat terhubung ke server',
    });
  });

  it('meneruskan pembatalan apa adanya, bukan sebagai kegagalan server', async () => {
    fetchMock.mockRejectedValue(new DOMException('dibatalkan', 'AbortError'));

    // Pembatalan terjadi normal saat komponen dilepas; jangan sampai muncul
    // sebagai error di layar atau di laporan.
    await expect(apiRequest('/api/v1/plta')).rejects.toMatchObject({ name: 'AbortError' });
    expect(reportErrorMock).not.toHaveBeenCalled();
  });
});

describe('pelaporan kegagalan', () => {
  function reportedScopes(): string[] {
    return reportErrorMock.mock.calls.map(([, context]) => (context as ErrorReportContext).scope);
  }

  it('melaporkan kegagalan sisi server', async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 500, body: {} }));

    await apiRequest('/api/v1/plta').catch(() => null);

    expect(reportedScopes()).toEqual(['api']);
  });

  it('melaporkan backend yang tidak terjangkau', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await apiRequest('/api/v1/plta').catch(() => null);

    expect(reportedScopes()).toEqual(['api']);
  });

  it.each([400, 401, 403, 404, 422])('tidak melaporkan status %i yang merupakan alur normal', async (status) => {
    fetchMock.mockResolvedValue(makeResponse({ status, body: {} }));

    await apiRequest('/api/v1/plta', { retryOnUnauthorized: false }).catch(() => null);

    expect(reportErrorMock).not.toHaveBeenCalled();
  });
});
