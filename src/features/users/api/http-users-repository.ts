import { ApiError, apiRequest } from '../../../api/http';
import type {
  ChangePasswordInput,
  CreateUserInput,
  PaginatedUsers,
  UpdateUserInput,
  UserAccount,
  UserListParams,
} from '../model';
import type { UsersRepository } from './users-repository';
import {
  apiUserSchema,
  paginatedUsersSchema,
  type ApiUser,
} from './schemas';

function parseResponse<T>(
  payload: unknown,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } },
  endpoint: string,
): T {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  throw new ApiError('Respons server tidak sesuai kontrak User Management', {
    status: 502,
    statusText: 'Invalid API Response',
    details: result.error.flatten(),
    url: endpoint,
  });
}

function mapUser(user: ApiUser): UserAccount {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function mapUpdateInput(input: UpdateUserInput) {
  return {
    email: input.email,
    full_name: input.fullName,
    role: input.role,
    is_active: input.isActive,
  };
}

export const httpUsersRepository: UsersRepository = {
  async list(params: UserListParams): Promise<PaginatedUsers> {
    const payload = await apiRequest<unknown>('/api/v1/users', {
      method: 'GET',
      cache: 'no-store',
      query: {
        page: params.page,
        limit: params.limit,
        search: params.search,
      },
    });
    const result = parseResponse(payload, paginatedUsersSchema, '/api/v1/users');

    return {
      ...result,
      items: result.items.map(mapUser),
    };
  },

  async create(input: CreateUserInput): Promise<UserAccount> {
    const payload = await apiRequest<unknown>('/api/v1/users', {
      method: 'POST',
      cache: 'no-store',
      json: {
        username: input.username,
        email: input.email,
        full_name: input.fullName,
        role: input.role,
        is_active: input.isActive,
        password: input.password,
      },
    });

    return mapUser(parseResponse(payload, apiUserSchema, '/api/v1/users'));
  },

  async updateCurrentUser(input: UpdateUserInput): Promise<UserAccount> {
    const payload = await apiRequest<unknown>('/api/v1/users/me', {
      method: 'PATCH',
      cache: 'no-store',
      json: mapUpdateInput(input),
    });

    return mapUser(parseResponse(payload, apiUserSchema, '/api/v1/users/me'));
  },

  async changeCurrentPassword(input: ChangePasswordInput): Promise<void> {
    await apiRequest<void>('/api/v1/users/me/password', {
      method: 'POST',
      cache: 'no-store',
      json: {
        current_password: input.currentPassword,
        new_password: input.newPassword,
      },
    });
  },

  async updateById(userId: string, input: UpdateUserInput): Promise<UserAccount> {
    const endpoint = `/api/v1/users/${encodeURIComponent(userId)}`;
    const payload = await apiRequest<unknown>(endpoint, {
      method: 'PATCH',
      cache: 'no-store',
      json: mapUpdateInput(input),
    });

    return mapUser(parseResponse(payload, apiUserSchema, endpoint));
  },
};
