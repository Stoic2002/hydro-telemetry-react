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
}
