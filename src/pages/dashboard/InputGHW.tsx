import { useRef, useState, type DragEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Select from '../../components/atoms/Select';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import { useActivePLTA } from '../../features/plta/api/queries';
import { useUploadElevationExcelMutation } from '../../features/uploads';
import type { UploadHistoryItem } from '../../features/uploads/model';
import { formatDateWIB } from '../../shared/lib/date';
import { useNotificationStore } from '../../store/notification-store';

const TEMPLATE_URL = '/templates/template-upload-plta.xlsx';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1988 },
  (_, index) => CURRENT_YEAR + 1 - index,
).map((value) => ({ value, label: String(value) }));

interface SelectedWorkbook {
  file: File;
  error: string | null;
}

interface UploadCardProps {
  selection: SelectedWorkbook | null;
  year: number;
  publish: boolean;
  isUploading: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onYearChange: (year: number) => void;
  onPublishChange: (publish: boolean) => void;
  onUpload: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Terjadi kesalahan saat mengunggah file Excel.';
}

function validateWorkbook(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return 'File harus menggunakan format .xlsx.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Ukuran file melebihi batas backend 5 MB.';
  }
  return null;
}

function UploadCard({
  selection,
  year,
  publish,
  isUploading,
  onSelect,
  onClear,
  onYearChange,
  onPublishChange,
  onUpload,
}: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(event.type === 'dragenter' || event.type === 'dragover');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onSelect(file);
  };

  const clearSelection = () => {
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-brand-primary-strong">
          <FileSpreadsheet size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">Elevasi & Volume Waduk</h2>
          <p className="mt-0.5 text-xs text-slate-500">Unggah satu file Excel untuk tahun data yang dipilih.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-5 sm:p-6">
          {!selection ? (
            <div
              role="button"
              tabIndex={0}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
              }}
              className={`flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-10 text-center outline-none transition-colors focus:ring-2 focus:ring-brand-primary-strong/30 ${
                isDragging
                  ? 'border-brand-primary-strong bg-cyan-50/70'
                  : 'border-slate-300 bg-slate-50/60 hover:border-cyan-400 hover:bg-cyan-50/30'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onSelect(file);
                }}
              />
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-brand-primary-strong ring-1 ring-slate-200">
                <UploadCloud size={23} />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-700">Tarik file Excel ke area ini</p>
              <p className="mt-1 text-xs text-slate-400">atau klik untuk memilih file dari perangkat</p>
              <span className="mt-4 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                .xlsx · maksimum 5 MB
              </span>
            </div>
          ) : (
            <div className={`flex min-h-60 flex-col justify-between rounded-xl border p-5 ${
              selection.error ? 'border-red-200 bg-red-50/40' : 'border-emerald-200 bg-emerald-50/30'
            }`}>
              <div>
                <div className="flex items-start gap-3">
                  {selection.error ? (
                    <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={24} />
                  ) : (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={24} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{selection.file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(selection.file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB · Tahun {year}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={isUploading}
                    title="Hapus file"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className={`mt-5 text-xs leading-5 ${selection.error ? 'text-red-700' : 'text-emerald-700'}`}>
                  {selection.error ?? 'File siap dikirim utuh ke backend tanpa diparsing di browser.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onUpload}
                disabled={Boolean(selection.error) || !Number.isInteger(year) || isUploading}
                className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-primary-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isUploading && <LoaderCircle size={16} className="animate-spin" />}
                {isUploading ? 'Sedang mengunggah...' : 'Unggah ke Server'}
              </button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5 border-t border-slate-200 bg-slate-50/60 p-5 lg:border-l lg:border-t-0">
          <Select
            label="Tahun data"
            value={year}
            disabled={isUploading}
            onChange={(event) => onYearChange(Number(event.target.value))}
            options={YEAR_OPTIONS}
            controlClassName="bg-white"
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={publish}
              disabled={isUploading}
              onChange={(event) => onPublishChange(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-cyan-700"
            />
            <span>
              <span className="block font-semibold text-slate-700">Publikasikan kurva</span>
              <span className="mt-1 block leading-5 text-slate-400">Aktifkan agar kurva langsung digunakan setelah validasi server.</span>
            </span>
          </label>

          <div className="flex gap-2 border-y border-slate-200 py-3">
            <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
            <p className="text-xs leading-5 text-slate-500">
              Kolom <strong>Elevasi</strong> dan <strong>Volume</strong> wajib. Kolom <strong>Area</strong> bersifat opsional.
            </p>
          </div>

          <a
            href={TEMPLATE_URL}
            download="Template_Upload_PLTA_Standar.xlsx"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-cyan-400 hover:text-brand-primary-strong"
          >
            <Download size={14} />
            Unduh Template
          </a>
        </aside>
      </div>
    </section>
  );
}

export default function InputGHW() {
  const { pltaId, plta } = useActivePLTA();
  const { addToast } = useNotificationStore();
  const elevationMutation = useUploadElevationExcelMutation();
  const [selection, setSelection] = useState<SelectedWorkbook | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [publish, setPublish] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  const selectFile = (file: File) => {
    setSelection({ file, error: validateWorkbook(file) });
  };

  const uploadElevation = async () => {
    if (!selection || selection.error || !Number.isInteger(year)) return;

    try {
      const result = await elevationMutation.mutateAsync({
        pltaId,
        year,
        file: selection.file,
        publish,
      });
      const historyItem: UploadHistoryItem = {
        filename: selection.file.name,
        dataType: 'Volume Efektif',
        period: String(result.year),
        uploadedAt: formatDateWIB(new Date()),
        rows: result.points.length,
        status: 'Tervalidasi',
      };
      setUploadHistory((current) => [historyItem, ...current].slice(0, 5));
      addToast({
        type: 'success',
        message: `${result.points.length} titik elevasi berhasil diterima backend untuk PLTA ${plta.shortName} (${result.status}).`,
      });
      setSelection(null);
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="page-title">Input GHW</h1>
          <p className="page-description">Unggah data elevasi dan volume PLTA {plta.shortName}</p>
        </div>
        <PlantSwitcher page="input-ghw" />
      </header>

      <UploadCard
        selection={selection}
        year={year}
        publish={publish}
        isUploading={elevationMutation.isPending}
        onSelect={selectFile}
        onClear={() => setSelection(null)}
        onYearChange={setYear}
        onPublishChange={setPublish}
        onUpload={() => void uploadElevation()}
      />

      <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Riwayat sesi</h2>
            <p className="mt-0.5 text-xs text-slate-500">File yang sudah diterima dan divalidasi server.</p>
          </div>
          <span className="text-xs text-slate-400">Maks. 5 data</span>
        </div>

        {uploadHistory.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center px-6 text-center">
            <FileSpreadsheet size={28} className="text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada upload</p>
            <p className="mt-1 text-xs text-slate-400">Riwayat akan muncul setelah server menerima data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="h-11 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  <th className="px-5">Nama File</th>
                  <th className="px-5">Jenis Data</th>
                  <th className="px-5">Tahun</th>
                  <th className="px-5">Waktu</th>
                  <th className="px-5 text-right">Baris</th>
                  <th className="px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((item) => (
                  <tr key={`${item.filename}-${item.uploadedAt}`} className="border-t border-slate-100 text-sm text-slate-600">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{item.filename}</td>
                    <td className="px-5 py-3.5">{item.dataType}</td>
                    <td className="px-5 py-3.5">{item.period}</td>
                    <td className="px-5 py-3.5 text-xs">{item.uploadedAt}</td>
                    <td className="px-5 py-3.5 text-right font-mono">{item.rows.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Berhasil</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
