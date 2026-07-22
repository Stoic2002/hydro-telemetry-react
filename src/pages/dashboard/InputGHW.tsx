import {
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react';
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
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';
import { useActivePLTA } from '../../features/plta/api/queries';
import {
  parseElevationWorkbook,
  parseRTOWWorkbook,
  useCreateElevationMutation,
  useCreateRTOWMutation,
  type ParsedElevationWorkbook,
  type ParsedRTOWWorkbook,
} from '../../features/uploads';
import type { UploadHistoryItem } from '../../features/uploads/model';
import { formatDateWIB } from '../../shared/lib/date';
import { useNotificationStore } from '../../store/notification-store';

const TEMPLATE_URL = '/templates/template-upload-plta.xlsx';

interface SelectedWorkbook<TData> {
  file: File;
  data: TData | null;
  error: string | null;
  isParsing: boolean;
}

interface UploadCardProps<TData> {
  title: string;
  description: string;
  sheetName: string;
  helper: ReactNode;
  selection: SelectedWorkbook<TData> | null;
  isUploading: boolean;
  summary: (data: TData) => string;
  onSelect: (file: File) => void;
  onClear: () => void;
  onUpload: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Terjadi kesalahan saat memproses file Excel.';
}

function UploadCard<TData>({
  title,
  description,
  sheetName,
  helper,
  selection,
  isUploading,
  summary,
  onSelect,
  onClear,
  onUpload,
}: UploadCardProps<TData>) {
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
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-cyan-50 text-brand-primary-strong">
          <FileSpreadsheet size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>

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
          className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-8 text-center outline-none transition-colors focus:ring-2 focus:ring-brand-primary-strong/30 ${
            isDragging ? 'border-brand-primary-strong bg-cyan-50/70' : 'border-slate-300 bg-slate-50 hover:border-cyan-400'
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
          <UploadCloud size={32} className="text-brand-primary-strong" />
          <span className="text-[13px] font-medium text-slate-700">Tarik file Excel ke sini atau pilih file</span>
          <span className="text-[11px] text-slate-400">Format .xlsx · maksimum 10 MB</span>
        </div>
      ) : (
        <div className={`flex flex-col gap-3 rounded-xl border p-4 ${
          selection.error ? 'border-red-200 bg-red-50/50' : 'border-cyan-200 bg-cyan-50/30'
        }`}>
          <div className="flex items-center gap-3">
            {selection.isParsing ? (
              <LoaderCircle className="shrink-0 animate-spin text-brand-primary-strong" size={23} />
            ) : selection.error ? (
              <AlertCircle className="shrink-0 text-red-500" size={23} />
            ) : (
              <CheckCircle2 className="shrink-0 text-emerald-600" size={23} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{selection.file.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {(selection.file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB
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

          {selection.isParsing ? (
            <p className="text-xs text-slate-500">Memvalidasi struktur dan isi workbook...</p>
          ) : selection.error ? (
            <p className="text-xs leading-5 text-red-700">{selection.error}</p>
          ) : selection.data ? (
            <p className="text-xs font-medium leading-5 text-emerald-700">{summary(selection.data)}</p>
          ) : null}

          <button
            type="button"
            onClick={onUpload}
            disabled={!selection.data || selection.isParsing || isUploading}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-primary-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading && <LoaderCircle size={16} className="animate-spin" />}
            {isUploading ? 'Sedang mengunggah...' : 'Unggah Data'}
          </button>
        </div>
      )}

      <div className="flex gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-xs leading-5 text-slate-500">
          Sheet <span className="font-mono font-semibold text-slate-700">{sheetName}</span>: {helper}
        </p>
      </div>

      <a
        href={TEMPLATE_URL}
        download="Template_Upload_PLTA_Standar.xlsx"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-brand-primary-strong hover:underline"
      >
        <Download size={14} />
        Unduh template Excel standar
      </a>
    </section>
  );
}

export default function InputGHW() {
  const { pltaId, plta } = useActivePLTA();
  const { addToast } = useNotificationStore();
  const elevationMutation = useCreateElevationMutation();
  const rtowMutation = useCreateRTOWMutation();
  const [elevationSelection, setElevationSelection] = useState<SelectedWorkbook<ParsedElevationWorkbook> | null>(null);
  const [rtowSelection, setRTOWSelection] = useState<SelectedWorkbook<ParsedRTOWWorkbook> | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  const selectElevationFile = (file: File) => {
    setElevationSelection({ file, data: null, error: null, isParsing: true });
    void parseElevationWorkbook(file)
      .then((data) => setElevationSelection({ file, data, error: null, isParsing: false }))
      .catch((error) => setElevationSelection({ file, data: null, error: errorMessage(error), isParsing: false }));
  };

  const selectRTOWFile = (file: File) => {
    setRTOWSelection({ file, data: null, error: null, isParsing: true });
    void parseRTOWWorkbook(file)
      .then((data) => setRTOWSelection({ file, data, error: null, isParsing: false }))
      .catch((error) => setRTOWSelection({ file, data: null, error: errorMessage(error), isParsing: false }));
  };

  const addHistory = (
    filename: string,
    dataType: UploadHistoryItem['dataType'],
    period: number,
    rows: number,
  ) => {
    const item: UploadHistoryItem = {
      filename,
      dataType,
      period: String(period),
      uploadedAt: formatDateWIB(new Date()),
      rows,
      status: 'Tervalidasi',
    };
    setUploadHistory((current) => [item, ...current].slice(0, 5));
  };

  const uploadElevation = async () => {
    if (!elevationSelection?.data) return;

    try {
      const result = await elevationMutation.mutateAsync({
        pltaId,
        ...elevationSelection.data,
      });
      addHistory(
        elevationSelection.file.name,
        'Volume Efektif',
        result.year,
        result.points.length,
      );
      addToast({
        type: 'success',
        message: `${result.points.length} titik elevasi berhasil dikirim untuk PLTA ${plta.shortName}.`,
      });
      setElevationSelection(null);
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error) });
    }
  };

  const uploadRTOW = async () => {
    if (!rtowSelection?.data) return;

    try {
      const result = await rtowMutation.mutateAsync({
        pltaId,
        ...rtowSelection.data,
      });
      addHistory(
        rtowSelection.file.name,
        'RTOW',
        result.tahun,
        result.entries.length,
      );
      addToast({
        type: 'success',
        message: `${result.entries.length} entri RTOW berhasil dikirim untuk PLTA ${plta.shortName}.`,
      });
      setRTOWSelection(null);
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Input GHW</h1>
          <p className="page-description">
            Unggah data elevasi/volume dan RTOW untuk PLTA {plta.shortName} melalui template Excel terstandar
          </p>
        </div>

        <PlantSwitcher page="input-ghw" />
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <UploadCard
          title="Elevasi & Volume Waduk"
          description="Kurva elevasi, volume, dan area waduk per tahun"
          sheetName="ELEVATION_VOLUME"
          helper={<>kolom <strong>elevation</strong>, <strong>volume</strong>, dan <strong>area</strong>. Area boleh kosong untuk Wonogiri.</>}
          selection={elevationSelection}
          isUploading={elevationMutation.isPending}
          summary={(data) => `${data.points.length.toLocaleString('id-ID')} titik valid · tahun ${data.year} · elevasi ${data.minElevation}–${data.maxElevation}`}
          onSelect={selectElevationFile}
          onClear={() => setElevationSelection(null)}
          onUpload={() => void uploadElevation()}
        />

        <UploadCard
          title="RTOW"
          description="Rencana Tahunan Operasi Waduk per tanggal"
          sheetName="RTOW"
          helper={<>kolom <strong>tanggal</strong> (YYYY-MM-DD) dan <strong>target_elevasi</strong>.</>}
          selection={rtowSelection}
          isUploading={rtowMutation.isPending}
          summary={(data) => `${data.entries.length.toLocaleString('id-ID')} tanggal valid · tahun ${data.tahun}`}
          onSelect={selectRTOWFile}
          onClear={() => setRTOWSelection(null)}
          onUpload={() => void uploadRTOW()}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Upload berhasil pada sesi ini</h2>
            <p className="mt-0.5 text-xs text-slate-500">Hanya menampilkan data yang berhasil diunggah.</p>
          </div>
          <span className="text-xs text-slate-400">Maks. 5 data</span>
        </div>

        {uploadHistory.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center px-6 text-center">
            <FileSpreadsheet size={28} className="text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada upload berhasil</p>
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
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Berhasil
                      </span>
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
