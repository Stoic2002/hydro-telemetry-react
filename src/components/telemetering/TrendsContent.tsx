import Card from '../atoms/Card';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { PJT_HISTORICAL_DATA } from '../../mocks/pjt.mock';

interface TrendsContentProps {
  activeTab: 'water' | 'rainfall';
}

export default function TrendsContent({ activeTab }: TrendsContentProps) {
  const chartLines = activeTab === 'water' 
    ? [{ dataKey: 'waterLevel', name: 'Elevasi (mdpl)', color: '#3b82f6' }]
    : [{ dataKey: 'rainfall', name: 'Curah Hujan (mm)', color: '#22c55e' }];

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card 
        title={activeTab === 'water' ? 'Trend Ketinggian Air (24 Jam)' : 'Trend Curah Hujan (24 Jam)'}
        subtitle="Data historis stasiun utama"
      >
        <div className="h-80">
          <TimeSeriesChart
            data={PJT_HISTORICAL_DATA}
            lines={chartLines}
            type={activeTab === 'rainfall' ? 'area' : 'line'}
            yLabel={activeTab === 'water' ? 'mdpl' : 'mm'}
            yAxisDomain={activeTab === 'water' ? ['dataMin - 0.5', 'dataMax + 0.5'] : [0, 'auto']}
          />
        </div>
      </Card>
    </div>
  );
}
