import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Plus, Search, Trash2, Users } from 'lucide-react';
import {
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useUsersQuery,
} from '../../features/users/api/queries';
import { getUserManagementErrorMessage } from '../../features/users/error';
import {
  getUserDisplayName,
  getUserInitials,
  mapApiRoleToUIRole,
  type UserAccount,
} from '../../features/users/model';
import { getPLTADashboardPath, useActivePLTAId } from '../../features/plta/routing';
import UserFormSheet from '../../features/users/components/UserFormSheet';
import RoleBadge from '../../features/users/components/RoleBadge';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';
import UserTableSkeleton from '../../components/skeletons/UserTableSkeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import RefetchBar from '../../components/ui/RefetchBar';
import TablePagination from '../../components/ui/TablePagination';
import Button from '../../components/atoms/Button';

const PAGE_LIMIT = 10;

export default function UserManagement() {
  const addToast = useNotificationStore((state) => state.addToast);
  const currentUser = useAuthStore((state) => state.user);
  const activePLTAId = useActivePLTAId();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserAccount | null>(null);
  const closeCreateSheet = useCallback(() => setIsCreateSheetOpen(false), []);
  const closeEditSheet = useCallback(() => setUserToEdit(null), []);

  const usersQuery = useUsersQuery({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
  });
  const toggleStatusMutation = useToggleUserStatusMutation();
  const deleteMutation = useDeleteUserMutation();

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openEditSheet = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      navigate(getPLTADashboardPath(activePLTAId, 'account'));
      return;
    }

    setUserToEdit(user);
  };

  const toggleUserStatus = async (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      addToast({ type: 'info', message: 'Status akun sendiri tidak dapat diubah dari daftar pengguna' });
      return;
    }

    try {
      await toggleStatusMutation.mutateAsync({
        userId: user.id,
        isActive: !user.isActive,
      });
      addToast({
        type: 'success',
        message: `Akun ${user.username} ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
      });
    } catch (error) {
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      addToast({ type: 'success', message: `Akun ${userToDelete.username} telah dihapus permanen` });
      setUserToDelete(null);
    } catch (error) {
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(usersQuery.data?.pages ?? 1, 1);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        description="Kelola akun, peran, dan status pengguna aplikasi"
        actions={(
          <Button type="button" size="lg" leftIcon={<Plus size={16} />} onClick={() => setIsCreateSheetOpen(true)}>
            Tambah User
          </Button>
        )}
      />

      <div className="flex flex-col gap-2.5 border-b border-border-subtle pb-4 sm:flex-row sm:items-center">
        <form onSubmit={applySearch} className="flex min-w-0 items-center gap-2 sm:w-80">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search size={15} className="pointer-events-none absolute left-3 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={100}
              placeholder="Cari nama, username, atau email…"
              className="h-9 w-full min-w-0 rounded-sm border border-border-subtle bg-white pr-3 pl-8.5 text-[12.5px] text-text-primary outline-none transition-[border-color,box-shadow] hover:border-slate-300 focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 cursor-pointer rounded-sm border border-border-subtle bg-white px-3 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cari
          </button>
        </form>
        {!usersQuery.isError && (
          <span className="shrink-0 text-[11.5px] text-text-muted sm:ml-auto">{total} pengguna</span>
        )}
      </div>

      <section className="flex flex-col overflow-clip rounded-md border border-border-subtle bg-white">
        <RefetchBar isRefetching={usersQuery.isFetching && !usersQuery.isLoading} />

        <div className="flex h-9 w-full items-center gap-4 border-b border-border-subtle bg-surface-overlay px-5">
          <div className="table-head-cell flex-1">User</div>
          <div className="table-head-cell w-[160px] shrink-0">Role</div>
          <div className="table-head-cell w-[140px] shrink-0">Status</div>
          <div className="table-head-cell w-24 shrink-0">Aksi</div>
        </div>

        <div className="flex w-full flex-col">
          {usersQuery.isLoading ? (
            <UserTableSkeleton rows={PAGE_LIMIT} />
          ) : usersQuery.isError ? (
            <ErrorState
              title="Daftar pengguna belum bisa dimuat"
              description={getUserManagementErrorMessage(usersQuery.error)}
              isRetrying={usersQuery.isFetching}
              onRetry={() => void usersQuery.refetch()}
              className="py-10"
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users size={19} />}
              title={search ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}
              description={search
                ? 'Coba kata kunci lain atau kosongkan pencarian.'
                : 'Pengguna yang ditambahkan akan muncul di daftar ini.'}
              className="py-10"
            />
          ) : users.map((user) => {
            const isSelf = user.id === currentUser?.id;

            return (
              <div key={user.id} className={`flex w-full items-center gap-4 border-b border-b-surface-overlay px-5 py-3.5 transition-colors hover:bg-slate-50/50 ${isSelf ? 'bg-surface-base' : ''}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isSelf
                      ? 'border-cyan-200 bg-cyan-100 text-cyan-700'
                      : 'border-border-subtle bg-surface-overlay text-slate-600'
                  }`}
                  >
                    {getUserInitials(user)}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-text-primary">{getUserDisplayName(user)}</span>
                      {isSelf && (
                        <span className="inline-flex h-[19px] shrink-0 items-center rounded-[5px] bg-surface-overlay px-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600">
                          Akun Anda
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-[11.5px] text-text-muted">@{user.username}{user.email ? ` · ${user.email}` : ''}</span>
                  </div>
                </div>
                <div className="flex w-[160px] shrink-0"><RoleBadge role={mapApiRoleToUIRole(user.role)} /></div>
                <div className="flex w-[140px] shrink-0">
                  <button
                    type="button"
                    disabled={toggleStatusMutation.isPending || deleteMutation.isPending || isSelf}
                    onClick={() => void toggleUserStatus(user)}
                    title={isSelf ? 'Kelola akun sendiri melalui Profil Saya' : 'Ubah status pengguna'}
                    className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className={`size-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <div className="flex w-24 shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditSheet(user)}
                    className="flex size-[30px] cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-white text-brand-primary-strong transition-colors hover:bg-cyan-50"
                    title={isSelf ? 'Buka Profil Saya' : 'Edit pengguna'}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending || isSelf}
                    onClick={() => setUserToDelete(user)}
                    title={isSelf ? 'Akun sendiri tidak dapat dihapus' : 'Hapus pengguna'}
                    className="flex size-[30px] cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-white text-status-danger transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-surface-base disabled:text-slate-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_LIMIT}
          itemLabel="pengguna"
          isBusy={usersQuery.isFetching}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => Math.min(current + 1, totalPages))}
        />
      </section>

      <UserFormSheet
        mode="create"
        isOpen={isCreateSheetOpen}
        onClose={closeCreateSheet}
      />

      {userToEdit && (
        <UserFormSheet
          mode="edit"
          isOpen
          user={userToEdit}
          onClose={closeEditSheet}
        />
      )}

      <ConfirmDialog
        isOpen={userToDelete !== null}
        title="Hapus pengguna?"
        description={userToDelete ? <>Akun <strong>{userToDelete.username}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</> : null}
        confirmLabel="Hapus Permanen"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void confirmDeleteUser()}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
}
