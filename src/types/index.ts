// ============================================================
// Sistem Telemetering PLTA — Type Definitions
// ============================================================

export type PLTAStatus = 'Aman' | 'Siaga 1' | 'Siaga 2' | 'Kritis' | 'Offline';

export type UserRole = 'Super Admin' | 'Admin UBP' | 'Operator PLTA' | 'Viewer';

type ConnectionStatus = 'Online' | 'Offline' | 'Warning';

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
  historicalData: PLTAHistoricalPoint[];
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

export interface PLTAHistoricalPoint {
  timestamp: string;
  waterLevel: number;
  inflow: number;
  outflow: number;
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}
