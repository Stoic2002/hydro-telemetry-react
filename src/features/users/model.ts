import type { UserRole } from '../../types';

export type UserApiRole = 'admin' | 'operator' | 'viewer';

export interface UserAccount {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  role: UserApiRole;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  items: UserAccount[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  fullName: string;
  role: UserApiRole;
  isActive: boolean;
  password: string;
}

export interface UpdateUserInput {
  email?: string | null;
  fullName?: string | null;
  role?: UserApiRole;
  isActive?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

const uiRoleByApiRole: Record<UserApiRole, UserRole> = {
  admin: 'Super Admin',
  operator: 'Operator PLTA',
  viewer: 'Viewer',
};

export function mapApiRoleToUIRole(role: UserApiRole): UserRole {
  return uiRoleByApiRole[role];
}

export function getUserDisplayName(user: UserAccount): string {
  return user.fullName?.trim() || user.username;
}

export function getUserInitials(user: UserAccount): string {
  return getUserDisplayName(user)
    .split(' ')
    .map((namePart) => namePart[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
