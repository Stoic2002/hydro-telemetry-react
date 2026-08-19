import { describe, expect, it } from 'vitest';
import { hasDuplicateApiPrefix } from './env';

describe('hasDuplicateApiPrefix', () => {
  it('menerima base URL yang hanya berisi host', () => {
    expect(hasDuplicateApiPrefix('http://backend.internal:8000')).toBe(false);
    expect(hasDuplicateApiPrefix('http://backend.internal:18000/')).toBe(false);
    expect(hasDuplicateApiPrefix('https://backend.internal')).toBe(false);
  });

  it('menerima nilai proksi origin yang sama', () => {
    expect(hasDuplicateApiPrefix('/')).toBe(false);
  });

  it('menolak base URL yang sudah memuat prefix endpoint', () => {
    // Endpoint repository sudah menulis /api/v1, jadi path akan tergandakan.
    expect(hasDuplicateApiPrefix('http://backend.internal:8000/api/v1')).toBe(true);
    expect(hasDuplicateApiPrefix('http://backend.internal:8000/api/v1/')).toBe(true);
    expect(hasDuplicateApiPrefix('http://backend.internal:8000/api')).toBe(true);
    expect(hasDuplicateApiPrefix('/api')).toBe(true);
    expect(hasDuplicateApiPrefix('/api/v2')).toBe(true);
  });

  it('tidak salah menolak host yang kebetulan mengandung kata api', () => {
    expect(hasDuplicateApiPrefix('http://api.internal:8000')).toBe(false);
    expect(hasDuplicateApiPrefix('http://host:8000/rapi')).toBe(false);
  });
});
