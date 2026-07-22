import type { AuthTokens } from '../../../api/http/auth-session';
import type { AuthUserResponse } from '../model';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  getCurrentUser(): Promise<AuthUserResponse>;
}
