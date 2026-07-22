import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit2, Plus, Search } from 'lucide-react';
import {
  useUpdateUserMutation,
  useUsersQuery,
} from '../../features/users/api/queries';
import { getUserManagementErrorMessage } from '../../features/users/error';
import {
  getUserDisplayName,
  getUserInitials,
  mapApiRoleToUIRole,
  type UserAccount,
} from '../../features/users/model';
import {
  getCreateUserPath,
  getEditUserPath,
} from '../../features/users/routing';
import { getPLTADashboardPath, useActivePLTAId } from '../../features/plta/routing';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';
import UserTableSkeleton from '../../components/skeletons/UserTableSkeleton';
import Skeleton from '../../components/atoms/Skeleton';

const PAGE_LIMIT = 10;

function RoleBadge({ user }: { user: UserAccount }) {
  const role = mapApiRoleToUIRole(user.role);
  const className = user.role === 'admin'
    ? 'bg-[#ecfeff] text-[#0891b2]'
    : user.role === 'operator'
      ? 'bg-[#fef3c7] text-[#b45309]'
      : 'bg-[#f1f5f9] text-[#475569]';

  return (
    <span className={`${className} rounded-full px-2.5 py-[3px] font-sans text-xs font-semibold`}>
      {role}
    </span>
  );
}

export default function UserManagement() {
  const addToast = useNotificationStore((state) => state.addToast);
  const currentUser = useAuthStore((state) => state.user);
  const activePLTAId = useActivePLTAId();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const usersQuery = useUsersQuery({
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
  });
  const updateMutation = useUpdateUserMutation();

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openEditPage = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      navigate(getPLTADashboardPath(activePLTAId, 'account'));
      return;
    }

    navigate(getEditUserPath(activePLTAId, user.id, user.username));
  };

  const toggleUserStatus = async (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      addToast({ type: 'info', message: 'Status akun sendiri tidak dapat diubah dari daftar pengguna' });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        userId: user.id,
        input: { isActive: !user.isActive },
      });
      addToast({
        type: 'success',
        message: `Akun ${user.username} ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`,
      });
    } catch (error) {
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(usersQuery.data?.pages ?? 1, 1);
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const lastItem = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">User Management</h1>
          <p className="page-description">Kelola akun, peran, dan status pengguna aplikasi</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(getCreateUserPath(activePLTAId))}
          className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#0891b2] px-[18px] font-sans text-sm font-semibold text-white transition-colors hover:bg-[#0e7490]"
        >
          <Plus size={16} />
          <span>Tambah User</span>
        </button>
      </div>

      <section className="flex flex-col overflow-clip rounded-[14px] border border-[#e2e8f0] bg-white">
        <form onSubmit={applySearch} className="flex items-center gap-2.5 border-b border-[#e2e8f0] px-5 py-3.5">
          <Search size={16} className="shrink-0 text-[#94a3b8]" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={100}
            placeholder="Cari nama, username, atau email..."
            className="w-full border-0 font-sans text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
          />
          <button type="submit" className="h-8 cursor-pointer rounded-lg border-0 bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200">Cari</button>
        </form>
        <div className="h-0.5 bg-transparent">
          {usersQuery.isFetching && !usersQuery.isLoading && <Skeleton className="h-full w-full" />}
        </div>

        <div className="flex h-11 w-full items-center gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] px-5">
          <div className="flex-1 text-xs font-semibold uppercase tracking-[0.72px] text-[#64748b]">User</div>
          <div className="w-[160px] shrink-0 text-xs font-semibold uppercase tracking-[0.72px] text-[#64748b]">Role</div>
          <div className="w-[140px] shrink-0 text-xs font-semibold uppercase tracking-[0.72px] text-[#64748b]">Status</div>
          <div className="w-[70px] shrink-0 text-xs font-semibold uppercase tracking-[0.72px] text-[#64748b]">Aksi</div>
        </div>

        <div className="flex w-full flex-col">
          {usersQuery.isLoading ? (
            <UserTableSkeleton rows={PAGE_LIMIT} />
          ) : usersQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-sm text-red-600">
              <span>{getUserManagementErrorMessage(usersQuery.error)}</span>
              <button type="button" onClick={() => void usersQuery.refetch()} className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Coba Lagi</button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex justify-center py-12 text-sm font-medium text-slate-400">Tidak ada pengguna yang ditemukan.</div>
          ) : users.map((user) => (
            <div key={user.id} className="flex w-full items-center gap-4 border-b border-b-[#f1f5f9] px-5 py-3.5 transition-colors hover:bg-slate-50/50">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-semibold text-[#0369a1]">{getUserInitials(user)}</div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-[#0f172a]">{getUserDisplayName(user)}</span>
                  <span className="truncate text-xs text-[#94a3b8]">@{user.username}{user.email ? ` · ${user.email}` : ''}</span>
                </div>
              </div>
              <div className="flex w-[160px] shrink-0"><RoleBadge user={user} /></div>
              <div className="flex w-[140px] shrink-0">
                <button
                  type="button"
                  disabled={updateMutation.isPending || user.id === currentUser?.id}
                  onClick={() => void toggleUserStatus(user)}
                  title={user.id === currentUser?.id ? 'Kelola akun sendiri melalui Profil Saya' : 'Ubah status pengguna'}
                  className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-medium text-[#334155] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={`size-2 rounded-full ${user.isActive ? 'bg-[#22c55e]' : 'bg-[#cbd5e1]'}`} />
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
              <div className="flex w-[70px] shrink-0 items-center">
                <button type="button" onClick={() => openEditPage(user)} className="cursor-pointer border-0 bg-transparent p-1 text-[#64748b] transition-colors hover:text-[#0f172a]" title={user.id === currentUser?.id ? 'Buka Profil Saya' : 'Edit pengguna'}>
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[#f1f5f9] px-5 py-3">
          <div className="text-xs text-[#94a3b8]">
            {usersQuery.isFetching && !usersQuery.isLoading ? 'Memperbarui... · ' : ''}
            Menampilkan {firstItem}–{lastItem} dari {total} user
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1 || usersQuery.isFetching} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman sebelumnya"><ChevronLeft size={15} /></button>
            <span className="min-w-20 text-center text-xs font-semibold text-slate-600">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages || usersQuery.isFetching} onClick={() => setPage((current) => Math.min(current + 1, totalPages))} className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman berikutnya"><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
