import type { PLTAInfo, TimeSeriesPoint } from '../types';

// Helper to generate mock historical data
const generateHistoricalData = (baseLevel: number, baseInflow: number, baseOutflow: number): any[] => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      timestamp: d.toISOString(),
      waterLevel: baseLevel + (Math.random() * 2 - 1),
      inflow: baseInflow + (Math.random() * 20 - 10),
      outflow: baseOutflow + (Math.random() * 15 - 7.5),
    });
  }
  return data;
};

export const pltaData: PLTAInfo[] = [
  {
    id: 'pbs-soedirman',
    name: 'PLTA PBS Soedirman',
    shortName: 'PBS Soedirman',
    location: 'Banjarnegara, Jawa Tengah',
    province: 'Jawa Tengah',
    capacity: 184.5,
    units: [
      { id: 1, capacity: 61.5 },
      { id: 2, capacity: 61.5 },
      { id: 3, capacity: 61.5 },
    ],
    waduk: 'Waduk PBS Soedirman (Mrica)',
    ws: 'WS Serayu-Bogowonto',
    status: 'Siaga 1',
    coordinates: [109.6253, -7.3631],
    hasExtendedML: true,
    notes: 'Unit utama — model ML extended aktif',
    historicalData: generateHistoricalData(223.10, 215.8, 198.4),
    liveData: {
      waterLevel: 223.10,
      targetLevel: 224.50,
      inflow: 215.8,
      outflow: 198.4,
      produksi: 87.4,
      elevasiSedimen: 198.50,
      volumeEfektif: 41.2,
      currentAvailableEnergy: 112.3,
      deltaHead: 45.2,
      roh: 95.6,
      evaReservoir: 78.4,
      lastUpdate: new Date().toISOString(),
    },
    connection: {
      status: 'Online',
      lastReceived: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    awlrStations: [
      { id: 'awlr-1', name: 'Stasiun Banjarnegara', elevation: 223.10, status: 'Aktif', lastUpdate: new Date().toISOString() },
      { id: 'awlr-2', name: 'Stasiun Serayu Hulu', elevation: 245.30, status: 'Aktif', lastUpdate: new Date().toISOString() },
      { id: 'awlr-3', name: 'Stasiun Merawu', elevation: 231.45, status: 'Offline', lastUpdate: new Date(Date.now() - 3600000).toISOString() },
    ],
    awsSensors: [
      { id: 'aws-1', name: 'Curah Hujan', type: 'Rain Gauge', status: 'Aktif', value: 2.4, unit: 'mm/jam' },
      { id: 'aws-2', name: 'Suhu Udara', type: 'Thermometer', status: 'Aktif', value: 28.5, unit: '°C' },
      { id: 'aws-3', name: 'Kelembaban', type: 'Hygrometer', status: 'Aktif', value: 82, unit: '%' },
      { id: 'aws-4', name: 'Kecepatan Angin', type: 'Anemometer', status: 'Offline', value: undefined, unit: 'km/jam' },
      { id: 'aws-5', name: 'Tekanan Udara', type: 'Barometer', status: 'Aktif', value: 1013.2, unit: 'hPa' },
    ],
  },
  {
    id: 'ketenger',
    name: 'PLTA Ketenger',
    shortName: 'Ketenger',
    location: 'Banyumas, Jawa Tengah',
    province: 'Jawa Tengah',
    capacity: 0.5,
    ws: 'WS Serayu-Bogowonto',
    status: 'Aman',
    coordinates: [109.2142, -7.3175],
    historicalData: generateHistoricalData(312.45, 4.2, 3.8),
    liveData: {
      waterLevel: 312.45,
      targetLevel: 313.00,
      inflow: 4.2,
      outflow: 3.8,
      produksi: 0.35,
      elevasiSedimen: 305.20,
      volumeEfektif: 0.8,
      currentAvailableEnergy: 0.42,
      deltaHead: 12.5,
      roh: 0.4,
      evaReservoir: 85.2,
      lastUpdate: new Date().toISOString(),
    },
    connection: {
      status: 'Online',
      lastReceived: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    awlrStations: [
      { id: 'awlr-k1', name: 'Stasiun Ketenger', elevation: 312.45, status: 'Aktif', lastUpdate: new Date().toISOString() },
    ],
    awsSensors: [
      { id: 'aws-k1', name: 'Curah Hujan', type: 'Rain Gauge', status: 'Aktif', value: 1.8, unit: 'mm/jam' },
      { id: 'aws-k2', name: 'Suhu Udara', type: 'Thermometer', status: 'Aktif', value: 26.3, unit: '°C' },
    ],
  },
  {
    id: 'tapen',
    name: 'PLTA Tapen',
    shortName: 'Tapen',
    location: 'Banjarnegara, Jawa Tengah',
    province: 'Jawa Tengah',
    capacity: 2,
    ws: 'WS Serayu-Bogowonto',
    status: 'Aman',
    coordinates: [109.6890, -7.3920],
    historicalData: generateHistoricalData(285.12, 8.7, 7.9),
    liveData: {
      waterLevel: 285.12,
      targetLevel: 286.00,
      inflow: 8.7,
      outflow: 7.9,
      produksi: 1.4,
      elevasiSedimen: 278.30,
      volumeEfektif: 1.5,
      currentAvailableEnergy: 1.7,
      deltaHead: 18.3,
      roh: 1.6,
      evaReservoir: 82.1,
      lastUpdate: new Date().toISOString(),
    },
    connection: {
      status: 'Online',
      lastReceived: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    awlrStations: [
      { id: 'awlr-t1', name: 'Stasiun Tapen', elevation: 285.12, status: 'Aktif', lastUpdate: new Date().toISOString() },
    ],
    awsSensors: [
      { id: 'aws-t1', name: 'Curah Hujan', type: 'Rain Gauge', status: 'Aktif', value: 3.1, unit: 'mm/jam' },
      { id: 'aws-t2', name: 'Suhu Udara', type: 'Thermometer', status: 'Aktif', value: 27.1, unit: '°C' },
    ],
  },
  {
    id: 'garung',
    name: 'PLTA Garung',
    shortName: 'Garung',
    location: 'Wonosobo, Jawa Tengah',
    province: 'Jawa Tengah',
    capacity: 25,
    units: [
      { id: 1, capacity: 12.5 },
      { id: 2, capacity: 12.5 },
    ],
    ws: 'WS Serayu-Bogowonto',
    status: 'Aman',
    coordinates: [109.9218, -7.2108],
    historicalData: generateHistoricalData(1376.80, 18.4, 16.2),
    liveData: {
      waterLevel: 1376.80,
      targetLevel: 1378.00,
      inflow: 18.4,
      outflow: 16.2,
      produksi: 18.7,
      elevasiSedimen: 1368.50,
      volumeEfektif: 8.4,
      currentAvailableEnergy: 21.3,
      deltaHead: 32.7,
      roh: 20.1,
      evaReservoir: 80.5,
      lastUpdate: new Date().toISOString(),
    },
    connection: {
      status: 'Online',
      lastReceived: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    awlrStations: [
      { id: 'awlr-g1', name: 'Stasiun Garung', elevation: 1376.80, status: 'Aktif', lastUpdate: new Date().toISOString() },
      { id: 'awlr-g2', name: 'Stasiun Menjer', elevation: 1380.20, status: 'Aktif', lastUpdate: new Date().toISOString() },
    ],
    awsSensors: [
      { id: 'aws-g1', name: 'Curah Hujan', type: 'Rain Gauge', status: 'Aktif', value: 4.2, unit: 'mm/jam' },
      { id: 'aws-g2', name: 'Suhu Udara', type: 'Thermometer', status: 'Aktif', value: 22.1, unit: '°C' },
      { id: 'aws-g3', name: 'Kelembaban', type: 'Hygrometer', status: 'Aktif', value: 88, unit: '%' },
    ],
  },
  {
    id: 'wonogiri',
    name: 'PLTA Wonogiri',
    shortName: 'Wonogiri',
    location: 'Wonogiri, Jawa Tengah',
    province: 'Jawa Tengah',
    capacity: 12.4,
    waduk: 'Waduk Gajah Mungkur',
    ws: 'WS Bengawan Solo',
    status: 'Aman',
    coordinates: [110.9208, -7.8519],
    historicalData: generateHistoricalData(137.24, 142.3, 120.0),
    liveData: {
      waterLevel: 137.24,
      targetLevel: 138.00,
      inflow: 142.3,
      outflow: 120.0,
      produksi: 8.2,
      elevasiSedimen: 128.40,
      volumeEfektif: 220.5,
      currentAvailableEnergy: 10.1,
      deltaHead: 28.4,
      roh: 9.8,
      evaReservoir: 76.8,
      lastUpdate: new Date().toISOString(),
    },
    connection: {
      status: 'Online',
      lastReceived: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    awlrStations: [
      { id: 'awlr-w1', name: 'Stasiun Wonogiri', elevation: 137.24, status: 'Aktif', lastUpdate: new Date().toISOString() },
      { id: 'awlr-w2', name: 'Stasiun Bengawan Solo', elevation: 142.10, status: 'Aktif', lastUpdate: new Date().toISOString() },
    ],
    awsSensors: [
      { id: 'aws-w1', name: 'Curah Hujan', type: 'Rain Gauge', status: 'Aktif', value: 0.5, unit: 'mm/jam' },
      { id: 'aws-w2', name: 'Suhu Udara', type: 'Thermometer', status: 'Aktif', value: 30.2, unit: '°C' },
      { id: 'aws-w3', name: 'Kelembaban', type: 'Hygrometer', status: 'Offline', value: undefined, unit: '%' },
    ],
  },
];

export function getPLTAById(id: string): PLTAInfo | undefined {
  return pltaData.find((p) => p.id === id);
}

export function getPLTAStatusSummary(): Record<string, number> {
  const summary: Record<string, number> = { Aman: 0, 'Siaga 1': 0, 'Siaga 2': 0, Kritis: 0, Offline: 0 };
  pltaData.forEach((p) => { summary[p.status] = (summary[p.status] || 0) + 1; });
  return summary;
}
