import { useRef, useState, type DragEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Badge from '../../components/atoms/Badge';
import Select from '../../components/atoms/Select';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
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
    <section className="w-full">
      <h2 className="section-title">Elevasi &amp; Volume Waduk</h2>

      <div className="mt-3.5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_268px]">
        <div>
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
              className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-5 py-8 text-center outline-none transition-colors focus:ring-2 focus:ring-brand-primary-strong/30 ${
                isDragging
                  ? 'border-brand-primary-strong bg-brand-tint'
                  : 'border-border-strong bg-surface-base hover:border-brand-primary-strong'
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
              <UploadCloud size={26} className="text-slate-400" />
              <p className="mt-2 text-[13px] font-semibold text-text-secondary">Tarik file Excel ke area ini</p>
              <p className="mt-1 text-xs text-text-muted">atau klik untuk memilih file</p>
              <span className="mt-2.5 rounded-full border border-border-subtle bg-white px-2.5 py-[3px] font-mono text-[10.5px] font-medium text-text-muted">
                .xlsx · maksimum 5 MB
              </span>
            </div>
          ) : (
            <div className="flex min-h-[190px] flex-col justify-between">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-muted">Setelah file dipilih</p>
                <div className={`mt-2 rounded-md border p-3.5 ${
                  selection.error ? 'border-red-200 bg-red-50/40' : 'border-emerald-200 bg-emerald-50/30'
                }`}
                >
                  <div className="flex items-start gap-3">
                    {selection.error ? (
                      <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
                    ) : (
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-text-primary">{selection.file.name}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {(selection.file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB · Tahun {year}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={isUploading}
                      title="Hapus file"
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-muted hover:bg-white hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onUpload}
                  disabled={Boolean(selection.error) || !Number.isInteger(year) || isUploading}
                  className="mt-2.5 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-brand-primary-strong text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isUploading && <LoaderCircle size={16} className="animate-spin" />}
                  {isUploading ? 'Sedang mengunggah...' : 'Unggah ke Server'}
                </button>

                {selection.error && (
                  <div className="mt-3 flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-[11.5px] leading-relaxed text-red-700">
                      {selection.error}{' '}
                      <button type="button" onClick={clearSelection} className="cursor-pointer font-semibold text-brand-primary-strong hover:text-cyan-800">
                        Pilih file lain
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3.5 rounded-md bg-surface-overlay p-4">
          <Select
            label="Tahun data"
            value={year}
            disabled={isUploading}
            onChange={(event) => onYearChange(Number(event.target.value))}
            options={YEAR_OPTIONS}
            controlClassName="bg-white"
          />

          <label className="flex cursor-pointer items-start gap-2.5">
            <span className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={publish}
                disabled={isUploading}
                onChange={(event) => onPublishChange(event.target.checked)}
                className="peer absolute inset-0 size-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-slate-300 bg-white checked:border-brand-primary-strong checked:bg-brand-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Check size={11} strokeWidth={3} className="pointer-events-none relative text-white opacity-0 peer-checked:opacity-100" />
            </span>
            <span className="text-[12.5px] leading-[1.4] text-text-secondary">Publikasikan kurva elevasi–volume setelah diproses</span>
          </label>

          <p className="border-t border-border-subtle pt-2.5 text-[11px] leading-relaxed text-text-muted">
            Kolom wajib: <strong className="font-semibold text-text-secondary">Elevasi</strong>, <strong className="font-semibold text-text-secondary">Volume</strong>. Kolom Area bersifat opsional.
          </p>

          <a
            href={TEMPLATE_URL}
            download="Template_Upload_PLTA_Standar.xlsx"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-border-subtle bg-white text-xs font-semibold text-text-secondary transition-colors hover:bg-slate-50"
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
      <PageHeader
        title="Input GHW"
        description={`Unggah data elevasi dan volume waduk untuk memperbarui kurva GHW PLTA ${plta.shortName}`}
        actions={<PlantSwitcher page="input-ghw" />}
      />

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

      <div>
        <h2 className="card-title">Riwayat sesi</h2>
        <section className="mt-2.5 w-full overflow-hidden rounded-md border border-border-subtle bg-white">
          {uploadHistory.length === 0 ? (
            <EmptyState
              icon={<FileSpreadsheet size={19} />}
              title="Belum ada unggahan"
              description="Riwayat akan muncul setelah server menerima data."
              className="py-8"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="h-9 border-b border-border-subtle bg-surface-overlay text-left">
                    <th className="table-head-cell px-4">Nama File</th>
                    <th className="table-head-cell px-4">Jenis Data</th>
                    <th className="table-head-cell px-4">Tahun</th>
                    <th className="table-head-cell px-4">Waktu</th>
                    <th className="table-head-cell px-4 text-right">Baris</th>
                    <th className="table-head-cell px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map((item) => (
                    <tr key={`${item.filename}-${item.uploadedAt}`} className="border-t border-surface-overlay text-sm text-text-secondary">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-medium text-text-primary">{item.filename}</td>
                      <td className="px-4 py-3 text-[12.5px]">{item.dataType}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.period}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.uploadedAt}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{item.rows.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <Badge tone="green">Berhasil</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <p className="text-[11.5px] leading-relaxed text-text-muted">
        Riwayat sesi dibatasi 5 baris terakhir, tanpa paginasi. File Excel tidak diparsing di browser — validasi kolom dan jumlah baris baru terlihat setelah server membalas.
      </p>
    </div>
  );
}
