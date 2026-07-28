import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Sheet from '../../../components/ui/Sheet';
import { useNotificationStore } from '../../../store/notification-store';
import { useUpsertMonthlyHydrologyMutation } from '../api/queries';
import { getHydrologyErrorMessage } from '../error';
import type { MonthlyHydrology } from '../model';

interface MonthlyHydrologyFormValues {
  hydrologyPrediction: string;
  hydrologyActual: string;
  predictedProductionMwh: string;
  targetProductionMwh: string;
  previousAchievementMwh: string;
  predictedPreviousAchievementMwh: string;
  targetPreviousAchievementMwh: string;
}

interface MonthlyHydrologySheetProps {
  isOpen: boolean;
  pltaId: string;
  plantName: string;
  year: number;
  month: number;
  monthLabel: string;
  record?: MonthlyHydrology;
  onClose: () => void;
}

function toFormNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function toOptionalNumber(value: string): number | undefined {
  const normalizedValue = value.trim();
  return normalizedValue ? Number(normalizedValue) : undefined;
}

function getDefaultValues(
  record?: MonthlyHydrology,
): MonthlyHydrologyFormValues {
  return {
    hydrologyPrediction: record?.hydrologyPrediction ?? '',
    hydrologyActual: record?.hydrologyActual ?? '',
    predictedProductionMwh: toFormNumber(record?.predictedProductionMwh),
    targetProductionMwh: toFormNumber(record?.targetProductionMwh),
    previousAchievementMwh: toFormNumber(record?.previousAchievementMwh),
    predictedPreviousAchievementMwh: toFormNumber(
      record?.predictedPreviousAchievementMwh,
    ),
    targetPreviousAchievementMwh: toFormNumber(
      record?.targetPreviousAchievementMwh,
    ),
  };
}

export default function MonthlyHydrologySheet({
  isOpen,
  pltaId,
  plantName,
  year,
  month,
  monthLabel,
  record,
  onClose,
}: MonthlyHydrologySheetProps) {
  const addToast = useNotificationStore((state) => state.addToast);
  const upsertMutation = useUpsertMonthlyHydrologyMutation();
  const form = useForm<MonthlyHydrologyFormValues>({
    defaultValues: getDefaultValues(record),
  });

  const submitHydrology = async (values: MonthlyHydrologyFormValues) => {
    const hydrologyPrediction = values.hydrologyPrediction.trim() || undefined;
    const hydrologyActual = values.hydrologyActual.trim() || undefined;
    const predictedProductionMwh = toOptionalNumber(values.predictedProductionMwh);
    const targetProductionMwh = toOptionalNumber(values.targetProductionMwh);
    const previousAchievementMwh = toOptionalNumber(values.previousAchievementMwh);
    const predictedPreviousAchievementMwh = toOptionalNumber(
      values.predictedPreviousAchievementMwh,
    );
    const targetPreviousAchievementMwh = toOptionalNumber(
      values.targetPreviousAchievementMwh,
    );

    const hasValue = [
      hydrologyPrediction,
      hydrologyActual,
      predictedProductionMwh,
      targetProductionMwh,
      previousAchievementMwh,
      predictedPreviousAchievementMwh,
      targetPreviousAchievementMwh,
    ].some((value) => value !== undefined);

    if (!hasValue) {
      addToast({
        type: 'error',
        message: 'Isi minimal satu data hidrologi sebelum menyimpan',
      });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        pltaId,
        year,
        month,
        hydrologyPrediction,
        hydrologyActual,
        predictedProductionMwh,
        targetProductionMwh,
        previousAchievementMwh,
        predictedPreviousAchievementMwh,
        targetPreviousAchievementMwh,
      });
      addToast({
        type: 'success',
        message: `Data hidrologi ${monthLabel} ${year} berhasil disimpan`,
      });
      onClose();
    } catch (error) {
      addToast({ type: 'error', message: getHydrologyErrorMessage(error) });
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      title="Input Hidrologi Bulanan"
      description={`Upsert parsial data ${monthLabel} ${year} untuk PLTA ${plantName}.`}
      isDismissible={!upsertMutation.isPending}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={upsertMutation.isPending}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="monthly-hydrology-form"
            isLoading={upsertMutation.isPending}
            leftIcon={<Save size={17} />}
            className="w-full sm:w-auto"
          >
            Simpan Data
          </Button>
        </div>
      )}
    >
      <form
        id="monthly-hydrology-form"
        onSubmit={form.handleSubmit(submitHydrology)}
        className="flex flex-col gap-6"
      >
        <div className="border-b border-slate-100 pb-5">
          <p className="text-xs font-medium text-cyan-700">Periode dan PLTA</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {monthLabel} {year} · PLTA {plantName}
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Kondisi hidrologi</h3>
            <p className="mt-1 text-xs text-slate-500">
              Field kosong tidak akan menimpa data yang sudah tersimpan.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Prediksi Hidrologi
            <textarea
              {...form.register('hydrologyPrediction')}
              disabled={upsertMutation.isPending}
              rows={3}
              placeholder="Contoh: Normal–Basah"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-primary-strong focus:ring-2 focus:ring-brand-primary-strong/15 disabled:bg-slate-50"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Aktual Hidrologi
            <textarea
              {...form.register('hydrologyActual')}
              disabled={upsertMutation.isPending}
              rows={3}
              placeholder="Masukkan kondisi aktual..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-primary-strong focus:ring-2 focus:ring-brand-primary-strong/15 disabled:bg-slate-50"
            />
          </label>
        </section>

        <section className="flex flex-col gap-4 border-t border-slate-100 pt-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Energi produksi</h3>
            <p className="mt-1 text-xs text-slate-500">
              Semua nilai menggunakan satuan MWh.
            </p>
          </div>
          <Input
            label="Prediksi Produksi"
            type="number"
            min="0"
            step="any"
            {...form.register('predictedProductionMwh')}
            disabled={upsertMutation.isPending}
            placeholder="0"
          />
          <Input
            label="Target Produksi"
            type="number"
            min="0"
            step="any"
            {...form.register('targetProductionMwh')}
            disabled={upsertMutation.isPending}
            placeholder="0"
          />
          <Input
            label="Pencapaian s.d. Bulan Sebelumnya"
            type="number"
            min="0"
            step="any"
            {...form.register('previousAchievementMwh')}
            disabled={upsertMutation.isPending}
            placeholder="0"
          />
          <Input
            label="Prediksi Pencapaian"
            type="number"
            min="0"
            step="any"
            {...form.register('predictedPreviousAchievementMwh')}
            disabled={upsertMutation.isPending}
            placeholder="0"
          />
          <Input
            label="Target Pencapaian"
            type="number"
            min="0"
            step="any"
            {...form.register('targetPreviousAchievementMwh')}
            disabled={upsertMutation.isPending}
            placeholder="0"
          />
          <p className="text-xs leading-5 text-slate-500">
            Persentase pencapaian dihitung otomatis oleh server.
          </p>
        </section>
      </form>
    </Sheet>
  );
}
