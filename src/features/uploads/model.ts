export interface UploadHistoryItem {
  filename: string;
  dataType: 'Volume Efektif';
  period: string;
  uploadedAt: string;
  rows: number;
  status: 'Tervalidasi' | 'Gagal Validasi' | 'Diproses';
}

export interface ElevationPoint {
  elevation: number;
  volume: number;
  area: number;
}

export interface UploadElevationExcelInput {
  pltaId: string;
  year: number;
  file: File;
  publish: boolean;
}

export interface ElevationUploadResult {
  id: string;
  pltaId: string;
  year: number;
  status: 'draft' | 'published';
  minElevation: number | null;
  maxElevation: number | null;
  points: Array<ElevationPoint & { id: string }>;
}
