import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { usePLTAStore } from '../../store/plta-store';
import { useRealtimeClock } from '../../hooks/useRealtimeClock';
import JavaMap from '../../components/map/JavaMap';

export default function Overview() {
  const { setSelectedPLTA } = usePLTAStore();
  const navigate = useNavigate();
  const now = useRealtimeClock();

  const handlePLTAClick = (id: string) => {
    setSelectedPLTA(id);
    navigate('/dashboard/telemetering');
  };

  const formatDateWIBFull = (date: Date): string => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dayName}, ${day} ${month} ${year} · ${hours}:${minutes} WIB`;
  };

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#0f172a] font-display text-[22px] font-bold leading-normal tracking-[-0.55px]">
            Overview
          </h1>
          <p className="text-[#64748b] font-sans text-[13px] leading-normal">
            Peta sebaran PLTA di Jawa Tengah beserta kapasitas energinya
          </p>
        </div>
        
        {/* Real-time Date Widget (No Shadow!) */}
        <div className="flex items-center self-start sm:self-auto bg-white border border-[#e2e8f0] rounded-2xl px-3 py-2 gap-2">
          <Calendar size={16} className="text-[#64748b] shrink-0" />
          <span className="text-[#334155] font-sans text-[13px] leading-normal whitespace-nowrap">
            {formatDateWIBFull(now)}
          </span>
        </div>
      </div>

      {/* Map Area - Directly on background without Card container */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
          <h2 className="text-[#0f172a] font-sans text-[15px] font-semibold leading-normal">
            Peta Jawa Tengah
          </h2>
          <span className="text-[#94a3b8] font-sans text-xs leading-normal">
            Arahkan kursor ke titik untuk melihat detail
          </span>
        </div>
        <div className="w-full">
          <JavaMap onPLTAClick={handlePLTAClick} />
        </div>
      </div>
    </div>
  );
}
