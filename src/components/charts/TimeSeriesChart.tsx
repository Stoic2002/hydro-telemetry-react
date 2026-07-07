import { useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface TimeSeriesChartProps {
  data: any[];
  lines?: { dataKey: string; name: string; color: string; strokeDasharray?: string }[];
  areas?: { dataKey: string; baseLine: string; name: string; color: string; fillOpacity?: number }[];
  referenceLine?: { x?: string | number; y?: number; label?: string; stroke?: string };
  targetValue?: number;
  yLabel?: string;
  color?: string;
  targetColor?: string;
  type?: 'line' | 'area';
  height?: number;
  yAxisDomain?: [any, any] | string[];
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
      time: new Date(d.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    })),
    [data]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-2 text-xs shadow-xl backdrop-blur-sm">
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p: any, i: number) => {
          // If value is an array (e.g. from Area chart confidence interval) or not a number, skip it
          if (typeof p.value !== 'number') return null;
          return (
            <div key={i} style={{ color: p.color || p.stroke }} className="font-mono font-bold">
              {p.name}: {p.value.toFixed(2)} {yLabel}
            </div>
          );
        })}
      </div>
    );
  };

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
        <Tooltip content={<CustomTooltip />} />
        
        {targetValue && (
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
            dataKey={(d: any) => [d[area.baseLine], d[area.dataKey]]}
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
