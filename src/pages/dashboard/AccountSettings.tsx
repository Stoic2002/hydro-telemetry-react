import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Save, UserRound } from 'lucide-react';
import { z } from 'zod';
import { ApiError } from '../../api/http';
import {
  useChangeCurrentPasswordMutation,
  useUpdateCurrentUserMutation,
} from '../../features/users/api/queries';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';
import Input from '../../components/atoms/Input';

const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama minimal 3 karakter'),
  email: z.string().trim().email('Format email tidak valid'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string()
    .min(8, 'Password baru minimal 8 karakter')
    .max(128, 'Password baru maksimal 128 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Konfirmasi password tidak sama',
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function getAccountErrorMessage(error: unknown): string {
  if (!ApiError.isApiError(error)) return 'Terjadi kesalahan. Silakan coba kembali';
  if (error.status === 0) return 'Tidak dapat terhubung ke server';
  if (error.status === 400 || error.status === 401) return 'Password saat ini tidak sesuai';
  if (error.status === 409) return 'Email sudah digunakan pengguna lain';
  if (error.status === 422) return 'Data tidak lolos validasi server';
  return error.message;
}

export default function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const logout = useAuthStore((state) => state.logout);
  const addToast = useNotificationStore((state) => state.addToast);
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateCurrentUserMutation();
  const changePasswordMutation = useChangeCurrentPasswordMutation();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const submitProfile = async (values: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
      });
      const profileRefreshed = await refreshProfile();
      addToast({
        type: profileRefreshed ? 'success' : 'info',
        message: profileRefreshed
          ? 'Profil berhasil diperbarui'
          : 'Profil tersimpan, tetapi data sesi belum dapat dimuat ulang',
      });
    } catch (error) {
      addToast({ type: 'error', message: getAccountErrorMessage(error) });
    }
  };

  const submitPassword = async ({ currentPassword, newPassword }: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      passwordForm.reset();
      addToast({ type: 'success', message: 'Password berhasil diubah. Silakan masuk kembali' });
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      addToast({ type: 'error', message: getAccountErrorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-description">Perbarui identitas akun dan password Anda</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="flex flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#ecfeff] text-[#0891b2]"><UserRound size={19} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Informasi Profil</h2>
              <p className="text-xs text-slate-500">Username dan role dikelola oleh administrator.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div><span className="block text-xs text-slate-400">Username</span><span className="text-sm font-semibold text-slate-700">@{user?.username}</span></div>
            <div><span className="block text-xs text-slate-400">Role</span><span className="text-sm font-semibold text-slate-700">{user?.role}</span></div>
          </div>

          <form onSubmit={profileForm.handleSubmit(submitProfile)} className="flex flex-col gap-5">
            <Input label="Nama Lengkap" {...profileForm.register('fullName')} error={profileForm.formState.errors.fullName?.message} />
            <Input label="Email" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} />
            <button type="submit" disabled={updateProfileMutation.isPending} className="flex h-10 cursor-pointer items-center justify-center gap-2 self-end rounded-xl border-0 bg-[#0891b2] px-4 text-sm font-semibold text-white hover:bg-[#0e7490] disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} /> {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound size={19} /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Ganti Password</h2>
              <p className="text-xs text-slate-500">Setelah berhasil, Anda akan diminta masuk kembali.</p>
            </div>
          </div>

          <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="flex flex-col gap-5">
            <Input label="Password Saat Ini" type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} />
            <Input label="Password Baru" type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
            <Input label="Konfirmasi Password Baru" type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} />
            <button type="submit" disabled={changePasswordMutation.isPending} className="flex h-10 cursor-pointer items-center justify-center gap-2 self-end rounded-xl border-0 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
              <KeyRound size={16} /> {changePasswordMutation.isPending ? 'Memproses...' : 'Ubah Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
