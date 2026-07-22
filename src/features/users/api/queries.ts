import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UserListParams,
} from '../model';
import { usersRepository } from './repository';

export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...usersQueryKeys.lists(), params] as const,
  detail: (userId: string) => [...usersQueryKeys.all, 'detail', userId] as const,
};

export function useUsersQuery(params: UserListParams) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => usersRepository.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUserForEditQuery(userId: string, username?: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(userId),
    queryFn: async () => {
      const result = await usersRepository.list({
        page: 1,
        limit: 200,
        search: username || undefined,
      });
      const user = result.items.find((item) => item.id === userId);

      if (!user) {
        throw new Error('Pengguna tidak ditemukan pada hasil pencarian server');
      }

      return user;
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() }),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) => (
      usersRepository.updateById(userId, input)
    ),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(usersQueryKeys.detail(updatedUser.id), updatedUser);
      return queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
    },
  });
}

export function useUpdateCurrentUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersRepository.updateCurrentUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.all }),
  });
}

export function useChangeCurrentPasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => usersRepository.changeCurrentPassword(input),
  });
}
