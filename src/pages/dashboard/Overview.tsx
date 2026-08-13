import { useNavigate } from 'react-router-dom';
import { getPLTADashboardPath } from '../../features/plta/routing';
import JavaMap from '../../components/map/JavaMap';

const OVERVIEW_MAP_PROJECTION = {
  center: [110.0, -7.35] as [number, number],
  scale: 24_000,
};

export default function Overview() {
  const navigate = useNavigate();

  const handlePLTAClick = (id: string) => {
    navigate(getPLTADashboardPath(id, 'telemetering'));
  };

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            Overview
          </h1>
          <p className="page-description">
            Peta sebaran PLTA di Jawa Tengah beserta kapasitas energinya
          </p>
        </div>
      </div>

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
