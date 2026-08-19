export type TrendAggregation = 'avg' | 'sum';
export type TrendResolution = 'raw' | '5m' | '1h' | '1d';

export interface TrendQueryInput {
  pltaId: string;
  parameter: string;
  from: string;
  to: string;
  resolution: TrendResolution;
  station?: string;
  aggregation?: TrendAggregation;
}

export interface TrendPoint {
  time: string;
  value: number;
  quality: string;
  pureQuality: boolean;
}

const RESOLUTION_BUCKET_MS: Record<TrendResolution, number> = {
  raw: 60 * 1_000,
  '5m': 5 * 60 * 1_000,
  '1h': 60 * 60 * 1_000,
  '1d': 24 * 60 * 60 * 1_000,
};

/**
 * Membulatkan rentang waktu ke batas resolusinya.
 *
 * Rentang dihitung dari `Date.now()`, jadi tanpa pembulatan setiap render
 * menghasilkan nilai `to` yang berbeda pada presisi milidetik. Nilai itu ikut
 * masuk query key, sehingga cache tidak pernah kena dan setiap kunjungan ke
 * halaman tren memicu request baru.
 */
export function alignTrendRange(
  now: Date,
  durationMs: number,
  resolution: TrendResolution,
): { from: string; to: string } {
  const bucketMs = RESOLUTION_BUCKET_MS[resolution];
  const alignedTo = Math.ceil(now.getTime() / bucketMs) * bucketMs;

  return {
    from: new Date(alignedTo - durationMs).toISOString(),
    to: new Date(alignedTo).toISOString(),
  };
}

export interface TrendSeries {
  pltaId: string;
  parameter: string;
  station: string | null;
  resolution: string;
  points: TrendPoint[];
  /** Pembacaan yang nilainya di luar batas wajar dan tidak ikut ditampilkan. */
  discardedPoints: number;
}
