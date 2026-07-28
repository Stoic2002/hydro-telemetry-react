import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, Save } from 'lucide-react';
import { ApiError } from '../../../api/http';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Select from '../../../components/atoms/Select';
import StatusToggle from '../../../components/atoms/StatusToggle';
import Sheet from '../../../components/ui/Sheet';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from '../api/queries';
import { getUserManagementErrorMessage } from '../error';
import {
  createUserSchema,
  editUserSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
} from '../form-schemas';
import { getUserDisplayName, type UserAccount } from '../model';
import { useNotificationStore } from '../../../store/notification-store';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Super Admin' },
  { value: 'operator', label: 'Operator PLTA' },
  { value: 'viewer', label: 'Viewer' },
];

const CREATE_DEFAULT_VALUES: CreateUserFormValues = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  role: 'operator',
  isActive: true,
};

type UserFormSheetProps = {
  mode: 'create';
  isOpen: boolean;
  onClose: () => void;
} | {
  mode: 'edit';
  isOpen: boolean;
  user: UserAccount;
  onClose: () => void;
};

interface UserFormFooterProps {
  formId: string;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  icon: React.ReactNode;
  onClose: () => void;
}

function UserFormFooter({
  formId,
  isPending,
  submitLabel,
  pendingLabel,
  icon,
  onClose,
}: UserFormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={onClose}
        className="w-full sm:w-auto"
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        isLoading={isPending}
        leftIcon={icon}
        className="w-full sm:w-auto"
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}

function CreateUserSheet({
  isOpen,
  onClose,
}: Extract<UserFormSheetProps, { mode: 'create' }>) {
  const addToast = useNotificationStore((state) => state.addToast);
  const createMutation = useCreateUserMutation();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: CREATE_DEFAULT_VALUES,
  });
  const isActive = useWatch({ control: form.control, name: 'isActive' });

  useEffect(() => {
    if (isOpen) form.reset(CREATE_DEFAULT_VALUES);
  }, [form, isOpen]);

  const submitUser = async (values: CreateUserFormValues) => {
    try {
      const createdUser = await createMutation.mutateAsync(values);
      addToast({
        type: 'success',
        message: `Pengguna ${getUserDisplayName(createdUser)} berhasil dibuat`,
      });
      onClose();
    } catch (error) {
      if (ApiError.isApiError(error) && error.status === 409) {
        form.setError('username', { message: 'Username atau email sudah digunakan' });
      }
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      title="Tambah Pengguna"
      description="Buat akun baru dan tentukan hak akses awal."
      isDismissible={!createMutation.isPending}
      onClose={onClose}
      footer={(
        <UserFormFooter
          formId="create-user-sheet-form"
          isPending={createMutation.isPending}
          submitLabel="Simpan Pengguna"
          pendingLabel="Menyimpan..."
          icon={<Plus size={17} />}
          onClose={onClose}
        />
      )}
    >
      <form
        id="create-user-sheet-form"
        onSubmit={form.handleSubmit(submitUser)}
        className="flex flex-col gap-5"
      >
        <Input
          label="Nama Lengkap"
          {...form.register('fullName')}
          error={form.formState.errors.fullName?.message}
          disabled={createMutation.isPending}
          placeholder="Masukkan nama lengkap..."
        />
        <Input
          label="Email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          disabled={createMutation.isPending}
          placeholder="nama@perusahaan.co.id"
        />
        <Input
          label="Username"
          {...form.register('username')}
          error={form.formState.errors.username?.message}
          disabled={createMutation.isPending}
          autoComplete="off"
          placeholder="contoh: budi.santoso"
        />
        <Input
          label="Password Awal"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          disabled={createMutation.isPending}
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
        />
        <Select
          label="Peran"
          {...form.register('role')}
          disabled={createMutation.isPending}
          options={ROLE_OPTIONS}
        />
        <StatusToggle
          label="Status akun"
          isActive={isActive}
          disabled={createMutation.isPending}
          onChange={(nextIsActive) => form.setValue('isActive', nextIsActive, {
            shouldDirty: true,
            shouldValidate: true,
          })}
        />
      </form>
    </Sheet>
  );
}

function EditUserSheet({
  isOpen,
  user,
  onClose,
}: Extract<UserFormSheetProps, { mode: 'edit' }>) {
  const addToast = useNotificationStore((state) => state.addToast);
  const updateMutation = useUpdateUserMutation();
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: getUserDisplayName(user),
      email: user.email ?? '',
      role: user.role,
      isActive: user.isActive,
    },
  });
  const isActive = useWatch({ control: form.control, name: 'isActive' });

  useEffect(() => {
    if (!isOpen) return;

    form.reset({
      fullName: getUserDisplayName(user),
      email: user.email ?? '',
      role: user.role,
      isActive: user.isActive,
    });
  }, [form, isOpen, user]);

  const submitUser = async (values: EditUserFormValues) => {
    try {
      const updatedUser = await updateMutation.mutateAsync({
        userId: user.id,
        input: values,
      });
      addToast({
        type: 'success',
        message: `Pengguna ${getUserDisplayName(updatedUser)} berhasil diperbarui`,
      });
      onClose();
    } catch (error) {
      addToast({ type: 'error', message: getUserManagementErrorMessage(error) });
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      title="Edit Pengguna"
      description={`Perbarui akun @${user.username}. Username tidak dapat diubah.`}
      isDismissible={!updateMutation.isPending}
      onClose={onClose}
      footer={(
        <UserFormFooter
          formId="edit-user-sheet-form"
          isPending={updateMutation.isPending}
          submitLabel="Simpan Perubahan"
          pendingLabel="Menyimpan..."
          icon={<Save size={17} />}
          onClose={onClose}
        />
      )}
    >
      <form
        id="edit-user-sheet-form"
        onSubmit={form.handleSubmit(submitUser)}
        className="flex flex-col gap-5"
      >
        <div className="rounded-xl bg-cyan-50/70 px-4 py-3 ring-1 ring-cyan-100">
          <p className="text-xs font-medium text-cyan-700">Pengguna</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {getUserDisplayName(user)}
          </p>
        </div>
        <Input
          label="Nama Lengkap"
          {...form.register('fullName')}
          error={form.formState.errors.fullName?.message}
          disabled={updateMutation.isPending}
        />
        <Input
          label="Email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          disabled={updateMutation.isPending}
        />
        <Select
          label="Peran"
          {...form.register('role')}
          disabled={updateMutation.isPending}
          options={ROLE_OPTIONS}
        />
        <StatusToggle
          label="Status akun"
          isActive={isActive}
          disabled={updateMutation.isPending}
          onChange={(nextIsActive) => form.setValue('isActive', nextIsActive, {
            shouldDirty: true,
            shouldValidate: true,
          })}
        />
      </form>
    </Sheet>
  );
}

export default function UserFormSheet(props: UserFormSheetProps) {
  if (props.mode === 'create') return <CreateUserSheet {...props} />;
  return <EditUserSheet {...props} />;
}
