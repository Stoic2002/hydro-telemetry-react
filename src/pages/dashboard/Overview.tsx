import { useNavigate } from 'react-router-dom';
import { getPLTADashboardPath, usePlantCatalogQuery } from '../../features/plta';
import JavaMap from '../../components/map/JavaMap';
import PageHeader from '../../components/ui/PageHeader';

const OVERVIEW_MAP_PROJECTION = {
  center: [110.0, -7.35] as [number, number],
  scale: 24_000,
};

export default function Overview() {
  const navigate = useNavigate();
  const plantsQuery = usePlantCatalogQuery();
  const activePlantCount = (plantsQuery.data ?? []).filter((plant) => plant.isActive).length;

  const handlePLTAClick = (id: string) => {
    navigate(getPLTADashboardPath(id, 'telemetering'));
  };

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Overview"
        description="Peta sebaran PLTA di Jawa Tengah beserta kapasitas energinya"
        actions={(
          <>
            <span className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-status-success-strong" />
                <span className="absolute inset-0 animate-ping rounded-full bg-status-success-strong" />
              </span>
              <span className="text-[11.5px] text-text-secondary">Data diperbarui otomatis</span>
            </span>
            {plantsQuery.isSuccess && (
              <>
                <span className="h-3.5 w-px bg-border-subtle" />
                <span className="font-mono text-xs font-medium text-text-muted">
                  {activePlantCount} PLTA aktif
                </span>
              </>
            )}
          </>
        )}
      />

      <div className="mx-auto flex min-w-0 w-full max-w-[1480px] items-center justify-center overflow-hidden">
        <JavaMap
          onPLTAClick={handlePLTAClick}
          projectionConfig={OVERVIEW_MAP_PROJECTION}
          showPrecipitation
        />
      </div>
    </div>
  );
}
