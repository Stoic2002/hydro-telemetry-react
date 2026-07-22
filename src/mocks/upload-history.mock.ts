import type { UploadHistoryItem } from '../features/uploads/model';

export const uploadHistoryMock: UploadHistoryItem[] = [
  { filename: 'rtow_pbs_2025.csv', dataType: 'RTOW', period: '2025', uploadedAt: '17 Feb 2025 09:41 WIB', rows: 12, status: 'Tervalidasi' },
  { filename: 'volume_efektif_pbs.csv', dataType: 'Volume Efektif', period: '2025', uploadedAt: '15 Feb 2025 14:20 WIB', rows: 38, status: 'Tervalidasi' },
  { filename: 'rtow_wadaslintang_2025.csv', dataType: 'RTOW', period: '2025', uploadedAt: '12 Feb 2025 10:05 WIB', rows: 12, status: 'Tervalidasi' },
  { filename: 'volume_efektif_kedungombo.csv', dataType: 'Volume Efektif', period: '2025', uploadedAt: '10 Feb 2025 16:48 WIB', rows: 40, status: 'Gagal Validasi' },
  { filename: 'rtow_garung_2025.csv', dataType: 'RTOW', period: '2025', uploadedAt: '08 Feb 2025 08:12 WIB', rows: 12, status: 'Diproses' },
];
