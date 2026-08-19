import { useState, type FormEvent } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Sheet from '../../../components/ui/Sheet';
import { useNotificationStore } from '../../../store/notification-store';
import { useUploadMonthlyHydrologyImageMutation } from '../api/queries';
import { getHydrologyErrorMessage } from '../error';
import type { MonthlyHydrologyImageKind } from '../model';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

interface HydrologyImageUploadSheetProps {
  isOpen: boolean;
  pltaId: string;
  plantName: string;
  year: number;
  month: number;
  monthLabel: string;
  kind: MonthlyHydrologyImageKind;
  onClose: () => void;
}

const IMAGE_KIND_LABEL: Record<MonthlyHydrologyImageKind, string> = {
  curah_hujan: 'Prakiraan Curah Hujan',
  sifat_hujan: 'Prakiraan Sifat Hujan',
};

export default function HydrologyImageUploadSheet({
  isOpen,
  pltaId,
  plantName,
  year,
  month,
  monthLabel,
  kind,
  onClose,
}: HydrologyImageUploadSheetProps) {
  const addToast = useNotificationStore((state) => state.addToast);
  const uploadMutation = useUploadMonthlyHydrologyImageMutation();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const imageLabel = IMAGE_KIND_LABEL[kind];

  const selectFile = (nextFile: File | null) => {
    setFileError(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(nextFile.type)) {
      setFile(null);
      setFileError('Gunakan file PNG, JPG, atau JPEG');
      return;
    }

    if (nextFile.size > MAX_IMAGE_SIZE) {
      setFile(null);
      setFileError('Ukuran gambar maksimal 5 MB');
      return;
    }

    setFile(nextFile);
  };

  const uploadImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setFileError('Pilih gambar yang akan diunggah');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        pltaId,
        year,
        month,
        kind,
        file,
      });
      addToast({
        type: 'success',
        message: `${imageLabel} ${monthLabel} ${year} berhasil diunggah`,
      });
      onClose();
    } catch (error) {
      addToast({ type: 'error', message: getHydrologyErrorMessage(error) });
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      title={`Unggah ${imageLabel}`}
      description={`Tambahkan gambar BMKG untuk ${monthLabel} ${year}.`}
      isDismissible={!uploadMutation.isPending}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={uploadMutation.isPending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="hydrology-image-upload-form"
            isLoading={uploadMutation.isPending}
            leftIcon={<Upload size={17} />}
            className="w-full sm:w-auto"
          >
            Unggah Gambar
          </Button>
        </div>
      )}
    >
      <form
        id="hydrology-image-upload-form"
        onSubmit={uploadImage}
        className="flex flex-col gap-6"
      >
        <div className="border-b border-surface-overlay pb-5">
          <p className="text-xs font-medium text-cyan-700">Target gambar</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {imageLabel}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {monthLabel} {year} · PLTA {plantName}
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-base/70 px-5 py-8 text-center transition-colors hover:border-cyan-400 hover:bg-cyan-50/40">
          <span className="flex size-11 items-center justify-center rounded-full bg-surface-raised text-cyan-600 ring-1 ring-border-subtle">
            <ImagePlus size={21} />
          </span>
          <span className="text-sm font-semibold text-text-secondary">
            {file ? file.name : 'Pilih gambar BMKG'}
          </span>
          <span className="text-xs text-text-muted">
            PNG, JPG, atau JPEG · maksimal 5 MB
          </span>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            disabled={uploadMutation.isPending}
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>

        {file && (
          <p className="text-xs font-medium text-emerald-600">
            File siap diunggah · {(file.size / 1024 / 1024).toLocaleString('id-ID', {
              maximumFractionDigits: 2,
            })} MB
          </p>
        )}
        {fileError && (
          <p className="text-xs font-medium text-red-500">{fileError}</p>
        )}
      </form>
    </Sheet>
  );
}
