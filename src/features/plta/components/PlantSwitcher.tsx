import type { ChangeEvent } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Select from '../../../components/atoms/Select';
import Skeleton from '../../../components/atoms/Skeleton';
import { usePlantCatalogQuery } from '../api/queries';
import { getPlantDisplayName } from '../presentation';
import {
  getPLTADashboardPath,
  useActivePLTAId,
  type PLTADashboardPage,
} from '../routing';

interface PlantSwitcherProps {
  page: PLTADashboardPage;
  className?: string;
}

export default function PlantSwitcher({ page, className = '' }: PlantSwitcherProps) {
  const activePlantId = useActivePLTAId();
  const plantsQuery = usePlantCatalogQuery();
  const location = useLocation();
  const navigate = useNavigate();

  if (plantsQuery.isPending) {
    return (
      <div role="status" aria-label="Memuat pilihan PLTA" className={`shrink-0 ${className}`}>
        <Skeleton className="h-11 w-full rounded-xl sm:w-[240px]" />
        <span className="sr-only">Memuat pilihan PLTA...</span>
      </div>
    );
  }

  if (plantsQuery.isError) {
    return (
      <button
        type="button"
        onClick={() => void plantsQuery.refetch()}
        className={`inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 sm:w-[240px] ${className}`}
      >
        <RefreshCw size={14} />
        Muat ulang daftar PLTA
      </button>
    );
  }

  if (plantsQuery.data.length === 0) {
    return (
      <div className={`flex h-11 w-full shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 sm:w-[240px] ${className}`}>
        Belum ada PLTA tersedia
      </div>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextPlantId = event.target.value;
    if (!nextPlantId || nextPlantId === activePlantId) return;

    navigate({
      pathname: getPLTADashboardPath(nextPlantId, page),
      search: location.search,
    });
  };

  return (
    <Select
      id={`plant-switcher-${page}`}
      aria-label="Pilih PLTA"
      value={activePlantId}
      onChange={handleChange}
      leadingIcon={<Building2 />}
      className={`shrink-0 sm:w-[260px] ${className}`}
      options={plantsQuery.data.map((plant) => ({
        value: plant.id,
        label: `${getPlantDisplayName(plant)} · ${plant.code}${plant.isActive ? '' : ' (Tidak aktif)'}`,
      }))}
    />
  );
}
