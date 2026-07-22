import { Droplets, CloudRain } from 'lucide-react';
import Card from '../atoms/Card';

interface StationCardProps {
  name: string;
  value: number;
  unit: string;
  type: 'water' | 'rainfall';
  technicalLabel?: string;
  secondaryLabel?: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  coordinates: { x: number; y: number };
  lastTx: string;
}

export default function StationCard({
  name,
  value,
  unit,
  type,
  secondaryLabel,
  secondaryValue,
  secondaryUnit,
  coordinates,
  lastTx,
}: StationCardProps) {
  const isWater = type === 'water';
  const Icon = isWater ? Droplets : CloudRain;
  const accentColor = isWater ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  const borderColor = isWater ? 'border-t-blue-500' : 'border-t-green-500';

  return (
    <Card noPadding className={`group transition-all duration-300 hover:shadow-lg border-t-4 ${borderColor}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-800 group-hover:text-pln-teal transition-colors line-clamp-1">
              {name}
            </h3>
          </div>
          <div className={`p-2 rounded-xl ${accentColor}`}>
            <Icon size={18} />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-3xl font-mono font-bold text-slate-900">
            {value.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm font-semibold text-slate-500">{unit}</span>
        </div>

        {secondaryLabel && secondaryValue !== undefined && (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg mb-4 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">{secondaryLabel}</span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {secondaryValue.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {secondaryUnit}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] font-medium">
          <div className="flex items-center gap-1 text-slate-400 uppercase">
            <span>{coordinates.x.toFixed(4)}, {coordinates.y.toFixed(4)}</span>
          </div>
          <div className="text-slate-400 uppercase">
            {lastTx}
          </div>
        </div>
      </div>
    </Card>
  );
}
