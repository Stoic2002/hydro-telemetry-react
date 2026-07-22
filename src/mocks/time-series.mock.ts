import type { TimeSeriesPoint } from '../types';

/**
 * Generate realistic mock time-series data
 * Uses sinusoidal wave + noise for natural-looking variations
 */
export function generateTimeSeries(
  hours: number,
  baseValue: number,
  amplitude: number,
  noiseLevel: number = 0.05,
  intervalMinutes: number = 60
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  const totalPoints = Math.floor((hours * 60) / intervalMinutes);

  for (let i = totalPoints; i >= 0; i--) {
    const t = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const phase = (i / totalPoints) * Math.PI * 4;
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * baseValue;
    const seasonal = Math.sin(phase) * amplitude;
    const trend = (totalPoints - i) * 0.001 * amplitude;
    const value = baseValue + seasonal + noise + trend;

    points.push({
      timestamp: t.toISOString(),
      value: Math.round(value * 100) / 100,
    });
  }
  return points;
}

/**
 * Generate inflow data with more variation (rainfall events)
 */
export function generateInflowSeries(hours: number, baseInflow: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  const totalPoints = hours * 4; // every 15 min

  for (let i = totalPoints; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    const phase = (i / totalPoints) * Math.PI * 6;
    const noise = (Math.random() - 0.5) * 0.15 * baseInflow;
    const wave = Math.sin(phase) * baseInflow * 0.2;
    // Simulate occasional rain events
    const rainEvent = Math.random() > 0.92 ? baseInflow * 0.3 * Math.random() : 0;
    const value = Math.max(0, baseInflow + wave + noise + rainEvent);

    points.push({
      timestamp: t.toISOString(),
      value: Math.round(value * 10) / 10,
    });
  }
  return points;
}

/**
 * Generate water level series with gradual changes
 */
export function generateWaterLevelSeries(
  hours: number,
  baseLevel: number,
  targetLevel: number
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  const totalPoints = hours;

  for (let i = totalPoints; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    const phase = (i / totalPoints) * Math.PI * 3;
    const noise = (Math.random() - 0.5) * 0.3;
    const wave = Math.sin(phase) * (targetLevel - baseLevel) * 0.3;
    const value = baseLevel + wave + noise;

    points.push({
      timestamp: t.toISOString(),
      value: Math.round(value * 100) / 100,
    });
  }
  return points;
}

/**
 * Generate storage volume series (30 days + 7 day forecast)
 */
export function generateStorageSeries(baseVolume: number): {
  history: TimeSeriesPoint[];
  forecast: TimeSeriesPoint[];
} {
  const history: TimeSeriesPoint[] = [];
  const forecast: TimeSeriesPoint[] = [];
  const now = new Date();

  // 30 days history
  for (let i = 30; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const phase = (i / 30) * Math.PI * 2;
    const noise = (Math.random() - 0.5) * baseVolume * 0.05;
    const value = baseVolume + Math.sin(phase) * baseVolume * 0.1 + noise;
    history.push({ timestamp: t.toISOString(), value: Math.round(value * 100) / 100 });
  }

  // 7 days forecast
  const lastValue = history[history.length - 1].value;
  for (let i = 1; i <= 7; i++) {
    const t = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const noise = (Math.random() - 0.5) * baseVolume * 0.03;
    const trend = -i * baseVolume * 0.005;
    const value = lastValue + trend + noise;
    forecast.push({ timestamp: t.toISOString(), value: Math.round(value * 100) / 100 });
  }

  return { history, forecast };
}
