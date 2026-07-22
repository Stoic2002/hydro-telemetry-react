import type { AuthRepository } from './auth-repository';
import { httpAuthRepository } from './http-auth-repository';

export const authRepository: AuthRepository = httpAuthRepository;
