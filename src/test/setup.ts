import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom belum menyediakan ResizeObserver, sementara peta memakainya untuk
// menyesuaikan skala proyeksi terhadap lebar kontainer. Pengganti kosong sudah
// cukup: ukuran awal tetap diambil dari getBoundingClientRect.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
});
