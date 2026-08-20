import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiError } from './api-error';

/**
 * `auth-session` menyimpan status sesi pada level modul, jadi setiap kasus uji
 * memuat ulang modulnya agar tidak saling mewarisi keadaan.
 */
type AuthSessionModule = typeof import('./auth-session');

const STORAGE_KEY = 'tele.auth.session';

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  token_type: 'bearer',
};

const NEXT_TOKENS = {
  access_token: 'access-2',
  refresh_token: 'refresh-2',
  token_type: 'bearer',
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    url: '/api/v1/auth/refresh',
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Promise yang penyelesaiannya dikendalikan dari kasus uji. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

let fetchMock: ReturnType<typeof vi.fn>;

async function loadModule(): Promise<AuthSessionModule> {
  vi.resetModules();
  return import('./auth-session');
}

beforeEach(() => {
  window.sessionStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('penyimpanan token', () => {
  it('menyimpan dan membaca kembali token dari sessionStorage', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);

    expect(auth.getAccessToken()).toBe('access-1');
    expect(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(TOKENS);
  });

  it('membuang isi storage yang tidak sesuai kontrak', async () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ access_token: '' }));
    const auth = await loadModule();

    expect(auth.getAuthTokens()).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('tidak roboh saat isi storage bukan JSON', async () => {
    window.sessionStorage.setItem(STORAGE_KEY, 'bukan json');
    const auth = await loadModule();

    expect(auth.getAuthTokens()).toBeNull();
  });

  it('memberi tahu pelanggan saat sesi dibuat dan dihapus', async () => {
    const auth = await loadModule();
    const listener = vi.fn();
    const unsubscribe = auth.subscribeToAuthSession(listener);

    auth.setAuthTokens(TOKENS);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ access_token: 'access-1' }));

    auth.clearAuthTokens();
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    auth.setAuthTokens(TOKENS);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('refreshAuthSession', () => {
  it('tidak menghubungi server bila belum ada sesi', async () => {
    const auth = await loadModule();

    await expect(auth.refreshAuthSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('menyimpan token baru dan mengirim refresh token yang berlaku', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockResolvedValue(jsonResponse(NEXT_TOKENS));

    await expect(auth.refreshAuthSession()).resolves.toEqual(NEXT_TOKENS);
    expect(auth.getAccessToken()).toBe('access-2');

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ refresh_token: 'refresh-1' });
    expect(init.method).toBe('POST');
  });

  it('menggabungkan panggilan bersamaan menjadi satu request', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    const pending = deferred<Response>();
    fetchMock.mockReturnValue(pending.promise);

    const first = auth.refreshAuthSession();
    const second = auth.refreshAuthSession();
    expect(first).toBe(second);

    pending.resolve(jsonResponse(NEXT_TOKENS));
    await expect(first).resolves.toEqual(NEXT_TOKENS);
    // Tanpa penggabungan ini, setiap request 401 yang bersamaan akan memicu
    // refresh sendiri-sendiri dan saling membatalkan token.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('memulai request baru setelah refresh sebelumnya selesai', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockResolvedValue(jsonResponse(NEXT_TOKENS));

    await auth.refreshAuthSession();
    await auth.refreshAuthSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('membuang respons yang datang setelah logout, bukan menghidupkan sesi', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    const pending = deferred<Response>();
    fetchMock.mockReturnValue(pending.promise);

    const refreshing = auth.refreshAuthSession();
    auth.clearAuthTokens();
    pending.resolve(jsonResponse(NEXT_TOKENS));

    await expect(refreshing).resolves.toBeNull();
    // Inilah inti proteksinya: sesi yang sudah dihapus tidak boleh hidup lagi
    // karena respons yang terlanjur di jalan.
    expect(auth.getAuthTokens()).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('membuang respons bila pengguna lain sudah login saat refresh berjalan', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    const pending = deferred<Response>();
    fetchMock.mockReturnValue(pending.promise);

    const refreshing = auth.refreshAuthSession();
    auth.setAuthTokens({ ...NEXT_TOKENS, refresh_token: 'refresh-lain' });
    pending.resolve(jsonResponse(NEXT_TOKENS));

    await expect(refreshing).resolves.toBeNull();
    expect(auth.getAuthTokens()?.refresh_token).toBe('refresh-lain');
  });

  it.each([401, 422])('menghapus sesi saat server menolak dengan %i', async (status) => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'ditolak' }, status));

    await expect(auth.refreshAuthSession()).resolves.toBeNull();
    expect(auth.getAuthTokens()).toBeNull();
  });

  it('melempar dan mempertahankan sesi saat server sedang gangguan', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    await expect(auth.refreshAuthSession()).rejects.toMatchObject({ status: 503 });
    // 5xx bersifat sementara; token tidak boleh ikut dibuang.
    expect(auth.getAccessToken()).toBe('access-1');
  });

  it('menghapus sesi saat respons refresh tidak sesuai kontrak', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'ada', refresh_token: '' }));

    await expect(auth.refreshAuthSession()).rejects.toMatchObject({ status: 502 });
    expect(auth.getAuthTokens()).toBeNull();
  });

  it('melaporkan server tak terjangkau sebagai kegagalan jaringan', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await auth.refreshAuthSession().catch((caught: ApiError) => caught);

    expect(error).toMatchObject({ status: 0, statusText: 'Network Error' });
    expect(auth.getAccessToken()).toBe('access-1');
  });

  it('membuka kunci refresh setelah kegagalan, bukan mengunci selamanya', async () => {
    const auth = await loadModule();
    auth.setAuthTokens(TOKENS);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await auth.refreshAuthSession().catch(() => null);
    fetchMock.mockResolvedValue(jsonResponse(NEXT_TOKENS));

    await expect(auth.refreshAuthSession()).resolves.toEqual(NEXT_TOKENS);
  });
});

describe('logout lintas tab', () => {
  it('menyiarkan logout hanya bila diminta', async () => {
    const auth = await loadModule();
    const postMessage = vi.spyOn(BroadcastChannel.prototype, 'postMessage');

    auth.setAuthTokens(TOKENS);
    auth.clearAuthTokens();
    expect(postMessage).not.toHaveBeenCalled();

    auth.setAuthTokens(TOKENS);
    auth.clearAuthTokens({ broadcast: true });
    expect(postMessage).toHaveBeenCalledWith({ type: 'logout' });

    postMessage.mockRestore();
  });
});
