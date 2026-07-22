import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { ApiError } from '../../api/http';
import { useCreateUserMutation } from '../../features/users/api/queries';
import {
  createUserSchema,
  type CreateUserFormValues,
} from '../../features/users/form-schemas';
import { getUserManagementErrorMessage } from '../../features/users/error';
import { getUserDisplayName } from '../../features/users/model';
import { getUserManagementPath } from '../../features/users/routing';
import { useActivePLTAId } from '../../features/plta/routing';
import { useNotificationStore } from '../../store/notification-store';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';

export default function UserCreate() {
  const activePLTAId = useActivePLTAId();
  const navigate = useNavigate();
  const addToast = useNotificationStore((state) => state.addToast);
  const createMutation = useCreateUserMutation();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      password: '',
      role: 'operator',
      isActive: true,
    },
  });

  const returnToList = () => navigate(getUserManagementPath(activePLTAId));

  const submitUser = async (values: CreateUserFormValues) => {
    try {
      const createdUser = await createMutation.mutateAsync(values);
      addToast({
        type: 'success',
        message: `Pengguna ${getUserDisplayName(createdUser)} berhasil dibuat`,
      });
      navigate(getUserManagementPath(activePLTAId), { replace: true });
    } catch (error) {
      if (ApiError.isApiError(error) && error.status === 409) {
        form.setError('username', { message: 'Username atau email sudah digunakan' });
      }
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button type="button" onClick={returnToList} className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label="Kembali ke daftar pengguna"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">Tambah Pengguna</h1>
          <p className="page-description">Buat akun baru dan tentukan hak akses awal</p>
        </div>
      </div>

      <section className="flex flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#ecfeff] text-[#0891b2]"><UserPlus size={19} /></div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Informasi Akun</h2>
            <p className="text-xs text-slate-500">Gunakan password awal minimal 8 karakter.</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(submitUser)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input label="Nama Lengkap" {...form.register('fullName')} error={form.formState.errors.fullName?.message} placeholder="Masukkan nama lengkap..." />
            <Input label="Email" type="email" {...form.register('email')} error={form.formState.errors.email?.message} placeholder="nama@perusahaan.co.id" />
            <Input label="Username" {...form.register('username')} error={form.formState.errors.username?.message} autoComplete="off" placeholder="contoh: budi.santoso" />
            <Input label="Password Awal" type="password" {...form.register('password')} error={form.formState.errors.password?.message} autoComplete="new-password" placeholder="Minimal 8 karakter" />
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
              Aktifkan akun setelah dibuat
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={returnToList} className="h-10 cursor-pointer rounded-xl border-0 bg-transparent px-4 text-sm font-medium text-slate-500 hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={createMutation.isPending} className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#0891b2] px-4 text-sm font-semibold text-white hover:bg-[#0e7490] disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} /> {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
