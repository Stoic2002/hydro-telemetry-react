import { useNavigate } from 'react-router-dom';
import { getPLTADashboardPath } from '../../features/plta/routing';
import JavaMap from '../../components/map/JavaMap';

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

      <div className="w-full">
        <JavaMap onPLTAClick={handlePLTAClick} />
      </div>
    </div>
  );
}
