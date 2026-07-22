export interface UploadHistoryItem {
  filename: string;
  dataType: 'Volume Efektif' | 'RTOW';
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

export interface CreateElevationInput {
  pltaId: string;
  year: number;
  minElevation: number;
  maxElevation: number;
  points: ElevationPoint[];
}

export interface ElevationUploadResult extends CreateElevationInput {
  id: string;
  status: string;
  points: Array<ElevationPoint & { id: string }>;
}

export interface RTOWEntry {
  tanggal: string;
  targetElevasi: number;
}

export interface CreateRTOWInput {
  pltaId: string;
  tahun: number;
  entries: RTOWEntry[];
}

export interface RTOWUploadResult extends CreateRTOWInput {
  id: string;
  entries: Array<RTOWEntry & { id: string }>;
}

export interface ParsedElevationWorkbook {
  year: number;
  minElevation: number;
  maxElevation: number;
  points: ElevationPoint[];
}

export interface ParsedRTOWWorkbook {
  tahun: number;
  entries: RTOWEntry[];
}
