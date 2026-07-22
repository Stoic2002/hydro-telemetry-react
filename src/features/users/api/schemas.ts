import { z } from 'zod';

export const apiUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().nullable().optional().default(null),
  full_name: z.string().nullable().optional().default(null),
  role: z.enum(['admin', 'operator', 'viewer']),
  is_active: z.boolean().optional().default(true),
  id: z.string().uuid(),
  created_at: z.string().min(1),
});

export const paginatedUsersSchema = z.object({
  items: z.array(apiUserSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

export type ApiUser = z.infer<typeof apiUserSchema>;
export type ApiPaginatedUsers = z.infer<typeof paginatedUsersSchema>;
