import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { createApiResponseParser } from './response-parser';

const parseResponse = createApiResponseParser('Respons server tidak valid');
const userSchema = z.object({
  id: z.string(),
  active: z.boolean(),
});

describe('createApiResponseParser', () => {
  it('returns validated and typed response data', () => {
    expect(parseResponse(
      { id: 'user-1', active: true },
      userSchema,
      '/api/v1/users/user-1',
    )).toEqual({ id: 'user-1', active: true });
  });

  it('turns an invalid backend contract into an actionable API error', () => {
    expect.assertions(6);

    try {
      parseResponse(
        { id: 10, active: 'yes' },
        userSchema,
        '/api/v1/users/user-1',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(ApiError.isApiError(error)).toBe(true);
      expect((error as ApiError).message).toBe('Respons server tidak valid');
      expect((error as ApiError).status).toBe(502);
      expect((error as ApiError).statusText).toBe('Invalid API Response');
      expect((error as ApiError).url).toBe('/api/v1/users/user-1');
    }
  });
});

