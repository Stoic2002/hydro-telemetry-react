import type {
  ChangePasswordInput,
  CreateUserInput,
  PaginatedUsers,
  UpdateUserInput,
  UserAccount,
  UserListParams,
} from '../model';

export interface UsersRepository {
  list(params: UserListParams): Promise<PaginatedUsers>;
  create(input: CreateUserInput): Promise<UserAccount>;
  updateCurrentUser(input: UpdateUserInput): Promise<UserAccount>;
  changeCurrentPassword(input: ChangePasswordInput): Promise<void>;
  updateById(userId: string, input: UpdateUserInput): Promise<UserAccount>;
  updateStatus(userId: string, isActive: boolean): Promise<UserAccount>;
  deleteById(userId: string): Promise<void>;
}
