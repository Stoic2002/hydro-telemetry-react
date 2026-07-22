import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, UserRoundCog } from 'lucide-react';
import {
  useUpdateUserMutation,
  useUserForEditQuery,
} from '../../features/users/api/queries';
import {
  editUserSchema,
  type EditUserFormValues,
} from '../../features/users/form-schemas';
import { getUserManagementErrorMessage } from '../../features/users/error';
import { getUserDisplayName } from '../../features/users/model';
import { getUserManagementPath } from '../../features/users/routing';
import { getPLTADashboardPath, useActivePLTAId } from '../../features/plta/routing';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';
import FormPageSkeleton from '../../components/skeletons/FormPageSkeleton';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';

export default function UserEdit() {
  const { userId = '' } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const activePLTAId = useActivePLTAId();
  const currentUser = useAuthStore((state) => state.user);
  const addToast = useNotificationStore((state) => state.addToast);
  const navigate = useNavigate();
  const userQuery = useUserForEditQuery(userId, searchParams.get('username') ?? undefined);
  const updateMutation = useUpdateUserMutation();
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    values: {
      fullName: userQuery.data ? getUserDisplayName(userQuery.data) : '',
      email: userQuery.data?.email ?? '',
      role: userQuery.data?.role ?? 'viewer',
      isActive: userQuery.data?.isActive ?? true,
    },
  });

  if (userId === currentUser?.id) {
    return <Navigate to={getPLTADashboardPath(activePLTAId, 'account')} replace />;
  }

  const returnToList = () => navigate(getUserManagementPath(activePLTAId));

  const submitUser = async (values: EditUserFormValues) => {
    if (!userQuery.data) return;

    try {
      const updatedUser = await updateMutation.mutateAsync({
        userId: userQuery.data.id,
        input: values,
      });
      addToast({
        type: 'success',
        message: `Pengguna ${getUserDisplayName(updatedUser)} berhasil diperbarui`,
      });
      navigate(getUserManagementPath(activePLTAId), { replace: true });
    } catch (error) {
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button type="button" onClick={returnToList} className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label="Kembali ke daftar pengguna"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">Edit Pengguna</h1>
          <p className="page-description">Perbarui identitas, peran, dan status akun</p>
        </div>
      </div>

      {userQuery.isLoading ? (
        <FormPageSkeleton fields={4} />
      ) : userQuery.isError || !userQuery.data ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-white py-16 text-sm text-red-600">
          <span>{getUserManagementErrorMessage(userQuery.error)}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => void userQuery.refetch()} className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Coba Lagi</button>
            <button type="button" onClick={returnToList} className="cursor-pointer rounded-lg border-0 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Kembali</button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#ecfeff] text-[#0891b2]"><UserRoundCog size={19} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">{getUserDisplayName(userQuery.data)}</h2>
              <p className="text-xs text-slate-500">Username @{userQuery.data.username} tidak dapat diubah.</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(submitUser)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input label="Nama Lengkap" {...form.register('fullName')} error={form.formState.errors.fullName?.message} />
              <Input label="Email" type="email" {...form.register('email')} error={form.formState.errors.email?.message} />
              <Select
                label="Peran"
                {...form.register('role')}
                options={[
                  { value: 'admin', label: 'Super Admin' },
                  { value: 'operator', label: 'Operator PLTA' },
                  { value: 'viewer', label: 'Viewer' },
                ]}
              />
              <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700">
                <input type="checkbox" {...form.register('isActive')} className="size-4 accent-[#0891b2]" />
                Akun aktif
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={returnToList} className="h-10 cursor-pointer rounded-xl border-0 bg-transparent px-4 text-sm font-medium text-slate-500 hover:bg-slate-50">Batal</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#0891b2] px-4 text-sm font-semibold text-white hover:bg-[#0e7490] disabled:cursor-not-allowed disabled:opacity-60">
                <Save size={16} /> {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
