import { useMemo, useState, type FormEvent } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Sheet from '../../../components/ui/Sheet';
import { useNotificationStore } from '../../../store/notification-store';
import {
  useUploadTelemetryExcelMutation,
  useUploadTelemetryPointsMutation,
} from '../api/queries';
import { getTelemetryUploadErrorMessage } from '../error';
import type {
  DailyTelemetryUploadTarget,
  TelemetryUploadPoint,
} from '../model';

const MAX_EXCEL_FILE_SIZE = 5 * 1024 * 1024;
const MAX_POINTS = 20_000;

type UploadMode = 'manual' | 'excel';

interface PointRow {
  id: number;
  date: string;
  time: string;
  value: string;
}

interface TelemetryUploadSheetProps {
  isOpen: boolean;
  pltaId: string;
  plantName: string;
  defaultDate: string;
  target: DailyTelemetryUploadTarget;
  onClose: () => void;
}

let pointRowId = 0;

function createPointRow(date: string): PointRow {
  pointRowId += 1;
  return {
    id: pointRowId,
    date,
    time: '00:00',
    value: '',
  };
}

function buildPoints(rows: PointRow[]): TelemetryUploadPoint[] | null {
  if (rows.length === 0 || rows.length > MAX_POINTS) return null;

  const points: TelemetryUploadPoint[] = [];
  const timestamps = new Set<string>();

  for (const row of rows) {
    const rawValue = row.value.trim();
    if (!row.date || !row.time || !rawValue) return null;

    const value = Number(rawValue);
    if (!Number.isFinite(value)) return null;

    const time = `${row.date}T${row.time}:00`;
    if (timestamps.has(time)) return null;
    timestamps.add(time);
    points.push({ time, value });
  }

  return points;
}

