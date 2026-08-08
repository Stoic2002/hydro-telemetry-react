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

const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...usersQueryKeys.lists(), params] as const,
};

export function useUsersQuery(params: UserListParams) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => usersRepository.list(params),
    placeholderData: keepPreviousData,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() }),
  });
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => (
      usersRepository.updateStatus(userId, isActive)
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() }),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersRepository.deleteById(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() }),
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
