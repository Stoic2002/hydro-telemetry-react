import { useMemo, type ReactNode } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatWIBClock } from '../../shared/lib/date';

interface TimeSeriesDatum {
  timestamp: string;
  [key: string]: unknown;
}

interface TooltipEntry {
  value?: unknown;
  color?: string;
  stroke?: string;
  name?: ReactNode;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: ReactNode;
  yLabel: string;
}

function ChartTooltip({ active, payload, label, yLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-2 text-xs shadow-xl backdrop-blur-sm">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((entry, index) => {
        if (typeof entry.value !== 'number') return null;

        return (
          <div
            key={index}
            style={{ color: entry.color || entry.stroke }}
            className="font-mono font-bold"
          >
            {entry.name}: {entry.value.toFixed(2)} {yLabel}
          </div>
        );
      })}
    </div>
  );
}

interface TimeSeriesChartProps {
  data: TimeSeriesDatum[];
  lines?: { dataKey: string; name: string; color: string; strokeDasharray?: string }[];
  areas?: { dataKey: string; baseLine: string; name: string; color: string; fillOpacity?: number }[];
  referenceLine?: { x?: string | number; y?: number; label?: string; stroke?: string };
  targetValue?: number;
  yLabel?: string;
  color?: string;
  targetColor?: string;
  type?: 'line' | 'area';
  height?: number;
  yAxisDomain?: [number | string, number | string];
}

export default function TimeSeriesChart({
  data,
  lines,
  areas,
  referenceLine,
  targetValue,
  yLabel = '',
  color = '#14a2ba',
  targetColor = '#efe62f',
  type = 'line',
  height = 250,
  yAxisDomain = ['auto', 'auto'],
}: TimeSeriesChartProps) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      ...d,
      time: formatWIBClock(d.timestamp),
    })),
    [data]
  );

  const chartLines = lines || [{ dataKey: 'value', name: yLabel || 'Nilai', color }];

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
        <defs>
          {chartLines.map((line) => (
            <linearGradient key={`grad-${line.dataKey}`} id={`grad-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={line.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
        <XAxis
          dataKey="time"
          stroke="#94a3b8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={yAxisDomain}
          tickFormatter={(v: number) => v.toFixed(v > 100 ? 0 : 1)}
        />
        <Tooltip content={<ChartTooltip yLabel={yLabel} />} />
        
        {targetValue !== undefined && (
          <ReferenceLine y={targetValue} stroke={targetColor} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Target', position: 'right', fill: targetColor, fontSize: 10 }} />
        )}
        
        {referenceLine && (
          <ReferenceLine 
            x={referenceLine.x} 
            y={referenceLine.y} 
            stroke={referenceLine.stroke || '#94a3b8'} 
            label={{ value: referenceLine.label, position: 'top', fill: referenceLine.stroke || '#94a3b8', fontSize: 10 }}
          />
        )}

        {areas?.map((area) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={(datum: TimeSeriesDatum) => [datum[area.baseLine], datum[area.dataKey]]}
            name={area.name}
            stroke="none"
            fill={area.color}
            fillOpacity={area.fillOpacity || 0.3}
            isAnimationActive={false}
          />
        ))}

        {chartLines.map((line) => (
          type === 'area' ? (
            <Area
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.strokeDasharray}
              fill={`url(#grad-${line.dataKey})`}
              dot={false}
              isAnimationActive={false}
            />
          ) : (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.strokeDasharray}
              dot={false}
              isAnimationActive={false}
            />
          )
        ))}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