export default function TelemetryUploadSheet({
  isOpen,
  pltaId,
  plantName,
  defaultDate,
  target,
  onClose,
}: TelemetryUploadSheetProps) {
  const addToast = useNotificationStore((state) => state.addToast);
  const uploadPointsMutation = useUploadTelemetryPointsMutation();
  const uploadExcelMutation = useUploadTelemetryExcelMutation();
  const [mode, setMode] = useState<UploadMode>('manual');
  const [station, setStation] = useState(target.tags[0]?.station ?? '');
  const [rows, setRows] = useState<PointRow[]>([
    createPointRow(defaultDate),
  ]);
  const [file, setFile] = useState<File | null>(null);
  const isPending = uploadPointsMutation.isPending
    || uploadExcelMutation.isPending;
  const selectedTag = useMemo(
    () => target.tags.find((tag) => tag.station === station) ?? target.tags[0],
    [station, target.tags],
  );
  const unit = selectedTag?.unit || target.unit;

  const updateRow = (
    id: number,
    field: keyof Pick<PointRow, 'date' | 'time' | 'value'>,
    value: string,
  ) => {
    setRows((currentRows) => currentRows.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
  };

  const removeRow = (id: number) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const submitManual = async () => {
    const points = buildPoints(rows);
    if (!points) {
      addToast({
        type: 'error',
        message: 'Lengkapi tanggal, jam, dan nilai tanpa timestamp duplikat',
      });
      return;
    }

    try {
      const result = await uploadPointsMutation.mutateAsync({
        pltaId,
        parameter: target.parameter,
        station,
        points,
      });
      addToast({
        type: 'success',
        message: `${result.pointsUpserted} titik ${target.label} berhasil disimpan`,
      });
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        message: getTelemetryUploadErrorMessage(error),
      });
    }
  };

  const submitExcel = async () => {
    if (!file) {
      addToast({ type: 'error', message: 'Pilih file Excel terlebih dahulu' });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      addToast({ type: 'error', message: 'File harus menggunakan format .xlsx' });
      return;
    }

    if (file.size > MAX_EXCEL_FILE_SIZE) {
      addToast({ type: 'error', message: 'Ukuran file maksimal 5 MB' });
      return;
    }

    try {
      const result = await uploadExcelMutation.mutateAsync({
        pltaId,
        parameter: target.parameter,
        station,
        file,
      });
      addToast({
        type: 'success',
        message: `${result.pointsUpserted} titik dari ${file.name} berhasil disimpan`,
      });
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        message: getTelemetryUploadErrorMessage(error),
      });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'manual') await submitManual();
    else await submitExcel();
  };

  return (
    <Sheet
      isOpen={isOpen}
      title="Input Data Harian"
      description={`Input ${target.label} untuk PLTA ${plantName}.`}
      isDismissible={!isPending}
      onClose={onClose}
      footer={(
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
            form="telemetry-upload-form"
            isLoading={isPending}
            leftIcon={mode === 'manual' ? <Save size={17} /> : <Upload size={17} />}
            className="w-full sm:w-auto"
          >
            {mode === 'manual' ? 'Simpan Data' : 'Upload Excel'}
          </Button>
        </div>
      )}
    >
      <form
        id="telemetry-upload-form"
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-6"
      >
        <section className="border-b border-surface-overlay pb-5">
          <p className="text-xs font-medium text-cyan-700">
            {target.parameter}
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {target.label}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Satuan {unit || 'mengikuti konfigurasi tag'}
          </p>
        </section>

        {target.tags.length > 1 ? (
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-muted">
            Station
            <select
              value={station}
              disabled={isPending}
              onChange={(event) => setStation(event.target.value)}
              className="h-11 rounded-xl border border-border-subtle bg-surface-raised px-3.5 text-sm font-normal text-text-strong outline-none transition-colors focus:border-brand-primary-strong focus:ring-2 focus:ring-brand-primary-strong/15 disabled:bg-surface-base"
            >
              {target.tags.map((tag) => (
                <option key={tag.id} value={tag.station}>
                  {tag.station || 'Default'}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex items-center justify-between border-b border-surface-overlay pb-4 text-xs">
            <span className="font-medium text-text-muted">Station</span>
            <span className="font-semibold text-text-secondary">
              {station || 'Default'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 border-b border-border-subtle">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setMode('manual')}
            className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
              mode === 'manual'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Input Manual
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setMode('excel')}
            className={`cursor-pointer border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
              mode === 'excel'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Upload Excel
          </button>
        </div>

        {mode === 'manual' ? (
          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-strong">
                Titik data
              </h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Waktu tanpa zona waktu diproses server sebagai WIB. Timestamp
                yang pernah tersimpan akan diperbarui.
              </p>
            </div>

            <div className="divide-y divide-surface-overlay border-y border-surface-overlay">
              {rows.map((row, index) => (
                <div key={row.id} className="py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">
                      Data {index + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removeRow(row.id)}
                        aria-label={`Hapus data ${index + 1}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                      Tanggal
                      <input
                        type="date"
                        value={row.date}
                        disabled={isPending}
                        onChange={(event) => updateRow(row.id, 'date', event.target.value)}
                        className="h-10 rounded-md border border-border-subtle px-3 text-[13px] text-text-strong outline-none hover:border-border-strong focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 disabled:bg-surface-base"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                      Jam
                      <input
                        type="time"
                        value={row.time}
                        disabled={isPending}
                        onChange={(event) => updateRow(row.id, 'time', event.target.value)}
                        className="h-10 rounded-md border border-border-subtle px-3 text-[13px] text-text-strong outline-none hover:border-border-strong focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 disabled:bg-surface-base"
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-1.5 text-xs font-medium text-text-muted">
                    Nilai {unit ? `(${unit})` : ''}
                    <input
                      type="number"
                      step="any"
                      value={row.value}
                      disabled={isPending}
                      onChange={(event) => updateRow(row.id, 'value', event.target.value)}
                      placeholder="0"
                      className="h-10 rounded-md border border-border-subtle px-3 text-[13px] text-text-strong outline-none placeholder:text-text-placeholder hover:border-border-strong focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15 disabled:bg-surface-base"
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isPending || rows.length >= MAX_POINTS}
              onClick={() => setRows((currentRows) => [
                ...currentRows,
                createPointRow(currentRows.at(-1)?.date || defaultDate),
              ])}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start text-xs font-semibold text-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Tambah titik data
            </button>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-strong">
                File time-series
              </h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Satu file hanya untuk parameter ini. Header yang diterima:
                datetime + value, atau tanggal + jam + value.
              </p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-border-strong px-5 py-8 text-center transition-colors hover:border-cyan-400 hover:bg-cyan-50/30">
              <FileSpreadsheet size={30} className="text-cyan-600" />
              <span className="mt-3 text-sm font-semibold text-text-secondary">
                {file?.name ?? 'Pilih file Excel'}
              </span>
              <span className="mt-1 text-xs text-text-muted">
                Format .xlsx, maksimal 5 MB
              </span>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={isPending}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </section>
        )}
      </form>
    </Sheet>
  );
}
