// ============================================================
// Sistem Telemetering PLTA — Type Definitions
// ============================================================

export type PLTAStatus = 'Aman' | 'Siaga 1' | 'Siaga 2' | 'Kritis' | 'Offline';

export type UserRole = 'Super Admin' | 'Admin UBP' | 'Operator PLTA' | 'Viewer';

export type ShiftType = 'Pagi' | 'Siang' | 'Malam';

export type ForecastParameter = 'Inflow' | 'TMA' | 'DMP' | 'Potensi Limpas';

export type ForecastHorizon = 6 | 12 | 24;

export type ChartType = 'line' | 'area' | 'bar';

export type ReportType = 'Inflow' | 'TMA' | 'Outflow' | 'ROH' | 'RTOW' | 'Elevasi' | 'Water Balance';

export type ConnectionStatus = 'Online' | 'Offline' | 'Warning';

// ============================================================
// PLTA Data Types
// ============================================================

export interface PLTAUnit {
  id: number;
  capacity: number; // MW
}

export interface PLTAInfo {
  id: string;
  name: string;
  shortName: string;
  location: string;
  province: string;
  capacity: number; // MW total
  units?: PLTAUnit[];
  waduk?: string;
  ws: string; // Wilayah Sungai
  status: PLTAStatus;
  coordinates: [number, number]; // [longitude, latitude]
  liveData: LiveData;
  connection: ConnectionInfo;
  awlrStations?: AWLRStation[];
  awsSensors?: AWSSensor[];
  hasExtendedML?: boolean;
  notes?: string;
  historicalData: any[]; // Or TimeSeriesPoint[] if typed exactly
}

export interface LiveData {
  waterLevel: number;       // mdpl
  targetLevel: number;      // mdpl
  inflow: number;           // m³/s
  outflow: number;          // m³/s
  produksi?: number;        // MW
  elevasiSedimen?: number;  // mdpl
  volumeEfektif?: number;   // juta m³
  currentAvailableEnergy?: number; // MW
  deltaHead?: number;       // cm
  roh?: number;             // MW
  evaReservoir?: number;    // %
  spillway?: number;        // m³/s
  curahHujan?: number;      // mm
  lastUpdate: string;       // ISO timestamp
}

export interface ConnectionInfo {
  status: ConnectionStatus;
  lastReceived: string;     // ISO timestamp
  nextSync: string;         // ISO timestamp
}

export interface AWLRStation {
  id: string;
  name: string;
  elevation: number;        // mdpl
  status: 'Aktif' | 'Offline';
  lastUpdate: string;
}

export interface AWSSensor {
  id: string;
  name: string;
  type: string;
  status: 'Aktif' | 'Offline';
  value?: number;
  unit?: string;
}

// ============================================================
// Time Series
// ============================================================

export interface TimeSeriesPoint {
  timestamp: string;  // ISO timestamp
  value: number;
}

export interface MultiSeriesPoint {
  timestamp: string;
  [key: string]: string | number; // dynamic keys for multi-PLTA
}

// ============================================================
// ML / Forecast
// ============================================================

export interface MLModelInfo {
  version: string;
  trainDate: string;
  mae: number;
  rmse: number;
  r2: number;
}

export interface ExtendedVariable {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ForecastPoint {
  timestamp: string;
  actual: number | null;
  predicted: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  status?: PLTAStatus;
}

export interface ForecastResult {
  parameter: ForecastParameter;
  horizon: ForecastHorizon;
  modelInfo: MLModelInfo;
  data: ForecastPoint[];
  thresholds: {
    siaga1: number;
    siaga2: number;
  };
}

// ============================================================
// Water Balance
// ============================================================

export interface WaterBalanceData {
  pltaId: string;
  date: string;
  totalInflowToday: number;   // m³/s cumulative
  totalOutflowToday: number;
  deltaStorage: number;       // juta m³
  reservoirEfficiency: number; // %
  components: {
    inflowHulu: number;
    curahHujan: number;
    turbineOutflow: number;
    spillwayOutflow: number;
    evaporasi: number;
  };
  storageHistory: TimeSeriesPoint[];    // 30 hari
  storageForecast: TimeSeriesPoint[];   // 7 hari
}

export interface WaterBalanceDailyRow {
  date: string;
  inflowTotal: number;
  outflowTotal: number;
  evaporasi: number;
  deltaStorage: number;
  volumeAkhir: number;
}

// ============================================================
// Reports
// ============================================================

export interface ReportFilter {
  pltaId: string;
  reportType: ReportType;
  startDate: string;
  endDate: string;
}

export interface ReportRow {
  date: string;
  hour?: string;
  value: number;
  dailyAvg?: number;
  delta?: number;
  status?: PLTAStatus;
  unit: string;
}

export interface ReportSummary {
  min: number;
  max: number;
  average: number;
  total?: number;
}

// ============================================================
// Data Input
// ============================================================

export interface CSVUploadRecord {
  id: string;
  date: string;
  fileName: string;
  rowCount: number;
  status: 'Berhasil' | 'Gagal' | 'Menunggu';
  uploadedBy: string;
}

export interface DDCInputData {
  pltaId: string;
  date: string;
  hour: string;
  shift: ShiftType;
  debitOutflow: number;
  elevasiMukaAir: number;
  unitAktif: number;
  dayaProduksi: number;
  // PBS Soedirman extended fields
  debitPengelak?: number;
  statusPintuAir?: string;
  elevasiHulu?: number;
  suhuAirReservoir?: number;
  catatan?: string;
}

export interface SpillwayInputData {
  pltaId: string;
  date: string;
  gates: {
    gateId: string;
    position: number; // cm
    debitTerukur: number; // m³/s
  }[];
  totalOutflow: number;
}

// ============================================================
// User Management
// ============================================================

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  accessPLTA: string[]; // PLTA IDs
  status: 'Aktif' | 'Nonaktif';
  lastLogin?: string;
  avatarColor?: string;
}

// ============================================================
// Trends / Analysis
// ============================================================

export interface TrendFilter {
  pltaIds: string[];
  parameter: string;
  period: string;
  chartType: ChartType;
}

export interface TrendStatRow {
  pltaId: string;
  pltaName: string;
  min: number;
  max: number;
  average: number;
  stdDev: number;
  trend: 'Naik' | 'Turun' | 'Stabil';
}

// ============================================================
// Notification
// ============================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
