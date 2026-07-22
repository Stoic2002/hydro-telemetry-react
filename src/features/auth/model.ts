import type { User, UserRole } from '../../types';

export type ApiUserRole = 'admin' | 'operator' | 'viewer';

export interface AuthUserResponse {
  username: string;
  email: string | null;
  full_name: string | null;
  role: ApiUserRole;
  is_active: boolean;
  id: string;
  created_at: string;
}

const uiRoleByApiRole: Record<ApiUserRole, UserRole> = {
  admin: 'Super Admin',
  operator: 'Operator PLTA',
  viewer: 'Viewer',
};

const avatarColorByApiRole: Record<ApiUserRole, string> = {
  admin: '#f59e0b',
  operator: '#14a2ba',
  viewer: '#64748b',
};

export function mapAuthUserToUIUser(profile: AuthUserResponse): User {
  return {
    id: profile.id,
    name: profile.full_name?.trim() || profile.username,
    username: profile.username,
    email: profile.email ?? '',
    role: uiRoleByApiRole[profile.role],
    accessPLTA: [],
    status: profile.is_active ? 'Aktif' : 'Nonaktif',
    lastLogin: profile.created_at,
    avatarColor: avatarColorByApiRole[profile.role],
  };
}
