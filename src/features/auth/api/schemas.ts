import { z } from 'zod';
import { authTokensSchema } from '../../../api/http/auth-session';

export const loginCredentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authUserResponseSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().nullable().optional().default(null),
  full_name: z.string().nullable().optional().default(null),
  role: z.enum(['admin', 'operator', 'viewer']),
  is_active: z.boolean().optional().default(true),
  id: z.string().uuid(),
  created_at: z.string().min(1),
});

export { authTokensSchema };
