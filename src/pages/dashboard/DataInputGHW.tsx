import { useState, useCallback, useRef } from 'react';
import { Shield, UploadCloud, Info, Download, Trash2, FileSpreadsheet } from 'lucide-react';
import { useNotificationStore } from '../../store/notification-store';

interface HistoryItem {
  filename: string;
  dataType: 'Volume Efektif' | 'RTOW';
  period: string;
  uploadedAt: string;
  rows: number;
  status: 'Tervalidasi' | 'Gagal Validasi' | 'Diproses';
}

export default function DataInputGHW() {
  const { addToast } = useNotificationStore();
  
  // File states for Volume Efektif & RTOW
  const [volumeFile, setVolumeFile] = useState<File | null>(null);
  const [rtowFile, setRtowFile] = useState<File | null>(null);
  
  // Drag states
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [isRtowDragging, setIsRtowDragging] = useState(false);

  // File input refs
  const volumeInputRef = useRef<HTMLInputElement>(null);
  const rtowInputRef = useRef<HTMLInputElement>(null);

  // Upload history local state initialized with mockup values
  const [uploadHistory, setUploadHistory] = useState<HistoryItem[]>([
    {
      filename: 'rtow_pbs_2025.csv',
      dataType: 'RTOW',
      period: '2025',
      uploadedAt: '17 Feb 2025 09:41',
      rows: 12,
      status: 'Tervalidasi',
    },
    {
      filename: 'volume_efektif_pbs.csv',
      dataType: 'Volume Efektif',
      period: '2025',
      uploadedAt: '15 Feb 2025 14:20',
      rows: 38,
      status: 'Tervalidasi',
    },
    {
      filename: 'rtow_wadaslintang_2025.csv',
      dataType: 'RTOW',
      period: '2025',
      uploadedAt: '12 Feb 2025 10:05',
      rows: 12,
      status: 'Tervalidasi',
    },
    {
      filename: 'volume_efektif_kedungombo.csv',
      dataType: 'Volume Efektif',
      period: '2025',
      uploadedAt: '10 Feb 2025 16:48',
      rows: 40,
      status: 'Gagal Validasi',
    },
    {
      filename: 'rtow_garung_2025.csv',
      dataType: 'RTOW',
      period: '2025',
      uploadedAt: '08 Feb 2025 08:12',
      rows: 12,
      status: 'Diproses',
    },
  ]);

  // Drag handlers for Volume Efektif
  const handleVolumeDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsVolumeDragging(true);
    } else if (e.type === 'dragleave') {
      setIsVolumeDragging(false);
    }
  }, []);

  const handleVolumeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVolumeDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setVolumeFile(file);
      } else {
        addToast({ type: 'error', message: 'Hanya berkas CSV yang diperbolehkan' });
      }
    }
  }, [addToast]);

  const handleVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVolumeFile(e.target.files[0]);
    }
  };

  // Drag handlers for RTOW
  const handleRtowDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsRtowDragging(true);
    } else if (e.type === 'dragleave') {
      setIsRtowDragging(false);
    }
  }, []);

  const handleRtowDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRtowDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setRtowFile(file);
      } else {
        addToast({ type: 'error', message: 'Hanya berkas CSV yang diperbolehkan' });
      }
    }
  }, [addToast]);

  const handleRtowFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRtowFile(e.target.files[0]);
    }
  };

  // Process/Upload Handlers
  const uploadFile = (file: File, type: 'Volume Efektif' | 'RTOW') => {
    addToast({ type: 'success', message: `Berkas ${file.name} berhasil diunggah` });
    
    // Add to local history list
    const dateNow = new Date();
    const formattedDate = `${dateNow.getDate()} ${dateNow.toLocaleString('id-ID', { month: 'short' })} ${dateNow.getFullYear()} ${dateNow.getHours().toString().padStart(2, '0')}:${dateNow.getMinutes().toString().padStart(2, '0')}`;
    
    const newItem: HistoryItem = {
      filename: file.name,
      dataType: type,
      period: dateNow.getFullYear().toString(),
      uploadedAt: formattedDate,
      rows: Math.floor(Math.random() * 30) + 10,
      status: 'Diproses',
    };

    setUploadHistory([newItem, ...uploadHistory.slice(0, 4)]);
  };

  const handleVolumeUpload = () => {
    if (!volumeFile) return;
    uploadFile(volumeFile, 'Volume Efektif');
    setVolumeFile(null);
  };

  const handleRtowUpload = () => {
    if (!rtowFile) return;
    uploadFile(rtowFile, 'RTOW');
    setRtowFile(null);
  };

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#0f172a] font-display text-2xl font-bold leading-normal">
            Input GHW
          </h1>
          <p className="text-[#64748b] font-sans text-sm leading-normal">
            Unggah data CSV Volume Efektif dan RTOW (Rencana Tahunan Operasi Waduk)
          </p>
        </div>
        
        {/* Role Badge (No Shadow!) */}
        <div className="flex w-fit h-10 items-center bg-[#ecfeff] border border-[#a5f3fc] rounded-[10px] px-3.5 py-0 gap-2">
          <Shield size={16} className="text-[#0891b2]" />
          <span className="text-[#0891b2] font-sans text-[13px] font-semibold">
            Akses Role: GHW
          </span>
        </div>
      </div>

      {/* Two Column Upload Form Grid (No Shadow!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Volume Efektif */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 flex shrink-0 justify-center items-center bg-[#ecfeff] rounded-[10px]">
              <FileSpreadsheet className="text-[#0891b2]" size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#0f172a] font-sans text-base font-semibold leading-normal">
                Volume Efektif
              </h3>
              <p className="text-[#64748b] font-sans text-xs leading-normal">
                Data volume efektif waduk per elevasi
              </p>
            </div>
          </div>

          {/* Volume Efektif Dropzone / File Display */}
          {!volumeFile ? (
            <div 
              onDragEnter={handleVolumeDrag}
              onDragOver={handleVolumeDrag}
              onDragLeave={handleVolumeDrag}
              onDrop={handleVolumeDrop}
              className={`flex flex-col justify-center items-center bg-[#f8fafc] border-dashed border-2 rounded-xl px-4 py-8 gap-2.5 transition-colors cursor-pointer ${
                isVolumeDragging ? 'border-[#0891b2] bg-[#ecfeff]/50' : 'border-[#cbd5e1]'
              }`}
              onClick={() => volumeInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={volumeInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleVolumeFileChange}
              />
              <UploadCloud size={32} className="text-[#0891b2]" />
              <span className="text-[#334155] font-sans text-[13px] font-medium text-center">
                Tarik & letakkan file CSV di sini
              </span>
              <span className="text-[#94a3b8] font-sans text-xs text-center">atau</span>
              <button 
                type="button" 
                className="flex h-9 justify-center items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-[13px] font-semibold rounded-lg px-4 py-0 transition-colors border-0 cursor-pointer"
              >
                Pilih File
              </button>
              <span className="text-[#94a3b8] font-sans text-[11px]">Format .csv · maks. 5 MB</span>
            </div>
          ) : (
            <div className="flex flex-col border border-[#0891b2] bg-[#ecfeff]/20 rounded-xl p-4 gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-[#0891b2] shrink-0" size={24} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#0f172a] font-sans text-sm font-semibold truncate">{volumeFile.name}</span>
                  <span className="text-slate-500 font-sans text-xs">{(volumeFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button 
                  onClick={() => setVolumeFile(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100/50 transition-colors border-0 bg-transparent cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <button
                onClick={handleVolumeUpload}
                className="w-full h-10 flex justify-center items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-sm font-semibold rounded-lg transition-colors border-0 cursor-pointer"
              >
                Proses File
              </button>
            </div>
          )}

          {/* Volume Efektif Helper Column Guide */}
          <div className="flex bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3.5 py-2.5 gap-2">
            <Info size={14} className="text-[#64748b] shrink-0 mt-0.5" />
            <p className="text-[#64748b] font-sans text-xs leading-relaxed">
              Kolom wajib: kode_plta, elevasi (mdpl), volume_efektif (juta m³)
            </p>
          </div>

          {/* Volume Efektif Download Action */}
          <div className="flex items-center gap-1.5 mt-1">
            <Download size={14} className="text-[#0891b2] shrink-0" />
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); addToast({ type: 'info', message: 'Template CSV sedang diunduh' }); }}
              className="text-[#0891b2] font-sans text-[13px] font-medium hover:underline"
            >
              Unduh template CSV
            </a>
          </div>
        </div>

        {/* Right Column: RTOW */}
        <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 flex shrink-0 justify-center items-center bg-[#ecfeff] rounded-[10px]">
              <FileSpreadsheet className="text-[#0891b2]" size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#0f172a] font-sans text-base font-semibold leading-normal">
                RTOW
              </h3>
              <p className="text-[#64748b] font-sans text-xs leading-normal">
                Rencana Tahunan Operasi Waduk per periode
              </p>
            </div>
          </div>

          {/* RTOW Dropzone / File Display */}
          {!rtowFile ? (
            <div 
              onDragEnter={handleRtowDrag}
              onDragOver={handleRtowDrag}
              onDragLeave={handleRtowDrag}
              onDrop={handleRtowDrop}
              className={`flex flex-col justify-center items-center bg-[#f8fafc] border-dashed border-2 rounded-xl px-4 py-8 gap-2.5 transition-colors cursor-pointer ${
                isRtowDragging ? 'border-[#0891b2] bg-[#ecfeff]/50' : 'border-[#cbd5e1]'
              }`}
              onClick={() => rtowInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={rtowInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleRtowFileChange}
              />
              <UploadCloud size={32} className="text-[#0891b2]" />
              <span className="text-[#334155] font-sans text-[13px] font-medium text-center">
                Tarik & letakkan file CSV di sini
              </span>
              <span className="text-[#94a3b8] font-sans text-xs text-center">atau</span>
              <button 
                type="button" 
                className="flex h-9 justify-center items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-[13px] font-semibold rounded-lg px-4 py-0 transition-colors border-0 cursor-pointer"
              >
                Pilih File
              </button>
              <span className="text-[#94a3b8] font-sans text-[11px]">Format .csv · maks. 5 MB</span>
            </div>
          ) : (
            <div className="flex flex-col border border-[#0891b2] bg-[#ecfeff]/20 rounded-xl p-4 gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-[#0891b2] shrink-0" size={24} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#0f172a] font-sans text-sm font-semibold truncate">{rtowFile.name}</span>
                  <span className="text-slate-500 font-sans text-xs">{(rtowFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button 
                  onClick={() => setRtowFile(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100/50 transition-colors border-0 bg-transparent cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <button
                onClick={handleRtowUpload}
                className="w-full h-10 flex justify-center items-center bg-[#0891b2] hover:bg-[#0e7490] text-white font-sans text-sm font-semibold rounded-lg transition-colors border-0 cursor-pointer"
              >
                Proses File
              </button>
            </div>
          )}

          {/* RTOW Helper Column Guide */}
          <div className="flex bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3.5 py-2.5 gap-2">
            <Info size={14} className="text-[#64748b] shrink-0 mt-0.5" />
            <p className="text-[#64748b] font-sans text-xs leading-relaxed">
              Kolom wajib: kode_plta, periode (bulan), elevasi_rencana (mdpl), outflow_rencana (m³/s)
            </p>
          </div>

          {/* RTOW Download Action */}
          <div className="flex items-center gap-1.5 mt-1">
            <Download size={14} className="text-[#0891b2] shrink-0" />
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); addToast({ type: 'info', message: 'Template CSV sedang diunduh' }); }}
              className="text-[#0891b2] font-sans text-[13px] font-medium hover:underline"
            >
              Unduh template CSV
            </a>
          </div>
        </div>
      </div>

      {/* Upload History Section Card (No Shadow!) */}
      <div className="flex h-fit flex-col bg-white border border-[#e2e8f0] rounded-xl p-6 gap-3">
        <div className="flex w-full h-fit items-center">
          <h3 className="text-[#0f172a] font-sans text-base font-semibold flex-1">
            Riwayat Upload
          </h3>
          <span className="text-[#94a3b8] font-sans text-xs">
            5 file terakhir
          </span>
        </div>

        <div className="flex w-full flex-col overflow-x-auto">
          {/* Table Headers */}
          <div className="flex h-[38px] items-center bg-[#f8fafc] rounded-lg px-3.5 py-0 gap-2 min-w-[640px]">
            <div className="text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] flex-1">
              Nama File
            </div>
            <div className="w-[130px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px]">
              Jenis Data
            </div>
            <div className="w-[110px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px]">
              Periode
            </div>
            <div className="w-[150px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px]">
              Diunggah
            </div>
            <div className="w-[70px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              Baris
            </div>
            <div className="w-[110px] text-[#64748b] font-sans text-[11px] font-semibold uppercase tracking-[0.55px] text-right">
              Status
            </div>
          </div>

          {/* Table Body rows */}
          <div className="flex flex-col min-w-[640px] divide-y divide-[#f1f5f9]">
            {uploadHistory.map((item, idx) => (
              <div key={idx} className="flex h-[46px] items-center px-3.5 py-0 gap-2 hover:bg-slate-50/50 transition-colors">
                <div className="flex min-w-0 items-center flex-1 gap-2">
                  <FileSpreadsheet className="text-[#94a3b8] shrink-0" size={14} />
                  <span className="text-[#334155] font-sans text-[13px] font-medium truncate">
                    {item.filename}
                  </span>
                </div>
                <div className="w-[130px] text-[#334155] font-sans text-[13px] leading-normal">
                  {item.dataType}
                </div>
                <div className="w-[110px] text-[#64748b] font-sans text-[13px] leading-normal">
                  {item.period}
                </div>
                <div className="w-[150px] text-[#64748b] font-sans text-[13px] leading-normal">
                  {item.uploadedAt}
                </div>
                <div className="w-[70px] text-[#334155] font-sans text-[13px] leading-normal text-right">
                  {item.rows}
                </div>
                <div className="w-[110px] flex justify-end">
                  <span className={`font-sans text-[11px] font-semibold rounded-full px-2.5 py-[3px] text-center ${
                    item.status === 'Tervalidasi' ? 'bg-[#d1fae5] text-[#047857]' :
                    item.status === 'Gagal Validasi' ? 'bg-[#fee2e2] text-[#b91c1c]' :
                    'bg-[#fef3c7] text-[#b45309]'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
