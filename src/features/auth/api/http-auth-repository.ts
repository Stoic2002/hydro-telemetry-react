import { apiRequest, createApiResponseParser, type AuthTokens } from '../../../api/http';
import type { AuthUserResponse } from '../model';
import type { AuthRepository, LoginCredentials } from './auth-repository';
import {
  authTokensSchema,
  authUserResponseSchema,
  loginCredentialsSchema,
} from './schemas';

const parseResponse = createApiResponseParser('Respons server tidak sesuai kontrak API');

export const httpAuthRepository: AuthRepository = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const validCredentials = loginCredentialsSchema.parse(credentials);
    const formData = new URLSearchParams();
    formData.set('username', validCredentials.username);
    formData.set('password', validCredentials.password);

    const payload = await apiRequest<unknown>('/api/v1/auth/login', {
      method: 'POST',
      cache: 'no-store',
      body: formData,
      auth: false,
      retryOnUnauthorized: false,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return parseResponse(payload, authTokensSchema, '/api/v1/auth/login');
  },

  async getCurrentUser(): Promise<AuthUserResponse> {
    const payload = await apiRequest<unknown>('/api/v1/auth/me', {
      method: 'GET',
      cache: 'no-store',
    });

    return parseResponse(payload, authUserResponseSchema, '/api/v1/auth/me');
  },
};
