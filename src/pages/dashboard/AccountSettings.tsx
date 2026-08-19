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
import RoleBadge from '../../features/users/components/RoleBadge';
import { useAuthStore } from '../../store/auth-store';
import { useNotificationStore } from '../../store/notification-store';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import PageHeader from '../../components/ui/PageHeader';

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
  message: 'Konfirmasi belum sama dengan password baru',
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
    mode: 'onChange',
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
      <PageHeader
        title="Profil Saya"
        description="Ubah data diri dan password akun Anda"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <section className="flex flex-col overflow-hidden rounded-md border border-border-subtle bg-white">
          <div className="flex items-center gap-2.5 border-b border-border-subtle px-[18px] py-3.5">
            <div className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-brand-tint-border bg-brand-tint text-brand-primary-strong">
              <UserRound size={16} />
            </div>
            <span className="card-title">Informasi Profil</span>
          </div>

          <form onSubmit={profileForm.handleSubmit(submitProfile)} className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 p-[18px]">
              <div className="flex flex-col gap-2.5 rounded-md bg-surface-overlay p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted">Username</span>
                  <span className="font-mono text-[12.5px] font-medium text-text-primary">@{user?.username}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted">Peran</span>
                  {user?.role && <RoleBadge role={user.role} />}
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Keduanya dikelola admin dan tidak bisa diubah dari halaman ini.
                </p>
              </div>
              <Input label="Nama Lengkap" {...profileForm.register('fullName')} error={profileForm.formState.errors.fullName?.message} />
              <Input label="Email" type="email" {...profileForm.register('email')} error={profileForm.formState.errors.email?.message} />
            </div>
            <div className="flex justify-end border-t border-border-subtle bg-surface-base px-[18px] py-3.5">
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={16} />} isLoading={updateProfileMutation.isPending}>
                Simpan Profil
              </Button>
            </div>
          </form>
        </section>

        <section className="flex flex-col overflow-hidden rounded-md border border-border-subtle bg-white">
          <div className="flex items-center gap-2.5 border-b border-border-subtle px-[18px] py-3.5">
            <div className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-amber-200 bg-amber-50 text-amber-600">
              <KeyRound size={16} />
            </div>
            <span className="card-title">Ganti Password</span>
          </div>

          <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 p-[18px]">
              <p className="text-xs leading-relaxed text-text-muted">
                Setelah password berubah, Anda akan keluar dari aplikasi dan perlu masuk kembali.
              </p>
              <Input label="Password Saat Ini" type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} />
              <Input label="Password Baru" type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} />
              <Input label="Konfirmasi Password Baru" type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} />
            </div>
            <div className="flex justify-end border-t border-border-subtle bg-surface-base px-[18px] py-3.5">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<KeyRound size={16} />}
                isLoading={changePasswordMutation.isPending}
                disabled={!passwordForm.formState.isValid}
              >
                Ubah Password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
