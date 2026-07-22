import { httpUsersRepository } from './http-users-repository';
import type { UsersRepository } from './users-repository';

export const usersRepository: UsersRepository = httpUsersRepository;
